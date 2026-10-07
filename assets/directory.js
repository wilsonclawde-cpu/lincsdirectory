/* LincsDirectory data layer + search.
   Data lives in data/index.json (counts, towns, categories, featured) and data/listings-<district>.json.
   Every listing has f = live_from (ISO date); the client only shows listings with f <= today, so the
   drip schedule needs no daily redeploy. Fields: id,n,a,t,p,la,lo,c,s,f,tier (+ph,w,desc,img,hrs on premium).
   Ratings live in data/ratings.json (moderated by hand, loaded lazily); premium listings have a static profile page b-<slug>-<town>.html.
   Optional fields: ph (phone from OpenStreetMap or the business), cov (service-area business: array of town ids it covers, no street
   address shown; Free listings use the first 3, Promoted all of them or "all" = the whole county, see cov() below), ax (1 = address
   derived from the map: shown as "near ..."), d (v8: one-line description, <= 100 characters, supplied by the business and moderated;
   shown on Free and Promoted cards), svc + desc (v9: up to 3 service bullets of <= 60 characters and a <= 400-character description on
   owner-added / claimed listings, shown under a "More about this business" toggle; Promoted: up to 8 bullets, <= 1,200 characters).
   s = "owner" means the business asked to be listed (cards say "Added by the business"). */
