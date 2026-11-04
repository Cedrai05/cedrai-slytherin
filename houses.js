(() => {
  const houses = {
    slytherin: { name: 'SLYTHERIN', mark: 'S', trait: '야망과 지혜', place: 'UNDER THE LAKE', browserColor: '#081b15' },
    gryffindor: { name: 'GRYFFINDOR', mark: 'G', trait: '용기와 결단', place: 'IN THE TOWER', browserColor: '#2b0d14' },
    ravenclaw: { name: 'RAVENCLAW', mark: 'R', trait: '지혜와 탐구', place: 'ABOVE THE CLOUDS', browserColor: '#0b1b30' },
    hufflepuff: { name: 'HUFFLEPUFF', mark: 'H', trait: '성실과 의리', place: 'BY THE HEARTH', browserColor: '#201c12' }
  };
  const pickerOrder = ['slytherin', 'gryffindor', 'ravenclaw', 'hufflepuff'];
  const commonShield = '<path d="M50 5 89 17v46c0 27-18 47-39 61C29 110 11 90 11 63V17Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M50 12 82 22v40c0 22-13 39-32 52-19-13-32-30-32-52V22Z" fill="none" stroke="currentColor" stroke-opacity=".48"/>';
  const animalMarks = {
    gryffindor: '<path d="M50 27 57 36 68 32 69 44 79 51 71 61 75 73 63 77 59 90 50 84 41 90 37 77 25 73 29 61 21 51 31 44 32 32 43 36Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M37 52q13-13 26 0l-2 18q-11 15-22 0Z M39 58h5m12 0h5M45 69l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    ravenclaw: '<path d="M50 39q-8-13-26-7l10 11-14 4 15 6-8 8 15-2 8 18 8-18 15 2-8-8 15-6-14-4 10-11q-18-6-26 7Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M50 40q10-4 14 7l-9 8-5 22-5-22-9-8q4-11 14-7Z M50 55l8 4-8 4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="55" cy="48" r="1.8" fill="currentColor"/>',
    hufflepuff: '<path d="M29 39 38 29l8 8h8l8-8 9 10-4 11 3 20q-8 22-20 23-12-1-20-23l3-20Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M39 38 34 56l7 18 9 9 9-9 7-18-5-18-7 12h-8Z M46 63h8M50 64v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="39" cy="58" r="2" fill="currentColor"/><circle cx="61" cy="58" r="2" fill="currentColor"/>'
  };
  const crest = document.querySelector('.archway-crest');
  const slytherinCrest = crest?.innerHTML;
  const pickers = [...document.querySelectorAll('[data-house-picker]')];

  pickers.forEach((picker, index) => {
    const menuId = `house-picker-menu-${index}`;
    picker.className = 'house-picker';
    picker.innerHTML = `<button class="house-picker__toggle" type="button" aria-expanded="false" aria-controls="${menuId}" aria-label="기숙사 선택"><span class="house-picker__mark" aria-hidden="true">S</span><span class="house-picker__current">SLYTHERIN</span><span class="house-picker__chevron" aria-hidden="true">⌄</span></button><div class="house-picker__menu" id="${menuId}" hidden><div class="house-picker__heading"><span>CHOOSE YOUR HOUSE</span><small>이 브라우저에 선택이 저장됩니다.</small></div><div class="house-picker__choices">${pickerOrder.map(id => `<button type="button" data-house-choice="${id}" aria-pressed="false"><span class="house-picker__choice-mark" aria-hidden="true">${houses[id].mark}</span><span><strong>${houses[id].name}</strong><small>${houses[id].trait}</small></span><i aria-hidden="true">✦</i></button>`).join('')}</div></div>`;
  });

  function closePickers(returnFocus = false) {
    pickers.forEach(picker => {
      const menu = picker.querySelector('.house-picker__menu');
      if (menu.hidden) return;
      const focusedInside = menu.contains(document.activeElement);
      menu.hidden = true;
      picker.querySelector('.house-picker__toggle').setAttribute('aria-expanded', 'false');
      if (returnFocus && focusedInside) picker.querySelector('.house-picker__toggle').focus();
    });
  }

  function setHouse(id, save = false) {
    id = houses[id] ? id : 'slytherin';
    const house = houses[id];
    document.documentElement.dataset.house = id;
    if (save) { try { localStorage.setItem('cedrai-house', id); } catch {} }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', house.browserColor);
    document.querySelectorAll('[data-house-name]').forEach(el => { el.textContent = house.name; });
    document.querySelectorAll('[data-house-location]').forEach(el => { el.textContent = house.place; });
    document.querySelectorAll('.house-picker__current').forEach(el => { el.textContent = house.name; });
    document.querySelectorAll('.house-picker__mark').forEach(el => { el.textContent = house.mark; });
    document.querySelectorAll('.house-picker__toggle').forEach(el => { el.setAttribute('aria-label', `기숙사 선택: ${house.name}`); });
    document.querySelectorAll('[data-house-choice]').forEach(el => { el.setAttribute('aria-pressed', String(el.dataset.houseChoice === id)); });
    if (crest) crest.innerHTML = id === 'slytherin' ? slytherinCrest : `<svg viewBox="0 0 100 130" aria-hidden="true">${commonShield}${animalMarks[id]}</svg>`;
    const sigil = document.querySelector('.home-sigil__ring small');
    if (sigil) sigil.textContent = `${house.name} · CÉDRAI · 2026`;
  }

  document.addEventListener('click', event => {
    const choice = event.target.closest('[data-house-choice]');
    if (choice) {
      setHouse(choice.dataset.houseChoice, true);
      closePickers(true);
      return;
    }
    const toggle = event.target.closest('.house-picker__toggle');
    if (toggle) {
      const picker = toggle.closest('.house-picker');
      const menu = picker.querySelector('.house-picker__menu');
      const opening = menu.hidden;
      closePickers();
      menu.hidden = !opening;
      toggle.setAttribute('aria-expanded', String(opening));
      return;
    }
    if (!event.target.closest('.house-picker')) closePickers();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePickers(true);
  });
  window.addEventListener('storage', event => {
    if (event.key === 'cedrai-house') setHouse(event.newValue || 'slytherin');
  });
  setHouse(document.documentElement.dataset.house || 'slytherin');
})();
