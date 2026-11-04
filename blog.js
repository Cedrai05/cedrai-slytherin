const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = new URLSearchParams(location.search).get('post');
function setNavigation(id, post, label) {
  const link = document.getElementById(id);
  if (!post) { link.hidden = true; return; }
  link.href = `blog.html?post=${encodeURIComponent(post.slug)}`;
  link.innerHTML = `<small>${label}</small><strong>${escapeHtml(post.title)}</strong><span>✧</span>`;
}
async function init() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Failed to load posts');
    const posts = await response.json();
    const index = posts.findIndex(post => post.slug === slug);
    if (index === -1) throw new Error('Post not found');
    const post = posts[index];
    document.title = `${post.title} — Cédrai's Field Notes`;
    $('#article-counter').textContent = `${String(index+1).padStart(2,'0')} / ${String(posts.length).padStart(2,'0')}`;
    $('#article-category').textContent = post.category;
    $('#article-title').textContent = post.title;
    $('#article-date').textContent = post.date;
    $('#article-content').innerHTML = post.contentHtml;
    setNavigation('prev-post',posts[index-1],'← PREVIOUS NOTE');
    setNavigation('next-post',posts[index+1],'NEXT NOTE →');
  } catch {
    $('#article-title').textContent = '기록을 찾을 수 없습니다.';
    $('#article-content').innerHTML = '<p>이 글은 현재 마법서에서 열 수 없습니다. 목록으로 돌아가 다른 기록을 골라주세요.</p>';
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
