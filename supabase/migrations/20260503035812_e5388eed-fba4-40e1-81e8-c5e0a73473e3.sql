UPDATE public.lessons SET content = '## Learning outcomes

- Read and write a basic `SELECT … FROM … WHERE …` statement.
- Filter rows using comparison and logical operators.
- Use `LIKE`, `IN`, `BETWEEN`, and `IS NULL` for everyday filtering.
- Use `ORDER BY` and `LIMIT` to control output.

---

## 1. The shape of every query

```sql
SELECT  <columns>      -- WHAT do I want?
FROM    <table>        -- WHERE does it live?
WHERE   <conditions>;  -- WHICH rows do I keep?
```

<div class="callout callout-key"><strong>🔑 Remember</strong>

SQL is **declarative** — describe the result, the database figures out *how*.

</div>

## 2. Picking columns

```sql
SELECT * FROM customers;                                     -- all columns
SELECT first_name, country FROM customers;                   -- specific
SELECT first_name AS given_name FROM customers;              -- alias
```

## 3. Filtering with WHERE

| Operator | Meaning | Example |
|---|---|---|
| `=`  `!=` | equals / not equals | `country = ''US''` |
| `>` `<` `>=` `<=` | numeric / date | `signup_date >= ''2024-01-01''` |
| `AND` `OR` `NOT` | combine | `country = ''US'' AND age > 30` |
| `IN (...)` | match any | `country IN (''US'',''CA'')` |
| `BETWEEN a AND b` | inclusive range | `age BETWEEN 25 AND 40` |
| `LIKE` `ILIKE` | pattern (`%`, `_`) | `email LIKE ''%@gmail.com''` |
| `IS NULL` / `IS NOT NULL` | missing | `phone IS NULL` |

<div class="callout callout-warn"><strong>⚠️ Pitfall</strong>

`NULL = NULL` is **never true**. Always use `IS NULL`.

</div>

## 4. Sorting and limiting

```sql
SELECT first_name, country, signup_date
FROM customers
WHERE country = ''US''
ORDER BY signup_date DESC
LIMIT 10;
```

## 5. Real-world example

> *"20 most recent customers from US or Canada."*

```sql
SELECT email, country, signup_date
FROM customers
WHERE country IN (''US'',''CA'')
ORDER BY signup_date DESC
LIMIT 20;
```

<div class="callout callout-tip"><strong>💡 Pro tip</strong>

Always pair `LIMIT` with `ORDER BY` — otherwise the database returns *any* matching rows.

</div>

## 6. Common mistakes

| ❌ Don''t | ✅ Do |
|---|---|
| `WHERE country = NULL` | `WHERE country IS NULL` |
| `SELECT *` in dashboards | List columns explicitly |
| `LIKE ''gmail%''` | `LIKE ''%@gmail.com''` |

## ✏️ Try it yourself

Edit the query in the **Try-It** panel below — change the country, the limit, the order. Click **Run**.',
try_it_sql = 'SELECT first_name, country, signup_date
FROM customers
WHERE country = ''US''
ORDER BY signup_date DESC
LIMIT 10;',
try_it_datasets = ARRAY['customers']::text[]
WHERE id = '14a4e3f5-170a-4f9e-92cf-834668b12caf';

UPDATE public.lessons SET content = '## Learning outcomes

- Use `DISTINCT` to remove duplicates.
- Count rows, distinct values, and rows matching a condition.
- Tell apart `COUNT(*)`, `COUNT(col)`, `COUNT(DISTINCT col)`.

---

## 1. DISTINCT — unique values

```sql
SELECT DISTINCT country FROM customers;
SELECT DISTINCT country, segment FROM customers;
```

<div class="callout callout-key"><strong>🔑 Remember</strong>

`DISTINCT` looks at the **entire SELECT list**, not just the first column.

</div>

## 2. The COUNT family

| Expression | Counts |
|---|---|
| `COUNT(*)` | All rows (incl. NULLs) |
| `COUNT(col)` | Rows where `col IS NOT NULL` |
| `COUNT(DISTINCT col)` | Unique non-null values |
| `COUNT(*) FILTER (WHERE …)` | Conditional count |

```sql
SELECT
  COUNT(*)                                AS total,
  COUNT(phone)                            AS with_phone,
  COUNT(DISTINCT country)                 AS countries,
  COUNT(*) FILTER (WHERE country=''US'')    AS us_only
FROM customers;
```

<div class="callout callout-warn"><strong>⚠️ Integer division</strong>

`COUNT(phone) / COUNT(*)` returns 0. Use `100.0 * COUNT(phone) / COUNT(*)`.

</div>

## ✏️ Try it yourself
Count distinct **segments**, then US-only customers.',
try_it_sql = 'SELECT COUNT(*) AS total, COUNT(DISTINCT country) AS countries FROM customers;',
try_it_datasets = ARRAY['customers']::text[]
WHERE id = '086c9e40-b064-47de-8328-2510719f1f26';

