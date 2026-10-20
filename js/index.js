  // Wrap toàn bộ script trong IIFE để tránh lỗi duplicate declaration
  (function() {
    'use strict';

    var SERVER_URL = 'https://api.giftory.pro';

    // ===== OVERLAY & AUDIO LOGIC (CURTAIN LIFT & FINGERPRINT SCANNER) =====
    var orientationOverlay = document.getElementById('orientationOverlay');
    var fingerprintBtn = document.getElementById('fingerprintBtn');
    var fingerprintGuide = document.getElementById('fingerprintGuide');
    var fpProgressBar = document.getElementById('fpProgressBar');
    var btnReplayIntro = document.getElementById('btnReplayIntro');
    var audio = document.getElementById('audio-para-ti');
    var params = new URLSearchParams(window.location.search);

    // ===== BỘ TÙY BIẾN TÔNG MÀU BÓ HOA =====
    function applyFlowerColor(color) {
      var valid = ['da_quy', 'yellow', 'wild_sunflower', 'classic', 'pastel', 'peach', 'magenta', 'vintage', 'mix', 'pink_mix', 'pink_tulip_mix', 'raspberry_pink', 'coral_champagne', 'purple', 'blue', 'white'];
      var c = (color && valid.indexOf(color) !== -1) ? color : 'da_quy';
      document.body.setAttribute('data-flower-color', c);
      var flowersEl = document.querySelector('.flowers');
      if (flowersEl) flowersEl.setAttribute('data-flower-color', c);
    }

    // Áp dụng ngay nếu URL có param ?color=... hoặc từ DEFAULT_GIFT_DATA hoặc mặc định là 'da_quy' (Hoa Dã Quỳ)
    var initialColor = params.get('color') || (window.DEFAULT_GIFT_DATA && window.DEFAULT_GIFT_DATA.flowerColor) || 'da_quy';
    applyFlowerColor(initialColor);

    // Lắng nghe message từ trang cha (create.html) để đổi màu trực tiếp tức thì
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'UPDATE_FLOWER_COLOR') {
        applyFlowerColor(e.data.color);
      }
    });

    // Cờ & dữ liệu âm thanh tương thích Safari / iOS
    var SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
    var pendingPlay = false;

    function isSilentAudio(src) {
      return !src || src.indexOf('data:audio/wav;base64,UklGRig') === 0;
    }

    if (audio && (!audio.src || audio.src === window.location.href)) {
      audio.src = SILENT_AUDIO;
    }

    // Mở khóa phần cứng âm thanh Safari/iOS ngay trong gesture stack của người dùng
    function primeAudio() {
      if (!audio) return;
      try {
        var p = audio.play();
        if (p && typeof p.then === 'function') {
          p.then(function() {
            // Nếu chưa mở màn quà (đang trong nhịp ấn giữ), tạm dừng lại ngay
            if (!isExperienceTriggered) {
              audio.pause();
              audio.currentTime = 0;
            }
          }).catch(function() {});
        }
      } catch (e) {}
    }

    function setAudioSrc(data) {
      if (!audio || !data) return;
      var newSrc = null;
      if (data.musicType === 'Sample' && data.musicPath) {
        newSrc = data.musicPath;
      } else if (data.musicType === 'Custom' && data.customMusic) {
        // customMusic có thể là URL hoặc base64 data URL
        newSrc = data.customMusic;
      }
      if (newSrc && audio.src !== newSrc) {
        audio.src = newSrc;
        try { audio.load(); } catch (e) {}
      }
    }

    function playAudio() {
      if (!audio || !audio.src || isSilentAudio(audio.src) || audio.src === window.location.href) return;
      try {
        var p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function(err) {
            console.warn('⚠️ Audio play prevented:', err);
          });
        }
      } catch (e) {}
    }

    var isExperienceTriggered = false;
    var closeLetterModal;
    var stopFlyingPhotos;
    var bouquetTimer = null;
    var introTimer = null;
    var flowersPauseTimer = null;

    function openExperience() {
      if (isExperienceTriggered) return;
      isExperienceTriggered = true;

      // 1. Phát nhạc (nếu không có cờ muted / nomusic)
      var isMuted = params.get('muted') === '1' || params.get('nomusic') === '1';
      if (!isMuted) {
        if (audio && audio.src && !isSilentAudio(audio.src) && audio.src !== window.location.href) {
          playAudio();
        } else {
          pendingPlay = true;
        }
      }

      // 2. Tan biến dần từ dưới lên (Dissolve & Fade Out siêu mượt)
      if (orientationOverlay) {
        orientationOverlay.classList.remove('is-closing');
        orientationOverlay.classList.add('is-dissolving', 'is-curtain-lifting');
      }

      // 3. Khởi động màn chính đồng thời (hoa nở, hạt sao)
      if (typeof startExperience === 'function') {
        startExperience();
      }

      // 4. Ẩn hoàn toàn overlay sau khi mờ dần (1350ms) và hiện nút Xem lại
      setTimeout(function() {
        if (orientationOverlay) orientationOverlay.style.display = 'none';
        if (btnReplayIntro) btnReplayIntro.style.display = 'inline-flex';
      }, 1350);
    }

    // Xử lý nút vân tay: BẮT BUỘC ấn giữ đủ 1.5s mới bắt đầu màn chính
    if (fingerprintBtn) {
      var pressTimer = null;
      var isHolding = false;
      var HOLD_DURATION = 1000; // Ấn giữ đồng bộ với nhịp hoa vươn chạm trần

      function startPress(e) {
        if (isExperienceTriggered) return;
        isHolding = true;
        // Mở khóa phần cứng media ngay trong user gesture trực tiếp của Safari / iOS
        primeAudio();
        fingerprintBtn.classList.remove('is-bloomed');
        fingerprintBtn.classList.add('is-pressing');
        if (orientationOverlay) {
          orientationOverlay.classList.add('is-holding-veil');
        }

        // Rung phản hồi haptic nhẹ khi bắt đầu chạm
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(35); } catch (err) {}
        }

        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = setTimeout(function() {
          if (isHolding && !isExperienceTriggered) {
            // Hoa vừa chạm nóc lồng kính: bừng nở và biến đổi chuyển màn chính ngay lập tức, không chờ đợi
            fingerprintBtn.classList.add('is-bloomed');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try { navigator.vibrate([35, 40, 70]); } catch (err) {}
            }
            openExperience();
          }
        }, HOLD_DURATION);
      }

      function cancelPress() {
        if (isExperienceTriggered) return;
        isHolding = false;
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
        fingerprintBtn.classList.remove('is-pressing', 'is-bloomed');
        if (orientationOverlay) {
          orientationOverlay.classList.remove('is-holding-veil');
        }
        if (fingerprintGuide) {
          fingerprintGuide.textContent = 'Ấn giữ để mở quà';
          fingerprintGuide.style.color = '';
        }
      }

      // Đảm bảo mở khóa audio trên touchstart đầu tiên trên thiết bị di động Apple
      fingerprintBtn.addEventListener('touchstart', function() {
        primeAudio();
      }, { passive: true });

      // Pointer events (bao quát cả chuột và màn hình cảm ứng)
      if (window.PointerEvent) {
        fingerprintBtn.addEventListener('pointerdown', startPress);
        fingerprintBtn.addEventListener('pointerup', cancelPress);
        fingerprintBtn.addEventListener('pointercancel', cancelPress);
        fingerprintBtn.addEventListener('pointerleave', cancelPress);
      } else {
        // Fallback touch & mouse
        fingerprintBtn.addEventListener('touchstart', startPress, { passive: true });
        fingerprintBtn.addEventListener('touchend', cancelPress);
        fingerprintBtn.addEventListener('touchcancel', cancelPress);
        fingerprintBtn.addEventListener('mousedown', startPress);
        fingerprintBtn.addEventListener('mouseup', cancelPress);
        fingerprintBtn.addEventListener('mouseleave', cancelPress);
      }

      // Lưới bảo hiểm: Nếu kết nối mạng tải nhạc chậm hơn lúc ấn, tương tác nhấc tay/chạm tiếp theo sẽ kích hoạt nhạc ngay
      function ensureAudioPlayingOnGesture() {
        var isMuted = params.get('muted') === '1' || params.get('nomusic') === '1';
        if (isMuted || !isExperienceTriggered || !audio) return;
        if (audio.paused && audio.src && !isSilentAudio(audio.src) && audio.src !== window.location.href) {
          playAudio();
        }
      }
      window.addEventListener('touchend', ensureAudioPlayingOnGesture, { passive: true });
      window.addEventListener('pointerup', ensureAudioPlayingOnGesture, { passive: true });
      window.addEventListener('click', ensureAudioPlayingOnGesture, { passive: true });

      // Click nhanh: Chặn click thường, chỉ mở khi ấn giữ đủ 1.5s
      fingerprintBtn.addEventListener('click', function(e) {
        e.preventDefault();
      });

      // Phím bàn phím (Enter / Space): cũng yêu cầu ấn giữ 1.5s
      var keyHolding = false;
      fingerprintBtn.addEventListener('keydown', function(e) {
        if ((e.key === 'Enter' || e.key === ' ') && !keyHolding && !isExperienceTriggered) {
          e.preventDefault();
          keyHolding = true;
          startPress(e);
        }
      });
      fingerprintBtn.addEventListener('keyup', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          keyHolding = false;
          cancelPress();
        }
      });
    }

    // Xử lý nút "↺ Xem lại"
    function replayIntro() {
      isExperienceTriggered = false;
      if (btnReplayIntro) btnReplayIntro.style.display = 'none';

      // Hủy mọi timer đang chờ của màn hoa
      if (bouquetTimer) { clearTimeout(bouquetTimer); bouquetTimer = null; }
      if (introTimer) { clearTimeout(introTimer); introTimer = null; }
      if (flowersPauseTimer) { clearTimeout(flowersPauseTimer); flowersPauseTimer = null; }

      // Tạm dừng và tua lại nhạc
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {}
      }

      // Đóng modal thư nếu mở
      if (typeof closeLetterModal === 'function') closeLetterModal();
      // Dừng ảnh bay nếu đang chạy
      if (typeof stopFlyingPhotos === 'function') stopFlyingPhotos();

      // Đưa màn chính về trạng thái ban đầu
      document.body.classList.add('not-loaded');
      var flowersEl = document.querySelector('.flowers');
      if (flowersEl) flowersEl.classList.add('flowers--paused');

      var ramoEl = document.querySelector('.ramo');
      if (ramoEl) ramoEl.classList.remove('ramo--visible');
      var bowEl = document.querySelector('.flower-bow');
      if (bowEl) bowEl.classList.remove('flower-bow--visible');
      document.querySelectorAll('.rabbit').forEach(function(r) { r.classList.remove('rabbit--visible'); });
      var letterEl = document.querySelector('.letter');
      if (letterEl) letterEl.classList.remove('letter--visible');
      var introEl = document.getElementById('intro');
      if (introEl) introEl.classList.remove('is-done');

      // Khôi phục rèm mở đầu
      if (orientationOverlay) {
        orientationOverlay.style.display = 'flex';
        void orientationOverlay.offsetHeight; // trigger reflow
        orientationOverlay.classList.remove('is-holding-veil', 'is-dissolving', 'is-curtain-lifting', 'is-closing');
        if (fingerprintBtn) fingerprintBtn.classList.remove('is-pressing', 'is-bloomed');
        if (fingerprintGuide) {
          fingerprintGuide.textContent = 'Ấn giữ để mở quà';
          fingerprintGuide.style.color = '';
        }
      }
    }

    if (btnReplayIntro) {
      btnReplayIntro.addEventListener('click', replayIntro);
    }

    // ===== FETCH GIFT DATA =====
    function getGiftIdFromParams() {
      var id = params.get('id');
      if (id) return id;
      for (var key of params.keys()) {
        if (/^[a-f0-9]{24}$/i.test(key)) return key;
      }
      var path = window.location.pathname || '';
      var m = path.match(/\/([a-f0-9]{24})(?:\/|$)/i);
      if (m) return m[1];
      return null;
    }
    var giftId = getGiftIdFromParams();
    var isPreview = params.get('preview') === '1';

    // Khai báo trước ở outer scope để button click handler gọi được
    // (function declarations inside try{} block-scoped trong strict mode)
    var applyGiftDataToLetter;
    var startExperience;

    function onGiftDataLoaded(data) {
      window.gift83Data = data;
      // Áp dụng màu hoa: nếu bản ghi có flowerColor thì dùng, nếu không thì lấy param URL hoặc mặc định 'da_quy' (Hoa Dã Quỳ)
      if (data && data.flowerColor) {
        applyFlowerColor(data.flowerColor);
      } else if (params.get('color')) {
        applyFlowerColor(params.get('color'));
      } else {
        applyFlowerColor('da_quy');
      }
      // Intro text: bản ghi cũ (không có introText) → mặc định; có chữ → gán; rỗng → set rỗng (không hiện câu chúc).
      try {
        var introTextEl = document.querySelector('.intro__text');
        if (introTextEl && data) {
          if (!('introText' in data)) {
            introTextEl.textContent = "Happy Women's Day 8/3";
          } else {
            introTextEl.textContent = String(data.introText || '').trim();
          }
        }
      } catch (e) {}
      setAudioSrc(data);
      if (pendingPlay) {
        pendingPlay = false;
        playAudio();
      }
      if (typeof applyGiftDataToLetter === 'function') applyGiftDataToLetter(data);
    }

    if (isPreview && params.get('demo') !== '1') {
      // Thêm watermark "Xem demo"
      var watermark = document.createElement('div');
      watermark.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99998',
        'display:flex', 'align-items:center', 'justify-content:center',
        'pointer-events:none', 'overflow:hidden'
      ].join(';');
      watermark.innerHTML = '<span style="' + [
        'font-family:Pacifico,Dancing Script,cursive',
        'font-size:clamp(60px,18vw,160px)',
        'font-weight:900',
        'color:rgba(255,255,255,0.18)',
        'letter-spacing:0.05em',
        'text-align:center',
        'line-height:1',
        'transform:rotate(-30deg)',
        'white-space:nowrap',
        'text-shadow:0 2px 20px rgba(0,0,0,0.15)',
        'user-select:none'
      ].join(';') + '">Xem demo</span>';
      document.body.appendChild(watermark);

      // Chế độ xem trước: đọc data từ IndexedDB
      loadPreviewData().then(function(previewData) {
        if (previewData) {
          // Chuyển vipPhotos base64 → dạng url để dùng làm flyingImages
          if (previewData.vipPhotos && previewData.vipPhotos.length > 0) {
            previewData.flyingImages = previewData.vipPhotos;
          }
          // Custom music base64 → gán thẳng vào audio.src
          if (previewData.musicType === 'Custom' && previewData.customMusic) {
            previewData.musicPath = null; // tránh xung đột
          }
          onGiftDataLoaded(previewData);
        }
      }).catch(function(e) {
        console.warn('⚠️ Không thể đọc preview data:', e);
      });
    } else if (giftId) {
      fetch(SERVER_URL + '/api/gift83s/' + giftId)
        .then(function(res) { return res.json(); })
        .then(function(result) {
          if (result.success && result.data) {
            onGiftDataLoaded(result.data);
          } else if (window.DEFAULT_GIFT_DATA) {
            onGiftDataLoaded(window.DEFAULT_GIFT_DATA);
          } else {
            console.warn('⚠️ Gift data không hợp lệ:', result);
          }
        })
        .catch(function(err) {
          console.error('❌ Lỗi fetch gift data:', err);
          if (window.DEFAULT_GIFT_DATA) {
            onGiftDataLoaded(window.DEFAULT_GIFT_DATA);
          }
        });
    } else if (window.DEFAULT_GIFT_DATA) {
      onGiftDataLoaded(window.DEFAULT_GIFT_DATA);
    }
    
    try {
  // Generar partículas blancas animadas que suben desde abajo
  function randomBetween(a, b) {
    return Math.random() * (b - a) + a;
  }
  function createParticles() {
    const particlesContainer = document.querySelector('.particles');
      if (!particlesContainer) {
        console.error('❌ [Tulipanes] Không tìm thấy .particles container!');
        return;
      }
    const numParticles = 24;
    for (let i = 0; i < numParticles; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      // Vị trí ngang ngẫu nhiên
      p.style.left = randomBetween(0, 100) + 'vw';
      // Kích thước hạt nhỏ tinh xảo
      const size = randomBetween(0.4, 0.95);
      p.style.width = size + 'vmin';
      p.style.height = size + 'vmin';
      // Thời gian bay và độ trễ ngẫu nhiên mượt mà
      const duration = randomBetween(4.5, 9);
      const delay = randomBetween(0, 6);
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = delay + 's';
      particlesContainer.appendChild(p);
    }
  }
    
  createParticles();
    
  // Đọc gift83Data từ window (nếu có sẵn, hoặc sẽ được set bởi fetch ở trên)
  var gift83Data = window.gift83Data || null;

  // Các phần tử hiệu ứng
  var introEl = document.getElementById('intro');
  var ramoEl = document.querySelector('.ramo');
  var ramoImg = ramoEl ? ramoEl.querySelector('img') : null;
  var flowerBowEl = document.querySelector('.flower-bow');

  function showRamoAndRest() {
    if (ramoEl) ramoEl.classList.add('ramo--visible');
    if (flowerBowEl) flowerBowEl.classList.add('flower-bow--visible');
    document.querySelectorAll('.rabbit').forEach(function(rabbit) {
      rabbit.classList.add('rabbit--visible');
    });
    var letterEl = document.querySelector('.letter');
    if (letterEl) letterEl.classList.add('letter--visible');
  }

  function tryShowBouquet() {
    if (ramoImg && ramoImg.complete) {
      showRamoAndRest();
    } else if (ramoImg) {
      ramoImg.addEventListener('load', showRamoAndRest);
      ramoImg.addEventListener('error', showRamoAndRest);
      setTimeout(showRamoAndRest, 8000);
    } else {
      showRamoAndRest();
    }
  }

  // Gán vào biến đã khai báo ở outer scope để button click handler gọi được
  startExperience = function() {
    if (bouquetTimer) clearTimeout(bouquetTimer);
    if (introTimer) clearTimeout(introTimer);
    if (flowersPauseTimer) clearTimeout(flowersPauseTimer);

    // 1. Đảm bảo các class hiển thị chưa được set (reset sạch)
    if (ramoEl) ramoEl.classList.remove('ramo--visible');
    if (flowerBowEl) flowerBowEl.classList.remove('flower-bow--visible');
    document.querySelectorAll('.rabbit').forEach(function(r) { r.classList.remove('rabbit--visible'); });
    var letterEl = document.querySelector('.letter');
    if (letterEl) letterEl.classList.remove('letter--visible');
    if (introEl) {
      introEl.classList.remove('is-done');
      introEl.style.animation = 'none';
      void introEl.offsetHeight;
      introEl.style.animation = '';
    }

    // 2. Xóa not-loaded, nhưng giữ hoa pause thêm 0.5s
    var flowersEl = document.querySelector('.flowers');
    if (flowersEl) flowersEl.classList.add('flowers--paused');
    document.body.classList.remove('not-loaded');
    flowersPauseTimer = setTimeout(function() {
      if (flowersEl) flowersEl.classList.remove('flowers--paused');
    }, 500);

    // 3. Bó hoa hiện sau 3.5s (độc lập với intro)
    bouquetTimer = setTimeout(function() {
      tryShowBouquet();
    }, 3500);

    // 4. Intro fade out êm ái sau 6s (độc lập với bó hoa)
    introTimer = setTimeout(function() {
      if (introEl) introEl.classList.add('is-done');
    }, 6000);
  };

  // Tự động mở hoa nếu có cờ autostart / inline / demo (dành cho khung xem trước iPhone trên trang tạo)
  if (params.get('demo') === '1') {
    if (orientationOverlay) orientationOverlay.style.display = 'none';
    document.body.classList.remove('not-loaded');
    document.body.classList.add('demo-instant');
    var flowersEl = document.querySelector('.flowers');
    if (flowersEl) flowersEl.classList.remove('flowers--paused');
    if (typeof showRamoAndRest === 'function') showRamoAndRest();
  } else if (params.get('autostart') === '1' || params.get('inline') === '1') {
    setTimeout(function() {
      if (typeof openExperience === 'function') {
        openExperience();
      }
      setTimeout(function() {
        if (typeof showRamoAndRest === 'function') {
          showRamoAndRest();
        }
      }, 1200);
    }, 250);
  }

    // Modal thư: click phong bì mở, có tiêu đề + nội dung
    var letterEnvelope = document.querySelector('.letter');
    var letterModal = document.getElementById('letterModal');
    var letterCloseBtn = document.getElementById('letterClose');
    var letterTitleEl = document.getElementById('letterTitle');
    var letterContentEl = document.getElementById('letterContent');
    var letterModalFooter = document.getElementById('letterModalFooter');
    var letterBtnContinue = document.getElementById('letterBtnContinue');
    var photoFloatContainer = document.getElementById('photoFloatContainer');
    var letterBoxWrap = letterModal ? letterModal.querySelector('.letter-modal__box-wrap') : null;
    var letterScrollHint = document.getElementById('letterScrollHint');
    var letterBox = letterModal ? letterModal.querySelector('.letter-modal__box') : null;

    function updateLetterScrollHint() {
      if (!letterBox || !letterScrollHint) return;
      var maxScroll = letterBox.scrollHeight - letterBox.clientHeight;
      var isScrollable = maxScroll > 16;
      var isAtBottom = (maxScroll - letterBox.scrollTop) <= 16;
      if (isScrollable && !isAtBottom) {
        letterScrollHint.classList.add('is-visible');
      } else {
        letterScrollHint.classList.remove('is-visible');
      }
    }

    if (letterBox) {
      letterBox.addEventListener('scroll', updateLetterScrollHint, { passive: true });
    }
    if (letterScrollHint && letterBox) {
      letterScrollHint.addEventListener('click', function(e) {
        e.stopPropagation();
        letterBox.scrollBy({ top: 140, behavior: 'smooth' });
      });
    }

    // ── Luôn căn giữa lá thư theo chiều dọc: nội dung dài ra → cả lá thư trượt mượt lên trên ──
    var centerRaf = null;
    function centerLetterBox(snap) {
      if (!letterModal || !letterBoxWrap) return;
      var cs = window.getComputedStyle(letterModal);
      var avail = letterModal.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      var off = Math.max(0, (avail - letterBoxWrap.offsetHeight) / 2); // offsetHeight không bị ảnh hưởng bởi scale
      if (snap) {
        letterModal.classList.add('letter-modal--snap');
        letterBoxWrap.style.setProperty('--lm-offset', off.toFixed(1) + 'px');
        void letterBoxWrap.offsetHeight;
        letterModal.classList.remove('letter-modal--snap');
      } else {
        letterBoxWrap.style.setProperty('--lm-offset', off.toFixed(1) + 'px');
      }
      updateLetterScrollHint();
    }
    if (letterBoxWrap) {
      if (window.ResizeObserver) {
        new ResizeObserver(function() {
          if (!centerRaf) {
            centerRaf = requestAnimationFrame(function() {
              centerRaf = null;
              centerLetterBox(false);
              updateLetterScrollHint();
            });
          }
        }).observe(letterBoxWrap);
      }
      window.addEventListener('resize', function() {
        centerLetterBox(true);
        updateLetterScrollHint();
      });
    }

    var letterData = {
      title: 'Gửi người tôi yêu thương nhất',
      content: 'Hôm nay, tôi muốn gửi đến bạn những lời chân thành từ tận đáy lòng. Mỗi ngày trôi qua, tôi đều cảm thấy may mắn vì có bạn bên cạnh.',
      signature: 'Người yêu bạn ❤️',
      flyingImages: [],
      hasVipPhotos: false
    };

    // Gán hàm vào biến đã khai báo ở outer scope để onGiftDataLoaded dùng được
    applyGiftDataToLetter = function(data) {
      if (!data) return;
      if (data.letterTitle) letterData.title = data.letterTitle;
      if (data.letterContent != null) {
        letterData.content = Array.isArray(data.letterContent)
          ? data.letterContent.join('\n\n')
          : String(data.letterContent);
      }
      if (data.letterSignature) letterData.signature = data.letterSignature;
      // vipPhotos dùng làm ảnh bay nếu có
      if (data.vipPhotos && Array.isArray(data.vipPhotos) && data.vipPhotos.length > 0) {
        letterData.flyingImages = data.vipPhotos;
        letterData.hasVipPhotos = true;
      } else if (data.flyingImages && Array.isArray(data.flyingImages) && data.flyingImages.length > 0) {
        letterData.flyingImages = data.flyingImages;
        letterData.hasVipPhotos = true;
      }
    };

    // Áp dụng ngay nếu data đã có (ví dụ từ window.gift83Data set trước)
    if (gift83Data) applyGiftDataToLetter(gift83Data);

    var letterTypingTimeout = null;

    /** Lặp theo grapheme (emoji 1 đơn vị). chars = Array.from(text) gọi từ ngoài để tránh vỡ icon/emoji (surrogate pair). */
    function typeChar(chars, index, el, onDone) {
      if (index >= chars.length) {
        if (onDone) onDone();
        return;
      }
      var ch = chars[index];
      if (ch === '\n') {
        el.appendChild(document.createElement('br'));
      } else {
        el.appendChild(document.createTextNode(ch));
      }
      if (letterModal && letterModal.classList.contains('is-open')) {
        var box = letterModal.querySelector('.letter-modal__box');
        if (box && (box.scrollHeight - box.clientHeight > 10)) {
          box.scrollTop = box.scrollHeight;
        }
        updateLetterScrollHint();
      }
      var delay = ch.length > 1 || (ch.codePointAt && ch.codePointAt(0) > 0xFFFF)
        ? 50
        : (/[.,!?;:]/.test(ch) ? 70 : (ch === ' ' ? 32 : 28));
      letterTypingTimeout = setTimeout(function() {
        typeChar(chars, index + 1, el, onDone);
      }, delay);
    }

    function openLetterModal() {
      if (letterTitleEl) letterTitleEl.textContent = '';
      if (letterContentEl) letterContentEl.innerHTML = '';
      if (letterModalFooter) letterModalFooter.style.display = 'none';
      if (letterScrollHint) letterScrollHint.classList.remove('is-visible');
      if (letterBox) letterBox.scrollTop = 0;
      centerLetterBox(true); // đặt vị trí ban đầu ngay lập tức, không trượt
      if (letterModal) letterModal.classList.add('is-open');

      function runTyping() {
        var titleDone = false;
        function onTitleDone() {
          titleDone = true;
          if (letterContentEl) {
            var paragraphs = letterData.content.split(/\n\n+/);
            var paraIndex = 0;
            function typeNextParagraph() {
              if (paraIndex >= paragraphs.length) {
                if (letterData.signature) {
                  var sigWrap = document.createElement('p');
                  sigWrap.className = 'letter-modal__signature-wrap';
                  sigWrap.style.margin = '20px 0 0 0';
                  var sigEl = document.createElement('span');
                  sigEl.className = 'letter-modal__signature';
                  letterContentEl.appendChild(sigWrap);
                  sigWrap.appendChild(sigEl);
                  typeChar(Array.from(letterData.signature), 0, sigEl, function() {
                    if (letterModalFooter && letterData.hasVipPhotos) letterModalFooter.style.display = 'block';
                    updateLetterScrollHint();
                  });
                } else {
                  if (letterModalFooter && letterData.hasVipPhotos) letterModalFooter.style.display = 'block';
                  updateLetterScrollHint();
                }
                return;
              }
              var p = document.createElement('p');
              p.style.margin = '0 0 12px 0';
              letterContentEl.appendChild(p);
              var paraText = paragraphs[paraIndex].replace(/\n/g, '\n');
              typeChar(Array.from(paraText), 0, p, function() {
                paraIndex++;
                typeNextParagraph();
              });
            }
            typeNextParagraph();
          }
        }
        if (letterTitleEl && letterData.title) {
          typeChar(Array.from(letterData.title), 0, letterTitleEl, onTitleDone);
        } else {
          onTitleDone();
        }
      }
      setTimeout(runTyping, 80);
    }

    function closeLetterModal() {
      if (letterTypingTimeout) {
        clearTimeout(letterTypingTimeout);
        letterTypingTimeout = null;
      }
      if (letterScrollHint) letterScrollHint.classList.remove('is-visible');
      if (letterModal) letterModal.classList.remove('is-open');
      var letterEl = document.querySelector('.letter');
      if (letterEl) {
        setTimeout(function() {
          letterEl.classList.remove('is-opening');
          letterEl.style.removeProperty('--heart-fly-y');
        }, 200);
      }
    }

    var isLetterOpening = false;
    if (letterEnvelope) {
      letterEnvelope.addEventListener('click', function(e) {
        e.preventDefault();
        if (isLetterOpening) return;
        // Phong bì chưa hiện thì không cho mở
        if (!letterEnvelope.classList.contains('letter--visible')) return;
        if (letterModal && letterModal.classList.contains('is-open')) return;

        isLetterOpening = true;
        var letterEl = document.querySelector('.letter');
        if (letterEl) {
          // Tính toán khoảng cách bay đạt độ cao 55% theo chiều cao màn hình (cao hơn tâm một chút)
          var sealEl = letterEl.querySelector('.letter-seal');
          if (sealEl) {
            var rect = sealEl.getBoundingClientRect();
            var heartCenterY = rect.top + rect.height / 2;
            var targetCenterY = window.innerHeight * 0.45; // 55% từ dưới đáy lên
            var flyDistY = targetCenterY - heartCenterY;
            letterEl.style.setProperty('--heart-fly-y', flyDistY + 'px');
          }
          letterEl.classList.add('is-opening');
        }

        // Bước 1: Nắp bật mở (0 - 300ms)
        // Bước 2: Trái tim bay lên chính giữa màn hình (150ms - 750ms)
        // Bước 3: BÙM! Lá thư nổ tung xuất hiện tại tâm (820ms)
        setTimeout(function() {
          openLetterModal();
          isLetterOpening = false;
        }, 820);
      });
    }
    // Chỉ đóng modal khi bấm nút dấu X
    if (letterCloseBtn) letterCloseBtn.addEventListener('click', closeLetterModal);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && letterModal && letterModal.classList.contains('is-open')) {
        closeLetterModal();
      }
    });

    var flyingInterval = null;

    // ═══════════════════════════════════════════════════
    // 📸 ẢNH BAY THEO LÀN — KHÔNG ĐÈ NHAU
    // 1. Màn hình chia thành các làn dọc; ảnh (kể cả khi nghiêng) luôn nằm gọn trong làn → không đè ngang.
    // 2. Mọi ảnh bay cùng một vận tốc → ảnh sau không bao giờ đuổi kịp ảnh trước → không đè dọc.
    // 3. Làn chỉ nhận ảnh mới khi ảnh trước đã lên đủ cao (chiều cao ảnh + khoảng hở ngẫu nhiên).
    // 4. Ảnh xoay vòng theo thứ tự xáo trộn → ảnh nào cũng được xuất hiện, không lặp liền nhau.
    // 5. Mật độ tự điều chỉnh theo số ảnh người dùng tải lên.
    // ═══════════════════════════════════════════════════
    var shuffledUrls = [];
    var urlPointer = 0;
    var lastUrl = null;
    var photoRatios = {};   // url → tỉ lệ cao/rộng (đo từ preload)
    var flyLanes = [];      // mỗi làn: thời điểm sẵn sàng nhận ảnh mới
    var lastLane = -1;
    var nextSpawnAt = 0;

    function shuffleArray(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function nextUrl(urls) {
      // Hết vòng hoặc danh sách thay đổi → xáo lại.
      // Đẩy các ảnh vừa hiện ở cuối vòng trước xuống cuối vòng mới → ảnh trùng không đứng cạnh nhau.
      if (shuffledUrls.length !== urls.length || urlPointer >= shuffledUrls.length) {
        var prev = shuffledUrls.length === urls.length ? shuffledUrls : [];
        var k = Math.min(3, Math.floor(urls.length / 2));
        var recent = prev.slice(prev.length - k);
        var fresh = shuffleArray(urls);
        shuffledUrls = fresh.filter(function(u) { return recent.indexOf(u) === -1; })
          .concat(fresh.filter(function(u) { return recent.indexOf(u) !== -1; }));
        urlPointer = 0;
        if (shuffledUrls.length > 1 && shuffledUrls[0] === lastUrl) {
          var t = shuffledUrls[0]; shuffledUrls[0] = shuffledUrls[1]; shuffledUrls[1] = t;
        }
      }
      lastUrl = shuffledUrls[urlPointer++];
      return lastUrl;
    }

    function getFlyingUrls() {
      var defaultUrls = ['./assets/images/wrapper_flower.png'];
      return letterData.flyingImages && letterData.flyingImages.length > 0 ? letterData.flyingImages : defaultUrls;
    }

    function preloadFlyingPhotos() {
      getFlyingUrls().forEach(function(u) {
        if (photoRatios[u]) return;
        var im = new Image();
        im.onload = function() {
          if (im.naturalWidth) photoRatios[u] = im.naturalHeight / im.naturalWidth;
        };
        im.src = u;
      });
    }

    function getFlyLayout() {
      var W = window.innerWidth, H = window.innerHeight;
      var LANES, SIDE = 12;
      if (W <= H) {
        LANES = 2; // Màn dọc (điện thoại): chỉ 2 luồng để ảnh thoáng đãng, không bị chen chúc dày đặc
      } else {
        // Màn ngang (desktop/tablet): 3-4 luồng vừa vặn, không bị ngập tràn màn hình
        LANES = Math.max(3, Math.min(4, Math.round(2.0 * W / H)));
      }
      var laneW = Math.min((W - SIDE * 2) / LANES, W <= H ? 190 : 255);
      return {
        W: W, H: H,
        photoW: laneW - 8,            // bề rộng tối đa của ảnh trong luồng
        lanes: LANES,
        laneW: laneW,
        offsetX: (W - laneW * LANES) / 2, // màn rộng: các luồng gom về giữa cân đối
        maxH: H * ((W > H && H <= 500) ? 0.52 : (W <= H ? 0.40 : 0.36)),
        speed: H / 9.2       // Tốc độ bay êm ái, nhẹ nhàng, dễ ngắm và dễ chạm
      };
    }

    function launchFlyingPhoto(L, lane, url, now) {
      // Kích thước ngẫu nhiên 80–98% luồng → ảnh to nhỏ xen kẽ tự nhiên
      var w = Math.round(L.photoW * (0.80 + Math.random() * 0.18));
      var cardH = Math.round(10 + (w - 20) * (16 / 9) + 42);
      var h = cardH;

      // Góc nghiêng nhẹ nhàng thanh thoát
      var usable = L.laneW - 4;
      var sinMax = Math.max(0, Math.min((usable - w) / h, Math.sin(6 * Math.PI / 180)));
      var theta = Math.asin(sinMax) * (0.3 + Math.random() * 0.7) * (Math.random() < 0.5 ? -1 : 1);
      var s = Math.abs(Math.sin(theta)), c = Math.cos(theta);
      var rw = w * c + h * s;
      var rh = h * c + w * s;
      var jitter = Math.max(0, (usable - rw) / 2);
      var centerX = L.offsetX + lane * L.laneW + L.laneW / 2 + (Math.random() * 2 - 1) * jitter;

      // Xuất phát dưới mép màn hình, bay lên chậm rãi
      var overhang = (rh - h) / 2;
      var startTop = L.H + overhang + 6;
      var rise = startTop + h + overhang + 16;
      var dur = rise / L.speed;

      var wrap = document.createElement('div');
      wrap.className = 'photo-float';
      wrap.style.width = w + 'px';
      wrap.style.left = (centerX - w / 2).toFixed(1) + 'px';
      wrap.style.top = startTop.toFixed(1) + 'px';
      wrap.style.bottom = 'auto';
      wrap.style.setProperty('--rise', (-rise).toFixed(1) + 'px');
      wrap.style.setProperty('--float-rotate', (theta * 180 / Math.PI).toFixed(2) + 'deg');
      wrap.style.animationDuration = dur.toFixed(2) + 's';
      var img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.draggable = false;
      wrap.appendChild(img);
      wrap.addEventListener('animationend', function() {
        if (this._caught) return;
        if (this.parentNode) this.parentNode.removeChild(this);
      });
      photoFloatContainer.appendChild(wrap);

      // Khoảng hở dọc rộng rãi, thanh thoát (giải quyết triệt để "ảnh hơi dày")
      var gapY = L.H * (0.35 + Math.random() * 0.35);
      flyLanes[lane] = now + (rh + gapY) / L.speed * 1000;
      lastLane = lane;
    }

    function tickFlying() {
      if (!photoFloatContainer || !photoFloatContainer.classList.contains('is-active')) return;
      if (document.hidden) return;
      var now = performance.now();
      if (now < nextSpawnAt) return;

      var L = getFlyLayout();
      if (flyLanes.length !== L.lanes) {
        flyLanes = [];
        for (var k = 0; k < L.lanes; k++) flyLanes.push(0);
        lastLane = -1;
      }

      var free = [];
      for (var i = 0; i < flyLanes.length; i++) if (flyLanes[i] <= now) free.push(i);
      if (!free.length) return;

      var lane = free[(Math.random() * free.length) | 0];

      var urls = getFlyingUrls();
      launchFlyingPhoto(L, lane, nextUrl(urls), now);

      // Nhịp thả giãn cách (800ms - 1500ms) để ảnh trôi so le nghệ thuật, không chen lấn
      nextSpawnAt = now + 850 + Math.random() * 650;
    }

    function startFlyingPhotos() {
      closeLetterModal();
      document.body.classList.add('content-hidden');
      if (photoFloatContainer) photoFloatContainer.classList.add('is-active');
      photoFloatContainer.innerHTML = '';
      shuffledUrls = [];
      urlPointer = 0;
      lastUrl = null;
      flyLanes = [];
      lastLane = -1;
      nextSpawnAt = 0;
      preloadFlyingPhotos();
      if (flyingInterval) clearInterval(flyingInterval);
      tickFlying();
      flyingInterval = setInterval(tickFlying, 300);

      // Hiện banner hướng dẫn chạm ảnh
      var guideBanner = document.getElementById('photoGuideBanner');
      if (guideBanner) {
        guideBanner.classList.add('is-visible');
      }
    }
    // ═══════════════════════════════════════════════════
    // ✨ THƯ FADE OUT → HOA TAN THÀNH BỤI → BÙM HẠT TRẮNG VÀNG → ẢNH BAY
    // ═══════════════════════════════════════════════════
    var dissolveTimers = [];
    var dissolveCanvas = null;
    var dissolveRaf = null;
    var isDissolving = false;
    var DISSOLVE_TOTAL = 2400;   // hoa rã hạt từ gốc lên ngọn
    var glyphRaf = null;
    var dustSpawnLand = null;

    function clearDissolve() {
      dissolveTimers.forEach(clearTimeout);
      dissolveTimers = [];
      if (dissolveRaf) cancelAnimationFrame(dissolveRaf);
      dissolveRaf = null;
      if (dissolveCanvas && dissolveCanvas.parentNode) dissolveCanvas.parentNode.removeChild(dissolveCanvas);
      dissolveCanvas = null;
      isDissolving = false;
      if (glyphRaf) cancelAnimationFrame(glyphRaf);
      glyphRaf = null;
      dustSpawnLand = null;
      document.querySelectorAll('.letter-glyph-group, .letter-glyph-statics').forEach(function(g) { if (g.parentNode) g.parentNode.removeChild(g); });
      dissolveBandY = null;
      document.body.classList.remove('bouquet-dissolving', 'bouquet-absorbing');
      setAbsorb(null);
      if (letterModal) letterModal.classList.remove('is-fading-out', 'is-releasing', 'is-glyphs-out');
      document.querySelectorAll('.dz-staggered').forEach(function(el) {
        el.style.removeProperty('--dd');
        el.classList.remove('dz-staggered');
      });
      document.querySelectorAll('.ramo > img, .flower-bow > img').forEach(function(img) {
        img.style.removeProperty('--mz');
      });
    }

    function fadeOutLetterModal() {
      if (letterTypingTimeout) {
        clearTimeout(letterTypingTimeout);
        letterTypingTimeout = null;
      }
      if (!letterModal) return;
      letterModal.classList.add('is-fading-out');
      letterModal.classList.remove('is-open');
      dissolveTimers.push(setTimeout(function() {
        letterModal.classList.remove('is-fading-out', 'is-releasing', 'is-glyphs-out');
      }, 1600));
    }

    function getBouquetRect() {
      var els = [ramoEl, flowerBowEl].concat(Array.prototype.slice.call(document.querySelectorAll('.flower__leafs')));
      var l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      els.forEach(function(el) {
        if (!el) return;
        var rc = el.getBoundingClientRect();
        if (rc.width < 2 || rc.height < 2) return;
        l = Math.min(l, rc.left); t = Math.min(t, rc.top);
        r = Math.max(r, rc.right); b = Math.max(b, rc.bottom);
      });
      if (l === Infinity) {
        var w = window.innerWidth, h = window.innerHeight;
        return { left: w * 0.3, top: h * 0.3, width: w * 0.4, height: h * 0.5 };
      }
      return { left: l, top: t, width: r - l, height: b - t };
    }

    function runBouquetDissolve(onBurst, rectIn, dissolveAt) {
      var W = window.innerWidth, H = window.innerHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var isMobile = W <= 600;
      var rect = rectIn || getBouquetRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height * 0.42;
      dissolveAt = dissolveAt || 0;
      var dissolveStarted = false;

      dissolveCanvas = document.createElement('canvas');
      dissolveCanvas.className = 'bouquet-dust-canvas';
      dissolveCanvas.width = W * dpr;
      dissolveCanvas.height = H * dpr;
      document.body.appendChild(dissolveCanvas);
      var ctx = dissolveCanvas.getContext('2d');
      ctx.scale(dpr, dpr);

      var palette = ['255,255,255', '248,252,255', '224,242,254', '186,230,253', '147,210,255', '125,211,252'];
      // Sắc ấm của lá thư (hồng + vàng lãng mạn) — chỉ điểm xuyết
      var warmPalette = ['255,214,230', '252,190,215', '255,236,200', '253,224,171'];
      function pickColor(warmChance) {
        return Math.random() < warmChance
          ? warmPalette[(Math.random() * warmPalette.length) | 0]
          : palette[(Math.random() * palette.length) | 0];
      }
      var parts = [];
      var DISSOLVE_MS = DISSOLVE_TOTAL;
      var start = performance.now();
      var burstDone = false;
      var flash = null;
      var landGlows = [];
      var bottomY = rect.top + rect.height;

      // Nhóm chữ rã hạt: các hạt bụi sáng li ti bay nhẹ
      dustSpawnLand = function(x, y, w) {
        w = w || 10;
        var cnt = Math.min(8, 3 + Math.round(w / 10));
        for (var j = 0; j < cnt; j++) {
          var a = Math.random() * Math.PI * 2;
          var sp = 0.4 + Math.random() * 1.0;
          parts.push({
            x: x + (Math.random() - 0.5) * w, y: y + (Math.random() - 0.5) * 6,
            vx: Math.cos(a) * sp * 0.5, vy: 0.5 + Math.random() * 1.0,
            fr: 0.97, g: 0.03,
            size: 0.5 + Math.random() * 0.6,
            life: 0, max: 900 + Math.random() * 600,
            c: pickColor(0.25),
            tw: Math.random() * Math.PI * 2
          });
        }
      };

      // Giấy gói + nơ: mặt nạ quét từ đáy lên
      var maskImgs = [];
      function updateMasks(prog) {
        var bandY = bottomY - prog * rect.height * 1.1;
        maskImgs.forEach(function(m) {
          var local = (m.rc.bottom - bandY) / m.rc.height;
          m.el.style.setProperty('--mz', local.toFixed(4));
        });
      }

      var flowerNodes = [];
      function cacheFlowerNodes() {
        flowerNodes = Array.prototype.slice.call(document.querySelectorAll('.flower__leafs')).map(function(el) {
          var r = el.getBoundingClientRect();
          return {
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            rx: Math.max(r.width * 0.46, 16),
            ry: Math.max(r.height * 0.46, 16)
          };
        }).filter(function(f) { return f.cx > 0 && f.cy > 0; });
      }

      // Giai đoạn hóa ánh sáng: chỉ bắt đầu khi hoa đã hấp thụ hết chữ
      function startDissolvePhase() {
        cacheFlowerNodes();
        document.querySelectorAll('.rabbit, .letter, .flower__line, .flower__leafs, .monte').forEach(function(el) {
          var rc = el.getBoundingClientRect();
          var midY = rc.height > 0 ? rc.top + rc.height * 0.5 : rc.top;
          var norm = Math.min(Math.max((bottomY - midY) / rect.height, 0), 1);
          // Lệch pha hữu cơ ngẫu nhiên để các chi tiết/cánh hoa không biến mất thành một đường ngang cứng nhắc
          var jitter = (Math.random() - 0.5) * 0.16;
          var delayed = Math.min(Math.max(norm + jitter, 0), 1);
          el.style.setProperty('--dd', (delayed * DISSOLVE_MS * 0.82 / 1000).toFixed(3) + 's');
          el.classList.add('dz-staggered');
        });
        maskImgs = Array.prototype.slice.call(document.querySelectorAll('.ramo > img, .flower-bow > img'))
          .map(function(img) { return { el: img, rc: img.getBoundingClientRect() }; })
          .filter(function(m) { return m.rc.height > 0; });
        updateMasks(0);
        void document.body.offsetHeight;
        document.body.classList.add('bouquet-dissolving');
      }

      function spawnDust(prog) {
        // Hạt tan biến mềm mại hữu cơ, bất quy tắc — không theo khung chữ nhật, không thành đường thẳng ngang
        var x, y;

        // 1. Phân bổ từ các cụm bông hoa tự nhiên (tạo các quầng hạt tròn ôm theo cánh hoa)
        var spawnFromFlower = flowerNodes.length > 0 && (Math.random() < Math.min(0.3 + prog * 0.5, 0.75));
        if (spawnFromFlower) {
          var fl = flowerNodes[(Math.random() * flowerNodes.length) | 0];
          var theta = Math.random() * Math.PI * 2;
          var dist = Math.pow(Math.random(), 0.7) * fl.rx;
          x = fl.cx + Math.cos(theta) * dist + (Math.random() - 0.5) * 10;
          y = fl.cy + Math.sin(theta) * (dist * 0.85) + (Math.random() - 0.5) * 10;
        } else {
          // 2. Thân bó hoa & giấy gói: theo hình nón xòe tự nhiên (tapered cone) + phân bố Gaussian (không có cạnh vuông)
          var pY = Math.min(Math.max(prog + (Math.random() - 0.5) * 0.38, 0), 1);
          // Độ rộng bó hoa thay đổi theo độ cao: đáy thon hẹp (0.32), giữa mở dần (0.65), tán hoa xòe rộng (0.95)
          var taper = 0.32 + Math.pow(pY, 0.75) * 0.63;
          var halfW = rect.width * 0.5 * taper;

          // Phân bố Gaussian (hình chuông): dày ở tâm bó hoa, thưa dần ra ngoài, triệt tiêu hoàn toàn viền đứng vuông
          var u = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
          x = cx + u * halfW + (Math.random() - 0.5) * 12;

          // Đường tan cong hữu cơ: đỉnh vòm cung ở giữa + sóng nhấp nhô fractal + tán thể tích theo chiều sâu
          var normX = Math.min(Math.max((x - (cx - halfW)) / (halfW * 2 || 1), 0), 1);
          var dome = Math.sin(normX * Math.PI) * rect.height * 0.16; // Vòm cong tự nhiên của tán hoa
          var wave = Math.sin(normX * 9.5 + prog * 4.2) * 16 + Math.cos(normX * 18.2) * 10; // Sóng nhấp nhô
          var depth = (Math.random() + Math.random() - 1.0) * rect.height * 0.20; // Phân tán đám mây thể tích
          y = (bottomY - pY * rect.height * 1.05) - dome + wave + depth;
        }

        // Hướng bay: tỏa mềm mại sang 2 bên theo dáng bó hoa, vừa trôi lả lướt vừa hạ nhẹ
        var sideFactor = (x - cx) / (rect.width * 0.5 || 1); // vị trí so với tâm (-1: mép trái, +1: mép phải)
        var outDir = sideFactor >= 0 ? 1 : -1;
        var outSpeed = 0.5 + Math.abs(sideFactor) * 1.2 + Math.random() * 0.9;
        var vx = outDir * outSpeed + (Math.random() - 0.5) * 0.6;
        var vy = 0.25 + Math.random() * 0.95;
        var isSpark = Math.random() < 0.16;

        parts.push({
          x: x, y: y,
          vx: vx,
          vy: vy,
          fr: 0.991, g: 0.020,
          size: isSpark ? (0.85 + Math.random() * 0.8) : (0.42 + Math.random() * 0.55),
          h: isSpark ? 2.8 : 2.2,
          life: 0, max: 2000 + Math.random() * 1200,
          c: pickColor(0.14),
          tw: Math.random() * Math.PI * 2,
          swayFreq: 0.0025 + Math.random() * 0.003,
          swayAmp: 0.6 + Math.random() * 0.8
        });
      }

      function spawnBurst() {
        var n = isMobile ? 160 : 240;
        for (var i = 0; i < n; i++) {
          var a = Math.random() * Math.PI * 2;
          var sp = 1.5 + Math.pow(Math.random(), 0.6) * (isMobile ? 5.5 : 7);
          parts.push({
            x: cx + (Math.random() - 0.5) * 20,
            y: cy + (Math.random() - 0.5) * 20,
            vx: Math.cos(a) * sp * 0.8,
            vy: Math.abs(Math.sin(a)) * sp * 0.6 + 0.8,
            fr: 0.955, g: 0.045,
            size: 0.32 + Math.random() * 0.6, h: 1.8,
            life: 0, max: 1300 + Math.random() * 1200,
            c: palette[(Math.random() * palette.length) | 0],
            tw: Math.random() * Math.PI * 2
          });
        }
        flash = { t: 0, max: 700 };
      }

      var last = start;
      function frame(now) {
        var dt = Math.min(now - last, 40);
        last = now;
        var elapsed = now - start - dissolveAt;
        var k = dt / 16.67;

        if (elapsed < 0) {
          // Đang hấp thụ chữ: hoa chưa tan
          if (parts.length === 0 && !flash && landGlows.length === 0) {
            dissolveRaf = requestAnimationFrame(frame);
            return;
          }
        } else if (elapsed < DISSOLVE_MS) {
          if (!dissolveStarted) { dissolveStarted = true; startDissolvePhase(); }
          var prog = elapsed / DISSOLVE_MS;
          updateMasks(prog);
          dissolveBandY = bottomY - prog * rect.height * 1.1;
          var rate = (isMobile ? 5 : 8) * (0.5 + prog * 0.5);
          for (var s = 0; s < rate * k; s++) spawnDust(prog);
        } else if (!burstDone) {
          if (!dissolveStarted) { dissolveStarted = true; startDissolvePhase(); }
          burstDone = true;
          dissolveBandY = -Infinity;
          updateMasks(1.3);
          // Không bùm: hạt bụi cứ thế bay lên trời, ảnh tiếp nối ngay
          if (typeof onBurst === 'function') onBurst();
        }

        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';

        if (flash) {
          flash.t += dt;
          var fp = flash.t / flash.max;
          if (fp < 1) {
            var rad = 40 + fp * Math.max(rect.width, 220) * 0.9;
            var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
            var fa = (1 - fp) * 0.55;
            grd.addColorStop(0, 'rgba(250,253,255,' + fa + ')');
            grd.addColorStop(0.4, 'rgba(125,211,252,' + (fa * 0.45) + ')');
            grd.addColorStop(1, 'rgba(125,211,252,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.fill();
          } else {
            flash = null;
          }
        }

        for (var gi = landGlows.length - 1; gi >= 0; gi--) {
          var lg = landGlows[gi];
          lg.t += dt;
          var gp = lg.t / lg.max;
          if (gp >= 1) { landGlows.splice(gi, 1); continue; }
          var gr = 6 + gp * 26;
          var ga = (gp < 0.2 ? gp / 0.2 : 1 - (gp - 0.2) / 0.8) * 0.5;
          var lgrd = ctx.createRadialGradient(lg.x, lg.y, 0, lg.x, lg.y, gr);
          lgrd.addColorStop(0, 'rgba(255,255,255,' + ga + ')');
          lgrd.addColorStop(0.45, 'rgba(147,210,255,' + (ga * 0.5) + ')');
          lgrd.addColorStop(1, 'rgba(125,211,252,0)');
          ctx.fillStyle = lgrd;
          ctx.beginPath();
          ctx.arc(lg.x, lg.y, gr, 0, Math.PI * 2);
          ctx.fill();
        }

        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i];
          p.life += dt;
          if (p.life >= p.max) { parts.splice(i, 1); continue; }
          p.vx *= Math.pow(p.fr, k);
          p.vy = p.vy * Math.pow(p.fr, k) + p.g * k;
          p.x += (p.vx + Math.sin(p.tw + p.life * (p.swayFreq || 0.004)) * (p.swayAmp || 0.4)) * k;
          p.y += p.vy * k;
          var lp = p.life / p.max;
          var alpha = (lp < 0.15 ? lp / 0.15 : 1 - (lp - 0.15) / 0.85);
          alpha *= 0.75 + 0.25 * Math.sin(p.tw + p.life * 0.012);
          ctx.fillStyle = 'rgba(' + p.c + ',' + alpha + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        if (burstDone && parts.length === 0 && !flash && landGlows.length === 0) {
          if (dissolveCanvas && dissolveCanvas.parentNode) dissolveCanvas.parentNode.removeChild(dissolveCanvas);
          dissolveCanvas = null;
          dissolveRaf = null;
          return;
        }
        dissolveRaf = requestAnimationFrame(frame);
      }
      dissolveRaf = requestAnimationFrame(frame);
    }

    // ═══════════════════════════════════════════════════
    // ✉️ CHỮ RỜI TRANG THƯ → NỐI THÀNH DẢI CONG ÔM BÓ HOA
    // Chữ được tách thành từng nhóm vài ký tự, giữ đúng vị trí trên dòng.
    // Chuyển động của chữ và độ mờ của giấy hoàn toàn tách riêng.
    // ═══════════════════════════════════════════════════
    var dissolveBandY = null; // đường tan đang dâng (do engine hạt cập nhật)

    // Đặt --absorb trực tiếp lên bó hoa thay vì body → không tính lại style toàn trang mỗi lần chữ đậu
    function setAbsorb(v) {
      document.querySelectorAll('.flowers, .ramo, .flower-bow').forEach(function(el) {
        if (v === null) el.style.removeProperty('--absorb');
        else el.style.setProperty('--absorb', v);
      });
    }

    function getClipRectFor(root) {
      var clip = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      var el = root;
      while (el && el !== document.body) {
        var cs = window.getComputedStyle(el);
        if (/(auto|scroll|hidden)/.test(cs.overflowY + ' ' + cs.overflowX)) {
          var r = el.getBoundingClientRect();
          clip = {
            left: Math.max(clip.left, r.left), top: Math.max(clip.top, r.top),
            right: Math.min(clip.right, r.right), bottom: Math.min(clip.bottom, r.bottom)
          };
        }
        if (el === letterModal) break;
        el = el.parentElement;
      }
      return clip;
    }

    function collectLetterGroups(maxGroups) {
      var chars = [];
      var range = document.createRange();
      [letterTitleEl, letterContentEl].forEach(function(root) {
        if (!root) return;
        var clip = getClipRectFor(root);
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var node;
        var lastParent = null, lastCs = null; // hiệu ứng gõ tạo mỗi ký tự 1 text node → cache style theo phần tử cha
        while ((node = walker.nextNode())) {
          var txt = node.nodeValue || '';
          var parent = node.parentElement;
          var cs = parent === lastParent ? lastCs : null;
          for (var i = 0; i < txt.length; i++) {
            var len = 1;
            var code = txt.charCodeAt(i);
            if (code >= 0xD800 && code <= 0xDBFF && i + 1 < txt.length) len = 2;
            var ch = txt.substr(i, len);
            if (/\s/.test(ch)) { chars.push({ space: true }); continue; }
            range.setStart(node, i);
            range.setEnd(node, i + len);
            var r = range.getBoundingClientRect();
            i += len - 1;
            if (r.width <= 0 || r.height <= 0) continue;
            if (r.top < clip.top - 1 || r.bottom > clip.bottom + 1 || r.left < clip.left - 1 || r.right > clip.right + 1) continue;
            if (!cs) { cs = window.getComputedStyle(parent); lastParent = parent; lastCs = cs; }
            chars.push({ ch: ch, r: r, parent: parent, cs: cs });
          }
        }
        chars.push({ space: true });
      });

      var visible = 0;
      chars.forEach(function(c) { if (!c.space) visible++; });
      if (!visible) return [];
      var groupLen = Math.max(2, Math.ceil(visible / maxGroups));
      var hardMax = Math.max(Math.ceil(groupLen * 1.6), 8);

      var groups = [];
      var cur = null;
      var prevSpace = false;
      chars.forEach(function(c) {
        if (c.space) { prevSpace = true; return; }
        var newLine = cur && Math.abs(c.r.top - cur.lineTop) > c.r.height * 0.5;
        var full = cur && (cur.chars.length >= hardMax || (cur.chars.length >= groupLen && prevSpace));
        if (!cur || newLine || full || c.parent !== cur.parent) {
          cur = { chars: [], lineTop: c.r.top, parent: c.parent };
          groups.push(cur);
        }
        cur.chars.push(c);
        prevSpace = false;
      });
      return groups;
    }

    function buildGroupElement(g, host) {
      var l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      g.chars.forEach(function(c) {
        l = Math.min(l, c.r.left); t = Math.min(t, c.r.top);
        r = Math.max(r, c.r.right); b = Math.max(b, c.r.bottom);
      });
      var el = document.createElement('div');
      el.className = 'letter-glyph-group';
      el.style.left = l + 'px';
      el.style.top = t + 'px';
      el.style.width = (r - l) + 'px';
      el.style.height = (b - t) + 'px';
      var color = g.chars[0].cs.color;
      if (!color || color === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(color)) color = '#c2185b';
      el.style.color = color;
      g.chars.forEach(function(c) {
        var s = document.createElement('span');
        s.textContent = c.ch;
        s.style.left = (c.r.left - l) + 'px';
        s.style.top = (c.r.top - t) + 'px';
        s.style.width = c.r.width + 'px';
        s.style.height = c.r.height + 'px';
        s.style.font = c.cs.fontStyle + ' ' + c.cs.fontWeight + ' ' + c.cs.fontSize + '/' + c.r.height + 'px ' + c.cs.fontFamily;
        el.appendChild(s);
      });
      host.appendChild(el);
      g.el = el;
      g.ox = (l + r) / 2;
      g.oy = (t + b) / 2;
      g.w = r - l;
    }

    // Trả về mốc thời gian (ms tính từ lúc bấm) để bắt đầu cho hoa rã hạt
    function launchLetterGlyphs(rect, onPaperFade) {
      var W = window.innerWidth;
      var isMobile = W <= 600;
      var all = collectLetterGroups(100000); // tách theo từng từ
      if (!all.length) return null;

      // Chỉ lấy 5-7 từ bay đi để thanh thoát, tao nhã, ôm gọn bó hoa và 60fps mượt mà
      var K = isMobile ? 5 : 7;
      var cand = all.filter(function(g) { return g.chars.length >= 2 && g.chars.length <= 7; });
      if (cand.length < K) cand = all;
      var groups = [];
      if (cand.length <= K) {
        groups = cand.slice();
      } else {
        var step = cand.length / K;
        for (var gi = 0; gi < K; gi++) groups.push(cand[Math.min(cand.length - 1, Math.floor(gi * step + Math.random() * step * 0.7))]);
      }
      var statics = all.filter(function(g) { return groups.indexOf(g) === -1; });

      // Dựng DOM một lượt: chữ đứng yên gom vào 1 lớp (mờ cả lớp một lần, không tạo hàng trăm layer),
      // chữ bay mới được tách layer riêng
      var staticLayer = document.createElement('div');
      staticLayer.className = 'letter-glyph-statics';
      statics.forEach(function(g) { buildGroupElement(g, staticLayer); });
      var flyFrag = document.createDocumentFragment();
      groups.forEach(function(g) { buildGroupElement(g, flyFrag); g.el.classList.add('is-flying'); });
      document.body.appendChild(staticLayer);
      document.body.appendChild(flyFrag);
      // Ẩn bản chữ gốc ngay khi bản tách đã nằm đúng chỗ → chỗ nào chữ rời đi sẽ trống
      if (letterModal) letterModal.classList.add('is-glyphs-out');

      var n = groups.length;
      // Thứ tự rời trang: lệch nhịp, thiên về đọc từ trên xuống
      var order = groups.map(function(g, i) { return { g: g, key: i + Math.random() * n * 0.35 }; })
        .sort(function(a, b) { return a.key - b.key; })
        .map(function(o) { return o.g; });

      var DEPART_START = 400;                                  // lắng đọng một nhịp sau khi bấm nút để người xem sẵn sàng
      var DEPART_SPAN = Math.min(Math.max(n * 300, 1500), 2100); // từng chữ nối đuôi nhau rời trang
      var HOLD_MS = 550;                                       // chữ bừng sáng, nhấc bổng khỏi mặt giấy (phồng + nổi lên) trước khi bay
      var LIFT_UP = 10;                                        // nhấc lên bao nhiêu px trong pha nổi khỏi giấy
      var LIFT_SC = 0.16;                                      // phồng to bao nhiêu trong pha nổi khỏi giấy
      var lastArrive = 0;
      order.forEach(function(g, j) {
        var f = n > 1 ? j / (n - 1) : 0;
        g.departAt = DEPART_START + f * DEPART_SPAN + (Math.random() - 0.5) * 80;
        g.liftX = (Math.random() - 0.5) * 40;                  // hướng nhấc khỏi giấy (tay cầm đầu của đường cong)
        g.liftY = 90 + Math.random() * 50;                     // vút hẳn lên khỏi lá thư trước khi lượn về hoa
        g.moveDur = 1700 + Math.random() * 300;               // bay lượn mềm mại về bó hoa
        g.arriveAt = g.departAt + HOLD_MS + g.moveDur;
        g.s = 0.03 + f * 0.94;                                 // vị trí trên dải cong (0 = gốc, 1 = ngọn)
        g.arcX = (Math.random() - 0.5) * 70;
        g.arcY = 40 + Math.random() * 50;
        g.ph = Math.random() * Math.PI * 2;
        g.state = 0;
        g.z = 1100;
        lastArrive = Math.max(lastArrive, g.arriveAt);
      });

      // Dải cong xoắn quanh bó hoa (có trước/sau để tạo chiều sâu)
      var cx = rect.left + rect.width / 2;
      var yBottom = rect.top + rect.height * 0.88;
      var yTop = rect.top + rect.height * 0.06;
      var TURNS = 1.7;
      var OMEGA = 0.00085;
      var maxR = Math.max(40, Math.min(cx - 24, W - cx - 24));
      function ribbonPos(s, t) {
        // Ôm sát hình nón bó hoa: hẹp ở cuống, rộng dần lên ngọn
        var R = Math.min(rect.width * (0.2 + 0.26 * s) + 6, maxR);
        var a = s * TURNS * Math.PI * 2 + t * OMEGA;
        var sa = Math.sin(a);
        return {
          x: cx + Math.cos(a) * R,
          y: yBottom - s * (yBottom - yTop) + sa * R * 0.14,
          d: sa,
          trail: sa * R                                        // hướng ngược chiều quay → chữ lượn vào theo dòng xoắn
        };
      }

      function easeInOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }

      // Giấy chỉ mờ khi phần lớn chữ bay đã RỜI HẲN khỏi lá thư (đi được ~45% quãng đường), để người xem thấy rõ chữ thoát khỏi trang
      var paperFadeAt = Math.max(1, Math.ceil(n * 0.7));
      var LEFT_U = 0.35;
      var departed = 0, arrived = 0, leftPaper = 0, paperFaded = false;
      var t0 = performance.now();

      function popGroup(g, x, y, sc) {
        g.state = 3;
        if (g.el.parentNode) g.el.parentNode.removeChild(g.el);
        if (typeof dustSpawnLand === 'function') dustSpawnLand(x, y, g.w * sc);
      }

      function tick(now) {
        var t = now - t0;
        var alive = 0;
        for (var i = 0; i < n; i++) {
          var g = groups[i];
          if (g.state === 3) continue;
          alive++;
          if (t < g.departAt) continue; // vẫn nằm yên trên giấy

          if (g.state === 0) {
            g.state = 1;
            g.el.classList.remove('is-awake');
            g.el.classList.add('is-warm');
            departed++;
          }

          var lt = t - g.departAt;
          var x, y, sc, op, z = 1100;

          if (lt < HOLD_MS) {
            // Nhấc khỏi mặt giấy: sáng lên, phồng to và nổi dần lên — chỗ chữ vừa rời trên giấy để trống
            var e = easeInOutSine(lt / HOLD_MS);
            x = g.ox; y = g.oy - LIFT_UP * e;
            sc = 1 + LIFT_SC * e;
            op = 1;
          } else {
            var S = ribbonPos(g.s, t);
            var orbitSc = 0.82 + 0.26 * (S.d + 1) / 2;
            var orbitOp = 0.38 + 0.62 * (S.d + 1) / 2;
            var u = Math.min((lt - HOLD_MS) / g.moveDur, 1);
            // Đếm chữ đã rời hẳn lá thư → đủ số thì giấy mới mờ đi
            if (!g.left && u >= LEFT_U) {
              g.left = true;
              leftPaper++;
              if (!paperFaded && leftPaper >= paperFadeAt) {
                paperFaded = true;
                if (typeof onPaperFade === 'function') onPaperFade();
                staticLayer.classList.add('is-fading');
                dissolveTimers.push(setTimeout(function() {
                  if (staticLayer.parentNode) staticLayer.parentNode.removeChild(staticLayer);
                }, 1500));
                // Chữ chưa bay vẫn rõ trên nền đêm khi giấy mờ đi
                groups.forEach(function(o) { if (o.state === 0) o.el.classList.add('is-awake'); });
              }
            }
            // Rời xa lá thư → sắc ấm nguội dần thành trắng xanh của bầu trời
            if (!g.cooled && u > 0.28) {
              g.cooled = true;
              g.el.classList.remove('is-warm');
              g.el.classList.add('is-lit');
            }
            if (u < 1) {
              // Một đường cong bậc 3 liền mạch: vút lên khỏi giấy → lượn vào dải xoắn quanh hoa.
              // Điểm cuối bám theo vị trí đang quay của dải → tới nơi là hoà luôn vào vòng quay, không giật
              var k = easeInOutSine(u);
              var m = 1 - k;
              var sy = g.oy - LIFT_UP;                          // nối tiếp đúng vị trí cuối pha nhấc
              var p1x = g.ox + g.liftX, p1y = sy - g.liftY;
              var p2x = S.x + S.trail * 0.55 + g.arcX, p2y = S.y - g.arcY;
              var b0 = m * m * m, b1 = 3 * m * m * k, b2 = 3 * m * k * k, b3 = k * k * k;
              x = b0 * g.ox + b1 * p1x + b2 * p2x + b3 * S.x;
              y = b0 * sy + b1 * p1y + b2 * p2y + b3 * S.y;
              var wob = Math.sin(Math.PI * k) * 4;             // lả lướt giữa đường, bằng 0 ở hai đầu
              x += Math.sin(t * 0.004 + g.ph) * wob;
              y += Math.cos(t * 0.0035 + g.ph) * wob * 0.7;
              sc = (1 + LIFT_SC) + (orbitSc - (1 + LIFT_SC)) * k;
              op = 1 + (orbitOp - 1) * k;
              if (k > 0.8 && S.d < 0) z = 1;
            } else {
              if (g.state === 1) {
                g.state = 2;
                arrived++;
                setAbsorb((arrived / n).toFixed(3));
              }
              x = S.x; y = S.y; sc = orbitSc; op = orbitOp;
              z = S.d < 0 ? 1 : 1100;
            }
            // Đường tan dâng tới đâu, chữ ở đó rã thành hạt cùng hoa
            if (dissolveBandY !== null && y > dissolveBandY - 4) {
              popGroup(g, x, y, sc);
              continue;
            }
          }

          g.el.style.transform = 'translate3d(' + (x - g.ox).toFixed(2) + 'px,' + (y - g.oy).toFixed(2) + 'px,0) scale(' + sc.toFixed(3) + ')';
          g.el.style.opacity = op.toFixed(3);
          if (g.z !== z) { g.z = z; g.el.style.zIndex = z; }
        }
        glyphRaf = alive ? requestAnimationFrame(tick) : null;
      }
      glyphRaf = requestAnimationFrame(tick);

      // Ôm hoa một nhịp ngắn rồi bắt đầu rã hạt
      return { dissolveAt: lastArrive + 200 };
    }

    function onContinueClick() {
      if (isDissolving) return;
      isDissolving = true;
      preloadFlyingPhotos(); // đo tỉ lệ ảnh trong lúc chữ bay → ảnh bay xếp làn chính xác
      var rect = getBouquetRect();
      dissolveBandY = null;
      setAbsorb('0');
      document.body.classList.add('bouquet-absorbing');
      // 1. Ẩn nút Tiếp tục + nút đóng trước, giấy thư và nội dung vẫn giữ nguyên
      if (letterModal) letterModal.classList.add('is-releasing');
      // 2–4. Chữ rời trang theo nhóm; khi ~1/3 chữ đã rời thì giấy mới mờ dần
      var plan = launchLetterGlyphs(rect, fadeOutLetterModal);
      if (!plan) dissolveTimers.push(setTimeout(fadeOutLetterModal, 300));
      var dissolveAt = plan ? plan.dissolveAt : 1200;
      // 5. Hoa rã hạt từ gốc lên ngọn, bùm → ảnh bay lên ngay khi hạt còn đang bay
      runBouquetDissolve(function() {
        startFlyingPhotos();
        isDissolving = false;
      }, rect, dissolveAt);
    }

    if (letterBtnContinue) letterBtnContinue.addEventListener('click', onContinueClick);

    stopFlyingPhotos = function() {
      clearDissolve();
      document.body.classList.remove('content-hidden');
      if (photoFloatContainer) {
        photoFloatContainer.classList.remove('is-active');
        photoFloatContainer.innerHTML = '';
      }
      if (flyingInterval) {
        clearInterval(flyingInterval);
        flyingInterval = null;
      }
    };

    // ═══════════════════════════════════════════════════
    // 📸 PRESS-AND-HOLD TO CATCH FLYING PHOTOS
    // Ấn giữ 200ms → bắt ảnh, kéo thả tự do, thả ra → ghim tại chỗ
    // Mỗi ảnh chỉ bắt được 1 lần
    // ═══════════════════════════════════════════════════
    (function initPhotoCatch() {
      var HOLD_MS = 200; // thời gian giữ để bắt
      var holdTimer = null;
      var dragEl = null;
      var offsetX = 0, offsetY = 0;

      function getPos(e) {
        var t = e.touches ? e.touches[0] : e;
        return { x: t.clientX, y: t.clientY };
      }

      function onStart(e) {
        var target = e.target.closest('.photo-float');
        if (!target || target.classList.contains('is-caught')) return;
        e.preventDefault();
        var pos = getPos(e);
        var rect = target.getBoundingClientRect();
        offsetX = pos.x - rect.left;
        offsetY = pos.y - rect.top;

        holdTimer = setTimeout(function() {
          holdTimer = null;
          dragEl = target;
          // Dừng animation, chuyển sang vị trí cố định (fixed-like via absolute)
          var r = dragEl.getBoundingClientRect();
          dragEl.style.animation = 'none';
          dragEl.style.bottom = 'auto';
          dragEl.style.left = r.left + 'px';
          dragEl.style.top = r.top + 'px';
          dragEl.style.position = 'fixed';
          dragEl.classList.add('is-dragging');
          // Xóa animationend listener (không xóa khỏi DOM nữa)
          dragEl._caught = true;
        }, HOLD_MS);
      }

      function onMove(e) {
        if (!dragEl) return;
        e.preventDefault();
        var pos = getPos(e);
        dragEl.style.left = (pos.x - offsetX) + 'px';
        dragEl.style.top = (pos.y - offsetY) + 'px';
      }

      function onEnd() {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        if (!dragEl) return;
        dragEl.classList.remove('is-dragging');
        // Tiếp tục bay lên từ vị trí thả
        var el = dragEl;
        dragEl = null;
        var speed = 1.5; // px per frame (~90px/s at 60fps)
        function flyUp() {
          var top = parseFloat(el.style.top);
          top -= speed;
          el.style.top = top + 'px';
          // Bay ra khỏi màn hình → xóa
          if (top < -200) {
            if (el.parentNode) el.parentNode.removeChild(el);
            return;
          }
          requestAnimationFrame(flyUp);
        }
        requestAnimationFrame(flyUp);
      }

      // Delegate từ container — hoạt động cho cả ảnh tạo sau
      if (photoFloatContainer) {
        photoFloatContainer.addEventListener('mousedown', onStart, { passive: false });
        photoFloatContainer.addEventListener('touchstart', onStart, { passive: false });
      }
      document.addEventListener('mousemove', onMove, { passive: false });
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchend', onEnd);
      document.addEventListener('touchcancel', onEnd);
    })();
  
    } catch (error) {
      console.error('❌ [Tulipanes] LỖI TRONG SCRIPT:', error);
      console.error('❌ [Tulipanes] Error stack:', error.stack);
        }
  })(); // Đóng IIFE
