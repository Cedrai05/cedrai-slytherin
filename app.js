const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const pages = new Set(['home','about','work','journal','calendar','now','contact']);
const panelSpells = {
  home: ['Finite', 'RETURNING TO THE MAP'], about: ['Revelio', 'A DOSSIER APPEARS'],
  work: ['Accio', 'FOLLOWING THE EVIDENCE'], journal: ['Aparecium', 'THE INK IS REVEALING'],
  calendar: ['Tempus', 'TURNING THE HOURS'], now: ['Lumos', 'THE PRESENT ILLUMINATED'],
  contact: ['Alohomora', 'A LETTER FINDS ITS WAY']
};
let content = { posts: [], events: [], now: null };
let activeFilter = 'all';
let visiblePosts = 6;
let calendarDate = new Date();
const dateFormat = new Intl.DateTimeFormat('en-US', { year:'numeric', month:'long', day:'numeric' });
const categoryLabels = { 'CTF/Wargame':'CTF / WARGAME', '블로그/기술문서':'TECH NOTES', '논문/컨퍼런스':'PAPERS / CONFERENCES' };
const titleLabels = { 'tistory-32':'File Upload', 'tistory-28':'Digital Forensics: Landscape and Response', 'tistory-8':'File Download' };
const eventLabels = {
  '가족 나들이':'Family outing', '가족 여행':'Family trip', '수강바구니':'Course planning',
  '수강바구니 2차':'Course planning, round two', '수강신청':'Course registration',
  '약속':'Meetup', '자취방':'Apartment', '제2회 영남권 사이버 공격 방어 대회':'Yeongnam Cyber Defense Competition',
  '중간고사':'Midterms', '충주':'Chungju', '충청권 사이버 보안 경진 대회':'Chungcheong Cybersecurity Competition',
  '클라우드 보안':'Cloud Security', 'GLT 모임':'GLT meeting', 'GTL 모임':'GTL meeting',
  '가족과 영화 + 코엑스':'Movie and COEX with family', '가족과 함께 일본 여행':'Family trip to Japan',
  '자취방 내려감':'Travel to my apartment', '잠깐 자취방 가서 청소 + 정리':'Clean and organize my apartment',
  '친구와 약속':'Meeting a friend', '케이묵 클라우드 보안 수업':'K-MOOC Cloud Security class',
  '학교 본 수강신청':'University course registration', '학교 수강바구니 2차':'Second course planning period',
  '학교 수강바구니 신청':'University course planning'
};
const displayTitle = post => titleLabels[post.slug] || post.title;
const displayCategory = category => categoryLabels[category] || category;
const displayEvent = value => eventLabels[value] || value;
const nowTranslation = {
  '세쿠에서 프로젝트 진행하기 위해 기획하는중. 학교 수업 듣고있고 케이묵 강의도 듣는중. 집에가고싶고 잠을 자고 싶음~':
    'Planning a project with seKUrity, attending university classes, and taking K-MOOC lectures. Missing home and hoping for more sleep.'
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mapLoader = $('#map-loader');

if (document.documentElement.classList.contains('map-loading')) {
  $('#entrance').inert = true;
  let dismissed = false;
  const dismissMap = (focusEntrance = false) => {
    if (dismissed) return;
    dismissed = true;
    mapLoader.classList.add('is-leaving');
    window.setTimeout(() => {
      mapLoader.hidden = true;
      document.documentElement.classList.remove('map-loading');
      $('#entrance').inert = false;
      if (focusEntrance) $('#enter-button').focus();
    }, 640);
  };
  const mapTimer = window.setTimeout(() => dismissMap(), 3300);
  $('#skip-map-loader').addEventListener('click', () => {
    window.clearTimeout(mapTimer);
    dismissMap(true);
  });
} else {
  mapLoader.hidden = true;
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function showPanel(name, push = true) {
  const page = pages.has(name) ? name : 'home';
  $('#entrance').hidden = true;
  $('#app-shell').hidden = false;
  $$('.panel').forEach(panel => { panel.hidden = panel.dataset.page !== page; panel.classList.remove('panel-enter'); });
  const active = $(`.panel[data-page="${page}"]`);
  active.querySelector('.chapter-title')?.setAttribute('data-incantation', panelSpells[page][0]);
  if (!reducedMotion.matches) { void active.offsetWidth; active.classList.add('panel-enter'); }
  $$('[data-panel]').forEach(button => {
    const selected = button.dataset.panel === page;
    button.classList.toggle('selected', selected);
    if (button.closest('nav')) button.setAttribute('aria-current', selected ? 'page' : 'false');
  });
  $('#mobile-nav').hidden = true;
  $('#menu-toggle').setAttribute('aria-expanded','false');
  $('#menu-toggle').setAttribute('aria-label','Open menu');
  if (push) history.pushState({page}, '', `#${page}`);
  window.scrollTo({top:0,behavior:'instant'});
}
function openPanel(name) {
  const page = pages.has(name) ? name : 'home';
  if ($(`.panel[data-page="${page}"]`)?.hidden === false) return;
  const [spell, caption] = panelSpells[page];
  window.magicCurtain(spell, caption, () => showPanel(page));
}
function enter() {
  $('#entrance').classList.add('opening');
  try { sessionStorage.setItem('cedrai-entered','1'); } catch {}
  window.magicCurtain('Alohomora', 'THE STONE WALL OPENS', () => showPanel('home'));
}
$('#enter-button').addEventListener('click', enter);
$$('[data-panel]').forEach(button => button.addEventListener('click', () => openPanel(button.dataset.panel)));
$('#menu-toggle').addEventListener('click', () => {
  const menu = $('#mobile-nav');
  menu.hidden = !menu.hidden;
  $('#menu-toggle').setAttribute('aria-expanded', String(!menu.hidden));
  $('#menu-toggle').setAttribute('aria-label', menu.hidden ? 'Open menu' : 'Close menu');
});
window.addEventListener('popstate', () => {
  const page = location.hash.slice(1);
  const [spell, caption] = panelSpells[pages.has(page) ? page : 'home'];
  window.magicCurtain(spell, caption, () => showPanel(page, false));
});
const initialPage = location.hash.slice(1);
let wasEntered = false;
try { wasEntered = sessionStorage.getItem('cedrai-entered') === '1'; } catch {}
if (pages.has(initialPage) || wasEntered) showPanel(initialPage || 'home', false);

function renderPosts() {
  const search = $('#post-search').value.trim().toLocaleLowerCase();
  const list = content.posts.filter(post => (activeFilter === 'all' || (activeFilter === 'tech' ? post.category === '블로그/기술문서' : post.category === activeFilter)) && (`${post.title} ${displayTitle(post)} ${post.category} ${post.summary || ''}`).toLocaleLowerCase().includes(search));
  $('#post-list').innerHTML = list.length ? list.slice(0, visiblePosts).map((post,index) => `<a class="post-row" href="blog.html?post=${encodeURIComponent(post.slug)}" aria-label="Read ${escapeHtml(displayTitle(post))}"><span class="post-index">${String(index+1).padStart(2,'0')}</span><span class="post-text"><small>${escapeHtml(displayCategory(post.category))} · ${escapeHtml(post.date)}</small><strong>${escapeHtml(displayTitle(post))}</strong></span><span class="post-arrow">↗</span></a>`).join('') : '<div class="empty-posts">No matching notes.</div>';
  $('#post-count').textContent = `${list.length} public notes`;
  $('#more-posts').hidden = list.length <= visiblePosts;
}
$('#post-search').addEventListener('input', () => { visiblePosts=6; renderPosts(); });
$$('.filter').forEach(button => button.addEventListener('click', () => {
  $$('.filter').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed','false'); });
  button.classList.add('active'); button.setAttribute('aria-pressed','true');
  activeFilter=button.dataset.filter; visiblePosts=6; renderPosts();
  if(!reducedMotion.matches) { $('#post-list').classList.remove('list-enter'); void $('#post-list').offsetWidth; $('#post-list').classList.add('list-enter'); }
}));
$('#more-posts').addEventListener('click', () => { visiblePosts+=6; renderPosts(); });
$('#post-list').addEventListener('click', event => {
  const link=event.target.closest('a.post-row');
  if(!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || reducedMotion.matches) return;
  event.preventDefault();
  window.magicNavigate(link.href, 'Aparecium', 'TURNING THE PAGE');
});
function localDay(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function renderCalendar() {
  const year=calendarDate.getFullYear(), month=calendarDate.getMonth();
  $('#calendar-title').textContent = new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(calendarDate);
  const offset=(new Date(year,month,1).getDay()+6)%7;
  const count=new Date(year,month+1,0).getDate();
  const eventDates=new Set(content.events.map(event=>event.date));
  const today=localDay(new Date());
  let html='';
  for(let i=0;i<offset;i++) html+='<div class="calendar-day empty" aria-hidden="true"></div>';
  for(let day=1;day<=count;day++) {
    const iso=localDay(new Date(year,month,day));
    html+=`<button class="calendar-day${iso===today?' today':''}" type="button" data-date="${iso}" aria-label="${iso}${eventDates.has(iso)?' has an entry':''}"><span>${day}</span>${eventDates.has(iso)?'<i></i>':''}</button>`;
  }
  $('#calendar-grid').innerHTML=html;
  $('#calendar-detail').textContent='Choose a date to reveal an entry.';
}
$('#prev-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);renderCalendar()});
$('#next-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);renderCalendar()});
$('#calendar-grid').addEventListener('click',event=>{
  const day=event.target.closest('[data-date]'); if(!day)return;
  $$('.calendar-day.selected').forEach(el=>el.classList.remove('selected'));
  day.classList.add('selected');
  const records=content.events.filter(item=>item.date===day.dataset.date);
  $('#calendar-detail').innerHTML=`<strong>${dateFormat.format(new Date(`${day.dataset.date}T12:00:00`))}</strong>${records.length?records.map(item=>escapeHtml(displayEvent(item.title))+(item.description?` — ${escapeHtml(displayEvent(item.description))}`:'')).join('<br>'):'No entry for this date.'}`;
});
async function loadContent() {
  try {
    const response=await fetch('content.json'); if(!response.ok) throw Error('content');
    content=await response.json();
    renderPosts(); renderCalendar();
    if(content.now){ $('#now-date').textContent=dateFormat.format(new Date(content.now.created_at)); $('#now-text').textContent=nowTranslation[content.now.content] || content.now.content; }
  } catch {
    $('#post-list').innerHTML='<div class="empty-posts">The notes could not be loaded.</div>';
    $('#calendar-detail').textContent='The almanac could not be loaded.';
  }
}
loadContent();
