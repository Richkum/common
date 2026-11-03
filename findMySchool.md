findmyschool — Engineering Brief
You are a senior full-stack engineer. Your job is to build findmyschool — a production platform that helps people in Cameroon find schools, from pre-nursery to universities and vocational training centres.

This is not a demo, an MVP, a portfolio project, or a coding exercise. It is a real product for a real problem, intended to become Cameroon's reference school-discovery platform. Cameroonians today find schools through WhatsApp groups, Facebook pages, word-of-mouth, and rumor. Data is scattered, outdated, and unreliable. Fees, programs, and locations are almost impossible to compare. Your build must change that.

Read this brief end-to-end before writing code. Everything you need is here. The /docs folder you will produce on your first commit is the canonical source of truth; this brief is the contract.

0. Non-negotiables
   Read before writing. Before any code, write the files described in §14 into /docs/.

Production-grade only. Strict TypeScript. Zod at every boundary. No any. No console.log in shipped code. No TODO comments left in production paths. No silent failures.

Tests for every business rule. Ingestion, dedupe, search ranking, claim verification, i18n fallbacks, filter logic. vitest. No network calls in tests — fixtures only.

Every page has loading, empty, error, and success states. No blank screens.

Bilingual (French + English) from day one. Not retrofitted.

Mobile-first, low-bandwidth. Every screen must be usable on a low-end Android phone on 3G. Performance budgets in §9.

Secrets are never handed to you. See §10. You will mock or stub every external service and write .env.example. Never request, guess, or hardcode a credential. Never commit a .env file.

Data honesty in UI. Every school profile shows freshness ("Last verified: X"), a source/verification badge, and a "Report incorrect info" link. Never present uncertain data as certain.

Data model extensibility over data model completeness. Read §4. The schema may evolve; the principles may not.

Build in vertical slices (§12). Each slice ships working end-to-end against seeded data. Do not build layers horizontally.

1. The product
   A directory + discovery + recommendation platform for all authorized schools in Cameroon — government, private, and confessional (mission) — covering:

Pre-nursery, nursery

Primary

Secondary (lower and upper cycles)

Vocational training

Higher education (universities, grandes écoles, institutes)

Core capabilities:

Search & filter by town, region, division, subdivision, level, sector, subsystem, program, fee range, and boarding.

"Near me" — radius search by GPS.

Recommendation wizard — a short guided flow ("what do you want to study / where / what budget") that produces ranked schools.

School profiles — public, SEO-indexed, with verified/unverified badges, freshness, location, contacts, programs, levels, and fees where known.

Claim flow — schools claim their profiles, upload their own photos, and manage their data.

Crowd contributions — anyone can suggest a new school or report incorrect info; admins review.

Programmatic SEO pages — /schools/[region], /schools/[region]/[division], /towns/[town], /schools/[region]/[level].

Compare — side-by-side of up to 3 schools (localStorage, no auth).

Favorites — shortlist saved in localStorage.

Regular end users never register. Only school representatives and admins authenticate.

Later (architect for now, ship later): sponsored placement, reviews, school events, scholarships, analytics dashboards for claimed schools.

2. Domain knowledge you must internalize
   Cameroon's education system
   Two subsystems coexist:

Anglophone — GCE O/A Level system. Primary: Class 1–6, FSLC exam. Secondary: Form 1–5 → GCE O Level; Lower Sixth/Upper Sixth → GCE A Level.

Francophone — Primary: SIL–CM2, CEP exam. Secondary: 6ᵉ–3ᵉ, BEPC; 2ⁿᵈᵉ–Tle, Probatoire, Baccalauréat.

Bilingual schools run both subsystems.

Sector classification:

Public / government — state-owned, funded by the state

Private lay — for-profit

Confessional / mission — Catholic, Protestant (Presbyterian, Baptist, etc.), Islamic

Ministries:

MINEDUB — Basic Education (nursery, primary)

MINESEC — Secondary Education

MINESUP — Higher Education

