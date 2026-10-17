import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateRoom,
  filterProperties,
  domiReply,
  escapeHTML,
  summarizeRooms,
} from "../src/domain.js";
test("room capacity prevents overselling and negative availability", () => {
  const room = {
    name: "A",
    type: "Solo room",
    price: 2500,
    capacity: 1,
    available: 1,
  };
  assert.equal(validateRoom(room), room);
  for (const available of [-1, 2, 0.5, NaN])
    assert.throws(() => validateRoom({ ...room, available }));
  assert.throws(() => validateRoom({ ...room, capacity: 0 }));
  assert.throws(() => validateRoom({ ...room, price: Infinity }));
});
test("combined filters enforce budget, type, vacancy, school and amenities", () => {
  const properties = [
    {
      title: "One",
      barangay: "Centro",
      school: "USL",
      address: "A",
      minPrice: 2000,
      roomTypes: ["Solo room"],
      available: 1,
      amenities: ["Wi-Fi"],
    },
    {
      title: "Two",
      barangay: "Centro",
      school: "USL",
      address: "B",
      minPrice: 5000,
      roomTypes: ["Studio"],
      available: 0,
      amenities: [],
    },
  ];
  assert.equal(
    filterProperties(properties, {
      q: "usl",
      budget: 3000,
      type: "Solo room",
      vacant: true,
      amenities: ["Wi-Fi"],
    }).length,
    1,
  );
  assert.equal(
    filterProperties(properties, { amenities: ["Kitchen"] }).length,
    0,
  );
});
test("DOMI never invents listings when none are loaded", () => {
  assert.match(domiReply("under 3000", []), /aren’t any loaded listings/);
  assert.match(domiReply("draft a message", []), /Could you confirm/);
});
test("DOMI handles peso budgets and respects reported vacancies", () => {
  const result = domiReply("under ₱3,000", [
    { title: "Full", minPrice: 1000, available: 0 },
    { title: "Available", minPrice: 2000, available: 1 },
  ]);
  assert.match(result, /Available/);
  assert.doesNotMatch(result, /Full/);
});
test("untrusted listing text is escaped", () =>
  assert.equal(
    escapeHTML('<img onerror="x">'),
    "&lt;img onerror=&quot;x&quot;&gt;",
  ));
test("room totals reflect actual inventory", () =>
  assert.deepEqual(
    summarizeRooms([
      { capacity: 3, available: 1, price: 2000, type: "Bedspace" },
      { capacity: 1, available: 0, price: 4000, type: "Solo room" },
    ]),
    {
      capacity: 4,
      available: 1,
      minPrice: 2000,
      roomTypes: ["Bedspace", "Solo room"],
    },
  ));
