# LincsDirectory

The Lincolnshire business directory, the marketing front door for TAG Sleaford Ltd (Kesteven Business Centre, Aide).
Static site, hosted on GitHub Pages. Live at https://lincsdirectory.co.uk/ (repo `wilsonclawde-cpu/lincsdirectory`).

Everything in this repo except `data/`, `img/`, `CNAME` and the icons/OG images is **generated** by `build/make_site.py` (kept in the
private Business Centre folder, not in the repo). Edit the generator, re-run it, upload the output. Do not hand-edit the HTML.
`assets/site.css` and `assets/directory.js` are hand-maintained; `assets/home.js` and `assets/landing.js` are written by the generator.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: hero search, the three intent cards (Looking for a service / Want to know what's around, with quick chips Things to do, Eat & drink, Shops, Pubs / Need help), Suggest a business, towns (live counts), categories, Premium carousel, claim CTA, Free vs Premium table, house cards for the Business Centre and Aide (tagged "Premium listing"), FAQ (FAQPage JSON-LD) |
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
| `assets/site.css`, `assets/app.js`, `assets/directory.js`, `assets/home.js`, `assets/landing.js` | Styles, header/menu/reveal, data layer + search engine + ratings/star rows + profile URL, home page, landing-page refresh |
| `data/index.json` | Counts per go-live date, towns, categories, featured (Premium) listings, file list |
| `data/listings-<district>.json` | Listings for one district (7 files, lazy-loaded) |
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
| premium only | `ph` phone, `w` website URL, `desc` description, `img` image path (e.g. `img/tag-sleaford.webp`), `hrs` opening hours (free text; "Mon–Fri 8am–4.30pm" style is also turned into schema.org openingHours) |

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
python3 brand.py ../site ../brand       # only if the logo/OG images change
```

Rules in `make_site.py`:
* A town x category page is generated when the dataset will eventually hold ≥ 8 listings for it (`MIN_TOWNCAT_GEN`), capped at 350 pages in total (`MAX_PAGES`; the threshold rises automatically if needed).
* A town x category page is **indexable** only when ≥ 8 listings are live today (`MIN_TOWNCAT_INDEX`); town and category hubs need ≥ 5 (`MIN_HUB_INDEX`). Otherwise the page carries `noindex,follow` and is left out of `sitemap.xml` (it is still linked from `browse.html`). On 2026-10-02: 109 indexable pages (9 core + 2 profiles + 98 landing), 124 noindex (was 14 / 214).
* Each page's static list is the listings live on the build date; the lead paragraph, counts, FAQ answers, star rows and ItemList JSON-LD are computed from the data, so nothing is invented.
* The generator asserts: exactly one `<h1>` per page, title ≤ 60 and description ≤ 160 characters, every page ends `</html>`, every category has page metadata, `ratings.json` is consistent, Premium photos exist, profile filenames are unique.

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

* Payment link for the £4.99 Premium listing (owner is choosing a provider): paste it into `STRIPE_PREMIUM_LINK` in the claim page block of `make_site.py`, rebuild, upload. Until then the Premium button sends the claim form and you email a link.
* A lincsdirectory.co.uk mailbox (then update footer/privacy/terms contact routes).
* GLOW has no photo yet (`img` empty): add one to `img/` and to both records in `data/` when the owner supplies it.
* Google Search Console: resubmit `sitemap.xml` after each rebuild; see the deployment report for the latest indexing requests.
* Photos: apart from the Business Centre photo, all artwork is hand-built SVG (hero map plots the 22 town centres from their coordinates).
