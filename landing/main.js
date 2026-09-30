(function () {
  var cfg = window.ELEVR_CONFIG || {};

  function waLink(text) {
    return "https://wa.me/" + (cfg.whatsappNumber || "") + "?text=" + encodeURIComponent(text || cfg.whatsappMessage || "");
  }

  // Enlaces externos
  document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
    a.href = waLink();
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll("[data-instagram]").forEach(function (a) {
    a.href = "https://www.instagram.com/" + (cfg.instagram || "elevr_app") + "/";
  });
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Nav al hacer scroll
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Animaciones de entrada
  var targets = document.querySelectorAll(".reveal, .step, .io, .statement");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("is-in"); });
  }

  // Demo interactiva de readiness
  var STATES = {
    top: {
      score: 91,
      context: "Has dormido 8 h, te notas con energía y sin molestias.",
      session: "Series 6 × 800 m a ritmo 5K + fuerza de tren inferior",
      why: "Hoy estás para apretar: hacemos la sesión completa, tal y como estaba planificada."
    },
    normal: {
      score: 72,
      context: "Has dormido 7 h, algo de cansancio de piernas y estrés normal.",
      session: "Series 5 × 800 m con un poco más de recuperación",
      why: "Mantenemos el estímulo de calidad y bajamos un poco el volumen."
    },
    low: {
      score: 38,
      context: "Has dormido 5 h, mucho estrés y agujetas del fin de semana.",
      session: "Rodaje suave de 30 min + 10 min de movilidad",
      why: "Hoy sumas sin restar. Movemos las series a un día en que las puedas aprovechar."
    }
  };
  var demo = document.getElementById("demo");
  if (demo) {
    var ring = document.getElementById("demoRing");
    var score = document.getElementById("demoScore");
    var text = demo.querySelector(".demo__text");
    var C = 2 * Math.PI * 50;
    var current = "normal";
    var setState = function (key, animate) {
      var s = STATES[key];
      current = key;
      demo.querySelectorAll("[data-state]").forEach(function (b) {
        b.setAttribute("aria-selected", String(b.dataset.state === key));
      });
      ring.style.strokeDashoffset = String(C * (1 - s.score / 100));
      ring.style.stroke = s.score < 50 ? "#F3EFE8" : "";
      var apply = function () {
        score.textContent = s.score;
        document.getElementById("demoContext").textContent = s.context;
        document.getElementById("demoSession").textContent = s.session;
        document.getElementById("demoWhy").textContent = s.why;
        text.classList.remove("is-changing");
      };
      if (animate) {
        text.classList.add("is-changing");
        setTimeout(apply, 250);
      } else {
        apply();
      }
    };
    var tabs = Array.prototype.slice.call(demo.querySelectorAll("[data-state]"));
    tabs.forEach(function (b, i) {
      b.addEventListener("click", function () { if (b.dataset.state !== current) setState(b.dataset.state, true); });
      b.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        next.click();
      });
    });
    ring.style.strokeDashoffset = String(C);
    var started = false;
    var start = function () { if (!started) { started = true; setState("normal", false); } };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { start(); obs.disconnect(); }
      }, { threshold: 0.4 }).observe(demo);
    } else {
      start();
    }
  }

  // Formulario de lista de espera
  var form = document.getElementById("waitlistForm");
  if (form) {
    var msg = document.getElementById("formMsg");
    var setMsg = function (t, cls) { msg.textContent = t; msg.className = "form__msg " + (cls || ""); };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form._gotcha.value) return;

      var ok = true;
      ["nombre", "email", "objetivo"].forEach(function (n) {
        var el = form.elements[n];
        var valid = el.checkValidity() && el.value.trim() !== "";
        el.closest(".field").classList.toggle("is-invalid", !valid);
        if (!valid) ok = false;
      });
      var priv = form.elements.privacidad;
      priv.closest(".check").classList.toggle("is-invalid", !priv.checked);
      if (!priv.checked) ok = false;
      if (!ok) {
        setMsg("Revisa los campos marcados, por favor.", "err");
        return;
      }

      var data = {
        nombre: form.nombre.value.trim(),
        email: form.email.value.trim(),
        objetivo: form.objetivo.value,
        origen: "landing",
        fecha: new Date().toISOString()
      };

      if (!cfg.formEndpoint) {
        // Sin endpoint configurado: completamos la inscripción por WhatsApp.
        window.open(waLink(
          "¡Hola! Quiero unirme a la lista de espera de ELEVR.\n" +
          "Nombre: " + data.nombre + "\nEmail: " + data.email + "\nObjetivo: " + data.objetivo
        ), "_blank", "noopener");
        setMsg("Te hemos abierto WhatsApp para completar tu inscripción.", "ok");
        return;
      }

      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Enviando…";
      setMsg("");
      fetch(cfg.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        form.classList.add("is-done");
        setMsg("¡Ya estás dentro, " + data.nombre + "! Te avisaremos antes que a nadie.", "ok");
      }).catch(function () {
        setMsg("No hemos podido enviarlo. Inténtalo de nuevo o escríbenos por WhatsApp.", "err");
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = "Unirme a la lista";
      });
    });

    form.querySelectorAll("input, select").forEach(function (el) {
      el.addEventListener("input", function () {
        var box = el.closest(".field, .check");
        if (box) box.classList.remove("is-invalid");
      });
    });
  }

  // Cookies + analítica (solo si hay gaId configurado)
  var KEY = "elevr_cookie_consent";
  var getConsent = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var saveConsent = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
  var loadGA = function () {
    if (!cfg.gaId || window.gtag) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.gaId, { anonymize_ip: true });
  };
  var banner = document.getElementById("cookieBanner");
  if (cfg.gaId) {
    var consent = getConsent();
    if (consent === "accept") loadGA();
    else if (!consent && banner) banner.hidden = false;
  }
  if (banner) {
    banner.querySelectorAll("[data-consent]").forEach(function (b) {
      b.addEventListener("click", function () {
        saveConsent(b.dataset.consent);
        banner.hidden = true;
        if (b.dataset.consent === "accept") loadGA();
      });
    });
  }
  document.querySelectorAll("[data-cookie-reset]").forEach(function (b) {
    b.addEventListener("click", function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      if (banner && cfg.gaId) banner.hidden = false;
      else alert("Esta web no usa cookies analíticas en este momento.");
    });
  });
})();
