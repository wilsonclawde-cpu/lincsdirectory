/* Landing pages: the static list reflects the build date; if today is later, refresh the list from the data files so the drip schedule shows. */
(function () {
  var root = document.getElementById("llist"); if (!root || !window.LD) return;
  var built = root.getAttribute("data-built"), town = root.getAttribute("data-town") || null, cat = root.getAttribute("data-cat") || null;
  if (built >= LD.TODAY) return;
  Promise.all([LD.index(), LD.ratings()]).then(function (res) {
    var idx = res[0], R = res[1] || {};
    return LD.listings(town).then(function (rows) {
      var cats = root.getAttribute("data-cats"); cats = cats ? cats.split(",") : null;   // job pages: several categories
      rows = rows.filter(function (r) { return cats ? cats.indexOf(r.c) > -1 : (!cat || r.c === cat); });
      rows.sort(function (a, b) { var pa = a.tier === "premium" ? 1 : 0, pb = b.tier === "premium" ? 1 : 0; return pb - pa || a.n.localeCompare(b.n, "en-GB"); });
      if (!rows.length) return;
      root.textContent = "";
      rows.forEach(function (l, i) {
        var prem = l.tier === "premium", owner = LD.isOwner(l);
        var href = prem ? LD.profileUrl(l) : "search.html?id=" + encodeURIComponent(l.id) + "&town=" + l.t;
        var row = LD.el("div", { class: "lrow" + (prem ? " prem" : "") + (owner ? " owner" : "") });
        row.appendChild(LD.el("span", { class: "i", text: String(i + 1) }));
        var o = LD.ownerText(l);   // v9: one line + "More about this business" (bullets + description) on owner-added rows; v10: Promoted rows show the one line + first bullets + "See full profile"
        var mid = LD.el("div", {}, [(prem && l.logo ? LD.el("img", { class: "rlogo", src: l.logo, alt: "", loading: "lazy", width: "40", height: "40" }) : null), LD.el("a", { class: "main", href: href, text: l.n }), LD.el("span", { class: "a", text: (town ? "" : (idx.towns[l.t] ? idx.towns[l.t].name + " · " : "")) + (cat ? "" : (idx.cats[l.c] || "") + " · ") + LD.addr(l, idx.towns) }), (o.d ? LD.el("span", { class: "d", text: o.d }) : null), LD.stars(l, R), (prem ? LD.cardSvc(l) : LD.moreEl(l, true))]);
        if (prem) mid.insertBefore(LD.el("span", { class: "badge premium", text: "Premium" }), mid.firstChild);
        else if (owner) mid.insertBefore(LD.el("span", { class: "badge owner", text: "Added by the business" }), mid.firstChild);
        var go = LD.el("span", { class: "go" });
        if (l.ph) go.appendChild(LD.el("a", { class: "ph", href: "tel:+44" + l.ph.replace(/\s+/g, "").replace(/^0/, ""), text: l.ph }));
        if (prem) go.appendChild(LD.el("a", { class: "golink", href: href, text: "See full profile →" })); else go.appendChild(document.createTextNode("Map ›"));
        row.appendChild(mid); row.appendChild(go); root.appendChild(row);
      });
      var n = document.getElementById("liveN"); if (n) n.textContent = LD.fmt(rows.length);
      var f = document.getElementById("fresh"); if (f) f.textContent = "List refreshed today from the live data.";
    });
  }).catch(function () {});
})();
