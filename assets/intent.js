/* LincsDirectory intent matcher: everyday phrases ("wash my car", "boiler broke", "no hot water") -> jobs (build/jobs.py via data/jobs.json).
   Pure client-side, no network beyond loading data/jobs.json once. Tolerant of typos (bigram similarity), word order and filler words.
   Usage: LDI.load().then(function (jobs) { var hits = LDI.match("plumb my washing machine", jobs); });  -> [{job, score}] best first.
   Also works in Node for the unit test (build/test_intent.js). */
(function (root) {
  var STOP = {};
  ("i a an the my me our we us some need want looking for find get help with to do done someone somebody who can could please near in at around local lincolnshire lincs now today urgent urgently asap quick quickly cheap good best recommend recommended is there any of and or on it its it's this that their there im i'm ive i've have has got be been would like").split(" ").forEach(function (w) { STOP[w] = 1; });
  // light stemming + spelling normalisation for common variants
  var MAP = { colour: "color", colouring: "color", coloured: "color", tyre: "tire", tyres: "tire", tires: "tire", valeting: "valet", valeted: "valet", valeter: "valet", mowing: "mow", mowed: "mow", mower: "mow", trimming: "trim", trimmed: "trim", cutting: "cut", cuts: "cut", cleaning: "clean", cleaner: "clean", cleaners: "clean", cleaned: "clean", repairs: "repair", repairing: "repair", repaired: "repair", fixing: "fix", fixed: "fix", fixes: "fix", broke: "broken", breaks: "broken", leaking: "leak", leaks: "leak", leaked: "leak", blocked: "block", blockage: "block", unblock: "block", unblocking: "block", plumbing: "plumb", plumber: "plumb", plumbers: "plumb", electrics: "electric", electrical: "electric", electrician: "electric", electricians: "electric", boilers: "boiler", installing: "install", installation: "install", installed: "install", fitting: "fit", fitted: "fit", fitter: "fit", fitters: "fit", lessons: "lesson", tuition: "tutor", tutoring: "tutor", tutors: "tutor", grooming: "groom", groomer: "groom", groomers: "groom", walking: "walk", walker: "walk", walkers: "walk", removals: "removal", moving: "move", movers: "move", storage: "store", photos: "photo", photography: "photo", photographer: "photo", photographers: "photo", pictures: "photo", decorating: "decorate", decorator: "decorate", decorators: "decorate", painting: "paint", painter: "paint", painters: "paint", plastering: "plaster", plasterer: "plaster", tiling: "tile", tiler: "tile", tiles: "tile", roofing: "roof", roofer: "roof", roofers: "roof", gutters: "gutter", guttering: "gutter", fences: "fence", fencing: "fence", hedges: "hedge", trees: "tree", lawns: "lawn", gardens: "garden", gardener: "garden", gardening: "garden", gardeners: "garden", windows: "window", doors: "door", locks: "lock", locked: "lock", locksmith: "lock", locksmiths: "lock", keys: "key", drains: "drain", drainage: "drain", pipes: "pipe", taps: "tap", toilets: "toilet", loo: "toilet", showers: "shower", radiators: "radiator", sockets: "socket", plugs: "socket", lights: "light", lighting: "light", cars: "car", vehicle: "car", motor: "car", van: "car", brakes: "brake", batteries: "battery", punctures: "puncture", flat: "flat", washing: "wash", washer: "wash", washed: "wash", dishwashers: "dishwasher", fridges: "fridge", freezers: "freezer", ovens: "oven", cookers: "cooker", hobs: "hob", laptops: "laptop", computers: "computer", pc: "computer", phones: "phone", mobile: "phone", iphone: "phone", samsung: "phone", dogs: "dog", puppy: "dog", puppies: "dog", cats: "cat", kitten: "cat", pets: "pet", kids: "kid", children: "kid", childrens: "kid", child: "kid", birthday: "party", parties: "party", hairdressers: "hairdresser", hairdressing: "hairdresser", barbers: "barber", haircuts: "haircut", nail: "nails", manicures: "manicure", pedicures: "pedicure", accountants: "accountant", accounting: "accountant", accounts: "accountant", bookkeeping: "bookkeeper", taxes: "tax", mot: "mot", mots: "mot", servicing: "service", services: "service", serviced: "service", heater: "heating", heat: "heating", warm: "heating", turning: "turn", turns: "turn", starting: "start", starts: "start", working: "work", works: "work", worked: "work", spinning: "spin", spins: "spin", draining: "drain", drained: "drain", heating: "heating", overflowing: "overflow", overflows: "overflow", smells: "smell", smelly: "smell", smelling: "smell", noisy: "noise", noises: "noise", tripping: "trip", trips: "trip", tripped: "trip" };
  function norm(s) {
    return (s || "").toLowerCase().replace(/&/g, " and ").replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function tokens(s) {
    return norm(s).split(" ").filter(function (w) { return w && !STOP[w]; }).map(function (w) { return MAP[w] || w; });
  }
  function bigrams(w) { var out = {}; w = " " + w + " "; for (var i = 0; i < w.length - 1; i++) out[w.substr(i, 2)] = 1; return out; }
  function sim(a, b) {   // Dice coefficient on bigrams: 1 = identical, tolerant of a typo or two
    if (a === b) return 1;
    if (a.length < 4 || b.length < 4) return 0;
    var A = bigrams(a), B = bigrams(b), inter = 0, na = 0, nb = 0, k;
    for (k in A) { na++; if (B[k]) inter++; }
    for (k in B) nb++;
    return 2 * inter / (na + nb);
  }
  function wordScore(q, w) {
    if (q === w) return 1;
    if (w.indexOf(q) === 0 && q.length >= 4) return 0.9;       // prefix: "dish" ~ "dishwasher"
    if (q.indexOf(w) === 0 && w.length >= 4) return 0.85;
    var s = sim(q, w); return s >= 0.72 ? s * 0.9 : 0;          // typo tolerance
  }
  // Pre-tokenise each job once: phrasings + title + slug words.
  var IDF = null;
  function prepare(jobs) {
    if (jobs._ready) return jobs;
    var df = {};
    jobs.forEach(function (j) {
      j._p = j.say.map(function (p) { return tokens(p); });
      j._p.push(tokens(j.t)); j._p.push(j.s.split("-").map(function (w) { return MAP[w] || w; }).filter(function (w) { return !STOP[w]; }));
      var all = {}; j._p.forEach(function (ts) { ts.forEach(function (w) { all[w] = 1; }); }); j._w = Object.keys(all);
      j._w.forEach(function (w) { df[w] = (df[w] || 0) + 1; });
    });
    IDF = {}; var N = jobs.length;
    Object.keys(df).forEach(function (w) { IDF[w] = 1 + Math.log(N / df[w]); });   // rare words ("laptop", "boiler") count for more than shared ones ("new", "repair")
    jobs._ready = true;
    return jobs;
  }
  function wt(w) { return IDF && IDF[w] ? IDF[w] : 1; }
  // Score = best phrase match (coverage of the phrase by the query and of the query by the phrase), 0..1
  function scoreJob(qt, j) {
    var best = 0;
    for (var p = 0; p < j._p.length; p++) {
      var pt = j._p[p]; if (!pt.length) continue;
      var hitP = 0, totP = 0, usedQ = {}, hitQ = 0, totQ = 0;
      for (var i = 0; i < pt.length; i++) {
        var bw = 0, bi = -1; totP += wt(pt[i]);
        for (var k = 0; k < qt.length; k++) { if (usedQ[k]) continue; var s = wordScore(qt[k], pt[i]); if (s > bw) { bw = s; bi = k; } }
        if (bw) { hitP += bw * wt(pt[i]); usedQ[bi] = bw; }
      }
      if (!hitP) continue;
      for (var q2 = 0; q2 < qt.length; q2++) { totQ += wt(qt[q2]); if (usedQ[q2]) hitQ += usedQ[q2] * wt(qt[q2]); }
      var covP = hitP / totP;                      // how much of the phrase the query covers (weighted by how distinctive each word is)
      var covQ = hitQ / totQ;                      // how much of the query is explained by the phrase
      var s2 = (covP * 0.65 + covQ * 0.35) * (1 - 0.25 * Math.max(0, (qt.length - pt.length) / qt.length));   // a short phrase shouldn't win on one word of a long query
      if (s2 > best) best = s2;
    }
    // bonus: query words that appear anywhere in the job's vocabulary (word-order independent)
    var vocab = 0;
    for (var q = 0; q < qt.length; q++) { for (var v = 0; v < j._w.length; v++) { if (wordScore(qt[q], j._w[v]) >= 0.85) { vocab++; break; } } }
    return Math.min(1, best + (qt.length ? vocab / qt.length * 0.15 : 0));
  }
  function match(query, jobs, limit) {
    var qt = tokens(query); if (!qt.length) return [];
    prepare(jobs);
    var out = [];
    jobs.forEach(function (j) { var s = scoreJob(qt, j); if (s >= 0.42) out.push({ job: j, score: Math.round(s * 100) / 100 }); });
    out.sort(function (a, b) { return b.score - a.score || a.job.t.localeCompare(b.job.t); });
    return out.slice(0, limit || 6);
  }
  var cache = null;
  function load() {
    if (cache) return cache;
    var base = (typeof document !== "undefined" && document.querySelector('meta[name="ld-base"]') || {}).content || "";
    cache = fetch(base + "data/jobs.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(prepare);
    return cache;
  }
  var LDI = { tokens: tokens, match: match, load: load, prepare: prepare, norm: norm };
  if (typeof module !== "undefined" && module.exports) module.exports = LDI; else root.LDI = LDI;
})(typeof window !== "undefined" ? window : this);
