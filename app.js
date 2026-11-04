const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const pages = new Set(['home','about','work','journal','calendar','now','contact']);
const panelSpells = {
  home: ['Finite', '지도의 발자국을 따라 돌아갑니다'], about: ['Revelio', '숨겨진 소개를 드러냅니다'],
  work: ['Accio', '활동의 흔적을 불러옵니다'], journal: ['Aparecium', '보이지 않던 잉크가 나타납니다'],
  calendar: ['Tempus', '시간의 페이지를 넘깁니다'], now: ['Lumos', '지금의 이야기를 비춥니다'],
  contact: ['Alohomora', '편지를 보낼 길을 엽니다']
};
let content = { posts: [], events: [], now: null };
let activeFilter = 'all';
let visiblePosts = 6;
let calendarDate = new Date();
const dateFormat = new Intl.DateTimeFormat('en-US', { year:'numeric', month:'long', day:'numeric' });
const categoryLabels = { 'CTF/Wargame':'CTF / WARGAME', '블로그/기술문서':'TECH NOTES', '논문/컨퍼런스':'PAPERS / CONFERENCES' };
const displayTitle = post => post.title;
const displayCategory = category => categoryLabels[category] || category;
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
  window.closeSpellbook?.();
  if (push) history.pushState({page}, '', `#${page}`);
  window.scrollTo({top:0,behavior:'instant'});
}
function openPanel(name) {
  const page = pages.has(name) ? name : 'home';
  if ($(`.panel[data-page="${page}"]`)?.hidden === false) {
    window.closeSpellbook?.();
    return;
  }
  const [spell, caption] = panelSpells[page];
  window.magicCurtain(spell, caption, () => showPanel(page), false, page);
}
function enter() {
  $('#entrance').classList.add('opening');
  try { sessionStorage.setItem('cedrai-entered','1'); } catch {}
  window.magicCurtain('Alohomora', '돌문 너머의 지도를 펼칩니다', () => showPanel('home'), false, 'entrance');
}
$('#enter-button').addEventListener('click', enter);
$$('[data-panel]').forEach(button => button.addEventListener('click', () => openPanel(button.dataset.panel)));
$('#spell-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#spell-input');
  const cast = input.value.trim().toLocaleLowerCase().replace(/[^a-z]/g, '');
  if (cast === 'expectopatronum') {
    input.value = '';
    window.castPatronus?.();
    return;
  }
  const destinations = { finite:'home', hominumrevelio:'about', revelio:'about', accio:'work', aparecium:'journal', tempus:'calendar', lumos:'now', alohomora:'contact' };
  const page = destinations[cast];
  if (!page) {
    $('#spell-feedback').textContent = '주문을 찾지 못했습니다. 아래 주문 목록에서 골라 보세요.';
    input.focus();
    return;
  }
  $('#spell-feedback').textContent = `${panelSpells[page][0]} ✦`;
  input.value = '';
  openPanel(page);
});
window.addEventListener('popstate', () => {
  const page = location.hash.slice(1);
  const [spell, caption] = panelSpells[pages.has(page) ? page : 'home'];
  window.magicCurtain(spell, caption, () => showPanel(page, false), false, pages.has(page) ? page : 'home');
});
const initialPage = location.hash.slice(1);
let wasEntered = false;
try { wasEntered = sessionStorage.getItem('cedrai-entered') === '1'; } catch {}
if (pages.has(initialPage) || wasEntered) {
  showPanel(initialPage || 'home', false);
  requestAnimationFrame(() => window.scrollTo({top:0,behavior:'instant'}));
  window.addEventListener('load', () => window.setTimeout(() => window.scrollTo({top:0,behavior:'instant'}), 0), {once:true});
}

function renderPosts() {
  const search = $('#post-search').value.trim().toLocaleLowerCase();
  const list = content.posts.filter(post => (activeFilter === 'all' || (activeFilter === 'tech' ? post.category === '블로그/기술문서' : post.category === activeFilter)) && (`${post.title} ${displayTitle(post)} ${post.category} ${post.summary || ''}`).toLocaleLowerCase().includes(search));
  $('#post-list').innerHTML = list.length ? list.slice(0, visiblePosts).map((post,index) => `<a class="post-row" style="--ink-order:${index % 8}" href="blog.html?post=${encodeURIComponent(post.slug)}" aria-label="Read ${escapeHtml(displayTitle(post))}"><span class="post-index">${String(index+1).padStart(2,'0')}</span><span class="post-text"><small>${escapeHtml(displayCategory(post.category))} · ${escapeHtml(post.date)}</small><strong lang="${/[가-힣]/.test(displayTitle(post)) ? 'ko' : 'en'}">${escapeHtml(displayTitle(post))}</strong></span><span class="post-arrow">↗</span></a>`).join('') : '<div class="empty-posts">No matching notes.</div>';
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
  window.magicNavigate(link.href, 'Aparecium', '기록의 다음 장을 펼칩니다', 'journal');
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
  $('#calendar-detail').textContent='날짜를 누르면 그날의 기록이 나타납니다.';
}
$('#prev-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);renderCalendar()});
$('#next-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);renderCalendar()});
$('#calendar-grid').addEventListener('click',event=>{
  const day=event.target.closest('[data-date]'); if(!day)return;
  $$('.calendar-day.selected').forEach(el=>el.classList.remove('selected'));
  day.classList.add('selected');
  const records=content.events.filter(item=>item.date===day.dataset.date);
  $('#calendar-detail').innerHTML=`<strong>${dateFormat.format(new Date(`${day.dataset.date}T12:00:00`))}</strong>${records.length?records.map(item=>escapeHtml(item.title)+(item.description?` — ${escapeHtml(item.description)}`:'')).join('<br>'):'이 날짜에는 기록이 없습니다.'}`;
});
async function loadContent() {
  try {
    const response=await fetch('content.json'); if(!response.ok) throw Error('content');
    content=await response.json();
    renderPosts(); renderCalendar();
    if(content.now){ $('#now-date').textContent=dateFormat.format(new Date(content.now.created_at)); $('#now-text').textContent=content.now.content; }
  } catch {
    $('#post-list').innerHTML='<div class="empty-posts">기록을 불러오지 못했습니다.</div>';
    $('#calendar-detail').textContent='달력을 불러오지 못했습니다.';
  }
}
loadContent();
