# LincsDirectory

The Lincolnshire local directory, the marketing front door for TAG Sleaford Ltd (Kesteven Business Centre, Aide). Since 2 October 2026 it is
**need-led**: three doors on the home page, **Where to?** (things to do, eat & drink, shops), **What's broken?** (repairs & fixes) and
**What do you need?** (things to get done), a natural-language search that maps everyday phrases ("wash my car", "boiler broke") to **job
pages**, a **Get local help** request form, and a **For businesses** sign-up for tradespeople and services. Everything from v3 (directory,
Premium profiles, moderated ratings, suggest / claim / remove, the drip schedule, the SEO landing pages) is still here.
Static site, hosted on GitHub Pages. Live at https://lincsdirectory.co.uk/ (repo `wilsonclawde-cpu/lincsdirectory`).

Everything in this repo except `data/`, `img/`, `CNAME` and the icons/OG images is **generated** by `build/make_site.py` (kept in the
private Business Centre folder, not in the repo). Edit the generator, re-run it, upload the output. Do not hand-edit the HTML.
`assets/site.css`, `assets/directory.js` and `assets/intent.js` are hand-maintained; `assets/home.js`, `assets/landing.js`, `assets/help.js` and
`data/jobs.json` are written by the generator.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: hero with the natural-language search ("What do you need doing?", live job suggestions from `assets/intent.js`), the **three doors** (Where to? / What's broken? / What do you need?) with job chips and the near-me/town picker, the **Get local help** form, Suggest a business, towns (live counts), categories, Premium carousel, pros CTA, Free vs Premium table, house cards for the Business Centre and Aide (tagged "Premium listing"), FAQ (FAQPage JSON-LD) |
| `where.html` | The Where to? door: going-out categories with live counts, the big towns with their things-to-do / eat / drink pages, near me |
| `jobs.html` | All jobs: the two doors (#broken, #need) as cards, then every job by group (#plumbing, #heating, … anchors used by the footer), with a job search box |
| `<job>.html` (97) | **Job hub page**, e.g. `fix-a-leak.html`: H1 "Fix a leak in Lincolnshire", emergency banner on urgent jobs, the four guidance paragraphs from `build/jobs.py`, town selector, related jobs, categories, "Local pros who do this" (live listings in the job's categories, Premium first, refreshed by `landing.js`), Get local help form prefilled with the job, "Are you a pro?" CTA, 3 FAQs. JSON-LD: BreadcrumbList, WebPage, FAQPage, Service (no prices), ItemList of pros (name, locality, geo; no ratings). Always indexable |
| `<job>-in-<town>.html` (up to the budget, see rules) | **Job x town page**, e.g. `fix-a-leak-in-sleaford.html`: shorter guidance (what's involved + safety) linking to the hub, the pros for that town (including service-area businesses that cover it), nearby towns, form prefilled with job + town. Generated only where the job's primary category has >= 1 live business in that town; **indexable only with >= 2 live pros** (`MIN_JOBTOWN_INDEX`), otherwise `noindex,follow` and out of the sitemap |
| `help.html` | Standalone Get local help request (noindex). Deep links: `help.html?job=<slug>&town=<townId>&need=<text>&when=urgent` |
| `pros.html` | For businesses: free listing vs Premium £4.99, the sign-up form (plan, business, main category, jobs ticklist from `jobs.py`, "I have a shop" vs "I cover an area, no shop address", towns covered, contact, website, credentials (shown as supplied, never verified), consent). Posts to Web3Forms, subject `LincsDirectory pro signup: <business> (<plan>)`. `?job=<slug>&town=<id>&plan=premium` pre-tick |
| `search.html` | Search + map + list. Deep links: `?q=…&town=<id>&cat=<id>&id=<listingId>`; `#near` triggers "near me". Every card has a star row; Premium cards link to their profile page |
| `b-<slug>-<town>.html` (one per Premium listing) | **Premium profile page**: photo, Premium tag, address + directions, phone, hours, description, prominent "Visit website" (`rel="sponsored noopener"`), star row + latest approved reviews + Rate button, mini map, More in <town>, breadcrumbs, upgrade CTA. JSON-LD: BreadcrumbList + a LocalBusiness-family node with the supplied fields only (no ratings). Currently `b-glow-sleaford.html` and `b-kesteven-business-centre-sleaford.html` |
| `rate.html` | Rate a business: `rate.html?id=<listingId>&town=<townId>`. 1–5 stars (radio group), optional comment (≤400), optional first name, optional email, consent box, honeypot. Posts to Web3Forms, subject `LincsDirectory rating: <name> (<id>) <stars>★`. noindex; nothing is auto-published |
| `suggest.html` | Suggest a business (public). Posts to Web3Forms, subject "LincsDirectory suggestion". `?note=` and `?name=` prefill |
| `claim.html` | Claim / update (free), Premium listing (£4.99), remove listing, reply to a rating. `?id=&name=&town=&plan=premium|remove&note=`. `STRIPE_PREMIUM_LINK` constant inside (empty: the Premium button falls back to the form) |
| `advertise.html`, `about.html`, `privacy.html`, `terms.html`, `404.html` | Premium slots (price on enquiry), company, legal. `terms.html#ratings` is the ratings policy; `privacy.html#ratings` what we keep from a rating |
| `browse.html` | HTML sitemap: every town, category and town-by-category page |
| `<town>-business-directory.html` (22) | Town hub pages, e.g. `sleaford-business-directory.html` |
| `<category>-lincolnshire.html` (22) | Category hub pages, e.g. `things-to-do-lincolnshire.html` |
| `<category>-in-<town>.html` (176) | Town x category pages, e.g. `things-to-do-in-sleaford.html` |
| `assets/site.css`, `assets/app.js`, `assets/directory.js`, `assets/home.js`, `assets/landing.js` | Styles, header/menu/reveal, data layer + search engine + ratings/star rows + profile URL + `LD.addr()` (service-area / map-derived addresses), home page (counts, near me, intent suggestions), landing + job-page list refresh |
| `assets/intent.js`, `data/jobs.json` | The **intent matcher**: everyday phrases -> jobs. `data/jobs.json` is the compact job map (slug, title, group, categories, door, phrasings) written from `build/jobs.py`. Used by the home search, `search.html` (job matches above results; widens the search to the job's categories when the text match is thin), `jobs.html` and `help.html`. Unit test: `node build/test_intent.js ../site` (70 phrases, results in `build/intent-test-results.json`) |
| `assets/help.js` | The Get local help form handler (every `form.helpform` on a page). Subject `LincsDirectory job request: <job> – <town> [<urgency>]` |
| `data/index.json` | Counts per go-live date, towns, categories, featured (Premium) listings, file list |
| `data/listings-<district>.json` | Listings for one district (7 files, lazy-loaded). `files[].towns` includes every town a record covers (`cov`) so the lazy loader finds service-area businesses |
| `data/ratings.json` | Approved customer ratings (see below). `{}` until the first one is approved |
| `img/` | Photos for Premium listings (WebP, ~1024 px wide, under 200 KB). `img/tag-sleaford.webp` is the Business Centre |
| `sitemap.xml`, `robots.txt`, `site.webmanifest`, icons, `og-*.png` | SEO / brand (from `build/brand.py`; brand pack in `../brand/`) |
| `google926aaa262e88957a.html` | Google Search Console verification file. Keep it. |

## Business model (do not change prices or claims without the owner)

* **Free listing**: name, address, category, map pin, customer ratings. Built from public data only.
* **Premium listing, £4.99 one-off**: own profile page, photo, website link, phone, hours, description; shown first in results with a
  "Premium" tag; plus a free Aide business report. Premium listings are paid placements and appear first; the terms and about page say so.
* **House cards** for Kesteven Business Centre (offices from £250/month, meeting room from £15/hr, day office) and Aide (reports from
  £4.99) carry a small, muted "Premium listing" tag (never the word "Advertisement", which put people off). Third-party slots: price on enquiry.
* No contact email is published (no lincsdirectory.co.uk mailbox yet). Forms go to Web3Forms. Phone 01522 424963 is published
  **without opening hours**. The Business Centre's own record says "24-hour access for tenants" and nothing about staffed hours (never
  confirmed; do not add them). GLOW's confirmed hours: Mon–Fri 8am–4.30pm, closed Sat & Sun.

## Listing record format

```json
{"id":"f123456","n":"Name","a":"1 High Street, Village","t":"sleaford","p":"NG34 7DT","la":52.99,"lo":-0.41,"c":"rest","s":"fsa","f":"2026-10-03","tier":"free"}
```

| Field | Meaning |
|---|---|
| `id` | `f<FHRSID>` (FSA), `on<id>`/`ow<id>`/`or<id>` (OpenStreetMap), or a slug (Aide/manual/suggested) |
| `n`, `a`, `t`, `p` | name, address (without town), town id (see `data/index.json` → `towns`), postcode |
| `la`, `lo` | latitude, longitude |
| `c` | category id (see `data/index.json` → `cats`; `fun` = Things to do) |
| `s` | source: `fsa`, `osm`, `aide`, `owner` |
| `f` | live_from (ISO date). The site only shows listings with `f <= today`: this is the drip schedule |
| `tier` | `free` or `premium` |
| `ph` (optional, any tier) | Business phone number. On free listings only ever from the OpenStreetMap `phone`/`contact:phone` tag (public data; 354 added on 2026-10-02); shown on cards, job-page rows and profiles |
| `cov` (optional) | **Service-area business**: array of town ids it covers, e.g. `["sleaford","grantham"]`. `t` is the first town; `a` and `p` are empty (never a home address); `la`/`lo` are the first town's centre (from `index.json` → `towns`). Shows as "Covers Sleaford and Grantham"; counted for every town in `cov` on job x town pages, town pages and search; JSON-LD uses `areaServed` instead of a street address |
| `ax` (optional) | `1` = the address was derived from the map (OSM element with no `addr:*` tags: nearest named street + nearest village). Shown as "Near West Street, Kirton (map location)"; JSON-LD omits `streetAddress` |
| premium only | `w` website URL, `desc` description, `img` image path (e.g. `img/tag-sleaford.webp`), `hrs` opening hours (free text; "Mon–Fri 8am–4.30pm" style is also turned into schema.org openingHours) |

## Jobs taxonomy (`build/jobs.py`, single source of truth)

97 jobs in 14 groups (Home repairs & plumbing, Heating & gas, Electrical, Building/roofing/decorating, Garden & outdoor, Car care, Cleaning,
Appliances & gadgets, Locks & security, Moving/storage/waste, Hair & beauty, Pets, Events, Tutoring/lessons/other). Each job: `slug`, `title`,
`group`, `door` (`broken` or `need`), `cats` (listing categories whose businesses do the job, primary first), `say` (4–10 everyday phrasings
for the matcher), `guide` (3–4 original, factual paragraphs, 150–220 words: what's involved / what to ask and have ready / safety and good to
know; **no prices, statistics or claims about any business**), `faq` (one job-specific Q&A; the generator adds two generic ones), `urgent`
(emergency banner: gas 0800 111 999, danger to life 999). Safety wording follows the public bodies named (Gas Safe Register, National Gas
Emergency Service, NICEIC/NAPIT, OFTEC, DVSA, Environment Agency); every page says "LincsDirectory doesn't vet or endorse businesses — always
check credentials and get a written quote."

**Adding a job**: append a dict to `JOBS` in `build/jobs.py` (keep slugs stable once published; if it needs a new listing category add that to
`categories.py` first and give it page metadata + an icon in `make_site.py`), run `node build/test_intent.js ../site` after `make_site.py`
has rewritten `data/jobs.json`, then upload `<job>.html`, any `<job>-in-<town>.html`, `jobs.html`, `browse.html`, `sitemap.xml`,
`data/jobs.json`. Page budget: the expansion is capped at `JOB_PAGE_BUDGET` (600) new pages; job x town pages are generated most-pros-first
until the budget is used. Lower `MIN_JOBTOWN_INDEX` only if you want thinner pages indexed (don't).

## Service categories and service-area listings (2026-10-02)

13 categories were added for the supply side: Plumbers & heating (`plumb`), Electricians (`elec`), Builders & handyman trades (`build`),
Gardeners & landscapers (`garden`), MOT, servicing & tyres (`garage`), Car washes & valeting (`carwash`), Cleaners (`clean`), Removals &
storage (`remov`), Appliance & gadget repair (`appl`), Locksmiths (`lock`), Pet services (`petserv`), Tutors & lessons (`tutor`),
Photographers & events (`photo`). `categories.SERVICE_CATS` (those 13 + `hair` + `trade`) go live the day they are added instead of
dripping, because the job pages depend on them. `categories.OSM_SERVICE` maps OpenStreetMap tags to them on a refresh; `SERVICE_RULES`
moves records out of generic categories by name ("Mill Tyres" motor → garage, "IMO Attended Car Wash" → carwash) and never out of
restaurants, pubs, hotels etc. The data script `build/add_services.py` applied all of this to the published data, merged the Overpass
extract `build/osm-services-2026-10-02.json` (shops/garages/car washes/salons etc. with a name and either `addr:*` tags or, for
premises-type tags only, a map-derived street + village marked `ax`; crafts and offices are only taken with a recorded business address;
private-individual names, flats and duplicates dropped as before) and wrote `build/add-services-report.json`.

**Service-area businesses** (most tradespeople work from home): add the record by hand with `cov` (see the record format), `a:""`, `p:""`,
`la`/`lo` = the first town's centre, `s:"owner"`, `f` = today, `c` = the trade's category. Never publish a home address, even if the pro
sends one. The claim and suggest forms have an "I cover an area, no shop address" box, and `pros.html` asks for the towns covered.

## Operating model for "Get local help" requests

1. A request arrives by email from Web3Forms with subject `LincsDirectory job request: <job> – <town> [<urgency>]` and fields `job`
   (slug), `job_title`, `need`, `town`, `town_id`, `postcode`, `when`, `name`, `phone`, `email`, `consent`, `page`.
2. **Only act on it if the consent text is present** ("I agree LincsDirectory can pass my request to local businesses…"); the form cannot be
   sent without the box ticked, but check anyway. Never forward a request that lacks it.
3. Francis (or Milson) opens the job page for that town (`<job>-in-<town>.html`, or the hub page's town selector) and forwards the request to
   listed pros that cover the area and do that job, by email or phone, including the requester's details. Premium listings first. If nobody is
   listed, use the nearby-town pages. Don't promise the requester a reply; the site already says "they may be in touch".
4. Log it in a local spreadsheet (not in the repo), suggested columns: `date`, `job_slug`, `job_title`, `town`, `postcode`, `urgency`,
   `requester_name`, `contact` (phone/email), `need` (free text), `sent_to` (business names / listing ids), `sent_on`, `method`
   (email/phone), `outcome` (replied / booked / no reply / unknown), `delete_by` (date + 12 months), `notes`.
5. Delete the row and the email 12 months after the request, or as soon as the requester asks (privacy.html#requests promises this).
6. Urgent gas/electrical requests: the site has already told them 0800 111 999 / 999; forward quickly but never give technical advice.

Pro sign-ups arrive as `LincsDirectory pro signup: <business> (<plan>)` with `jobs`, `areas`, `premises`, `address`, `credentials`. Check the
business exists (Companies House, website, public records), add the record (with `cov` if "I cover an area"), set `c` to the main category so
it appears on the right job pages, and for Premium send the payment link then flip the record as in "How to flip a listing to Premium".
Credentials are shown only if supplied and are never described as verified.

## Categories and the "Things to do" rules

Categories, drip priority and the name-based rules live in `build/categories.py`, shared by `build_listings.py` (data refreshes) and
`reschedule.py` (fixes to published data), so a refresh never undoes a category decision. "Things to do" (`fun`) covers kids' play
areas and soft play, trampoline parks, bowling, cinemas, theatres, museums and heritage centres, attractions, leisure centres and
swimming pools, golf and sports clubs, escape rooms, karting, shooting grounds, country parks and gardens. The rules:

* `FUN_SURE`: names that always mean Things to do (play barn/centre/café, soft play, trampoline, bongos, jump, bowl/bowling, cinema,
  museum, leisure centre, swimming pool, gymnastics, snooker, bingo, heritage centre, country park, walled garden…).
* `FUN_LIKELY`: theatre, golf, tennis/cricket/football/rugby/hockey/squash/badminton clubs, stadium, arena, sports centre, **unless** the
  name also says café, bar, restaurant, hotel, inn, shop, social club etc. (`FUN_NOT`), in which case it stays where it was.
* Only records in restaurants, cafés, takeaways, pubs, sport & leisure, halls/venues, shops and services can be moved by name.
  Gyms stay under Sport & leisure; village halls and social clubs stay under Halls, clubs & venues.
* OpenStreetMap tags (`leisure=bowling_alley`, `tourism=museum`, `amenity=cinema`…) map straight to `fun` on a refresh.

To change a category by hand, edit the record in its district file, then re-run `reschedule.py` (recounts `index.json`) or adjust
`byDate` yourself, and re-run `make_site.py`. 151 records were moved into Things to do on 2026-10-02 (Crazee Bongos among them);
the list is in `build/reschedule-report.json`.

## Ratings (moderated; never invented)

* Visitors rate from any card or profile (`rate.html?id=…`). The form emails you; **nothing is published automatically**.
* `data/ratings.json`: `{ "<listingId>": { "a": 4.6, "n": 12, "rev": [ {"s":5,"t":"comment","n":"Sam","d":"2026-10-10"} ] } }`.
  Cards show `a`/`n` ("4.6 · 12 ratings") or "Be the first to rate"; Premium profiles show the latest five reviews.
* To approve a rating: `python3 build/add_rating.py ../site <listingId> <stars> --text "…" --name "Sam" --date 2026-10-10`
  (appends and recomputes `a`/`n`; `--remove <id> <index>` drops one; `--show <id>` prints). Then re-run `make_site.py` and upload
  `data/ratings.json` plus the regenerated HTML (landing lists and profile pages carry static star rows; search/home read the file live).
* Policy (terms.html#ratings): genuine opinions only, moderated, no incentives or paid removal, abusive/defamatory/fake content removed,
  businesses reply via the claim form. Privacy (privacy.html#ratings): unpublished ratings kept up to 12 months, published until removal,
  first name only if given, email never published. **No AggregateRating/Review JSON-LD** is emitted, by design.

## How to add a listing by hand (including accepted suggestions)

1. Check the suggestion against public records (FSA register, Companies House, the business's own site). Only list a business trading from a public address in Lincolnshire.
2. Pick the district file in `data/` by district council. Append a record in the format above with a unique `id` (e.g. `owner-the-crown-sleaford`), `s:"owner"`, today's date for `f`, and geocoded `la`/`lo`.
3. Update `data/index.json`: add 1 to `byDate[<f>].n`, `.t[<town>]`, `.c[<cat>]` (create the date entry if needed) and `total`, and the district `count` in `files`. (Or run `build/reschedule.py --day0 <current live count>`… simpler: edit by hand.)
4. Re-run `make_site.py` (so the landing pages and browse counts include it) and upload. Home-page counts are computed from `index.json` so they stay honest.
5. If the suggester left an email, tell them it is live.

## How to flip a listing to Premium

1. Confirm payment (£4.99) and the owner's details/photo.
2. In the district file change `"tier":"free"` to `"tier":"premium"` and add `ph`, `w`, `desc`, `img`, `hrs`. Put the photo in `img/` (WebP, ~1024 px wide, under 200 KB).
3. Copy the full record into `data/index.json` → `featured` (drives the home carousel).
4. Re-run `make_site.py`: it generates the profile page `b-<slug>-<town>.html` (filename from `profile_path()`, mirrored by `LD.profileUrl` in `directory.js`), adds it to the sitemap, and Premium records sort first everywhere. Upload the new page, `sitemap.xml`, the data files, the photo and the changed landing pages.
5. Send the free Aide report. Request indexing of the profile page in Search Console.

To remove a listing: delete the record from its district file and subtract 1 from the matching `byDate` counts. Keep a private record of removed ids so a data refresh does not re-add them.

## Drip schedule

* **Day 0 (2026-10-02): 600 listings live** (the 4 Aide ones plus 596 chosen by `build/schedule.py` so every town hub and category hub
  has ≥8 live where the data allows, and the core town x category pages — restaurants, takeaways, cafés, things to do, pubs — clear
  the 8-listing indexing threshold for the ten biggest towns). From 2026-10-03: 25 a day in the existing drip order until
  `data/index.json` → `drip.last` (2027-04-30). The client filters by date, so **no daily redeploy is needed** for the search page, home
  counts or landing lists (`assets/landing.js` refreshes a landing page's list whenever the page's build date is older than today).
* Outreach queues (`outreach/queue-YYYY-MM-DD.csv`, private) keep their original rows and order (they are the outreach schedule, not the
  go-live date any more); only the category column was refreshed. `queue-ALL.csv` is the whole list.
* `build/reschedule.py ../site ../outreach --start YYYY-MM-DD [--day0 N] [--dry-run]` re-applies the category rules, re-sequences the
  drip (keeping anything already live), rewrites `data/`, updates the outreach category column and writes `build/reschedule-report.json`.
* **SEO**: landing pages are indexable once enough listings are live (see below). Re-run `make_site.py` monthly and upload the changed
  HTML + `sitemap.xml`; the noindex flags fall away as the drip continues. Then resubmit the sitemap in Search Console.

## Rebuilding the site / landing pages

```
cd "Business Centre/Website/lincsdirectory/build"
python3 make_site.py ../site            # uses today's date; or add --today 2026-11-01 to preview
python3 qa_static.py ../site            # titles/metas/H1/JSON-LD/internal links/sitemap consistency (0 problems expected)
LD_LIBRARY_PATH=... python3 qa_browser.py ../site ../screens-v4 [375|768|1440|behaviour]   # Playwright: console, overflow, forms (stubbed), screenshots
node test_intent.js ../site             # intent matcher unit test (70 phrases)
python3 brand.py ../site ../brand       # only if the logo/OG images change
python3 add_services.py ../site ../outreach --date YYYY-MM-DD --osm osm-services-YYYY-MM-DD.json [--dry-run]   # merge a new Overpass service extract
```
Shared rules now live in `build/listing_rules.py` (towns, postcode/village mapping, name tidying, private-individual test, FSA/OSM category
mapping), imported by `build_listings.py` and `add_services.py`; category rules in `categories.py`; jobs in `jobs.py`.

Rules in `make_site.py`:
* A town x category page is generated when the dataset will eventually hold ≥ 8 listings for it (`MIN_TOWNCAT_GEN`), capped at 350 pages in total (`MAX_PAGES`; the threshold rises automatically if needed).
* A town x category page is **indexable** only when ≥ 8 listings are live today (`MIN_TOWNCAT_INDEX`); town and category hubs need ≥ 5 (`MIN_HUB_INDEX`). Otherwise the page carries `noindex,follow` and is left out of `sitemap.xml` (it is still linked from `browse.html`). On 2026-10-02: 109 indexable pages (9 core + 2 profiles + 98 landing), 124 noindex (was 14 / 214).
* Each page's static list is the listings live on the build date; the lead paragraph, counts, FAQ answers, star rows and ItemList JSON-LD are computed from the data, so nothing is invented.
* The generator asserts: exactly one `<h1>` per page, title ≤ 60 and description ≤ 160 characters, every page ends `</html>`, every category has page metadata, every job maps to known categories, `ratings.json` is consistent, Premium photos exist, profile filenames are unique.
* 2026-10-02 build: 851 pages (727 indexable: 12 core, 2 profiles, 97 job hubs, 482 job x town, 134 landing; 124 noindex landing pages); 1,636 live listings of 6,617.

## Deploying

GitHub web UI only (no CLI): repo → Add file → Upload files → drag the changed files (keep each batch under ~9 MB) → Commit changes. Do not touch `CNAME` or the Pages settings. After a deploy, spot-check https://lincsdirectory.co.uk/ and the sitemap, then resubmit the sitemap in Search Console.

## Data sources and rules

* Food Standards Agency FHRS open data (OGL v3.0) for the 7 Lincolnshire districts; OpenStreetMap via Overpass (ODbL): shops, offices, crafts, selected amenities with a name and a street address.
* Kept: name, address, town, postcode, coordinates, category. **Nothing else** (no ratings, phones, emails, hours) from public data.
* Excluded: records with no/zero geocode; schools, hospitals, childcare and care premises; mobile caterers; manufacturers, distributors, farmers, importers; flats; "other catering premises" that are churches, youth centres, prisons, charities, canteens or lack a venue/business keyword; names that look like a private individual; government/association/charity offices; anything outside the 22 town areas or the Lincolnshire bounding box.
* Town areas follow postcode districts and a village list (see `PC_TOWN` / `VILLAGE_TOWN` in `build_listings.py`; the landing pages describe each area from the same tables).
* Build script: `../build/build_listings.py` regenerates `data/` and the outreach CSVs with the same deterministic schedule (categories from `categories.py`, day-0 selection from `schedule.py`). The site generator never modifies `data/`.

## Lawful outreach (UK PECR / UK GDPR)

* Email: unsolicited marketing email only to corporate subscribers (limited companies, LLPs, public bodies), identifying us with a clear opt-out. The FSA/OSM data contains no email addresses; never scrape them.
* Sole traders and partnerships: no cold email without prior consent; use post or phone (screen against the TPS first).
* Keep a do-not-contact list and honour removal requests promptly (privacy.html promises this). Suggestions and unpublished ratings are kept for up to 12 months and deleted on request.

## Pending / not yet done

* The hair, garage and car-wash jobs share their category with several other jobs, so their town pages list the same businesses under different guidance; if Search Console reports them as duplicates, set `MIN_JOBTOWN_INDEX` higher or restrict those jobs' town pages.
* Few genuine plumbers/electricians/cleaners are in the public data (OSM has very few in Lincolnshire with an address); those job pages fill up through `pros.html` sign-ups. Prioritise outreach to those trades.
* Payment link for the £4.99 Premium listing (owner is choosing a provider): paste it into `STRIPE_PREMIUM_LINK` in the claim page block of `make_site.py`, rebuild, upload. Until then the Premium button sends the claim form and you email a link.
* A lincsdirectory.co.uk mailbox (then update footer/privacy/terms contact routes).
* GLOW has no photo yet (`img` empty): add one to `img/` and to both records in `data/` when the owner supplies it.
* Google Search Console: resubmit `sitemap.xml` after each rebuild; see the deployment report for the latest indexing requests.
* Photos: apart from the Business Centre photo, all artwork is hand-built SVG (hero map plots the 22 town centres from their coordinates).
