// ===== Мобильное меню =====
const navToggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('primary-menu');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const opened = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(opened));
  });

  document.addEventListener('click', (e) => {
    if (!navList.contains(e.target) && !navToggle.contains(e.target)) {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

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

/* --- Запрет старта выделения вне полей формы --- */
document.addEventListener('selectstart', (e) => {
  const t = e.target;
  const tag = (t.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  e.preventDefault();
});
document.addEventListener('mousedown', (e) => {
  if (e.detail > 1) e.preventDefault();
});
document.addEventListener('touchstart', () => {}, { passive: true });

/* ===================== МАСКА ТЕЛЕФОНА ===================== */
const phoneInput = document.getElementById('phone');
const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const getLocal10 = (rawValue) => {
  let d = onlyDigits(rawValue);
  if (!d) return '';
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] === '7') d = d.slice(1);
  if (d.length > 10) d = d.slice(0, 10);
  return d;
};
const formatLocal10 = (local10) => {
  const d = local10.padEnd(10, '_').split('');
  const n = local10.length;
  if (n === 0) return '+7 ';
  if (n <= 3)  return `+7 (${d.slice(0,3).join('').replace(/_+$/,'')}`;
  if (n <= 6)  return `+7 (${d.slice(0,3).join('')}) ${d.slice(3,6).join('').replace(/_+$/,'')}`;
  if (n <= 8)  return `+7 (${d.slice(0,3).join('')}) ${d.slice(3,6).join('')}-${d.slice(6,8).join('').replace(/_+$/,'')}`;
  return           `+7 (${d.slice(0,3).join('')}) ${d.slice(3,6).join('')}-${d.slice(6,8).join('')}-${d.slice(8,10).join('').replace(/_+$/,'')}`;
};

(function initPhoneMask() {
  if (!phoneInput) return;

  phoneInput.setAttribute('inputmode', 'tel');
  phoneInput.setAttribute('autocomplete', 'tel');
  if (!phoneInput.getAttribute('placeholder')) {
    phoneInput.setAttribute('placeholder', '+7 (___) ___-__-__');
  }

  const MIN_POS = 3; // позиция после "+7 "
  const moveCaretEnd = (el) => requestAnimationFrame(() => {
    const len = el.value.length; el.setSelectionRange(len, len);
  });

  phoneInput.addEventListener('focus', () => {
    const local = getLocal10(phoneInput.value);
    phoneInput.value = formatLocal10(local);
    moveCaretEnd(phoneInput);
  });

  phoneInput.addEventListener('click', () => {
    const pos = phoneInput.selectionStart || 0;
    if (pos < MIN_POS) phoneInput.setSelectionRange(MIN_POS, MIN_POS);
  });

  phoneInput.addEventListener('keydown', (e) => {
    const pos = phoneInput.selectionStart || 0;
    if ((e.key === 'Backspace' || e.key === 'ArrowLeft') && pos <= MIN_POS) {
      e.preventDefault();
      phoneInput.setSelectionRange(MIN_POS, MIN_POS);
    }
  });

  const reformat = (sourceValue) => {
    const local = getLocal10(sourceValue);
    phoneInput.value = formatLocal10(local);
    moveCaretEnd(phoneInput);
  };

  phoneInput.addEventListener('input', () => reformat(phoneInput.value));

  phoneInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const t = (e.clipboardData || window.clipboardData).getData('text');
    reformat(t);
  });

  phoneInput.addEventListener('blur', () => {
    const local = getLocal10(phoneInput.value);
    if (!local.length) phoneInput.value = '';
  });

  if (!phoneInput.value) phoneInput.value = '';
})();

/* =============== Форма: отправка в Telegram =============== */
const form = document.querySelector('.contact-form');
const toast = document.querySelector('.form-toast');
const thanksPanel = document.querySelector('.thanks-panel');

if (form && toast) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const local10 = getLocal10(phoneInput ? phoneInput.value : fd.get('phone'));
    const message = String(fd.get('message') || '').trim();

    const normalizedPhone = local10 ? '7' + local10 : ''; // 7XXXXXXXXXX

    if (!name || !normalizedPhone) {
      showToast('Пожалуйста, заполните имя и корректный телефон.');
      return;
    }

    try {
      const resp = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: normalizedPhone,
          phone_display: phoneInput.value,
          message
        })
      });

      if (!resp.ok) throw new Error('Network error');

      showToast('Спасибо! Заявка отправлена. Мы скоро с вами свяжемся.');
      form.classList.add('sent');
      if (thanksPanel) thanksPanel.hidden = false;
      form.reset();
      if (phoneInput) phoneInput.value = '';
    } catch (err) {
      console.error(err);
      showToast('Не удалось отправить. Попробуйте ещё раз.');
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

// ===== Ripple (мышь/тач/клавиатура) — без двойных срабатываний =====
function attachRipple(selector) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    if (cs.overflow !== 'hidden') el.style.overflow = 'hidden';

    let lastPointerTs = 0; // время последнего pointerdown

    const runRipple = (x, y) => {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.ceil(Math.hypot(rect.width, rect.height)) * 1.1;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x - rect.left - size / 2}px`;
      ripple.style.top  = `${y - rect.top  - size / 2}px`;
      el.appendChild(ripple);
      requestAnimationFrame(() => ripple.classList.add('run'));
      ripple.addEventListener('animationend', () => ripple.remove());
    };

    // Универсальный источник: pointerdown
    el.addEventListener('pointerdown', (e) => {
      if (e.button && e.button !== 0) return; // игнор правой/средней кнопок
      const link = e.target.closest('a');
      if (link && link !== el) return;        // если кликаем по вложенной ссылке — не рисуем риппл на контейнере
      lastPointerTs = Date.now();
      runRipple(e.clientX, e.clientY);
    }, { passive: true });

    // Игнорируем «синтетический» click сразу после pointerdown (тач)
    el.addEventListener('click', (e) => {
      if (Date.now() - lastPointerTs < 400) {
        return; // это клик, который следует за тачем — не повторяем действие
      }
      // На десктопе могли получить click без pointerdown (например, через клавиатуру)
      const rect = el.getBoundingClientRect();
      runRipple(e.clientX || rect.left + rect.width / 2,
                e.clientY || rect.top  + rect.height / 2);
    }, { passive: true });

    // Клавиатура (Enter/Space)
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const rect = el.getBoundingClientRect();
      runRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  });
}
attachRipple('.btn, .card');
