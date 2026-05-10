<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

# FinFlow — Project Context

## Overview
AI-powered personal budget planner (INR only).
- **Live:** https://finflow-six-gamma.vercel.app
- **Repo:** https://github.com/TejParmar10/finflow
- **Owner email:** tejparmar100@gmail.com / roundtable8080@gmail.com

## Tech Stack
| Concern | Library |
|---|---|
| Framework | Next.js 14 App Router, TypeScript |
| Auth + DB | Firebase client SDK v10 (NO Admin SDK) |
| AI / LLM | Groq API — `llama-3.3-70b-versatile` |
| Styling | Tailwind CSS + custom design tokens |
| Charts | Recharts |
| PDF gen | @react-pdf/renderer (client-side only) |
| PDF parse | pdf-parse (server-side only, API routes) |
| Notifications | react-hot-toast |
| Dates | date-fns |
| Icons | lucide-react |

## File Map (key files only)

```
types/index.ts              ALL TypeScript interfaces — check here first

lib/
  firebase.ts               Firebase app + auth + db init
  auth.ts                   signInWithGoogle, signOut, onAuthChange
  firestore.ts              All Firestore CRUD + onSnapshot helpers
  groq.ts                   callGroq() + callGroqStream()  ← SERVER ONLY
  agents.ts                 BudgetAgent, InsightsAgent, OrchestratorAgent  ← SERVER ONLY
  alertAgent.ts             AlertAgent — pure calc, no Groq  ← CLIENT SAFE
  creditScore.ts            calculateCreditScore() — pure calc  ← CLIENT SAFE
  duplicateDetector.ts      detectDuplicates() for import
  parsers/
    hdfcPdf.ts              pdf-parse wrapper (server only)
    hdfcCsv.ts              HDFC CSV row parser
    gpayCsv.ts              Google Pay CSV parser (pure, no AI)
    statementAI.ts          AI parser, source: 'hdfc' | 'gpay'

hooks/
  useAuth.ts                {user, loading, signInWithGoogle, signOut}
  useBudget.ts              {budget, loading, save} — current month
  useExpenses.ts            {expenses, loading, add, remove} — onSnapshot
  useGoals.ts               {goals, loading, create, addProgress} — onSnapshot

app/
  page.tsx                  Landing / sign-in
  layout.tsx                Root layout (fonts, AuthProvider, Toaster)
  dashboard/page.tsx        Salary, allocation, credit score, alerts
  tracker/page.tsx          Expense form, receipt scanner, category cards
  insights/page.tsx         Forecast, charts, subscriptions, month history
  goals/page.tsx            Goal creation + progress
  import/page.tsx           Statement import (HDFC + Google Pay)
  report/page.tsx           AI monthly report + PDF download
  api/ai/chat/route.ts      Streaming AI chat
  api/ai/receipt/route.ts   Receipt image → expense items
  api/ai/forecast/route.ts  Month-end spend forecast
  api/ai/report/route.ts    Monthly report — client sends {budget,expenses}
  api/import/parse/route.ts Statement parse — auto-detects HDFC vs GPay

components/
  AuthProvider.tsx           Auth context + Sidebar/TopBar layout wrapper
  OnboardingModal.tsx        First-login salary/split setup
  layout/Sidebar.tsx         Desktop nav + mobile bottom tabs
  dashboard/CreditScoreArc.tsx  Animated SVG arc 300–900
  tracker/CategoryCard.tsx      Per-category expenses with "Imported" badge
  chat/AIChat.tsx            Floating streaming chat widget
  report/ReportDocument.tsx  @react-pdf/renderer template
  ui/{Button,Card,Input,Badge}.tsx  Design system primitives
```

## Critical Rules — Never Break

