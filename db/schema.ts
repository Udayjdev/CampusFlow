import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  building: text("building").notNull(),
  floor: integer("floor").notNull(),
  type: text("type").notNull(),
  capacity: integer("capacity"),
  uses: text("uses").notNull(),
  features: text("features").notNull(),
  source: text("source").notNull(),
  availability: text("availability").notNull(),
});
export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id),
  title: text("title").notNull(),
  date: text("date").notNull(),
  start: integer("start").notNull(),
  end: integer("end").notNull(),
  purpose: text("purpose").notNull(),
  capacity: integer("capacity").notNull(),
  branch: text("branch").notNull(),
  year: text("year").notNull(),
  section: text("section").notNull(),
  batch: text("batch").notNull(),
  owner: text("owner").notNull(),
  faculty: text("faculty").notNull(),
  status: text("status").notNull(),
  test: integer("test").notNull(),
  created: text("created").notNull(),
});
export const notices = sqliteTable("notices", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull(),
  branch: text("branch").notNull(),
  year: text("year").notNull(),
  section: text("section").notNull(),
  batch: text("batch").notNull(),
  created: text("created").notNull(),
  author: text("author").notNull(),
  test: integer("test").notNull(),
});
export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id"),
  message: text("message").notNull(),
  author: text("author").notNull(),
  status: text("status").notNull(),
  created: text("created").notNull(),
});
export const audit = sqliteTable("audit", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  actor: text("actor").notNull(),
  created: text("created").notNull(),
});
export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  branch: text("branch").notNull(),
  year: text("year").notNull(),
  section: text("section").notNull(),
  batch: text("batch").notNull(),
  source: text("source").notNull(),
});
export const blueprints = sqliteTable("blueprints", {
  id: text("id").primaryKey(),
  building: text("building").notNull(),
  floor: integer("floor").notNull(),
  name: text("name").notNull(),
  key: text("key").notNull(),
  mime: text("mime").notNull(),
  uploaded: text("uploaded").notNull(),
});
export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  role: text("role").notNull(),
  expires: integer("expires").notNull(),
});
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