UPDATE public.lessons SET content = '## Learning outcomes

- Combine tables with `INNER`, `LEFT`, `RIGHT`, `FULL OUTER` joins.
- Pick the right join for the question.
- Avoid **row explosion** and **silent NULLs**.

---

## 1. Why we join

```sql
SELECT c.first_name, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id;
```

## 2. The four joins

| Join | Keeps rows that… | Use when |
|---|---|---|
| `INNER JOIN` | match in both | Only customers *with* orders |
| `LEFT JOIN`  | match + all left | Every customer, orders if any |
| `RIGHT JOIN` | match + all right | Rare — rewrite as LEFT |
| `FULL OUTER JOIN` | rows on either side | Audits / reconciliation |

<div class="callout callout-key"><strong>🔑 Mental model</strong>

Two overlapping circles. `INNER` = overlap. `LEFT` = left circle. `FULL` = both.

</div>

## 3. Real-world example

> *"Lifetime value per customer, including non-buyers."*

```sql
SELECT c.id, c.first_name,
       COALESCE(SUM(o.amount), 0) AS lifetime_value
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.first_name
ORDER BY lifetime_value DESC;
```

<div class="callout callout-warn"><strong>⚠️ Row explosion</strong>

Multiple matches on the right multiply rows. Always check `COUNT(*)` before/after.

</div>

## 4. Common mistakes

| ❌ Don''t | ✅ Do |
|---|---|
| Filter LEFT-joined rows in `WHERE` | Filter in `ON` |
| Join on names | Join on **IDs** |

## ✏️ Try it yourself
Switch `LEFT` to `INNER` — what changes?',
try_it_sql = 'SELECT c.first_name, COUNT(o.id) AS orders, COALESCE(SUM(o.amount),0) AS spend
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.first_name
ORDER BY spend DESC
LIMIT 10;',
try_it_datasets = ARRAY['customers','orders']::text[]
WHERE id = 'd4599256-c326-41fc-ba5d-72f06c12aec7';

UPDATE public.lessons SET content = '## Learning outcomes

- Aggregate with `SUM`, `AVG`, `MIN`, `MAX`, `COUNT`.
- Group by one or more columns.
- Filter aggregates with `HAVING` vs. `WHERE`.

---

## 1. Aggregation = many rows → one number

```sql
SELECT COUNT(*) AS orders, SUM(amount) AS revenue FROM orders;
```

## 2. GROUP BY = one number per group

```sql
SELECT country, COUNT(*) AS customers
FROM customers
GROUP BY country
ORDER BY customers DESC;
```

<div class="callout callout-key"><strong>🔑 The golden rule</strong>

Every column in `SELECT` must be **inside an aggregate** OR **in GROUP BY**.

</div>

## 3. WHERE vs HAVING

| Clause | Filters | Runs |
|---|---|---|
| `WHERE` | rows | **before** aggregation |
| `HAVING` | aggregates | **after** aggregation |

```sql
SELECT country, COUNT(*) AS c
FROM customers
WHERE signup_date >= ''2024-01-01''
GROUP BY country
HAVING COUNT(*) >= 50;
```

## 4. Cheat sheet

| Function | Returns |
|---|---|
| `COUNT(*)` | rows |
| `SUM(x)` | total |
| `AVG(x)` | mean |
| `MIN/MAX` | extremes |
| `STRING_AGG(x,'','')` | joined list |

<div class="callout callout-tip"><strong>💡 Pro tip</strong>

`ROUND(x, 2)` for money, `ROUND(x, 1)` for percentages — stakeholder-ready output.

</div>

## ✏️ Try it yourself
Group orders by month and sum revenue.',
try_it_sql = 'SELECT DATE_TRUNC(''month'', order_date) AS month,
       COUNT(*) AS orders, ROUND(SUM(amount),2) AS revenue
FROM orders GROUP BY 1 ORDER BY 1;',
try_it_datasets = ARRAY['orders']::text[]
WHERE id = '224530a6-64ee-406d-a4a0-1de4574f29bc';

UPDATE public.lessons SET content = '## Learning outcomes

- Read `OVER (PARTITION BY … ORDER BY …)`.
- Use `ROW_NUMBER`, `RANK`, `DENSE_RANK`, running totals, moving averages.
- Use `LAG` / `LEAD` to compare across rows.

---

## 1. The big idea

A **window function** computes across a window of rows **without collapsing** them.

```sql
SELECT employee_id, department, salary,
       AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
```

<div class="callout callout-key"><strong>🔑 GROUP BY vs OVER</strong>

GROUP BY collapses rows. `OVER` keeps every row.

</div>

## 2. Anatomy of OVER

