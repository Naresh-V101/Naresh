const preloader = document.createElement('div');
preloader.className = 'preloader';
preloader.innerHTML = '<div class="preloader-inner"><div class="preloader-frame"><i class="preloader-corner"></i><i class="preloader-corner"></i><i class="preloader-corner"></i><i class="preloader-corner"></i><div class="preloader-mark">NV</div></div><p class="preloader-kicker">Preparing the atelier</p><div class="preloader-track"><div class="preloader-progress"></div></div><div class="preloader-meta"><span>Naresh V. / AI &amp; DS</span><span>Loading</span></div></div>';
document.body.prepend(preloader);

window.addEventListener('load', () => {
  window.setTimeout(() => preloader.classList.add('is-done'), 3350);
});

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