MINEFOP — Vocational Training

Higher-ed credentials to model: HND, BTS, DUT, Licence, Master, Doctorat, and Grande École diplomas. Vocational: CAP, BEP, and professional certificates.

A school can be multiple levels (e.g. nursery + primary + secondary). Never assume one-level-per-school.

Geography
10 regions: Adamaoua, Centre, Est, Extrême-Nord, Littoral, Nord, Nord-Ouest, Sud, Sud-Ouest, Ouest.

58 divisions, ~360 subdivisions, and thousands of localities / towns / villages.

Users navigate by town, not by subdivision. "I want to study in Buea" is the mental model — not "I want to study in Fako division." Locality/town is a first-class entity with latitude/longitude. Every school row must have both locality_id and lat/lng.

In Douala and Yaoundé, quartiers/neighborhoods matter (Bastos, Bonapriso, Biyem-Assi, Molyko, etc.). Model them so they can be added without schema change; not required for the first slice.

Timezone: Africa/Douala (WAT, UTC+1). Currency: XAF. Phones: +237 followed by 9 digits. No postcodes — use landmark-based addresses where possible ("opposite Molyko stadium, Buea").

Terminology trap
"Town", "locality", "subdivision", and "division" are distinct. Buea is a town in Fako division; Limbe is another town in the same division. Never collapse these.

3. Architecture
   Locked decisions:

Framework: Next.js App Router, TypeScript strict, Server Components by default, Server Actions for mutations, Route Handlers for public APIs.

DB: Postgres (local in dev, Neon in prod). Extensions: postgis, pg_trgm, unaccent, pgcrypto.

ORM: Drizzle ORM (better raw-SQL/PostGIS compatibility than Prisma). Migrations in /drizzle. Use drizzle-kit.

Auth: Auth.js (NextAuth v5) with Drizzle adapter. Roles: admin, school. School users linked to schools table via a join. No end-user auth.

UI: Tailwind CSS + shadcn/ui + lucide-react icons.

i18n: next-intl. Locales en and fr. Locale in URL path (/en/..., /fr/...). Both locales fully translated at launch — not stubs.

Validation: zod for forms, API inputs, env vars (@t3-oss/env-nextjs or equivalent).

Maps: Leaflet + OpenStreetMap tiles (free, no API key). Do not use Mapbox or Google Maps.

Geocoding: Nominatim (free, no key, 1 req/sec). Cache results.

Email: abstract behind an EmailService interface. Dev: logs to file/console. Prod: Resend. Do not hardcode a provider.

File storage: abstract behind a StorageService interface. Dev: public/uploads (gitignored). Prod: S3-compatible (Supabase Storage, Cloudflare R2, or similar). No images uploaded by users until the claim flow ships.

Analytics: Umami (privacy-first, self-hosted or cloud). Abstract behind an AnalyticsService. Also track internal events in a search_events table — search queries, zero-result queries, filter combinations — for product learning.

Errors: Sentry. In dev, console + local file. Never crash on a missing DSN.

Tests: vitest for unit + integration. playwright for E2E — optional in the first slice, required before launch.

Package manager: pnpm. Node LTS.

Deployment target: Vercel + Neon.

Architectural invariants:

Server Components fetch from the DB directly through a typed data layer; there is no separate HTTP API for internal pages.

All public APIs (submit, report, claim, search-autocomplete) are Route Handlers with rate limiting.

Business logic lives in /src/lib/\* and is unit-tested. Route handlers and Server Actions are thin wrappers.

Every mutation writes to an audit_log table (actor, action, target, diff, timestamp).

Soft delete everywhere: deleted_at nullable. Hard delete is an admin-only, logged action.

4. Data model principles
   You will design the schema in docs/SCHEMA.md on your first commit. It must satisfy these principles:

Stable identities. Every school has a UUID id and a stable slug. Slug changes create a redirect entry in a slugs_history table. Never break existing URLs.

