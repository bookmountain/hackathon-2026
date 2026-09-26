# hackathon-2026 — UniMap

Uni buddy-finder for University of Adelaide and Flinders students.

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

### Auth flow

1. `POST /api/auth/register` `{ email, password }`: the email must be `@adelaide.edu.au`,
   `@flinders.edu.au`, or a subdomain of either. In Development the response includes `devCode`,
   and the code is also printed in the `api` logs.
2. `POST /api/auth/verify` `{ email, code }` returns `accessToken`.
3. In Swagger, click **Authorize** and paste the token.
4. Pick a degree with the three dropdown endpoints: `GET /api/degrees/levels` → `/api/degrees/colleges`
   → `/api/degrees`. There's also a `search` parameter for a type-ahead box.
5. `PUT /api/me/profile` with the onboarding answers, including `degreeId`. The department is filled in
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

### Demo data

In Development, an empty database is seeded from `backend/src/UniMap.Api/Data/Seed/`:
- `students.json`: 48 fictional students with real degrees, including the 8 characters from the
  UCompass prototype, e.g. Koala_Kai = `a1900000@adelaide.edu.au`, hana_k = `hkim0044@flinders.edu.au`.
  The password is `password123` for everyone.
- `flats.json`: 20 room listings on real Adelaide streets near each campus. Pins were placed with
  OpenStreetMap, then moved slightly so they don't point at a specific house.
- Images are already in R2 under `seed/`: CC0 avatars in `seed/avatars/`, and openly licensed room
  photos in one folder per listing, `seed/flats/f01/01-bedroom.jpg` and so on. Credits are in
  `avatars.json` and `flat-photos.json`.

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
  Controllers/   Auth, Me (profile), Degrees (dropdowns), Flats (listings), Uploads, Meta
  Domain/        Entities + tag catalog
  Data/          DbContext + migrations
  Services/      JWT, Redis verification codes, R2 storage, email (SMTP, or Mailpit in dev)
```