```
fn() OVER (
  PARTITION BY <col>
  ORDER BY     <col>
  ROWS BETWEEN ... AND ...
)
```

## 3. Ranking family

| Function | Behavior on ties |
|---|---|
| `ROW_NUMBER()` | 1, 2, 3, 4 |
| `RANK()` | 1, 2, 2, 4 |
| `DENSE_RANK()` | 1, 2, 2, 3 |
| `NTILE(4)` | quartiles |

## 4. Running totals & moving averages

```sql
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date) AS running_revenue,
       AVG(amount) OVER (ORDER BY order_date
                         ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma_7d
FROM orders;
```

## 5. LAG / LEAD

```sql
SELECT order_date, amount,
       LAG(amount) OVER (ORDER BY order_date) AS prev,
       amount - LAG(amount) OVER (ORDER BY order_date) AS dod
FROM orders;
```

<div class="callout callout-warn"><strong>⚠️ Pitfall</strong>

Without `ORDER BY` inside `OVER`, `SUM` is just a partition total — no running behavior.

</div>

## ✏️ Try it yourself
Rank products by revenue inside each category.',
try_it_sql = 'SELECT product_id, category, SUM(amount) AS revenue,
       RANK() OVER (PARTITION BY category ORDER BY SUM(amount) DESC) AS rk
FROM orders GROUP BY product_id, category
ORDER BY category, rk;',
try_it_datasets = ARRAY['orders']::text[]
WHERE id = '30ed8d8d-18aa-4059-be2f-92a03b3d7c8d';

UPDATE public.lessons SET content = '## Learning outcomes

- Write modular queries with `WITH` (CTEs).
- Chain CTEs into pipelines.
- Know when a CTE beats a subquery.

---

## 1. What is a CTE?

A named subquery defined at the top with `WITH`.

```sql
WITH top_customers AS (
  SELECT customer_id, SUM(amount) AS lifetime_value
  FROM orders GROUP BY customer_id
)
SELECT c.first_name, t.lifetime_value
FROM top_customers t
JOIN customers c ON c.id = t.customer_id
ORDER BY t.lifetime_value DESC LIMIT 10;
```

<div class="callout callout-key"><strong>🔑 Why CTEs</strong>

**Readable**, **debuggable**, **reusable** — the senior-analyst signature.

</div>

## 2. Chained CTEs

```sql
WITH monthly AS (
  SELECT DATE_TRUNC(''month'', order_date) AS m, SUM(amount) AS rev
  FROM orders GROUP BY 1
),
growth AS (
  SELECT m, rev, LAG(rev) OVER (ORDER BY m) AS prev FROM monthly
)
SELECT m, rev, ROUND(100.0*(rev-prev)/NULLIF(prev,0), 1) AS pct_growth
FROM growth;
```

## 3. CTE vs subquery

| | CTE | Subquery |
|---|---|---|
| Readability | ✅ | ❌ |
| Reuse | ✅ | ❌ |
| Performance | equal | equal |

## 4. Recursive CTE (peek)

```sql
WITH RECURSIVE n(x) AS (
  SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<10
) SELECT * FROM n;
```

## ✏️ Try it yourself',
try_it_sql = 'WITH monthly AS (
  SELECT DATE_TRUNC(''month'', order_date) AS m, SUM(amount) AS rev
  FROM orders GROUP BY 1
)
SELECT m, rev, LAG(rev) OVER (ORDER BY m) AS prev,
       ROUND(100.0*(rev-LAG(rev) OVER (ORDER BY m))/NULLIF(LAG(rev) OVER (ORDER BY m),0),1) AS pct_growth
FROM monthly;',
try_it_datasets = ARRAY['orders']::text[]
WHERE id = '033e0ce6-1ab7-4db6-84fc-b7570bcae11b';

-- Python lessons (concise rewrite)
UPDATE public.lessons SET content = '## Learning outcomes

- Load CSVs into a Pandas `DataFrame`.
- Inspect with `head`, `info`, `describe`, `shape`.
- Select columns and filter rows.

---

## 1. Series vs DataFrame

| Object | What it is |
|---|---|
| `Series` | 1D labeled column |
| `DataFrame` | 2D labeled table |

## 2. Loading & inspecting

```python
import pandas as pd
df = pd.read_csv("customers.csv")
df.head(); df.shape; df.info(); df.describe()
```

<div class="callout callout-key"><strong>🔑 Always</strong>

Run `df.info()` and `df.isna().sum()` first on any new dataset.

</div>

## 3. Selecting & filtering

```python
df[["first_name","country"]]
df.loc[df["country"]=="US"]
df[(df["age"]>=18) & (df["age"]<65)]   # use & not "and"
```

<div class="callout callout-warn"><strong>⚠️ Pitfall</strong>

Use `&`, `|`, `~` (not `and`/`or`/`not`) and **wrap each condition in parentheses**.

