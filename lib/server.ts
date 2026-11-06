import { env } from "cloudflare:workers";
import {
  BRANCHES,
  PURPOSES,
  seedRooms,
  today,
  clock,
  eligible,
  busy,
  rankRooms,
} from "./domain";
const db = () => env.DB!;
const profiles: any = {
  faculty: { name: "Dr. Ananya Sharma", id: "demo-faculty" },
  student: { name: "Aarav Singh", id: "demo-student" },
  admin: { name: "Campus Administrator", id: "demo-admin" },
};
const uuid = () => crypto.randomUUID(),
  now = () => new Date().toISOString();
const snake = (s: string) => s.replace(/[A-Z]/g, (x) => "_" + x.toLowerCase());
const camel = (row: any): any =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, x) => x.toUpperCase()),
      v,
    ]),
  );
async function all(sql: string, args: any[] = []) {
  return (
    await db()
      .prepare(sql)
      .bind(...args)
      .all()
  ).results.map(camel);
}
async function one(sql: string, args: any[] = []) {
  return (await all(sql, args))[0];
}
function insert(table: string, row: any, ignore = false) {
  const cols = Object.keys(row);
  return db()
    .prepare(
      `INSERT ${ignore ? "OR IGNORE " : ""}INTO ${table} (${cols.map(snake).join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
    )
    .bind(...cols.map((k) => row[k]));
}
function update(table: string, row: any, id: string) {
  const cols = Object.keys(row);
  return db()
    .prepare(
      `UPDATE ${table} SET ${cols.map((k) => snake(k) + "=?").join(",")} WHERE id=?`,
    )
    .bind(...cols.map((k) => row[k]), id);
}
const log = (action: string, detail: string, actor: string) =>
  insert("audit", { id: uuid(), action, detail, actor, created: now() });
export class ApiError extends Error {
  status: number;
  extra: any;
  constructor(message: string, status = 400, extra: any = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
const need = (v: any, msg: string) => {
  if (!v) throw new ApiError(msg);
};
const str = (v: any, max = 160) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
function slot(b: any) {
  need(
    typeof b.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(b.date) &&
      !isNaN(Date.parse(b.date)) &&
      new Date(b.date).toISOString().slice(0, 10) === b.date &&
      b.date >= today(),
    "Choose today or a future date.",
  );
  need(
    Number.isInteger(b.start) &&
      Number.isInteger(b.end) &&
      b.start >= 480 &&
      b.end <= 1080 &&
      b.end > b.start &&
      b.end - b.start <= 480,
    "Choose a valid slot between 08:00 and 18:00 (maximum 8 hours).",
  );
  need(
    Number.isInteger(b.capacity) && b.capacity >= 1 && b.capacity <= 2000,
    "Capacity must be 1–2,000.",
  );
  need(PURPOSES.includes(b.purpose), "Choose a valid purpose.");
}
function audience(b: any) {
  need(b.branch === "All" || BRANCHES.includes(b.branch), "Invalid branch.");
  need(["All", "1", "2", "3", "4"].includes(b.year), "Invalid year.");
  need(["All", "A", "B"].includes(b.section), "Invalid section.");
  need(str(b.batch, 40), "Enter a batch or All.");
}
async function seed() {
  if (await one("SELECT * FROM settings WHERE key='seed-v1'")) return;
  const t = now(),
    d = today();
  const ops: any[] = seedRooms().map((r) =>
    insert(
      "rooms",
      { ...r, uses: JSON.stringify(r.uses), features: "[]" },
      true,
    ),
  );
  const bs = [
    ["IET20", "Data Structures & Algorithms", 540, 660, "CSE", "A"],
    ["IET18", "Introduction to Machine Learning", 600, 660, "AI ML", "A"],
    ["IET19", "Computer Networks", 660, 720, "IT", "All"],
    ["IET17", "Engineering Mathematics", 840, 900, "ECE", "All"],
    ["IET32", "Innovation & Ideas Meetup", 720, 840, "All", "All"],
    ["LH01", "Minor examination · CSE", 600, 720, "CSE", "B"],
  ];
  bs.forEach((b, i) =>
    ops.push(
      insert(
        "bookings",
        {
          id: "seed-b" + i,
          roomId: b[0],
          title: b[1],
          date: d,
          start: b[2],
          end: b[3],
          purpose:
            b[0] === "IET32"
              ? "Event"
              : b[0] === "LH01"
                ? "Minor examination"
                : "Extra class",
          capacity: b[0] === "IET32" ? 120 : 60,
          branch: b[4],
          year: "2",
          section: b[5],
          batch: "2025–2029",
          owner: "demo-faculty",
          faculty: profiles.faculty.name,
          status: "confirmed",
          test: 1,
          created: t,
        },
        true,
      ),
    ),
  );
  ops.push(
    insert(
      "notices",
      {
        id: "seed-n1",
        title: "Minor examinations: check your room",
        body: "Demo notice: CSE Section B is scheduled in LH01, Deeksha Bhawan, from 10:00 to 12:00. Check your schedule before leaving.",
        kind: "Examination",
        branch: "CSE",
        year: "2",
        section: "B",
        batch: "All",
        created: t,
        author: profiles.admin.name,
        test: 1,
      },
      true,
    ),
  );
  ops.push(
    insert(
      "notices",
      {
        id: "seed-n2",
        title: "One campus. One shared schedule.",
        body: "Faculty can reserve rooms. Students can flag outdated information. All current bookings are demonstration data.",
        kind: "Announcement",
        branch: "All",
        year: "All",
        section: "All",
        batch: "All",
        created: t,
        author: profiles.admin.name,
        test: 1,
      },
      true,
    ),
  );
  BRANCHES.forEach((b, i) =>
    ops.push(
      insert(
        "students",
        {
          id: "DEMO-00" + (i + 1),
          name: [
            "Aarav Singh",
            "Ishita Verma",
            "Rohan Gupta",
            "Sana Khan",
            "Arjun Patel",
            "Meera Joshi",
          ][i],
          branch: b,
          year: "2",
          section: i < 2 ? "A" : "All",
          batch: "2025–2029",
          source: "Demo data",
        },
        true,
      ),
    ),
  );
  ops.push(
    insert(
      "audit",
      {
        id: "seed-audit",
        action: "Prototype initialized",
        detail:
          "27 rooms across IET and Deeksha Bhawan. Actual supplied blueprints and datasets are pending. Seeded data is for demonstration.",
        actor: "CampusFlow",
        created: t,
      },
      true,
    ),
    insert("settings", { key: "seed-v1", value: t }, true),
  );
  await db().batch(ops);
}
async function getSession(req: Request) {
  const token = req.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)campus_session=([^;]+)/)?.[1];
  if (token) {
    const row = await one(
      "SELECT * FROM sessions WHERE token=? AND expires>?",
      [token, Date.now()],
    );
    if (row && profiles[row.role])
      return { role: row.role, ...profiles[row.role], cookie: "" };
  }
  const t = uuid() + uuid();
  await insert("sessions", {
    token: t,
    role: "faculty",
    expires: Date.now() + 86400000,
  }).run();
  return { role: "faculty", ...profiles.faculty, cookie: cookie(t, req) };
}
const cookie = (t: string, r: Request) =>
  `campus_session=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${new URL(r.url).protocol === "https:" ? "; Secure" : ""}`;
async function state(u: any) {
  const [rooms, bookings, notices, reports, audit, blueprints, students] =
    await Promise.all([
      all("SELECT * FROM rooms"),
      all("SELECT * FROM bookings ORDER BY date,start"),
      all("SELECT * FROM notices ORDER BY created DESC"),
      all("SELECT * FROM reports ORDER BY created DESC"),
      u.role === "student"
        ? Promise.resolve([])
        : all("SELECT * FROM audit ORDER BY created DESC LIMIT 200"),
      all("SELECT * FROM blueprints"),
      u.role === "admin" ? all("SELECT * FROM students") : Promise.resolve([]),
    ]);
  return {
    rooms: rooms.map((r) => ({
      ...r,
      uses: JSON.parse(r.uses),
      features: JSON.parse(r.features),
    })),
    bookings,
    notices,
    reports,
    audit,
    blueprints,
    students,
    user: { role: u.role, name: u.name, id: u.id },
    serverTime: now(),
  };
}
export async function handle(request: Request) {
  await seed();
  const u = await getSession(request),
    path = new URL(request.url).pathname.replace(/^\/api\//, "");
  const json = (x: any, status = 200) =>
    Response.json(x, {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(u.cookie ? { "Set-Cookie": u.cookie } : {}),
      },
    });
  if (request.method === "GET") {
    if (path === "state") return json(await state(u));
    if (path.startsWith("blueprint/")) {
      const row = await one("SELECT * FROM blueprints WHERE id=?", [
        path.split("/")[1],
      ]);
      if (!row) throw new ApiError("Blueprint not found.", 404);
      const file = await env.BUCKET!.get(row.key);
      if (!file) throw new ApiError("File not found.", 404);
      return new Response(file.body, {
        headers: {
          "Content-Type": row.mime,
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, max-age=60",
        },
      });
    }
    throw new ApiError("Not found.", 404);
  }
  need(request.method === "POST", "Unsupported method.");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new ApiError("Cross-site requests are not allowed.", 403);
  if (path === "blueprint") {
    if (u.role !== "admin")
      throw new ApiError("Only administrators can upload blueprints.", 403);
    need(request.headers.get("x-campusflow") === "1", "Invalid upload.");
    const form = await request.formData(),
      f = form.get("file") as File,
      building = String(form.get("building")),
      floor = Number(form.get("floor"));
    need(
      ["IET", "Deeksha Bhawan"].includes(building) && [0, 1, 2].includes(floor),
      "Choose a building and floor.",
    );
    need(
      f &&
        f.size > 0 &&
        f.size <= 10485760 &&
        ["application/pdf", "image/png", "image/jpeg"].includes(f.type),
      "Upload PDF, PNG or JPEG up to 10 MB.",
    );
    const bytes = await f.arrayBuffer(),
      sig = new Uint8Array(bytes);
    need(
      (f.type === "application/pdf" &&
        new TextDecoder().decode(sig.slice(0, 5)) === "%PDF-") ||
        (f.type === "image/png" &&
          sig[0] === 137 &&
          sig[1] === 80 &&
          sig[2] === 78 &&
          sig[3] === 71) ||
        (f.type === "image/jpeg" && sig[0] === 255 && sig[1] === 216),
      "The file does not match its declared type.",
    );
    const id = uuid(),
      key = "blueprints/" + id;
    await env.BUCKET!.put(key, bytes, {
      httpMetadata: { contentType: f.type },
    });
    await db().batch([
      insert("blueprints", {
        id,
        building,
        floor,
        name: f.name.slice(0, 140),
        key,
        mime: f.type,
        uploaded: now(),
      }),
      log(
        "Blueprint uploaded",
        `${building} / Floor ${floor}: ${f.name.slice(0, 140)}`,
        u.name,
      ),
    ]);
    return json({ ok: true });
  }
  need(
    request.headers.get("content-type")?.includes("application/json"),
    "JSON is required.",
  );
  const raw = await request.text();
  need(raw.length <= 1200000, "Request too large.");
  let b: any;
  try {
    b = JSON.parse(raw);
  } catch {
    throw new ApiError("Invalid JSON.");
  }
  need(
    b !== null && typeof b === "object" && !Array.isArray(b),
    "JSON body must be an object.",
  );
  if (path === "session") {
    need(
      typeof b.role === "string" && Object.hasOwn(profiles, b.role),
      "Choose a valid demo role.",
    );
    const t = uuid() + uuid();
    await insert("sessions", {
      token: t,
      role: b.role,
      expires: Date.now() + 86400000,
    }).run();
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": cookie(t, request),
          "Cache-Control": "no-store",
        },
      },
    );
  }
  if (path === "recommend") {
    slot(b);
    const d: any = await state(u),
      matches = rankRooms(d.rooms, d.bookings, b).slice(0, 5),
      later = [];
    for (
      let start = b.start + 30;
      start + b.end - b.start <= 1080 && later.length < 3;
      start += 30
    ) {
      const end = start + b.end - b.start;
      const rr = rankRooms(d.rooms, d.bookings, { ...b, start, end });
      if (rr.length) later.push({ ...rr[0], start, end });
    }
    return json({ matches, later, checkedAt: now() });
  }
  if (path === "book" || path === "reschedule") {
    if (u.role === "student")
      throw new ApiError(
        "Students can report issues, but cannot modify bookings.",
        403,
      );
    slot(b);
    audience(b);
    need(str(b.title, 120), "Enter a title (1–120 characters).");
    const d: any = await state(u),
      r = d.rooms.find((r: any) => r.id === b.roomId);
    need(
      r && eligible(r, b.purpose, b.capacity),
      "This room does not meet capacity, permitted use or confirmed availability requirements.",
    );
    let old: any = null;
    if (path === "reschedule") {
      old = await one("SELECT * FROM bookings WHERE id=?", [b.id]);
      need(old && old.status === "confirmed", "Booking is not active.");
      if (old.owner !== u.id && u.role !== "admin")
        throw new ApiError(
          "Only the owner or an administrator can reschedule.",
          403,
        );
    }
    if (busy(r, b.date, b.start, b.end, d.bookings, old?.id).length)
      throw new ApiError(
        "That room is already booked for this time. Choose an alternative below.",
        409,
        {
          alternatives: rankRooms(
            d.rooms,
            d.bookings,
            { ...b, building: r.building },
            old?.id,
          ).slice(0, 4),
        },
      );
    const id = old?.id || uuid(),
      record = {
        roomId: b.roomId,
        title: b.title.trim(),
        date: b.date,
        start: b.start,
        end: b.end,
        purpose: b.purpose,
        capacity: b.capacity,
        branch: b.branch,
        year: b.year,
        section: b.section,
        batch: b.batch,
      };
    const ops = [
      old
        ? update("bookings", record, id)
        : insert("bookings", {
            id,
            ...record,
            owner: u.id,
            faculty: u.name,
            status: "confirmed",
            test: 1,
            created: now(),
          }),
      log(
        old ? "Booking rescheduled" : "Room booked",
        `${b.title} · ${b.roomId} · ${b.date} · ${clock(b.start)}–${clock(b.end)}${old ? ` · Previous: ${old.roomId}, ${old.date}, ${clock(old.start)}–${clock(old.end)}` : ""}`,
        u.name,
      ),
    ];
    if (old)
      ops.push(
        insert("notices", {
          id: uuid(),
          title: "Rescheduled: " + b.title,
          body: `Updated: ${b.roomId}, ${b.date}, ${clock(b.start)}–${clock(b.end)} IST. Previously ${old.roomId}, ${old.date}, ${clock(old.start)}–${clock(old.end)}.`,
          kind: "Rescheduled",
          branch: b.branch,
          year: b.year,
          section: b.section,
          batch: b.batch,
          created: now(),
          author: u.name,
          test: 1,
        }),
      );
    try {
      await db().batch(ops);
    } catch (e: any) {
      if ([e.message, e.cause?.message].join(" ").includes("booking_overlap"))
        throw new ApiError(
          "Another booking was confirmed for this slot. Refresh and select another room.",
          409,
          { alternatives: [] },
        );
      throw e;
    }
    return json({ ok: true, id }, 201);
  }
  if (path === "cancel") {
    if (u.role === "student")
      throw new ApiError("Students cannot cancel bookings.", 403);
    const old = await one("SELECT * FROM bookings WHERE id=?", [b.id]);
    need(old && old.status === "confirmed", "Booking is not active.");
    if (old.owner !== u.id && u.role !== "admin")
      throw new ApiError("Only the owner or an administrator can cancel.", 403);
    need(str(b.reason, 500), "Please give a cancellation reason.");
    await db().batch([
      update("bookings", { status: "cancelled" }, b.id),
      insert("notices", {
        id: uuid(),
        title: "Cancelled: " + old.title,
        body: `${old.roomId} · ${old.date}, ${clock(old.start)}. Reason: ${b.reason}`,
        kind: "Cancelled",
        branch: old.branch,
        year: old.year,
        section: old.section,
        batch: old.batch,
        created: now(),
        author: u.name,
        test: 1,
      }),
      log("Booking cancelled", `${old.title}: ${b.reason}`, u.name),
    ]);
    return json({ ok: true });
  }
  if (path === "notice") {
    if (u.role === "student")
      throw new ApiError("Students cannot publish official notices.", 403);
    audience(b);
    need(
      str(b.title, 120) &&
        str(b.body, 2000) &&
        ["Announcement", "Examination", "Rescheduled", "Cancelled"].includes(
          b.kind,
        ),
      "Enter a valid notice.",
    );
    await db().batch([
      insert("notices", {
        id: uuid(),
        title: b.title.trim(),
        body: b.body.trim(),
        kind: b.kind,
        branch: b.branch,
        year: b.year,
        section: b.section,
        batch: b.batch,
        created: now(),
        author: u.name,
        test: 1,
      }),
      log("Notice published", b.title, u.name),
    ]);
    return json({ ok: true });
  }
  if (path === "report") {
    need(str(b.message, 1500), "Write a message up to 1,500 characters.");
    if (b.bookingId)
      need(
        await one("SELECT id FROM bookings WHERE id=?", [b.bookingId]),
        "Session not found.",
      );
    await db().batch([
      insert("reports", {
        id: uuid(),
        bookingId: b.bookingId || null,
        message: b.message.trim(),
        author: u.name,
        status: "open",
        created: now(),
      }),
      log("Schedule issue reported", b.message.slice(0, 120), u.name),
    ]);
    return json({ ok: true });
  }
  if (u.role !== "admin")
    throw new ApiError(
      "This action requires the administrator demo role.",
      403,
    );
  if (path === "resolve") {
    need(
      await one("SELECT id FROM reports WHERE id=?", [b.id]),
      "Report not found.",
    );
    await db().batch([
      update("reports", { status: "resolved" }, b.id),
      log("Report resolved", b.id, u.name),
    ]);
    return json({ ok: true });
  }
  if (path === "room") {
    need(
      await one("SELECT id FROM rooms WHERE id=?", [b.id]),
      "Room not found.",
    );
    checkRoom(b);
    const active = await all(
      "SELECT * FROM bookings WHERE room_id=? AND status='confirmed' AND date>=?",
      [b.id, today()],
    );
    need(
      !active.some(
        (x) =>
          b.capacity === null ||
          x.capacity > b.capacity ||
          !b.uses.includes(x.purpose) ||
          b.availability !== "confirmed",
      ),
      "This would invalidate an active booking. Reschedule or cancel it first.",
    );
    need(str(b.source, 120), "Enter the source of this information.");
    await db().batch([
      update(
        "rooms",
        {
          capacity: b.capacity,
          uses: JSON.stringify(b.uses),
          availability: b.availability,
          source: b.source,
        },
        b.id,
      ),
      log(
        "Room configuration updated",
        `${b.id}: ${b.capacity ?? "unknown"} seats, ${b.availability}. Source: ${b.source}`,
        u.name,
      ),
    ]);
    return json({ ok: true });
  }
  if (path === "import") {
    need(
      ["students", "rooms"].includes(b.kind) &&
        Array.isArray(b.rows) &&
        b.rows.length > 0 &&
        b.rows.length <= 500,
      "Import 1–500 rows at a time.",
    );
    const ids = new Set(),
      ops: any[] = [],
      existing = await all("SELECT * FROM rooms"),
      active = await all(
        "SELECT * FROM bookings WHERE status='confirmed' AND date>=?",
        [today()],
      );
    for (const [i, r] of b.rows.entries()) {
      need(
        r !== null && typeof r === "object" && !Array.isArray(r),
        `Row ${i + 1}: expected an object.`,
      );
      need(
        str(r.id, 60) && !ids.has(r.id),
        `Row ${i + 1}: missing or duplicate ID.`,
      );
      ids.add(r.id);
      if (b.kind === "students") {
        need(
          str(r.name, 120) &&
            BRANCHES.includes(r.branch) &&
            ["1", "2", "3", "4"].includes(String(r.year)) &&
            ["All", "A", "B"].includes(r.section) &&
            str(r.batch, 40),
          `Row ${i + 1}: invalid student mapping.`,
        );
        ops.push(
          db()
            .prepare(
              "INSERT INTO students (id,name,branch,year,section,batch,source) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,branch=excluded.branch,year=excluded.year,section=excluded.section,batch=excluded.batch,source=excluded.source",
            )
            .bind(
              r.id,
              r.name,
              r.branch,
              String(r.year),
              r.section,
              r.batch,
              "Imported dataset",
            ),
        );
      } else {
        need(
          existing.some((x) => x.id === r.id),
          `Unknown room ${r.id}. Use the room template.`,
        );
        need(
          ["IET", "Deeksha Bhawan"].includes(r.building) &&
            [0, 1, 2].includes(Number(r.floor)),
          `Row ${i + 1}: invalid building or floor.`,
        );
        const capacity =
            r.capacity === "" || r.capacity === null
              ? null
              : Number(r.capacity),
          uses = String(r.uses)
            .split("|")
            .map((x) => x.trim());
        checkRoom({ ...r, capacity, uses });
        need(
          !active.some(
            (x) =>
              x.roomId === r.id &&
              (capacity === null ||
                x.capacity > capacity ||
                !uses.includes(x.purpose) ||
                r.availability !== "confirmed"),
          ),
          `Row ${i + 1}: would invalidate an active booking.`,
        );
        ops.push(
          update(
            "rooms",
            {
              building: r.building,
              floor: Number(r.floor),
              capacity,
              uses: JSON.stringify(uses),
              availability: r.availability,
              source: "Imported dataset",
            },
            r.id,
          ),
        );
      }
    }
    ops.push(
      log(
        "Dataset imported",
        `${b.rows.length} ${b.kind} records validated and imported.`,
        u.name,
      ),
    );
    await db().batch(ops);
    return json({ ok: true, count: b.rows.length });
  }
  throw new ApiError("Action not found.", 404);
}
function checkRoom(b: any) {
  need(
    b.capacity === null ||
      (Number.isInteger(b.capacity) && b.capacity > 0 && b.capacity <= 2000),
    "Capacity must be 1–2,000 or unknown.",
  );
  need(
    Array.isArray(b.uses) &&
      b.uses.length > 0 &&
      b.uses.every((x: string) => PURPOSES.includes(x)),
    "Select valid permitted uses.",
  );
  need(
    ["confirmed", "unverified", "maintenance"].includes(b.availability),
    "Invalid availability.",
  );
}
