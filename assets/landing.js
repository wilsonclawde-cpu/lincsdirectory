/* Landing pages: the static list reflects the build date; if today is later, refresh the list from the data files so the drip schedule shows. */
(function () {
  var root = document.getElementById("llist"); if (!root || !window.LD) return;
  var built = root.getAttribute("data-built"), town = root.getAttribute("data-town") || null, cat = root.getAttribute("data-cat") || null;
  if (built >= LD.TODAY) return;
  LD.index().then(function (idx) {
    return LD.listings(town).then(function (rows) {
      rows = rows.filter(function (r) { return !cat || r.c === cat; });
      rows.sort(function (a, b) { var pa = a.tier === "premium" ? 1 : 0, pb = b.tier === "premium" ? 1 : 0; return pb - pa || a.n.localeCompare(b.n, "en-GB"); });
      if (!rows.length) return;
      root.textContent = "";
      rows.forEach(function (l, i) {
        var prem = l.tier === "premium";
        var a = LD.el("a", { class: "lrow" + (prem ? " prem" : ""), href: "search.html?id=" + encodeURIComponent(l.id) + "&town=" + l.t });
        a.appendChild(LD.el("span", { class: "i", text: String(i + 1) }));
        var mid = LD.el("div", {}, [LD.el("strong", { text: l.n }), LD.el("span", { class: "a", text: (town ? "" : (idx.towns[l.t] ? idx.towns[l.t].name + " · " : "")) + (cat ? "" : (idx.cats[l.c] || "") + " · ") + l.a + (l.p ? ", " + l.p : "") })]);
        if (prem) mid.insertBefore(LD.el("span", { class: "badge featured", text: "Featured" }), mid.firstChild);
        a.appendChild(mid); a.appendChild(LD.el("span", { class: "go", text: "Map ›" })); root.appendChild(a);
      });
      var n = document.getElementById("liveN"); if (n) n.textContent = LD.fmt(rows.length);
      var f = document.getElementById("fresh"); if (f) f.textContent = "List refreshed today from the live data.";
    });
  }).catch(function () {});
})();
