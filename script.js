if (document.body.classList.contains('preload-page')) {
  const preloader = document.querySelector('.preloader');
  window.addEventListener('load', () => {
    window.setTimeout(() => preloader?.classList.add('is-done'), 3350);
  });
}

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.desktop-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('mobile-open', !isOpen);
});

document.querySelectorAll('.desktop-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('mobile-open');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const toolsList = document.querySelector('.arsenal-grid article:last-child ul');
if (toolsList && !toolsList.querySelector('[data-skill="blender"]')) {
  const blenderItem = document.createElement('li');
  blenderItem.dataset.skill = 'blender';
  blenderItem.innerHTML = '<strong>Blender</strong><small>3D Design</small>';
  toolsList.appendChild(blenderItem);
}

document.querySelectorAll('h1').forEach((heading) => {
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    [...node.textContent].forEach((character) => {
      if (character === ' ') {
        fragment.appendChild(document.createTextNode(' '));
        return;
      }
      const letter = document.createElement('span');
      letter.className = 'draggable-letter';
      letter.textContent = character;
      fragment.appendChild(letter);
    });
    node.replaceWith(fragment);
  });
});

document.querySelectorAll('.draggable-letter').forEach((letter) => {
  let startY = 0;

  letter.addEventListener('pointerdown', (event) => {
    startY = event.clientY;
    letter.classList.add('dragging');
    letter.setPointerCapture(event.pointerId);
  });

  letter.addEventListener('pointermove', (event) => {
    if (!letter.hasPointerCapture(event.pointerId)) return;
    const distance = Math.abs(event.clientY - startY) + Math.abs(event.clientX - letter.getBoundingClientRect().left);
    letter.style.transform = `translateY(${Math.max(-34, -Math.max(14, distance / 3))}px)`;
  });

  letter.addEventListener('pointerup', (event) => {
    letter.releasePointerCapture(event.pointerId);
    letter.classList.remove('dragging');
    letter.classList.add('lifted');
    letter.style.transform = '';
  });
});

const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  formStatus.textContent = 'Sending signal...';
  formStatus.className = 'form-status';

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: new URLSearchParams(new FormData(contactForm)),
    });
    const result = await response.json();
    formStatus.textContent = result.message;
    formStatus.classList.add(response.ok ? 'success' : 'error');
    if (response.ok) contactForm.reset();
  } catch {
    formStatus.textContent = 'The signal server is unavailable. Please try again later.';
    formStatus.classList.add('error');
  }
});

document.addEventListener('pointermove', (event) => {
  const glow = document.querySelector('.cursor-glow');
  if (glow) {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }
});

// Theme: light/dark toggle, persisted, respects OS preference.
(() => {
  const toggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  const KEY = 'nv-theme';
  const apply = (theme) => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
    toggle?.setAttribute('aria-pressed', String(theme === 'light'));
    const icon = toggle?.querySelector('span');
    if (icon) icon.textContent = theme === 'light' ? '☀' : '☾';
  };
  let initial = 'dark';
  try { initial = localStorage.getItem(KEY) || initial; } catch { /* ignore */ }
  if (!localStorage.getItem?.(KEY)) {
    try {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) initial = 'light';
    } catch { /* ignore */ }
  }
  apply(initial);
  toggle?.addEventListener('click', () => {
    apply(root.dataset.theme === 'light' ? 'dark' : 'light');
  });
})();

// Motion polish: scroll progress, magnetic buttons, reveal stagger.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!reduceMotion) {
    document.querySelectorAll('.pillar-grid article, .arsenal-grid article, .project-list .project').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
    });
  }

  if (!reduceMotion && finePointer) {
    document.querySelectorAll('.button, .header-cta').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.transform = `translate(${dx * 6}px, ${dy * 6}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }
})();