</div>'
WHERE id = '741617c0-81a6-4fc9-9963-c8e5092ceefe';

UPDATE public.lessons SET content = '## Learning outcomes

- Use `groupby().agg()` for summary stats.
- Apply multiple aggregations.
- Sort and `reset_index` for stakeholder output.

---

## 1. Split-apply-combine

```python
df.groupby("country")["amount"].sum()
```

## 2. Multiple aggregations

```python
out = (df.groupby("country")
   .agg(orders=("order_id","count"),
        revenue=("amount","sum"),
        avg_basket=("amount","mean"))
   .round(2).sort_values("revenue", ascending=False).reset_index())
```

| Pandas | SQL equivalent |
|---|---|
| `"count"` | `COUNT(*)` |
| `"sum"` | `SUM` |
| `"mean"` | `AVG` |
| `"nunique"` | `COUNT(DISTINCT)` |

<div class="callout callout-tip"><strong>💡 Pro tip</strong>

Use **named aggregations** for clean column names.

</div>'
WHERE id = 'e7818dec-9349-45af-9ddd-5df03173d02c';

UPDATE public.lessons SET content = '## Learning outcomes

- Detect missing values with `isna()`.
- Choose drop / fill / impute strategies.
- Avoid leakage when handling NaNs.

---

## 1. Spot the gaps

```python
df.isna().sum()
df.isna().mean().sort_values()
```

## 2. Strategy table

| Strategy | When | Code |
|---|---|---|
| Drop rows | <5% missing | `df.dropna(subset=["age"])` |
| Drop column | >50% missing | `df.drop(columns=[...])` |
| Constant fill | Known default | `.fillna("Unknown")` |
| Median | numeric, skewed | `.fillna(df["x"].median())` |
| Forward fill | time series | `.ffill()` |
| Group-wise | hierarchical | `groupby(...)["x"].transform("median")` |

<div class="callout callout-warn"><strong>⚠️ Never</strong>

Never fill *before* a train/test split — it leaks the test set.

</div>'
WHERE id = 'a2183c7c-4557-425a-9dcd-68bf301bfc51';

UPDATE public.lessons SET content = '## Learning outcomes

- Convert types (`int`, `float`, `datetime`, `category`).
- Parse dates and extract parts.
- Compute date diffs and resample.

---

```python
df["age"] = pd.to_numeric(df["age"], errors="coerce")
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df["country"] = df["country"].astype("category")
```

| Code | Meaning |
|---|---|
| `df["d"].dt.year` | Year |
| `df["d"].dt.month` | Month |
| `df["d"].dt.day_name()` | Weekday name |
| `df["d"].dt.to_period("M")` | YYYY-MM |

```python
daily = df.set_index("order_date")["amount"].resample("D").sum()
```

<div class="callout callout-key"><strong>🔑 Always</strong>

Convert dates **early** — most bugs come from comparing strings instead of `datetime64`.

</div>'
WHERE id = '14880892-0f28-45f7-bc4a-ec7d6d09146c';

UPDATE public.lessons SET content = '## Learning outcomes

- Build line, bar, histogram, scatter charts.
- Title and label axes.
- Save figures.

```python
import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(8,4))
ax.plot(daily.index, daily.values)
ax.set_title("Daily revenue")
plt.tight_layout(); plt.savefig("daily.png", dpi=150)
```

| Goal | Chart |
|---|---|
| Trend over time | Line |
| Compare categories | Bar |
| Distribution | Histogram |
| Relationships | Scatter |

<div class="callout callout-warn"><strong>⚠️ Avoid</strong>

Pie charts beyond 3–4 slices, dual axes, 3D effects.

</div>'
WHERE id = 'f79b1a25-e914-4b8b-8fb8-94b02ea65745';

UPDATE public.lessons SET content = '## Learning outcomes

- Use Seaborn''s high-level API for fast EDA.
- Apply `hue`, `col`, `row` for small multiples.

```python
import seaborn as sns
sns.set_theme(style="whitegrid")
sns.boxplot(data=df, x="country", y="amount", hue="segment")
sns.relplot(data=df, x="age", y="amount", col="country", col_wrap=3, kind="scatter")
```

| Function | Use |
|---|---|
| `histplot` | distributions |
| `boxplot` | compare groups |
| `scatterplot` | two numeric vars |
| `barplot` | mean per category |
| `heatmap` | correlations |'
WHERE id = 'e93372c6-225b-434e-84ae-ef40d5bed946';

UPDATE public.lessons SET content = '## Learning outcomes

- Compute mean, median, mode.
- Pick the right measure of spread.
- Detect outliers with the IQR rule.

| Stat | Best for | Outlier-sensitive |
|---|---|---|
| Mean | symmetric | **Yes** |
| Median | skewed (money) | No |
| Mode | categorical | No |

