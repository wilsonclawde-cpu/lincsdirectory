/* LincsDirectory shared behaviour: menu, year, Aide report link helpers. No cookies, no analytics. */
(function () {
  var btn = document.querySelector(".menu-btn"), nav = document.querySelector("nav.main");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    });
  }
  var y = document.getElementById("yr"); if (y) y.textContent = new Date().getFullYear();
})();
