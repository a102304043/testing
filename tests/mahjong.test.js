import assert from "node:assert/strict";
import { test } from "node:test";
import {
  tileTypes,
  drawTiles,
  calculateTenpaiWaits,
  buildSafetyMap,
} from "../mahjong.js";

test("drawTiles returns the requested count", () => {
  const tiles = drawTiles(13, () => 0.5);
  assert.equal(tiles.length, 13);
});

test("calculateTenpaiWaits identifies a simple single wait", () => {
  const hand = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "11",
    "11",
    "11",
    "12",
  ];
  const waits = calculateTenpaiWaits(hand, 13);
  assert.deepEqual(waits, ["2筒", "3筒"]);
});

test("buildSafetyMap marks genbutsu and revealed tiles", () => {
  const hand = ["01", "11", "12"];
  const discards = [["11"], ["12", "12"], []];
  const safetyMap = buildSafetyMap(hand, discards);
  assert.equal(safetyMap.get("11").level, "safe");
  assert.equal(safetyMap.get("12").level, "safe");
  assert.equal(safetyMap.get("01").level, "risk");
});

test("tileTypes has 34 unique tiles", () => {
  const ids = new Set(tileTypes.map((tile) => tile.id));
  assert.equal(ids.size, 34);
});