<div class="callout callout-key"><strong>🔑 Rule of thumb</strong>

Salaries, prices, durations → **median**.

</div>

| Spread | Intuition |
|---|---|
| Range | max − min |
| IQR | Q3 − Q1 |
| Std dev | √variance |

**Tukey outlier**: < `Q1 − 1.5·IQR` or > `Q3 + 1.5·IQR`.'
WHERE id = '14f7b77f-b916-4c29-a9ba-ab9222d8d33e';

UPDATE public.lessons SET content = '## Learning outcomes

- Recognize Normal, Skewed, Uniform, Bimodal, Long-tail shapes.
- Match distribution to a real-world phenomenon.
- Know when to log-transform.

| Shape | Real-world example |
|---|---|
| Normal | heights, IQ |
| Right-skewed | income, order amount |
| Bimodal | mixed populations |
| Long-tail | website traffic |

<div class="callout callout-tip"><strong>💡 Log transform</strong>

Right-skewed money/count data often becomes ~Normal after `log1p()`.

</div>

**68-95-99.7 rule**: µ±1σ → 68%, ±2σ → 95%, ±3σ → 99.7%.'
WHERE id = 'b1e2dddd-30c2-4b33-966f-9f922896bbc3';

UPDATE public.lessons SET content = '## Learning outcomes

- State H₀ / H₁ correctly.
- Pick the right test.
- Interpret p-values without overclaiming.

---

1. **H₀** — no effect
2. **H₁** — there IS an effect
3. Pick a test → compute p
4. If p < α (0.05) → reject H₀

<div class="callout callout-key"><strong>🔑 What p IS</strong>

P(data this extreme **if H₀ true**). **NOT** P(H₀ true).

</div>

| Question | Test |
|---|---|
| Two means, normal | Welch''s t-test |
| Two means, skewed | Mann-Whitney U |
| Two proportions | z-test of proportions |
| Categorical vs categorical | chi-square |
| Before/after same users | paired t-test |

<div class="callout callout-warn"><strong>⚠️ Effect size > p-value</strong>

A 0.0001% lift can be "significant" with millions of users — and not worth shipping.

</div>'
WHERE id = 'f13139c0-4b98-4d3b-944b-1f062791842f';

UPDATE public.lessons SET content = '## Learning outcomes

- Read an A/B test readout end-to-end.
- Compute lift and CI.
- Spot pitfalls: peeking, novelty, SRM.

| Metric | Why |
|---|---|
| Sample per arm | Power |
| Conversion per arm | Headline |
| Absolute & relative lift | Magnitude |
| 95% CI | Plausible truth |
| p-value | Decision threshold |
| Guardrails | Did anything else break? |

| ❌ Pitfall | Fix |
|---|---|
| Peeking at p daily | Pre-commit sample & date |
| SRM | Chi-square assignment counts |
| Novelty effect | Run ≥ 1–2 weeks |
| Multiple comparisons | Bonferroni / Holm |
| Non-independent units | Cluster by user |

<div class="callout callout-warn"><strong>⚠️ Stop only when</strong>

You hit pre-committed sample size, pre-committed time, OR a guardrail fires.

</div>

## ✏️ Try it yourself
Compute conversion lift between control and variant.',
try_it_sql = 'SELECT variant, COUNT(*) AS users, SUM(converted) AS conv,
       ROUND(100.0*SUM(converted)/COUNT(*),2) AS conv_rate_pct
FROM ab_test GROUP BY variant;',
try_it_datasets = ARRAY['ab_test']::text[]
WHERE id = 'ddf6c9d1-78d8-4ae3-b712-e3362cc0c870';

UPDATE public.lessons SET content = '## Learning outcomes

- Apply the BAN-Trend-Detail layout.
- Use color, hierarchy, white-space intentionally.
- Pass the 5-second test.

| Section | Purpose |
|---|---|
| **BAN** (Big-Ass Number) | Headline KPI |
| **Trend** | How it''s moving |
| **Detail** | Drill-down breakdowns |

<div class="callout callout-key"><strong>🔑 Less is more</strong>

Cut every chart that doesn''t change a decision. Aim for 4–6 visuals.

</div>

| Color rule | Why |
|---|---|
| One accent color | Draw the eye |
| Gray for context | Reduce noise |
| Red/green = good/bad **only** | Color-blind safe |'
WHERE id = 'f0c7a4c7-303e-4739-8e3f-d8b9713b69e0';

UPDATE public.lessons SET content = '## Learning outcomes

- Match a question to a chart.
- Avoid common chart misuses.

| Question | Chart | Avoid |
|---|---|---|
| Trend over time | Line | Bar with many bars |
| Compare categories | Bar | Pie |
| Distribution | Histogram, box | Bar |
| Relationship | Scatter | Line |
| Composition | Stacked bar (≤4) | Pie |
| Geographic | Choropleth | Bubble for tiny diffs |
| Funnel | Funnel, Sankey | 3D anything |

