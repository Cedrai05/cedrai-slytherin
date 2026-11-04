(() => {
  const gate = document.getElementById('spell-gate');
  const toggle = document.getElementById('spellbook-toggle');
  const menu = document.getElementById('spellbook-menu');
  const toast = document.getElementById('spellbook-toast');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const home = document.getElementById('home');
  const homeSigil = document.querySelector('.home-sigil');
  const homeMagic = document.getElementById('home-magic');
  let busy = false;
  let summoning = false;
  let toastTimer;
  let lastTrail = 0;

  function spark(x, y, burst = false) {
    if (reducedMotion.matches) return;
    const count = burst ? 9 : 1;
    for (let i = 0; i < count; i++) {
      const mote = document.createElement('span');
      const angle = burst ? (Math.PI * 2 * i / count) : (Math.random() * Math.PI * 2);
      const distance = burst ? 42 + Math.random() * 40 : 10 + Math.random() * 18;
      mote.className = 'cast-spark';
      mote.style.left = `${x}px`;
      mote.style.top = `${y}px`;
      mote.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
      mote.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
      mote.style.setProperty('--spark-size', `${burst ? 3 + (i % 3) : 2}px`);
      document.body.append(mote);
      setTimeout(() => mote.remove(), 850);
    }
  }

  if (homeMagic && !reducedMotion.matches) {
    for (let i = 0; i < 17; i++) {
      const mote = document.createElement('span');
      mote.className = 'home-magic__mote';
      mote.style.left = `${6 + (i * 57) % 89}%`;
      mote.style.top = `${9 + (i * 37) % 76}%`;
      mote.style.animationDelay = `-${(i % 7) * .72}s`;
      mote.style.animationDuration = `${3.5 + (i % 5) * .65}s`;
      homeMagic.append(mote);
    }
    home.addEventListener('pointermove', event => {
      if (home.hidden || event.pointerType !== 'mouse') return;
      const bounds = homeSigil.getBoundingClientRect();
      homeSigil.style.setProperty('--tilt-x', `${Math.max(-13, Math.min(13, (event.clientX - bounds.left - bounds.width / 2) / 14))}deg`);
      homeSigil.style.setProperty('--tilt-y', `${Math.max(-13, Math.min(13, (bounds.top + bounds.height / 2 - event.clientY) / 14))}deg`);
      if (Date.now() - lastTrail > 95) { spark(event.clientX, event.clientY); lastTrail = Date.now(); }
    });
    home.addEventListener('pointerleave', () => {
      homeSigil.style.setProperty('--tilt-x', '0deg');
      homeSigil.style.setProperty('--tilt-y', '0deg');
    });
    home.addEventListener('pointerdown', event => { if (!home.hidden) spark(event.clientX, event.clientY, true); });
  }

  const remember = (key, value) => {
    try { sessionStorage.setItem(key, value ? '1' : '0'); } catch {}
  };
  const recalled = key => {
    try { return sessionStorage.getItem(key) === '1'; } catch { return false; }
  };
  const closeMenu = () => {
    const focusWasInside = menu.contains(document.activeElement);
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (focusWasInside) toggle.focus();
  };
  const announce = message => {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2900);
  };
  const setLumos = enabled => {
    document.body.classList.toggle('lumos-active', enabled);
    remember('cedrai-lumos', enabled);
    const button = document.querySelector('.spellbook__menu [data-spell="lumos"]');
    button.querySelector('strong').textContent = enabled ? 'Nox' : 'Lumos';
    button.querySelector('small').textContent = enabled ? '빛을 거두기' : '아카이브에 빛 밝히기';
    button.setAttribute('aria-pressed', String(enabled));
    if (homeSigil) { homeSigil.setAttribute('aria-label', enabled ? 'Cast Nox' : 'Cast Lumos'); homeSigil.setAttribute('aria-pressed', String(enabled)); }
    const heroCast = document.querySelector('.hero-cast');
    if (heroCast) { heroCast.querySelector('.hero-cast__label').textContent = enabled ? 'CAST NOX' : 'CAST LUMOS'; heroCast.setAttribute('aria-pressed', String(enabled)); }
  };
  const setRevelio = enabled => {
    document.body.classList.toggle('revelio-active', enabled);
    document.querySelectorAll('[data-revelio]').forEach(element => { element.hidden = !enabled; });
    document.querySelector('[data-spell="revelio"]').setAttribute('aria-pressed', String(enabled));
    remember('cedrai-revelio', enabled);
  };

  window.magicCurtain = (spell, caption, action, leaving = false, scene = 'journal') => {
    if (busy) return;
    if (reducedMotion.matches) { action(); return; }
    busy = true;
    document.getElementById('spell-gate-name').textContent = spell;
    document.getElementById('spell-gate-caption').textContent = caption;
    gate.dataset.scene = scene;
    gate.classList.remove('is-visible');
    void gate.offsetWidth;
    gate.classList.add('is-visible');
    setTimeout(() => {
      action();
      if (!leaving) setTimeout(() => { gate.classList.remove('is-visible'); busy = false; }, 420);
    }, 560);
    if (leaving) setTimeout(() => { gate.classList.remove('is-visible'); busy = false; }, 1800);
  };
  window.magicNavigate = (url, spell = 'Aparecium', caption = '기록의 다음 장을 펼칩니다', scene = 'journal') => {
    window.magicCurtain(spell, caption, () => location.assign(url), true, scene);
  };

  async function summonNote() {
    if (summoning) return;
    summoning = true;
    announce('Accio — 기록을 불러옵니다…');
    try {
      const response = await fetch('posts.json');
      if (!response.ok) throw new Error('Posts unavailable');
      const posts = await response.json();
      const current = new URLSearchParams(location.search).get('post');
      const choices = posts.filter(post => post.slug !== current);
      if (!choices.length) throw new Error('No notes');
      const post = choices[Math.floor(Math.random() * choices.length)];
      window.magicNavigate(`blog.html?post=${encodeURIComponent(post.slug)}`, 'Accio', '기록 한 장을 불러옵니다', 'journal');
    } catch {
      window.magicNavigate('index.html#journal', 'Accio', '기록의 잉크를 드러냅니다', 'journal');
    }
    setTimeout(() => { summoning = false; }, 2000);
  }

  setLumos(recalled('cedrai-lumos'));
  setRevelio(recalled('cedrai-revelio'));
  toggle.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    toggle.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', event => {
    const spellButton = event.target.closest('[data-spell]');
    if (spellButton) {
      const spell = spellButton.dataset.spell;
      closeMenu();
      if (spell === 'lumos') {
        const enabled = !document.body.classList.contains('lumos-active');
        setLumos(enabled);
        const source = spellButton.getBoundingClientRect();
        spark(source.left + source.width / 2, source.top + source.height / 2, true);
        announce(enabled ? 'Lumos — the archive is illuminated.' : 'Nox — the shadows return.');
      } else if (spell === 'revelio') {
        const enabled = !document.body.classList.contains('revelio-active');
        setRevelio(enabled);
        const source = spellButton.getBoundingClientRect();
        spark(source.left + source.width / 2, source.top + source.height / 2, true);
        announce(enabled ? 'Revelio — invisible ink revealed.' : 'Finite — hidden again.');
      } else if (spell === 'accio') {
        summonNote();
      }
      return;
    }
    if (!event.target.closest('#spellbook')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      toggle.click();
      if (!menu.hidden) menu.querySelector('button').focus();
    }
  });
  document.addEventListener('pointermove', event => {
    if (!document.body.classList.contains('lumos-active')) return;
    document.body.style.setProperty('--wand-x', `${event.clientX}px`);
    document.body.style.setProperty('--wand-y', `${event.clientY}px`);
  }, {passive:true});
  window.addEventListener('pageshow', () => { gate.classList.remove('is-visible'); busy = false; });
})();
