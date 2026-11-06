# CampusFlow: three-minute judging walkthrough

1. **Problem (20 seconds):** One campus schedule across IET and Deeksha Bhawan reduces overlapping allocations and missed academic updates. Point out the prototype/test-data label.
2. **Discovery (30 seconds):** Filter by time, building, capacity and purpose. Show both campus buildings. Unknown labs cannot be booked.
3. **Conflict prevention (50 seconds):** On the seed date, IET20 is occupied 09:00–11:00. Attempt 10:00–11:00 with 60 people. The server rejects the clash and suggests alternatives. Choose one and confirm. If the seed date is in the past, first make a future booking and try another overlapping booking.
4. **Change management (30 seconds):** Open your new session. Reschedule to a free room in the other building. Show the automatically published notice and audit trail. Cancel to release the room and publish a reason.
5. **Student access (25 seconds):** Switch to Student. Booking controls disappear. Filter the schedule and report conflicting information without editing official reservations.
6. **Admin & data (25 seconds):** Switch to Administrator. Resolve the report, show CSV import preview, room settings and blueprint uploads for both buildings. State honestly whether actual supplied files have been imported.

## Requirements

| Requirement | Implementation |
|---|---|
| IET and Deeksha Bhawan | 27 room records across two buildings, with uncertainty labelled |
| Room discovery | Building, floor, room, date, time, duration, capacity, purpose |
| Faculty booking | Four purposes with capacity/use checks |
| Conflict prevention | Server checks plus database insert/update overlap triggers |
| Alternatives | Ranked rooms across buildings and later time slots |
| Schedule updates | Automatic reschedule/cancel notices and notice publisher |
| Students | Read-only schedule, group filters, CSV export, reports/comments |
| Roles | Server-enforced demonstration roles; institutional identity pending |
| Accountability | Audit history for important changes |
| Intelligent help | Constraint-based algorithm, simple natural-language input |
| Supplied blueprints | Uploads and per-building/floor access implemented; actual files still needed |
| Supplied student data | CSV validation/mapping and filtered schedule links implemented; actual data still needed |
| Submission | Git-managed source, code archive, setup documentation, test scripts and CI |

## Likely questions

**Is the assistant a live AI model?** No. It uses a scheduling algorithm, which the problem statement allows. It validates recommendations against the database, then validates the booking again before saving.

**What happens with two simultaneous bookings?** Database triggers reject overlapping inserts/updates. The tests submit competing inserts against the actual schema and require exactly one successful reservation.

**Is a lab definitely available?** Only when its record is confirmed, its capacity is known, its permitted uses match and no recorded booking overlaps. Otherwise it is unverified and cannot be booked.

**Are these the supplied campus blueprints and students?** Not until the actual files have been imported. The starter inventory comes from the brief; sample records and the schematic are clearly labelled. Do not make unsupported claims about missing datasets.

**Can students edit official bookings?** No. Student actions are restricted to reading and reporting. The demo selector is for judging, not production authentication.
