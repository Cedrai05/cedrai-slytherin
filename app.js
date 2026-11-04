const $ = (selector) => document.querySelector(selector);
let content = { posts: [], events: [], now: null };
let activeFilter = 'all';
let visiblePosts = 5;
let calendarDate = new Date();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const dateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function renderPosts() {
  const search = $('#post-search').value.trim().toLocaleLowerCase();
  const list = content.posts.filter(post => (activeFilter === 'all' || post.category === activeFilter) && (`${post.title} ${post.category} ${post.summary || ''}`).toLocaleLowerCase().includes(search));
  $('#post-list').innerHTML = list.length ? list.slice(0, visiblePosts).map((post,index) => `<a class="post-row" href="blog.html?post=${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)} 원문 열기"><span class="post-index" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span class="post-date">${escapeHtml(post.date)}</span><h3>${escapeHtml(post.title)}</h3><span class="post-category">${escapeHtml(post.category)}</span><span class="post-arrow" aria-hidden="true">↗</span></a>`).join('') : '<div class="empty-posts">검색 결과가 없습니다.</div>';
  $('#post-count').textContent = `${list.length}개의 공개 기록 · ${Math.min(visiblePosts,list.length)}개 펼침`;
  $('#more-posts').hidden = list.length <= visiblePosts;
}
function sparkBurst(x,y,count=12) {
  if (reducedMotion.matches) return;
  const layer=$('.spark-layer');
  for(let i=0;i<count;i++) {
    const spark=document.createElement('span');
    spark.className='spark';
    const angle=Math.PI*2*i/count;
    const distance=25+Math.random()*45;
    spark.style.setProperty('--x',`${x}px`);
    spark.style.setProperty('--y',`${y}px`);
    spark.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
    spark.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);
    spark.style.setProperty('--size',`${2+Math.random()*4}px`);
    layer.appendChild(spark);
    spark.addEventListener('animationend',()=>spark.remove(),{once:true});
  }
}
function castOn(element) {
  const rect=element.getBoundingClientRect();
  sparkBurst(rect.left+rect.width/2,rect.top+rect.height/2);
  const list=$('#post-list');
  list.classList.remove('is-casting');
  void list.offsetWidth;
  list.classList.add('is-casting');
}
function localDay(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function renderCalendar() {
  const year = calendarDate.getFullYear(), month = calendarDate.getMonth();
  $('#calendar-title').textContent = new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(calendarDate);
  const firstOffset = (new Date(year,month,1).getDay()+6)%7;
  const count = new Date(year,month+1,0).getDate();
  const eventDates = new Set(content.events.map(event => event.date));
  const today = localDay(new Date());
  let html = '';
  for (let i=0; i<firstOffset; i++) html += '<button class="calendar-day" disabled aria-hidden="true"></button>';
  for (let day=1; day<=count; day++) {
    const iso = localDay(new Date(year,month,day));
    const has = eventDates.has(iso);
    html += `<button class="calendar-day${iso===today?' today':''}" type="button" data-date="${iso}" aria-label="${iso}${has?' 일정 있음':''}"><span class="day-num">${day}</span>${has?'<span class="day-dot"></span>':''}</button>`;
  }
  const remainder = (7 - (firstOffset+count)%7)%7;
  for (let i=0;i<remainder;i++) html += '<button class="calendar-day" disabled aria-hidden="true"></button>';
  $('#calendar-grid').innerHTML=html;
  $('#calendar-detail').textContent='표시된 날짜를 선택하면 일정을 볼 수 있습니다.';
}
function showDay(iso, button) {
  document.querySelectorAll('.calendar-day.selected').forEach(el=>el.classList.remove('selected'));
  button.classList.add('selected');
  const dayEvents = content.events.filter(event=>event.date===iso);
  $('#calendar-detail').innerHTML = `<strong>${dateFormat.format(new Date(`${iso}T12:00:00`))}</strong>${dayEvents.length ? dayEvents.map(event=>escapeHtml(event.title)+(event.description?` — ${escapeHtml(event.description)}`:'')).join('<br>') : '기록된 일정이 없습니다.'}`;
}
async function init() {
  try {
    const response = await fetch('content.json');
    if (!response.ok) throw new Error('content fetch failed');
    content = await response.json();
  } catch {
    $('#post-list').innerHTML='<div class="empty-posts">기록을 불러오지 못했습니다.</div>';
    $('#calendar-detail').textContent='일정을 불러오지 못했습니다.';
    return;
  }
  renderPosts(); renderCalendar();
  if(content.now) {
    $('#now-date').textContent = dateFormat.format(new Date(content.now.created_at));
    $('#now-text').textContent = content.now.content;
  }
}
$('#post-search').addEventListener('input',()=>{visiblePosts=5;renderPosts()});
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{document.querySelector('.filter.active')?.classList.remove('active');document.querySelectorAll('.filter').forEach(filter=>filter.setAttribute('aria-pressed','false'));button.classList.add('active','spell-cast');button.setAttribute('aria-pressed','true');setTimeout(()=>button.classList.remove('spell-cast'),500);activeFilter=button.dataset.filter;visiblePosts=5;renderPosts();castOn(button)}));
$('#more-posts').addEventListener('click',event=>{visiblePosts+=5;renderPosts();castOn(event.currentTarget)});
$('#post-list').addEventListener('click',event=>{
  const link=event.target.closest('a.post-row');
  if(!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button!==0) return;
  event.preventDefault();
  const destination=link.href;
  castOn(link);
  if(reducedMotion.matches){window.location.assign(destination);return}
  $('.spell-transition').classList.add('is-visible');
  setTimeout(()=>window.location.assign(destination),650);
});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{
  const rect=link.getBoundingClientRect();
  sparkBurst(rect.left+rect.width/2,rect.top+rect.height/2,8);
}));
window.addEventListener('pageshow',()=>$('.spell-transition').classList.remove('is-visible'));
$('#prev-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);renderCalendar()});
$('#next-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);renderCalendar()});
$('#calendar-grid').addEventListener('click',event=>{const day=event.target.closest('[data-date]');if(day)showDay(day.dataset.date,day)});
$('.menu-toggle').addEventListener('click',()=>{const nav=$('.mobile-nav');nav.hidden=!nav.hidden;$('.menu-toggle').setAttribute('aria-expanded',String(!nav.hidden));$('.menu-toggle').setAttribute('aria-label',nav.hidden?'메뉴 열기':'메뉴 닫기')});
document.querySelectorAll('.mobile-nav a').forEach(link=>link.addEventListener('click',()=>{$('.mobile-nav').hidden=true;$('.menu-toggle').setAttribute('aria-expanded','false')}));
init();
