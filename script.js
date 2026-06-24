/* ============================================================
   KashRun — script.js
   Vanilla JS only — no frameworks, no build step.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initRestaurants();
  initScrollAnimations();
  initSearchForm();
  initPartnerButton();
  initBackToTop();
  initActiveNavLink();
});

/* ---------- Sticky navbar shadow on scroll ---------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 8) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Mobile menu toggle ---------- */
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove('open');
    toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  };

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  });

  menu.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  const mobileLoginBtn = menu.querySelector('.mobile-login');
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', () => {
      closeMenu();
      window.dispatchEvent(new CustomEvent('kashrun:login'));
    });
  }
}

/* ---------- Restaurant data + card rendering ---------- */
const RESTAURANTS = [
  {
    name: 'Kulgam Wazwan House',
    cuisine: 'Kashmiri • Wazwan • Mughlai',
    image: 'https://images.unsplash.com/photo-1631292784640-2b24be784d5d?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    time: '35-45 min',
    fee: '₹30',
  },
  {
    name: 'Valley Bites',
    cuisine: 'Fast Food • Rolls • Shawarma',
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=800&auto=format&fit=crop',
    rating: 4.4,
    time: '20-30 min',
    fee: '₹20',
  },
  {
    name: 'Saffron Crust Pizzeria',
    cuisine: 'Pizza • Italian',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop',
    rating: 4.5,
    time: '25-35 min',
    fee: '₹25',
  },
  {
    name: 'Kashir Bakers',
    cuisine: 'Bakery • Czochwor • Desserts',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    time: '15-25 min',
    fee: '₹15',
  },
];

function initRestaurants() {
  const grid = document.getElementById('restaurantGrid');
  if (!grid) return;

  const cardsHTML = RESTAURANTS.map((r, i) => `
    <div class="restaurant-card" data-animate="fade-up" style="--delay:${i}">
      <div class="restaurant-card__image-wrap">
        <img src="${r.image}" alt="${r.name}" loading="lazy" />
        <div class="restaurant-card__rating">
          <i class="fa-solid fa-star"></i>
          <span>${r.rating}</span>
        </div>
      </div>
      <div class="restaurant-card__body">
        <h3>${r.name}</h3>
        <p class="cuisine">${r.cuisine}</p>
        <div class="restaurant-card__meta">
          <span><i class="fa-regular fa-clock"></i> ${r.time}</span>
          <span><i class="fa-solid fa-truck"></i> ${r.fee}</span>
        </div>
      </div>
    </div>
  `).join('');

  grid.innerHTML = cardsHTML;

  // Newly injected nodes need to be (re)observed for scroll-reveal
  grid.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
}

/* ---------- Scroll-triggered fade/slide animations ---------- */
let observer;

function initScrollAnimations() {
  const targets = document.querySelectorAll('[data-animate]');

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ---------- Search form (front-end only) ---------- */
function initSearchForm() {
  const form = document.getElementById('searchForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const location = document.getElementById('locationInput').value.trim();
    const query = document.getElementById('searchInput').value.trim();

    const restaurantsSection = document.getElementById('restaurants');
    if (restaurantsSection) {
      restaurantsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Placeholder hook point for real search/filtering logic later.
    console.log('Search submitted:', { location, query });
  });
}

/* ---------- Partner CTA (placeholder action) ---------- */
function initPartnerButton() {
  const btn = document.getElementById('partnerBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('kashrun:partner-interest'));
    btn.textContent = 'Thanks! We\'ll be in touch';
    btn.disabled = true;
    btn.style.opacity = '0.85';
    btn.style.cursor = 'default';
  });
}

/* ---------- Back to top button ---------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const toggleVisibility = () => {
    if (window.scrollY > 480) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- Highlight active nav link on scroll ---------- */
function initActiveNavLink() {
  const sections = ['home', 'restaurants', 'about', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}
