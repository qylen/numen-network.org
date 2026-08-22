(() => {
  const root = document.documentElement;
  const THEME_KEY = 'numen-theme';

  const readStoredTheme = () => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  };

  const persistTheme = (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  };

  const setTheme = (theme) => {
    if (theme === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    persistTheme(theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', theme === 'light' ? '#fafbfd' : '#0d0e12');
    });
    if (typeof window.__rockStill === 'function') window.__rockStill();
  };

  const toggleButtons = document.querySelectorAll('.theme-toggle');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
    });
  });

  let liveRegion = document.getElementById('aria-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('role', 'status');
    document.body.appendChild(liveRegion);
  }
  const announce = (msg) => {
    liveRegion.textContent = '';
    window.setTimeout(() => {
      liveRegion.textContent = msg;
    }, 50);
  };

  const ICON_COPY =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const ICON_CHECK =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  const legacyCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  };

  const copyText = async (text, btn) => {
    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok) ok = legacyCopy(text);
    if (ok && btn) {
      btn.classList.add('copied');
      btn.innerHTML = ICON_CHECK;
      announce('Copied to clipboard');
      window.setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = ICON_COPY;
      }, 1600);
    }
    return ok;
  };

  const makeCopyButton = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy to clipboard');
    btn.innerHTML = ICON_COPY;
    return btn;
  };

  document.querySelectorAll('.cmd').forEach((block) => {
    const code = block.querySelector('code');
    if (!code || block.querySelector('.copy-btn')) return;
    const btn = makeCopyButton();
    block.appendChild(btn);
    btn.addEventListener('click', () => copyText(code.textContent.trim(), btn));
  });

  document.querySelectorAll('.code-box').forEach((box) => {
    const pre = box.querySelector('pre');
    if (!pre || box.querySelector('.copy-btn')) return;
    let header = box.querySelector('.code-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'code-header';
      header.innerHTML = '<span>Snippet</span>';
      box.prepend(header);
    }
    const btn = makeCopyButton();
    header.appendChild(btn);
    btn.addEventListener('click', () => copyText(pre.textContent, btn));
  });

  const burger = document.querySelector('.nav-burger');
  const menu = document.getElementById('mobile-menu');
  if (burger && menu) {
    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      if (open) menu.removeAttribute('hidden');
      else menu.setAttribute('hidden', '');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (
        burger.getAttribute('aria-expanded') === 'true' &&
        !e.target.closest('.nav') &&
        !e.target.closest('#mobile-menu')
      ) {
        setOpen(false);
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
      }
    });
  }

  const initScrollSpy = () => {
    const subnav = document.querySelector('.subnav');
    if (!subnav) return;
    const links = [...subnav.querySelectorAll('a[href^="#"]')];
    if (!links.length) return;
    const pairs = [];
    links.forEach((link) => {
      const sec = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (sec) pairs.push({ link, sec });
    });
    if (!pairs.length) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const line = window.innerHeight * 0.35;
      let current = null;
      for (const pair of pairs) {
        if (pair.sec.getBoundingClientRect().top <= line) current = pair.link;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = pairs[pairs.length - 1].link;
      }
      links.forEach((l) => l.classList.toggle('active', l === current));
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  };
  initScrollSpy();

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  backToTop.hidden = true;
  document.body.appendChild(backToTop);
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  let topTicking = false;
  window.addEventListener('scroll', () => {
    if (topTicking) return;
    topTicking = true;
    requestAnimationFrame(() => {
      topTicking = false;
      backToTop.hidden = window.scrollY < 600;
    });
  }, { passive: true });
})();
