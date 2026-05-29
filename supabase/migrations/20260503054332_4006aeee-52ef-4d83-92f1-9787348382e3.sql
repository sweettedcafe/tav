
-- Power BI track
INSERT INTO public.tracks (slug, title, description, level, sort_order, icon, is_published)
VALUES ('powerbi', 'Power BI for Analytics', 'Build production-quality dashboards: connect data, model with star schemas, write DAX, and tell business stories.', 'intermediate', 4, 'bar-chart-3', true)
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, level=EXCLUDED.level, sort_order=EXCLUDED.sort_order, icon=EXCLUDED.icon;

DO $$
DECLARE
  t_id uuid;
  m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid;
BEGIN
  SELECT id INTO t_id FROM public.tracks WHERE slug='powerbi';

  INSERT INTO public.modules (track_id, slug, title, summary, sort_order) VALUES
    (t_id, 'pbi-getting-started', 'Getting Started with Power BI', 'Install Power BI Desktop, tour the interface, and load your first dataset.', 1) RETURNING id INTO m1;
  INSERT INTO public.modules (track_id, slug, title, summary, sort_order) VALUES
    (t_id, 'pbi-power-query', 'Power Query — Cleaning & Shaping', 'Use Power Query (M) to clean, reshape, and combine data before modeling.', 2) RETURNING id INTO m2;
  INSERT INTO public.modules (track_id, slug, title, summary, sort_order) VALUES
    (t_id, 'pbi-modeling', 'Data Modeling & Star Schema', 'Build a proper star schema with fact and dimension tables.', 3) RETURNING id INTO m3;
  INSERT INTO public.modules (track_id, slug, title, summary, sort_order) VALUES
    (t_id, 'pbi-dax', 'DAX Essentials', 'Master measures, calculated columns, CALCULATE, and time intelligence.', 4) RETURNING id INTO m4;
  INSERT INTO public.modules (track_id, slug, title, summary, sort_order) VALUES
    (t_id, 'pbi-dashboards', 'Dashboards & Storytelling', 'Design clear, executive-ready dashboards that drive decisions.', 5) RETURNING id INTO m5;

  -- Module 1
  INSERT INTO public.lessons (module_id, slug, title, summary, content, sort_order) VALUES
  (m1, 'pbi-intro', 'What is Power BI?',
   'Understand the Power BI ecosystem and where it fits in your analytics workflow.',
$md$
## Why Power BI?

Power BI is Microsoft''s end-to-end **business intelligence platform**. It lets you connect to data, transform it, model it, and ship interactive dashboards that decision-makers actually use.

> <mark>**Remember:** Power BI is not just a chart tool — it''s a full pipeline: **Connect → Transform → Model → Visualize → Share.**</mark>

## The three pieces

| Tool | What it does | Where it runs |
|---|---|---|
| **Power BI Desktop** | Author reports, model data, write DAX | Windows app (free) |
| **Power BI Service** | Publish, share, schedule refresh | Cloud (app.powerbi.com) |
| **Power BI Mobile** | View dashboards on the go | iOS / Android |

## How a project flows

1. **Get Data** — CSV, SQL, Excel, APIs, 200+ connectors
2. **Transform** in Power Query (the M language)
3. **Model** relationships between tables
4. **Measure** business logic with DAX
5. **Visualize** with charts, KPIs, slicers
6. **Publish** to the Power BI Service

> <mark>**Pro tip:** 80% of dashboard quality comes from a clean **data model**, not from picking the prettiest chart.</mark>
$md$, 1);

  INSERT INTO public.lessons (module_id, slug, title, summary, content, sort_order) VALUES
  (m1, 'pbi-load-data', 'Loading your first dataset',
   'Connect to a CSV, inspect column types, and create your first visual.',
$md$
## Loading a CSV into Power BI Desktop

1. Open **Power BI Desktop** → **Home → Get Data → Text/CSV**
2. Pick the file (download `pbi_sales.csv` from the Datasets section below)
3. In the preview, click **Transform Data** (don''t click Load yet — always inspect first)
4. Verify column types: `order_date` → Date, `revenue` → Decimal Number
5. Click **Close & Apply**

## Your first visual

Drag fields from the **Data pane**:

| Field | Drop on | Result |
|---|---|---|
| `region` | Axis | Bar chart by region |
| `revenue` | Values | Sum of revenue per region |

> <mark>**Remember:** Power BI defaults numeric fields to **SUM**. Click the field in the Values well to switch to AVG, COUNT, etc.</mark>

## Practice dataset

Download **pbi_sales** (linked below). It has ~2,000 rows of orders across two years — perfect for everything in this track.
$md$, 2);

  -- Module 2 - Power Query
  INSERT INTO public.lessons (module_id, slug, title, summary, content, try_it_sql, try_it_datasets, sort_order) VALUES
  (m2, 'pq-basics', 'Power Query basics',
   'Clean column names, change types, remove duplicates, and filter rows.',
$md$
## What is Power Query?

Power Query is the **ETL engine** inside Power BI. Every step you click becomes a recorded line of **M code** in the Applied Steps panel — fully reproducible.

> <mark>**Golden rule:** Clean in Power Query, not in DAX. DAX is for business logic; Power Query is for shaping data.</mark>

## The most-used transformations

| Transformation | When to use | Where |
|---|---|---|
| **Promote Headers** | First row contains column names | Transform → Use First Row as Headers |
| **Change Type** | Dates as text, numbers as text | Click the type icon next to column name |
| **Remove Duplicates** | Dedupe customers, products | Home → Remove Rows → Remove Duplicates |
| **Replace Values** | Standardize "USA"/"U.S."/"United States" | Right-click column → Replace Values |
| **Split Column** | Split "First Last" into two columns | Transform → Split Column |
| **Unpivot** | Wide tables → tidy long format | Select cols → Transform → Unpivot |

## Try it: simulate the same logic in SQL

The SQL below mirrors what Power Query does to `pbi_sales`. Run it and inspect the cleaned output.
$md$,
$sql$-- Mirror common Power Query steps in SQL
SELECT
  order_id,
  CAST(order_date AS DATE) AS order_date,
  TRIM(region) AS region,
  category,
  product,
  CAST(quantity AS INTEGER) AS quantity,
  ROUND(unit_price, 2) AS unit_price,
  ROUND(revenue, 2) AS revenue,
  ROUND(revenue - cost, 2) AS profit
FROM pbi_sales
WHERE revenue > 0
ORDER BY order_date DESC
LIMIT 20;$sql$,
   ARRAY['pbi_sales'], 1);

  INSERT INTO public.lessons (module_id, slug, title, summary, content, try_it_sql, try_it_datasets, sort_order) VALUES
  (m2, 'pq-merge-append', 'Merging & appending queries',
   'Join tables (Merge) and stack tables (Append) — the Power Query equivalents of JOIN and UNION.',
$md$
## Merge vs Append

| Operation | SQL equivalent | Use when |
|---|---|---|
| **Merge Queries** | `JOIN` | Bringing columns from another table |
| **Append Queries** | `UNION ALL` | Stacking rows of identical structure |

## Merge example

To attach the regional revenue target to each order:

1. **Home → Merge Queries → Merge Queries as New**
2. Top table: `pbi_sales`, key: `region`
3. Bottom table: `pbi_targets`, key: `region`
4. Join kind: **Left Outer**
5. Expand the new column and pick `revenue_target`

> <mark>**Watch out:** Merging on a column with different casing ("North" vs "north") will silently drop rows. Always **Trim + Lowercase** first.</mark>

## Practice in SQL
$md$,
$sql$-- Equivalent of a Power Query merge: actuals vs targets per region/month
SELECT
  s.region,
  EXTRACT(YEAR FROM CAST(s.order_date AS DATE)) AS year,
  EXTRACT(MONTH FROM CAST(s.order_date AS DATE)) AS month,
  ROUND(SUM(s.revenue), 2) AS actual_revenue,
  MAX(t.revenue_target) AS target,
  ROUND(SUM(s.revenue) - MAX(t.revenue_target), 2) AS variance
FROM pbi_sales s
LEFT JOIN pbi_targets t
  ON t.region = s.region
 AND t.year = EXTRACT(YEAR FROM CAST(s.order_date AS DATE))
 AND t.month = EXTRACT(MONTH FROM CAST(s.order_date AS DATE))
GROUP BY 1,2,3
ORDER BY 1,2,3;$sql$,
   ARRAY['pbi_sales','pbi_targets'], 2);

  -- Module 3 - Modeling
  INSERT INTO public.lessons (module_id, slug, title, summary, content, sort_order) VALUES
  (m3, 'star-schema', 'The star schema',
   'Why every Power BI model should look like a star: one fact, many dimensions.',
$md$
## Star schema in one picture

```
       pbi_date
           |
pbi_targets --- pbi_sales (FACT) --- (future) products
           |
        regions
```

The **fact table** holds measurable events (orders, clicks, sessions). **Dimension tables** describe context (date, product, customer, region).

> <mark>**Why star schema?** It''s **fast** (small dim tables join cheaply), **flexible** (add a new dim without rebuilding), and **DAX-friendly** (filter context flows through relationships).</mark>

## Fact vs Dimension cheat sheet

| Property | Fact table | Dimension table |
|---|---|---|
| Grain | One row per event | One row per entity |
| Size | Millions of rows | Hundreds–thousands |
| Columns | IDs + numeric measures | Descriptive attributes |
| Examples | `pbi_sales` | `pbi_date`, `pbi_targets` |

## Building it in Power BI

1. **Model view** (left sidebar)
2. Drag `pbi_sales[order_date]` → `pbi_date[date]`
3. Drag `pbi_sales[region]` → `pbi_targets[region]` *(plus year+month — composite keys need a helper column)*
4. Set cardinality: **Many-to-One** (sales → date is many-to-one)
5. Cross-filter direction: **Single** (default — change only with a reason)

> <mark>**Mark as date table:** Right-click `pbi_date` → **Mark as date table** → choose `date`. This unlocks time intelligence DAX.</mark>
$md$, 1);

  -- Module 4 - DAX
  INSERT INTO public.lessons (module_id, slug, title, summary, content, try_it_sql, try_it_datasets, sort_order) VALUES
  (m4, 'dax-measures', 'Measures vs calculated columns',
   'When to use a measure (dynamic) vs a calculated column (stored).',
$md$
## The single most important DAX rule

> <mark>**Use measures for aggregations. Use calculated columns for row-level attributes.**</mark>

| Feature | Measure | Calculated Column |
|---|---|---|
| Computed | At query time, per filter context | Once, at refresh |
| Stored | No | Yes (uses memory) |
| Best for | KPIs, totals, ratios | Categories, flags, lookups |

## Your first measures

```dax
Total Revenue = SUM ( pbi_sales[revenue] )

Total Profit  = SUMX ( pbi_sales, pbi_sales[revenue] - pbi_sales[cost] )

Profit Margin =
DIVIDE ( [Total Profit], [Total Revenue], 0 )

Order Count   = DISTINCTCOUNT ( pbi_sales[order_id] )
```

> <mark>**Always wrap division in `DIVIDE()`** — it returns BLANK on divide-by-zero instead of throwing an error.</mark>

## Compare in SQL

The SQL below produces the same numbers your DAX measures will. Run it to verify the math.
$md$,
$sql$SELECT
  region,
  ROUND(SUM(revenue), 2)                     AS total_revenue,
  ROUND(SUM(revenue - cost), 2)              AS total_profit,
  ROUND(SUM(revenue - cost)/SUM(revenue),3)  AS profit_margin,
  COUNT(DISTINCT order_id)                   AS order_count
FROM pbi_sales
GROUP BY region
ORDER BY total_revenue DESC;$sql$,
   ARRAY['pbi_sales'], 1);

  INSERT INTO public.lessons (module_id, slug, title, summary, content, try_it_sql, try_it_datasets, sort_order) VALUES
  (m4, 'dax-calculate', 'CALCULATE — the heart of DAX',
   'CALCULATE modifies filter context. It''s the function that powers ratios, comparisons, and "what-if" measures.',
$md$
## What CALCULATE does

`CALCULATE ( <expression>, <filter1>, <filter2>, ... )` evaluates the expression with **modified filter context**.

```dax
Revenue (Electronics) =
CALCULATE ( [Total Revenue], pbi_sales[category] = "Electronics" )

Revenue (Top 5 Reps) =
CALCULATE (
    [Total Revenue],
    TOPN ( 5, ALL ( pbi_sales[sales_rep] ), [Total Revenue] )
)

% of Region Total =
DIVIDE (
    [Total Revenue],
    CALCULATE ( [Total Revenue], ALLEXCEPT ( pbi_sales, pbi_sales[region] ) )
)
```

> <mark>**Mental model:** CALCULATE = "give me this number, but pretend the filters are these instead."</mark>

## Common filter modifiers

| Modifier | Meaning |
|---|---|
| `ALL ( table )` | Remove all filters |
| `ALLEXCEPT ( table, col )` | Remove all filters except listed columns |
| `KEEPFILTERS ( ... )` | Don''t override existing filters, intersect |
| `REMOVEFILTERS ( col )` | Drop filter on a specific column |

## SQL analog

The same "% of region total" pattern in SQL:
$md$,
$sql$SELECT
  region, category,
  ROUND(SUM(revenue), 2) AS revenue,
  ROUND(SUM(revenue) * 1.0 / SUM(SUM(revenue)) OVER (PARTITION BY region), 3) AS pct_of_region
FROM pbi_sales
GROUP BY region, category
ORDER BY region, revenue DESC;$sql$,
   ARRAY['pbi_sales'], 2);

  INSERT INTO public.lessons (module_id, slug, title, summary, content, try_it_sql, try_it_datasets, sort_order) VALUES
  (m4, 'dax-time-intelligence', 'Time intelligence',
   'YTD, MTD, prior period, and year-over-year growth using built-in DAX functions.',
$md$
## Prerequisites

You **must** have a proper date table marked as a date table (see *Star schema* lesson).

## The essential time-intelligence patterns

```dax
Revenue YTD =
TOTALYTD ( [Total Revenue], pbi_date[date] )

Revenue Last Year =
CALCULATE ( [Total Revenue], SAMEPERIODLASTYEAR ( pbi_date[date] ) )

YoY Growth % =
DIVIDE ( [Total Revenue] - [Revenue Last Year], [Revenue Last Year] )

Rolling 3-Month Revenue =
CALCULATE (
    [Total Revenue],
    DATESINPERIOD ( pbi_date[date], MAX ( pbi_date[date] ), -3, MONTH )
)
```

> <mark>**Common bug:** YTD returning blanks for January? Your date table is missing rows. It must contain **every day** of every year you query, with no gaps.</mark>

## Try it: equivalent YoY in SQL
$md$,
$sql$WITH monthly AS (
  SELECT
    EXTRACT(YEAR FROM CAST(order_date AS DATE)) AS year,
    EXTRACT(MONTH FROM CAST(order_date AS DATE)) AS month,
    SUM(revenue) AS revenue
  FROM pbi_sales
  GROUP BY 1,2
)
SELECT
  year, month,
  ROUND(revenue, 2) AS revenue,
  ROUND(LAG(revenue) OVER (PARTITION BY month ORDER BY year), 2) AS revenue_last_year,
  ROUND( (revenue - LAG(revenue) OVER (PARTITION BY month ORDER BY year))
         / NULLIF(LAG(revenue) OVER (PARTITION BY month ORDER BY year),0), 3) AS yoy_growth
FROM monthly
ORDER BY year, month;$sql$,
   ARRAY['pbi_sales'], 3);

  -- Module 5 - Dashboards
  INSERT INTO public.lessons (module_id, slug, title, summary, content, sort_order) VALUES
  (m5, 'dashboard-design', 'Dashboard design principles',
   'Layout, color, and chart selection rules that separate junior dashboards from senior ones.',
$md$
## The 5-second test

> <mark>**A good dashboard answers its key question in 5 seconds.** If the executive has to hunt, it''s a report — not a dashboard.</mark>

## Layout: the F-pattern

Eyes scan top-left → right → down. Put the **single most important KPI** top-left.

```
┌─────────────────────────────────────────┐
│  KPI 1   KPI 2   KPI 3   KPI 4          │  ← headline numbers
├─────────────────────────────────────────┤
│   Trend over time (large)   │ Breakdown │  ← context
├─────────────────────────────┴───────────┤
│            Detail table / drill         │  ← exploration
└─────────────────────────────────────────┘
```

## Chart selection cheat sheet

| Goal | Best chart | Avoid |
|---|---|---|
| Compare categories | Bar (horizontal if labels are long) | 3D, pie with >5 slices |
| Trend over time | Line | Bar over time |
| Part-to-whole | 100% stacked bar, treemap | Pie if >5 parts |
| Distribution | Histogram, box plot | Line |
| Two measures | Scatter | Dual-axis bar+line (usually) |
| Single number | Card / KPI visual | Gauge (wastes space) |

## Color rules

- One **brand color** for the highlighted measure
- **Grey** for everything else
- **Red/green** ONLY for variance vs target (and add icons for color-blind users)

> <mark>**Anti-pattern:** A rainbow of bars where every category gets its own color. Use one color and let position tell the story.</mark>
$md$, 1);

  INSERT INTO public.lessons (module_id, slug, title, summary, content, sort_order) VALUES
  (m5, 'dashboard-build', 'Build the Sales Performance dashboard',
   'Step-by-step build of a real executive sales dashboard using pbi_sales + pbi_targets + pbi_date.',
$md$
## What you''ll build

A single-page Sales Performance dashboard with:

- 4 KPI cards: **Total Revenue, Profit Margin, Orders, vs Target %**
- Revenue **trend** by month with prior-year overlay
- Revenue by **region** (bar)
- Top 10 **products** (table)
- Slicers: **Year, Region, Category**

## Step 1 — Load all three datasets

Get Data → Text/CSV → load `pbi_sales`, `pbi_targets`, `pbi_date`.

## Step 2 — Build the model

| From | To | Cardinality |
|---|---|---|
| `pbi_sales[order_date]` | `pbi_date[date]` | Many → One |
| `pbi_sales[region]` | `pbi_targets[region]`* | Many → Many (use a Region dim if possible) |

\* For a clean model, create a **Region** dimension table from `DISTINCT pbi_sales[region]` and connect both fact tables to it.

## Step 3 — Create measures

```dax
Total Revenue   = SUM ( pbi_sales[revenue] )
Total Cost      = SUM ( pbi_sales[cost] )
Total Profit    = [Total Revenue] - [Total Cost]
Profit Margin   = DIVIDE ( [Total Profit], [Total Revenue] )
Orders          = DISTINCTCOUNT ( pbi_sales[order_id] )
Target          = SUM ( pbi_targets[revenue_target] )
% vs Target     = DIVIDE ( [Total Revenue], [Target] )
Revenue PY      = CALCULATE ( [Total Revenue], SAMEPERIODLASTYEAR ( pbi_date[date] ) )
```

## Step 4 — Lay out visuals

Follow the F-pattern from the previous lesson. KPI cards on top, line chart middle-left, region bar middle-right, product table bottom.

## Step 5 — Add slicers and publish

> <mark>**Before you publish:** turn on **Tooltips**, set the **page background**, hide unused fields, and rename measures to business-friendly labels.</mark>

## Practice challenge

1. Add a **conditional formatting** rule that paints `% vs Target` red when below 90%, amber 90–100%, green above.
2. Add a **drill-through page** that filters by selected product.
3. Publish to the Power BI Service and share the link in your portfolio.
$md$, 2);

  INSERT INTO public.lessons (module_id, slug, title, summary, content, sort_order) VALUES
  (m5, 'pbi-publish-share', 'Publishing & sharing',
   'Get your dashboard out of Desktop and into stakeholders'' hands.',
$md$
## Publish flow

1. **Home → Publish** in Power BI Desktop
2. Sign in → choose a workspace
3. In the **Power BI Service** (app.powerbi.com), open the report
4. Pin visuals to a **Dashboard** for an at-a-glance view
5. **Share** with users or publish to a **Workspace App**

## Refresh

| Source | Refresh option |
|---|---|
| Files in OneDrive / SharePoint | Automatic |
| On-premise SQL / files | Install the **On-premises Data Gateway** |
| Cloud sources (Snowflake, BigQuery) | Schedule directly |

> <mark>**Rule:** No dashboard is "done" until refresh is scheduled and an owner is named. Otherwise it''s an orphan.</mark>

## Portfolio tip

Publish to **Publish to web** (public link) for portfolio pieces — never for real customer data. Embed the link in your portfolio page for recruiters to interact with.
$md$, 3);

END $$;
