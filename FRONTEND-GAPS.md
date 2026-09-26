# Frontend gaps: prototype vs API

Places where the UCompass prototype (`UCompass Demo.dc.html`) and the API disagree, so the app needs
something the prototype doesn't do. Each item says what the prototype does, what the API expects, and
what to change. Checked on 2026-09-26 against the `meetups` branch, which includes the marketplace.

**2026-09-27:** the app on the `wire-api` branch talks to the hosted API. Ticked items are handled in the app
(*App:* notes say how); unticked ones are still open.

Backend-only gaps are in [TODO.md](TODO.md). Endpoint details are in [README.md](README.md).

## Everywhere

- [x] **Real map coordinates.** The prototype draws a fixed SVG of the CBD and places pins by pixel
      (`x`, `y`). The API returns `lat`/`lng` (WGS84) for every pin, and takes `lat`/`lng` when you drop
      one. Use a real map (MapLibre, Leaflet, react-native-maps) or project lat/lng onto the drawing.
      *App:* react-native-maps; pins use the API's `lat`/`lng`.
- [x] **Map viewport.** Search endpoints take `minLat`, `minLng`, `maxLat`, `maxLng` (all four or none).
      Send the visible map bounds, or leave them out to get everything.
      *App:* Leaves the bounds out and loads everything (fewer than 100 pins per tab).
- [x] **Enums are names, never numbers**, in JSON and in query strings: `?category=StudyGear`, not
      `?category=4`. Numbers get a 400.
- [x] **Relative times.** The prototype shows "2h ago" and "Just now". The API returns `createdAt` (UTC);
      format it in the app.
      *App:* `timeAgo()` in `lib/dates.ts`.
- [x] **Image URLs expire after 24 hours.** Don't cache them longer; refetch the item or listing.
      *App:* Each tab reloads when it comes into focus.
- [x] **"Major" is the full degree name**, e.g. "Bachelor of Mathematics (Honours)", where the prototype
      shows "Mathematics". Truncate it or wait for the PM's profile decision (see Profile).
      *App:* Shown as the subject: "Bachelor of Mathematics (Honours)" → "Mathematics (Honours)" (`majorLabel`).
- [x] **Errors** are ProblemDetails JSON: show `detail`, or the messages in `errors` for 400s.
      *App:* Toasts show `detail`, or the validation messages.

## Sign in

- [x] **Passwords.** The prototype is passwordless: email → "Send verification code" → 6-digit code. The
      API has a password: `POST /api/auth/register` `{ email, password }` (8+ characters) →
      `POST /api/auth/verify` `{ email, code }`, then `POST /api/auth/login` `{ email, password }` on later
      visits. Add a password field to sign-up and a separate sign-in screen, or ask for a passwordless
      login endpoint (not built).
      *App:* Sign in with email + password, or "Create an account" → code. "Demo account" fills in Koala_Kai.
- [x] **"Autofill demo code".** The hosted API returns the code as `devCode` from register, so the demo
      button can use it. There's no real email yet.
- [x] **Which screen next.** Verify and login return `consentComplete` and `onboardingComplete`. Go to
      the consent screen, then the profile screen, when either is false.

## Consent

- [x] Matches the API. Map the four checkboxes to `PUT /api/consents`
      `{ terms, location, ageAndEnrolment, usageStats }`; the first three are required. Until then every
      other endpoint returns `403 { code: "consent_required" }`. `GET /api/consents` has the wording.

## Profile ("How you'll appear")

The PM hasn't decided which profile to keep (HANDOFF section 6). Until then the app has to fill in what
the API requires.

- [x] **Major vs degree.** The prototype has one dropdown of 17 generic majors ("Computer Science",
      "Law"…). The API needs `degreeId`, a real degree picked with three dropdowns: `GET /api/degrees/levels`
      → `/api/degrees/colleges` → `/api/degrees` (or `search` for a type-ahead).
      *App:* One searchable "Major" field over `GET /api/degrees?search=` for your uni.
- [x] **Gender is required by the API** (`Male`, `Female`, `NonBinary`, `Other`, `PreferNotToSay`) but the
      prototype doesn't ask. **Send it explicitly**: the API currently stores a missing gender as `Male`
      (a backend bug, see TODO). If the PM drops the question, send `PreferNotToSay`.
      *App:* Sends `PreferNotToSay` for new profiles, and keeps a saved gender on edits.
- [x] **Habits and interests** must be sent as arrays, even empty: `habits: []`, `interests: []`.
- [x] **Avatar.** The prototype offers 9 preset colour avatars (letter on a colour). The API stores an
      uploaded photo (`POST /api/uploads/avatar`, then `avatarKey`). There's nowhere to save a preset
      choice yet; draw it client-side or ask for an `avatarPreset` field.
      *App:* Photo avatars from the API are shown. Preset colours are saved as `avatarPreset` (0–7) and
      everyone sees them. No photo upload in the app yet.
- [x] **Nickname length.** The prototype cuts nicknames at 20 characters; the API allows 64. Keep 20 in
      the app if that's the design.
      *App:* 20.
- [x] **Extra API fields** the prototype doesn't show: pronouns, year of study, bio. All optional.
      *App:* Not shown, but kept when the profile is edited.

## Flats

- [x] **"Street / suburb" is two fields.** The prototype has one text box ("e.g. Frome St, Adelaide").
      The API needs `suburb` (required) and `street` (optional).
