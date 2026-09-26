# hackathon-2026 — UniMap

Uni buddy-finder for University of Adelaide and Flinders students.

## Hosted API (for the mobile app)

Base URL: **https://hackathon-2026-map.bookmountain.work**, with Swagger at
[/swagger](https://hackathon-2026-map.bookmountain.work/swagger).

- It has the same demo data as local dev. Log in as Koala_Kai (`a1900000@adelaide.edu.au`,
  `password123`) or any student in `students.json`.
- There's no real email yet, so `POST /api/auth/register` returns the verification code as `devCode`. Pass
  it straight to `/api/auth/verify`.
- Send `Authorization: Bearer {accessToken}` on every call. For chat and live meetup headcounts, connect
  SignalR to `wss://hackathon-2026-map.bookmountain.work/hubs/chat?access_token={jwt}`.
- Images come back as full URLs that last 24 hours, so load them as they are.

Every push to `main` or `deploy` that touches `backend/` redeploys it
(`.github/workflows/deploy-api.yml`). The workflow builds on GitHub, then a self-hosted runner on the
server runs `docker-compose.prod.yml`. Secrets are in `/work/hackathon-2026/.env` on the server, not in git.

## Backend quick start

Requires Docker (with Compose v2). No local .NET SDK needed.

```bash
cp .env.example .env        # optional, defaults work
docker compose up --build   # first run restores NuGet packages, ~1 min
```

| What        | Where                                                       |
|-------------|-------------------------------------------------------------|
| Swagger UI  | http://localhost:8080/swagger                               |
| Health      | http://localhost:8080/health                                |
| Postgres    | `localhost:5432`, db/user/password `unimap` (use DBeaver)   |
| Redis       | `localhost:6379`                                            |
| Mailpit     | http://localhost:8025 (catches all outgoing email in dev)   |

Code in `backend/` is bind-mounted, and `dotnet watch` hot-reloads on save. It restarts
automatically when an edit can't be hot-applied.

Differences between the UCompass prototype and this API, for the app to handle, are listed in
[FRONTEND-GAPS.md](FRONTEND-GAPS.md).

### Auth flow

1. `POST /api/auth/register` `{ email, password }`: the email must be `@adelaide.edu.au`,
   `@flinders.edu.au`, or a subdomain of either. In Development the response includes `devCode`,
   and the code is also printed in the `api` logs.
2. `POST /api/auth/verify` `{ email, code }` returns `accessToken`, `consentComplete` and
   `onboardingComplete`. These tell the app which screen comes next.
3. In Swagger, click **Authorize** and paste the token.
4. **Consent first.** `GET /api/consents` returns the 4 consents and their wording. `PUT /api/consents`
   with `{ terms, location, ageAndEnrolment, usageStats }`; the first three are required. Until they're
   granted, everything except `/api/me`, `/api/consents` and the auth endpoints returns
   `403 { code: "consent_required" }`. Every answer is kept with a timestamp, and withdrawing a required
   consent locks the app again.
5. Pick a degree with the three dropdown endpoints: `GET /api/degrees/levels` → `/api/degrees/colleges`
   → `/api/degrees`. There's also a `search` parameter for a type-ahead box.
6. `PUT /api/me/profile` with the onboarding answers, including `degreeId`. The department is filled in
   from the degree. `GET /api/meta/options` lists the suggested tags.

### Flats (flatmate finder)

All of these need a login token, except `options`.

- `GET /api/flats/options`: chip options for the "List a room" form, plus campus locations for the map.
- `GET /api/flats`: search, for both the map and the list view. Filters are `maxRent`, `maxBills`,
  `furnished`, `toilet`, `features`, a map viewport (`minLat`…`maxLng`), and
  `campus` + `maxWalkMinutes`. `sort` is `newest`, `cheapest` or `nearest`.
- `GET /api/flats/{id}`: room detail, with walk times to every campus and the owner's nickname, major
  and avatar.
- `POST /api/uploads/flat-photo`, then `POST /api/flats`: upload up to 5 photos, then list the room.
  Photos are stored one R2 folder per listing, `flats/{listingId}/`. The first upload returns a new
  `listingId`. Send it with the remaining photos, and as `id` when creating the listing.
- `PUT /api/flats/{id}`, `PUT /api/flats/{id}/status` (`Active` or `Taken`), `DELETE /api/flats/{id}`,
  `GET /api/flats/mine`.

Other students see each pin rounded to about 100 m; only the owner sees the exact spot.

### Market (second-hand items)

All of these need a login token, except `options`.

- `GET /api/items/options`: categories and conditions (value + label to show), the three safe pickup
  points, and the photo limit.
- `GET /api/items`: search, for both the map and the grid. Filters are `category` (the chips; leave it
  out for "All"), `search` (title or description), `pickupPoint`, `maxPrice` and a map viewport
  (`minLat`…`maxLng`). `sort` is `newest` or `cheapest`. Sold items are left out unless `includeSold=true`:
  the prototype's grid shows them greyed out, its map doesn't.
- `GET /api/items/pickup-points`: the ★ pins, with how many items are waiting at each (pass `category`
  to match the selected chip). Tapping one lists its items: `GET /api/items?pickupPoint={id}`.
- `GET /api/items/{id}`: item detail, with the seller's nickname, major, uni and avatar. `isMine` means
  show "Your listing"; availability `Sold` means show a disabled "Sold" button.
- `POST /api/uploads/item-photo`, then `POST /api/items`: upload 1 to 5 photos, then post the item.
  Photos are stored one R2 folder per item, `items/{itemId}/`. The first upload returns a new `itemId`.
  Send it with the remaining photos, and as `id` when creating the item. A photo is required, and the
  server checks it was actually uploaded.
- `PUT /api/items/{id}`, `PUT /api/items/{id}/availability` (`Now`, `From` + `availableFrom`, `Pending`
  or `Sold`), `DELETE /api/items/{id}`, `GET /api/items/mine`.
- Pickup is either a safe pickup point (`pickupPointId`) or the seller's own pin (`lat`, `lng` and an
  optional `placeName`). Other students see a seller's own pin rounded to about 100 m; pickup points
  are exact.
