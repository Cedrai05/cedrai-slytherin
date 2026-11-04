const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const pages = new Set(['home','about','work','journal','calendar','now','contact']);
let content = { posts: [], events: [], now: null };
let activeFilter = 'all';
let visiblePosts = 6;
let calendarDate = new Date();
const dateFormat = new Intl.DateTimeFormat('ko-KR', { year:'numeric', month:'long', day:'numeric' });
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
  if (!reducedMotion.matches) { void active.offsetWidth; active.classList.add('panel-enter'); }
  $$('[data-panel]').forEach(button => {
    const selected = button.dataset.panel === page;
    button.classList.toggle('selected', selected);
    if (button.closest('nav')) button.setAttribute('aria-current', selected ? 'page' : 'false');
  });
  $('#mobile-nav').hidden = true;
  $('#menu-toggle').setAttribute('aria-expanded','false');
  $('#menu-toggle').setAttribute('aria-label','메뉴 열기');
  if (push) history.pushState({page}, '', `#${page}`);
  window.scrollTo({top:0,behavior:'instant'});
}
function enter() {
  $('#entrance').classList.add('opening');
  try { sessionStorage.setItem('cedrai-entered','1'); } catch {}
  setTimeout(() => showPanel('home'), reducedMotion.matches ? 0 : 520);
}
$('#enter-button').addEventListener('click', enter);
$$('[data-panel]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.panel)));
$('#menu-toggle').addEventListener('click', () => {
  const menu = $('#mobile-nav');
  menu.hidden = !menu.hidden;
  $('#menu-toggle').setAttribute('aria-expanded', String(!menu.hidden));
  $('#menu-toggle').setAttribute('aria-label', menu.hidden ? '메뉴 열기' : '메뉴 닫기');
});
window.addEventListener('popstate', () => showPanel(location.hash.slice(1), false));
const initialPage = location.hash.slice(1);
let wasEntered = false;
try { wasEntered = sessionStorage.getItem('cedrai-entered') === '1'; } catch {}
if (pages.has(initialPage) || wasEntered) showPanel(initialPage || 'home', false);

function renderPosts() {
  const search = $('#post-search').value.trim().toLocaleLowerCase();
  const list = content.posts.filter(post => (activeFilter === 'all' || post.category === activeFilter) && (`${post.title} ${post.category} ${post.summary || ''}`).toLocaleLowerCase().includes(search));
  $('#post-list').innerHTML = list.length ? list.slice(0, visiblePosts).map((post,index) => `<a class="post-row" href="blog.html?post=${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)} 글 읽기"><span class="post-index">${String(index+1).padStart(2,'0')}</span><span class="post-text"><small>${escapeHtml(post.category)} · ${escapeHtml(post.date)}</small><strong>${escapeHtml(post.title)}</strong></span><span class="post-arrow">↗</span></a>`).join('') : '<div class="empty-posts">찾은 기록이 없습니다.</div>';
  $('#post-count').textContent = `${list.length}개의 공개 글`;
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
  document.body.classList.add('leaving');
  setTimeout(() => location.assign(link.href), 310);
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
    html+=`<button class="calendar-day${iso===today?' today':''}" type="button" data-date="${iso}" aria-label="${iso}${eventDates.has(iso)?' 일정 있음':''}"><span>${day}</span>${eventDates.has(iso)?'<i></i>':''}</button>`;
  }
  $('#calendar-grid').innerHTML=html;
  $('#calendar-detail').textContent='날짜를 선택하면 일정이 표시됩니다.';
}
$('#prev-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);renderCalendar()});
$('#next-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);renderCalendar()});
$('#calendar-grid').addEventListener('click',event=>{
  const day=event.target.closest('[data-date]'); if(!day)return;
  $$('.calendar-day.selected').forEach(el=>el.classList.remove('selected'));
  day.classList.add('selected');
  const records=content.events.filter(item=>item.date===day.dataset.date);
  $('#calendar-detail').innerHTML=`<strong>${dateFormat.format(new Date(`${day.dataset.date}T12:00:00`))}</strong>${records.length?records.map(item=>escapeHtml(item.title)+(item.description?` — ${escapeHtml(item.description)}`:'')).join('<br>'):'기록된 일정이 없습니다.'}`;
});
async function loadContent() {
  try {
    const response=await fetch('content.json'); if(!response.ok) throw Error('content');
    content=await response.json();
    renderPosts(); renderCalendar();
    if(content.now){ $('#now-date').textContent=dateFormat.format(new Date(content.now.created_at)); $('#now-text').textContent=content.now.content; }
  } catch {
    $('#post-list').innerHTML='<div class="empty-posts">기록을 불러오지 못했습니다.</div>';
    $('#calendar-detail').textContent='일정을 불러오지 못했습니다.';
  }
}
loadContent();
