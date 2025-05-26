// Hero Gallery Auto-Rotating Texts with Dots and Animation
(function() {
  let current = 0;
  let timer = null;
  let animating = false;

  function capitalizeFirst(text) {
    if (!text) return '';
    return text.replace(/(^|[.!?]\s+|<br>|<br\/>|<br>\s+)/g, (match, p1, offset) => {
      // Find the first letter after the split and capitalize
      return match + (text[offset + match.length] ? text[offset + match.length].toUpperCase() : '');
    }).replace(/([a-z])/, (m) => m.toUpperCase());
  }

  function renderDots(gallery) {
    const dotsContainer = document.getElementById('heroGalleryDots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    gallery.forEach((_, idx) => {
      const dot = document.createElement('span');
      dot.className = 'hero-gallery-dot' + (idx === current ? ' active' : '');
      dot.onclick = () => {
        if (current !== idx) showSlide(idx, true);
      };
      dotsContainer.appendChild(dot);
    });
  }

  function animateTextOut(cb) {
    const text = document.getElementById('heroGalleryText');
    if (!text) return cb();
    text.classList.remove('fade-in');
    text.classList.add('fade-out');
    setTimeout(cb, 400);
  }

  function animateTextIn() {
    const text = document.getElementById('heroGalleryText');
    if (text) {
      text.classList.remove('fade-out');
      text.classList.add('fade-in');
    }
  }

  function showSlide(idx, manual) {
    if (animating) return;
    animating = true;
    const lang = window.selectedLang || 'es';
    const gallery = (dictionary[lang] && dictionary[lang].hero_gallery) || [];
    if (!gallery.length) { animating = false; return; }
    idx = ((idx % gallery.length) + gallery.length) % gallery.length;
    animateTextOut(() => {
      current = idx;
      // Capitalize first letter of title and text
      document.getElementById('heroGalleryTitle').innerHTML = gallery[current].title;
      document.getElementById('heroGalleryText').innerHTML = gallery[current].text;
      animateTextIn();
      renderDots(gallery);
      animating = false;
    });
    if (manual) startAuto();
  }

  function nextSlide() {
    showSlide(current + 1);
  }

  function startAuto() {
    if (timer) clearInterval(timer);
    timer = setInterval(nextSlide, 6000);
  }

  window.updateHeroGallery = function() {
    const lang = window.selectedLang || 'es';
    const gallery = (dictionary[lang] && dictionary[lang].hero_gallery) || [];
    current = 0;
    document.getElementById('heroGalleryTitle').innerHTML = gallery.length ? gallery[0].title : '';
    document.getElementById('heroGalleryText').innerHTML = gallery.length ? gallery[0].text : '';
    animateTextIn();
    renderDots(gallery);
    startAuto();
  };

  document.addEventListener('DOMContentLoaded', function() {
    window.updateHeroGallery();
    // Evento para detectar click en el iframe
    const iframe = document.querySelector('.hero-iframe-circle iframe');
    if (iframe) {
      iframe.addEventListener('click', function() {
        console.log('iframe clickeado');
      });
    }
  });
})();
