# LincsDirectory

The Lincolnshire business directory — the marketing front door for TAG Sleaford Ltd (Kesteven Business Centre, Aide).
Static site, no build step, hosted on GitHub Pages. Live at https://lincsdirectory.co.uk/ (preview: https://wilsonclawde-cpu.github.io/lincsdirectory/).

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: hero search, towns, featured carousel, categories, house ads, claim CTA, free vs Featured, FAQ (with FAQPage JSON-LD) |
| `search.html` | Search + map + list. Deep links: `?q=…&town=<id>&cat=<id>&id=<listingId>` |
| `claim.html` | Claim / update (free), go Featured (£4.99), remove listing. Posts to Web3Forms. `?id=&name=&town=&plan=premium|remove&note=` |
| `advertise.html` | Ad slots, price on enquiry, form |
| `about.html`, `privacy.html`, `terms.html`, `404.html` | Company, legal |
| `assets/site.css`, `assets/app.js`, `assets/directory.js` | Styles, menu, data layer + search engine |
| `data/index.json` | Counts per go-live date, towns, categories, featured listings, file list |
| `data/listings-<district>.json` | Listings for one district (7 files, lazy-loaded) |
| `sitemap.xml`, `robots.txt`, `favicon.svg`, `og-image.png` | SEO |

## Business model (do not change prices or claims without the owner)

* **Free listing**: name, address, category, map pin. Built from public data only.
* **Featured listing — £4.99 one-off**: photo, website link, phone, hours, short description; shown first in results with a "Featured" label; plus a free Aide business report.
* **Advertising**: house ads for Kesteven Business Centre and Aide, labelled "Advertisement". Third-party ads: price on enquiry (no figures published).
* No contact email is published yet (no lincsdirectory.co.uk mailbox). Forms go to Web3Forms → francis@tagsleaford.com; phone 01522 424963.

## Listing record format

```json
{"id":"f123456","n":"Name","a":"1 High Street, Village","t":"sleaford","p":"NG34 7DT","la":52.99,"lo":-0.41,"c":"rest","s":"fsa","f":"2026-10-03","tier":"free"}
```

| Field | Meaning |
|---|---|
| `id` | `f<FHRSID>` (FSA), `on<id>`/`ow<id>`/`or<id>` (OpenStreetMap node/way/relation), or a slug (Aide/manual) |
| `n`, `a`, `t`, `p` | name, address (without town), town id (see `data/index.json` → `towns`), postcode |
| `la`, `lo` | latitude, longitude |
| `c` | category id (see `data/index.json` → `cats`) |
| `s` | source: `fsa`, `osm`, `aide`, `owner` |
| `f` | live_from (ISO date). The site only shows listings with `f <= today` — this is the drip schedule |
| `tier` | `free` or `premium` |
| premium only | `ph` phone, `w` website URL, `desc` short description, `img` image URL (relative, e.g. `img/f123456.webp`), `hrs` opening hours |

## How to add a listing by hand

1. Pick the district file in `data/` (by the business's district council).
2. Append a record in the format above. Use a unique `id` (e.g. `owner-the-crown-sleaford`), `s:"owner"`, and today's date for `f`.
3. Update `data/index.json`: add 1 to `byDate[<f>].n`, `.t[<town>]`, `.c[<cat>]` (create the date entry if needed) and `total`, and the district `count` in `files`. (Or re-run the build script, below, which regenerates everything.)
4. Commit. Counts on the home page are computed from `index.json`, so they stay honest.

## How to flip a listing to Featured (premium)

1. Confirm payment (£4.99) and the owner's details/photo.
2. In the district file, change `"tier":"free"` to `"tier":"premium"` and add `ph`, `w`, `desc`, `img`, `hrs`. Put the photo in `img/` (WebP, ~1200px wide, under 200 KB).
3. Copy the full record into `data/index.json` → `featured` (this drives the home-page carousel).
4. Commit. Premium records sort first automatically on the search page.
5. Send the free Aide report.

To remove a listing: delete the record from its district file and subtract 1 from the matching `byDate` counts (or re-run the build with the id added to the removed list). Keep a private record of removed ids so a data refresh does not re-add them.

## Drip schedule

* Day 0 (2026-10-02): the 4 Aide listings + 25 new ones.
* From 2026-10-03: 25 new listings go live per day (`f` dates assigned at build time; the client filters by date, so **no daily redeploy is needed**).
* Last scheduled date: see `data/index.json` → `drip.last`.
* Each day's batch is a weighted mix across the 7 districts (North Kesteven and South Kesteven first) with the most "claimable" categories (restaurants, takeaways, cafés, pubs, hotels, hair, garages) front-loaded.
* The matching outreach queues (`outreach/queue-YYYY-MM-DD.csv`, 25 rows per day) live **outside the repo** in the private Business Centre folder because the repo is public.

## Data sources and rules

* Food Standards Agency FHRS open data (Open Government Licence v3.0) for the 7 Lincolnshire districts (Boston 219, East Lindsey 220, Lincoln 221, North Kesteven 222, South Holland 223, South Kesteven 224, West Lindsey 225).
* OpenStreetMap via Overpass (ODbL): shops, offices, crafts, selected amenities with a name and a street address.
* Kept: name, address, town, postcode, coordinates, category. **Nothing else** (no ratings, phones, emails, hours).
* Excluded: records with no/zero geocode; schools, hospitals, childcare and care premises; mobile caterers; manufacturers, distributors, farmers, importers; flats/apartments; "other catering premises" that are churches, youth/children's centres, prisons, charities, workplace canteens or lack a venue/business keyword; names that look like a private individual (home-based sellers); government/association/charity offices; anything outside the 22 town areas or the Lincolnshire bounding box.
* Build script: `../build/build_listings.py` (inputs: the 7 FHRS XML files + an Overpass JSON extract). Re-running it regenerates `data/` and the outreach CSVs with the same deterministic schedule.

## Lawful outreach (UK PECR / UK GDPR)

* **Email**: unsolicited marketing email is allowed only to **corporate subscribers** (limited companies, LLPs, public bodies) and must identify us and give a clear opt-out. The FSA/OSM data contains **no** email addresses; never scrape them.
* **Sole traders and partnerships** are individual subscribers: no cold email without prior consent — use **post or phone** (screen phone numbers against the TPS first).
* Keep a do-not-contact list and honour removal requests promptly (privacy.html promises this).

## Pending / not yet done

* Custom domain: add a `CNAME` file containing `lincsdirectory.co.uk` and set the custom domain in Pages **after** DNS resolves to GitHub Pages; then tick Enforce HTTPS.
* Stripe Payment Link for the £4.99 Featured listing: paste it into `STRIPE_PREMIUM_LINK` in `claim.html`.
* A lincsdirectory.co.uk mailbox (then update footer/privacy/terms contact routes).
* Cross-link from Aide's directory page to LincsDirectory (owner to direct).
