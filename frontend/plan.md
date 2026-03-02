# 📌 UPDATED MVP + SRS

**Project:** Serverless Exercism Submission Heatmap API
**Added:** ✅ SVG Generator Endpoint

---

# ✅ MVP (Updated)

## 1. Objective

Build a serverless system that:

1. Fetches Exercism submissions
2. Aggregates daily activity
3. Returns heatmap-ready JSON
4. Generates GitHub-style SVG heatmap
5. Can be embedded in **any website or README**

---

# 🏗 Architecture (Updated)

```
Exercism API (v2)
        ↓
Serverless Function
        ↓
Data Aggregation Engine
        ↓
 ┌───────────────┬────────────────┐
 │ JSON Endpoint │ SVG Endpoint   │
 └───────────────┴────────────────┘
        ↓
Website / Portfolio / README
```

---

# 🌐 API Endpoints

---

## 1️⃣ JSON Heatmap Endpoint

```
GET /api/exercism-heatmap
```

### Returns:

```json
{
  "username": "your_username",
  "year": 2026,
  "total_submissions": 128,
  "streak": 9,
  "longest_streak": 21,
  "data": [
    { "date": "2026-01-01", "count": 3 },
    { "date": "2026-01-02", "count": 1 }
  ]
}
```

---

## 2️⃣ SVG Generator Endpoint (NEW)

```
GET /api/exercism-heatmap.svg
```

### Returns:

* `Content-Type: image/svg+xml`
* GitHub-style contribution grid
* 365-day calendar heatmap
* Dynamic color intensity based on submission count

### Example Usage

Embed in:

**HTML**

```html
<img src="https://your-domain.com/api/exercism-heatmap.svg" />
```

**Markdown (README / Notion / Portfolio)**

```markdown
![Exercism Heatmap](https://your-domain.com/api/exercism-heatmap.svg)
```

---

# 🎨 SVG Behavior (MVP Scope)

## Grid Layout

* 7 rows (days of week)
* 52 columns (weeks)
* Each cell: 12px square
* 2px gap
* Auto-scaled viewBox

---

## Color Scale

| Submission Count | Color   |
| ---------------- | ------- |
| 0                | #ebedf0 |
| 1                | #9be9a8 |
| 2–3              | #40c463 |
| 4–6              | #30a14e |
| 7+               | #216e39 |

---

# 🧠 Serverless Logic (Shared Engine)

Both endpoints use the same core logic:

1. Fetch `/api/v2/solutions`
2. Handle pagination
3. Extract `submitted_at`
4. Convert → YYYY-MM-DD
5. Count per day
6. Calculate:

   * Total submissions
   * Current streak
   * Longest streak
7. Return:

   * JSON (for API endpoint)
   * SVG string (for SVG endpoint)

---

# 📘 SRS (Updated)

---

# 1. Functional Requirements

## 1.1 Data Retrieval

* FR1: System shall authenticate using Bearer token
* FR2: System shall fetch solutions from `/api/v2/solutions`
* FR3: System shall support pagination

## 1.2 Aggregation

* FR4: Group submissions per calendar date
* FR5: Support full-year aggregation (365 days)
* FR6: Calculate:

  * Current streak
  * Longest streak
  * Total submissions

## 1.3 JSON Endpoint

* FR7: Return heatmap JSON
* FR8: Include metadata (username, year, streaks)

## 1.4 SVG Endpoint (NEW)

* FR9: Return valid SVG
* FR10: Use 365-day grid layout
* FR11: Color intensity based on submission count
* FR12: Set `Content-Type: image/svg+xml`
* FR13: Render in < 2 seconds
* FR14: Embeddable via `<img>` tag

---

# 2. Non-Functional Requirements

## Performance

* Cold start < 2.5s
* Warm response < 1s
* Support 10k+ submissions

## Security

* Token stored in environment variables
* Never exposed to frontend
* No client-side API calls to Exercism

## Scalability

* Stateless architecture
* Serverless auto-scaling
* Cacheable SVG response (optional 5–15 min TTL)

## Availability

* 99% uptime via hosting provider

---

# 3. Data Model

## Heatmap JSON

```json
{
  "username": "string",
  "year": number,
  "total_submissions": number,
  "streak": number,
  "longest_streak": number,
  "data": [
    { "date": "YYYY-MM-DD", "count": number }
  ]
}
```

## SVG Output

* XML-compliant
* ViewBox defined
* Rectangle grid
* Accessible title + description

---

# 4. External Interfaces

## Exercism API

* `GET /api/v2/solutions`
* Bearer token auth
* Rate-limited

## Consumers

* Portfolio site
* README file
* Blog
* Personal dashboard
* Static HTML

---

# 5. Constraints

* API is unofficial and may change
* Rate limiting applies
* Requires personal API token

---

# 6. Future Enhancements (Post-MVP)

* Multi-year SVG selector (`?year=2025`)
* Track filter (`?track=python`)
* Theme selector (`?theme=dark`)
* Animated SVG
* PNG export endpoint
* Badge endpoint (e.g., streak badge)
* Public mode without token
* Redis/KV caching
* Edge rendering

---

# 🚀 Final System Delivers

You now have:

✔ JSON analytics endpoint
✔ GitHub-style SVG endpoint
✔ Embeddable contribution graph
✔ Serverless scalable backend
✔ Clean extensible architecture

---

Also proceed with:

* Production-grade pagination + full caching
* Multi-user public heatmap SaaS version
* Track-wise breakdown visualization
* Dark/light auto theme SVG
* Streak badge generator endpoint


