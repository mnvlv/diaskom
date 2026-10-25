document.addEventListener('DOMContentLoaded', () => {

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

  /* ---------- Выпадающее меню «Стеллажи» ---------- */
  const dropBtn = document.querySelector('.nav__drop-btn');
  if (dropBtn) {
    const dropItem = dropBtn.closest('.nav__item--drop');
    const setDrop = (open) => dropBtn.setAttribute('aria-expanded', open);
    const desktop = window.matchMedia('(min-width: 1025px)');
    dropBtn.addEventListener('click', () => setDrop(dropBtn.getAttribute('aria-expanded') !== 'true'));
    dropItem.addEventListener('mouseenter', () => { if (desktop.matches) setDrop(true); });
    dropItem.addEventListener('mouseleave', () => { if (desktop.matches) setDrop(false); });
    dropItem.addEventListener('focusout', (e) => { if (!dropItem.contains(e.relatedTarget)) setDrop(false); });
    document.addEventListener('click', (e) => { if (!dropItem.contains(e.target)) setDrop(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrop(false); });
  }

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
    // Каждый кадр: курсор внутри ленты → красим логотип под ним (вместе с копией —
    // на стыке круга под курсором оказывается копия); курсор вне ленты → всё серое.
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
      if (!inside) {
        active.forEach((i) => setActive(i, false));
        return;
      }
      items.forEach((item, k) => {
        const r = item.getBoundingClientRect();
        if (pointer.x >= r.left && pointer.x <= r.right) setActive(k % n, true);
      });
    };
    window.addEventListener('pointermove', (e) => {
      pointer = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null;
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { pointer = null; });
    requestAnimationFrame(tick);
  }

  /* ---------- Плитки «Какой склад» подставляют тип склада в форму ---------- */
  document.querySelectorAll('[data-warehouse]').forEach((tile) => {
    tile.addEventListener('click', () => {
      const select = document.querySelector('#requestForm select[name="warehouse"]');
      if (select) select.value = tile.dataset.warehouse;
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
    });
  }
});
