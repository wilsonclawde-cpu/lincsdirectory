/* "Get local help" requests -> Web3Forms. Subject: "LincsDirectory job request: <job> – <town> [<urgency>]". Nothing is shared automatically:
   a person reads each request and passes it to listed businesses that cover the area, only with the consent given on the form. */
(function () {
  var W3F = "https://api.web3forms.com/submit", KEY = "4011b5b9-4b83-437a-a35d-baac02080912", PHONE = "01522 424963";
  var params = new URLSearchParams(location.search);
  function townName(sel) { var o = sel.options[sel.selectedIndex]; return o && o.value ? o.textContent : ""; }
  Array.prototype.forEach.call(document.querySelectorAll("form.helpform"), function (form) {
    var btn = form.querySelector("button[type=submit]"), msg = form.querySelector(".msg"), label = btn.textContent;
    function show(kind, text) { msg.className = "msg " + kind; msg.textContent = text; if (kind === "ok") msg.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    // deep links: help.html?job=<slug>&town=<town>&need=<text>&when=urgent
    if (params.get("town") && form.town) form.town.value = params.get("town");
    if (params.get("need") && form.need && !form.need.value) form.need.value = params.get("need");
    if (params.get("when") === "urgent" && form.when) form.when.value = "Urgent / today";
    if (params.get("job") && form.job_slug && !form.job_slug.value) {
      form.job_slug.value = params.get("job");
      if (window.LDI && !form.need.value) LDI.load().then(function (jobs) { var j = jobs.filter(function (x) { return x.s === params.get("job"); })[0]; if (j && !form.need.value) form.need.value = j.t; if (j) form.job_title.value = j.t; var h = document.getElementById("helpJobTitle"); if (h && j) h.textContent = j.t; }).catch(function () {});
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var need = form.need.value.trim(), town = form.town.value, name = form.name.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim();
      if (!need || !town || !name) { show("err", "Please say what you need doing, choose your town and give your name."); return; }
      if (!phone && !email) { show("err", "Please give a phone number or an email address so a business can reach you."); return; }
      if (email && !form.email.validity.valid) { show("err", "That email address doesn't look right."); return; }
      if (!form.consent.checked) { show("err", "Please tick the box so we can pass your request to local businesses."); return; }
      var when = form.when.value || "This week", jobTitle = form.job_title.value || need.slice(0, 60);
      var payload = { access_key: KEY, subject: "LincsDirectory job request: " + jobTitle + " – " + townName(form.town) + " [" + when + "]", from_name: name,
        job: form.job_slug.value, job_title: form.job_title.value, need: need, town: townName(form.town), town_id: town, postcode: form.postcode.value.trim().toUpperCase(), when: when, name: name, phone: phone, email: email,
        consent: "I agree LincsDirectory can pass my request to local businesses that may contact me about it. I've read the privacy notice.", botcheck: form.botcheck.checked ? true : "", page: location.pathname + location.search };
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(W3F, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) { if (res && res.success) { form.reset(); show("ok", "Thanks — we'll pass your request to local businesses that cover your area. They may be in touch by phone or email."); } else show("err", "That didn't send. Please try again or phone " + PHONE + "."); })
        .catch(function () { show("err", "That didn't send. Please try again or phone " + PHONE + "."); })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  });
})();