<div class="callout callout-warn"><strong>⚠️ Never</strong>

Truncate the y-axis on a bar chart — it lies about magnitude.

</div>'
WHERE id = '551a04dd-b8f4-4cd0-bdaf-6839b5d635f3';

-- ============= NEW MODULES & LESSONS =============
INSERT INTO public.modules (track_id, slug, title, summary, sort_order, is_published) VALUES
  ('3b1b575e-c5f2-4dc1-b8d1-151ac28e7ec9','subqueries','Subqueries & Set Operations','Scalar, correlated, EXISTS subqueries. UNION, INTERSECT, EXCEPT.',4,true),
  ('3b1b575e-c5f2-4dc1-b8d1-151ac28e7ec9','advanced-analytics','Advanced SQL Analytics','Cohorts, funnels, percentiles, string/date functions in pure SQL.',5,true),
  ('5a0c91e2-edfa-4c9a-94b6-994cf75fdc6d','advanced-pandas','Advanced Pandas','Merge, pivot, vectorization.',4,true),
  ('5a0c91e2-edfa-4c9a-94b6-994cf75fdc6d','stats-with-python','Stats with NumPy & SciPy','Tests, CIs, bootstrapping in Python.',5,true),
  ('a15acd45-8af9-4509-9213-8892e53eb983','probability','Probability & Inference','Sampling, CIs, the Central Limit Theorem.',4,true),
  ('a15acd45-8af9-4509-9213-8892e53eb983','storytelling','Storytelling with Data','Communicate insight, not effort.',5,true)
ON CONFLICT (track_id, slug) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, sort_order=EXCLUDED.sort_order;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order, try_it_sql, try_it_datasets)
SELECT m.id, 'subqueries-basics', 'Subqueries: scalar, list, correlated', '## Learning outcomes
- Use scalar subqueries for single-value injection.
- Filter with `IN`, `EXISTS`, `NOT EXISTS`.
- Recognize correlated subqueries.

| Type | Returns | Used in |
|---|---|---|
| Scalar | 1 row, 1 col | anywhere a value goes |
| List | many rows, 1 col | `IN (...)` |
| Table | many rows, many cols | `FROM (...)` |

```sql
SELECT * FROM customers WHERE age > (SELECT AVG(age) FROM customers);
SELECT * FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id=c.id);
```

<div class="callout callout-warn"><strong>⚠️ NOT IN gotcha</strong>

If the subquery returns any NULL, `NOT IN` returns no rows. Use `NOT EXISTS`.

</div>

## ✏️ Try it', 1,
'SELECT c.first_name, c.country FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id=c.id) LIMIT 20;',
ARRAY['customers','orders']::text[]
FROM public.modules m WHERE m.track_id='3b1b575e-c5f2-4dc1-b8d1-151ac28e7ec9' AND m.slug='subqueries'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order, try_it_sql, try_it_datasets)
SELECT m.id, 'set-operations', 'UNION, INTERSECT, EXCEPT', '## Learning outcomes
- Combine result sets with `UNION` / `UNION ALL`.
- Find common rows with `INTERSECT`.
- Find diffs with `EXCEPT`.

| Operator | Returns |
|---|---|
| `UNION` | both, deduped |
| `UNION ALL` | both, keep dups (faster) |
| `INTERSECT` | rows in both |
| `EXCEPT` | first minus second |

<div class="callout callout-key"><strong>🔑 Rules</strong>

Same number of columns, compatible types.

</div>

## ✏️ Try it', 2,
'SELECT DISTINCT country FROM customers
EXCEPT
SELECT DISTINCT c.country FROM customers c JOIN orders o ON o.customer_id=c.id;',
ARRAY['customers','orders']::text[]
FROM public.modules m WHERE m.track_id='3b1b575e-c5f2-4dc1-b8d1-151ac28e7ec9' AND m.slug='subqueries'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order, try_it_sql, try_it_datasets)
SELECT m.id, 'cohort-analysis', 'Cohort analysis in SQL', '## Learning outcomes
- Build a signup-cohort table.
- Compute retention with self-joins.

```sql
WITH first_order AS (
  SELECT customer_id, MIN(DATE_TRUNC(''month'', order_date)) AS cohort_month
  FROM orders GROUP BY 1
)
SELECT cohort_month, COUNT(*) AS new_users
FROM first_order GROUP BY 1 ORDER BY 1;
```

<div class="callout callout-key"><strong>🔑 Cohort</strong>

A group of users who share a starting event (often: month of first purchase).

</div>