- Condition is `New`, `LikeNew`, `Excellent`, `Good` or `Fair`, plus an optional note. `conditionLabel`
  is ready to show, e.g. "Good — some highlighting".
- "Message seller" is `POST /api/chats` with `{ itemId, text }` (see below).

### Meetups (walk-in events)

All of these need a login token, except `options`. **Hosts and guests are anonymous:** no endpoint says
who hosts an event or who's going, only the headcount (`goingCount`) and whether *you* are hosting
(`isHost`) or going (`isGoing`).

- `GET /api/events/options`: the four types (`Study`, `Casual`, `Social`, `Food`), the preset places (the
  three safe pickup points) and the capacity slider's range (4 to 60, default 20).
- `GET /api/events`: upcoming events, soonest first, for both the map and the list. Filters are `type` and a
  map viewport (`minLat`…`maxLng`). Events that have ended are left out: after `endsAt`, or 2 hours after
  the start when there's no end time. Events happening now are included (`isHappeningNow`).
- `GET /api/events/{id}`: event detail. Show the host as "Hosted anonymously · Verified student host".
- `POST /api/events` ("Publish event"): `title`, `type`, `startsAt` (with a UTC offset, e.g.
  `2026-09-29T19:00:00+09:30`; convert the datetime-local input first), optional `endsAt`, `description`,
  `capacity` and `walkInsWelcome` (default true). The place is either `placeId` (a preset, with an optional
  `placeName` like "Barr Smith Library, Level 2") or `lat`/`lng` with `placeName` ("Name this spot",
  default "Pinned location"). The host is counted as going.
- `POST /api/events/{id}/join` and `DELETE /api/events/{id}/join`: the Join / "Going ✓" toggle. Both return
  the updated card and do nothing if you're already in (or out). Joining a full or finished event returns 409.
  The prototype's toast is "You're in. Just walk in — no one sees your name."
- `GET /api/events/mine` (events you host, past ones too), `GET /api/events/going` (upcoming events
  you've joined), `PUT /api/events/{id}` and `DELETE /api/events/{id}` (host only; capacity can't go below
  the number already going).
- Labels are ready to show, in Adelaide time: `dayLabel` "TUE", `dateLabel` "29", `timeLabel` "7:00 pm" for
  the list card, and `whenLabel` "Tue 29 Sep · 7:00–9:30 pm" for the detail page.
- Event places are exact, so people can find them. Nothing links a place to its host.
- Real time on `/hubs/chat`: `eventGoing` (`{eventId, goingCount}`) goes to everyone when someone joins or
  leaves; `eventUpdated` (`{eventId}`) and `eventCancelled` (`{eventId, title}`) go to the people going.
- There's no "Message host" button, since the host is anonymous.

