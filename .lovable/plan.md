# The Analytics Vanguard — LMS Plan

A learning platform for fresh graduates breaking into data analytics, with structured tracks, an in-browser SQL playground, capstone projects, public portfolios, and admin-issued professional certificates.

## Roles

- **Learner** — signs up, takes lessons, runs SQL exercises, submits projects, builds portfolio.
- **Admin (you)** — manages curriculum, reviews submissions, scores work, leaves feedback, approves certificates.

## Learner Experience

**1. Dashboard**
Progress across tracks, current module, upcoming deadlines, latest admin feedback, certificate status.

**2. Learning Tracks** (beginner → advanced)
- **SQL** — SELECT basics → joins → aggregations → window functions → CTEs → query optimization
- **Python for Analytics** — Python basics → Pandas → NumPy → data cleaning → visualization (matplotlib/seaborn)
- **Statistics & BI** — descriptive stats → distributions → hypothesis testing → A/B testing → dashboarding principles (Power BI / Tableau concepts)

Each module contains:
- Lesson content (rich text, embedded videos, images, code samples)
- A downloadable dataset (CSV) where relevant
- A quiz (auto-graded MCQ) and/or a coding exercise
- Completion tracked per module

**3. SQL Coding Playground**
- In-browser SQL editor (Monaco) running on DuckDB-WASM — no server round-trip
- Each exercise loads its dataset(s) automatically
- "Run" shows results table; "Submit" checks the result against an expected answer (row/column match) and records score
- Learners can save scratch queries

**4. Projects (Capstones)**
- 3–5 guided briefs per track (e.g., "Sales performance analysis", "Customer churn exploration", "A/B test readout")
- Each brief: scenario, dataset, deliverables checklist, rubric
- Learners submit: written analysis (markdown), SQL/Python code, dashboard link/screenshot, optional file upload
- Status: Draft → Submitted → Under review → Approved / Needs revision
- Approved projects auto-appear on portfolio

**5. Public Portfolio**
- Shareable URL: `/p/<learner-handle>`
- Bio, profile photo, skills (auto from completed tracks), approved projects with write-ups, certificate badge once issued
- Public — no login needed to view

**6. Certificate**
- Admin-approved only. When all tracks + at least one capstone are approved, learner becomes "Eligible"
- Admin clicks "Issue certificate" → generates a professional PDF certificate (name, program, completion date, unique ID, your signature)
- Verifiable via `/verify/<cert-id>` public page

## Admin Experience

- **Cohort view** — list of all learners, progress %, current module, last activity, project status
- **Learner detail** — full progress, quiz scores, exercise submissions, project submissions; leave feedback comments anywhere
- **Submissions queue** — pending project reviews with rubric scoring (criteria + score + comments)
- **Certificate management** — eligible learners list, issue / revoke, view all issued certificates
- **Curriculum management** — create/edit tracks, modules, lessons, quizzes, SQL exercises (with dataset + expected result), capstone briefs
- **Dataset library** — upload CSVs, attach to lessons/exercises/projects

## Design

Clean, professional, education-focused. Deep navy primary with a warm accent for CTAs. Card-based layout, generous spacing, strong typography hierarchy. Responsive (desktop-first but mobile-friendly).

## Technical Notes

- **Backend:** Lovable Cloud (auth, Postgres with RLS, storage for datasets + project files, edge functions for cert PDF generation)
- **Auth:** Email/password + Google. Roles in a separate `user_roles` table with a `has_role()` security-definer function (admin vs learner). First account you create gets admin role.
- **SQL playground:** DuckDB-WASM in the browser. Datasets stored in Cloud Storage and fetched on demand.
- **Auto-grading:** SQL exercises compared by normalizing result sets (ignore row order unless ORDER BY required). Quizzes by answer key.
- **Certificates:** Edge function generates a styled PDF (pdf-lib) with unique ID, stored in a `certificates` bucket; public verify page reads metadata.
- **Storage buckets:** `datasets` (public read), `submissions` (private), `certificates` (public read), `avatars` (public read).

## Build Phases

1. **Foundation** — Auth, roles, learner/admin shells, design system, navigation
2. **Curriculum + lessons** — Tracks, modules, lesson viewer, quizzes, admin CRUD
3. **SQL playground** — DuckDB editor, exercise runner, auto-grading, dataset library
4. **Projects + portfolio** — Capstone submissions, admin review/scoring, public portfolio pages
5. **Certificates** — Eligibility logic, admin issuance, PDF generation, public verification

After approval, I'll start with Phase 1 and we'll iterate phase by phase so each piece is solid before moving on.
