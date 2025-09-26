// ===== Мобильное меню =====
const navToggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('primary-menu');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const opened = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(opened));
  });

  // Закрытие по клику вне меню
  document.addEventListener('click', (e) => {
    if (!navList.contains(e.target) && !navToggle.contains(e.target)) {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Закрытие по Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });
}

// ===== Год в футере =====
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* --- Запрет старта выделения вне полей формы (синее полотно) --- */
document.addEventListener('selectstart', (e) => {
  const t = e.target;
  const tag = (t.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  e.preventDefault();
});

/* --- Блокируем дабл-клик-выделение/протяжку по странице --- */
document.addEventListener('mousedown', (e) => {
  if (e.detail > 1) e.preventDefault();
});

/* --- На мобильных: гасим длительное удержание --- */
document.addEventListener('touchstart', () => {}, { passive: true });

// ===== Форма: валидация + ОТПРАВКА В TELEGRAM + тост =====
const form = document.querySelector('.contact-form');
const toast = document.querySelector('.form-toast');

if (form && toast) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const message = String(fd.get('message') || '').trim();

    if (!name || !phone) {
      showToast('Пожалуйста, заполните имя и телефон.');
      return;
    }

    // === ОТПРАВКА НА СЕРВЕРНЫЙ ЭНДПОЙНТ /api/telegram ===
    try {
      const resp = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message })
      });

      if (!resp.ok) throw new Error('Network error');

      showToast('Спасибо! Заявка отправлена в Telegram.');
      form.reset();
    } catch (err) {
      console.error(err);
      showToast('Не удалось отправить в Telegram. Попробуйте ещё раз.');
    }
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  toast.style.display = 'block';
  toast.animate(
    [{ transform: 'translateY(6px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
    { duration: 160, easing: 'ease-out' }
  );
  setTimeout(() => {
    toast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    setTimeout(() => { toast.hidden = true; toast.style.display = 'none'; }, 210);
  }, 3200);
}

// ===== Трендовый клик: Ripple (мышь/тач/клавиатура) =====
function attachRipple(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    if (cs.overflow !== 'hidden') el.style.overflow = 'hidden';

    const runRipple = (x, y) => {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.ceil(Math.sqrt(rect.width ** 2 + rect.height ** 2)) * 1.1;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x - rect.left - size / 2}px`;
      ripple.style.top = `${y - rect.top - size / 2}px`;
      el.appendChild(ripple);
      requestAnimationFrame(() => ripple.classList.add('run'));
      ripple.addEventListener('animationend', () => ripple.remove());
    };

    // Мышь
    el.addEventListener('click', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'a' && e.target !== el) return;
      runRipple(e.clientX, e.clientY);
    });

    // Тач
    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (t) runRipple(t.clientX, t.clientY);
    }, { passive: true });

    // Клавиатура
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const rect = el.getBoundingClientRect();
      runRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  });
}
attachRipple('.btn, .card');
