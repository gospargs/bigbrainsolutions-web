// Scroll-triggered entrance for [data-reveal] elements, loaded site-wide from BaseLayout. Plays once per
// page load. Elements start visible and are only hidden here, so without JS or with reduced motion
// they simply stay visible. Styles live in src/styles/global.css.
const DURATION_MS = 750; // Keep in sync with the transition in global.css.
const STAGGER_MS = 140;

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Anything already on screen at load stays put rather than flashing out and back in.
  const pending = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );

  // Shared across observer batches, so slow scrolling can't reorder cards or shrink the gap between
  // them, while a card reached on its own (stacked on mobile) has no added lag.
  let nextStart = 0;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          const el = entry.target as HTMLElement;
          const now = performance.now();
          const delay = Math.max(0, nextStart - now);
          nextStart = now + delay + STAGGER_MS;
          obs.unobserve(el);
          el.style.setProperty('--reveal-delay', `${delay}ms`);
          el.classList.add('bb-reveal--active');
          el.classList.remove('bb-reveal--pending');
          // Hand transitions back to the component so its hover behavior is unaffected afterwards.
          window.setTimeout(() => {
            el.classList.remove('bb-reveal--active');
            el.style.removeProperty('--reveal-delay');
          }, delay + DURATION_MS);
        });
    },
    { rootMargin: '0px 0px -15% 0px' },
  );

  pending.forEach((el) => {
    el.classList.add('bb-reveal--pending');
    observer.observe(el);
  });
}
