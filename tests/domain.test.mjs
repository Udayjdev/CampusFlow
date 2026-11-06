import test from "node:test";
import assert from "node:assert/strict";
import {
  overlaps,
  busy,
  eligible,
  rankRooms,
  seedRooms,
} from "../lib/domain.ts";
import { parseCSV } from "../lib/csv.ts";
const rooms = seedRooms(),
  b = {
    id: "one",
    roomId: "IET20",
    date: "2026-11-05",
    start: 600,
    end: 660,
    status: "confirmed",
  };
test("adjacent sessions are allowed; intersecting intervals overlap", () => {
  assert(!overlaps(b, { start: 660, end: 720 }));
  assert(overlaps(b, { start: 659, end: 720 }));
  assert(overlaps(b, { start: 610, end: 620 }));
});
test("unknown capacity and unverified labs never become recommendations", () => {
  assert(
    !eligible(
      rooms.find((r) => r.id === "CSE Lab"),
      "Practical session",
      1,
    ),
  );
  assert.equal(
    rankRooms(rooms, [], {
      date: b.date,
      start: 600,
      end: 660,
      capacity: 1,
      purpose: "Practical session",
    }).length,
    0,
  );
});
test("when IET is occupied, valid Deeksha rooms are suggested", () => {
  const occupied = rooms
    .filter((r) => r.building === "IET")
    .map((r, i) => ({ ...b, id: String(i), roomId: r.id }));
  const rs = rankRooms(rooms, occupied, {
    date: b.date,
    start: 600,
    end: 660,
    capacity: 70,
    purpose: "Extra class",
    building: "IET",
  });
  assert.equal(rs.length, 4);
  assert(rs.every((x) => x.room.building === "Deeksha Bhawan"));
});
test("capacity, purpose, cancellation and self exclusion are respected", () => {
  const r = rooms.find((r) => r.id === "IET20");
  assert(!eligible(r, "Event", 60));
  assert(!eligible(r, "Extra class", 76));
  assert.equal(busy(r, b.date, 600, 660, [b]).length, 1);
  assert.equal(
    busy(r, b.date, 600, 660, [{ ...b, status: "cancelled" }]).length,
    0,
  );
  assert.equal(busy(r, b.date, 600, 660, [b], "one").length, 0);
});
test("all required inventory is present, with unprovided capacities unknown", () => {
  assert.equal(rooms.length, 27);
  for (const id of [
    "IET20",
    "IET18",
    "IET19",
    "IET17",
    "IET24",
    "IET25",
    "IET29",
    "IET30",
    "IET28",
    "IET32",
    "LH01",
    "LH12",
  ])
    assert(rooms.some((r) => r.id === id));
  assert.equal(rooms.find((r) => r.id === "IET24").capacity, null);
});
test("CSV handles quotes, BOM, commas and newlines, rejecting malformed input", () => {
  const rs = parseCSV('\ufeffid,name\r\n1,"Doe, Jane"\r\n2,"A\nB"');
  assert.equal(rs[0].name, "Doe, Jane");
  assert.equal(rs[1].name, "A\nB");
  assert.throws(() => parseCSV("id,name\n1"), /columns/);
  assert.throws(() => parseCSV("id,id\n1,2"), /Duplicate/);
  assert.throws(() => parseCSV('id,name\n1,"x'), /Unclosed/);
});

test("CSV rejects trailing characters and empty headers", () => {
  assert.throws(() => parseCSV('id,name\n1,"Jane"extra'), /closing quote/);
  assert.throws(() => parseCSV("id,\n1,Jane"), /empty/);
  assert.throws(() => parseCSV("id,ID\n1,2"), /Duplicate/);
});

test("CSV supports escaped quotes, trailing cells and blank lines", () => {
  assert.deepEqual(parseCSV('id,name,note\n\n1,"Jane ""JJ""",\n'), [
    { id: "1", name: 'Jane "JJ"', note: "" },
  ]);
});

test("recommendations prefer the requested building and exclude conflicts", () => {
  const matches = rankRooms(rooms, [b], {
    date: b.date,
    start: 600,
    end: 660,
    capacity: 70,
    purpose: "Extra class",
    building: "IET",
  });
  assert.equal(matches[0].room.building, "IET");
  assert(!matches.some((match) => match.room.id === b.roomId));
  assert(matches.every((match) => match.room.capacity >= 70));
});