## ✏️ Try it', 1,
'WITH first_order AS (
  SELECT customer_id, MIN(DATE_TRUNC(''month'', order_date)) AS cohort_month
  FROM orders GROUP BY 1
) SELECT cohort_month, COUNT(*) AS users FROM first_order GROUP BY 1 ORDER BY 1;',
ARRAY['orders','customers']::text[]
FROM public.modules m WHERE m.track_id='3b1b575e-c5f2-4dc1-b8d1-151ac28e7ec9' AND m.slug='advanced-analytics'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'funnels', 'Funnel & conversion analysis', '## Learning outcomes
- Build a step-by-step funnel.
- Compute step-over-step conversion.

```sql
WITH steps AS (
  SELECT user_id,
    MAX(CASE WHEN event=''view''     THEN 1 ELSE 0 END) AS s1,
    MAX(CASE WHEN event=''add_cart'' THEN 1 ELSE 0 END) AS s2,
    MAX(CASE WHEN event=''checkout'' THEN 1 ELSE 0 END) AS s3,
    MAX(CASE WHEN event=''purchase'' THEN 1 ELSE 0 END) AS s4
  FROM events GROUP BY user_id
)
SELECT SUM(s1) AS viewed, SUM(s2) AS added, SUM(s3) AS checked_out, SUM(s4) AS purchased
FROM steps;
```

<div class="callout callout-tip"><strong>💡 Tip</strong>

One CASE per step — easy to chart in BI tools.

</div>', 2
FROM public.modules m WHERE m.track_id='3b1b575e-c5f2-4dc1-b8d1-151ac28e7ec9' AND m.slug='advanced-analytics'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order, try_it_sql, try_it_datasets)
SELECT m.id, 'percentiles-quantiles', 'Percentiles, medians & quantiles', '## Learning outcomes
- Compute medians and percentiles.
- Bucket users with `NTILE(4)`.
- Report p50 / p90 / p99.

```sql
SELECT
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median,
  PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY amount) AS p90,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY amount) AS p99
FROM orders;
```

<div class="callout callout-key"><strong>🔑 Why p50, not mean?</strong>

Means hide outliers. p50 is the typical user experience.

</div>

## ✏️ Try it', 3,
'SELECT QUANTILE_CONT(amount, 0.5) AS median, QUANTILE_CONT(amount, 0.9) AS p90 FROM orders;',
ARRAY['orders']::text[]
FROM public.modules m WHERE m.track_id='3b1b575e-c5f2-4dc1-b8d1-151ac28e7ec9' AND m.slug='advanced-analytics'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order, try_it_sql, try_it_datasets)
SELECT m.id, 'string-and-date-funcs', 'String & date functions you''ll use weekly', '## Learning outcomes
- Clean strings: `LOWER`, `TRIM`, `REPLACE`, `SPLIT_PART`.
- Slice dates: `DATE_TRUNC`, `EXTRACT`, `INTERVAL`.

| Goal | Function |
|---|---|
| Lowercase | `LOWER(s)` |
| Trim | `TRIM(s)` |
| Replace | `REPLACE(s,''a'',''b'')` |
| Email domain | `SPLIT_PART(email,''@'',2)` |
| First of month | `DATE_TRUNC(''month'', d)` |
| Day of week | `EXTRACT(DOW FROM d)` |
| 30 days ago | `CURRENT_DATE - INTERVAL ''30 days''` |

<div class="callout callout-warn"><strong>⚠️ Time zones</strong>

Always be explicit about UTC vs local — many bugs hide here.

</div>

## ✏️ Try it', 4,
'SELECT SPLIT_PART(email,''@'',2) AS domain, COUNT(*) FROM customers GROUP BY 1 ORDER BY 2 DESC LIMIT 10;',
ARRAY['customers']::text[]
FROM public.modules m WHERE m.track_id='3b1b575e-c5f2-4dc1-b8d1-151ac28e7ec9' AND m.slug='advanced-analytics'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

-- Python advanced
INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'merging-joining', 'Merging & joining DataFrames', '## Learning outcomes
- Use `pd.merge` with `how`, `on`, `left_on/right_on`.
- Validate joins with `validate=`.
- Avoid duplicated rows after a merge.

```python
out = customers.merge(orders, left_on="id", right_on="customer_id",
                      how="left", validate="one_to_many", indicator=True)
print(out["_merge"].value_counts())
```

<div class="callout callout-key"><strong>🔑 validate=</strong>

`"one_to_many"` raises if a customer matches twice — your best safety net.

</div>', 1
FROM public.modules m WHERE m.track_id='5a0c91e2-edfa-4c9a-94b6-994cf75fdc6d' AND m.slug='advanced-pandas'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'pivot-melt', 'Pivot, melt & reshape', '## Learning outcomes
- Wide ↔ long with `pivot_table` and `melt`.

