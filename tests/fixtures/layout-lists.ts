import { LAYOUT_FLOORS, LAYOUT_MODELS, LAYOUT_ROOM_STYLES, LAYOUT_WALL_FINISHES } from "arky-sdk/admin";
import type { LayoutElementType, LayoutFloor, LayoutModel, LayoutRoomStyle, LayoutWallFinish } from "arky-sdk";
import type { LayoutElementType as PublicLayoutElementType, LayoutModel as PublicLayoutModel } from "arky-sdk/types";

type AssertTrue<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Accepts<T, V> = V extends T ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Variant<T extends LayoutElementType["type"]> = Extract<LayoutElementType, { type: T }>;

export type LayoutListContracts = [
  AssertTrue<Equal<LayoutFloor, (typeof LAYOUT_FLOORS)[number]>>,
  AssertTrue<Equal<LayoutRoomStyle, (typeof LAYOUT_ROOM_STYLES)[number]>>,
  AssertTrue<Equal<LayoutWallFinish, (typeof LAYOUT_WALL_FINISHES)[number]>>,
  AssertTrue<Equal<LayoutModel, { type: (typeof LAYOUT_MODELS)[number] } | { type: "custom"; key: string }>>,
  AssertTrue<Equal<(typeof LAYOUT_FLOORS)["length"], 19>>,
  AssertTrue<Equal<(typeof LAYOUT_ROOM_STYLES)["length"], 51>>,
  AssertTrue<Equal<(typeof LAYOUT_WALL_FINISHES)["length"], 9>>,
  AssertTrue<Equal<(typeof LAYOUT_MODELS)["length"], 170>>,
  AssertTrue<Equal<Variant<"room">["floor"], LayoutFloor>>,
  AssertTrue<Equal<Variant<"room">["style"], LayoutRoomStyle>>,
  AssertTrue<Equal<Variant<"wall">["finish"], LayoutWallFinish>>,
  AssertTrue<Equal<Variant<"object">["model"], LayoutModel>>,
  AssertTrue<RequiredField<Variant<"room">, "floor">>,
  AssertTrue<RequiredField<Variant<"room">, "style">>,
  AssertTrue<RequiredField<Variant<"wall">, "finish">>,
  AssertTrue<RequiredField<Variant<"object">, "model">>,
  AssertTrue<RequiredField<Variant<"room">, "raised_cm">>,
  AssertTrue<Equal<Variant<"room">["raised_cm"], number>>,
  AssertTrue<Missing<Variant<"wall">, "raised_cm">>,
  AssertTrue<Missing<Variant<"room">, "z_cm">>,
  AssertTrue<Missing<Variant<"wall">, "z_cm">>,
  AssertTrue<Equal<Variant<"object">["position"]["z_cm"], number>>,
  AssertTrue<Accepts<LayoutFloor, "oak_dark">>,
  AssertTrue<Accepts<LayoutFloor, "wood"> extends false ? true : false>,
  AssertTrue<Accepts<LayoutRoomStyle, "waiting_room">>,
  AssertTrue<Accepts<LayoutRoomStyle, "dungeon"> extends false ? true : false>,
  AssertTrue<Accepts<LayoutWallFinish, "brick">>,
  AssertTrue<Accepts<LayoutWallFinish, "wallpaper"> extends false ? true : false>,
  AssertTrue<Accepts<LayoutModel, { type: "box" }>>,
  AssertTrue<Accepts<LayoutModel, { type: "x_ray_machine" }>>,
  AssertTrue<Accepts<LayoutModel, { type: "custom"; key: "dental-unit" }>>,
  AssertTrue<Accepts<LayoutModel, { type: "custom" }> extends false ? true : false>,
  AssertTrue<Accepts<LayoutModel, { type: "dental_unit" }> extends false ? true : false>,
  AssertTrue<PublicLayoutModel extends LayoutModel ? true : false>,
  AssertTrue<LayoutModel extends PublicLayoutModel ? true : false>,
  AssertTrue<PublicLayoutElementType extends LayoutElementType ? true : false>,
  AssertTrue<LayoutElementType extends PublicLayoutElementType ? true : false>,
];

export const waitingRoom: LayoutElementType = {
  type: "room",
  corners: [
    { x_cm: 0, y_cm: 0 },
    { x_cm: 500, y_cm: 0 },
    { x_cm: 500, y_cm: 400 },
  ],
  height_cm: 270,
  floor: "herringbone",
  style: "waiting_room",
  raised_cm: 45,
};
export const brickWall: LayoutElementType = {
  type: "wall",
  from: { x_cm: 0, y_cm: 0 },
  to: { x_cm: 500, y_cm: 0 },
  thickness_cm: 10,
  height_cm: 270,
  openings: [],
  finish: "brick",
};
export const dentalUnit: LayoutElementType = {
  type: "object",
  position: { x_cm: 250, y_cm: 200, z_cm: 0, rotation_deg: 0 },
  width_cm: 80,
  depth_cm: 180,
  height_cm: 120,
  model: { type: "custom", key: "dental-unit" },
};
export const palette: LayoutModel[] = LAYOUT_MODELS.map((type) => ({ type }));
