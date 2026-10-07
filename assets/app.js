/* LincsDirectory shared behaviour: menu, sticky header shadow, reveal-on-scroll, year. No cookies, no analytics. */
(function () {
  document.documentElement.classList.add("js");
  var btn = document.querySelector(".menu-btn"), nav = document.querySelector("nav.main"), hdr = document.querySelector("header.site");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) btn.click(); });
  }
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  var y = document.getElementById("yr"); if (y) y.textContent = new Date().getFullYear();
  /* v5: placeholders that would be cut off on a narrow screen carry a shorter version in data-ph-sm; swap at <= 600px (and back). */
  var phs = document.querySelectorAll("[data-ph-sm]");
  if (phs.length) {
    var mq = window.matchMedia("(max-width: 600px)");
    var swap = function () { phs.forEach(function (el) { if (!el.getAttribute("data-ph-lg")) el.setAttribute("data-ph-lg", el.getAttribute("placeholder") || ""); el.setAttribute("placeholder", mq.matches ? el.getAttribute("data-ph-sm") : el.getAttribute("data-ph-lg")); }); };
    swap(); if (mq.addEventListener) mq.addEventListener("change", swap); else if (mq.addListener) mq.addListener(swap);
  }
  /* v8: live character counter for the "One line about your business" field (and any other control with a .counter[data-for] beside it) */
  document.querySelectorAll(".counter[data-for]").forEach(function (c) {
    var form = c.closest("form"), f = form && form.elements[c.getAttribute("data-for")]; if (!f || !f.getAttribute) return;
    var max = parseInt(f.getAttribute("maxlength"), 10) || 0;
    var upd = function () { var n = f.value.length; c.textContent = n + " / " + max; c.classList.toggle("full", max > 0 && n >= max); };
    f.addEventListener("input", upd); form.addEventListener("reset", function () { setTimeout(upd, 0); }); upd();
  });
  var items = document.querySelectorAll(".reveal");
  if (items.length && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) { io.observe(n); });
  } else { items.forEach(function (n) { n.classList.add("in"); }); }
})();
