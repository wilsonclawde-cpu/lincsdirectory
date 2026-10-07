/* "Get local help" requests -> Web3Forms. Subject: "LincsDirectory job request: <job> – <town> [<urgency>]". Nothing is shared automatically:
   a person reads each request and passes it to listed businesses that cover the area, only with the consent given on the form.
   v9 lead routing: a "Request a quote" link from a listing adds ?lid=<listing id>&bn=<business name>. The request still comes to
   LincsDirectory (hello@), with hidden listing_id / listing_name fields, the subject "Lead from LincsDirectory: <business> – <job>, <town>
   [<urgency>]" and a consent sentence that names the business; we pass it on to that business (and, if it cannot help, to others). */
(function () {
  var W3F = "https://api.web3forms.com/submit", KEY = "8d954ebb-0c01-4ef1-8ced-41034861f95a", PHONE = "01522 424963";
  var params = new URLSearchParams(location.search);
  var LID = (params.get("lid") || "").trim().slice(0, 80), BN = (params.get("bn") || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!LID) BN = "";
  var CONSENT_GENERIC = "I agree LincsDirectory can pass my request to local businesses that may contact me about it. I've read the privacy notice.";
  var CONSENT_NAMED = BN ? "I agree LincsDirectory can pass my request to " + BN + " (and, if it cannot help, to other local businesses that may contact me about it). I've read the privacy notice." : "";
  function townName(sel) { var o = sel.options[sel.selectedIndex]; return o && o.value ? o.textContent : ""; }
  function clipSubject(bn, job, town, when) {   // <= 150 characters: trim the business name first, then the job
    var tail = ", " + town + " [" + when + "]", head = "Lead from LincsDirectory: ";
    var room = 150 - head.length - tail.length - 3, j = job, b = bn;
    if (b.length + j.length > room) { b = b.slice(0, Math.max(20, room - Math.min(j.length, 40))).replace(/\s+\S*$/, "") + "…"; }
    if (b.length + j.length > room) { j = j.slice(0, Math.max(10, room - b.length)).replace(/\s+\S*$/, "") + "…"; }
    return head + b + " – " + j + tail;
  }
  Array.prototype.forEach.call(document.querySelectorAll("form.helpform"), function (form) {
    var btn = form.querySelector("button[type=submit]"), msg = form.querySelector(".msg"), label = btn.textContent;
    function show(kind, text) { msg.className = "msg " + kind; msg.textContent = text; if (kind === "ok") msg.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    // deep links: help.html?job=<slug>&town=<town>&need=<text>&when=urgent (&lid=<id>&bn=<name> from "Request a quote")
    if (params.get("town") && form.town) form.town.value = params.get("town");
    if (params.get("need") && form.need && !form.need.value) form.need.value = params.get("need");
    if (params.get("when") === "urgent" && form.when) form.when.value = "Urgent / today";
    if (params.get("job") && form.job_slug && !form.job_slug.value) {
      form.job_slug.value = params.get("job");
      if (window.LDI && !form.need.value) LDI.load().then(function (jobs) { var j = jobs.filter(function (x) { return x.s === params.get("job"); })[0]; if (j && !form.need.value) form.need.value = j.t; if (j) form.job_title.value = j.t; var h = document.getElementById("helpJobTitle"); if (h && j && !BN) h.textContent = j.t; }).catch(function () {});
    }
    if (LID) {
      var hid = function (n, v) { var i = document.createElement("input"); i.type = "hidden"; i.name = n; i.value = v; form.appendChild(i); return i; };
      hid("listing_id", LID); hid("listing_name", BN);
      var cs = form.querySelector("label.check input[name=consent] + span");
      if (cs && BN) { cs.textContent = ""; cs.appendChild(document.createTextNode("I agree LincsDirectory can pass my request to ")); cs.appendChild(Object.assign(document.createElement("strong"), { textContent: BN })); cs.appendChild(document.createTextNode(" (and, if it cannot help, to other local businesses that may contact me about it). I've read the ")); var a = document.createElement("a"); a.href = "privacy.html#requests"; a.textContent = "privacy notice"; cs.appendChild(a); cs.appendChild(document.createTextNode(".")); }
      var h1 = document.getElementById("helpJobTitle"); if (h1 && BN) h1.textContent = "we'll pass it to " + BN + ".";
      var biz = document.getElementById("helpBiz"); if (biz && BN) { biz.hidden = false; biz.querySelector("strong").textContent = BN; }
      form.classList.add("leadform");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var need = form.need.value.trim(), town = form.town.value, name = form.name.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim();
      if (!need || !town || !name) { show("err", "Please say what you need doing, choose your town and give your name."); return; }
      if (!phone && !email) { show("err", "Please give a phone number or an email address so a business can reach you."); return; }
      if (email && !form.email.validity.valid) { show("err", "That email address doesn't look right."); return; }
      if (!form.consent.checked) { show("err", BN ? "Please tick the box so we can pass your request to " + BN + "." : "Please tick the box so we can pass your request to local businesses."); return; }
      var when = form.when.value || "This week", jobTitle = form.job_title.value || need.slice(0, 60), tn = townName(form.town);
      var payload = { access_key: KEY, subject: BN ? clipSubject(BN, jobTitle, tn, when) : "LincsDirectory job request: " + jobTitle + " – " + tn + " [" + when + "]", from_name: name,
        job: form.job_slug.value, job_title: form.job_title.value, need: need, town: tn, town_id: town, postcode: form.postcode.value.trim().toUpperCase(), when: when, name: name, phone: phone, email: email,
        consent: BN ? CONSENT_NAMED : CONSENT_GENERIC, botcheck: form.botcheck.checked ? true : "", page: location.pathname + location.search };
      if (LID) { payload.listing_id = LID; payload.listing_name = BN; payload.lead = "Lead from LincsDirectory"; }
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(W3F, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) { if (res && res.success) { form.reset(); show("ok", BN ? "Thanks — your request has reached LincsDirectory. We'll pass it to " + BN + ", who may be in touch by phone or email." : "Thanks — we'll pass your request to local businesses that cover your area. They may be in touch by phone or email."); } else show("err", "That didn't send. Please try again or phone " + PHONE + "."); })
        .catch(function () { show("err", "That didn't send. Please try again or phone " + PHONE + "."); })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  });
})();