```python
wide = df.pivot_table(index="month", columns="country", values="amount",
                      aggfunc="sum", fill_value=0)
long = wide.reset_index().melt(id_vars="month", var_name="country", value_name="amount")
```', 2
FROM public.modules m WHERE m.track_id='5a0c91e2-edfa-4c9a-94b6-994cf75fdc6d' AND m.slug='advanced-pandas'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'apply-vectorize', 'Apply, map & vectorization', '## Learning outcomes
- Prefer vectorized ops over `apply`.
- Use `np.where` and `np.select` for conditional logic.

| Slow | Fast |
|---|---|
| `df["x"].apply(lambda v: v*2)` | `df["x"]*2` |
| `df.apply(row_fn, axis=1)` | vectorized expression |
| `if/else` per row | `np.where(cond, a, b)` |

<div class="callout callout-tip"><strong>💡 Speed</strong>

Vectorized Pandas is often 100× faster than `apply`.

</div>', 3
FROM public.modules m WHERE m.track_id='5a0c91e2-edfa-4c9a-94b6-994cf75fdc6d' AND m.slug='advanced-pandas'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'scipy-tests', 'scipy.stats — t-test, chi-square, Mann-Whitney', '## Learning outcomes
- Run common tests in 1 line.
- Read `statistic` and `pvalue`.

```python
from scipy import stats
stats.ttest_ind(a, b, equal_var=False)              # Welch t-test
from statsmodels.stats.proportion import proportions_ztest
proportions_ztest([conv_a, conv_b], [n_a, n_b])     # two-prop z
```', 1
FROM public.modules m WHERE m.track_id='5a0c91e2-edfa-4c9a-94b6-994cf75fdc6d' AND m.slug='stats-with-python'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'bootstrapping', 'Bootstrap confidence intervals', '## Learning outcomes
- Build CI without distribution assumptions.

```python
import numpy as np
rng = np.random.default_rng(0)
boot = [rng.choice(x, size=len(x), replace=True).mean() for _ in range(2000)]
ci = np.percentile(boot, [2.5, 97.5])
```

<div class="callout callout-key"><strong>🔑 Bootstrap = empirical CI</strong>

Great when data is skewed or sample is small.

</div>', 2
FROM public.modules m WHERE m.track_id='5a0c91e2-edfa-4c9a-94b6-994cf75fdc6d' AND m.slug='stats-with-python'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

-- Stats-BI new
INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'sampling-clt', 'Sampling & the Central Limit Theorem', '## Learning outcomes
- Random vs convenience samples.
- The CLT in plain English.
- Compute SE of the mean.

<div class="callout callout-key"><strong>🔑 CLT</strong>

The mean of a big enough sample is approximately Normal — even when the underlying data isn''t.

</div>

| Term | Formula |
|---|---|
| Standard error | σ / √n |
| 95% CI for mean | x̄ ± 1.96 · SE |', 1
FROM public.modules m WHERE m.track_id='a15acd45-8af9-4509-9213-8892e53eb983' AND m.slug='probability'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'confidence-intervals', 'Confidence intervals you can trust', '## Learning outcomes
- Build CIs for means and proportions.
- Interpret without overclaiming.

<div class="callout callout-warn"><strong>⚠️ Wrong interpretation</strong>

"There''s a 95% chance the true mean is in the CI." — *No.* Correct: 95% of CIs built this way contain the true mean.

</div>', 2
FROM public.modules m WHERE m.track_id='a15acd45-8af9-4509-9213-8892e53eb983' AND m.slug='probability'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'exec-summary', 'Writing the executive summary', '## Learning outcomes
- Structure findings as **TL;DR → so-what → details**.
- Write headlines that state the *insight*, not the *chart*.

| ❌ Headline | ✅ Headline |
|---|---|
| "Revenue by month" | "Revenue grew 22% MoM, driven by EU" |
| "Funnel chart" | "Checkout drop-off doubled after redesign" |

<div class="callout callout-key"><strong>🔑 Rule</strong>

Every chart must have a one-sentence headline that answers *"So what?"*.

</div>', 1
FROM public.modules m WHERE m.track_id='a15acd45-8af9-4509-9213-8892e53eb983' AND m.slug='storytelling'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;

INSERT INTO public.lessons (module_id, slug, title, content, sort_order)
SELECT m.id, 'stakeholder-comm', 'Talking to stakeholders', '## Learning outcomes
- Translate technical findings into business actions.
- Handle "the data must be wrong" objections.

| Stakeholder asks… | Translate to… |
|---|---|
| "Why is X down?" | Define X, time window, segments first |
| "Can you cut by Y?" | Confirm Y exists & is reliable |
| "What should we do?" | Show 2–3 options with trade-offs |', 2
FROM public.modules m WHERE m.track_id='a15acd45-8af9-4509-9213-8892e53eb983' AND m.slug='storytelling'
ON CONFLICT (module_id, slug) DO UPDATE SET content=EXCLUDED.content;