Soft merges. Duplicate schools are an inevitability. Support merged_into_id uuid and aliases text[] on schools. When a school is merged into another, keep the old row as a soft-deleted record with a pointer and redirect the slug.

Extensible enums. Use Postgres enums or lookup tables for every closed vocabulary (levels, sectors, subsystems, school types, facilities, diplomas, programs, sources, verification statuses, claim statuses). You must be able to add a value without a schema rewrite. Do not use free-text where a controlled list is correct.

Lookup tables for shared vocabularies — levels, programs, facilities, diplomas, languages_of_instruction. Many-to-many via join tables (school_levels, school_programs, school_facilities, school_diplomas). "All schools offering nursing" must be a simple query.

Bilingual columns — name_fr, name_en, description_fr, description_en, etc. Enforce with a check constraint that at least one of each pair is non-null. Same pattern for localities and admin areas.

Geospatial everywhere — every school and every locality has a PostGIS geography(Point, 4326) column. Radius search must be O(log n) with a GiST index.

Full-text search — one search_vec tsvector generated column per searchable entity, indexed with GIN. Combine FTS + trigram similarity in the query. See §9.

Staging tables for every ingestible entity — schools_staging, localities_staging. Each staged row carries source_id, source_url, raw_payload jsonb, confidence smallint, status (pending / approved / rejected / conflict), reviewed_by, reviewed_at, notes. Nothing goes live without admin approval.

Source registry — sources table with name, url, license, tos_url, attribution_text, last_synced_at, sync_notes. Every row that entered the DB traces back to a source.

No PII. No student data. No director names. No personal emails. Only institutional contacts posted publicly by the school (office phone, admissions email). Store a role ("Registrar", "Principal") never a person's name.

Reserved columns for phase 2+ — sponsor_tier smallint default 0, sponsor_until date, is_published boolean default true, closed_at timestamp null (school permanently closed / moved), moved_to_school_id uuid null. Adding these now costs nothing; migrating them in later is painful.

Multi-valued fields — schools can have multiple phone numbers, emails, and websites. Use a school_contacts table with kind (phone / email / website / facebook / whatsapp) and value. Do not stuff them into a single text field.

Fees — model as school_fees with (school_id, level_id, program_id null, amount_xaf, period, academic_year, notes, source_id, verified bool). Fees are frequently unknown. Support "on request" via amount_xaf null + a note.

Timestamps everywhere — created_at, updated_at on all mutable rows. last_verified_at on anything whose accuracy decays.

Locale routing — since URLs are localized (/fr/ecoles/... vs /en/schools/...), keep slugs stable across locales. Same slug value used in both locales.

5. Data ingestion
   You will build ingestion as a set of scripts in /scripts/. Each script writes to staging tables only; an admin approves in the /admin/staging UI.

Sources (in priority order)
GeoNames CM.zip (CC-BY) — authoritative for localities: admin1 = region, admin2 = division, populated places with lat/lng and population. Use this to seed localities. Subdivisions are patchier; fill gaps from OSM admin boundaries when available. Script: scripts/ingest/geonames.ts.

OSM Overpass — amenity=school, amenity=university, amenity=college, amenity=kindergarten within Cameroon. Extract name, coordinates, address tags, operator. ODbL — attribution required on the app's data-sources page. Script: scripts/ingest/osm.ts. Use the Overpass API (https://overpass-api.de/api/interpreter). Rate limit politely. Cache responses in scripts/ingest/.cache/ (gitignored). Tests use fixtures, never live API.

MINESUP / MINEFOP published lists — public accreditations of higher-ed and vocational institutions. These will be manual parses. Write a helper scripts/ingest/manual-csv.ts that takes a well-formed CSV/JSON and pushes to staging, tagging the source. Do not scrape pages whose robots.txt or ToS forbids it.

Nominatim — geocode records that arrive with an address but no coordinates. 1 req/sec hard limit. Cache forever. Script: scripts/ingest/geocode.ts.

