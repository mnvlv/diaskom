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
    [...logos.children].forEach((li) => {
      const copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      logos.append(copy);
    });
    // Лента не останавливается, поэтому логотип уезжает из-под курсора:
    // окрашенный логотип остаётся цветным, пока курсор в пределах ленты
    logos.addEventListener('mouseover', (e) => {
      const partner = e.target.closest('.partner');
      if (partner) partner.classList.add('is-active');
    });
    logos.closest('.marquee').addEventListener('mouseleave', () => {
      logos.querySelectorAll('.is-active').forEach((p) => p.classList.remove('is-active'));
    });
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
