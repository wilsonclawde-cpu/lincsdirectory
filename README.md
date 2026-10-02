# LincsDirectory

The Lincolnshire business directory, the marketing front door for TAG Sleaford Ltd (Kesteven Business Centre, Aide).
Static site, hosted on GitHub Pages. Live at https://lincsdirectory.co.uk/ (repo `wilsonclawde-cpu/lincsdirectory`).

Everything in this repo except `data/`, `CNAME` and the icons/OG images is **generated** by `build/make_site.py` (kept in the private
Business Centre folder, not in the repo). Edit the generator, re-run it, upload the output. Do not hand-edit the HTML.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: hero search, the three intent cards (Looking for a service / Want to know what's around / Need help), Suggest a business, towns (live counts), categories, featured carousel, claim CTA, Free vs Featured table, house ads, FAQ (FAQPage JSON-LD) |
| `search.html` | Search + map + list. Deep links: `?q=…&town=<id>&cat=<id>&id=<listingId>`; `#near` triggers "near me" |
| `suggest.html` | Suggest a business (public). Posts to Web3Forms, subject "LincsDirectory suggestion". Nothing is auto-published. `?note=` and `?name=` prefill |
| `claim.html` | Claim / update (free), go Featured (£4.99), remove listing. `?id=&name=&town=&plan=premium|remove&note=`. `STRIPE_PREMIUM_LINK` constant inside |
| `advertise.html`, `about.html`, `privacy.html`, `terms.html`, `404.html` | Ad slots (price on enquiry), company, legal |
| `browse.html` | HTML sitemap: every town, category and town-by-category page |
| `<town>-business-directory.html` (22) | Town hub pages, e.g. `sleaford-business-directory.html` |
| `<category>-lincolnshire.html` (21) | Category hub pages, e.g. `restaurants-lincolnshire.html` |
| `<category>-in-<town>.html` (174) | Town x category pages, e.g. `restaurants-in-sleaford.html` |
| `assets/site.css`, `assets/app.js`, `assets/directory.js`, `assets/home.js`, `assets/landing.js` | Styles, header/menu/reveal, data layer + search engine, home page, landing-page refresh |
| `data/index.json` | Counts per go-live date, towns, categories, featured listings, file list |
| `data/listings-<district>.json` | Listings for one district (7 files, lazy-loaded) |
| `sitemap.xml`, `robots.txt`, `site.webmanifest`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `logo.svg`, `og-image.png`, `og-search.png`, `og-suggest.png` | SEO / brand (from `build/brand.py`; brand pack in `../brand/`) |
| `google926aaa262e88957a.html` | Google Search Console verification file. Keep it. |

## Business model (do not change prices or claims without the owner)

* **Free listing**: name, address, category, map pin. Built from public data only.
* **Featured listing, £4.99 one-off**: photo, website link, phone, hours, short description; shown first in results with a "Featured" label; plus a free Aide business report.
* **Advertising**: house ads for Kesteven Business Centre (offices from £250/month, meeting room from £15/hr, day office) and Aide (reports from £4.99), labelled "Advertisement". Third-party ads: price on enquiry.
* No contact email is published (no lincsdirectory.co.uk mailbox yet). Forms go to Web3Forms. Phone 01522 424963 is published **without opening hours** (hours were never confirmed; do not add them back).

## Listing record format

```json
{"id":"f123456","n":"Name","a":"1 High Street, Village","t":"sleaford","p":"NG34 7DT","la":52.99,"lo":-0.41,"c":"rest","s":"fsa","f":"2026-10-03","tier":"free"}
```

| Field | Meaning |
|---|---|
| `id` | `f<FHRSID>` (FSA), `on<id>`/`ow<id>`/`or<id>` (OpenStreetMap), or a slug (Aide/manual/suggested) |
| `n`, `a`, `t`, `p` | name, address (without town), town id (see `data/index.json` → `towns`), postcode |
| `la`, `lo` | latitude, longitude |
| `c` | category id (see `data/index.json` → `cats`) |
| `s` | source: `fsa`, `osm`, `aide`, `owner` |
| `f` | live_from (ISO date). The site only shows listings with `f <= today`: this is the drip schedule |
| `tier` | `free` or `premium` |
| premium only | `ph` phone, `w` website URL, `desc` short description, `img` image URL (relative, e.g. `img/f123456.webp`), `hrs` opening hours |

## How to add a listing by hand (including accepted suggestions)

1. Check the suggestion against public records (FSA register, Companies House, the business's own site). Only list a business trading from a public address in Lincolnshire.
2. Pick the district file in `data/` by district council. Append a record in the format above with a unique `id` (e.g. `owner-the-crown-sleaford`), `s:"owner"`, today's date for `f`, and geocoded `la`/`lo`.
3. Update `data/index.json`: add 1 to `byDate[<f>].n`, `.t[<town>]`, `.c[<cat>]` (create the date entry if needed) and `total`, and the district `count` in `files`.
4. Re-run `make_site.py` (so the landing pages and browse counts include it) and upload. Home-page counts are computed from `index.json` so they stay honest.
5. If the suggester left an email, tell them it is live.

## How to flip a listing to Featured (premium)

1. Confirm payment (£4.99) and the owner's details/photo.
2. In the district file change `"tier":"free"` to `"tier":"premium"` and add `ph`, `w`, `desc`, `img`, `hrs`. Put the photo in `img/` (WebP, ~1200px wide, under 200 KB).
3. Copy the full record into `data/index.json` → `featured` (drives the home carousel).
4. Re-run `make_site.py` and upload. Premium records sort first on the search page and on landing pages automatically.
5. Send the free Aide report.

To remove a listing: delete the record from its district file and subtract 1 from the matching `byDate` counts. Keep a private record of removed ids so a data refresh does not re-add them.

## Drip schedule

* Day 0 (2026-10-02): the 4 Aide listings + 25 new ones. From 2026-10-03: 25 new listings a day until `data/index.json` → `drip.last` (2027-05-23). The client filters by date, so **no daily redeploy is needed** for the search page, home counts or the lists on landing pages (`assets/landing.js` refreshes a landing page's list from the data files whenever the page's build date is older than today).
* Outreach queues (`outreach/queue-YYYY-MM-DD.csv`, 25 rows per day) live outside the repo in the private Business Centre folder.
* **SEO consequence**: landing pages are only *indexable* once enough listings are live (see below). With 25/day most town x category pages stay `noindex` for months. Bringing more listings live sooner (e.g. all restaurants/takeaways now) is the single biggest SEO lever; it is the owner's call.

## Rebuilding the site / landing pages

```
cd "Business Centre/Website/lincsdirectory/build"
python3 make_site.py ../site            # uses today's date; or add --today 2026-11-01 to preview
python3 brand.py ../site ../brand       # only if the logo/OG images change
```

Rules in `make_site.py`:
* A town x category page is generated when the dataset will eventually hold ≥ 8 listings for it (`MIN_TOWNCAT_GEN`), capped at 350 pages in total (`MAX_PAGES`; the threshold rises automatically if needed).
* A town x category page is **indexable** only when ≥ 8 listings are live today (`MIN_TOWNCAT_INDEX`); town and category hubs need ≥ 5 (`MIN_HUB_INDEX`). Otherwise the page carries `noindex,follow` and is left out of `sitemap.xml` (it is still linked from `browse.html`, so people and crawlers can reach it).
* Each page's static list is the listings live on the build date; the lead paragraph, counts, FAQ answers and ItemList JSON-LD are computed from the data, so nothing is invented.
* **Re-run monthly** (or whenever listings are added/flipped) and upload the changed HTML + `sitemap.xml`: the noindex flags fall away as listings go live, and the sitemap grows. Then resubmit the sitemap in Search Console.

The generator asserts: exactly one `<h1>` per page, title ≤ 60 and description ≤ 160 characters, every page ends `</html>`.

## Deploying

GitHub web UI only (no CLI): repo → Add file → Upload files → drag the changed files (keep each batch under ~9 MB) → Commit changes. Do not touch `CNAME` or the Pages settings. After a deploy, spot-check https://lincsdirectory.co.uk/ and the sitemap.

## Data sources and rules

* Food Standards Agency FHRS open data (OGL v3.0) for the 7 Lincolnshire districts; OpenStreetMap via Overpass (ODbL): shops, offices, crafts, selected amenities with a name and a street address.
* Kept: name, address, town, postcode, coordinates, category. **Nothing else** (no ratings, phones, emails, hours).
* Excluded: records with no/zero geocode; schools, hospitals, childcare and care premises; mobile caterers; manufacturers, distributors, farmers, importers; flats; "other catering premises" that are churches, youth centres, prisons, charities, canteens or lack a venue/business keyword; names that look like a private individual; government/association/charity offices; anything outside the 22 town areas or the Lincolnshire bounding box.
* Town areas follow postcode districts and a village list (see `PC_TOWN` / `VILLAGE_TOWN` in `build_listings.py`; the landing pages describe each area from the same tables).
* Build script: `../build/build_listings.py` regenerates `data/` and the outreach CSVs with the same deterministic schedule. The site generator never modifies `data/`.

## Lawful outreach (UK PECR / UK GDPR)

* Email: unsolicited marketing email only to corporate subscribers (limited companies, LLPs, public bodies), identifying us with a clear opt-out. The FSA/OSM data contains no email addresses; never scrape them.
* Sole traders and partnerships: no cold email without prior consent; use post or phone (screen against the TPS first).
* Keep a do-not-contact list and honour removal requests promptly (privacy.html promises this). Suggestions are kept for up to 12 months and deleted on request (privacy.html#suggestions).

## Pending / not yet done

* Stripe Payment Link for the £4.99 Featured listing: paste it into `STRIPE_PREMIUM_LINK` in the claim page block of `make_site.py`, rebuild, upload.
* A lincsdirectory.co.uk mailbox (then update footer/privacy/terms contact routes).
* Confirm the phone line hours before ever publishing them. (`data/index.json` → `featured` → Kesteven Business Centre `hrs` still says "enquiries Mon–Fri 9am–5pm"; that is the centre's own listing data, left untouched; correct it in the data if wrong.)
* Google Search Console: see the deployment report for status (property, sitemap, indexing requests).
* Photos: there are no Unsplash/Pexels photos on the site; all artwork is hand-built SVG (hero map plots the 22 town centres from their coordinates).