Crowdsourced submissions — the /submit route handler writes to schools_staging with source = 'community', confidence = 30.

Claimed profiles — schools self-editing after claim. These write directly to schools (the school owns the data) but generate an audit row.

Rules
Nothing is published from ingestion without human approval. The staging → live path is always through /admin/staging.

Every field carries provenance. A school record has primary_source_id and each individual field that differs from primary has a note in a school_field_notes table (which source, which confidence, which reviewer).

Conflict detection. If a staged row's name or coordinates are within a tolerance of an existing school, mark status = 'conflict' and surface the diff in admin. Never silently overwrite.

Idempotent scripts. Re-running scripts/ingest/osm.ts must not create duplicates. Use a stable external_id (e.g. osm:node:123456) as a unique key.

Dry run. Every ingest script accepts --dry-run and prints the diff. Default to dry run; require --commit to actually write.

6. Pages and routes
   Public (all bilingual via /[locale]/...):

/[locale] — home. Search bar, quick town links, level shortcuts, featured schools, "recently added", "recently verified".

/[locale]/schools — browse + filters.

/[locale]/schools/[slug] — school profile.

/[locale]/schools/[region] — programmatic.

/[locale]/schools/[region]/[division] — programmatic.

/[locale]/schools/[region]/[division]/[subdivision] — programmatic.

/[locale]/towns/[town] — town-first landing page (user-friendly entry).

/[locale]/schools/[region]/[level] — programmatic.

/[locale]/recommend — wizard: interest → level → town → budget → results.

/[locale]/compare — reads localStorage, renders side-by-side.

/[locale]/submit — suggest a school.

/[locale]/report/[slug] — report incorrect info.

/[locale]/claim/[slug] — start a claim.

/[locale]/about

/[locale]/contact

/[locale]/legal/privacy

/[locale]/legal/terms

/[locale]/legal/disclaimer

/[locale]/legal/takedown

/[locale]/legal/sources — full attribution list

School dashboard (auth: role school):

/[locale]/dashboard

/[locale]/dashboard/profile

/[locale]/dashboard/programs

/[locale]/dashboard/fees

/[locale]/dashboard/contacts

/[locale]/dashboard/photos

/[locale]/dashboard/analytics (views, contact reveals — placeholder first)

/[locale]/dashboard/settings

Admin (auth: role admin):

/[locale]/admin

/[locale]/admin/staging — review queue with diff view, approve/reject/edit, bulk approve

/[locale]/admin/schools — search, filter, bulk publish/unpublish

/[locale]/admin/schools/[id]/edit — full edit + merge action

/[locale]/admin/claims — pending claims

/[locale]/admin/corrections — pending reports

/[locale]/admin/merges — duplicate candidates, merge tool

/[locale]/admin/sources — CRUD sources

/[locale]/admin/users — school users

/[locale]/admin/search-analytics — top queries, zero-result queries

/[locale]/admin/audit — audit log

/[locale]/admin/settings

APIs (Route Handlers):

POST /api/submit — suggest a school (rate limited: 5/hour/IP)

POST /api/report — report incorrect info (rate limited: 10/day/IP)

POST /api/claim — begin claim (rate limited: 5/day/IP)

GET /api/search/suggest — autocomplete (rate limited: 30/min/IP)

GET /api/geocode — internal, cached, admin only

GET /api/revalidate — build hook for sitemaps (optional)

SEO / machine-readable:

/[locale]/sitemap.xml and /sitemap-index.xml — dynamic, segmented by entity

robots.txt

Open Graph images at /[locale]/schools/[slug]/opengraph-image

Schema.org EducationalOrganization JSON-LD on every school profile

Canonical URLs. hreflang links FR↔EN.

7. Bilingual strategy
   URLs: locale prefix on every route. Middleware detects Accept-Language; defaults to FR (majority language) but remembers user choice.

Copy: every user-visible string in messages/en.json and messages/fr.json. No strings in JSX.

