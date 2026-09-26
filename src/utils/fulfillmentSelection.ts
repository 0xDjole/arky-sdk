import type { FulfillmentOrder, FulfillmentOrderLine, FulfillmentUnitSpan, Shipment, ShipmentLine } from "../types";
import type { UnitSpan } from "../types/orderContract";
import type { Pickup, PickupLine } from "../types/pickup";
import { FulfillmentSelectionError } from "../types/fulfillmentSelection";

function checked(spans: UnitSpan[]): UnitSpan[] {
  if (spans.length > 1000) throw new FulfillmentSelectionError("Unit ranges exceed their supported bound.");
  const sorted = spans.map((span) => ({ ...span })).sort((a, b) => a.first_unit - b.first_unit);
  let end = 0;
  for (const span of sorted) {
    if (!Number.isInteger(span.first_unit) || span.first_unit < end || span.first_unit < 0
      || !Number.isInteger(span.quantity) || span.quantity <= 0
      || span.first_unit + span.quantity > 4294967295) {
      throw new FulfillmentSelectionError("Fulfillment contains invalid or overlapping unit ranges.");
    }
    end = span.first_unit + span.quantity;
  }
  return sorted;
}

function count(spans: UnitSpan[]): number {
  return spans.reduce((sum, span) => sum + span.quantity, 0);
}

function canonical(spans: UnitSpan[]): UnitSpan[] {
  const ranges = checked(spans);
  for (let index = 0; index < spans.length; index++) {
    if (ranges[index].first_unit !== spans[index].first_unit
      || (index > 0 && ranges[index - 1].first_unit + ranges[index - 1].quantity === ranges[index].first_unit)) {
      throw new FulfillmentSelectionError("Unit ranges must be sorted, disjoint and coalesced.");
    }
  }
  return ranges;
}

function orderUnits(assigned: UnitSpan[], positions: FulfillmentUnitSpan[]): UnitSpan[] {
  const local = canonical(positions);
  const last = local[local.length - 1];
  if (last && last.first_unit + last.quantity > count(assigned)) {
    throw new FulfillmentSelectionError("Work positions exceed their frozen assignment.");
  }
  const result: UnitSpan[] = [];
  let offset = 0;
  let index = 0;
  for (const order of assigned) {
    const end = offset + order.quantity;
    while (index < local.length && local[index].first_unit < end) {
      const selected = local[index];
      const stop = Math.min(end, selected.first_unit + selected.quantity);
      const start = Math.max(offset, selected.first_unit);
      if (start < stop) {
        const first_unit = order.first_unit + start - offset;
        const previous = result[result.length - 1];
        if (previous && previous.first_unit + previous.quantity === first_unit) {
          previous.quantity += stop - start;
        } else {
          if (result.length === 1000) throw new FulfillmentSelectionError("Mapped unit ranges exceed their supported bound.");
          result.push({ first_unit, quantity: stop - start });
        }
      }
      if (selected.first_unit + selected.quantity > end) break;
      index++;
    }
    offset = end;
  }
  return result;
}

function subtract(source: UnitSpan[], removed: UnitSpan[]): UnitSpan[] {
  const result: UnitSpan[] = [];
  let index = 0;
  for (const span of source) {
    let start = span.first_unit;
    const end = start + span.quantity;
    while (index < removed.length && removed[index].first_unit + removed[index].quantity <= start) index++;
    for (let next = index; next < removed.length && removed[next].first_unit < end; next++) {
      const cut = removed[next];
      if (cut.first_unit > start) result.push({ first_unit: start, quantity: cut.first_unit - start });
      start = Math.max(start, cut.first_unit + cut.quantity);
      if (start >= end) break;
    }
    if (start < end) result.push({ first_unit: start, quantity: end - start });
    if (result.length > 1000) throw new FulfillmentSelectionError("Remaining unit ranges exceed their supported bound.");
  }
  return result;
}

function combinedExclusions(first: UnitSpan[], second: UnitSpan[]): UnitSpan[] {
  const result: UnitSpan[] = [];
  for (const span of [...first, ...second].sort((a, b) => a.first_unit - b.first_unit)) {
    const previous = result[result.length - 1];
    if (previous && previous.first_unit + previous.quantity === span.first_unit) {
      previous.quantity += span.quantity;
    } else {
      result.push({ ...span });
    }
  }
  return result;
}

function assignedUnits(line: FulfillmentOrderLine): UnitSpan[] {
  switch (line.source.type) {
    case "order_product":
      return canonical(line.source.order_unit_spans);
    case "rental_issue":
      return canonical([{ first_unit: 0, quantity: line.quantity }]);
    default:
      throw new FulfillmentSelectionError("Work line has an unsupported source.");
  }
}

