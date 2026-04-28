# MAiSY — M&A Pipeline Management Tool

A professional, finance-grade M&A pipeline management tool built as a static single-page application. No backend, no auth — everything lives in `localStorage`.

**Live demo:** https://pettifordo.github.io/MAiSY/

---

## Features

- **Kanban pipeline** with drag-and-drop across 7 configurable stages
- **Deal detail pages** with financials, activity timeline, documents, contacts
- **Diligence checklists** — Legal, Financial, Commercial, Operational templates
- **Task management** per deal with owner assignment and due dates
- **Reporting dashboard** — pipeline by stage, sector mix, weighted EV, deal velocity
- **CSV export** of all deal data
- **Settings** — customise stages (name, probability, colour), switch active user
- **Seed data** — 7 realistic UK/European specialty chemicals deals

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (hot reload)
npm run dev
```

Open [http://localhost:5173/MAiSY/](http://localhost:5173/MAiSY/)

---

## Build

```bash
npm run build
```

Output goes to `dist/`. The base path is configured as `/MAiSY/` in `vite.config.ts` to match the GitHub Pages deployment URL.

---

## Deploy to GitHub Pages

### Option A — `gh-pages` CLI (recommended)

```bash
# Install the deploy tool once
npm install -g gh-pages

# Build and deploy
npm run build
gh-pages -d dist
```

Then in your repo → **Settings → Pages → Source**: select the `gh-pages` branch, root `/`.

Your site will be live at: `https://pettifordo.github.io/MAiSY/`

### Option B — GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Drag-and-drop | @dnd-kit/core + sortable |
| Charts | Recharts 2 |
| State / persistence | Zustand + localStorage |
| Routing | React Router 6 (HashRouter) |
| Date utilities | date-fns |
| Icons | Lucide React |

---

## Project Structure

```
src/
  types/          TypeScript interfaces (Deal, Stage, Task, etc.)
  store/          Zustand store with localStorage persistence
  data/           Seed data — 7 M&A deals with activities, docs, tasks
  components/
    pipeline/     Kanban board, deal cards, stage columns
    deals/        Activity timeline, document list, contacts
    tasks/        Task list, diligence checklist
    reporting/    (charts live in pages/Reporting.tsx)
    shared/       Sidebar, modals, sector badges, stage pills
  pages/
    Dashboard.tsx   Home — KPIs, pipeline snapshot, activity feed
    Pipeline.tsx    Kanban board with filters
    DealDetail.tsx  6-tab deal view
    Reporting.tsx   Charts + CSV export
    Settings.tsx    Stage editor + user selector
```

---

## Resetting Data

All data is stored in the browser's `localStorage` key `maisy-store`. To reset to seed data:

- Go to **Settings → Reset to Seed Data**, or
- Open DevTools → Application → Local Storage → delete `maisy-store` → refresh
