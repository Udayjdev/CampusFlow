"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Database,
  DoorOpen,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  GraduationCap,
  History,
  Info,
  Layers,
  LayoutDashboard,
  Map,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Users,
  X,
  AlertTriangle,
  Send,
} from "lucide-react";
import {
  BRANCHES,
  PURPOSES,
  today,
  clock,
  minutes,
  busy,
  eligible,
  rankRooms,
  type Room,
  type Booking,
} from "../lib/domain";
import { parseCSV } from "../lib/csv";
const initial = () => ({
  building: "All buildings",
  floor: "All floors",
  room: "",
  date: today(),
  start: 600,
  duration: 60,
  capacity: 60,
  purpose: "Extra class",
});
const group = { branch: "All", year: "All", section: "All", batch: "All" };
const floorName = (n: number) =>
  ["Ground floor", "First floor", "Second floor"][n];
const dateLabel = (s: string, short = false) =>
  new Date(s + "T12:00:00").toLocaleDateString(
    "en-IN",
    short
      ? { day: "numeric", month: "short" }
      : { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );
const csv = (r: any[][]) =>
  r
    .map((row) =>
      row.map((x) => '"' + String(x ?? "").replace(/"/g, '""') + '"').join(","),
    )
    .join("\n");
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function api(path: string, b?: any) {
  const r = await fetch("/api/" + path, {
    method: b ? "POST" : "GET",
    headers: b ? { "Content-Type": "application/json" } : {},
    body: b ? JSON.stringify(b) : undefined,
  });
  const d: any = await r.json();
  if (!r.ok) throw Object.assign(new Error(d.error || "Please try again."), d);
  return d;
}
const Tag = ({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: string;
}) => <span className={"tag " + color}>{children}</span>;
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="field">
    <span>{label}</span>
    {children}
  </label>
);
const Empty = ({
  title,
  body,
  icon: Icon = Search,
}: {
  title: string;
  body: string;
  icon?: any;
}) => (
  <div className="empty">
    <Icon size={30} />
    <h3>{title}</h3>
    <p>{body}</p>
  </div>
);
function Modal({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    ref.current?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            "button,input,select,textarea,a[href]",
          ) || [],
        ).filter((x) => !x.hasAttribute("disabled"));
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
          e.preventDefault();
          els[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", fn);
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = old;
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <div className="modal-head">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Plan({
  rooms,
  bookings,
  q,
  building,
  floor,
  onRoom,
}: {
  rooms: Room[];
  bookings: Booking[];
  q: any;
  building: string;
  floor: number;
  onRoom: (r: Room) => void;
}) {
  const rs = rooms.filter((r) => r.building === building && r.floor === floor);
  return (
    <div className="plan">
      <span className="north">
        N <Compass size={18} />
      </span>
      <svg
        viewBox="0 0 700 320"
        aria-label={`Illustrative ${building} ${floorName(floor)} floor plan`}
      >
        <defs>
          <pattern
            id="dots"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".7" fill="#d7dfd1" />
          </pattern>
          <pattern
            id="hatch"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="7"
              stroke="#e0e6dc"
              strokeWidth="2"
            />
          </pattern>
        </defs>
        <rect width="700" height="320" fill="url(#dots)" />
        <rect
          x="35"
          y="35"
          width="630"
          height="245"
          fill="white"
          stroke="#cdd9c7"
          strokeWidth="3"
        />
        <rect x="46" y="141" width="608" height="33" fill="#f2f5ee" />
        <text
          x="350"
          y="162"
          textAnchor="middle"
          fontSize="10"
          letterSpacing="4"
          fill="#95a08c"
        >
          CORRIDOR
        </text>
        {rs.map((r, i) => {
          const x = 48 + (i % 4) * 152,
            y = 48 + Math.floor(i / 4) * 137,
            unknown = r.capacity === null || r.availability !== "confirmed",
            taken =
              busy(r, q.date, q.start, q.start + q.duration, bookings).length >
              0,
            color = unknown ? "#cdd6c7" : taken ? "#dfb594" : "#a7c5a7";
          return (
            <g
              className="map-room"
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={`${r.id}, ${unknown ? "unverified" : taken ? "booked" : "available"}`}
              onClick={() => onRoom(r)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRoom(r);
                }
              }}
            >
              <rect
                x={x}
                y={y}
                width="141"
                height="82"
                rx="3"
                fill={unknown ? "url(#hatch)" : taken ? "#fff0e4" : "#eaf3e7"}
                stroke={color}
                strokeWidth="1.5"
              />
              <text
                x={x + 70}
                y={y + 32}
                textAnchor="middle"
                fill="#40553c"
                fontWeight="650"
                fontSize="15"
              >
                {r.id}
              </text>
              <text
                x={x + 70}
                y={y + 54}
                textAnchor="middle"
                fill={unknown ? "#8c9a81" : taken ? "#ab784e" : "#62815a"}
                fontSize="11"
              >
                {unknown
                  ? "Needs verification"
                  : taken
                    ? "In use"
                    : `${r.capacity} seats · Available`}
              </text>
              <path
                d={`M${x + 55} ${y + 82}h30`}
                stroke="white"
                strokeWidth="4"
              />
              <path
                d={`M${x + 55} ${y + 82}v-19q19 0 19 19`}
                fill="none"
                stroke={color}
              />
            </g>
          );
        })}
        {rs.length <= 4 && (
          <>
            <rect
              x="48"
              y="185"
              width="600"
              height="82"
              fill="#f4f6ef"
              stroke="#d9e1d2"
              strokeDasharray="5 4"
            />
            <text
              x="350"
              y="226"
              textAnchor="middle"
              fontSize="12"
              fill="#8b9d80"
            >
              {building === "IET" && floor === 0
                ? "Faculty cabins · Director’s office · Administration · Placement Cell"
                : "Shared campus spaces · Access & circulation"}
            </text>
            <text
              x="350"
              y="246"
              textAnchor="middle"
              fontSize="10"
              fill="#9eae92"
            >
              Illustrative arrangement
            </text>
          </>
        )}
        <text x="350" y="303" textAnchor="middle" fontSize="10" fill="#98a88b">
          ↑ ENTRANCE
        </text>
      </svg>
      <div className="plan-caption">
        ILLUSTRATIVE PLAN · OFFICIAL BLUEPRINT PENDING
      </div>
    </div>
  );
}
export default function CampusFlow() {
  const [data, setData] = useState<any>(null),
    [loadError, setLoadError] = useState(""),
    [page, setPage] = useState("Overview"),
    [q, setQ] = useState(initial),
    [advanced, setAdvanced] = useState(false),
    [building, setBuilding] = useState("IET"),
    [floor, setFloor] = useState(1),
    [modal, setModal] = useState<any>(null),
    [form, setForm] = useState<any>({}),
    [file, setFile] = useState<any>(null),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [alternatives, setAlternatives] = useState<any[]>([]),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [date, setDate] = useState(today),
    [cohort, setCohort] = useState(group),
    [kind, setKind] = useState("All"),
    [assistant, setAssistant] = useState(""),
    [recs, setRecs] = useState<any>(null),
    [tour, setTour] = useState(0);
  const reload = useCallback(async () => {
    try {
      const d = await api("state");
      setData(d);
      setLoadError("");
      return d;
    } catch (e: any) {
      setLoadError(e.message);
    }
  }, []);
  useEffect(() => {
    reload();
    const timer = setInterval(reload, 30000);
    return () => clearInterval(timer);
  }, [reload]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const go = (p: string) => {
    setPage(p);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const open = (m: any, f: any = {}) => {
    setModal(m);
    setForm(f);
    setFile(null);
    setError("");
    setAlternatives([]);
  };
  const close = () => setModal(null);
  const mf = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const change = (k: string, v: any) => setQ((x) => ({ ...x, [k]: v }));
  const mutate = async (path: string, b: any, msg: string) => {
    setSaving(true);
    setError("");
    try {
      await api(path, b);
      await reload();
      close();
      setToast(msg);
      return true;
    } catch (e: any) {
      setError(e.message);
      setAlternatives(e.alternatives || []);
      return false;
    } finally {
      setSaving(false);
    }
  };
  const user = data?.user || {
      role: "faculty",
      name: "Dr. Ananya Sharma",
      id: "demo-faculty",
    },
    rooms: Room[] = data?.rooms || [],
    bookings: Booking[] = data?.bookings || [],
    end = q.start + q.duration,
    ranked = rankRooms(rooms, bookings, {
      ...q,
      end,
      building: q.building === "All buildings" ? undefined : q.building,
    });
  const status = (r: Room) =>
    r.availability === "maintenance"
      ? "Maintenance"
      : r.availability !== "confirmed" || r.capacity === null
        ? "Unverified"
        : busy(r, q.date, q.start, end, bookings).length
          ? "Booked"
          : "Available";
  const filtered = rooms.filter(
    (r) =>
      (q.building === "All buildings" || r.building === q.building) &&
      (q.floor === "All floors" || r.floor === Number(q.floor)) &&
      (!q.room || r.id.toLowerCase().includes(q.room.toLowerCase())) &&
      r.uses.includes(q.purpose) &&
      (r.capacity === null || r.capacity >= q.capacity),
  );
  const match = (b: any) =>
    Object.entries(cohort).every(
      ([k, v]) => v === "All" || b[k] === "All" || b[k] === v,
    );
  const todays = bookings.filter(
    (b) => b.date === today() && b.status === "confirmed",
  );
  const book = (r?: Room, b?: Booking) =>
    open(
      { type: "book", booking: b },
      {
        title: b?.title || "",
        roomId: b?.roomId || r?.id || ranked[0]?.room.id || "IET20",
        date: b?.date || q.date,
        start: b?.start || q.start,
        duration: b ? b.end - b.start : q.duration,
        capacity: b?.capacity || q.capacity,
        purpose: b?.purpose || q.purpose,
        branch: b?.branch || "CSE",
        year: b?.year || "2",
        section: b?.section || "A",
        batch: b?.batch || "2025–2029",
      },
    );
  const groupFields = (value: any, set: (k: string, v: any) => void) => (
    <div className="form-grid four">
      <Field label="Branch">
        <select
          value={value.branch}
          onChange={(e) => set("branch", e.target.value)}
        >
          {["All", ...BRANCHES].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Year">
        <select
          value={value.year}
          onChange={(e) => set("year", e.target.value)}
        >
          {["All", "1", "2", "3", "4"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Section">
        <select
          value={value.section}
          onChange={(e) => set("section", e.target.value)}
        >
          {["All", "A", "B"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Batch">
        <input
          value={value.batch}
          onChange={(e) => set("batch", e.target.value)}
          maxLength={40}
          required
          placeholder="All or 2025–2029"
        />
      </Field>
    </div>
  );
  const roomCard = (r: Room) => (
    <article className="room-card" key={r.id}>
      <div className="room-top">
        <span
          className={"room-icon " + (r.type === "Seminar hall" ? "peach" : "")}
        >
          {r.type === "Laboratory" ? (
            <FlaskConical size={22} />
          ) : (
            <DoorOpen size={22} />
          )}
        </span>
        <Tag
          color={
            status(r) === "Available"
              ? "green"
              : status(r) === "Booked"
                ? "orange"
                : "gray"
          }
        >
          <i />
          {status(r)}
        </Tag>
      </div>
      <button
        className="room-name"
        onClick={() => open({ type: "room", room: r })}
      >
        {r.id}
        <ArrowUpRight size={18} />
      </button>
      <p className="room-location">
        {r.building} · {floorName(r.floor)}
      </p>
      <div className="room-meta">
        <span>
          <Users size={14} />
          {r.capacity ? `${r.capacity} seats` : "Capacity pending"}
        </span>
        <span>{r.type}</span>
      </div>
      <div className="room-foot">
        <span>
          {r.source === "Demo configuration"
            ? "Demo capacity"
            : r.capacity === null
              ? "Needs confirmation"
              : "Campus inventory"}
        </span>
        <button
          className="text-btn"
          onClick={() =>
            user.role === "student" ? open({ type: "room", room: r }) : book(r)
          }
        >
          {user.role === "student" ? "View room" : "Book room"}
          <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
  const rows = (list: Booking[]) => (
    <div className="schedule-list">
      {list.length ? (
        list.map((b) => (
          <div
            className={
              "session-row " + (b.status === "cancelled" ? "cancelled" : "")
            }
            key={b.id}
          >
            <div className="session-time">
              <b>{clock(b.start)}</b>
              <span>{clock(b.end)} IST</span>
            </div>
            <span
              className={
                "session-line " +
                (b.purpose === "Minor examination" ? "orange" : "")
              }
            />
            <div className="session-detail">
              <button onClick={() => open({ type: "booking", booking: b })}>
                {b.title}
              </button>
              <p>
                <MapPin size={12} />
                {b.roomId} · {b.branch}{" "}
                {b.section !== "All" ? `· ${b.section}` : ""}
                <span className="test">TEST</span>
              </p>
            </div>
            <Tag color={b.status === "confirmed" ? "green" : "red"}>
              {b.status}
            </Tag>
            <button
              className="icon-btn"
              aria-label={"View " + b.title}
              onClick={() => open({ type: "booking", booking: b })}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        ))
      ) : (
        <Empty
          title="A little room in your day"
          body="No sessions match this date and academic group."
          icon={CalendarDays}
        />
      )}
    </div>
  );
  const notice = (n: any) => (
    <article className="notice-card" key={n.id}>
      <span className="room-icon peach">
        <Megaphone size={20} />
      </span>
      <div>
        <div className="notice-label">
          <Tag
            color={
              n.kind === "Cancelled"
                ? "red"
                : n.kind === "Examination"
                  ? "orange"
                  : "green"
            }
          >
            {n.kind}
          </Tag>
          <small>Test data</small>
        </div>
        <h3>{n.title}</h3>
        <p>{n.body}</p>
        <div className="notice-by">
          {n.author} · {n.branch === "All" ? "All branches" : n.branch}
          {n.year !== "All" ? ` · Year ${n.year}` : ""}
          {n.section !== "All" ? ` · Section ${n.section}` : ""} ·{" "}
          {dateLabel(n.created.slice(0, 10), true)}
        </div>
      </div>
    </article>
  );
  const finder = (full = false) => (
    <section className="panel finder">
      <div className="finder-title">
        <span className="mini-icon peach">
          <Search size={18} />
        </span>
        <h3>
          Find your next space
          <span>Good things start with the right room.</span>
        </h3>
        <button
          className="icon-btn"
          aria-label="More search filters"
          onClick={() => setAdvanced(!advanced)}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
      <div className="finder-fields">
        <Field label="Building">
          <select
            aria-label="Search building"
            value={q.building}
            onChange={(e) => change("building", e.target.value)}
          >
            <option>All buildings</option>
            <option>IET</option>
            <option>Deeksha Bhawan</option>
          </select>
        </Field>
        <Field label="Date">
          <input
            aria-label="Search date"
            type="date"
            min={today()}
            value={q.date}
            onChange={(e) => change("date", e.target.value)}
          />
        </Field>
        <Field label="Start time · IST">
          <input
            aria-label="Search time"
            type="time"
            value={clock(q.start)}
            onChange={(e) => change("start", minutes(e.target.value))}
          />
        </Field>
        <Field label="Duration">
          <select
            value={q.duration}
            onChange={(e) => change("duration", +e.target.value)}
          >
            {[30, 60, 90, 120, 180, 240].map((n) => (
              <option key={n} value={n}>
                {n < 60 ? `${n} min` : `${n / 60} hour${n === 60 ? "" : "s"}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="People">
          <input
            aria-label="Required capacity"
            type="number"
            min={1}
            max={2000}
            value={q.capacity}
            onChange={(e) => change("capacity", +e.target.value)}
          />
        </Field>
        <button
          className="btn primary"
          onClick={() => {
            setRecs(null);
            go("Find a room");
          }}
        >
          <Search size={16} />
          Find rooms
        </button>
      </div>
      {(full || advanced) && (
        <div className="advanced">
          <Field label="Floor">
            <select
              value={q.floor}
              onChange={(e) => change("floor", e.target.value)}
            >
              <option>All floors</option>
              {[0, 1, 2].map((n) => (
                <option value={n} key={n}>
                  {floorName(n)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Room name">
            <input
              value={q.room}
              onChange={(e) => change("room", e.target.value)}
              placeholder="e.g. IET20 or LH02"
            />
          </Field>
          <Field label="Purpose">
            <select
              value={q.purpose}
              onChange={(e) => change("purpose", e.target.value)}
            >
              {PURPOSES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <button
            className="text-btn"
            onClick={() => {
              setQ(initial());
              setRecs(null);
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
  const runAssistant = async () => {
    setSaving(true);
    setError("");
    try {
      let x = { ...q };
      const t = assistant.toLowerCase(),
        count = t.match(/(\d+)\s*(?:students|people|seats)/),
        time = t.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (count) x.capacity = +count[1];
      if (t.includes("tomorrow")) {
        const d = new Date(today() + "T12:00:00");
        d.setDate(d.getDate() + 1);
        x.date = d.toISOString().slice(0, 10);
      } else if (t.includes("today")) x.date = today();
      if (time) {
        let h = +time[1];
        if (time[3] === "pm" && h < 12) h += 12;
        if (time[3] === "am" && h === 12) h = 0;
        x.start = h * 60 + +(time[2] || 0);
      }
      if (/exam/.test(t)) x.purpose = "Minor examination";
      if (/lab|practical/.test(t)) x.purpose = "Practical session";
      if (/event|seminar/.test(t)) x.purpose = "Event";
      if (t.includes("deeksha")) x.building = "Deeksha Bhawan";
      else if (t.includes("iet")) x.building = "IET";
      const rr = await api("recommend", {
        ...x,
        end: x.start + x.duration,
        building: x.building === "All buildings" ? undefined : x.building,
      });
      setQ(x);
      setRecs(rr);
      close();
      go("Find a room");
      setToast("Suggestions checked against stored bookings.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  if (!data)
    return (
      <div className="loading">
        <span className="logo-icon">
          <GraduationCap size={30} />
        </span>
        <h2>
          CampusFlow<span>.</span>
        </h2>
        <p>{loadError || "Getting your campus in sync…"}</p>
        {loadError ? (
          <button className="btn primary" onClick={reload}>
            Try again
          </button>
        ) : (
          <div className="loading-line" />
        )}
      </div>
    );
  const pages: any = [
    ["Overview", LayoutDashboard],
    ["Find a room", Search],
    ["Campus map", Map],
    ["Schedule", CalendarDays],
    ["Announcements", Megaphone],
  ];
  const titles: any = {
    Overview: "Your campus, in sync.",
    "Find a room": "Make room for what’s next.",
    "Campus map": "Get to know your campus.",
    Schedule: "Every session. One schedule.",
    "My bookings": "Your plans, all in one place.",
    Announcements: "Keep everyone in the loop.",
    Reports: "Clarity starts with a conversation.",
    "Activity log": "A clear record of every change.",
    "Data manager": "A reliable campus starts with good data.",
  };
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Overview");
          }}
        >
          <span className="logo-icon">
            <GraduationCap size={24} />
          </span>
          CampusFlow<span>.</span>
        </a>
        <div className="campus-switch">
          <span className="campus-avatar">
            <Building2 size={20} />
          </span>
          <div>
            <b>DDUGU Campus</b>
            <small>Gorakhpur, India</small>
          </div>
          <ShieldCheck size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {pages.map(([p, Icon]: any) => (
            <button
              className={"nav-item " + (page === p ? "active" : "")}
              key={p}
              onClick={() => go(p)}
            >
              <Icon size={18} />
              {p}
              {p === "Announcements" && (
                <span className="nav-count">{data.notices.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-label">MANAGE</div>
        <nav>
          {user.role !== "student" && (
            <>
              <button
                className={
                  "nav-item " + (page === "My bookings" ? "active" : "")
                }
                onClick={() => go("My bookings")}
              >
                <BookOpen size={18} />
                My bookings
              </button>
              <button
                className={
                  "nav-item " + (page === "Activity log" ? "active" : "")
                }
                onClick={() => go("Activity log")}
              >
                <History size={18} />
                Activity log
              </button>
            </>
          )}
          <button
            className={"nav-item " + (page === "Reports" ? "active" : "")}
            onClick={() => go("Reports")}
          >
            <MessageCircle size={18} />
            Schedule reports
          </button>
          {user.role === "admin" && (
            <button
              className={
                "nav-item " + (page === "Data manager" ? "active" : "")
              }
              onClick={() => go("Data manager")}
            >
              <Database size={18} />
              Data manager
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <Sparkles size={20} />
            <b>A campus in sync.</b>
            <p>
              Less searching.
              <br />
              More making things happen.
            </p>
            <button
              onClick={() => {
                setTour(1);
                setQ(initial());
                go("Overview");
              }}
            >
              Explore the demo
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="role-control">
            <label htmlFor="role-select">PREVIEW AS · DEMO ROLE</label>
            <div>
              <span className="avatar">
                {user.role === "admin" ? "CA" : "AS"}
              </span>
              <select
                id="role-select"
                disabled={saving}
                value={user.role}
                onChange={async (e) => {
                  setSaving(true);
                  try {
                    await api("session", { role: e.target.value });
                    await reload();
                    go("Overview");
                    setCohort(group);
                    close();
                    setToast("Demo role updated.");
                  } catch (err: any) {
                    setToast(err.message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
        </div>
      </aside>
      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <b>{page}</b>
          </div>
          <div className="top-actions">
            <span className="sync">
              <i />
              Synced to campus
            </span>
            <button
              className="icon-btn"
              aria-label="Refresh campus data"
              onClick={async () => {
                await reload();
                setToast("Campus data refreshed.");
              }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="icon-btn notification"
              aria-label="View announcements"
              onClick={() => go("Announcements")}
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="avatar">
              {user.role === "admin" ? "CA" : "AS"}
            </span>
          </div>
        </header>
        <main>
          <div className="prototype-line">
            <span>
              <i />
              WORKING PROTOTYPE <b>/</b> Sample bookings & student data
            </span>
            <button onClick={() => open({ type: "about" })}>
              What’s connected
              <ArrowUpRight size={12} />
            </button>
          </div>
          {loadError && (
            <div className="error-box">
              {loadError}
              <button onClick={reload}>Retry</button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "Overview"
                  ? "A LITTLE LESS CHAOS. A LOT MORE CAMPUS."
                  : "YOUR CAMPUS, CONNECTED"}
              </div>
              <h1>{titles[page]}</h1>
              <p>
                {page === "Overview"
                  ? `Welcome back, ${user.role === "faculty" ? "Dr. Ananya" : user.role === "student" ? "Aarav" : "Administrator"}. Let’s make today flow.`
                  : page === "Data manager"
                    ? "Import official records, attach both building blueprints, and verify room details."
                    : "Find what you need. Stay informed. Keep your day moving."}
              </p>
            </div>
            {user.role !== "student" && page !== "Data manager" && (
              <button
                className="btn primary"
                onClick={() =>
                  page === "Announcements"
                    ? open(
                        { type: "notice" },
                        { ...group, title: "", body: "", kind: "Announcement" },
                      )
                    : book()
                }
              >
                <Plus size={18} />
                {page === "Announcements" ? "Publish update" : "New booking"}
              </button>
            )}
          </div>
          {tour > 0 && (
            <div className="tour">
              <Tag color="orange">DEMO {tour}/4</Tag>
              <p>
                {
                  [
                    "",
                    "Discover rooms across IET and Deeksha Bhawan.",
                    "Book IET20 at 10:00 to see conflict prevention and alternatives.",
                    "Switch to Student to view schedules and report an issue.",
                    "Switch to Administrator to import records and both building blueprints.",
                  ][tour]
                }
              </p>
              <button
                className="text-btn"
                onClick={() => {
                  if (tour === 1) go("Find a room");
                  if (tour === 2) book(rooms.find((r) => r.id === "IET20"));
                  setTour(tour === 4 ? 0 : tour + 1);
                }}
              >
                {tour === 4 ? "Finish" : "Next"}
                <ArrowRight size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label="Close demo guide"
                onClick={() => setTour(0)}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {page === "Overview" && (
            <>
              <div className="stats">
                <div className="stat">
                  <div>
                    <span>Available spaces</span>
                    <span className="mini-icon green">
                      <DoorOpen size={19} />
                    </span>
                  </div>
                  <b>
                    {String(ranked.length).padStart(2, "0")}
                    <span>/ {rooms.length}</span>
                  </b>
                  <p>
                    <span className="green-text">● Ready to book</span>
                    <span>
                      {clock(q.start)} · {q.capacity} people
                    </span>
                  </p>
                </div>
                <div className="stat">
                  <div>
                    <span>Today’s sessions</span>
                    <span className="mini-icon peach">
                      <CalendarDays size={19} />
                    </span>
                  </div>
                  <b>{String(todays.length).padStart(2, "0")}</b>
                  <p>
                    <span>Classes, exams & events</span>
                    <span className="bars">▂▅▃▆▄▇</span>
                  </p>
                </div>
                <div className="stat">
                  <div>
                    <span>Connected buildings</span>
                    <span className="mini-icon purple">
                      <Building2 size={19} />
                    </span>
                  </div>
                  <b>
                    02<span>IET + Deeksha</span>
                  </b>
                  <p>
                    <span>About 100 m apart</span>
                    <span className="green-text">Connected</span>
                  </p>
                </div>
                <div className="stat">
                  <div>
                    <span>Schedule reports</span>
                    <span className="mini-icon blue">
                      <ShieldCheck size={19} />
                    </span>
                  </div>
                  <b>
                    {String(
                      data.reports.filter((r: any) => r.status === "open")
                        .length,
                    ).padStart(2, "0")}
                    <span>open</span>
                  </b>
                  <p>
                    <span>Every concern accounted for</span>
                    <button
                      aria-label="View reports"
                      onClick={() => go("Reports")}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </p>
                </div>
              </div>
              {finder()}
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Campus at a glance</h2>
                      <p>A space for every possibility.</p>
                    </div>
                    <button
                      className="text-btn muted"
                      onClick={() => go("Campus map")}
                    >
                      Explore map
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="map-toolbar">
                    <div className="segmented">
                      {["IET", "Deeksha Bhawan"].map((b) => (
                        <button
                          key={b}
                          className={building === b ? "active" : ""}
                          onClick={() => setBuilding(b)}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <select
                      aria-label="Map floor"
                      value={floor}
                      onChange={(e) => setFloor(+e.target.value)}
                    >
                      {[0, 1, 2].map((n) => (
                        <option value={n} key={n}>
                          {floorName(n)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Plan
                    rooms={rooms}
                    bookings={bookings}
                    q={q}
                    building={building}
                    floor={floor}
                    onRoom={(r) => open({ type: "room", room: r })}
                  />
                  <div className="legend">
                    <span>
                      <i />
                      Available
                    </span>
                    <span>
                      <i className="orange" />
                      Booked
                    </span>
                    <span>
                      <i className="gray" />
                      Unverified
                    </span>
                    <small>
                      {dateLabel(q.date, true)} · {clock(q.start)}–{clock(end)}
                    </small>
                  </div>
                </section>
                <div className="dashboard-rail">
                  <section className="assistant-card">
                    <div className="assist-head">
                      <span className="mini-icon">
                        <Sparkles size={20} />
                      </span>
                      <Tag>SMART ASSIST</Tag>
                    </div>
                    <h2>
                      Less searching.
                      <br />
                      More teaching.
                    </h2>
                    <p>
                      Tell us what you need. We’ll find a space that fits your
                      plans.
                    </p>
                    <button
                      className="assistant-input"
                      onClick={() => open({ type: "assistant" })}
                    >
                      Find a room for 70 students…
                      <ArrowRight size={18} />
                    </button>
                    <small>
                      <ShieldCheck size={12} />
                      Checked against stored booking records
                    </small>
                    <div className="orbit" />
                  </section>
                  <section className="panel bulletin">
                    <div className="panel-heading">
                      <h3>● Campus bulletin</h3>
                      <button
                        className="icon-btn"
                        aria-label="Open campus bulletin"
                        onClick={() => go("Announcements")}
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                    <Tag color="orange">{data.notices[0]?.kind}</Tag>
                    <button
                      className="bulletin-title"
                      onClick={() => go("Announcements")}
                    >
                      {data.notices[0]?.title}
                    </button>
                    <p>{data.notices[0]?.body}</p>
                    <div className="notice-by">Campus updates · Test data</div>
                  </section>
                </div>
              </div>
              <div className="section-heading">
                <div>
                  <h2>Spaces to make things happen</h2>
                  <p>Available for your selected time, capacity and purpose.</p>
                </div>
                <button className="text-btn" onClick={() => go("Find a room")}>
                  View all spaces
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="room-grid">
                {ranked.slice(0, 3).map((x) => roomCard(x.room))}
              </div>
              {!ranked.length && (
                <Empty
                  title="No matching spaces"
                  body="Try a different date, time or capacity."
                />
              )}
              <section className="panel today-panel">
                <div className="panel-heading">
                  <div>
                    <h2>On the campus calendar</h2>
                    <p>{dateLabel(today())} · All times IST</p>
                  </div>
                  <button className="text-btn" onClick={() => go("Schedule")}>
                    Full schedule
                    <ArrowRight size={16} />
                  </button>
                </div>
                {rows(todays.slice(0, 4))}
              </section>
            </>
          )}
          {page === "Find a room" && (
            <>
              {finder(true)}
              {recs && (
                <section className="panel recommendations">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        <Sparkles size={18} />
                        Your smart matches
                      </h2>
                      <p>
                        Rules-based allocation. Capacity, permitted use and
                        availability checked.
                      </p>
                    </div>
                    <Tag color="green">Checked just now</Tag>
                  </div>
                  {recs.matches.length ? (
                    recs.matches.slice(0, 3).map((a: any) => (
                      <button
                        className="recommend-row"
                        key={a.room.id}
                        onClick={() =>
                          user.role === "student"
                            ? open({ type: "room", room: a.room })
                            : book(a.room)
                        }
                      >
                        <DoorOpen size={21} />
                        <span>
                          <b>{a.room.id}</b>
                          <small>{a.reason}</small>
                        </span>
                        <ArrowRight size={18} />
                      </button>
                    ))
                  ) : (
                    <Empty
                      title="No room fits this time"
                      body="Try a later slot or change the capacity or purpose."
                    />
                  )}
                  {recs.later.length > 0 && (
                    <div className="later">
                      <span>Also available later</span>
                      {recs.later.map((a: any) => (
                        <button
                          key={a.start}
                          onClick={() => change("start", a.start)}
                        >
                          {clock(a.start)} · {a.room.id}
                          <ArrowUpRight size={13} />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
              <div className="section-heading">
                <div>
                  <h2>
                    {filtered.length} spaces to explore{" "}
                    <Tag color="green">
                      {filtered.filter((r) => status(r) === "Available").length}{" "}
                      available
                    </Tag>
                  </h2>
                  <p>
                    {dateLabel(q.date, true)} · {clock(q.start)}–{clock(end)}{" "}
                    IST · {q.capacity}+ seats
                  </p>
                </div>
                <button
                  className="btn secondary"
                  onClick={() => open({ type: "assistant" })}
                >
                  <Sparkles size={16} />
                  Smart assist
                </button>
              </div>
              <div className="room-grid">
                {[...filtered]
                  .sort(
                    (a, b) =>
                      (status(a) === "Available" ? 0 : 1) -
                      (status(b) === "Available" ? 0 : 1),
                  )
                  .map(roomCard)}
              </div>
              {!filtered.length && (
                <Empty
                  title="Let’s try another search"
                  body="Change the building, room name, purpose or required capacity."
                />
              )}
              <div className="info-strip">
                <Info size={18} />
                <p>
                  Unknown capacities and unverified labs cannot be booked.
                  Deeksha demo capacities must be replaced with the supplied
                  records.
                </p>
              </div>
            </>
          )}
          {page === "Campus map" && (
            <>
              <div className="building-grid">
                {["IET", "Deeksha Bhawan"].map((b, i) => (
                  <button
                    key={b}
                    className={
                      "building-card " + (building === b ? "active" : "")
                    }
                    onClick={() => {
                      setBuilding(b);
                      setFloor(i ? 0 : 1);
                    }}
                  >
                    <span className="building-art">
                      <Building2 size={45} strokeWidth={1} />
                    </span>
                    <span>
                      <Tag color={i ? "orange" : "green"}>
                        {i ? "100 M FROM IET" : "MAIN ACADEMIC BUILDING"}
                      </Tag>
                      <h2>{i ? b : "Institute of Engineering & Technology"}</h2>
                      <p>
                        {rooms.filter((r) => r.building === b).length} rooms ·{" "}
                        {i
                          ? "Classrooms & examinations"
                          : "Classrooms, labs & seminar hall"}
                      </p>
                    </span>
                    {building === b && <CheckCircle2 size={19} />}
                  </button>
                ))}
              </div>
              <section className="panel full-map">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {building} / {floorName(floor)}
                    </h2>
                    <p>Select a room to see details and its schedule.</p>
                  </div>
                  <div className="segmented">
                    {[0, 1, 2].map((n) => (
                      <button
                        key={n}
                        className={floor === n ? "active" : ""}
                        onClick={() => setFloor(n)}
                      >
                        {floorName(n)}
                      </button>
                    ))}
                  </div>
                </div>
                <Plan
                  rooms={rooms}
                  bookings={bookings}
                  q={q}
                  building={building}
                  floor={floor}
                  onRoom={(r) => open({ type: "room", room: r })}
                />
                <div className="legend">
                  <span>
                    <i />
                    Available
                  </span>
                  <span>
                    <i className="orange" />
                    Booked
                  </span>
                  <span>
                    <i className="gray" />
                    Unverified
                  </span>
                  <small>
                    {dateLabel(q.date, true)} · {clock(q.start)}–{clock(end)}{" "}
                    IST
                  </small>
                </div>
              </section>
              <div className="info-strip">
                <Info size={18} />
                <p>
                  IET room names and floors follow the brief. This layout is
                  illustrative. Deeksha floor placements and sample capacities
                  require the supplied records.
                </p>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Official building blueprints</h2>
                    <p>
                      Uploaded source plans are kept separate from the
                      schematic.
                    </p>
                  </div>
                  {user.role === "admin" && (
                    <button
                      className="btn secondary"
                      onClick={() =>
                        open({ type: "blueprint" }, { building, floor })
                      }
                    >
                      <Upload size={15} />
                      Upload plan
                    </button>
                  )}
                </div>
                {data.blueprints.filter((b: any) => b.building === building)
                  .length ? (
                  data.blueprints
                    .filter((b: any) => b.building === building)
                    .map((b: any) => (
                      <a
                        className="file-row"
                        key={b.id}
                        href={"/api/blueprint/" + b.id}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText size={21} />
                        <span>
                          <b>{b.name}</b>
                          <small>
                            {floorName(b.floor)} ·{" "}
                            {dateLabel(b.uploaded.slice(0, 10), true)}
                          </small>
                        </span>
                        <ExternalLink size={16} />
                      </a>
                    ))
                ) : (
                  <Empty
                    title="Official blueprint not supplied yet"
                    body={`An administrator can upload the supplied ${building} plan as PDF, PNG or JPEG.`}
                    icon={Layers}
                  />
                )}
              </section>
            </>
          )}
          {(page === "Schedule" || page === "My bookings") && (
            <section className="panel">
              <div className="calendar-toolbar">
                <div>
                  <button
                    className="icon-btn"
                    aria-label="Previous day"
                    onClick={() => {
                      const d = new Date(date + "T12:00:00");
                      d.setDate(d.getDate() - 1);
                      setDate(d.toISOString().slice(0, 10));
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <input
                    aria-label="Schedule date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <button
                    className="icon-btn"
                    aria-label="Next day"
                    onClick={() => {
                      const d = new Date(date + "T12:00:00");
                      d.setDate(d.getDate() + 1);
                      setDate(d.toISOString().slice(0, 10));
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="btn secondary small"
                    onClick={() => setDate(today())}
                  >
                    Today
                  </button>
                </div>
                <button
                  className="btn secondary"
                  onClick={() =>
                    download(
                      "CampusFlow-schedule.csv",
                      csv([
                        [
                          "Title",
                          "Room",
                          "Date",
                          "Start IST",
                          "End IST",
                          "Branch",
                          "Year",
                          "Section",
                          "Status",
                          "Data",
                        ],
                        ...bookings
                          .filter(
                            (b) =>
                              b.date === date &&
                              match(b) &&
                              (page !== "My bookings" || b.owner === user.id),
                          )
                          .map((b) => [
                            b.title,
                            b.roomId,
                            b.date,
                            clock(b.start),
                            clock(b.end),
                            b.branch,
                            b.year,
                            b.section,
                            b.status,
                            "TEST DATA",
                          ]),
                      ]),
                    )
                  }
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              <div className="cohort-filter">
                <span>Your academic group</span>
                {groupFields(cohort, (k, v) =>
                  setCohort((x) => ({ ...x, [k]: v })),
                )}
              </div>
              <div className="schedule-date">
                <b>{dateLabel(date)}</b>
                <span>All times IST · Demonstration data</span>
              </div>
              {rows(
                bookings.filter(
                  (b) =>
                    b.date === date &&
                    match(b) &&
                    (page !== "My bookings" || b.owner === user.id),
                ),
              )}
              {user.role === "student" && (
                <div className="info-strip">
                  <ShieldCheck size={18} />
                  <p>
                    Your schedule is read-only. Open a session to report
                    conflicting or outdated information.
                  </p>
                </div>
              )}
            </section>
          )}
          {page === "Announcements" && (
            <>
              <div className="filter-row">
                <div className="segmented">
                  {[
                    "All",
                    "Examination",
                    "Rescheduled",
                    "Cancelled",
                    "Announcement",
                  ].map((x) => (
                    <button
                      key={x}
                      className={kind === x ? "active" : ""}
                      onClick={() => setKind(x)}
                    >
                      {x === "All" ? "All updates" : x}
                    </button>
                  ))}
                </div>
                <select
                  aria-label="Notice branch"
                  value={cohort.branch}
                  onChange={(e) =>
                    setCohort((x) => ({ ...x, branch: e.target.value }))
                  }
                >
                  {["All", ...BRANCHES].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div className="notices-feed">
                {data.notices
                  .filter(
                    (n: any) =>
                      (kind === "All" || n.kind === kind) &&
                      (cohort.branch === "All" ||
                        n.branch === "All" ||
                        n.branch === cohort.branch),
                  )
                  .map(notice)}
              </div>
              {!data.notices.some(
                (n: any) =>
                  (kind === "All" || n.kind === kind) &&
                  (cohort.branch === "All" ||
                    n.branch === "All" ||
                    n.branch === cohort.branch),
              ) && (
                <Empty
                  title="You’re all caught up"
                  body="No notices match this category."
                  icon={Megaphone}
                />
              )}
            </>
          )}
          {page === "Activity log" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Campus activity</h2>
                  <p>
                    Bookings, schedule changes, notices and imports. Latest 200
                    events.
                  </p>
                </div>
                <Tag color="green">
                  <ShieldCheck size={12} />
                  Server recorded
                </Tag>
              </div>
              {data.audit.map((a: any) => (
                <div className="audit-row" key={a.id}>
                  <span className="mini-icon green">
                    <History size={18} />
                  </span>
                  <div>
                    <h3>{a.action}</h3>
                    <p>{a.detail}</p>
                    <small>{a.actor}</small>
                  </div>
                  <time>
                    {new Date(a.created).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    IST
                  </time>
                </div>
              ))}
            </section>
          )}
          {page === "Reports" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Schedule feedback</h2>
                  <p>
                    Flag a conflict, an outdated notice or a missing update.
                  </p>
                </div>
                <button
                  className="btn secondary"
                  onClick={() =>
                    open({ type: "report" }, { message: "", bookingId: "" })
                  }
                >
                  <Plus size={16} />
                  New report
                </button>
              </div>
              {data.reports.length ? (
                data.reports.map((r: any) => (
                  <div className="report-row" key={r.id}>
                    <MessageCircle size={20} />
                    <div>
                      <div className="notice-label">
                        <b>{r.author}</b>
                        <Tag color={r.status === "open" ? "orange" : "green"}>
                          {r.status}
                        </Tag>
                      </div>
                      <p>{r.message}</p>
                      <small>
                        {r.bookingId
                          ? bookings.find((b) => b.id === r.bookingId)?.title
                          : "General campus feedback"}{" "}
                        · {dateLabel(r.created.slice(0, 10), true)}
                      </small>
                    </div>
                    {user.role === "admin" && r.status === "open" && (
                      <button
                        className="btn secondary small"
                        disabled={saving}
                        onClick={() =>
                          mutate(
                            "resolve",
                            { id: r.id },
                            "Report marked as resolved.",
                          )
                        }
                      >
                        <Check size={15} />
                        Resolve
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <Empty
                  title="All clear, for now"
                  body="Students and faculty can help keep the timetable accurate by reporting issues here."
                  icon={CheckCircle2}
                />
              )}
            </section>
          )}
          {page === "Data manager" && user.role === "admin" && (
            <>
              <div className="data-status">
                <ShieldCheck size={25} />
                <div>
                  <h3>Official data integration is pending</h3>
                  <p>
                    The actual student datasets and both building blueprints
                    were not attached. Import the supplied files before
                    presenting this as the official campus dataset.
                  </p>
                </div>
                <Tag color="orange">ACTION REQUIRED</Tag>
              </div>
              <div className="data-cards">
                <section className="panel">
                  <span className="room-icon">
                    <Users size={25} />
                  </span>
                  <h2>Students & academic groups</h2>
                  <p>
                    Map students to branch, year, section and batch. Covers six
                    IET branches and years 1–4.
                  </p>
                  <div className="data-count">
                    <b>
                      {
                        data.students.filter(
                          (s: any) => s.source === "Imported dataset",
                        ).length
                      }
                    </b>{" "}
                    imported ·{" "}
                    {
                      data.students.filter((s: any) => s.source === "Demo data")
                        .length
                    }{" "}
                    demo
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => open({ type: "import", kind: "students" })}
                  >
                    <Upload size={16} />
                    Import student CSV
                  </button>
                  <button
                    className="text-btn"
                    onClick={() =>
                      download(
                        "students-template.csv",
                        "id,name,branch,year,section,batch\nEXAMPLE-001,Replace with supplied name,CSE,2,A,2025–2029\n",
                      )
                    }
                  >
                    <Download size={14} />
                    Download template
                  </button>
                </section>
                <section className="panel">
                  <span className="room-icon peach">
                    <Building2 size={25} />
                  </span>
                  <h2>Room records & capacities</h2>
                  <p>
                    Confirm capacity, floor location, permitted uses and
                    laboratory availability from supplied records.
                  </p>
                  <div className="data-count">
                    <b>
                      {
                        rooms.filter((r) => r.source === "Imported dataset")
                          .length
                      }
                    </b>{" "}
                    imported · {rooms.length} total
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => open({ type: "import", kind: "rooms" })}
                  >
                    <Upload size={16} />
                    Import room CSV
                  </button>
                  <button
                    className="text-btn"
                    onClick={() =>
                      download(
                        "rooms-template.csv",
                        csv([
                          [
                            "id",
                            "building",
                            "floor",
                            "capacity",
                            "uses",
                            "availability",
                          ],
                          ...rooms.map((r) => [
                            r.id,
                            r.building,
                            r.floor,
                            r.capacity ?? "",
                            r.uses.join("|"),
                            r.availability,
                          ]),
                        ]),
                      )
                    }
                  >
                    <Download size={14} />
                    Download current template
                  </button>
                </section>
                <section className="panel">
                  <span className="room-icon purple">
                    <Layers size={25} />
                  </span>
                  <h2>Building blueprints</h2>
                  <p>
                    Attach the official IET and Deeksha Bhawan plans. They
                    appear in the campus map.
                  </p>
                  <div className="data-count">
                    <b>
                      {
                        new Set(data.blueprints.map((b: any) => b.building))
                          .size
                      }
                    </b>{" "}
                    / 2 buildings · {data.blueprints.length} files
                  </div>
                  <button
                    className="btn primary"
                    onClick={() =>
                      open({ type: "blueprint" }, { building: "IET", floor: 1 })
                    }
                  >
                    <Upload size={16} />
                    Upload blueprint
                  </button>
                  <button className="text-btn" onClick={() => go("Campus map")}>
                    View uploaded plans
                    <ArrowRight size={14} />
                  </button>
                </section>
              </div>
              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Campus room inventory</h2>
                    <p>
                      Unknown records remain unbookable until confirmed by an
                      administrator.
                    </p>
                  </div>
                  <Tag>{rooms.length} records</Tag>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Building / Floor</th>
                        <th>Capacity</th>
                        <th>Availability</th>
                        <th>Source</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <b>{r.id}</b>
                            <small>{r.type}</small>
                          </td>
                          <td>
                            {r.building}
                            <small>{floorName(r.floor)}</small>
                          </td>
                          <td>{r.capacity ?? "Unknown"}</td>
                          <td>
                            <Tag
                              color={
                                r.availability === "confirmed"
                                  ? "green"
                                  : "orange"
                              }
                            >
                              {r.availability}
                            </Tag>
                          </td>
                          <td>{r.source}</td>
                          <td>
                            <button
                              className="text-btn"
                              onClick={() =>
                                open(
                                  { type: "edit-room", room: r },
                                  { ...r, capacity: r.capacity ?? "" },
                                )
                              }
                            >
                              Configure
                              <Settings2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Student mapping</h2>
                    <p>
                      Use an imported record to open the matching academic
                      schedule.
                    </p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Name / ID</th>
                        <th>Branch</th>
                        <th>Year</th>
                        <th>Section</th>
                        <th>Batch</th>
                        <th>Source</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.students.map((s: any) => (
                        <tr key={s.id}>
                          <td>
                            <b>{s.name}</b>
                            <small>{s.id}</small>
                          </td>
                          <td>{s.branch}</td>
                          <td>{s.year}</td>
                          <td>{s.section}</td>
                          <td>{s.batch}</td>
                          <td>
                            <Tag
                              color={
                                s.source === "Demo data" ? "orange" : "green"
                              }
                            >
                              {s.source}
                            </Tag>
                          </td>
                          <td>
                            <button
                              className="text-btn"
                              onClick={() => {
                                setCohort({
                                  branch: s.branch,
                                  year: s.year,
                                  section: s.section,
                                  batch: s.batch,
                                });
                                go("Schedule");
                              }}
                            >
                              View schedule
                              <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          <footer>
            <span>
              <b>CampusFlow</b> · Built for a campus that moves together.
            </span>
            <span>DDUGU · BUILD WITH AI 2026</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal?.type === "book" && (
        <Modal
          title={
            modal.booking
              ? "Reschedule session"
              : "Make space for your next session"
          }
          eyebrow="ROOM BOOKING"
          onClose={close}
          wide
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                modal.booking ? "reschedule" : "book",
                {
                  ...form,
                  end: form.start + form.duration,
                  id: modal.booking?.id,
                },
                modal.booking
                  ? "Session rescheduled and an update published."
                  : "Room booked. Your schedule is updated.",
              );
            }}
          >
            <div className="booking-info">
              <ShieldCheck size={18} />
              <span>
                Availability is checked again when you confirm. Prototype
                reservations are marked as test data.
              </span>
            </div>
            <div className="modal-body">
              <Field label="Session title">
                <input
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => mf("title", e.target.value)}
                  placeholder="e.g. Data Structures · Extra class"
                />
              </Field>
              <div className="form-grid">
                <Field label="Room">
                  <select
                    aria-label="Booking room"
                    value={form.roomId}
                    onChange={(e) => mf("roomId", e.target.value)}
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} · {r.building} · {r.capacity ?? "?"} seats
                        {r.availability !== "confirmed" ? " · Unverified" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Purpose">
                  <select
                    aria-label="Booking purpose"
                    value={form.purpose}
                    onChange={(e) => mf("purpose", e.target.value)}
                  >
                    {PURPOSES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="form-grid four">
                <Field label="Date">
                  <input
                    aria-label="Booking date"
                    required
                    type="date"
                    min={today()}
                    value={form.date}
                    onChange={(e) => mf("date", e.target.value)}
                  />
                </Field>
                <Field label="Start time · IST">
                  <input
                    aria-label="Booking start time"
                    required
                    type="time"
                    min="08:00"
                    max="17:45"
                    value={clock(form.start)}
                    onChange={(e) => mf("start", minutes(e.target.value))}
                  />
                </Field>
                <Field label="Duration">
                  <select
                    aria-label="Booking duration"
                    value={form.duration}
                    onChange={(e) => mf("duration", +e.target.value)}
                  >
                    {[30, 60, 90, 120, 180, 240].map((n) => (
                      <option key={n} value={n}>
                        {n} minutes
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="People">
                  <input
                    aria-label="Booking capacity"
                    required
                    type="number"
                    min={1}
                    max={2000}
                    value={form.capacity}
                    onChange={(e) => mf("capacity", +e.target.value)}
                  />
                </Field>
              </div>
              <div className="divider">WHO’S THIS SESSION FOR?</div>
              {groupFields(form, mf)}
              <p className="form-note">
                <Info size={14} />
                Room source: {rooms.find((r) => r.id === form.roomId)?.source}.
                Capacities from the brief are approximate.
              </p>
              {error && (
                <div className="error-box" role="alert">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}
              {alternatives.length > 0 && (
                <div className="conflict-list">
                  <h3>These spaces fit your plans</h3>
                  <p>Same date and time. Checked against stored bookings.</p>
                  {alternatives.map((a) => (
                    <button
                      type="button"
                      key={a.room.id}
                      onClick={() => {
                        mf("roomId", a.room.id);
                        setError("");
                        setAlternatives([]);
                      }}
                    >
                      <span>
                        <b>{a.room.id}</b>
                        <small>{a.reason}</small>
                      </span>
                      Choose
                      <ArrowRight size={15} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={close}>
                Cancel
              </button>
              <button className="btn primary" disabled={saving}>
                {saving
                  ? "Checking availability…"
                  : modal.booking
                    ? "Confirm reschedule"
                    : "Confirm booking"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.type === "room" && (
        <Modal
          title={modal.room.id}
          eyebrow={`${modal.room.building} / ${floorName(modal.room.floor)}`}
          onClose={close}
        >
          <div className="modal-body">
            <div className="room-art">
              <DoorOpen size={50} strokeWidth={1} />
              <Tag
                color={status(modal.room) === "Available" ? "green" : "orange"}
              >
                {status(modal.room)}
              </Tag>
            </div>
            <div className="detail-grid">
              <div>
                <small>Capacity</small>
                <b>
                  {modal.room.capacity
                    ? `${modal.room.capacity} seats`
                    : "Awaiting confirmation"}
                </b>
              </div>
              <div>
                <small>Room type</small>
                <b>{modal.room.type}</b>
              </div>
              <div>
                <small>Permitted uses</small>
                <b>{modal.room.uses.join(", ")}</b>
              </div>
              <div>
                <small>Data source</small>
                <b>{modal.room.source}</b>
              </div>
            </div>
            {modal.room.source === "Demo configuration" && (
              <div className="info-strip">
                <Info size={17} />
                <p>
                  This is a demo capacity. Replace it with the supplied campus
                  records.
                </p>
              </div>
            )}
            <h3 className="subhead">
              {dateLabel(q.date, true)} · Room schedule
            </h3>
            {rows(
              bookings.filter(
                (b) =>
                  b.roomId === modal.room.id &&
                  b.date === q.date &&
                  b.status === "confirmed",
              ),
            )}
          </div>
          <div className="modal-footer">
            <button className="btn secondary" onClick={close}>
              Close
            </button>
            {user.role !== "student" && (
              <button
                className="btn primary"
                disabled={
                  modal.room.capacity === null ||
                  modal.room.availability !== "confirmed"
                }
                onClick={() => book(modal.room)}
              >
                Book this room
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </Modal>
      )}
      {modal?.type === "booking" && (
        <Modal
          title={modal.booking.title}
          eyebrow="SESSION DETAILS · TEST DATA"
          onClose={close}
        >
          <div className="modal-body">
            <Tag color={modal.booking.status === "confirmed" ? "green" : "red"}>
              {modal.booking.status}
            </Tag>
            <div className="detail-grid">
              <div>
                <small>Room</small>
                <b>{modal.booking.roomId}</b>
              </div>
              <div>
                <small>Date</small>
                <b>{dateLabel(modal.booking.date, true)}</b>
              </div>
              <div>
                <small>Time · IST</small>
                <b>
                  {clock(modal.booking.start)}–{clock(modal.booking.end)}
                </b>
              </div>
              <div>
                <small>Faculty</small>
                <b>{modal.booking.faculty}</b>
              </div>
              <div>
                <small>Academic group</small>
                <b>
                  {modal.booking.branch} · Year {modal.booking.year} ·{" "}
                  {modal.booking.section}
                </b>
              </div>
              <div>
                <small>Batch / People</small>
                <b>
                  {modal.booking.batch} · {modal.booking.capacity} people
                </b>
              </div>
            </div>
            <div className="actions">
              <button
                className="btn secondary"
                onClick={() =>
                  open(
                    { type: "report" },
                    { message: "", bookingId: modal.booking.id },
                  )
                }
              >
                <MessageCircle size={16} />
                Report an issue
              </button>
              {user.role !== "student" &&
                (user.role === "admin" || modal.booking.owner === user.id) &&
                modal.booking.status === "confirmed" && (
                  <>
                    <button
                      className="btn secondary"
                      onClick={() => book(undefined, modal.booking)}
                    >
                      Reschedule
                    </button>
                    <button
                      className="btn danger"
                      onClick={() =>
                        open(
                          { type: "cancel", booking: modal.booking },
                          { reason: "" },
                        )
                      }
                    >
                      Cancel session
                    </button>
                  </>
                )}
            </div>
          </div>
        </Modal>
      )}
      {modal?.type === "cancel" && (
        <Modal
          title="Cancel this session?"
          eyebrow={modal.booking.title}
          onClose={close}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                "cancel",
                { id: modal.booking.id, reason: form.reason },
                "Session cancelled. The room is released and a notice published.",
              );
            }}
          >
            <div className="modal-body">
              <p>
                The room will be released and the affected academic group will
                receive an in-app cancellation notice.
              </p>
              <Field label="Reason for cancellation">
                <textarea
                  required
                  value={form.reason}
                  onChange={(e) => mf("reason", e.target.value)}
                  maxLength={500}
                  placeholder="Explain the change so students know what to expect."
                />
              </Field>
              {error && <div className="error-box">{error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={close}>
                Keep session
              </button>
              <button className="btn danger" disabled={saving}>
                {saving ? "Cancelling…" : "Cancel & notify"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.type === "notice" && (
        <Modal
          title="Keep your campus informed"
          eyebrow="PUBLISH AN UPDATE"
          onClose={close}
          wide
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                "notice",
                form,
                "Update published to the campus bulletin.",
              );
            }}
          >
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Notice title">
                  <input
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(e) => mf("title", e.target.value)}
                  />
                </Field>
                <Field label="Update type">
                  <select
                    value={form.kind}
                    onChange={(e) => mf("kind", e.target.value)}
                  >
                    {[
                      "Announcement",
                      "Examination",
                      "Rescheduled",
                      "Cancelled",
                    ].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Message">
                <textarea
                  required
                  maxLength={2000}
                  value={form.body}
                  onChange={(e) => mf("body", e.target.value)}
                  placeholder="Include the correct date, time, location and what students need to do."
                />
              </Field>
              <div className="divider">AUDIENCE</div>
              {groupFields(form, mf)}
              {error && <div className="error-box">{error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={close}>
                Cancel
              </button>
              <button className="btn primary" disabled={saving}>
                <Megaphone size={16} />
                {saving ? "Publishing…" : "Publish update"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.type === "report" && (
        <Modal
          title="Help keep the schedule accurate"
          eyebrow="REPORT OR COMMENT"
          onClose={close}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                "report",
                form,
                "Your report has been recorded for faculty and administrators.",
              );
            }}
          >
            <div className="modal-body">
              <p>
                Describe conflicting or outdated information. This does not
                change the official booking.
              </p>
              <Field label="Related session">
                <select
                  value={form.bookingId}
                  onChange={(e) => mf("bookingId", e.target.value)}
                >
                  <option value="">General campus feedback</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} · {b.roomId}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your message">
                <textarea
                  required
                  maxLength={1500}
                  value={form.message}
                  onChange={(e) => mf("message", e.target.value)}
                  placeholder="What needs clarification?"
                />
              </Field>
              {error && <div className="error-box">{error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={close}>
                Cancel
              </button>
              <button className="btn primary" disabled={saving}>
                <Send size={16} />
                {saving ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.type === "assistant" && (
        <Modal
          title="A little help finding your space"
          eyebrow="CAMPUSFLOW SMART ASSIST"
          onClose={close}
        >
          <div className="modal-body">
            <div className="assistant-intro">
              <Sparkles size={30} />
              <p>
                Describe your plans. We’ll check capacity, permitted use and
                availability against stored bookings.
              </p>
            </div>
            <Field label="What are you planning?">
              <textarea
                value={assistant}
                onChange={(e) => setAssistant(e.target.value)}
                placeholder="Find a room for 70 students tomorrow at 11 am in IET"
              />
            </Field>
            <div className="chips">
              {[
                "70 students today at 10 am",
                "An exam for 150 students tomorrow at 9 am",
                "A practical for 40 students at 2 pm",
              ].map((p) => (
                <button key={p} onClick={() => setAssistant(p)}>
                  {p}
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
            <div className="info-strip">
              <Info size={17} />
              <p>
                Uses a scheduling algorithm, not an external AI API. Recognizes
                people count, today/tomorrow, time, building and purpose. Review
                the interpreted search filters before booking.
              </p>
            </div>
            {error && <div className="error-box">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn secondary" onClick={close}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={saving}
              onClick={runAssistant}
            >
              <Sparkles size={16} />
              {saving ? "Checking spaces…" : "Find my space"}
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "edit-room" && (
        <Modal
          title={"Configure " + modal.room.id}
          eyebrow="ADMINISTRATOR"
          onClose={close}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate(
                "room",
                {
                  ...form,
                  capacity: form.capacity === "" ? null : Number(form.capacity),
                },
                "Room configuration updated.",
              );
            }}
          >
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Capacity (blank = unknown)">
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={form.capacity}
                    onChange={(e) => mf("capacity", e.target.value)}
                  />
                </Field>
                <Field label="Availability">
                  <select
                    value={form.availability}
                    onChange={(e) => mf("availability", e.target.value)}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="unverified">Unverified</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </Field>
              </div>
              <Field label="Source / verification note">
                <input
                  required
                  maxLength={120}
                  value={form.source}
                  onChange={(e) => mf("source", e.target.value)}
                />
              </Field>
              <fieldset>
                <legend>Permitted uses</legend>
                {PURPOSES.map((p) => (
                  <label className="checkbox" key={p}>
                    <input
                      type="checkbox"
                      checked={form.uses.includes(p)}
                      onChange={(e) =>
                        mf(
                          "uses",
                          e.target.checked
                            ? [...form.uses, p]
                            : form.uses.filter((v: string) => v !== p),
                        )
                      }
                    />
                    {p}
                  </label>
                ))}
              </fieldset>
              <div className="info-strip">
                <ShieldCheck size={17} />
                <p>
                  Changes that invalidate active bookings are blocked until
                  those sessions are rescheduled or cancelled.
                </p>
              </div>
              {error && <div className="error-box">{error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={close}>
                Cancel
              </button>
              <button className="btn primary" disabled={saving}>
                {saving ? "Saving…" : "Save configuration"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.type === "import" && (
        <Modal
          title={
            "Import " +
            (modal.kind === "students" ? "student dataset" : "room records")
          }
          eyebrow="ADMINISTRATOR · CSV IMPORT"
          onClose={close}
          wide
        >
          <div className="modal-body">
            <p>
              {modal.kind === "students"
                ? "Required columns: id, name, branch, year, section, batch."
                : "Required columns: id, building, floor, capacity, uses, availability. Separate permitted uses with |."}{" "}
              Up to 500 rows per file. Existing IDs update; other records are
              preserved.
            </p>
            <label className="upload-zone">
              <Upload size={28} />
              <b>Choose your supplied CSV file</b>
              <span>CSV · Maximum 1 MB · Preview before importing</span>
              <input
                aria-label="Choose CSV file"
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  setFile(null);
                  setError("");
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    if (f.size > 1000000)
                      throw new Error("Use a CSV smaller than 1 MB.");
                    const rows = parseCSV(await f.text()),
                      required =
                        modal.kind === "students"
                          ? ["id", "name", "branch", "year", "section", "batch"]
                          : [
                              "id",
                              "building",
                              "floor",
                              "capacity",
                              "uses",
                              "availability",
                            ];
                    if (!required.every((k) => k in rows[0]))
                      throw new Error(
                        "Required columns: " + required.join(", "),
                      );
                    if (rows.length > 500)
                      throw new Error(
                        "Please split your file into batches of 500 rows.",
                      );
                    setFile({ name: f.name, rows });
                  } catch (err: any) {
                    setError(err.message);
                  }
                }}
              />
            </label>
            {file && (
              <>
                <div className="import-summary">
                  <CheckCircle2 size={18} />
                  <b>{file.name}</b>
                  <Tag color="green">{file.rows.length} rows parsed</Tag>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(file.rows[0]).map((k) => (
                          <th key={k}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {file.rows.slice(0, 5).map((r: any, i: number) => (
                        <tr key={i}>
                          {Object.entries(r).map(([k, v]) => (
                            <td key={k}>{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="form-note">
                  Preview of first five rows. Every record is validated before
                  the transaction is applied.
                </p>
              </>
            )}
            {error && (
              <div className="error-box" role="alert">
                {error}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn secondary" onClick={close}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!file || saving}
              onClick={() =>
                mutate(
                  "import",
                  { kind: modal.kind, rows: file.rows },
                  `${file.rows.length} records imported.`,
                )
              }
            >
              {saving ? "Validating & importing…" : "Validate & import"}
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "blueprint" && (
        <Modal
          title="Bring your real campus into view"
          eyebrow="UPLOAD OFFICIAL BLUEPRINT"
          onClose={close}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              setError("");
              try {
                if (!file) throw new Error("Choose a file.");
                const fd = new FormData();
                fd.set("file", file);
                fd.set("building", form.building);
                fd.set("floor", String(form.floor));
                const r = await fetch("/api/blueprint", {
                  method: "POST",
                  headers: { "X-CampusFlow": "1" },
                  body: fd,
                });
                const d: any = await r.json();
                if (!r.ok) throw new Error(d.error);
                await reload();
                close();
                setToast("Blueprint uploaded and linked to the campus map.");
              } catch (err: any) {
                setError(err.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="modal-body">
              <p>
                Attach the supplied plan. Uploaded files are shown separately
                from the illustrative floor map.
              </p>
              <div className="form-grid">
                <Field label="Building">
                  <select
                    value={form.building}
                    onChange={(e) => mf("building", e.target.value)}
                  >
                    <option>IET</option>
                    <option>Deeksha Bhawan</option>
                  </select>
                </Field>
                <Field label="Floor">
                  <select
                    value={form.floor}
                    onChange={(e) => mf("floor", +e.target.value)}
                  >
                    {[0, 1, 2].map((n) => (
                      <option key={n} value={n}>
                        {floorName(n)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <label className="upload-zone">
                <Layers size={29} />
                <b>{file?.name || "Choose the official blueprint"}</b>
                <span>PDF, PNG or JPEG · Maximum 10 MB</span>
                <input
                  aria-label="Choose blueprint file"
                  type="file"
                  required
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
              </label>
              {error && <div className="error-box">{error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={close}>
                Cancel
              </button>
              <button className="btn primary" disabled={saving || !file}>
                <Upload size={16} />
                {saving ? "Uploading…" : "Upload blueprint"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.type === "about" && (
        <Modal
          title="A working prototype, with clear boundaries"
          eyebrow="WHAT’S CONNECTED"
          onClose={close}
        >
          <div className="modal-body">
            <div className="connection">
              <CheckCircle2 size={21} />
              <div>
                <h3>Shared database & booking API</h3>
                <p>
                  Bookings, changes, notices and reports persist on the server.
                  Database rules prevent overlapping reservations, including
                  simultaneous requests.
                </p>
              </div>
            </div>
            <div className="connection">
              <ShieldCheck size={21} />
              <div>
                <h3>Role permissions & scheduling logic</h3>
                <p>
                  The API checks faculty, student and administrator actions. The
                  role selector is a judging simulation; institutional
                  authentication is not implemented. Smart Assist uses
                  constraint-based scheduling.
                </p>
              </div>
            </div>
            <div className="connection pending">
              <AlertTriangle size={21} />
              <div>
                <h3>Actual campus files still required</h3>
                <p>
                  The real blueprints and student/branch/batch datasets were not
                  attached. The map is illustrative. Bookings and students are
                  test data; Deeksha floor placements and capacities need
                  verification.
                </p>
              </div>
            </div>
            <div className="connection">
              <Upload size={21} />
              <div>
                <h3>Import tools are ready</h3>
                <p>
                  Switch to Administrator to import CSV records, configure rooms
                  and upload blueprints for both IET and Deeksha Bhawan.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn primary" onClick={close}>
              Got it
              <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
