const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = new URLSearchParams(location.search).get('post');
const categoryLabels = { 'CTF/Wargame':'CTF / WARGAME', '블로그/기술문서':'TECH NOTES', '논문/컨퍼런스':'PAPERS / CONFERENCES' };
const displayTitle = post => post.title;
let readingFrame = 0;
function buildPageGuide() {
  const headings = [...document.querySelectorAll('#article-content h2, #article-content h3')]
    .filter(heading => heading.textContent.trim());
  const guide = $('#article-index');
  guide.hidden = headings.length === 0;
  $('#article-index-list').replaceChildren();
  headings.forEach((heading, index) => {
    heading.id = `field-note-section-${index + 1}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.level = heading.tagName.slice(1);
    button.textContent = heading.textContent.trim().replace(/\s+/g, ' ');
    button.addEventListener('click', () => {
      heading.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      guide.open = false;
    });
    $('#article-index-list').append(button);
  });
}
function updateReadingProgress() {
  readingFrame = 0;
  if (!slug) return;
  const book = $('.article-book');
  const start = book.offsetTop - innerHeight * .55;
  const end = book.offsetTop + book.offsetHeight - innerHeight * .45;
  const progress = Math.round(Math.max(0, Math.min(100, (scrollY - start) / Math.max(1, end - start) * 100)));
  $('#article-read-progress').style.setProperty('--read-progress', `${progress}%`);
  if (progress > 0) window.fieldNotes.setProgress(slug, progress);
}
function scheduleReadingProgress() {
  if (!readingFrame) readingFrame = requestAnimationFrame(updateReadingProgress);
}
function setupReadingDesk(post) {
  const save = $('#article-save');
  const refreshSave = () => {
    const saved = window.fieldNotes.isSaved(post.slug);
    save.setAttribute('aria-pressed', String(saved));
    save.textContent = saved ? '✦ NOTE SAVED' : '✧ SAVE THIS NOTE';
  };
  refreshSave();
  save.addEventListener('click', () => { window.fieldNotes.toggleSaved(post.slug); refreshSave(); });
  const previousProgress = window.fieldNotes.getProgress(post.slug);
  const resume = $('#resume-reading');
  resume.hidden = previousProgress < 5 || previousProgress >= 95;
  if (!resume.hidden) {
    resume.textContent = `RESUME AT ${previousProgress}% ↗`;
    resume.addEventListener('click', () => {
      const book = $('.article-book');
      const start = book.offsetTop - innerHeight * .55;
      const end = book.offsetTop + book.offsetHeight - innerHeight * .45;
      scrollTo({ top: start + (end - start) * previousProgress / 100, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      resume.hidden = true;
    });
  }
  window.fieldNotes.setLast(post.slug);
  const words = $('#article-content').textContent.trim().split(/\s+/).length;
  $('#article-reading-time').textContent = `${Math.max(1, Math.ceil(words / 220))} MIN READ`;
  buildPageGuide();
  addEventListener('scroll', scheduleReadingProgress, { passive: true });
  addEventListener('resize', scheduleReadingProgress);
  $('#article-content').querySelectorAll('img').forEach(image => image.addEventListener('load', scheduleReadingProgress, { once: true }));
  scheduleReadingProgress();
}
function setNavigation(id, post, label) {
  const link = document.getElementById(id);
  if (!post) { link.hidden = true; return; }
  link.href = `blog.html?post=${encodeURIComponent(post.slug)}`;
  link.innerHTML = `<small>${label}</small><strong lang="${/[가-힣]/.test(displayTitle(post)) ? 'ko' : 'en'}">${escapeHtml(displayTitle(post))}</strong><span>✧</span>`;
}
async function init() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Failed to load posts');
    const posts = await response.json();
    const index = posts.findIndex(post => post.slug === slug);
    if (index === -1) throw new Error('Post not found');
    const post = posts[index];
    document.title = `${displayTitle(post)} — Cédrai's Field Notes`;
    $('#article-counter').textContent = `${String(index+1).padStart(2,'0')} / ${String(posts.length).padStart(2,'0')}`;
    $('#article-category').textContent = categoryLabels[post.category] || post.category;
    $('#article-title').textContent = displayTitle(post);
    $('#article-title').lang = /[가-힣]/.test(displayTitle(post)) ? 'ko' : 'en';
    $('#article-date').textContent = post.date;
    $('#article-content').innerHTML = post.contentHtml;
    setupReadingDesk(post);
    setNavigation('prev-post',posts[index-1],'← PREVIOUS NOTE');
    setNavigation('next-post',posts[index+1],'NEXT NOTE →');
  } catch {
    $('#article-title').textContent = 'Field note not found.';
    $('#article-content').innerHTML = '<p>This page could not be opened. Return to the journal and choose another note.</p>';
    $('#prev-post').hidden = true;
    $('#next-post').hidden = true;
  }
}
document.addEventListener('click',event=>{
  const link = event.target.closest('a[href]');
  if (!link || link.origin !== location.origin || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  const returning = link.pathname.endsWith('/index.html');
  const destination = returning ? new URL(link.href).hash.slice(1) || 'home' : 'journal';
  const spells = { home:'Finite', about:'Revelio', work:'Accio', journal:'Aparecium', calendar:'Tempus', now:'Lumos', contact:'Alohomora' };
  const spell = spells[destination] || 'Aparecium';
  window.magicNavigate(link.href, spell, destination === 'home' ? '지도를 다시 펼칩니다' : '다음 장을 펼칩니다', destination);
});
document.getElementById('spell-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.getElementById('spell-input');
  const cast = input.value.trim().toLocaleLowerCase().replace(/[^a-z]/g, '');
  if (cast === 'expectopatronum') {
    input.value = '';
    window.castPatronus?.();
    return;
  }
  const destinations = { finite:'home', revelio:'about', accio:'work', aparecium:'journal', tempus:'calendar', lumos:'now', alohomora:'contact' };
  const destination = destinations[cast];
  if (!destination) {
    document.getElementById('spell-feedback').textContent = '주문을 찾지 못했습니다. 아래 목록에서 골라 보세요.';
    input.focus();
    return;
  }
  window.magicNavigate(`index.html#${destination}`, cast[0].toUpperCase() + cast.slice(1), '다음 장을 펼칩니다', destination);
});
init();
