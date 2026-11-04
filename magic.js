(() => {
  const gate = document.getElementById('spell-gate');
  const toggle = document.getElementById('spellbook-toggle');
  const menu = document.getElementById('spellbook-menu');
  const toast = document.getElementById('spellbook-toast');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let busy = false;
  let summoning = false;
  let toastTimer;

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
    const button = document.querySelector('[data-spell="lumos"]');
    button.querySelector('strong').textContent = enabled ? 'Nox' : 'Lumos';
    button.querySelector('small').textContent = enabled ? 'Let the shadows return' : 'Illuminate the archive';
    button.setAttribute('aria-pressed', String(enabled));
  };
  const setRevelio = enabled => {
    document.body.classList.toggle('revelio-active', enabled);
    document.querySelectorAll('[data-revelio]').forEach(element => { element.hidden = !enabled; });
    document.querySelector('[data-spell="revelio"]').setAttribute('aria-pressed', String(enabled));
    remember('cedrai-revelio', enabled);
  };

  window.magicCurtain = (spell, caption, action, leaving = false) => {
    if (busy) return;
    if (reducedMotion.matches) { action(); return; }
    busy = true;
    document.getElementById('spell-gate-name').textContent = spell;
    document.getElementById('spell-gate-caption').textContent = caption;
    gate.classList.remove('is-visible');
    void gate.offsetWidth;
    gate.classList.add('is-visible');
    setTimeout(() => {
      action();
      if (!leaving) setTimeout(() => { gate.classList.remove('is-visible'); busy = false; }, 470);
    }, 420);
    if (leaving) setTimeout(() => { gate.classList.remove('is-visible'); busy = false; }, 1800);
  };
  window.magicNavigate = (url, spell = 'Aparecium', caption = 'TURNING THE PAGE') => {
    window.magicCurtain(spell, caption, () => location.assign(url), true);
  };

  async function summonNote() {
    if (summoning) return;
    summoning = true;
    announce('Accio — summoning a field note…');
    try {
      const response = await fetch('posts.json');
      if (!response.ok) throw new Error('Posts unavailable');
      const posts = await response.json();
      const current = new URLSearchParams(location.search).get('post');
      const choices = posts.filter(post => post.slug !== current);
      if (!choices.length) throw new Error('No notes');
      const post = choices[Math.floor(Math.random() * choices.length)];
      window.magicNavigate(`blog.html?post=${encodeURIComponent(post.slug)}`, 'Accio', 'A FIELD NOTE IS COMING');
    } catch {
      window.magicNavigate('index.html#journal', 'Accio', 'OPENING THE JOURNAL');
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
        announce(enabled ? 'Lumos — the archive is illuminated.' : 'Nox — the shadows return.');
      } else if (spell === 'revelio') {
        const enabled = !document.body.classList.contains('revelio-active');
        setRevelio(enabled);
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
