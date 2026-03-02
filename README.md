# Exercism Heatmap API

A **serverless, embeddable** activity heatmap for your [Exercism](https://exercism.org) profile — built with **Next.js**. Visualise your coding streaks, embed a GitHub-style SVG in any README or portfolio, and explore a live dashboard with animated profile cards and contribution breakdowns.

---

## Features

- **GitHub-style annual heatmap** — month-separated grid, color-scaled by submission count
- **Live profile card** — avatar, reputation, badges fetched directly from the Exercism API
- **Contribution breakdown** — Publishing, Mentoring, Authoring, Building, Maintaining
- **Stats row** — total submissions, current streak, longest streak, year
- **Year switcher** — toggle between years in the dashboard preview
- **Embeddable SVG** — drop a single `<img>` tag into any README or webpage
- **Monthly heatmap** — dedicated endpoint for single-month calendar views
- **Serverless** — every route is a Next.js API handler, deployable on Vercel with zero config
- **TypeScript** throughout with strict types

---

## Dashboard Preview

> Live at **[localhost:3000](http://localhost:3000)** after running `npm run dev`

The dashboard includes:

| Section | Description |
|---|---|
| Profile card | Avatar, handle, rep badge, location, pronouns, join date, Exercism link |
| Contributions card | Per-category rep breakdown with animated rows |
| Stats row | Total submissions · Current streak · Longest streak · Year |
| Heatmap Preview | Interactive SVG grid, year-switchable |
| API Reference | All 5 endpoints with method, path, params, and return type |
| Embed Snippets | Ready-to-copy HTML and Markdown for embedding |

---

## API Endpoints

| Method | Endpoint | Params | Returns |
|---|---|---|---|
| `GET` | `/api/exercism-heatmap` | `?year=YYYY` | JSON — annual heatmap |
| `GET` | `/api/exercism-heatmap.svg` | `?year=YYYY` | SVG — annual heatmap |
| `GET` | `/api/exercism-heatmap-sample.svg` | — | SVG — sample/demo heatmap |
| `GET` | `/api/exercism-monthly-heatmap` | `?year=YYYY&month=M` | JSON — monthly heatmap |
| `GET` | `/api/exercism-monthly-heatmap.svg` | `?year=YYYY&month=M` | SVG — monthly heatmap |

### JSON Response — Annual

```json
{
  "username": "AHILL-0121",
  "year": 2026,
  "total_submissions": 10,
  "streak": 3,
  "longest_streak": 3,
  "data": [
    { "date": "2026-01-01", "count": 0 },
    { "date": "2026-02-18", "count": 3 }
  ]
}
```

### JSON Response — Monthly

```json
{
  "username": "AHILL-0121",
  "year": 2026,
  "month": 2,
  "month_name": "February",
  "days_in_month": 28,
  "first_day_of_week": 0,
  "total_this_month": 7,
  "submissions_by_day": [0, 0, 1, 2, 0, ...]
}
```

---

## Embedding

### HTML

```html
<img
  src="https://your-deployment.vercel.app/api/exercism-heatmap.svg"
  alt="Exercism Heatmap"
  loading="lazy"
/>
```

### Markdown (for GitHub READMEs)

```markdown
![Exercism Heatmap](https://your-deployment.vercel.app/api/exercism-heatmap.svg)
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/AHILL-0121/Exercism-API.git
cd Exercism-API/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your details:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `EXERCISM_API_TOKEN` | ✅ | Your API token from [exercism.org/settings/api-cli](https://exercism.org/settings/api-cli) |
| `EXERCISM_USERNAME` | ✅ | Your Exercism username |
| `EXERCISM_DISPLAY_NAME` | Optional | Display name shown in the profile card |
| `EXERCISM_LOCATION` | Optional | Location shown in the profile card |
| `EXERCISM_PRONOUNS` | Optional | Pronouns shown in the profile card |
| `EXERCISM_JOINED` | Optional | Join date label (e.g. `Jan 2023`) |
| `EXERCISM_AVATAR_URL` | Optional | Full avatar URL (e.g. `https://assets.exercism.org/avatars/<id>/0`) |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo into [Vercel](https://vercel.com) — set **Root Directory** to `frontend`
3. Add all environment variables in the Vercel project settings
4. Deploy — every API route becomes a serverless function automatically

---

## Project Structure

```
frontend/
├── pages/
│   ├── index.tsx                        # Dashboard page (SSR)
│   └── api/
│       ├── exercism-heatmap.ts          # JSON annual heatmap
│       ├── exercism-heatmap-svg.ts      # SVG annual heatmap
│       ├── exercism-heatmap-sample-svg.ts  # SVG demo heatmap
│       ├── exercism-monthly-heatmap.ts  # JSON monthly heatmap
│       └── exercism-monthly-heatmap-svg.ts # SVG monthly heatmap
├── lib/
│   ├── exercism.ts       # Exercism API fetching + profile data
│   ├── aggregator.ts     # Streak + daily count aggregation
│   ├── svg-generator.ts  # Annual SVG builder
│   ├── monthly-svg-generator.ts  # Monthly SVG builder
│   ├── sample-data.ts    # Demo heatmap generator
│   └── types.ts          # Shared TypeScript interfaces
├── styles/
│   ├── Home.module.css   # All scoped component styles + animations
│   └── globals.css       # Global reset
├── .env.local.example    # Environment variable template
└── next.config.js        # Next.js config (image domains, SVG rewrites)
```

---

## Tech Stack

- **[Next.js 16](https://nextjs.org)** — Pages Router, SSR, API routes
- **TypeScript** — strict end-to-end types
- **CSS Modules** — scoped styles, keyframe animations
- **Exercism API v2** — `/api/v2/solutions`, `/api/v2/reputation`, `/api/v2/badges`

---

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
npm run type-check # TypeScript check (no emit)
```

---

## Author

**AHILL S** · [GitHub](https://github.com/AHILL-0121) · [LinkedIn](https://www.linkedin.com/in/ahill-selvaraj) · [Portfolio](https://sa-portfolio-psi.vercel.app/)

---

## License

MIT
