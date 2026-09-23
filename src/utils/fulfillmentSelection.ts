import type { FulfillmentOrder, FulfillmentUnitSpan, OrderShipment, OrderShipmentLine } from "../types";
import type { UnitSpan } from "../types/orderContract";
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

export function selectShipmentUnits(
  work: FulfillmentOrder,
  lineId: string,
  quantity: number,
  shipments: OrderShipment[],
): OrderShipmentLine {
  if (work.method.type !== "delivery" || ["completed", "cancelled"].includes(work.status.type)) {
    throw new FulfillmentSelectionError("Select open delivery work.");
  }
  const line = work.lines.find((value) => value.id === lineId);
  if (!line || !Number.isInteger(quantity) || quantity < 1 || quantity > 4294967295) {
    throw new FulfillmentSelectionError("Select a valid assigned line and whole quantity.");
  }
  if (line.source.type !== "order_product" || !work.lines.every((candidate) =>
    candidate.source.type === "order_product"
      && candidate.source.order_id === line.source.order_id
      && candidate.source.order_delivery_group_id === line.source.order_delivery_group_id)) {
    throw new FulfillmentSelectionError("Work lines must share one accepted Order delivery group.");
  }
  const assigned = canonical(line.source.order_unit_spans);
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
  for (const shipment of shipments) {
    if (shipment.store_id !== work.store_id || shipment.order_id !== line.source.order_id) {
      throw new FulfillmentSelectionError("Shipment history belongs to another Order.");
    }
    if (shipment.fulfillment_order_id !== work.id || !shipment.dispatch) continue;
    for (const item of shipment.lines) {
      if (item.fulfillment_order_line_id !== line.id) continue;
      const units = canonical(item.unit_spans);
      if (count(units) === 0) {
        throw new FulfillmentSelectionError("Shipment history requires a nonempty work selection.");
      }
      dispatched.push(...units);
    }
  }
  const handedOver = checked(dispatched);
  if (count(handedOver) !== line.fulfilled_quantity || count(subtract(handedOver, active))) {
    throw new FulfillmentSelectionError("Load or refresh shipment history until all dispatched units are visible.");
  }
  const available = subtract(active, handedOver);
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
  return { fulfillment_order_line_id: line.id, unit_spans: selected };
}
