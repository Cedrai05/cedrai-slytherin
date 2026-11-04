const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = new URLSearchParams(location.search).get('post');
const categoryLabels = { 'CTF/Wargame':'CTF / WARGAME', '블로그/기술문서':'TECH NOTES', '논문/컨퍼런스':'PAPERS / CONFERENCES' };
const titleLabels = { 'tistory-32':'File Upload', 'tistory-28':'Digital Forensics: Landscape and Response', 'tistory-8':'File Download' };
const displayTitle = post => titleLabels[post.slug] || post.title;
function setNavigation(id, post, label) {
  const link = document.getElementById(id);
  if (!post) { link.hidden = true; return; }
  link.href = `blog.html?post=${encodeURIComponent(post.slug)}`;
  link.innerHTML = `<small>${label}</small><strong>${escapeHtml(displayTitle(post))}</strong><span>✧</span>`;
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
  window.magicNavigate(link.href, returning ? 'Finite' : 'Aparecium', returning ? 'RETURNING TO THE MAP' : 'TURNING THE PAGE');
});
init();