Data: bilingual columns where bilingual content exists. Many anglophone schools only have English names; many francophone schools only French. The UI must handle a missing translation gracefully (fall back to the present locale, never show blank).

Glossary — you will write docs/I18N-GLOSSARY.md on first commit. Minimum content:

Concept English Français
Nursery Nursery / Pre-school Maternelle
Primary Primary Primaire
Secondary Secondary Secondaire
High school High school Lycée
Vocational Vocational training Formation professionnelle
Higher ed Higher education Enseignement supérieur
Public school Public school École publique
Private school Private school École privée
Confessional Mission / Confessional Confessionnelle
Bilingual Bilingual Bilingue
Boarding Boarding Internat
Fees Fees Frais de scolarité
Claim Claim this school Revendiquer cet établissement
Date / number formatting via Intl in both locales. Fees in XAF.

8. UX and design system
   Tone: warm, local, trustworthy, honest. Not corporate, not flashy.

Brand palette (suggested; adjust tastefully): deep forest green #0B7A3B primary, warm amber #F4A024 accent, deep charcoal for text, off-white background, red used sparingly for alerts.

Typography: modern sans (Inter or Geist). Headings 24–40px, body 15–16px, captions 13px.

Mobile-first. Design for a 360×640 screen first. Every tap target ≥ 44px.

Low bandwidth. Ship < 150KB JS per route (first load). Use next/image with sizes and modern formats. Never autoplay video. Lazy-load maps.

Loading states: skeletons, never spinners on full pages.

Empty states: helpful, with a CTA (e.g. "No schools match these filters. Try widening the town or removing the level filter.")

Error states: friendly, in the user's language, with a "try again" action and a link to contact.

Accessibility: keyboard-navigable, focus rings, semantic HTML, labels on every input, WCAG AA contrast, screen-reader-friendly filter chips.

Trust surfaces: verification badge, freshness ("Last verified: 3 months ago"), source attribution on each profile, "Report incorrect info" always visible, "Report an error" on data.

Share: WhatsApp share button on every profile (native share sheet where available).

Compare & favorites: localStorage-backed. Show a small floating "compare" bar when 2+ schools are selected.

Search bar behavior: as-you-type suggestions from FTS + trigram. Debounced. Rate-limited endpoint.

9. Quality bar
   Search implementation (must not deviate without justification):

sql
-- Generated tsvector column on schools
search_vec = setweight(to_tsvector('french', unaccent(name_fr || ' ' || description_fr)), 'A')
|| setweight(to_tsvector('english', unaccent(name_en || ' ' || description_en)), 'A')
Query strategy:

Try FTS first: websearch_to_tsquery(unaccent(q)).

Fall back to trigram similarity: similarity(unaccent(name_fr), q) > 0.3 OR similarity(unaccent(name_en), q) > 0.3.

Also match against aliases array.

Rank by: ts*rank(search_vec, query) + 0.4 * similarity + 0.2 _ (1 - distance_km/50 capped at 1) + 0.1 _ sponsor*tier - 0.5 * (deleted_at IS NOT NULL).

Filter facets always applied after ranking.

Performance budgets (Lighthouse mobile, simulated slow 4G):

LCP < 2.5s

TBT < 200ms

CLS < 0.05

JS first load < 150KB per route

DB queries per page < 10

Testing:

Unit tests: ranking, filters, i18n fallback, slug generation, merge logic, ingestion diffing.

Integration tests: Server Actions with a test DB (Docker Postgres or a dedicated test schema).

E2E (before launch): search → click result → report → admin approves.

Error handling:

Every Server Action returns a discriminated union { ok: true, data } | { ok: false, error: AppError }.

AppError carries code (enum), userMessage (localized key), and logContext.

No try/catch that swallows. Log to Sentry + write to audit_log for mutations.

Accessibility: axe-core in CI on at least the home page, a school profile, and the filters panel.

10. Secrets and mocking
    You will not have credentials. You must build without them and never request them.

.env.example — every variable the app needs. The app must start locally with only these set:

