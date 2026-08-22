/* Numen Network — shared behaviors
   nav state · theme · mobile drawer · reveals · copy buttons · scroll spy ·
   back-to-top · optional live network feed (NetworkFeed) */
(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  root.classList.add("js");
  const motionQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  const reducedMotion = motionQuery.matches;

  /* ---------------------------------------------------------------- theme */
  const THEME_KEY = "numen-theme";
  const stored = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
  const prefersLight = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-color-scheme: light)").matches;
  if (stored === "light" || (!stored && prefersLight)) {
    root.dataset.theme = "light";
  }

  const syncThemeColor = () => {
    const light = root.dataset.theme === "light";
    doc.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", light ? "#fafbfd" : "#06070b");
    });
    if (typeof window.__numenRepaint === "function") window.__numenRepaint();
  };
  syncThemeColor();

  doc.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const light = root.dataset.theme !== "light";
      if (light) root.dataset.theme = "light";
      else delete root.dataset.theme;
      try { localStorage.setItem(THEME_KEY, light ? "light" : "dark"); } catch {}
      syncThemeColor();
    });
  });

  /* ------------------------------------------------------------ aria live */
  let liveRegion = doc.getElementById("aria-live-region");
  if (!liveRegion) {
    liveRegion = doc.createElement("div");
    liveRegion.id = "aria-live-region";
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("role", "status");
    doc.body.appendChild(liveRegion);
  }
  const announce = (msg) => {
    liveRegion.textContent = "";
    window.setTimeout(() => { liveRegion.textContent = msg; }, 50);
  };

  /* ----------------------------------------------------------------- nav */
  const nav = doc.querySelector(".nav");
  if (nav) {
    let navTick = false;
    const onScroll = () => {
      if (navTick) return;
      navTick = true;
      requestAnimationFrame(() => {
        navTick = false;
        nav.classList.toggle("scrolled", window.scrollY > 8);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* mobile drawer */
  const burger = doc.querySelector(".nav-burger");
  const menu = doc.getElementById("mobile-menu");
  if (burger && menu) {
    const setOpen = (open) => {
      menu.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      doc.body.classList.toggle("menu-open", open);
      if (open) {
        const first = menu.querySelector("a, button");
        if (first) first.focus({ preventScroll: true });
      }
    };
    burger.addEventListener("click", () => {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        burger.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && burger.getAttribute("aria-expanded") === "true") setOpen(false);
    });
  }

  /* -------------------------------------------------------------- reveal */
  const revealEls = doc.querySelectorAll(".rv");
  if (revealEls.length && !reducedMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add("rv-in");
          io.unobserve(en.target);
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    root.classList.add("no-io");
  }

  /* --------------------------------------------------------- copy buttons */
  const ICON_COPY =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const ICON_CHECK =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  const legacyCopy = (text) => {
    const ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;";
    doc.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = doc.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  };

  const wireCopyButton = (btn, getText) => {
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy to clipboard");
    btn.innerHTML = ICON_COPY;
    btn.addEventListener("click", async () => {
      let ok = false;
      const text = getText();
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
      }
      if (!ok) ok = legacyCopy(text);
      if (ok) {
        btn.classList.add("copied");
        btn.innerHTML = ICON_CHECK;
        announce("Copied to clipboard");
        window.setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = ICON_COPY;
        }, 1600);
      }
    });
  };

  doc.querySelectorAll("[data-copy]").forEach((block) => {
    const target = block.querySelector("pre, code");
    if (!target || block.querySelector(".copy-btn")) return;
    const btn = doc.createElement("button");
    wireCopyButton(btn, () => target.textContent.trim());
    const header = block.querySelector(".code-header");
    if (header) header.appendChild(btn);
    else block.appendChild(btn);
  });

  /* ------------------------------------------------------------ scrollspy */
  const subnav = doc.querySelector(".subnav");
  if (subnav) {
    const links = [...subnav.querySelectorAll('a[href^="#"]')];
    const pairs = [];
    links.forEach((link) => {
      const sec = doc.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (sec) pairs.push({ link, sec });
    });
    if (pairs.length) {
      let ticking = false;
      const update = () => {
        ticking = false;
        const line = window.innerHeight * 0.35;
        let current = null;
        for (const p of pairs) {
          if (p.sec.getBoundingClientRect().top <= line) current = p.link;
        }
        if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) {
          current = pairs[pairs.length - 1].link;
        }
        links.forEach((l) => l.classList.toggle("active", l === current));
      };
      window.addEventListener("scroll", () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      }, { passive: true });
      update();
    }
  }

  /* ---------------------------------------------------------- back to top */
  const topBtn = doc.createElement("button");
  topBtn.type = "button";
  topBtn.className = "back-to-top";
  topBtn.setAttribute("aria-label", "Back to top");
  topBtn.hidden = true;
  topBtn.innerHTML =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  doc.body.appendChild(topBtn);
  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });
  let topTick = false;
  window.addEventListener("scroll", () => {
    if (topTick) return;
    topTick = true;
    requestAnimationFrame(() => {
      topTick = false;
      topBtn.hidden = window.scrollY < 700;
    });
  }, { passive: true });

  /* ------------------------------------------------------- dynamic year */
  doc.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* =====================================================================
     NetworkFeed — honest live-data architecture.
     By default NO endpoint is configured: cells stay in an explicit
     "unavailable" state instead of showing fabricated numbers.
     To enable later, set before this script runs:
       window.NUMEN_LIVE_RPC = ["https://your-node.example:9944"];
     Any JSON-RPC reachable via HTTP POST works (eth_blockNumber, eth_chainId…).
     ===================================================================== */
  const feed = {
    endpoints: Array.isArray(window.NUMEN_LIVE_RPC) ? window.NUMEN_LIVE_RPC : [],
    async call(method, params) {
      for (const url of this.endpoints) {
        try {
          const ctrl = new AbortController();
          const t = window.setTimeout(() => ctrl.abort(), 5000);
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
            signal: ctrl.signal,
          });
          window.clearTimeout(t);
          const json = await res.json();
          if (json && json.result !== undefined) return json.result;
        } catch { /* try next endpoint */ }
      }
      throw new Error("no endpoint available");
    },
    hexToNum(hex) {
      try { return parseInt(hex, 16); } catch { return NaN; }
    },
  };

  const initLiveCells = async () => {
    const cells = doc.querySelectorAll("[data-live]");
    if (!cells.length) return;
    if (!feed.endpoints.length) {
      // Leave the markup's default "unavailable" copy in place.
      cells.forEach((c) => c.classList.add("is-unavailable"));
      return;
    }
    const getters = {
      blockNumber: async () => feed.hexToNum(await feed.call("eth_blockNumber", [])),
      chainId: async () => feed.hexToNum(await feed.call("eth_chainId", [])),
    };
    for (const cell of cells) {
      const kind = cell.getAttribute("data-live");
      const valueEl = cell.querySelector("[data-live-value]");
      const noteEl = cell.querySelector("[data-live-note]");
      if (!getters[kind] || !valueEl) continue;
      try {
        const val = await getters[kind]();
        if (Number.isFinite(val)) {
          valueEl.textContent = val.toLocaleString("en-US");
          if (noteEl) noteEl.textContent = "Live via RPC";
        } else {
          throw new Error("bad value");
        }
      } catch {
        cell.classList.add("is-unavailable");
      }
    }
  };
  initLiveCells();

  /* ===================================================================
     Tabs / stepper — used by the Proof-of-Scan walkthrough.
     Markup contract: container[data-tabs][data-auto][data-interval]
       > button[role=tab][aria-controls=id] …
       > section[role=tabpanel][id][aria-labelledby]
     =================================================================== */
  doc.querySelectorAll("[data-tabs]").forEach((container) => {
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    const panels = tabs
      .map((t) => doc.getElementById(t.getAttribute("aria-controls")))
      .filter(Boolean);
    if (!tabs.length || tabs.length !== panels.length) return;

    const select = (index, focusTab = false, user = false) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle("on", on);
      });
      if (focusTab) tabs[index].focus();
      if (user) autoStop();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i, false, true));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          select(next, true, true);
        }
      });
    });

    select(0);

    /* gentle auto-advance, disabled by reduced motion and any manual choice */
    let timer = null;
    let hovered = false;
    const canAuto = container.hasAttribute("data-auto") && !reducedMotion;
    const start = () => {
      if (!canAuto || timer) return;
      timer = window.setInterval(() => {
        if (hovered) return;
        const cur = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
        select((cur + 1) % tabs.length);
      }, parseInt(container.getAttribute("data-interval"), 10) || 5200);
    };
    const autoStop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    if (canAuto) {
      container.addEventListener("mouseenter", () => { hovered = true; });
      container.addEventListener("mouseleave", () => { hovered = false; });
      container.addEventListener("focusin", () => { hovered = true; });
      container.addEventListener("focusout", () => { hovered = false; });
      start();
    }
  });

  /* expose minimal hooks for page modules */
  window.numen = { announce, reducedMotion };
})();