### Chats (messaging)

One chat per pair of students. Other people only see your nickname, major, uni and avatar.

- `POST /api/chats` with `{ flatId, text }`: the "Message tenant" button. Opens or reuses the chat with
  the listing's owner and adds an "About: {listing} · $rent/wk" line.
- `POST /api/chats` with `{ itemId, text }`: the "Message seller" button. Adds an "About: {title} · $price"
  line. The prototype pre-fills the text as "Hi! Is the {title} still available?". Sold items return 409.
- Use `{ userId, text }` to message a student directly.
- `GET /api/chats`: your chats, with the last message and unread count.
- `GET /api/chats/{id}/messages` (page back with `before`), `POST /api/chats/{id}/messages`,
  `POST /api/chats/{id}/read`.
- Real time: connect SignalR to `/hubs/chat?access_token={jwt}`. The server sends `message`, `read` and
  `typing` events (and the meetup events above). Call the hub method `Typing(conversationId)` to show "•••" to the other person.

Koala_Kai (`a1900000@adelaide.edu.au`) has 3 seeded chats, 2 with unread replies. One of them is the
prototype's: TomTheTutor messaging about his Calculus textbook.

### Demo data

In Development, an empty database is seeded from `backend/src/UniMap.Api/Data/Seed/`:
- `students.json`: 48 fictional students with real degrees, including the 8 characters from the
  UCompass prototype, e.g. Koala_Kai = `a1900000@adelaide.edu.au`, hana_k = `hkim0044@flinders.edu.au`.
  The password is `password123` for everyone.
- `flats.json`: 20 room listings on real Adelaide streets near each campus. Pins were placed with
  OpenStreetMap, then moved slightly so they don't point at a specific house.
- `items.json`: 21 market items: the prototype's 6 plus 15 more, at the three pickup points or on real
  streets. "Available from" dates and posted times are relative to when the database is seeded.
- `events.json`: 16 walk-in meetups, the prototype's 4 plus 12 more at real places in the city and at
  Bedford Park and Mawson Lakes. Each is set on a weekday and time (Adelaide), always within the coming
  week: once one finishes, it moves to next week with its seeded headcount (checked on startup and
  hourly). Koala_Kai hosts one and is going to another.
- Images are already in R2, in the same layout as real data. Every folder is named after a database id:
  - `avatars/{userId}/avatar.png`: CC0 avatars
  - `flats/{listingId}/01-bedroom.jpg` and so on: openly licensed room photos
  - `items/{itemId}/01.jpg` and so on: openly licensed item photos

  Seeded students, listings and items have fixed ids (in `students.json`, `flats.json` and
  `items.json`), so a row's id in DBeaver is its R2 folder name. Credits are in `avatars.json`,
  `flat-photos.json` and `item-photos.json`. Seeded meetups have fixed ids too (`events.json`), but no
  images.

Run `docker compose down -v && docker compose up` to reseed.

Allowed email domains are in `appsettings.json` → `Universities:Domains`.

The degree lists (Adelaide University and Flinders, researched from their websites) load into the
`degrees` table on startup, from `backend/src/UniMap.Api/Data/Seed/*.csv`. Known data issues are in
[TODO.md](TODO.md).

### Database migrations (EF Core)

Migrations are applied automatically on startup. After changing entities in `Domain/`:

```bash
docker compose exec api dotnet ef migrations add <Name> --project src/UniMap.Api -o Data/Migrations
```

To start again from an empty database, run `docker compose down -v`.

### Email

By default, verification emails go to the local Mailpit container, where you can read them at
http://localhost:8025. To send real email, set `SMTP_*` in `.env`. `.env.example` has settings for
Resend and Gmail.

### Images (Cloudflare R2)

Put your R2 API token keys in `.env` as `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`. The account
ID and bucket are already filled in. The client calls `POST /api/uploads/avatar` to get a presigned
URL, sends the image to that URL with `PUT`, then saves the returned `key` as `avatarKey` on the
profile. If the bucket isn't public, avatar URLs are presigned GET links that last 24 hours.

### Layout

```
backend/src/UniMap.Api/
  Controllers/   Auth, Me (profile), Degrees (dropdowns), Flats (listings), Items (market),
                 Events (meetups), Chats, Consents, Uploads, Meta
  Domain/        Entities + tag catalog
  Data/          DbContext + migrations
  Services/      JWT, Redis verification codes, R2 storage, email (SMTP, or Mailpit in dev)
```
