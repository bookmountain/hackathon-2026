# UCompass

Flats, bargains and walk-in meetups for Adelaide University and Flinders
students, each on its own map of the Adelaide CBD.

## Layout

```
map/
├── design/            Source design (Claude Design export). Open
│                      "UCompass Demo.dc.html" in a browser to click through it.
└── mobile/            Expo (React Native) app
    └── src/
        ├── app/           Routes only (Expo Router). Thin files that render a
        │                  screen from features/.
        ├── features/      One folder per product area
        │   ├── onboarding/    login → verify → consent → profile setup
        │   ├── map/           illustrated campus map, pins, bottom sheet
        │   ├── flats/         rooms: map, list, detail, "List a room"
        │   ├── market/        items: map, grid, detail, "Sell"
        │   ├── meetups/       events: map, list, detail, "Host"
        │   ├── chat/          messages + chat thread
        │   └── profile/
        ├── components/    Shared UI building blocks (buttons, fields, chips…)
        ├── store/         App state (React context + reducer)
        ├── data/          Seed data used until a backend exists
        ├── theme/         Colours, typography, shared styles
        └── lib/           Small pure helpers
```

Import with the `@/` alias, e.g. `import { COLORS } from "@/theme"`.

## Run

```bash
cd mobile
npm install --legacy-peer-deps   # Expo 57 has a react-dom peer conflict in npm
npx expo start                   # scan the QR code with Expo Go
```

Checks before each commit:

```bash
npx tsc --noEmit
npx expo lint
```

## Status

Everything runs on local seed data — there is no backend yet. Login accepts
any `@adelaide.edu.au` / `@flinders.edu.au` address and any 6-digit code.
