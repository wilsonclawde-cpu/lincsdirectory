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
  var items = document.querySelectorAll(".reveal");
  if (items.length && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) { io.observe(n); });
  } else { items.forEach(function (n) { n.classList.add("in"); }); }
})();
