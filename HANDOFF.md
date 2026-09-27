# Handoff: UCompass backend, next features

For the next Claude Code session. Read this first, then `README.md` (API and setup), `TODO.md`
(known gaps) and `FRONTEND-GAPS.md` (where the app must differ from the prototype). Written 2026-09-26; updated the same day after the marketplace and meetups were built.

**Your job, in order:** 1. ~~Marketplace~~ (done on the `marketplace` branch) → 2. ~~Meetups~~ (done on the
`meetups` branch) → 3. People on the map. One feature branch each.

---

## 1. Product and design source

- **UCompass** (hackathon theme "Map"): a campus-map app for **Adelaide University** and **Flinders**
  students with three tabs, **Flats**, **Market** and **Meetups**. Every feature lives on its own map.
- The **design prototype** is now `UCompass Demo v4.dc.html` in `~/Downloads/UCompass hackathon demo (2).zip`
  (2026-09-27). It adds Dcard, a search box on every tab, AI photo analysis, address lookup and an
  avatar builder; the API side is on the `dcard` branch, and FRONTEND-GAPS lists the app's part. The
  original (below) was `~/Downloads/UCompass hackathon demo.zip`. Unzip it into your scratchpad.
  `UCompass Demo.dc.html` holds all the UI; its sample data and logic are in the big `<script>` block
  (`class Component`: arrays `P` people, `PK` pickup spots, `F` flats, `state.items`, `state.events`).
  The specs in section 5 were extracted from it; check the prototype when something's unclear.
- **The prototype's 8-step demo script:** 1 verified uni login ✅ · 2 consent first ✅ · 3 every feature
  has its own map ⚠️ · 4 message a tenant ✅ · 5 flats by students ✅ · 6 list a room ✅ · 7 marketplace ✅ (branch `marketplace`) ·
  8 walk-in meetups ✅ (branch `meetups`). "People" pins with Connect and Wave appear on the maps too ❌.

## 2. Current state

- **`main`** has auth, degrees, flats, R2 photos, messaging and SignalR, consent, and the deploy workflow.
  It's pushed. **Don't push `main` without asking the user:** every push to `main` or `deploy` that
  touches `backend/` redeploys the hosted API (`.github/workflows/deploy-api.yml`).
- **`marketplace`** (local, not pushed or merged) adds the Market tab. See README "Market" and
  `deliverable/market-fields.txt`.
- **`meetups`** (local, not pushed or merged) is built on top of `marketplace`, because meetups reuse its
  `PickupPoints`. It adds the Meetups tab. See README "Meetups" and `deliverable/meetup-fields.txt`.
  Merging `meetups` into `main` brings the marketplace with it. Build people-on-the-map on top of it.
- **Branches:** `flatmate`, `messaging` and `consent` are already merged into `main`. `backend-setup` is
  old. A `deploy` branch and `origin/flatmate` were created by **someone else**.
- The deploy files (`.github/workflows/deploy-api.yml`, `docker-compose.prod.yml`) are committed now.
  Still stage files by path, never `git add -A`.
- **The user's dev database** (`unimap` on `localhost:5432`) predates fixed user ids. They've been told to
  run `docker compose down -v && docker compose up -d --build`. Their API container was last seen
  stopped. If `:8080` doesn't answer, ask them to start it; don't assume.

## 3. Working environment (important)

- **Your shell has no Docker access** (`permission denied` on the socket), so you can't see container
  logs. Postgres and Redis are reachable from the host on `localhost:5432` and `localhost:6379`.
- **No .NET SDK is installed on the host.** Install one into your scratchpad:
  `curl -sSL https://dot.net/v1/dotnet-install.sh -o di.sh && bash di.sh --channel 10.0 --install-dir <scratchpad>/dotnet`,
  then `export PATH=<scratchpad>/dotnet:$PATH DOTNET_ROOT=<scratchpad>/dotnet`.
  `dotnet ef` comes from the tool manifest: `cd backend && dotnet tool restore`.
- **Migrations:** `cd backend/src/UniMap.Api && dotnet ef migrations add <Name> -o Data/Migrations`.
  **Gotcha:** rebuild after adding a migration before `dotnet run --no-build`, or startup fails with
  `PendingModelChangesWarning`.
