import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { Coordinates } from "./common";
import type { CategoryEntry } from "./content";

export interface LayoutPoint {
  x_cm: number;
  y_cm: number;
}

export interface LayoutPosition {
  x_cm: number;
  y_cm: number;
  z_cm: number;
  rotation_deg: number;
}

export interface LayoutCompositeEntry {
  layout_id: string;
  position: LayoutPosition;
}

export type LayoutType =
  | { type: "elements"; tenant_location_id: string }
  | { type: "composite"; layouts: LayoutCompositeEntry[] };

export type LayoutBackground =
  | { type: "image"; media_id: string; center: LayoutPoint; width_cm: number; rotation_deg: number }
  | { type: "map"; origin: Coordinates; rotation_deg: number };

export type LayoutStatus = { type: "active" } | { type: "deleting" };

export interface Layout {
  id: string;
  tenant_id: string;
  key: string;
  type: LayoutType;
  backgrounds: LayoutBackground[];
  blocks: Block[];
  status: LayoutStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export const LAYOUT_FLOORS = [
  "oak",
  "oak_dark",
  "walnut",
  "herringbone",
  "tile_white",
  "tile_grey",
  "tile_black",
  "marble",
  "stone",
  "concrete",
  "carpet_beige",
  "carpet_grey",
  "vinyl",
  "deck",
  "grass",
  "gravel",
  "asphalt",
  "sand",
  "water",
] as const;

export type LayoutFloor = (typeof LAYOUT_FLOORS)[number];

export const LAYOUT_ROOM_STYLES = [
  "plain",
  "bedroom",
  "kids_room",
  "nursery",
  "guest_room",
  "living_room",
  "dining_room",
  "kitchen",
  "bathroom",
  "toilet",
  "hallway",
  "entrance",
  "laundry",
  "closet",
  "garage",
  "balcony",
  "terrace",
  "garden",
  "pool",
  "office",
  "open_office",
  "meeting_room",
  "reception",
  "waiting_room",
  "break_room",
  "server_room",
  "storage",
  "workshop",
  "consultation_room",
  "exam_room",
  "treatment_room",
  "ward",
  "operating_room",
  "laboratory",
  "pharmacy",
  "dental_room",
  "shop",
  "showroom",
  "cafe",
  "restaurant",
  "bar",
  "commercial_kitchen",
  "fitting_room",
  "gym",
  "spa",
  "salon",
  "classroom",
  "library",
  "play_room",
  "hotel_room",
  "lobby",
] as const;

export type LayoutRoomStyle = (typeof LAYOUT_ROOM_STYLES)[number];

export const LAYOUT_WALL_FINISHES = [
  "white",
  "cream",
  "grey",
  "dark",
  "brick",
  "concrete",
  "wood",
  "tile",
  "glass",
] as const;

export type LayoutWallFinish = (typeof LAYOUT_WALL_FINISHES)[number];

export const LAYOUT_MODELS = [
  "box",
  "chair",
  "dining_chair",
  "office_chair",
  "armchair",
  "stool",
  "bar_stool",
  "bench",
  "sofa",
  "sofa_large",
  "sofa_corner",
  "pouf",
  "waiting_seats",
  "table",
  "dining_table",
  "round_table",
  "coffee_table",
  "side_table",
  "desk",
  "desk_corner",
  "meeting_table",
  "bar_table",
  "counter",
  "reception_desk",
  "workbench",
  "bed_single",
  "bed_double",
  "bed_king",
  "bunk_bed",
  "crib",
  "nightstand",
  "wardrobe",
  "dresser",
  "bookshelf",
  "shelf",
  "cabinet",
  "filing_cabinet",
  "locker",
  "tv_stand",
  "shoe_rack",
  "coat_rack",
  "safe",
  "kitchen_counter",
  "kitchen_island",
  "kitchen_sink",
  "stove",
  "oven",
  "range_hood",
  "fridge",
  "freezer",
  "dishwasher",
  "microwave",
  "coffee_machine",
  "water_cooler",
  "vending_machine",
  "toilet",
  "urinal",
  "washbasin",
  "bathtub",
  "shower",
  "bidet",
  "mirror",
  "towel_rack",
  "washing_machine",
  "dryer",
  "computer",
  "monitor",
  "laptop",
  "printer",
  "whiteboard",
  "projector",
  "projector_screen",
  "tv",
  "server_rack",
  "cash_register",
  "payment_terminal",
  "kiosk",
  "hospital_bed",
  "exam_table",
  "stretcher",
  "dental_chair",
  "massage_table",
  "medical_cart",
  "iv_stand",
  "wheelchair",
  "medicine_cabinet",
  "x_ray_machine",
  "mri_scanner",
  "ultrasound_machine",
  "privacy_screen",
  "operating_table",
  "shop_shelf",
  "display_case",
  "display_fridge",
  "clothes_rack",
  "mannequin",
  "shopping_cart",
  "checkout_counter",
  "produce_stand",
  "bar_counter",
  "booth_seat",
  "high_chair",
  "treadmill",
  "exercise_bike",
  "weight_bench",
  "yoga_mat",
  "sauna",
  "hot_tub",
  "pool",
  "sun_lounger",
  "weight_rack",
  "salon_chair",
  "tree",
  "bush",
  "hedge",
  "flower_bed",
  "planter_box",
  "fence",
  "gate",
  "park_bench",
  "picnic_table",
  "parasol",
  "grill",
  "fountain",
  "swing",
  "slide",
  "sandbox",
  "bike_rack",
  "trash_can",
  "recycling_bin",
  "mailbox",
  "sign",
  "car",
  "van",
  "truck",
  "bus",
  "ambulance",
  "motorcycle",
  "bicycle",
  "lamp_ceiling",
  "lamp_floor",
  "lamp_table",
  "lamp_wall",
  "spotlight",
  "chandelier",
  "street_lamp",
  "plant",
  "plant_large",
  "rug",
  "painting",
  "curtain",
  "clock",
  "vase",
  "fireplace",
  "aquarium",
  "piano",
  "pool_table",
  "stairs",
  "elevator",
  "escalator",
  "column",
  "ramp",
  "railing",
  "partition",
  "radiator",
  "fire_extinguisher",
  "first_aid_kit",
  "exit_sign",
  "security_camera",
  "defibrillator",
] as const;

export type LayoutModel = { type: (typeof LAYOUT_MODELS)[number] } | { type: "custom"; key: string };

export type LayoutWallOpening =
  | { type: "door"; center_cm: number; width_cm: number; height_cm: number }
  | { type: "window"; center_cm: number; sill_cm: number; width_cm: number; height_cm: number };

export type LayoutElementType =
  | {
      type: "room";
      corners: LayoutPoint[];
      height_cm: number;
      floor: LayoutFloor;
      style: LayoutRoomStyle;
      raised_cm: number;
    }
  | {
      type: "wall";
      from: LayoutPoint;
      to: LayoutPoint;
      thickness_cm: number;
      height_cm: number;
      openings: LayoutWallOpening[];
      finish: LayoutWallFinish;
    }
  | {
      type: "object";
      position: LayoutPosition;
      width_cm: number;
      depth_cm: number;
      height_cm: number;
      model: LayoutModel;
    };

export type LayoutElementLink = { type: "booking_resource"; booking_resource_id: string };

export interface LayoutElement {
  id: string;
  tenant_id: string;
  layout_id: string;
  key: string;
  blocks: Block[];
  categories: CategoryEntry[];
  type: LayoutElementType;
  links: LayoutElementLink[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindLayoutsParams {
  tenant_id: string;
  key?: string;
  tenant_location_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetLayoutParams {
  tenant_id: string;
  id: string;
}

export interface GetLayoutByKeyParams {
  tenant_id: string;
  key: string;
}

export interface CreateLayoutParams {
  tenant_id: string;
  id: string;
  key: string;
  type: LayoutType;
  backgrounds: LayoutBackground[];
  blocks: Block[];
}

export interface UpdateLayoutParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  type: LayoutType;
  backgrounds: LayoutBackground[];
  blocks: Block[];
}

export interface DeleteLayoutParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindLayoutElementsParams {
  tenant_id: string;
  layout_id: string;
  key?: string;
  limit?: number;
  cursor?: string | null;
}

export type LayoutElementChange =
  | {
      action: "create";
      id: string;
      key: string;
      blocks: Block[];
      categories: CategoryEntry[];
      type: LayoutElementType;
      links: LayoutElementLink[];
    }
  | {
      action: "update";
      id: string;
      expected_updated_at: EpochMilliseconds;
      key: string;
      blocks: Block[];
      categories: CategoryEntry[];
      type: LayoutElementType;
      links: LayoutElementLink[];
    }
  | { action: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface SaveLayoutElementsParams {
  tenant_id: string;
  layout_id: string;
  changes: LayoutElementChange[];
}

export interface SaveLayoutElementsResponse {
  items: LayoutElement[];
  deleted: string[];
}
