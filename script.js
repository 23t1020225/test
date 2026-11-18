// Trang HTML/CSS/JS thuần: không cần thư viện hay máy chủ.
(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const views = Array.from(document.querySelectorAll('.view'));
  const steps = Array.from(document.querySelectorAll('[data-view]'));
  const cover = byId('cover-view');
  const envelope = byId('envelope');
  const openButton = byId('open-letter');
  const lightbox = byId('lightbox');
  const cards = Array.from(document.querySelectorAll('.polaroid'));
  const photoStage = byId('photo-stage');
  const nav = byId('journey-nav');

  // Nhạc nền được lưu cục bộ; trình duyệt chỉ phát sau thao tác của người xem.
  const backgroundMusic = byId('background-music');
  const musicVolume = byId('music-volume');
  const musicButtons = Array.from(document.querySelectorAll('[data-music-toggle]'));
  let startMusicOnOpen = true;
  backgroundMusic.volume = Number(musicVolume.value) / 100;

  function syncMusicButtons() {
    const playing = !backgroundMusic.paused;
    musicButtons.forEach((button) => {
      button.classList.toggle('is-playing', playing);
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? 'Tắt nhạc nền' : 'Bật nhạc nền');
      button.title = playing ? 'Nhạc đang phát — bấm để tắt' : 'Bật nhạc nền';
    });
  }

  function playBackgroundMusic() {
    const playback = backgroundMusic.play();
    if (playback && typeof playback.catch === 'function') playback.catch(syncMusicButtons);
  }

  musicButtons.forEach((button) => button.addEventListener('click', () => {
    if (backgroundMusic.paused) {
      startMusicOnOpen = true;
      playBackgroundMusic();
    } else {
      startMusicOnOpen = false;
      backgroundMusic.pause();
    }
  }));
  backgroundMusic.addEventListener('play', syncMusicButtons);
  backgroundMusic.addEventListener('pause', syncMusicButtons);
  backgroundMusic.addEventListener('error', syncMusicButtons);
  musicVolume.addEventListener('input', () => {
    backgroundMusic.volume = Number(musicVolume.value) / 100;
    byId('music-volume-label').textContent = musicVolume.value + '%';
  });


  let activeView = 'cover-view';
  let opening = false;
  let typingFinished = false;
  let activePhoto = 0;
  let photoBusy = false;
  let openingTimer;
  let typingTimer;
  let photoTimer;
  let typingRow = 0;
  let typingCharacter = 0;
  let pointerStart = null;
  let suppressPhotoClickUntil = 0;
  let lightboxTouchStart = null;
  const unlocked = new Set();

  // Tách theo ký tự hiển thị để dấu tiếng Việt và emoji không bị cắt đôi.
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('vi', { granularity: 'grapheme' })
    : null;
  const splitText = (text) => segmenter
    ? Array.from(segmenter.segment(text), (part) => part.segment)
    : Array.from(text);

  const letterRows = Array.from(document.querySelectorAll('[data-type]')).map((paragraph) => {
    const fullText = paragraph.textContent.trim();
    const reserve = document.createElement('span');
    const typed = document.createElement('span');
    const accessible = document.createElement('span');
    reserve.className = 'text-reserve';
    reserve.textContent = fullText;
    reserve.setAttribute('aria-hidden', 'true');
    typed.className = 'typed-text';
    typed.setAttribute('aria-hidden', 'true');
    accessible.className = 'sr-only';
    accessible.textContent = fullText;
    paragraph.replaceChildren(reserve, typed, accessible);
    return { paragraph, typed, fullText, characters: splitText(fullText) };
  });

  function updateNavigation() {
    nav.hidden = activeView === 'cover-view';
    byId('restart').hidden = activeView === 'cover-view';
    steps.forEach((button) => {
      button.disabled = !unlocked.has(button.dataset.view);
      if (button.dataset.view === activeView) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }

  function showView(id) {
    if (!unlocked.has(id)) return;
    activeView = id;
    views.forEach((view) => { view.hidden = view.id !== id; });
    updateNavigation();
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heading = byId(id).querySelector('h1, h2');
    heading?.focus({ preventScroll: true });
    if (id === 'album-view') {
      cards.forEach((card) => { card.querySelector('img').loading = 'eager'; });
      updatePhotos();
    }
  }

  // Các trái tim được tạo khi mở dấu sáp và nhận vé; tự xóa khi bay xong.
  function burstHearts(element, count = 18) {
    if (reducedMotion.matches) return;
    const bounds = element.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('span');
      const angle = (index / count) * Math.PI * 2;
      const distance = 65 + Math.random() * 115;
      particle.className = 'fx-heart';
      particle.textContent = index % 4 ? '♥' : '✦';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.setProperty('--heart-x', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--heart-y', Math.sin(angle) * distance - 75 + 'px');
      particle.style.setProperty('--heart-turn', index * 37 + 'deg');
      particle.style.setProperty('--heart-scale', String(.6 + Math.random() * .6));
      particle.style.setProperty('--heart-color', ['#91485c', '#c58e94', '#b38f70'][index % 3]);
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
      byId('fx-layer').append(particle);
    }
  }

  function openEnvelope() {
    if (opening || activeView !== 'cover-view') return;
    opening = true;
    if (startMusicOnOpen && backgroundMusic.paused) playBackgroundMusic();
    openButton.disabled = true;
    envelope.disabled = true;
    openButton.setAttribute('aria-expanded', 'true');
    envelope.setAttribute('aria-expanded', 'true');
    byId('opening-status').textContent = 'Một chút dịu dàng đang tới…';
    burstHearts(byId('wax-seal'));
    cover.classList.add('opening');
    const revealLetter = () => {
      opening = false;
      unlocked.add('letter-view');
      showView('letter-view');
      startTyping();
    };
    if (reducedMotion.matches) revealLetter();
    else openingTimer = window.setTimeout(revealLetter, 1450);
  }

  function startTyping() {
    window.clearTimeout(typingTimer);
    typingFinished = false;
    typingRow = 0;
    typingCharacter = 0;
    letterRows.forEach((row) => {
      row.typed.textContent = '';
      row.paragraph.classList.remove('current-line');
    });
    byId('letter-copy').setAttribute('aria-busy', 'true');
    byId('skip-typing').hidden = false;
    byId('next-to-album').hidden = true;
    byId('writing-status').replaceChildren();
    const dot = document.createElement('span');
    dot.className = 'writing-dot';
    dot.setAttribute('aria-hidden', 'true');
    byId('writing-status').append(dot, 'Em đang viết vài điều cho anh…');
    if (reducedMotion.matches) finishTyping();
    else typingTimer = window.setTimeout(typeNextCharacter, 450);
  }

  function typeNextCharacter() {
    if (typingFinished) return;
    const row = letterRows[typingRow];
    if (!row) { finishTyping(); return; }
    row.paragraph.classList.add('current-line');
    typingCharacter += 1;
    row.typed.textContent = row.characters.slice(0, typingCharacter).join('');
    const character = row.characters[typingCharacter - 1];
    if (typingCharacter >= row.characters.length) {
      row.paragraph.classList.remove('current-line');
      typingRow += 1;
      typingCharacter = 0;
      typingTimer = window.setTimeout(typeNextCharacter, 360);
      return;
    }
    const delay = /[.!?…]/u.test(character) ? 200 : /[,;]/u.test(character) ? 105 : /\s/u.test(character) ? 13 : 26;
    typingTimer = window.setTimeout(typeNextCharacter, delay);
  }

  function finishTyping() {
    window.clearTimeout(typingTimer);
    typingFinished = true;
    letterRows.forEach((row) => {
      row.typed.textContent = row.fullText;
      row.paragraph.classList.remove('current-line');
    });
    byId('letter-copy').setAttribute('aria-busy', 'false');
    byId('skip-typing').hidden = true;
    byId('next-to-album').hidden = false;
    byId('writing-status').textContent = 'Gửi anh, bằng tất cả thương yêu.';
    unlocked.add('album-view');
    updateNavigation();
  }

  // Xếp lại chồng ảnh: ảnh chính phía trước và hai ảnh nghiêng phía sau.
  const dots = cards.map((card, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Xem ảnh ' + (index + 1));
    dot.addEventListener('click', () => turnPhoto(index, index >= activePhoto ? 1 : -1));
    byId('photo-dots').append(dot);
    card.addEventListener('click', () => {
      if (photoBusy || performance.now() < suppressPhotoClickUntil) return;
      if (index === activePhoto) openPhoto();
    });
    return dot;
  });

  function updatePhotos() {
    cards.forEach((card, index) => {
      const depth = (index - activePhoto + cards.length) % cards.length;
      card.dataset.depth = String(depth);
      card.tabIndex = depth === 0 ? 0 : -1;
      card.setAttribute('aria-hidden', String(depth !== 0));
      dots[index].setAttribute('aria-current', String(index === activePhoto));
    });
    byId('album-count').replaceChildren();
    byId('album-count').append(String(activePhoto + 1).padStart(2, '0') + ' ');
    const total = document.createElement('span');
    total.textContent = '/ ' + String(cards.length).padStart(2, '0');
    byId('album-count').append(total);
    byId('previous-photo').disabled = photoBusy;
    byId('next-photo').disabled = photoBusy;
    dots.forEach((dot) => { dot.disabled = photoBusy; });
    if (activePhoto === cards.length - 1) {
      unlocked.add('gift-view');
      byId('next-to-gift').hidden = false;
      byId('album-last-note').textContent = 'Còn một điều em muốn hẹn với anh…';
      updateNavigation();
    }
  }

  function turnPhoto(index, direction = 1) {
    if (photoBusy) return;
    const next = (index + cards.length) % cards.length;
    if (next === activePhoto) return;
    if (reducedMotion.matches) {
      activePhoto = next;
      updatePhotos();
      return;
    }
    photoBusy = true;
    const previousCard = cards[activePhoto];
    const leavingClass = direction > 0 ? 'leaving-next' : 'leaving-previous';
    previousCard.classList.add(leavingClass);
    updatePhotos();
    photoTimer = window.setTimeout(() => {
      previousCard.classList.remove(leavingClass);
      activePhoto = next;
      photoBusy = false;
      updatePhotos();
      if (previousCard === document.activeElement) cards[activePhoto].focus({ preventScroll: true });
    }, 400);
  }

  byId('previous-photo').addEventListener('click', () => turnPhoto(activePhoto - 1, -1));
  byId('next-photo').addEventListener('click', () => turnPhoto(activePhoto + 1, 1));

  photoStage.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  photoStage.addEventListener('pointercancel', () => { pointerStart = null; });
  window.addEventListener('pointerup', (event) => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      suppressPhotoClickUntil = performance.now() + 600;
      turnPhoto(activePhoto + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }
  });

  // Khung ảnh tự co theo đúng tỉ lệ ảnh và khoảng trống của màn hình.
  function sizeLightbox() {
    const image = cards[activePhoto].querySelector('img');
    const width = image.naturalWidth || Number(image.getAttribute('width'));
    const height = image.naturalHeight || Number(image.getAttribute('height'));
    const ratio = width / height;
    const inset = parseFloat(getComputedStyle(lightbox).paddingLeft) * 2 + 2;
    const maxWidth = Math.max(80, Math.min(720, document.documentElement.clientWidth - 28 - inset));
    const maxHeight = Math.max(90, window.innerHeight - 240);
    const photoWidth = Math.min(width, maxWidth, maxHeight * ratio);
    lightbox.style.setProperty('--lightbox-width', Math.ceil(photoWidth + inset) + 'px');
    byId('large-photo').width = width;
    byId('large-photo').height = height;
  }

  function refreshLightbox() {
    const card = cards[activePhoto];
    const image = card.querySelector('img');
    const large = byId('large-photo');
    large.src = image.getAttribute('src');
    large.alt = image.alt;
    sizeLightbox();
    if (lightbox.open && !reducedMotion.matches) large.animate([{ opacity: .5 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    byId('lightbox-caption').textContent = card.querySelector('.polaroid-caption').textContent;
    byId('lightbox-count').textContent = 'Ảnh ' + (activePhoto + 1) + ' / ' + cards.length;
  }

  function openPhoto() {
    refreshLightbox();
    lightbox.showModal();
    document.body.classList.add('modal-open');
  }

  function changeLargePhoto(direction) {
    activePhoto = (activePhoto + direction + cards.length) % cards.length;
    updatePhotos();
    refreshLightbox();
  }

  window.addEventListener('resize', () => { if (lightbox.open) sizeLightbox(); });
  byId('large-photo').addEventListener('load', () => { if (lightbox.open) sizeLightbox(); });
  byId('close-photo').addEventListener('click', () => lightbox.close());
  byId('lightbox-previous').addEventListener('click', () => changeLargePhoto(-1));
  byId('lightbox-next').addEventListener('click', () => changeLargePhoto(1));
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (activeView === 'album-view') cards[activePhoto].focus({ preventScroll: true });
  });
  lightbox.addEventListener('click', (event) => {
    if (event.target !== lightbox) return;
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
  });
  byId('large-photo').addEventListener('touchstart', (event) => {
    lightboxTouchStart = event.touches.length === 1 ? event.touches[0].clientX : null;
  }, { passive: true });
  byId('large-photo').addEventListener('touchend', (event) => {
    if (lightboxTouchStart === null) return;
    const dx = event.changedTouches[0].clientX - lightboxTouchStart;
    lightboxTouchStart = null;
    if (Math.abs(dx) > 50) changeLargePhoto(dx < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    if (activeView !== 'album-view') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    if (lightbox.open) changeLargePhoto(direction);
    else turnPhoto(activePhoto + direction, direction);
  });

  function revealTicket() {
    const trigger = byId('reveal-ticket');
    burstHearts(trigger, 30);
    trigger.setAttribute('aria-expanded', 'true');
    byId('gift-before').hidden = true;
    byId('gift-after').hidden = false;
    byId('ticket').focus({ preventScroll: true });
  }

  function restart() {
    window.clearTimeout(openingTimer);
    window.clearTimeout(typingTimer);
    window.clearTimeout(photoTimer);
    if (lightbox.open) lightbox.close();
    opening = false;
    typingFinished = false;
    photoBusy = false;
    pointerStart = null;
    activePhoto = 0;
    activeView = 'cover-view';
    unlocked.clear();
    views.forEach((view) => { view.hidden = view.id !== 'cover-view'; });
    cover.classList.remove('opening');
    openButton.disabled = false;
    envelope.disabled = false;
    openButton.setAttribute('aria-expanded', 'false');
    envelope.setAttribute('aria-expanded', 'false');
    byId('opening-status').textContent = 'Một lá thư · Sáu khoảnh khắc · Một lời hẹn';
    byId('gift-before').hidden = false;
    byId('gift-after').hidden = true;
    byId('reveal-ticket').setAttribute('aria-expanded', 'false');
    byId('next-to-gift').hidden = true;
    byId('album-last-note').textContent = 'Sáu tấm ảnh, và còn nhiều ngày có nhau.';
    byId('fx-layer').replaceChildren();
    cards.forEach((card) => card.classList.remove('leaving-next', 'leaving-previous'));
    updatePhotos();
    updateNavigation();
    window.scrollTo({ top: 0, behavior: 'instant' });
    envelope.focus({ preventScroll: true });
  }

  openButton.addEventListener('click', openEnvelope);
  envelope.addEventListener('click', openEnvelope);
  byId('skip-typing').addEventListener('click', finishTyping);
  byId('next-to-album').addEventListener('click', () => showView('album-view'));
  byId('next-to-gift').addEventListener('click', () => showView('gift-view'));
  byId('reveal-ticket').addEventListener('click', revealTicket);
  byId('home').addEventListener('click', restart);
  byId('restart').addEventListener('click', restart);
  byId('read-again').addEventListener('click', restart);
  steps.forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && activeView === 'letter-view' && !typingFinished) finishTyping();
  });
  updatePhotos();
  updateNavigation();
})();