- **How we test** (every feature was verified this way before committing):
  1. Load `.env` and map it for the app: `R2__AccountId=$R2_ACCOUNT_ID` and so on (see `docker-compose.yml`).
  2. Run the API on a spare port against a **scratch database**:
     `ConnectionStrings__Postgres="Host=localhost;Port=5432;Database=unimap_scratch;Username=unimap;Password=unimap" ASPNETCORE_ENVIRONMENT=Development dotnet run --no-build --no-launch-profile --urls http://localhost:5099`
  3. Test with curl, plus a small SignalR client for real-time events (a console app using
     `Microsoft.AspNetCore.SignalR.Client`).
  4. Clean up: stop the server, `dotnet ef database drop --force` with the same connection string (dry-run
     first), and delete any test objects you uploaded to R2.

  Gotchas: Mailpit isn't reachable from the host, so set `Email__Host=` (empty) to log codes instead,
  or register returns 500. The shell is zsh, so `set -- $VAR` doesn't split words. And `pkill -f
  <pattern>` kills your own shell if the pattern appears in the same command line: put the stop
  command in a script file.
  Never test against the user's `unimap` database. Only run against it to apply seeder syncs,
  and say so when you do.
- **R2 scripting:** Python with `boto3` in a venv in your scratchpad (`python3 -m venv` lacks pip here:
  use `--without-pip` plus `get-pip.py`). Endpoint `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region `auto`, path-style, and `request_checksum_calculation='when_required'` (R2 rejects the newer
  checksum headers). Never print the secret key.
- **Geocoding:** OpenStreetMap Nominatim, max 1 request per second, with a descriptive User-Agent.
  **Photos:** Openverse API, `license=cc0,pdm` only.

## 4. Conventions: follow these exactly

The user was (rightly) angry when these were done inconsistently. **Settle a convention for the whole
feature before creating anything, and state it in one line to the user if it isn't one of these.**

- **R2 keys = `{entity}/{databaseId}/...`**, the same for seed and real data, with no `seed/` folder.
  Existing: `avatars/{userId}/avatar.png`, `flats/{listingId}/01-bedroom.jpg`. Use
  `items/{itemId}/01.jpg` for market photos. Meetups have no photos in the design.
  Upload flow (copy `POST /api/uploads/flat-photo`): the first upload issues the id, later uploads
  and the create call send it (`id` on create), and the server only accepts keys under
  `{entity}/{thatId}/`.
- **Seed data:** fixed GUIDs, `uuid5(NAMESPACE_URL, "https://unimap.seed/{entity}/{label}")`, in
  `backend/src/UniMap.Api/Data/Seed/*.json`. People are **fictional** (reuse the 48 students in
  `students.json`; `p01` Koala_Kai is the Swagger login `a1900000@adelaide.edu.au` / `password123`).
  Places are **real**, looked up in OSM. Images are **openly licensed**; look at every one yourself
  before use (no people, readable addresses or watermarks, nothing un-Adelaide like snow), and record
  credits in a JSON manifest. **Never scrape** marketplace or rental sites.
- **Seeder** (`Data/DevSeeder.cs`) is idempotent. It seeds empty tables, and **syncs** existing
  databases (see `SyncPhotosAsync` and `SyncAvatarsAsync`) so nobody has to wipe theirs.
- **Auth:** a plain `[Authorize]` means signed in **and** consented (`ConsentRequirement`). Use
  `[Authorize(Policy = ConsentPolicy.SignedInOnly)]` only for screens before consent. Careful: class and
  method `[Authorize]` attributes **combine**, they don't override.
- **Location privacy:** listings show pins to others rounded to ~100 m (`LocationPrivacy.Blur`). People on
  the map must be **snapped to a campus zone, never an exact spot**, and only for users whose
  **`Location` consent** is granted.
- **Chats:** "Message seller" and "Connect" reuse `POST /api/chats` (`ChatAboutType.Item` and
  `ChatService.AddAboutItemAsync` exist). Events have no "About" chat on purpose: the host is anonymous.
- **API style:**
  - Enums as strings (integers are rejected).
  - A `ProblemDetails` body for every 4xx.
  - XML docs on endpoints and DTOs.
  - **A Swagger example for every request DTO** (`Swagger/RequestExamplesFilter.cs`); the user wants
    every field pre-filled.
- **Docs:** a README section per feature, deferred work in `TODO.md`. Anything for the PM goes in
  `deliverable/` as **plain text** (pasted into Trello: no markdown tables, checklist lines without
  bullets).
- **Commits:** one per phase on the feature branch, with a subject line and a body. End every message
  with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Before saying "done":** check the whole result, not just what you touched: the whole R2 prefix,
  the whole API surface, Swagger. Report failures plainly.

## 5. Specs from the prototype

### 5.1 Marketplace (tab "Market", button "Sell")

- **Item:** title, price ($, whole dollars), description, **photo required** (the UI blocks posting
  without one; allow up to 5), category, condition, availability, pickup location, seller, posted time.
- **Categories:** Textbooks · Tech · Furniture · Kitchen · Study gear (the filter chips add "All").
  Search box placeholder: "Search textbooks, desks, tech…".
- **Condition:** samples say "Like new", "Excellent", "Good", "Good — some highlighting", "Worn once".
  Suggest an enum (`New, LikeNew, Excellent, Good, Fair`) plus an optional note.
- **Availability** (a segmented control): **Now**, **From {date}**, **Pending**. **Sold** also exists; a
  sold item shows a disabled "Sold" button. The owner sees "Your listing".