window.LD = (function () {
  var BASE = (document.querySelector('meta[name="ld-base"]') || {}).content || "";
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var d = new Date();
  var TODAY = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  var cache = {};

  function getJSON(url) {
    if (cache[url]) return cache[url];
    cache[url] = fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(url + " " + r.status); return r.json(); });
    return cache[url];
  }
  function index() { return getJSON(BASE + "data/index.json"); }
  function isLive(l) { return !l.f || l.f <= TODAY; }
  // Approved customer ratings: { "<listingId>": { a: 4.6, n: 12, rev: [...] } }. Moderated by hand; missing file = no ratings.
  var ratingsP = null;
  function ratings() { if (!ratingsP) ratingsP = getJSON(BASE + "data/ratings.json").catch(function () { return {}; }); return ratingsP; }
  function rateUrl(l) { return BASE + "rate.html?id=" + encodeURIComponent(l.id) + "&town=" + encodeURIComponent(l.t); }
  // Star row for a card: real average + count, or "Be the first to rate". Mirrors stars_html() in build/make_site.py.
  function stars(l, R) {
    var r = R && R[l.id];
    if (r && r.n) {
      var a = Number(r.a), n = Number(r.n), pct = Math.round(a / 5 * 100);
      var st = el("span", { class: "st", "aria-hidden": "true", text: "★★★★★" });
      st.appendChild(el("span", { class: "f", style: "width:" + pct + "%", text: "★★★★★" }));
      var sr = el("span", { class: "sr" }, [el("span", { class: "visually-hidden", text: "Rated " }), document.createTextNode(a.toFixed(1)), el("span", { class: "visually-hidden", text: " out of 5" }), document.createTextNode(" · " + n + (n === 1 ? " rating" : " ratings"))]);
      return el("div", { class: "stars" }, [st, sr, el("a", { class: "rate", href: rateUrl(l), text: "Rate" })]);
    }
    return el("div", { class: "stars none" }, [el("span", { class: "st", "aria-hidden": "true", text: "☆☆☆☆☆" }), el("a", { class: "rate", href: rateUrl(l), text: "Be the first to rate" })]);
  }
  // Premium profile page filename: b-<slug>-<town>.html. Must match profile_path() in build/make_site.py.
  function slug(s) { return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function profileUrl(l) { var b = slug(l.n); if (!(b === l.t || b.slice(-(l.t.length + 1)) === "-" + l.t)) b += "-" + l.t; return BASE + "b-" + b + ".html"; }

  // Counts of live listings from index.byDate (no need to load every file on the home page).
  function liveCounts(idx) {
    var out = { total: 0, towns: {}, cats: {} };
    Object.keys(idx.byDate).forEach(function (date) {
      if (date > TODAY) return;
      var b = idx.byDate[date];
      out.total += b.n;
      Object.keys(b.t).forEach(function (t) { out.towns[t] = (out.towns[t] || 0) + b.t[t]; });
      Object.keys(b.c).forEach(function (c) { out.cats[c] = (out.cats[c] || 0) + b.c[c]; });
    });
    return out;
  }

  // Load listings for a town (only the district files that contain it) or for all of Lincolnshire.
  function listings(town) {
    return index().then(function (idx) {
      var files = idx.files.filter(function (f) { return !town || f.towns.indexOf(town) > -1; });
      return Promise.all(files.map(function (f) {
        return getJSON(BASE + "data/" + f.file).then(function (rows) { rows.forEach(function (r) { r._district = f.district; }); return rows; });   // (was r.d; `d` is the one-line description since v8)
      })).then(function (parts) {
        var all = [];
        parts.forEach(function (p) { p.forEach(function (r) { if (isLive(r) && (!town || r.t === town || cov(r, idx.towns).indexOf(town) > -1)) all.push(r); }); });
        return all;
      });
    });
  }

  // Plain-English words -> categories and name keywords.
  var SYN = {
    chinese: { c: ["rest", "take"], k: ["chinese", "china", "wok", "peking", "canton", "hong kong", "oriental", "dragon", "jade", "golden", "panda", "lucky", "mandarin", "szechuan", "sichuan", "bamboo", "lotus", "phoenix", "pearl", "ming", "hong", "dynasty", "imperial", "palace", "noodle", "dim sum", "happy", "fortune", "lantern", "chopstick"] },
    indian: { c: ["rest", "take"], k: ["indian", "tandoori", "balti", "curry", "spice", "masala", "raj", "taj", "bengal", "punjab", "dhaba"] },
    curry: { c: ["rest", "take"], k: ["indian", "tandoori", "balti", "curry", "spice", "masala"] },
    thai: { c: ["rest", "take"], k: ["thai", "siam", "bangkok"] },
    italian: { c: ["rest", "take"], k: ["italian", "pizza", "pasta", "trattoria", "pizzeria", "italia"] },
    pizza: { c: ["take", "rest"], k: ["pizza", "pizzeria"] },
    kebab: { c: ["take"], k: ["kebab", "grill", "doner", "turkish"] },
    burger: { c: ["take", "rest"], k: ["burger", "mcdonald", "burger king", "five guys"] },
    chippy: { c: ["take"], k: ["fish", "chip", "plaice", "fisheries", "fryer", "cod"] },
    chips: { c: ["take"], k: ["fish", "chip", "plaice", "fisheries", "fryer", "cod"] },
    fish: { c: ["take", "food"], k: ["fish", "chip", "plaice", "fisheries", "fryer", "cod", "fishmonger", "seafood"] },
    takeaway: { c: ["take"] }, takeout: { c: ["take"] }, delivery: { c: ["take"] },
    restaurant: { c: ["rest"] }, eat: { c: ["rest", "take", "cafe"] }, food: { c: ["rest", "take", "cafe", "food"] }, dinner: { c: ["rest", "pub"] }, lunch: { c: ["cafe", "rest", "pub"] }, meal: { c: ["rest", "pub", "take"] },
    cafe: { c: ["cafe"] }, coffee: { c: ["cafe"] }, breakfast: { c: ["cafe"] }, brunch: { c: ["cafe"] }, tea: { c: ["cafe"] }, tearoom: { c: ["cafe"] }, cake: { c: ["cafe", "food"] }, sandwich: { c: ["cafe", "take"] },
    pub: { c: ["pub"] }, pint: { c: ["pub"] }, beer: { c: ["pub"] }, drink: { c: ["pub"] }, bar: { c: ["pub"] }, inn: { c: ["pub", "hotel"] }, nightclub: { c: ["pub"] }, club: { c: ["pub", "venue", "leisure"] },
    hotel: { c: ["hotel"] }, stay: { c: ["hotel"] }, room: { c: ["hotel"] }, bb: { c: ["hotel"] }, "b&b": { c: ["hotel"] }, guesthouse: { c: ["hotel"] }, accommodation: { c: ["hotel"] },
    haircut: { c: ["hair"] }, hair: { c: ["hair"] }, barber: { c: ["hair"] }, salon: { c: ["hair"] }, hairdresser: { c: ["hair"] }, nails: { c: ["hair"] }, beauty: { c: ["hair"] }, beautician: { c: ["hair"] }, tattoo: { c: ["hair"] }, spa: { c: ["hair", "leisure"] },
    garage: { c: ["garage", "motor"] }, mechanic: { c: ["garage", "motor"] }, mot: { c: ["garage", "motor"] }, tyres: { c: ["garage", "motor"] }, car: { c: ["garage", "motor", "carwash"] }, petrol: { c: ["motor"] }, fuel: { c: ["motor"] }, diesel: { c: ["motor"] }, carwash: { c: ["carwash", "motor"] },
    plumber: { c: ["plumb", "trade"] }, plumbing: { c: ["plumb", "trade"] }, electrician: { c: ["elec", "trade"] }, electrical: { c: ["elec", "trade"] }, builder: { c: ["build", "trade"] }, roofer: { c: ["build", "trade"] }, roofing: { c: ["build", "trade"] }, joiner: { c: ["build", "trade"] }, carpenter: { c: ["build", "trade"] }, decorator: { c: ["build", "trade"] }, plasterer: { c: ["build", "trade"] }, handyman: { c: ["build", "trade"] }, heating: { c: ["plumb", "trade"] }, boiler: { c: ["plumb", "trade"] }, gas: { c: ["plumb"] }, drain: { c: ["plumb", "clean"] }, drains: { c: ["plumb", "clean"] },
    gardener: { c: ["garden"] }, gardening: { c: ["garden"] }, landscaper: { c: ["garden"] }, landscaping: { c: ["garden"] }, lawn: { c: ["garden"] }, grass: { c: ["garden"] }, hedge: { c: ["garden"] }, tree: { c: ["garden"] }, fencing: { c: ["garden", "build"] }, patio: { c: ["garden", "build"] }, driveway: { c: ["garden", "build"] },
    valet: { c: ["carwash"] }, valeting: { c: ["carwash"] }, wash: { c: ["carwash"] }, tyre: { c: ["garage", "motor"] }, puncture: { c: ["garage", "motor"] }, brakes: { c: ["garage", "motor"] }, servicing: { c: ["garage", "motor"] }, exhaust: { c: ["garage", "motor"] }, bodyshop: { c: ["garage", "motor"] }, windscreen: { c: ["garage", "motor"] },
    cleaning: { c: ["clean", "serv"] }, cleaners: { c: ["clean", "serv"] }, domestic: { c: ["clean"] }, oven: { c: ["clean", "appl"] }, removals: { c: ["remov"] }, removal: { c: ["remov"] }, van: { c: ["remov"] }, movers: { c: ["remov"] }, rubbish: { c: ["remov"] }, waste: { c: ["remov"] }, skip: { c: ["remov"] },
    appliance: { c: ["appl"] }, appliances: { c: ["appl"] }, washing: { c: ["appl", "plumb"] }, fridge: { c: ["appl"] }, freezer: { c: ["appl"] }, dishwasher: { c: ["appl", "plumb"] }, laptop: { c: ["appl"] }, computer: { c: ["appl"] }, computers: { c: ["appl"] }, aerial: { c: ["appl", "elec"] },
    locks: { c: ["lock"] }, lock: { c: ["lock"] }, keys: { c: ["lock"] }, key: { c: ["lock"] },
    groomer: { c: ["petserv"] }, grooming: { c: ["petserv", "hair"] }, kennels: { c: ["petserv"] }, kennel: { c: ["petserv"] }, cattery: { c: ["petserv"] }, boarding: { c: ["petserv"] }, walker: { c: ["petserv"] },
    tutor: { c: ["tutor"] }, tuition: { c: ["tutor"] }, lessons: { c: ["tutor"] }, lesson: { c: ["tutor"] }, instructor: { c: ["tutor"] }, dance: { c: ["tutor", "leisure"] },
    photographer: { c: ["photo"] }, photography: { c: ["photo"] }, photos: { c: ["photo"] }, dj: { c: ["photo"] }, entertainer: { c: ["photo"] }, events: { c: ["photo", "venue", "cater"] },
    pharmacy: { c: ["health"] }, chemist: { c: ["health"] }, prescription: { c: ["health"] }, dentist: { c: ["health"] }, optician: { c: ["health"] }, glasses: { c: ["health"] }, doctor: { c: ["health"] }, physio: { c: ["health"] }, health: { c: ["health"] },
    vet: { c: ["pets"] }, vets: { c: ["pets"] }, pet: { c: ["pets"] }, dog: { c: ["pets"] }, cat: { c: ["pets"] },
    estate: { c: ["estate"] }, letting: { c: ["estate"] }, lettings: { c: ["estate"] }, house: { c: ["estate"] }, property: { c: ["estate"] }, mortgage: { c: ["prof", "estate"] },
    solicitor: { c: ["prof"] }, lawyer: { c: ["prof"] }, accountant: { c: ["prof"] }, accounts: { c: ["prof"] }, bank: { c: ["prof"] }, insurance: { c: ["prof"] }, financial: { c: ["prof"] }, recruitment: { c: ["prof"] },
    gym: { c: ["leisure"] }, fitness: { c: ["leisure"] }, swimming: { c: ["fun", "leisure"] }, pool: { c: ["fun", "leisure"] }, golf: { c: ["fun", "leisure"] }, bowling: { c: ["fun"] }, cinema: { c: ["fun"] }, leisure: { c: ["fun", "leisure"] }, caravan: { c: ["leisure", "hotel"] }, holiday: { c: ["leisure", "hotel"] }, camping: { c: ["leisure"] },
    play: { c: ["fun"], k: ["play", "bongo", "jump", "trampolin", "adventure", "fun"] }, softplay: { c: ["fun"], k: ["play", "bongo", "jump", "trampolin", "adventure"] }, trampoline: { c: ["fun"], k: ["trampolin", "jump", "bongo"] }, trampolines: { c: ["fun"], k: ["trampolin", "jump", "bongo"] },
    kids: { c: ["fun"] }, children: { c: ["fun"] }, family: { c: ["fun"] }, fun: { c: ["fun"] }, activities: { c: ["fun"] }, activity: { c: ["fun"] }, dayout: { c: ["fun"] }, attraction: { c: ["fun"] }, attractions: { c: ["fun"] },
    theatre: { c: ["fun"] }, museum: { c: ["fun"] }, bowl: { c: ["fun"] }, tenpin: { c: ["fun"] }, escape: { c: ["fun"] }, karting: { c: ["fun"] }, paintball: { c: ["fun"] }, snooker: { c: ["fun"] }, bingo: { c: ["fun"] }, football: { c: ["fun"] }, rugby: { c: ["fun"] }, cricket: { c: ["fun"] }, tennis: { c: ["fun"] }, squash: { c: ["fun"] }, things: { c: ["fun"] },
    hall: { c: ["venue"] }, venue: { c: ["venue", "fun"] }, wedding: { c: ["venue", "hotel"] }, party: { c: ["venue", "cater", "fun"] }, hire: { c: ["venue", "office"] },
    catering: { c: ["cater"] }, caterer: { c: ["cater"] }, buffet: { c: ["cater"] },
    supermarket: { c: ["super"] }, grocery: { c: ["super", "food"] }, groceries: { c: ["super", "food"] }, convenience: { c: ["super"] }, newsagent: { c: ["super"] }, milk: { c: ["super"] }, "co-op": { c: ["super"] }, coop: { c: ["super"] }, tesco: { c: ["super"] }, spar: { c: ["super"] },
    butcher: { c: ["food"] }, butchers: { c: ["food"] }, bakery: { c: ["food", "cafe"] }, baker: { c: ["food", "cafe"] }, bread: { c: ["food", "cafe"] }, deli: { c: ["food"] }, farmshop: { c: ["food"] }, greengrocer: { c: ["food"] }, wine: { c: ["food", "pub"] }, offlicence: { c: ["food", "super"] }, sweets: { c: ["food"] },
    florist: { c: ["home", "shop"] }, flowers: { c: ["home", "shop"] }, garden: { c: ["garden", "home"] }, diy: { c: ["home"] }, hardware: { c: ["home"] }, furniture: { c: ["home"] }, carpet: { c: ["home", "build"] }, kitchen: { c: ["home", "build", "rest"] }, locksmith: { c: ["lock"] },
    shop: { c: ["shop", "super", "food", "home"] }, shopping: { c: ["shop"] }, gift: { c: ["shop"] }, gifts: { c: ["shop"] }, clothes: { c: ["shop"] }, clothing: { c: ["shop"] }, shoes: { c: ["shop"] }, jewellery: { c: ["shop"] }, jeweller: { c: ["shop"] }, phone: { c: ["shop"] }, charity: { c: ["shop"] }, books: { c: ["shop"] }, toys: { c: ["shop"] },
    office: { c: ["office"] }, offices: { c: ["office"] }, desk: { c: ["office"] }, coworking: { c: ["office"] }, workspace: { c: ["office"] }, meeting: { c: ["office", "venue"] }, boardroom: { c: ["office"] }, storage: { c: ["office", "serv"] }, printing: { c: ["office", "serv"] },
    laundry: { c: ["serv"] }, laundrette: { c: ["serv"] }, drycleaning: { c: ["serv"] }, cleaner: { c: ["serv"] }, funeral: { c: ["serv"] }, travel: { c: ["serv"] }, driving: { c: ["serv"] }, postoffice: { c: ["serv", "super"] }, post: { c: ["serv", "super"] }, taxi: { c: ["serv"] }, repair: { c: ["serv", "motor", "home"] }
  };
  var STOP = {};
  ("i want a an the some need find me looking for near in to get somewhere somebody someone please good best cheap my can you recommend is there any with and or of at nearby around open now local lincolnshire lincs").split(" ").forEach(function (w) { STOP[w] = 1; });
  var PHRASES = [["fish and chips", "chippy"], ["fish & chips", "chippy"], ["fish chips", "chippy"], ["bed and breakfast", "bb"], ["take away", "takeaway"], ["farm shop", "farmshop"], ["off licence", "offlicence"], ["post office", "postoffice"], ["dry cleaning", "drycleaning"], ["dry cleaner", "drycleaning"], ["car wash", "carwash"], ["estate agent", "estate"], ["estate agents", "estate"], ["meeting room", "meeting"], ["tea room", "tearoom"], ["guest house", "guesthouse"], ["coffee shop", "coffee"], ["hair dresser", "hairdresser"], ["nail bar", "nails"], ["hot food", "takeaway"],
    ["things to do", "things"], ["soft play", "softplay"], ["day out", "dayout"], ["days out", "dayout"], ["ten pin", "tenpin"], ["escape room", "escape"], ["go karting", "karting"], ["go karts", "karting"], ["crazy golf", "golf"], ["mini golf", "golf"]];

  function parseQuery(raw, towns) {
    var text = " " + (raw || "").toLowerCase().replace(/[^a-z0-9\s&'-]/g, " ").replace(/\s+/g, " ") + " ";
    PHRASES.forEach(function (p) { text = text.split(" " + p[0] + " ").join(" " + p[1] + " "); });
    var town = null;
    Object.keys(towns || {}).forEach(function (id) {
      var nm = towns[id].name.toLowerCase();
      if (text.indexOf(" " + nm + " ") > -1) { town = id; text = text.split(" " + nm + " ").join(" "); }
    });
    var tokens = [];
    text.trim().split(/\s+/).filter(Boolean).forEach(function (w) {
      if (STOP[w]) return;
      if (!SYN[w] && w.length > 3 && w.slice(-1) === "s" && SYN[w.slice(0, -1)]) w = w.slice(0, -1);
      if (!SYN[w] && w.length > 4 && w.slice(-2) === "es" && SYN[w.slice(0, -2)]) w = w.slice(0, -2);
      tokens.push(w);
    });
    return { town: town, tokens: tokens };
  }

  // Score a listing against tokens; 0 = no match. Premium listings always sort first.
  function score(l, tokens, catNames) {
    var name = l.n.toLowerCase(), addr = (l.a + " " + (l.p || "")).toLowerCase(), cname = (catNames[l.c] || "").toLowerCase();
    var desc = (l.desc || "").toLowerCase();
    var total = 0;
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i], s = SYN[t], best = 0;
      if (s) {
        if (s.k) {   // cuisine-style words: the name (or Premium description) must contain a keyword
          for (var k = 0; k < s.k.length; k++) if (name.indexOf(s.k[k]) > -1 || desc.indexOf(s.k[k]) > -1) { best = Math.max(best, s.c.indexOf(l.c) > -1 ? 45 : 35); break; }
        } else if (s.c.indexOf(l.c) > -1) best = Math.max(best, s.c[0] === l.c ? 30 : 18);
      }
      if (name.indexOf(t) === 0) best = Math.max(best, 60);
      else if (name.indexOf(t) > -1) best = Math.max(best, 45);
      if (cname.indexOf(t) > -1) best = Math.max(best, 25);
      if (addr.indexOf(t) > -1) best = Math.max(best, 12);
      if (desc.indexOf(t) > -1) best = Math.max(best, 15);
      if (!best) return 0;
      total += best;
    }
    return total + (tokens.length ? 0 : 1);
  }
  function sortResults(rows) {
    rows.sort(function (a, b) {
      var pa = a.tier === "premium" ? 1 : 0, pb = b.tier === "premium" ? 1 : 0;
      if (pa !== pb) return pb - pa;                   // Premium first
      if ((b._s || 0) !== (a._s || 0)) return (b._s || 0) - (a._s || 0);
      if (a._d != null && b._d != null && a._d !== b._d) return a._d - b._d;
      return a.n.localeCompare(b.n, "en-GB");
    });
    return rows;
  }
  function search(rows, opts) {
    var tokens = opts.tokens || [], cat = opts.cat || "", cats = opts.cats || null, catNames = opts.catNames || {};
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var l = rows[i];
      if (cat && l.c !== cat) continue;
      if (cats && cats.indexOf(l.c) < 0) continue;
      var s = score(l, tokens, catNames);
      if (!s) continue;
      l._s = s;
      if (opts.user) l._d = miles(opts.user, { lat: l.la, lng: l.lo }); else l._d = null;
      out.push(l);
    }
    return sortResults(out);
  }
  // Nearest n live listings to a point (client-side only; nothing is sent anywhere).
  function nearest(rows, user, n) {
    var out = rows.map(function (l) { l._d = miles(user, { lat: l.la, lng: l.lo }); return l; });
    out.sort(function (a, b) { return a._d - b._d; });
    return out.slice(0, n || 10);
  }
  function miles(a, b) {
    var R = 3958.8, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function fmt(n) { return n.toLocaleString("en-GB"); }
  // Service-area coverage (v8). Mirrors effective_cov() in build/listing_rules.py: a Free listing covers its home area, the first
  // FREE_COV_MAX towns in cov; a Promoted listing covers every town in cov, or the whole county when cov is ["all"]. [] = no cov.
  var FREE_COV_MAX = 3;
  function coversAll(l) { return !!(l.cov && l.cov.indexOf("all") > -1 && l.tier === "premium"); }
  function cov(l, towns) {
    if (!l.cov || !l.cov.length) return [];
    if (l.cov.indexOf("all") > -1) return l.tier === "premium" ? Object.keys(towns || {}) : [l.t];
    var ids = towns ? l.cov.filter(function (t) { return !!towns[t]; }) : l.cov.slice();
    return l.tier === "premium" ? ids : ids.slice(0, FREE_COV_MAX);
  }
  // Address line: service-area businesses show the towns they cover; map-derived locations are "near ...". Mirrors addr_text() in build/make_site.py.
  function addr(l, towns) {
    if (l.cov && l.cov.length) {
      if (coversAll(l)) return "Covers all of Lincolnshire";
      var names = cov(l, towns).map(function (t) { return towns && towns[t] ? towns[t].name : t; });
      if (!names.length) names = [towns && towns[l.t] ? towns[l.t].name : l.t];
      return "Covers " + (names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]);
    }
    if (l.ax) return "Near " + l.a + " (map location)";
    return l.a + (l.p ? ", " + l.p : "");
  }
  function claimUrl(l) { return BASE + "claim.html?id=" + encodeURIComponent(l.id) + "&name=" + encodeURIComponent(l.n) + "&town=" + encodeURIComponent(l.t); }
  // Owner-added listing (the business asked to be listed through the sign-up / suggest form): never shown as "unclaimed".
  function isOwner(l) { return l.s === "owner" && l.tier !== "premium"; }
  function sourceNote(l) {
    if (l.s === "fsa") return "Listed from Food Standards Agency public data (OGL v3.0).";
    if (l.s === "osm") return "Listed from OpenStreetMap data (© OpenStreetMap contributors, ODbL).";
    if (l.s === "aide") return "Listed by Aide, TAG Sleaford's directory, from public records.";
    if (l.s === "owner") return "Added at the business's request; details as supplied by the business.";
    return "Details supplied by the business.";
  }
  // v9 owner text (mirrors listing_rules.owner_text in the build): d = one line (<= 100), svc = up to 3 bullets (Promoted 8) of <= 60
  // characters, desc = short description (<= 400; Promoted <= 1,200 on the profile page). d falls back to the first sentence of desc.
  // The build already refuses records over the limits; the client only tidies and derives.
  var D_MAX = 100, SVC_MAX = 3, SVC_MAX_PREMIUM = 8;
  var LEAD_NOTE = "Your request goes to LincsDirectory, which passes it to this business.";
  function firstSentence(s, n) {
    s = (s || "").replace(/\s+/g, " ").trim(); if (!s) return "";
    var m = s.match(/^(.+?[.!?])(\s|$)/); s = m ? m[1] : s;
    if (s.length <= n) return s;
    var cut = s.slice(0, n - 1); return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]+$/, "") + "…";
  }
  function ownerText(l) {
    var prem = l.tier === "premium", desc = (l.desc || "").replace(/\s+/g, " ").trim();
    var svc = (l.svc || []).map(function (s) { return (s || "").replace(/\s+/g, " ").trim(); }).filter(Boolean).slice(0, prem ? SVC_MAX_PREMIUM : SVC_MAX);
    var d = (l.d || "").replace(/\s+/g, " ").trim() || firstSentence(desc, D_MAX);
    return { d: d, svc: svc, desc: desc };
  }
  // "More about this business": a plain <details> (keyboard accessible, no script needed) with the service bullets and, unless
  // showDesc is false (Promoted cards already show the full description), the description. Null when there is nothing to show.
  var TICK = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function moreEl(l, showDesc) {
    var o = ownerText(l), desc = showDesc === false ? "" : o.desc;
    if (!o.svc.length && !desc) return null;
    var body = el("div", { class: "more-body" });
    if (o.svc.length) { var ul = el("ul", { class: "svc" }); o.svc.forEach(function (s) { var li = el("li", { html: TICK }); li.appendChild(el("span", { text: s })); ul.appendChild(li); }); body.appendChild(ul); }
    if (desc) body.appendChild(el("p", { class: "long", text: desc }));
    return el("details", { class: "more" }, [el("summary", { text: "More about this business" }), body]);
  }
  return { TODAY: TODAY, BASE: BASE, index: index, listings: listings, nearest: nearest, isLive: isLive, liveCounts: liveCounts, parseQuery: parseQuery, search: search, sortResults: sortResults, miles: miles, el: el, fmt: fmt, claimUrl: claimUrl, sourceNote: sourceNote, SYN: SYN, addr: addr,
    ratings: ratings, stars: stars, rateUrl: rateUrl, profileUrl: profileUrl, slug: slug, cov: cov, coversAll: coversAll, isOwner: isOwner, FREE_COV_MAX: FREE_COV_MAX, ownerText: ownerText, moreEl: moreEl, LEAD_NOTE: LEAD_NOTE };
})();
