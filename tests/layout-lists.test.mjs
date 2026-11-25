import assert from "node:assert/strict";
import test from "node:test";

import * as admin from "../dist/admin.js";
import * as root from "../dist/index.js";
import * as types from "../dist/types.js";

const lengths = { LAYOUT_FLOORS: 19, LAYOUT_ROOM_STYLES: 51, LAYOUT_WALL_FINISHES: 9, LAYOUT_MODELS: 170 };

test("each layout list holds its names once, in snake_case, the same from every Admin entry point", () => {
  for (const [name, length] of Object.entries(lengths)) {
    const names = root[name];
    assert.equal(names.length, length, name);
    assert.equal(new Set(names).size, length, name);
    for (const value of names) assert.match(value, /^[a-z]+(_[a-z]+)*$/, `${name}: ${value}`);
    assert.deepEqual(admin[name], names, name);
    assert.deepEqual(types[name], names, name);
  }
  assert.equal(root.LAYOUT_FLOORS[0], "oak");
  assert.equal(root.LAYOUT_ROOM_STYLES[0], "plain");
  assert.equal(root.LAYOUT_WALL_FINISHES[0], "white");
  assert.equal(root.LAYOUT_MODELS[0], "box");
  assert.equal(root.LAYOUT_MODELS.includes("custom"), false);
  for (const style of ["kids_room", "waiting_room", "cafe", "commercial_kitchen", "lobby"]) {
    assert.ok(root.LAYOUT_ROOM_STYLES.includes(style), style);
  }
  for (const model of ["tv_stand", "iv_stand", "x_ray_machine", "mri_scanner", "pool", "defibrillator"]) {
    assert.ok(root.LAYOUT_MODELS.includes(model), model);
  }
});