- **Pickup:** one of three **safe pickup points**, or "drop your own pin". Look up their coordinates:
  - Adelaide Railway Station: "North Tce concourse · staffed, CCTV"
  - Flinders City Campus: "Festival Plaza entrance"
  - Barr Smith Library: "Main entrance, Adelaide Uni"

  Map hint: "★ Safe pickup points · tags = seller pins". Tapping a pickup point lists the items there.
- **Detail page:** photos, price, availability, condition, posted time, description, pickup name and
  note, and the seller's nickname, major, uni and avatar. CTA **"Message seller"** opens a chat with
  "About: {title} · ${price}" and the prefilled text "Hi! Is the {title} still available?".
- **Prototype seed items** (sellers are prototype people, which are p01–p08 in `students.json`):
  - Calculus textbook (Stewart, 8th ed.): $35, Textbooks, Barr Smith, TomTheTutor
  - LED desk lamp (USB): $12, Furniture, Railway Station, OmarOnCampus
  - iPad 9th gen + Apple Pencil: $320, Tech, Pending, Flinders City, Koala_Kai
  - Rice cooker, 5-cup: $25, Kitchen, from 1 Oct, own pin on Rundle St East, ZoeDesigns
  - Mesh office chair: $40, Furniture, own pin on Pulteney St, MiaReads
  - Lab coat + safety glasses: $15, Study gear, **Sold**, Flinders City, lena.l

  Add about 15 more realistic ones.
- The prototype's seeded chat is TomTheTutor → Kai about the Calculus textbook. Seed that as an Item
  chat once items exist.

### 5.2 Meetups (tab "Meetups", button "Host") ✅ built on the `meetups` branch

- **Event:** title, type **Study · Casual · Social · Food**, date and time (the samples show an end time
  too, e.g. "7:00–9:30 pm"), description, place, **capacity**, going count.
- **Place:** one of the three safe pickup points (reuse `PickupPoints` in `Domain/Market.cs`), or "Drop a pin on the map" plus a place name
  (e.g. "Barr Smith Library, Level 2").
- **Rules:** "Walk-ins welcome · No RSVP needed to turn up". "Host anonymously · Always on — guests are
  hidden too". **The API must never expose who hosts or who's going**, only the count and whether *you*
  joined. Join and leave are toggles ("Going ✓"), and joining shows the toast "You're in. Just walk in —
  no one sees your name."
- **List card:** day, date, type, title, time and place, going/capacity. Map hint: "Walk-in events ·
  host & guests hidden". Hide past events.
- **Prototype seed events:**
  - Stats cram — walk-ins welcome: Study, Tue 7:00–9:30 pm, Barr Smith Library L2, 14/30
  - Torrens riverbank walk + coffee: Casual, Sun 9:30 am, Adelaide Railway Station front steps, 9/20
  - Board games & pizza night: Social, Fri 6:00 pm, Flinders City Campus L1 lounge, 22/40
  - International students cook-off: Food, Sat 5:30 pm, Gouger St community kitchen, 11/16

  Store seed dates relative to "now", like `flats.json`'s `availableInDays`, so they never go stale.

### 5.3 People on the map (a layer on every map)

- **Pin sheet:** avatar, nickname, major, uni. Buttons **Connect** (opens a chat; the prototype adds the
  line "Connected from the map") and **Wave** (the toast "Wave sent to {nick}", a lightweight ping).
- **Privacy (consent screen wording):** "Location is approximate · Snapped to a campus zone, never your
  exact spot or home address." Needs the `Location` consent. Also add a "show me on the map" toggle.
- **Design this with the user before building.** Suggestion: the app sends lat/lng, the server snaps it
  to the nearest campus zone (the six in `Domain/Campuses.cs`, or finer zones), stores **only the zone
  and a timestamp**, never raw coordinates, and shows people active in the last N hours. Waves could be
  a small table plus a SignalR `wave` event on `/hubs/chat`.
- The prototype code also has an unused **"Find a study mate"** form (course, level
  Undergraduate/Graduate/Alumni, skills like Python and Statistics, "closer to you = better fit").
  It's not in the demo script, so treat it as optional.

## 6. Open PM decisions (don't decide these yourself)

- **Profile:** the design shows only nickname, major and an optional *preset colour* avatar. Ours has
  degree dropdowns, gender, pronouns, bio, habits, interests and a photo avatar. Chats and flats show
  the full degree name as "major".
- Whether the app shows the name "Adelaide University". Habits as free tags or fixed questions.

## 7. About the user

- Backend owner at a hackathon. The PM decides the fields; a teammate builds the frontend on a
  `frontend` branch.
- Direct and quick to get frustrated by sloppiness or piecemeal fixes. They value consistency,
  realistic demo data, and being told plainly what's done and what isn't.
- Before anything outward-facing (pushing, especially to `main`), ask.
