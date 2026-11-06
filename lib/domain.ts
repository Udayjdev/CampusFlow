export type RoomQuery = {
  purpose: string;
  capacity: number;
  date: string;
  start: number;
  end: number;
  building?: string;
};
export const BRANCHES = ["CSE", "AI ML", "AI DS", "ECE", "ME", "IT"];
export const PURPOSES = [
  "Extra class",
  "Minor examination",
  "Practical session",
  "Event",
];
export type Room = {
  id: string;
  name: string;
  building: string;
  floor: number;
  type: string;
  capacity: number | null;
  uses: string[];
  features: string[];
  source: string;
  availability: string;
};
export type Booking = {
  id: string;
  roomId: string;
  title: string;
  date: string;
  start: number;
  end: number;
  purpose: string;
  capacity: number;
  branch: string;
  year: string;
  section: string;
  batch: string;
  owner: string;
  faculty: string;
  status: string;
  test: number;
  created: string;
};
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const clock = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
export const minutes = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
export const overlaps = (
  a: { start: number; end: number },
  b: { start: number; end: number },
) => a.start < b.end && a.end > b.start;
export const busy = (
  r: Room,
  date: string,
  start: number,
  end: number,
  bs: Booking[],
  exclude?: string,
) =>
  bs.filter(
    (b) =>
      b.id !== exclude &&
      b.roomId === r.id &&
      b.date === date &&
      b.status === "confirmed" &&
      overlaps(b, { start, end }),
  );
export const eligible = (r: Room, purpose: string, capacity: number) =>
  r.availability === "confirmed" &&
  r.capacity !== null &&
  r.capacity >= capacity &&
  r.uses.includes(purpose);
export function rankRooms(
  rs: Room[],
  bs: Booking[],
  q: RoomQuery,
  exclude?: string,
) {
  return rs
    .filter(
      (r) =>
        eligible(r, q.purpose, q.capacity) &&
        !busy(r, q.date, q.start, q.end, bs, exclude).length,
    )
    .map((r) => ({
      room: r,
      score:
        100 -
        (q.building && r.building !== q.building ? 15 : 0) -
        Math.min(25, Math.floor(((r.capacity || 0) - q.capacity) / 10)),
      reason: `${r.capacity} seats for ${q.capacity} people · ${!q.building || r.building === q.building ? "Preferred building" : "Other building, ~100 m away"} · No booking overlap`,
    }))
    .sort((a, b) => b.score - a.score);
}
export function seedRooms(): Room[] {
  const rs: Room[] = [];
  const add = (
    id: string,
    building: string,
    floor: number,
    type: string,
    capacity: number | null,
    uses: string[],
    source = "Problem statement",
    availability = "confirmed",
  ) =>
    rs.push({
      id,
      name: id,
      building,
      floor,
      type,
      capacity,
      uses,
      features: [],
      source,
      availability,
    });
  ["IET20", "IET18", "IET19", "IET17"].forEach((id) =>
    add(id, "IET", 1, "Classroom", 75, ["Extra class", "Minor examination"]),
  );
  ["IET24", "IET25", "IET29", "IET30", "IET28"].forEach((id) =>
    add(id, "IET", 2, "Classroom", null, ["Extra class", "Minor examination"]),
  );
  add("IET32", "IET", 2, "Seminar hall", 200, [
    "Extra class",
    "Minor examination",
    "Event",
  ]);
  add(
    "Library",
    "IET",
    0,
    "Library",
    150,
    ["Minor examination"],
    "Problem statement",
    "unverified",
  );
  ["CSE", "ME", "ECE", "IT"].forEach((t) =>
    add(
      `${t} Lab`,
      "IET",
      1,
      "Laboratory",
      null,
      ["Practical session"],
      "Problem statement",
      "unverified",
    ),
  );
  for (let n = 1; n <= 12; n++)
    add(
      `LH${String(n).padStart(2, "0")}`,
      "Deeksha Bhawan",
      Math.floor((n - 1) / 4),
      "Classroom",
      n <= 4 ? 80 : null,
      ["Extra class", "Minor examination"],
      n <= 4 ? "Demo configuration" : "Awaiting supplied data",
      n <= 4 ? "confirmed" : "unverified",
    );
  return rs;
}