- [x] **Minimum stay is a number.** The prototype takes free text ("e.g. 3 months, or until end of
      semester"). The API takes `minStayMonths` 1–24, or null for flexible. Use a picker.
      *App:* Flexible / 1 / 3 / 6 / 12 months.
- [x] **Option names differ.** Send the API's values: toilet "Shared toilet" → `Shared`, "Private ensuite"
      → `PrivateEnsuite`; bathroom "Ensuite shower" → `Ensuite`, "Shared bathroom" → `Shared`; furnished
      "Unfurnished" → `Unfurnished` (the prototype's internal value is `None`).
- [x] **Photos are optional in the API** but required by the prototype's form. Keep the app's check.
      Upload with `POST /api/uploads/flat-photo`, then send its `listingId` as `id` on `POST /api/flats`.
      *App:* Photo picker (up to 5), uploaded on Publish.
- [x] **Fields the prototype's form lacks:** `description` and `housemates` ("Who lives here", shown on
      the detail page). Both optional; add inputs if the detail page should show them.
      *App:* Added an optional description. "Who lives here" is filled with your own uni and major.
- [x] **"Available from"** is a date; null means available now.
- [x] **Quick replies** ("Is it still available?", …) are app-only; send the text with
      `POST /api/chats { flatId, text }`.

## Market

- [x] **Category and condition inputs are missing** from the Sell form (the prototype saves every item as
      "Study gear" / "Good"). The API requires `category` and `condition`; `conditionNote` is optional.
      `GET /api/items/options` has the values and labels.
- [x] **Availability "From date"** must send `availability: "From"` plus `availableFrom` (a future date).
      The card label "Available from 1 Oct" / "From 1 Oct" is built in the app from that date.
- [x] **Own pin name.** The prototype labels a dropped pin "Your pinned spot" and doesn't ask for a name.
      The API takes an optional `placeName`; when it's null, show your own fallback text.
      *App:* Optional "Name this spot" field; unnamed pins show "Seller's pinned spot".
- [ ] **Sold items:** use `includeSold=true` for the grid (greyed out, disabled "Sold" button) and leave
      it off for the map. The seller marks an item sold with `PUT /api/items/{id}/availability`.
      *App:* The grid shows sold items faded and the map hides them. There's no "Mark as sold" in the app yet.
- [x] **Upload flow:** `POST /api/uploads/item-photo` → `PUT` the image to `uploadUrl` → send `itemId` as
      `id` and the keys as `photoKeys` on `POST /api/items`. The API rejects a key that wasn't uploaded.
- [x] **"Message seller"** is `POST /api/chats { itemId, text }`. The prototype pre-fills
      "Hi! Is the {title} still available?"; build that text in the app.
- [ ] **Price 0** is allowed (free). Decide whether to show "Free" or "$0".
      *App:* Shows "$0" for now.

## Meetups

- [x] **Start time is required.** The prototype's Host form lets "When" be empty (defaulting to 2 days
      ahead). The API requires `startsAt`.
      *App:* Publish asks for a date and time in the future.
- [x] **Time zones.** The prototype's `datetime-local` input has no offset. Send `startsAt`/`endsAt` with
      Adelaide's offset, e.g. `2026-09-29T19:00:00+09:30` (it changes with daylight saving).
      *App:* Sends `startsAt` as a UTC instant (`toISOString()`): the same moment, so no offset maths in the app.
- [ ] **End time** is optional in the API (up to 12 hours after the start). The prototype's form has no
      end-time input, but its sample events show one ("7:00–9:30 pm"). Add one if wanted.
      *App:* Not added yet.
- [x] **Full events refuse Join**, even walk-in ones (`409`). The prototype says walk-ins need no RSVP;
      show "Full" on the button. Open question for the PM (TODO.md).
      *App:* The button says "Full".
- [x] **Place name.** With a preset place, `placeName` optionally replaces its name ("Barr Smith Library,
      Level 2"). With a pin, it's "Name this spot" and defaults to "Pinned location".
      *App:* Only for dropped pins.
- [x] **"Host anonymously · Always on"** is a fixed label; there's no setting to send.
- [x] **Guest dots.** The prototype draws avatar dots for people going. The API only returns
      `goingCount`, so draw anonymous dots.
- [x] **Labels are ready to show**, in Adelaide time: `dayLabel`, `dateLabel`, `timeLabel`, `whenLabel`.
      Don't reformat `startsAt` in the phone's own time zone.
- [x] **Live headcount:** listen for `eventGoing` on `/hubs/chat`, plus `eventUpdated` and
      `eventCancelled` for events you're going to.
      *App:* All three are handled, over a small WebSocket client (`api/realtime.ts`).

## Chats

- [x] **Avatars.** The prototype's chat banner says "Only nickname, major & uni are shared", but the API
      also returns the avatar URL (only if the student uploaded one). Update the copy or hide avatars.
      *App:* The banner now says "Only nickname, major, uni & avatar are shared".
- [x] **"About" lines** come from the server as messages with `kind: "About"` and an `about` object
      (`{ type: "Flat" | "Item", id }`). Render them as the grey system line and make them tap through.
      *App:* They open the flat or item.
- [x] **Real time:** connect SignalR to `/hubs/chat?access_token={jwt}` for `message`, `read` and
      `typing`. Call `Typing(conversationId)` for the "•••" indicator.

## People on the map (not built yet)

- [ ] **Connect and Wave** on person pins have no API yet. Connect can already use
      `POST /api/chats { userId, text }`; the prototype's "Connected from the map" line and Wave need the
      people-on-map feature (HANDOFF section 5.3).
