document.addEventListener('DOMContentLoaded', () => {

  // iOS Safari включает :active (подсветку при нажатии) только при наличии touch-обработчика
  document.addEventListener('touchstart', () => {}, { passive: true });

  /* ---------- Шапка: фон плотнее после прокрутки (где баннер заходит под шапку) ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Бургер-меню ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const toggleMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => toggleMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) toggleMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => { if (e.matches) toggleMenu(false); });

  /* ---------- Выпадающие пункты меню: мегаменю «Каталог» и «Услуги» (на десктопе — по наведению) ---------- */
  const desktop = window.matchMedia('(min-width: 1025px)');
  const drops = [];
  document.querySelectorAll('.nav__drop-btn').forEach((btn) => {
    const item = btn.closest('.nav__item');
    let timer = 0;
    const setDrop = (open) => { clearTimeout(timer); btn.setAttribute('aria-expanded', open); };
    drops.push(setDrop);
    btn.addEventListener('click', () => setDrop(btn.getAttribute('aria-expanded') !== 'true'));
    // При уходе курсора меню закрывается с задержкой: можно спокойно вести мышь к списку,
    // даже медленно или наискосок через промежуток под пунктом
    item.addEventListener('mouseenter', () => {
      if (!desktop.matches) return;
      drops.forEach((d) => { if (d !== setDrop) d(false); });
      setDrop(true);
    });
    item.addEventListener('mouseleave', () => {
      if (!desktop.matches) return;
      clearTimeout(timer);
      timer = setTimeout(() => btn.setAttribute('aria-expanded', 'false'), 350);
    });
    item.addEventListener('focusout', (e) => { if (desktop.matches && !item.contains(e.relatedTarget)) setDrop(false); });
    document.addEventListener('click', (e) => { if (desktop.matches && !item.contains(e.target)) setDrop(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrop(false); });
  });

  /* ---------- Видеобаннер ---------- */
  const video = document.getElementById('heroVideo');
  if (video) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    } else if ('IntersectionObserver' in window) {
      // Видео играет только когда видно на экране — экономит батарею и трафик
      new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? video.play().catch(() => {}) : video.pause();
      }, { threshold: 0.2 }).observe(video);
    }
  }

  /* ---------- Слайдер (нативный scroll-snap + стрелки) ---------- */
  document.querySelectorAll('[data-slider-prev], [data-slider-next]').forEach((btn) => {
    const slider = document.getElementById(btn.dataset.sliderPrev || btn.dataset.sliderNext);
    const dir = btn.dataset.sliderPrev ? -1 : 1;
    btn.addEventListener('click', () => {
      const card = slider.firstElementChild;
      const gap = parseFloat(getComputedStyle(slider).columnGap) || 0;
      slider.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: 'smooth' });
    });
    // Неактивная стрелка на краю — темнее (disabled)
    const update = () => {
      const max = slider.scrollWidth - slider.clientWidth - 1;
      btn.disabled = dir < 0 ? slider.scrollLeft <= 0 : slider.scrollLeft >= max;
    };
    slider.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Полоса прогресса слайдера «Как мы работаем» ---------- */
  const steps = document.getElementById('stepsSlider');
  const stepsBar = document.querySelector('.steps-nav__bar span');
  if (steps && stepsBar) {
    const updateBar = () => {
      const max = steps.scrollWidth - steps.clientWidth;
      const k = max > 0 ? steps.clientWidth / steps.scrollWidth : 1;
      stepsBar.style.setProperty('--size', k * 100 + '%');
      stepsBar.style.setProperty('--size-k', k);
      stepsBar.style.setProperty('--pos', max > 0 ? steps.scrollLeft / max : 0);
    };
    steps.addEventListener('scroll', updateBar, { passive: true });
    window.addEventListener('resize', updateBar);
    updateBar();
  }

  /* ---------- Бегущая строка логотипов: дублируем ряд для бесшовной анимации ---------- */
  const logos = document.getElementById('logos');
  if (logos) {
    const originals = [...logos.children];
    originals.forEach((li) => {
      const copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      logos.append(copy);
    });
    // Цвет логотипа включает скрипт по координатам курсора — без :hover и событий
    // входа/выхода: лента едет под курсором, и браузеры шлют эти события непоследовательно.
    // Каждый кадр: цветной только логотип под курсором (вместе с копией — на стыке круга
    // под курсором оказывается копия); ушёл курсор с логотипа или из ленты → снова серый.
    // Класс меняется только при смене состояния, чтобы переход не перезапускался.
    const items = [...logos.children];
    const marquee = logos.closest('.marquee');
    const n = originals.length;
    const active = new Set();
    let pointer = null;
    const setActive = (i, on) => {
      if (on === active.has(i)) return;
      if (on) active.add(i); else active.delete(i);
      items[i].classList.toggle('is-active', on);
      items[i + n].classList.toggle('is-active', on);
    };
    const tick = () => {
      requestAnimationFrame(tick);
      const box = marquee.getBoundingClientRect();
      const inside = pointer && pointer.x >= box.left && pointer.x <= box.right
        && pointer.y >= box.top && pointer.y <= box.bottom;
      const hovered = new Set();
      if (inside) {
        items.forEach((item, k) => {
          const r = item.getBoundingClientRect();
          if (pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom) hovered.add(k % n);
        });
      }
      active.forEach((i) => { if (!hovered.has(i)) setActive(i, false); });
      hovered.forEach((i) => setActive(i, true));
    };
    window.addEventListener('pointermove', (e) => {
      pointer = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null;
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { pointer = null; });
    requestAnimationFrame(tick);
  }

  /* ---------- Выпадающий список «Тип склада» (по UI kit, с клавиатурой) ---------- */
  const selects = [...document.querySelectorAll('[data-select]')].map((root) => {
    const btn = root.querySelector('.form__select-btn');
    const list = root.querySelector('.form__options');
    const value = root.querySelector('.form__select-value');
    const input = root.querySelector('input[type="hidden"]');
    const options = [...list.querySelectorAll('[role="option"]')];
    const placeholder = value.textContent;
    let focused = -1;

    const focusOption = (i) => {
      options.forEach((o) => o.classList.remove('is-focused'));
      focused = (i + options.length) % options.length;
      options[focused].classList.add('is-focused');
      list.setAttribute('aria-activedescendant', options[focused].id);
    };
    const open = () => {
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      const sel = options.findIndex((o) => o.getAttribute('aria-selected') === 'true');
      focusOption(sel >= 0 ? sel : 0);
      list.focus({ preventScroll: true });
    };
    const close = (returnFocus) => {
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus({ preventScroll: true });
    };
    const choose = (val) => {
      const opt = options.find((o) => o.dataset.value === val);
      options.forEach((o) => o.setAttribute('aria-selected', String(o === opt)));
      input.value = opt ? val : '';
      value.textContent = opt ? opt.textContent : placeholder;
    };

    btn.addEventListener('click', () => (list.hidden ? open() : close(true)));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    list.addEventListener('click', (e) => {
      const opt = e.target.closest('[role="option"]');
      if (!opt) return;
      choose(opt.dataset.value);
      close(true);
    });
    list.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); focusOption(focused + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); focusOption(focused - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[focused].dataset.value); close(true); }
      else if (e.key === 'Escape') { close(true); }
      else if (e.key === 'Tab') { close(false); }
    });
    document.addEventListener('click', (e) => { if (!root.contains(e.target) && !list.hidden) close(false); });
    return { name: input.name, choose };
  });

  /* ---------- Плитки «Какой склад» подставляют тип склада в форму ---------- */
  document.querySelectorAll('[data-warehouse]').forEach((tile) => {
    tile.addEventListener('click', () => {
      const select = selects.find((sel) => sel.name === 'warehouse');
      if (select) select.choose(tile.dataset.warehouse);
    });
  });

  /* ---------- Маска телефона ---------- */
  document.querySelectorAll('[data-phone]').forEach((input) => {
    const format = (value) => {
      let d = value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
      let out = '+7';
      if (p[0]) out += ` (${p[0]}`;
      if (p[0].length === 3) out += ')';
      if (p[1]) out += ` ${p[1]}`;
      if (p[2]) out += `-${p[2]}`;
      if (p[3]) out += `-${p[3]}`;
      return out;
    };
    input.addEventListener('focus', () => { if (!input.value) input.value = '+7'; });
    input.addEventListener('blur', () => { if (input.value === '+7') input.value = ''; });
    input.addEventListener('input', () => { input.value = format(input.value); });
  });

  /* ---------- Форма заявки ---------- */
  const form = document.getElementById('requestForm');
  if (form) {
    // ошибка снимается, как только номер введён полностью
    form.elements.phone.addEventListener('input', (e) => {
      const field = e.target.closest('.form__field');
      if (field.classList.contains('is-invalid') && e.target.value.replace(/\D/g, '').length === 11) field.classList.remove('is-invalid');
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone = form.elements.phone;
      const agree = form.elements.agree;
      const phoneOk = phone.value.replace(/\D/g, '').length === 11;

      phone.closest('.form__field').classList.toggle('is-invalid', !phoneOk);
      agree.closest('.form__check').classList.toggle('is-invalid', !agree.checked);
      if (!phoneOk) { phone.focus(); return; }
      if (!agree.checked) return;

      // TODO: отправка на бэкенд заказчика (fetch / обработчик CMS)
      form.querySelector('.form__success').hidden = false;
      form.reset();
      selects.forEach((sel) => sel.choose(''));
    });
  }
});