text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/findmyschool
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
AUTH_SECRET=dev-only-placeholder
AUTH_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM=noreply@findmyschool.cm
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
NEXT_PUBLIC_UMAMI_SRC=
SENTRY_DSN=
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
NOMINATIM_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=findmyschool/0.1 (kumatum@gmail.com)
OVERPASS_URL=https://overpass-api.de/api/interpreter
Mocking strategy, mandatory:

EmailService — in NODE_ENV=development, log to logs/emails.log and return { ok: true }. In tests, use a MemoryEmailService and assert on captured messages.

StorageService — in dev, write to public/uploads and return the URL. In tests, MemoryStorageService.

AnalyticsService — no-op in dev, Umami script injected only when NEXT_PUBLIC_UMAMI_WEBSITE_ID is set.

Sentry — no-op if SENTRY_DSN empty.

Auth.js — use the Drizzle adapter against the local DB. Seed a test admin and a test school user in scripts/seed-dev.ts. Password hashing via argon2 or bcrypt.

Nomination / Overpass — live network only when explicitly invoked with --commit in ingest scripts, and only in dev. Tests use fixtures in tests/fixtures/.

No network calls in CI, ever.

If a variable is required in prod but empty in dev, log a single, clear warning at startup and continue. Do not crash. Do not print secrets.

11. Legal and attribution
    No PII. No students, no directors, no personal emails. Only institutional contacts posted publicly by the school itself.

Attribution: the /legal/sources page lists every source with license and attribution text: GeoNames (CC-BY), OSM (ODbL), MINESUP (public record), MINEFOP (public record), community contributions.

Photos and logos: not republished from source websites. Profiles show a neutral placeholder until the school claims and uploads its own.

Robots.txt + ToS: every ingestion script respects the target's robots.txt and ToS. Store a notes per source in sources.sync_notes.

Cookie banner: only if Umami is configured with cookies. Use the minimal banner.

Takedown: /legal/takedown documents how a school can request corrections or removal, and the SLA (e.g. 7 working days).

Disclaimer on every profile: "findmyschool is an information platform. Verify admission requirements and fees directly with the school."

12. Build plan — vertical slices
    Each slice is fully shipped: pages, tests, i18n, loading/error/empty states, admin path, freshness badges. Do not start the next slice until the previous is done by §13.

Slice 1 — Foundation & gazetteer
Repo scaffolding. docs/ created. Schema drafted in docs/SCHEMA.md, reviewed with the maintainer. scripts/ingest/geonames.ts populates localities (regions, divisions, subdivisions, towns). Admin shell with auth. Empty public landing page in both locales. Health check.

Slice 2 — School profile end-to-end (higher ed, Centre region)
Schools table, staging table, admin review queue. scripts/ingest/osm.ts and a manual CSV loader seed ~30 real higher-ed schools in the Centre region into staging. Admin approves. Public /schools/[slug] renders. /schools/[region] and /towns/[town] render. Freshness, verification badges. Report-incorrect flow. Compare + favorites.

Slice 3 — Search and filters
Postgres FTS + trigram + PostGIS. Filters: town, region, division, subdivision, level, sector, subsystem, boarding. Sort: relevance, distance, name. /schools page. Autocomplete endpoint. Search analytics events. Zero-result UX.

Slice 4 — Widen levels and regions
Add secondary, primary, nursery, vocational. Bulk OSM ingest to staging for all regions. Admin bulk-approve tooling. More profiles live. Programmatic pages for every region × level.

Slice 5 — Recommendation wizard
/recommend. Rules-based scoring. Inputs: interest (from program list), level, town, budget range. Output: ranked list with reasons ("Offers nursing", "Within 15 km", "Fees fit your range"). Tests for scoring.

Slice 6 — Claim flow and school dashboard
Public claim form. Admin claim review. School user creation. Dashboard: edit profile, manage contacts, programs, fees, upload photos. Audit logging on every action. Notify admin on claim.