### Rule 1: Server vs Client modules
| Module | Safe for client pages? |
|---|---|
| `lib/agents.ts` | ❌ NO — imports Groq SDK |
| `lib/groq.ts` | ❌ NO — needs `GROQ_API_KEY` (server-only env var) |
| `lib/alertAgent.ts` | ✅ YES — pure calc, no imports |
| `lib/creditScore.ts` | ✅ YES — pure calc, no imports |
| `lib/parsers/hdfcPdf.ts` | ❌ NO — uses Node.js `fs` |

**Never import `lib/agents.ts` or `lib/groq.ts` in any page or component.**
Only use them inside `app/api/**/route.ts`.

### Rule 2: Firebase in API routes
The app uses the **client Firebase SDK** — no Admin SDK.
Client SDK has no auth session server-side → Firestore security rules block reads.

**Fix pattern:** client passes data in request body instead of API route fetching it.
```ts
// ✅ Correct — report page sends expenses+budget in body
body: JSON.stringify({ month, budget, expenses })

// ❌ Wrong — will 500 with permission-denied
const budget = await getBudget(uid, month) // inside an API route
```

### Rule 3: All API routes must have
```ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

### Rule 4: Number formatting
```ts
amount.toLocaleString('en-IN')  // ✅  100000 → "1,00,000"
amount.toLocaleString()          // ❌  wrong format
```

### Rule 5: Month keys
```ts
format(new Date(), 'yyyy-MM')  // ✅  always derived at runtime
'2026-04'                       // ❌  never hardcoded
```

## Firestore Schema
```
users/{uid}                    User profile doc
budgets/{uid}/months/{yyyy-MM} Budget for that month
expenses/{uid}/records/{id}    Expenses (filter by .month field)
goals/{uid}/items/{id}         Savings goals
subscriptions/{uid}/detected/{id}
```

## Design Tokens (Tailwind)
```
bg-primary    #0D0F1A    Page background
bg-secondary  #141622    Sidebar / modals
accent-teal   #4ECDC4    Primary CTA, invest colour
accent-coral  #FF6B6B    Danger, personal spend
accent-yellow #FFE66D    Warning
accent-green  #00C896    Success
text-primary  #E8EAF6
text-muted    rgba(255,255,255,0.4)
```
Card style: `bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-5`

## Statement Import — Supported Formats
| Bank | Format | Parser used |
|---|---|---|
| Google Pay | CSV | `lib/parsers/gpayCsv.ts` (no AI) |
| Google Pay | PDF | `statementAI.ts` source='gpay' |
| HDFC Bank | CSV | `hdfcCsv.ts` → `statementAI.ts` |
| HDFC Bank | PDF | `hdfcPdf.ts` → `statementAI.ts` |

Auto-detection checks for `"Paid to"` / `"UPI Transaction ID"` strings.

## Common Tasks → Files to Touch
| Task | Files |
|---|---|
| New expense category | `types/index.ts`, `ExpenseForm.tsx`, `CategoryCard.tsx` |
| Change AI prompts | `lib/agents.ts`, `lib/parsers/statementAI.ts` |
| New chart in Insights | `components/insights/SpendingChart.tsx`, `app/insights/page.tsx` |
| Add new bank format | new `lib/parsers/*.ts`, update `api/import/parse/route.ts` |
| Change credit score | `lib/creditScore.ts` only |
| Change alert thresholds | `lib/alertAgent.ts` only |
| Update PDF report layout | `components/report/ReportDocument.tsx` |
| New Firestore collection | `lib/firestore.ts` + `firestore.rules` |

## Known Gotchas
1. `lib/agents.ts` in client → `GROQ_API_KEY missing` error. Use `lib/alertAgent.ts` for client-safe alerts.
2. Firestore in API routes → 500 permission denied. Pass data from client in body.
3. Config must be `next.config.mjs` not `.ts` for Next.js 14.2.x.
4. `pdf-parse` needs Node.js fs — only use via dynamic import inside API routes.
5. `@react-pdf/renderer` is client-side only — dynamic import in report page.
6. GPay CSV has 4 metadata rows — send raw text to server, let `gpayCsv.ts` handle it.
