/* LincsDirectory data layer + search.
   Data lives in data/index.json (counts, towns, categories, featured) and data/listings-<district>.json.
   Every listing has f = live_from (ISO date); the client only shows listings with f <= today, so the
   drip schedule needs no daily redeploy. Fields: id,n,a,t,p,la,lo,c,s,f,tier (+ph,w,desc,img,hrs on premium). */
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
        return getJSON(BASE + "data/" + f.file).then(function (rows) { rows.forEach(function (r) { r.d = f.district; }); return rows; });
      })).then(function (parts) {
        var all = [];
        parts.forEach(function (p) { p.forEach(function (r) { if (isLive(r) && (!town || r.t === town)) all.push(r); }); });
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
    garage: { c: ["motor"] }, mechanic: { c: ["motor"] }, mot: { c: ["motor"] }, tyres: { c: ["motor"] }, car: { c: ["motor"] }, petrol: { c: ["motor"] }, fuel: { c: ["motor"] }, diesel: { c: ["motor"] }, carwash: { c: ["motor"] },
    plumber: { c: ["trade", "home"] }, plumbing: { c: ["trade", "home"] }, electrician: { c: ["trade", "home"] }, builder: { c: ["trade", "home"] }, roofer: { c: ["trade", "home"] }, joiner: { c: ["trade"] }, carpenter: { c: ["trade"] }, decorator: { c: ["trade"] }, heating: { c: ["trade", "home"] }, boiler: { c: ["trade", "home"] },
    pharmacy: { c: ["health"] }, chemist: { c: ["health"] }, prescription: { c: ["health"] }, dentist: { c: ["health"] }, optician: { c: ["health"] }, glasses: { c: ["health"] }, doctor: { c: ["health"] }, physio: { c: ["health"] }, health: { c: ["health"] },
    vet: { c: ["pets"] }, vets: { c: ["pets"] }, pet: { c: ["pets"] }, dog: { c: ["pets"] }, cat: { c: ["pets"] },
    estate: { c: ["estate"] }, letting: { c: ["estate"] }, lettings: { c: ["estate"] }, house: { c: ["estate"] }, property: { c: ["estate"] }, mortgage: { c: ["prof", "estate"] },
    solicitor: { c: ["prof"] }, lawyer: { c: ["prof"] }, accountant: { c: ["prof"] }, accounts: { c: ["prof"] }, bank: { c: ["prof"] }, insurance: { c: ["prof"] }, financial: { c: ["prof"] }, recruitment: { c: ["prof"] },
    gym: { c: ["leisure"] }, fitness: { c: ["leisure"] }, swimming: { c: ["leisure"] }, pool: { c: ["leisure"] }, golf: { c: ["leisure"] }, bowling: { c: ["leisure"] }, cinema: { c: ["leisure"] }, leisure: { c: ["leisure"] }, caravan: { c: ["leisure", "hotel"] }, holiday: { c: ["leisure", "hotel"] }, camping: { c: ["leisure"] },
    hall: { c: ["venue"] }, venue: { c: ["venue", "leisure"] }, wedding: { c: ["venue", "hotel"] }, party: { c: ["venue", "cater"] }, hire: { c: ["venue", "office"] },
    catering: { c: ["cater"] }, caterer: { c: ["cater"] }, buffet: { c: ["cater"] },
    supermarket: { c: ["super"] }, grocery: { c: ["super", "food"] }, groceries: { c: ["super", "food"] }, convenience: { c: ["super"] }, newsagent: { c: ["super"] }, milk: { c: ["super"] }, "co-op": { c: ["super"] }, coop: { c: ["super"] }, tesco: { c: ["super"] }, spar: { c: ["super"] },
    butcher: { c: ["food"] }, butchers: { c: ["food"] }, bakery: { c: ["food", "cafe"] }, baker: { c: ["food", "cafe"] }, bread: { c: ["food", "cafe"] }, deli: { c: ["food"] }, farmshop: { c: ["food"] }, greengrocer: { c: ["food"] }, wine: { c: ["food", "pub"] }, offlicence: { c: ["food", "super"] }, sweets: { c: ["food"] },
    florist: { c: ["home", "shop"] }, flowers: { c: ["home", "shop"] }, garden: { c: ["home"] }, diy: { c: ["home"] }, hardware: { c: ["home"] }, furniture: { c: ["home"] }, carpet: { c: ["home"] }, kitchen: { c: ["home", "rest"] }, locksmith: { c: ["home", "serv"] },
    shop: { c: ["shop", "super", "food", "home"] }, shopping: { c: ["shop"] }, gift: { c: ["shop"] }, gifts: { c: ["shop"] }, clothes: { c: ["shop"] }, clothing: { c: ["shop"] }, shoes: { c: ["shop"] }, jewellery: { c: ["shop"] }, jeweller: { c: ["shop"] }, phone: { c: ["shop"] }, charity: { c: ["shop"] }, books: { c: ["shop"] }, toys: { c: ["shop"] },
    office: { c: ["office"] }, offices: { c: ["office"] }, desk: { c: ["office"] }, coworking: { c: ["office"] }, workspace: { c: ["office"] }, meeting: { c: ["office", "venue"] }, boardroom: { c: ["office"] }, storage: { c: ["office", "serv"] }, printing: { c: ["office", "serv"] },
    laundry: { c: ["serv"] }, laundrette: { c: ["serv"] }, drycleaning: { c: ["serv"] }, cleaner: { c: ["serv"] }, funeral: { c: ["serv"] }, travel: { c: ["serv"] }, driving: { c: ["serv"] }, postoffice: { c: ["serv", "super"] }, post: { c: ["serv", "super"] }, taxi: { c: ["serv"] }, repair: { c: ["serv", "motor", "home"] }
  };
  var STOP = {};
  ("i want a an the some need find me looking for near in to get somewhere somebody someone please good best cheap my can you recommend is there any with and or of at nearby around open now local lincolnshire lincs").split(" ").forEach(function (w) { STOP[w] = 1; });
  var PHRASES = [["fish and chips", "chippy"], ["fish & chips", "chippy"], ["fish chips", "chippy"], ["bed and breakfast", "bb"], ["take away", "takeaway"], ["farm shop", "farmshop"], ["off licence", "offlicence"], ["post office", "postoffice"], ["dry cleaning", "drycleaning"], ["dry cleaner", "drycleaning"], ["car wash", "carwash"], ["estate agent", "estate"], ["estate agents", "estate"], ["meeting room", "meeting"], ["tea room", "tearoom"], ["guest house", "guesthouse"], ["coffee shop", "coffee"], ["hair dresser", "hairdresser"], ["nail bar", "nails"], ["hot food", "takeaway"]];

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
        if (s.k) {   // cuisine-style words: the name (or Featured description) must contain a keyword
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
      if (pa !== pb) return pb - pa;                   // Featured first
      if ((b._s || 0) !== (a._s || 0)) return (b._s || 0) - (a._s || 0);
      if (a._d != null && b._d != null && a._d !== b._d) return a._d - b._d;
      return a.n.localeCompare(b.n, "en-GB");
    });
    return rows;
  }
  function search(rows, opts) {
    var tokens = opts.tokens || [], cat = opts.cat || "", catNames = opts.catNames || {};
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var l = rows[i];
      if (cat && l.c !== cat) continue;
      var s = score(l, tokens, catNames);
      if (!s) continue;
      l._s = s;
      if (opts.user) l._d = miles(opts.user, { lat: l.la, lng: l.lo }); else l._d = null;
      out.push(l);
    }
    return sortResults(out);
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
  function claimUrl(l) { return BASE + "claim.html?id=" + encodeURIComponent(l.id) + "&name=" + encodeURIComponent(l.n) + "&town=" + encodeURIComponent(l.t); }
  function sourceNote(l) {
    if (l.s === "fsa") return "Listed from Food Standards Agency public data (OGL v3.0).";
    if (l.s === "osm") return "Listed from OpenStreetMap data (© OpenStreetMap contributors, ODbL).";
    if (l.s === "aide") return "Listed by Aide, TAG Sleaford's directory, from public records.";
    return "Details supplied by the business.";
  }
  return { TODAY: TODAY, BASE: BASE, index: index, listings: listings, liveCounts: liveCounts, parseQuery: parseQuery, search: search, sortResults: sortResults, miles: miles, el: el, fmt: fmt, claimUrl: claimUrl, sourceNote: sourceNote, SYN: SYN };
})();