Slice 7 — Crowdsource submission
/submit for new schools. /api/submit with rate limiting. Admin review queue extended. Notification email to admin.

Slice 8 — Polish and launch prep
Sitemaps, OG images, JSON-LD, hreflang, 404/500 pages, maintenance page, cookie banner, privacy/terms/disclaimer/takedown pages, sources page, Sentry wiring, Umami wiring, E2E tests, Lighthouse pass, seed production DB via Neon, deploy.

13. Definition of done
    A slice is done when:

□ All pages render in FR and EN with no missing strings
□ Every page has loading, empty, error states
□ Every page is mobile-responsive down to 360px
□ Every page has proper meta tags, canonical URL, hreflang, OG image
□ Business logic is tested (unit)
□ Server Actions are tested (integration)
□ No any, no dead code, no console.log
□ Rate limiting on public POST endpoints
□ Audit log entries on all mutations
□ Accessibility: keyboard navigable, focus rings, labels
□ Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
□ Data honesty: freshness shown, source shown, report link present
□ docs/ updated with any decision that affects it
□ Commit is conventional and describes the "why" 14. First commit — create /docs
Before writing any code, produce:

docs/PRODUCT.md — vision, users, non-goals, success metrics

docs/SCHEMA.md — the full database schema proposal (ERD in Mermaid + Drizzle types). Wait for maintainer approval before generating migrations.

docs/ARCHITECTURE.md — stack, decisions, folder structure, data flow diagrams

docs/DATA-MODEL-PRINCIPLES.md — the principles from §4, restated

docs/DOMAIN.md — §2 in expanded form, with a full locality tree for at least Centre and Sud-Ouest regions

docs/INGESTION.md — sources, scripts, confidence scoring, staging lifecycle

docs/I18N-GLOSSARY.md — the glossary in §7, extended

docs/BUILD-PLAN.md — §12 expanded with acceptance criteria per slice

docs/QUALITY.md — §9 in detail, plus code style, naming, folder conventions

docs/SECRETS.md — §10 in detail, plus a "how to add a new secret" checklist

docs/UX.md — design tokens, component inventory, page wireframes (text)

docs/LEGAL.md — §11 in detail

README.md — how to run locally, seed, test, deploy

Then stop and ask the maintainer to review docs/SCHEMA.md before generating the first migration.

15. Maintainer
    Name: kumatum

Email: kumatum@gmail.com

Timezone: Africa/Douala (WAT, UTC+1)

Replies may be delayed; prefer written decisions in docs/ over chat questions where possible.

<!-- PROMPT: -->

Integration tests are self-cleaning: DB back to 0 schools / 6 pending. Now let me run the app and verify pages actually render.

Ran commands
2

Start findmyschool app
· exited (code 1)

Thought for 3 seconds

Runtime error: "You cannot use different slug names for the same dynamic path ('region' !== 'slug')". This is the directory structure schools/[slug] and schools/[region]/[division] conflict. Next.js requires consistent dynamic segment names at the same level. So schools/[slug]/page.tsx and schools/[region]/[division]/page.tsx conflict.

This is a fundamental structural issue with D-01. We need to restructure: use schools/[slug]/page.tsx and schools/[slug]/[division]/page.tsx? That is confusing but works: first segment is always named slug (school OR region), second is division (division OR level).

Let me restructure: move schools/[region]/[division] to schools/[slug]/[division]. Params: slug = region slug, division = division/level slug.

Let me check the internal links that reference '/schools/[region]/[division]' in routing.ts — next-intl pathnames. The pathname key '/schools/[region]/[division]' needs to change to '/schools/[slug]/[division]'.

Let me do it carefully: rename directory, update params usage, update routing, update nav links (region landing links).

Route structure conflict: Next requires one dynamic segment name per level. Restructuring /schools/[region]/[division] → /schools/[slug]/[division].

Ran commands
5

Start findmyschool app
:3000

Ran commands
1
get_process_output

Ran commands
