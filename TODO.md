# TODO: fix after the hackathon

Things we chose not to fix yet. Newest first within each section.

## Degree data

The course lists were researched from each uni's website on 2026-09-26. Details are in
`deliverable/degrees/*-notes.md`.

- [ ] **Flinders college names are mixed.** Flinders reorganised from 6 colleges to 5, but most course
      pages (and the 2026 Handbook) still use the old names. 16 PhD rows use the new names, so the college
      dropdown shows both. We need an old→new mapping; we found no official one.
- [ ] **Courses with no college.** 28 Adelaide and 17 Flinders courses don't name a college on their page.
      They show under "Other" in the college dropdown.
- [ ] **Students on older degrees may be missing.** The Adelaide list is Adelaide University's 2027
      intake, so a student still on a pre-merger University of Adelaide or UniSA degree may not find it.
      Flinders courses that only appear in the sitemap (about 30) were treated as retired, but some may
      still have students. Consider a "My degree isn't listed" option that falls back to typing the
      department.
- [ ] **Double degrees with two colleges** (1 at Adelaide) are filed under the first college only.
- [ ] **Merged duplicates.** Rows with the same name at the same level are merged into one dropdown entry:
      1-year honours and 4-year honours degrees, and online and on-campus versions of a course. That's
      12 rows. Their campuses are combined, and only the first row's URL is kept.
- [ ] **Campus names are inconsistent**, e.g. "Mt Gambier", "Adelaide City Campus East", "Open
      Universities Australia", "Online". Tidy them before building the campus map feature.
- [ ] **Updating the degree list.** `DegreeSeeder` only loads into an empty `degrees` table, so edits to
      the CSVs don't reach existing databases. Add a sync keyed on university + level + name.
- [ ] **The CSVs exist twice**: `deliverable/degrees/` (for the PM) and
      `backend/src/UniMap.Api/Data/Seed/` (what the app loads). Keep them in step, or pick one.

## Flats

- [ ] **Deleted listings leave their photos in R2.** Delete the objects when a listing is deleted, and
      clean up uploads that never get attached to a listing.
- [ ] **Uploads aren't checked.** `photoKeys` only verifies the key prefix, not that the file exists,
      is an image, or is a reasonable size.
- [ ] **Walk times are estimates:** straight-line distance × 1.25 at 4.8 km/h. A routing service
      (OSRM, or Mapbox/Google) would give real walking times, plus public transport, which matters more
      for suburbs like Glenelg or Prospect.
- [ ] **Messaging.** The prototype's "Message tenant" needs a chat API. Market and meetups need it too.
- [ ] **Profile mismatch with the prototype.** UCompass shows only nickname, major, uni and an optional
      preset avatar. Our profile still has gender, pronouns, bio, habits and interests. The PM or designer
      should pick one.

## Market

- [ ] **Deleted items leave their photos in R2**, like flats. Delete `items/{id}/` when an item is deleted,
      and clean up uploads that never get attached to an item.
- [ ] **Flats don't check that photos were uploaded.** Items do (`StorageService.ExistsAsync`), because a
      photo is required. Flats could use the same check.
- [ ] **Uploads aren't size-checked.** The presigned URL fixes the content type, not the file size.
- [ ] **"Available from" uses the UTC date**, so it can flip to "Now" up to 9.5 hours before midnight in
      Adelaide. The same goes for the check that a new date is in the future.
- [ ] **No report or block** for scam listings. The consent screen promises "Report & block in one tap".
- [ ] **The prototype's Sell form has no category or condition inputs** (it hardcodes "Study gear" and
      "Good"). The API requires both, so the frontend needs to add them.

## Privacy

- [ ] **Account deletion.** The consent screen promises "Delete your account and data anytime". There's no
      endpoint yet. It should also delete the user's R2 folders (`avatars/{userId}/`, their `flats/{id}/`).
- [ ] **Terms of Use and Privacy Policy text.** Consent points to documents that don't exist yet.
      `ConsentPolicy.Version` should change whenever they do, which asks everyone to consent again.
- [ ] **Usage-stats consent** is recorded but nothing collects stats yet. Check it before adding analytics.

## Chats

- [ ] **Block and report.** The consent screen promises "Report & block in one tap". Blocked users
      shouldn't be able to open a chat.
- [ ] **Rate-limit** chat creation and sending, to stop spam to strangers.
- [ ] **Push notifications** (Expo, FCM or APNs) for when the app is closed. SignalR only reaches open apps.
- [ ] **Scaling out:** with more than one API instance, SignalR needs a Redis backplane
      (`AddStackExchangeRedis`). Redis is already running.
- [ ] Chats about meetups. `ChatAboutType` has `Flat` and `Item` so far.

## Removed profile fields

- [ ] **Age range and Nationality** (removed by the PM on 2026-09-26). The API still accepts them, but
      ignores them, doesn't return them, and marks them deprecated in Swagger. Once the frontend has
      stopped sending them:
  - remove them from `UpsertProfileRequest`
  - add a migration that drops `profiles.age_range` and `profiles.nationality`; they still hold values
    written before the change
  - delete the `AgeRange` enum

## Email

- [ ] **No real email yet.** Codes go to Mailpit, a fake inbox at localhost:8025. To reach real student
      inboxes without landing in Microsoft 365 junk, buy a domain and send through Resend, with SPF, DKIM
      and DMARC records set up. It's settings only: the `SMTP_*` values in `.env`.
- [ ] Stop returning `devCode` from register once real email works (it's only returned in Development).

## Security, before any public deploy

- [ ] Set a real `JWT_KEY`. The default is a dev value.
- [ ] Rotate the R2 API token. It was shared in a screenshot during setup.
- [ ] Rate-limit `register`, `resend-code`, `verify` and `login`.
- [ ] Escape `%` and `_` in degree search, which currently act as wildcards. Item search already does
      (`ItemsController.EscapeLike`).

## Dev setup

- [ ] The API container runs as root, so files it creates in `backend/` (e.g. new migrations) are
      owned by root on the host.
