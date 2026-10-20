/**
 * ===================================================================
 * SUPER FX - BỘ HIỆU ỨNG CHO BÓ HOA TULIP 20/10
 * Phiên bản: Template dùng chung
 * Tính năng:
 *  1. Khung ảnh Polaroid 3D + Washi Tape + Shimmer + Chữ viết tay dán ảnh
 *  2. Lightbox xem ảnh phóng to 3D Parallax Tilt theo chuột
 *  3. Vệt bụi sao ma thuật (Magic Sparkle Trail) theo con trỏ chuột/tay chạm
 *  4. Mưa cánh hoa Tulip 3D & Đom đóm hoàng kim (Canvas 60fps)
 *  5. Web Audio API Crystal Chime (Âm thanh chuông pha lê)
 *  6. Nút điều khiển nhạc, thả tim ngập trời & xem lại
 * ===================================================================
 */

(function () {
  'use strict';

  // --- A. WEB AUDIO API: TẠO ÂM THANH PHA LÊ MA THUẬT ---
  var audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Phát tiếng chuông pha lê lấp lánh (Crystal Twinkle Chime)
  function playCrystalChime(freqs, stagger) {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var notes = freqs || [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      var step = stagger || 0.08;

      notes.forEach(function (f, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * step);

        // Chuông ngân vang êm dịu
        gain.gain.setValueAtTime(0, now + i * step);
        gain.gain.linearRampToValueAtTime(0.08, now + i * step + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * step + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * step);
        osc.stop(now + i * step + 0.9);
      });
    } catch (e) {}
  }

  // --- B. BỘ SƯU TẬP ẢNH KỶ NIỆM & LỜI NHẮN 20/10 ---
    var PHOTO_STORIES = [
    {
      id: 1,
      match: "demo_1",
      src: "./assets/img/demo_1.jpg",
      title: "Du lịch cùng em🌷",
      sticker: "🌷",
      stamp: "🌸",
      washi: "linear-gradient(135deg, #ffccd5, #ffb3c1)",
      note: "Nụ cười của em giống như ánh nắng ban mai vậy, ấm áp và luôn khiến mọi người xung quanh cảm thấy bình yên!"
    },
    {
      id: 2,
      match: "demo_2",
      src: "./assets/img/demo_2.jpg",
      title: "Khoảnh khắc dịu dàng 🌸",
      sticker: "🌸 Dịu dàng như mây",
      stamp: "⭐",
      washi: "linear-gradient(135deg, #e9d5ff, #d8b4fe)",
      note: "Mong thế giới này sẽ luôn đối xử với em thật dịu dàng, chở che em qua những ngày mưa bão!"
    },
    {
      id: 3,
      match: "demo_3",
      src: "./assets/img/demo_3.jpg",
      title: "Cô gái chăm chỉ 📚",
      sticker: "📚 Vững bước tương lai",
      stamp: "💖",
      washi: "linear-gradient(135deg, #fef08a, #fde047)",
      note: "Cứ tự tin nỗ lực mỗi ngày nhé, tương lai tươi sáng và những điều ngọt ngào nhất chắc chắn đang chờ đón em!"
    },
    {
      id: 4,
      match: "demo_4",
      src: "./assets/img/demo_4.jpg",
      title: "Tự tin tỏa sáng ✨",
      sticker: "✨ Xinh nhất 20/10",
      stamp: "🐾",
      washi: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
      note: "20/10 chúc em luôn tự tin, rạng rỡ và xinh đẹp nhất theo cách riêng của chính mình!"
    },
    {
      id: 5,
      match: "demo_5",
      src: "./assets/img/demo_5.jpg",
      title: "Bình an & Hạnh phúc 💖",
      sticker: "🥰 Luôn hạnh phúc",
      stamp: "✨",
      washi: "linear-gradient(135deg, #fecdd3, #fda4af)",
      note: "Chúc em một đời an yên, mỗi ngày mở mắt ra đều ngập tràn niềm vui và những điều may mắn!"
    },
    {
      id: 6,
      match: "demo_6",
      src: "./assets/img/demo_6.jpg",
      title: "Điều tuyệt vời nhất 💌",
      sticker: "💌 Mãi yêu đời",
      stamp: "💌",
      washi: "linear-gradient(135deg, #fed7aa, #fdba74)",
      note: "Cảm ơn vì đã xuất hiện và mang đến những điều dễ thương cho cuộc sống này. Happy 20/10!"
    }
  ];

  function getStoryForSrc(src) {
    if (!src) return PHOTO_STORIES[0];
    for (var i = 0; i < PHOTO_STORIES.length; i++) {
      if (src.indexOf(PHOTO_STORIES[i].match) !== -1 || src.indexOf('thu_' + (i + 1)) !== -1) {
        return PHOTO_STORIES[i];
      }
    }
    return PHOTO_STORIES[0];
  }

  function getStoryIndex(srcOrId) {
    if (typeof srcOrId === 'number') {
      return (srcOrId - 1 + PHOTO_STORIES.length) % PHOTO_STORIES.length;
    }
    for (var i = 0; i < PHOTO_STORIES.length; i++) {
      if (srcOrId && (srcOrId.indexOf(PHOTO_STORIES[i].match) !== -1 || srcOrId.indexOf('thu_' + (i + 1)) !== -1)) {
        return i;
      }
    }
    return 0;
  }

  // --- C. NÂNG CẤP KHUNG ẢNH POLAROID BAY CUTE & GIÀU CẢM XÚC ---
  function decoratePhotoFloat(el) {
    if (el.dataset.decorated) return;
    el.dataset.decorated = 'true';

    var img = el.querySelector('img');
    var src = img ? img.getAttribute('src') || '' : '';
    var story = getStoryForSrc(src);
    el.dataset.storyId = story.id;

    // 1. Thêm miếng băng dính washi pastel theo màu riêng từng ảnh
    var washi = document.createElement('div');
    washi.className = 'photo-float-washi';
    washi.style.background = story.washi;
    el.appendChild(washi);

    // 2. Thêm con tem sticker góc ảnh
    var stamp = document.createElement('span');
    stamp.className = 'photo-float-stamp';
    stamp.textContent = story.stamp;
    el.appendChild(stamp);

    // 3. Thêm vệt sáng quét lấp lánh (Shimmer)
    var shimmer = document.createElement('div');
    shimmer.className = 'photo-float-shimmer';
    el.appendChild(shimmer);

    // 4. Huy hiệu nhắc chạm "Chạm xem nè 💖"
    var tapPill = document.createElement('span');
    tapPill.className = 'photo-tap-pill';
    tapPill.textContent = 'Chạm xem 💖';
    el.appendChild(tapPill);

    // 5. Nhãn sticker tình cảm dưới đáy ảnh
    var labelEl = document.createElement('div');
    labelEl.className = 'photo-float-label';
    labelEl.textContent = story.sticker;
    el.appendChild(labelEl);

    // 6. Click vào ảnh để mở Lightbox phóng to 3D & đọc lời nhắn
    el.addEventListener('click', function (e) {
      if (el.classList.contains('is-dragging')) return;
      openPhotoLightbox(story.id, e.clientX, e.clientY);
    });
  }

  // Lắng nghe container khi có ảnh bay mới được tạo ra
  function observeFlyingPhotos() {
    var container = document.getElementById('photoFloatContainer');
    if (!container) return;

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && node.classList.contains('photo-float')) {
            decoratePhotoFloat(node);
          }
        });
      });
    });

    observer.observe(container, { childList: true });
    container.querySelectorAll('.photo-float').forEach(decoratePhotoFloat);
  }

  // --- D. MODAL PHÓNG TO ẢNH 3D PARALLAX TILT & THẺ KỶ NIỆM (LIGHTBOX) ---
  var photoModalEl = null;
  var photoModalCard = null;
  var photoModalImg = null;
  var photoModalTitle = null;
  var photoModalNote = null;
  var currentStoryIdx = 0;
  function createPhotoModal() {
    photoModalEl = document.createElement('div');
    photoModalEl.className = 'fx-photo-modal';
    photoModalEl.innerHTML = [
      '<div class="fx-photo-card-wrap">',
      '  <div class="fx-photo-card" id="fxPhotoCard">',
      '    <button type="button" class="fx-photo-card-close" id="fxPhotoClose" aria-label="Đóng">&times;</button>',
      '    <img id="fxPhotoImg" src="" alt="Ảnh kỷ niệm 20/10">',
      '    <div class="fx-photo-card-info">',
      '      <div class="fx-photo-card-title" id="fxPhotoTitle">Kỷ niệm ngọt ngào 🌸</div>',
      '      <div class="fx-photo-story-note" id="fxPhotoStoryNote">Lời nhắn bí mật...</div>',
      '    </div>',
      '  </div>',
      '  <div class="fx-photo-actions">',
      '    <button type="button" class="fx-btn-action fx-btn-next" id="fxBtnNextPhoto">',
      '      <span>Ảnh kế tiếp</span>',
      '      <span class="btn-icon">➡️</span>',
      '    </button>',
      '    <button type="button" class="fx-btn-action fx-btn-close" id="fxBtnCloseAction">',
      '      <span>Đóng 🌸</span>',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(photoModalEl);

    photoModalCard = document.getElementById('fxPhotoCard');
    photoModalImg = document.getElementById('fxPhotoImg');
    photoModalTitle = document.getElementById('fxPhotoTitle');
    photoModalNote = document.getElementById('fxPhotoStoryNote');

    // Đóng khi bấm nút x hoặc bấm nền
    document.getElementById('fxPhotoClose').addEventListener('click', closePhotoLightbox);
    document.getElementById('fxBtnCloseAction').addEventListener('click', closePhotoLightbox);
    photoModalEl.addEventListener('click', function (e) {
      if (e.target === photoModalEl) closePhotoLightbox();
    });

    // Nút chuyển ảnh tiếp theo mượt mà
    document.getElementById('fxBtnNextPhoto').addEventListener('click', function (e) {
      e.stopPropagation();
      playCrystalChime([880, 1108.73, 1318.51, 1760], 0.05);
      currentStoryIdx = (currentStoryIdx + 1) % PHOTO_STORIES.length;
      renderCurrentStory(true);
    });

    // 3D Parallax Tilt theo di chuyển chuột (tối ưu 60fps với RAF, không làm giật khung hình)
    var cardWrap = photoModalEl.querySelector('.fx-photo-card-wrap');
    var tiltRaf = null;
    cardWrap.addEventListener('mousemove', function (e) {
      if (!photoModalCard) return;
      var clientX = e.clientX;
      var clientY = e.clientY;
      if (tiltRaf) cancelAnimationFrame(tiltRaf);
      tiltRaf = requestAnimationFrame(function () {
        var rect = photoModalCard.getBoundingClientRect();
        var x = clientX - (rect.left + rect.width / 2);
        var y = clientY - (rect.top + rect.height / 2);
        var rotY = (x / (rect.width / 2)) * 8;
        var rotX = -(y / (rect.height / 2)) * 8;
        photoModalCard.style.transform = 'perspective(1000px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
      });
    }, { passive: true });

    cardWrap.addEventListener('mouseleave', function () {
      if (tiltRaf) cancelAnimationFrame(tiltRaf);
      if (photoModalCard) {
        photoModalCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      }
    });
  }

  function renderCurrentStory(withFlip) {
    if (!photoModalCard) return;
    var story = PHOTO_STORIES[currentStoryIdx];

    if (withFlip) {
      photoModalCard.classList.remove('is-flipping');
      void photoModalCard.offsetWidth;
      photoModalCard.classList.add('is-flipping');
      playCrystalChime([783.99, 987.77, 1318.51], 0.05);
    }

    photoModalImg.src = story.src;
    photoModalTitle.textContent = story.title;
    photoModalNote.textContent = story.note;
  }

  function openPhotoLightbox(storyIdOrSrc, originX, originY) {
    if (!photoModalEl) createPhotoModal();
    currentStoryIdx = getStoryIndex(storyIdOrSrc);
    renderCurrentStory(false);

    photoModalEl.classList.add('is-open');
    playCrystalChime();

    // Nổ tim tại điểm click
    burstHearts(originX || window.innerWidth / 2, originY || window.innerHeight / 2, 22);
  }

  function closePhotoLightbox() {
    if (photoModalEl) {
      photoModalEl.classList.remove('is-open');
      if (photoModalCard) {
        photoModalCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
      }
    }
  }

  // --- E. PHÁO HOA TRÁI TIM BÙNG NỔ (BURST HEARTS) ---
  var HEART_EMOJIS = ['💖', '💕', '✨', '🌸', '🌷', '🥰', '🧀', '⭐'];

  function burstHearts(originX, originY, count) {
    var total = count || 20;
    var x = originX || window.innerWidth / 2;
    var y = originY || window.innerHeight / 2;

    for (var i = 0; i < total; i++) {
      var h = document.createElement('div');
      h.className = 'fx-flying-heart';
      h.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];

      var angle = Math.random() * Math.PI * 2;
      var dist = 80 + Math.random() * 220;
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist - 80;
      var tr = (Math.random() * 60 - 30);
      var size = 18 + Math.random() * 22;

      h.style.left = x + 'px';
      h.style.top = y + 'px';
      h.style.fontSize = size + 'px';
      h.style.setProperty('--tx', tx.toFixed(1) + 'px');
      h.style.setProperty('--ty', ty.toFixed(1) + 'px');
      h.style.setProperty('--tr', tr.toFixed(1) + 'deg');

      document.body.appendChild(h);
      (function (node) {
        setTimeout(function () {
          if (node.parentNode) node.parentNode.removeChild(node);
        }, 2200);
      })(h);
    }
  }

  // --- F. VỆT BỤI SAO MA THUẬT (SPARKLE TRAIL CANVAS 60FPS) ---
  function initSparkleTrail() {
    var canvas = document.createElement('canvas');
    canvas.id = 'fxSparkleCanvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var width = (canvas.width = window.innerWidth);
    var height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', function () {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    var particles = [];
    var MAX_PARTICLES = 80;
    var colors = [
      'rgba(255, 235, 150, ',
      'rgba(255, 182, 193, ',
      'rgba(255, 255, 255, ',
      'rgba(244, 114, 182, ',
      'rgba(186, 230, 253, '
    ];

    var isLoopRunning = false;
    function startSparkleLoop() {
      if (!isLoopRunning) {
        isLoopRunning = true;
        requestAnimationFrame(render);
      }
    }

    function addSparkles(x, y, count) {
      for (var i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.5 + Math.random() * 2.8;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.4,
          size: 2.2 + Math.random() * 3.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.024 + Math.random() * 0.032,
          isStar: Math.random() < 0.45,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() * 0.2 - 0.1)
        });
      }
      startSparkleLoop();
    }

    // Lắng nghe chuột & cảm ứng (passive listener)
    var lastX = -1, lastY = -1;
    function handlePointer(x, y) {
      if (lastX === -1) {
        lastX = x;
        lastY = y;
        addSparkles(x, y, 3);
        return;
      }
      var dx = x - lastX;
      var dy = y - lastY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 7) {
        addSparkles(x, y, Math.min(5, Math.floor(dist / 8)));
        lastX = x;
        lastY = y;
      }
    }

    window.addEventListener('mousemove', function (e) {
      handlePointer(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches[0]) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('click', function (e) {
      // Nổ sao lấp lánh khi click bất kỳ đâu
      addSparkles(e.clientX, e.clientY, 12);
    }, { passive: true });

    // Vẽ sao 4 cánh ma thuật
    function drawStar(c, cx, cy, spikes, outerRadius, innerRadius) {
      var rot = Math.PI / 2 * 3;
      var step = Math.PI / spikes;
      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (var i = 0; i < spikes; i++) {
        var x = cx + Math.cos(rot) * outerRadius;
        var y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
    }

    function render() {
      if (particles.length === 0) {
        ctx.clearRect(0, 0, width, height);
        isLoopRunning = false;
        return; // Dừng RAF khi người dùng không di chuột để tiết kiệm pin & 0% CPU
      }

      ctx.clearRect(0, 0, width, height);

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.rotation += p.rotSpeed;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = p.color + Math.max(0, p.alpha) + ')';

        if (p.isStar) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          drawStar(ctx, 0, 0, 4, p.size * 1.5, p.size * 0.4);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      requestAnimationFrame(render);
    }
  }

  // --- G. MƯA CÁNH HOA TULIP 3D & ĐOM ĐÓM HOÀNG KIM (TỐI ƯU 60FPS KHÔNG LAG) ---
  function initFallingPetalsAndStardust() {
    var canvas = document.createElement('canvas');
    canvas.id = 'fxPetalCanvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var width = (canvas.width = window.innerWidth);
    var height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', function () {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    var isMobile = window.innerWidth < 768;

    // 1. Cánh hoa rơi (Hoa Dã Quỳ vàng hoặc theo theme)
    var petals = [];
    var NUM_PETALS = isMobile ? 14 : 22;
    var themeColor = document.body.getAttribute('data-flower-color') || 'da_quy';
    function getPetalColor() {
      if (themeColor === 'da_quy' || themeColor === 'yellow' || themeColor === 'wild_sunflower') {
        var r = Math.random();
        return r < 0.4 ? '#facc15' : (r < 0.7 ? '#f59e0b' : (r < 0.88 ? '#fde047' : '#fbbf24'));
      } else if (themeColor === 'purple') {
        return Math.random() < 0.6 ? '#c084fc' : (Math.random() < 0.5 ? '#d8b4fe' : '#e9d5ff');
      } else if (themeColor === 'blue') {
        return Math.random() < 0.6 ? '#60a5fa' : (Math.random() < 0.5 ? '#93c5fd' : '#38bdf8');
      } else if (themeColor === 'white') {
        return Math.random() < 0.6 ? '#ffffff' : (Math.random() < 0.5 ? '#fef08a' : '#fef9c3');
      } else {
        return Math.random() < 0.6 ? '#f472b6' : (Math.random() < 0.5 ? '#fb7185' : '#fbcfe8');
      }
    }
    for (var i = 0; i < NUM_PETALS; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: 9 + Math.random() * 13,
        speedY: 1.0 + Math.random() * 1.4,
        speedX: Math.random() * 1.0 - 0.5,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        speedRotX: 0.015 + Math.random() * 0.02,
        speedRotY: 0.02 + Math.random() * 0.025,
        speedRotZ: 0.01 + Math.random() * 0.015,
        color: getPetalColor(),
        alpha: 0.55 + Math.random() * 0.35,
        swayPhase: Math.random() * Math.PI * 2
      });
    }

    // 2. Đom đóm hoàng kim (Fireflies / Stardust)
    var fireflies = [];
    var NUM_FIREFLIES = isMobile ? 18 : 26;
    for (var f = 0; f < NUM_FIREFLIES; f++) {
      fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.2 + Math.random() * 2.0,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3 - Math.random() * 0.4,
        alpha: Math.random(),
        alphaSpeed: 0.01 + Math.random() * 0.02,
        color: Math.random() < 0.6 ? '#fde047' : '#fef08a'
      });
    }

    function renderWorld() {
      if (document.hidden) {
        requestAnimationFrame(renderWorld);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Vẽ đom đóm với 2 lớp tròn mềm (nhanh gấp 50x so với shadowBlur)
      for (var f = 0; f < fireflies.length; f++) {
        var ff = fireflies[f];
        ff.x += ff.vx;
        ff.y += ff.vy;
        ff.alpha += ff.alphaSpeed;

        if (ff.alpha > 0.95 || ff.alpha < 0.1) {
          ff.alphaSpeed = -ff.alphaSpeed;
        }
        if (ff.y < -10) {
          ff.y = height + 10;
          ff.x = Math.random() * width;
        }

        var a = Math.max(0, Math.min(1, ff.alpha));

        // Quầng sáng mềm
        ctx.fillStyle = 'rgba(253, 224, 71, ' + (a * 0.28).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(ff.x, ff.y, ff.radius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Tâm đom đóm
        ctx.fillStyle = ff.color;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(ff.x, ff.y, ff.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Vẽ cánh hoa Tulip 3D (mượt mà, nhẹ máy)
      for (var p = 0; p < petals.length; p++) {
        var pt = petals[p];
        pt.swayPhase += 0.025;
        pt.x += pt.speedX + Math.sin(pt.swayPhase) * 1.2;
        pt.y += pt.speedY;

        pt.rotX += pt.speedRotX;
        pt.rotY += pt.speedRotY;
        pt.rotZ += pt.speedRotZ;

        if (pt.y > height + 20) {
          pt.y = -20;
          pt.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotZ);
        ctx.scale(Math.cos(pt.rotX), Math.sin(pt.rotY));
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;

        // Vẽ hình cánh hoa Tulip hình elip nhọn
        ctx.beginPath();
        ctx.moveTo(0, -pt.size);
        ctx.bezierCurveTo(pt.size * 0.8, -pt.size * 0.5, pt.size * 0.9, pt.size * 0.6, 0, pt.size);
        ctx.bezierCurveTo(-pt.size * 0.9, pt.size * 0.6, -pt.size * 0.8, -pt.size * 0.5, 0, -pt.size);
        ctx.fill();

        ctx.restore();
      }

      requestAnimationFrame(renderWorld);
    }
    renderWorld();
  }

  // --- H. THANH ĐIỀU KHIỂN NỔI GÓC MÀN HÌNH ---
  function initTopControls() {
    var topBar = document.createElement('div');
    topBar.className = 'fx-top-bar';
    topBar.innerHTML = [
      '<button type="button" class="fx-pill-btn" id="fxBtnMusic" aria-label="Bật/Tắt nhạc">',
      '  <span class="fx-music-disc" id="fxMusicDisc">🎵</span> <span id="fxMusicText">Nhạc: Đang phát</span>',
      '</button>',
      '<button type="button" class="fx-pill-btn" id="fxBtnBurstHeart" aria-label="Thả tim ngập tràn">',
      '  <span>💖 Thả tim</span>',
      '</button>',
      '<button type="button" class="fx-pill-btn" id="fxBtnReplay" aria-label="Xem lại từ đầu">',
      '  <span>🔄 Xem lại</span>',
      '</button>'
    ].join('');

    document.body.appendChild(topBar);

    var audio = document.getElementById('audio-para-ti');
    var btnMusic = document.getElementById('fxBtnMusic');
    var disc = document.getElementById('fxMusicDisc');
    var musicText = document.getElementById('fxMusicText');

    if (btnMusic && audio) {
      btnMusic.addEventListener('click', function () {
        if (audio.paused) {
          audio.play();
          disc.classList.remove('is-paused');
          musicText.textContent = 'Nhạc: Đang phát';
          playCrystalChime([659.25, 783.99, 1046.50]);
        } else {
          audio.pause();
          disc.classList.add('is-paused');
          musicText.textContent = 'Nhạc: Đã tắt';
        }
      });

      // Đồng bộ trạng thái nhạc
      audio.addEventListener('play', function () {
        disc.classList.remove('is-paused');
        musicText.textContent = 'Nhạc: Đang phát';
      });
      audio.addEventListener('pause', function () {
        disc.classList.add('is-paused');
        musicText.textContent = 'Nhạc: Đã tắt';
      });
    }

    // Nút thả tim ngập trời
    document.getElementById('fxBtnBurstHeart').addEventListener('click', function (e) {
      playCrystalChime([523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]);
      burstHearts(window.innerWidth * 0.2, window.innerHeight * 0.6, 20);
      burstHearts(window.innerWidth * 0.5, window.innerHeight * 0.5, 30);
      burstHearts(window.innerWidth * 0.8, window.innerHeight * 0.6, 20);
    });

    // Nút xem lại từ đầu
    document.getElementById('fxBtnReplay').addEventListener('click', function () {
      window.location.reload();
    });
  }

  // --- I. KHỞI TẠO TẤT CẢ HIỆU ỨNG KHI TRANG TẢI XONG ---
  function initAllSuperFX() {
    initSparkleTrail();
    initFallingPetalsAndStardust();
    createPhotoModal();
    observeFlyingPhotos();
    initTopControls();

    // Thêm âm thanh khi click nút vân tay
    var fpBtn = document.getElementById('fingerprintBtn');
    if (fpBtn) {
      fpBtn.addEventListener('click', function () {
        playCrystalChime();
      });
    }

    // Thêm âm thanh khi click mở phong bì thư & quản lý banner chỉ dẫn chạm
    var letterEl = document.querySelector('.letter');
    var letterOpenPrompt = document.getElementById('letterOpenPrompt');
    var letterModal = document.getElementById('letterModal');

    function hideOpenPrompt() {
      if (letterOpenPrompt) {
        letterOpenPrompt.classList.remove('is-visible', 'is-ready');
        letterOpenPrompt.classList.add('is-hidden');
      }
    }

    if (letterOpenPrompt) {
      letterOpenPrompt.addEventListener('click', function (e) {
        e.stopPropagation();
        playCrystalChime([440, 554.37, 659.25, 880]);
        hideOpenPrompt();
        if (letterEl) {
          letterEl.click();
        }
      });
    }

    if (letterEl) {
      letterEl.addEventListener('click', function () {
        playCrystalChime([440, 554.37, 659.25, 880]); // A chord
        letterEl.classList.add('is-opened');
        hideOpenPrompt();
      });
    }

    // Khởi tạo Dây đèn đom đóm Fairy Lights
    initFairyLights();

    // Khởi tạo Tương tác 2 chú mèo
    initCatInteractions();

    // Khởi tạo Tương tác bấm vào bông hoa
    initTulipInteractions();

    console.log('✨ [SuperFX] Đã kích hoạt toàn bộ hiệu ứng thế hệ mới: Polaroid 3D, Fairy Lights, Letter Open Prompt!');
  }

  // --- J. DÂY ĐÈN ĐOM ĐÓM FAIRY LIGHTS ---
  function initFairyLights() {
    var wrap = document.getElementById('fairyLightsSystem');
    if (!wrap) return;
    var coords = [
      { top: 26, left: 32 }, { top: 34, left: 46 }, { top: 24, left: 60 },
      { top: 44, left: 28 }, { top: 48, left: 40 }, { top: 45, left: 56 },
      { top: 36, left: 70 }, { top: 60, left: 34 }, { top: 62, left: 50 },
      { top: 56, left: 66 }, { top: 72, left: 44 }, { top: 74, left: 58 },
      { top: 82, left: 50 }, { top: 30, left: 76 }
    ];
    coords.forEach(function (pos, idx) {
      var bulb = document.createElement('div');
      bulb.className = 'fairy-bulb';
      bulb.style.top = pos.top + '%';
      bulb.style.left = pos.left + '%';
      bulb.style.animationDelay = (idx * 0.24) + 's';
      bulb.style.animationDuration = (2.0 + (idx % 4) * 0.5) + 's';
      wrap.appendChild(bulb);
    });
  }

  // --- K. TƯƠNG TÁC 2 CHÚ THỎ MEWMEW DỄ THƯƠNG & DỤ MỞ THƯ ---
  function initCatInteractions() {
    var leftCat = document.getElementById('rabbitLeft');
    var rightCat = document.getElementById('rabbitRight');
    var leftBubble = document.getElementById('rabbitBubbleLeft');
    var rightBubble = document.getElementById('rabbitBubbleRight');
    var letterModal = document.getElementById('letterModal');
    var letterCloseBtn = document.getElementById('letterClose');
    var letterBtnContinue = document.getElementById('letterBtnContinue');

    // Lời thoại siêu cute, tự nhiên, thân thiện và dụ mở thư
        var leftQuotes = [
      "Có bức thư gửi riêng cho bạn nè! 💌✨",
      "Nhấn lá thư ở giữa đi nha! 😆🌻",
      "Trong thư có nhiều điều ngọt ngào lắm! 😋💕",
      "Chạm phong bì đi, mở ra xem liền nè! 🤣💌",
      "Mở xem người ấy nhắn gửi gì nè! 🌻✨",
      "20/10 chúc bạn thật nhiều niềm vui! 🥰🐾",
      "Mau mở quà bí mật đi nào! 💖🎉"
    ];

        var rightQuotes = [
      "Chạm lá thư ở giữa đi nè! 👇✨",
      "Mở thư xem lời nhắn ngọt ngào nè! 💌✨",
      "Đọc xong có ảnh bay đẹp xỉu luôn! 📸💐",
      "Hổng mở là tui mở trước á nha! 😜💌",
      "Hôm nay bạn là người xinh đẹp nhất! 🌻✨",
      "Bức thư này được viết nắn nót lắm á! 🥺💕",
      "Mau chạm phong bì đi bạn ơii! 🐾✨"
    ];

    var leftIdx = 0, rightIdx = 0;
    var timerL = null, timerR = null;

    function showBubble(catEl, bubbleEl, quote, durationMs) {
      if (!catEl || !bubbleEl) return;
      var textEl = bubbleEl.querySelector('.bubble-text') || bubbleEl;
      textEl.textContent = quote;

      catEl.classList.add('has-bubble-open');
      bubbleEl.classList.add('is-visible');

      return setTimeout(function () {
        bubbleEl.classList.remove('is-visible');
        setTimeout(function () {
          if (!bubbleEl.classList.contains('is-visible')) {
            catEl.classList.remove('has-bubble-open');
          }
        }, 350);
      }, durationMs || 4000);
    }

    function hideAllBubbles() {
      if (timerL) clearTimeout(timerL);
      if (timerR) clearTimeout(timerR);
      if (leftBubble) leftBubble.classList.remove('is-visible');
      if (rightBubble) rightBubble.classList.remove('is-visible');
      if (leftCat) leftCat.classList.remove('has-bubble-open');
      if (rightCat) rightCat.classList.remove('has-bubble-open');
    }

    function triggerRabbit(catEl, bubbleEl, quotes, getIdx, setIdx) {
      if (!catEl) return;
      // Âm thanh chimes cute vui tai
      playCrystalChime([880, 1108.73, 1318.51, 1760], 0.08);

      // Nhảy tưng tưng
      catEl.classList.remove('is-jumping');
      void catEl.offsetWidth;
      catEl.classList.add('is-jumping');

      // Nổ tim mini từ chú thỏ
      var rect = catEl.getBoundingClientRect();
      burstHearts(rect.left + rect.width / 2, rect.top, 10);

      // Hiện câu thoại mới nhất
      var quote = quotes[getIdx() % quotes.length];
      setIdx(getIdx() + 1);

      if (catEl === leftCat) {
        if (timerL) clearTimeout(timerL);
        timerL = showBubble(catEl, bubbleEl, quote, 4000);
      } else {
        if (timerR) clearTimeout(timerR);
        timerR = showBubble(catEl, bubbleEl, quote, 4000);
      }
    }

    if (leftCat) {
      leftCat.addEventListener('click', function (e) {
        e.stopPropagation();
        triggerRabbit(leftCat, leftBubble, leftQuotes, function () { return leftIdx; }, function (v) { leftIdx = v; });
      });
    }

    if (rightCat) {
      rightCat.addEventListener('click', function (e) {
        e.stopPropagation();
        triggerRabbit(rightCat, rightBubble, rightQuotes, function () { return rightIdx; }, function (v) { rightIdx = v; });
      });
    }

    // Ẩn bóng thoại thỏ khi thư mở
    var letterEl = document.querySelector('.letter');
    if (letterEl) {
      letterEl.addEventListener('click', hideAllBubbles);
    }
    var letterPrompt = document.getElementById('letterOpenPrompt');
    if (letterPrompt) {
      letterPrompt.addEventListener('click', hideAllBubbles);
    }

    // Khi đóng thư hoặc bấm tiếp tục: Thỏ chúc mừng
    function onLetterClosed() {
      setTimeout(function () {
        if (leftCat && leftBubble) {
          showBubble(leftCat, leftBubble, "Đọc thư xong rùi hả bạn ơi? 🐰💕", 3800);
        }
        setTimeout(function () {
          if (rightCat && rightBubble) {
            showBubble(rightCat, rightBubble, "Chúc bạn luôn vui vẻ và hạnh phúc nha! 🥰🌸", 3800);
          }
        }, 2000);
      }, 700);
    }

    if (letterCloseBtn) letterCloseBtn.addEventListener('click', onLetterClosed);
    if (letterBtnContinue) letterBtnContinue.addEventListener('click', onLetterClosed);

    // TỰ ĐỘNG HIỆN BANNER & DỤ THƯ MỞ THƯ THEO KỊCH BẢN THÂN THIỆN
    // Chỉ kích hoạt sau khi intro câu chúc đã kết thúc êm ái
    var introEl = document.getElementById('intro');
    var letterOpenPrompt = document.getElementById('letterOpenPrompt');
    var sequenceStarted = false;

    function startSequenceAfterIntro() {
      if (sequenceStarted) return;
      sequenceStarted = true;

      // 1. Sau khi intro kết thúc 1.2s: Hiện banner mở thư với hiệu ứng sáng
      setTimeout(function () {
        if (letterOpenPrompt && (!letterModal || !letterModal.classList.contains('is-open'))) {
          letterOpenPrompt.classList.add('is-ready', 'is-visible');
        }
      }, 1200);

      // 2. Sau thêm 2.2s (~3.4s sau intro): Bé thỏ trái cất tiếng gọi thân thiện
      setTimeout(function () {
        if (leftCat && leftBubble && (!letterModal || !letterModal.classList.contains('is-open'))) {
          playCrystalChime([880, 1108.73], 0.04);
          timerL = showBubble(leftCat, leftBubble, leftQuotes[0], 4000);
          leftIdx++;
        }
      }, 3400);

      // 3. Sau thêm 5s (~8.4s sau intro): Bé thỏ phải nhắc nhở cute nếu chưa mở
      setTimeout(function () {
        if (rightCat && rightBubble && (!letterModal || !letterModal.classList.contains('is-open'))) {
          playCrystalChime([1108.73, 1318.51], 0.04);
          timerR = showBubble(rightCat, rightBubble, rightQuotes[0], 4000);
          rightIdx++;
        }
      }, 8400);
    }

    if (introEl) {
      if (introEl.classList.contains('is-done')) {
        startSequenceAfterIntro();
      } else {
        var introObserver = new MutationObserver(function () {
          if (introEl.classList.contains('is-done')) {
            introObserver.disconnect();
            startSequenceAfterIntro();
          }
        });
        introObserver.observe(introEl, { attributes: true, attributeFilter: ['class'] });

        // Fallback an toàn nếu sau 8.5s chưa nhận observer
        setTimeout(function () {
          if (!document.body.classList.contains('not-loaded')) {
            startSequenceAfterIntro();
          }
        }, 8500);
      }
    } else {
      setTimeout(startSequenceAfterIntro, 2000);
    }
  }

  // --- L. TƯƠNG TÁC CHẠM VÀO TỪNG BÔNG HOA TULIP ---
  function initTulipInteractions() {
    var flowers = document.querySelectorAll('.flower');
    flowers.forEach(function (fl) {
      fl.style.cursor = 'pointer';
      fl.addEventListener('click', function (e) {
        e.stopPropagation();
        playCrystalChime([659.25, 830.61, 987.77, 1318.51], 0.06);
        var rect = fl.getBoundingClientRect();
        burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);

        // Hiệu ứng bừng sáng
        fl.style.filter = 'drop-shadow(0 0 16px rgba(255, 105, 180, 0.95)) brightness(1.2)';
        setTimeout(function () {
          fl.style.filter = '';
        }, 600);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSuperFX);
  } else {
    initAllSuperFX();
  }

})();