export function selectShipmentUnits(
  work: FulfillmentOrder,
  lineId: string,
  quantity: number,
  shipments: Shipment[],
): ShipmentLine {
  return selectFulfillmentUnits(work, lineId, quantity, shipments, "delivery");
}

export function selectPickupUnits(
  work: FulfillmentOrder,
  lineId: string,
  quantity: number,
  pickups: Pickup[],
): PickupLine {
  return selectFulfillmentUnits(work, lineId, quantity, pickups, "pickup");
}

function selectFulfillmentUnits(
  work: FulfillmentOrder,
  lineId: string,
  quantity: number,
  history: (Shipment | Pickup)[],
  method: "delivery" | "pickup",
): ShipmentLine {
  if (work.method.type !== method || ["completed", "cancelled"].includes(work.status.type)) {
    throw new FulfillmentSelectionError(`Select open ${method} work.`);
  }
  const line = work.lines.find((value) => value.id === lineId);
  if (!line || !Number.isInteger(quantity) || quantity < 1 || quantity > 4294967295) {
    throw new FulfillmentSelectionError("Select a valid assigned line and whole quantity.");
  }
  const sold = work.lines.flatMap((candidate) =>
    candidate.source.type === "order_product" ? [candidate.source] : []);
  if (sold.some((source) => source.order_id !== sold[0].order_id
      || source.order_delivery_group_id !== sold[0].order_delivery_group_id)) {
    throw new FulfillmentSelectionError("Work lines must share one accepted Order delivery group.");
  }
  const assigned = assignedUnits(line);
  const released = canonical(line.released_units);
  const cancelled = canonical(line.cancelled_units);
  orderUnits(assigned, released);
  orderUnits(assigned, cancelled);
  if (count(assigned) !== line.quantity || count(subtract(released, cancelled)) !== count(released)) {
    throw new FulfillmentSelectionError("Fulfillment ranges disagree with their assignment.");
  }
  const active = subtract([{ first_unit: 0, quantity: line.quantity }], combinedExclusions(released, cancelled));
  orderUnits(assigned, active);
  if (count(active) !== line.allocated_quantity) throw new FulfillmentSelectionError("Reload the changed fulfillment assignment.");
  const dispatched: FulfillmentUnitSpan[] = [];
  const prepared: FulfillmentUnitSpan[] = [];
  for (const shipment of history) {
    const isShipment = "dispatch" in shipment;
    if (isShipment !== (method === "delivery")) {
      throw new FulfillmentSelectionError("History does not match the selected delivery method.");
    }
    const execution = isShipment ? shipment.dispatch : shipment.collection;
    if (shipment.store_id !== work.store_id) {
      throw new FulfillmentSelectionError("Physical history belongs to another Store.");
    }
    if (shipment.fulfillment_order_id !== work.id) continue;
    if (!execution && shipment.status.type === "cancelled") continue;
    const preparing = isShipment ? ["pending", "label_created"] : ["preparing", "ready"];
    if (!execution && !preparing.includes(shipment.status.type)) {
      throw new FulfillmentSelectionError("Unexecuted shipment has inconsistent preparation status.");
    }
    for (const item of shipment.lines) {
      if (item.fulfillment_order_line_id !== line.id) continue;
      const units = canonical(item.unit_spans);
      if (count(units) === 0) {
        throw new FulfillmentSelectionError("Shipment history requires a nonempty work selection.");
      }
      (execution ? dispatched : prepared).push(...units);
    }
  }
  const handedOver = checked(dispatched);
  if (count(handedOver) !== line.fulfilled_quantity || count(subtract(handedOver, active))) {
    throw new FulfillmentSelectionError(method === "pickup"
      ? "Load or refresh pickup history until all collected units are visible."
      : "Load or refresh shipment history until all dispatched units are visible.");
  }
  const occupied = checked([...handedOver, ...prepared]);
  if (count(subtract(occupied, active))) {
    throw new FulfillmentSelectionError("Prepared shipment no longer fits the remaining assignment.");
  }
  const available = subtract(active, occupied);
  if (count(available) < quantity) throw new FulfillmentSelectionError("The selected quantity exceeds remaining assigned units.");
  const selected: FulfillmentUnitSpan[] = [];
  let remaining = quantity;
  for (const span of available) {
    const take = Math.min(remaining, span.quantity);
    if (take) selected.push({ first_unit: span.first_unit, quantity: take });
    remaining -= take;
    if (!remaining) break;
  }
  orderUnits(assigned, selected);
  return { fulfillment_order_line_id: line.id, unit_spans: selected, selected_units: [] };
}
