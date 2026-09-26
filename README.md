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

Code in `backend/` is bind-mounted, and `dotnet watch` hot-reloads on save. It restarts
automatically when an edit can't be hot-applied.

### Auth flow

1. `POST /api/auth/register` `{ email, password }`: the email must be `@adelaide.edu.au`,
   `@flinders.edu.au`, or a subdomain of either. In Development the response includes `devCode`,
   and the code is also printed in the `api` logs.
2. `POST /api/auth/verify` `{ email, code }` returns `accessToken`.
3. In Swagger, click **Authorize** and paste the token.
4. `PUT /api/me/profile` with the onboarding answers (department, gender, habits, interests…).
   `GET /api/meta/options` lists the suggested tags.
5. `GET /api/buddies/suggestions` returns ranked matches. `POST /api/buddies/{userId}/request`,
   then the other user accepts via `/api/buddies/connections/{id}/accept`.

Allowed email domains are in `appsettings.json` → `Universities:Domains`.

### Database migrations (EF Core)

Migrations are applied automatically on startup. After changing entities in `Domain/`:

```bash
docker compose exec api dotnet ef migrations add <Name> --project src/UniMap.Api -o Data/Migrations
```

To start again from an empty database, run `docker compose down -v`.

### Images (Cloudflare R2)

Fill the `R2_*` values in `.env`. The client calls `POST /api/uploads/avatar` to get a presigned
URL, sends the image to that URL with `PUT`, then saves the returned `key` as `avatarKey` on the profile.

### Layout

```
backend/src/UniMap.Api/
  Controllers/   Auth, Me (profile), Buddies (matching + requests), Uploads, Meta
  Domain/        Entities + tag catalog
  Data/          DbContext + migrations
  Services/      JWT, Redis verification codes, matching, R2 storage, email (logs only for now)
```
