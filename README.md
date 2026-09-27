# UCompass

UCompass is a student-only campus companion for finding a room, buying and selling useful items,
joining casual meetups, chatting with other students, and drawing a daily student card. Its map-first
experience helps students discover what is nearby across Adelaide campuses.

The hackathon demo supports verified University of Adelaide and Flinders University students.

## What it does

- **Flats:** browse student rooms on a map, filter by rent and facilities, and message the tenant.
- **Market:** buy and sell textbooks, furniture, technology, and study gear with campus pickup points.
- **Meetups:** discover and host walk-in study, food, social, and casual events.
- **Chat:** message tenants, sellers, card matches, and other students in real time.
- **Daily card draw:** draw one mutual student match each day and start a conversation.
- **AI-assisted posting:** turn an item or room photo into a structured listing draft.
- **Photo search:** photograph an object to find visually relevant marketplace listings.

## Local AI

UCompass runs `qwen3-vl:8b-instruct` through Ollama on a local GPU computer. In production, the API
reaches that computer over a private Tailscale network, so Ollama does not need a public endpoint.

The model creates item and room drafts and extracts marketplace search terms from photos. Images are
resized before analysis, model output is constrained to application schemas, and users review drafts
before publishing. Analysis images are not retained. Claude can be configured as an alternative when
Ollama is unavailable in an environment.

See the [technical reference](docs/TECHNICAL.md) for the request flow and configuration.

## Stack

| Area | Technology |
| --- | --- |
| Mobile | Expo 57, React Native 0.86, React 19, TypeScript, Expo Router |
| Maps and UI | React Native Maps, Reanimated, Gesture Handler |
| API | ASP.NET Core 10, C#, JWT authentication, SignalR |
| Data | PostgreSQL 17, PostGIS, Entity Framework Core 10, Redis 7 |
| Images | Cloudflare R2 |
| AI | Ollama, Qwen3-VL, Tailscale, optional Anthropic Claude |
| Delivery | Docker Compose, GitHub Actions, self-hosted VPS runner |

## Run the mobile app

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
```

To use a locally running API:

```bash
EXPO_PUBLIC_API_URL=http://localhost:5000 npx expo start
```

## Run the backend

```bash
cp .env.example .env
docker compose up --build
```

| Service | Address |
| --- | --- |
| API | `http://localhost:5000` |
| Swagger UI | `http://localhost:5000/swagger` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Seeded demo accounts use the password `Password123!`.

## Hosted demo

- API: `https://api.ucompass.tech`
- Swagger UI: `https://api.ucompass.tech/swagger`
- Demo login: `alex.chen@student.adelaide.edu.au` / `Password123!`

## Documentation

- [Technical architecture, AI, infrastructure, and API](docs/TECHNICAL.md)
- [Mobile application structure](mobile/README.md)
- [Frontend implementation differences](FRONTEND-GAPS.md)
- [Known gaps and follow-up work](TODO.md)
