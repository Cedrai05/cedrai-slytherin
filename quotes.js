(() => {
  const passages = [
    {
      page: 'home', after: '.chapter-grid',
      english: 'I solemnly swear that I am up to no good.',
      korean: '나는 엄숙히 맹세한다. 장난을 치겠다고.',
      credit: 'THE MARAUDER’S MAP · PRISONER OF AZKABAN',
      source: 'https://www.harrypotter.com/fact-file/objects/the-marauders-map'
    },
    {
      page: 'about', after: '.about-layout',
      english: 'It is our choices, Harry, that show what we truly are, far more than our abilities.',
      korean: '해리, 우리의 진정한 모습을 보여 주는 건 능력보다 우리가 내리는 선택이야.',
      credit: 'ALBUS DUMBLEDORE · CHAMBER OF SECRETS',
      source: 'https://www.harrypotter.com/features/what-professor-quirrell-taught-harry-outside-the-classroom'
    },
    {
      page: 'work', after: '.work-list',
      english: 'We are only as strong as we are united, as weak as we are divided.',
      korean: '우리는 하나로 뭉칠 때 강하고, 갈라질 때 약해진다.',
      credit: 'ALBUS DUMBLEDORE · GOBLET OF FIRE',
      source: 'https://www.harrypotter.com/features/the-importance-of-dumbledores-many-armies'
    },
    {
      page: 'journal', after: '.journal-shell',
      english: 'Of course it is happening inside your head, Harry, but why on earth should that mean that it is not real?',
      korean: '물론 네 머릿속에서 일어나는 일이야, 해리. 그렇다고 진짜가 아니라는 뜻은 아니잖니?',
      credit: 'ALBUS DUMBLEDORE · DEATHLY HALLOWS',
      source: 'https://www.harrypotter.com/features/the-chapter-that-made-us-fall-in-love-with-albus-dumbledore'
    },
    {
      page: 'now', after: '.now-layout',
      english: 'Happiness can be found, even in the darkest of times, if one only remembers to turn on the light.',
      korean: '가장 어두운 순간에도 행복은 찾을 수 있어. 빛을 켜는 일을 기억하기만 한다면.',
      credit: 'ALBUS DUMBLEDORE · PRISONER OF AZKABAN FILM',
      source: 'https://www.harrypotter.com/quiz/do-you-know-which-harry-potter-film-this-is'
    }
  ];

  const quotes = passages.flatMap(({ page, before, after, english, korean, credit, source }) => {
    const section = document.getElementById(page);
    const anchor = section?.querySelector(before || after);
    if (!anchor) return [];

    const quote = document.createElement('blockquote');
    quote.className = `archive-quote archive-quote--${page}`;
    const original = document.createElement('p');
    original.className = 'archive-quote__original';
    original.lang = 'en';
    original.textContent = `“${english}”`;
    const translation = document.createElement('p');
    translation.className = 'archive-quote__translation';
    translation.lang = 'ko';
    translation.textContent = korean;
    const cite = document.createElement('cite');
    const link = document.createElement('a');
    link.href = source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `${credit} ↗`;
    cite.append(link);
    quote.append(original, translation, cite);
    anchor.insertAdjacentElement(before ? 'beforebegin' : 'afterend', quote);
    return [quote];
  });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .13 });
  quotes.forEach(quote => {
    quote.classList.add('is-quote-pending');
    observer.observe(quote);
  });
})();
