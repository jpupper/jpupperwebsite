// Galería de videos para la sección "latest-work" con dots interactivos, autoplay y barra de progreso

const LASTWORK_VIDEO_TIME = 10; // segundos entre cada video

const galeriaVideo = [
  {
    video: "https://www.youtube.com/embed/0hT4KhP5g5U",
    titulo: {
      es: "Batalla de prompts",
      en: "Prompt battle"
    },
    descripcion: {
      es: "Batalla de prompts en la que las personas competian en ARTLAB",
      en: "Immersive projection at a corporate event, integrating visuals and technology for a unique experience."
    }
  },
  {
    video: "https://www.youtube.com/embed/MLUZuARyI9Q",
    titulo: {
      es: "Show Interactivo con Sensores",
      en: "Interactive Show with Sensors"
    },
    descripcion: {
      es: "Presentación en vivo utilizando sensores de movimiento para controlar efectos visuales en tiempo real.",
      en: "Live performance using motion sensors to control real-time visual effects."
    }
  },
  {
    video: "https://www.youtube.com/embed/ydqIoe-syUo",
    titulo: {
      es: "Videojuego 3D en unreal engine",
      en: "Visual Experience for Brand"
    },
    descripcion: {
      es: "Sarpado desarrollo de videojuego 3D para una marca",
      en: "Custom visual content for the launch of a new brand campaign."
    }
  },
  {
    video: "https://www.youtube.com/embed/e_VuEBskyB8",
    titulo: {
      es: "Stream Diffusion en tiempo real",
      en: "Digital Artistic Installation"
    },
    descripcion: {
      es: "Instalacion interactiva que te va transformando con IA",
      en: "Interactive installation combining digital art and technology for a sensory experience."
    }
  }
];

let lastworkCurrent = 0;
let lastworkTimer = null;
let lastworkProgressTimer = null;
let lastworkProgress = 0;
let lastworkPaused = false;

function renderLastWork(lang = 'es') {
  const container = document.getElementById('lastwork-gallery');
  if (!container) return;
  const v = galeriaVideo[lastworkCurrent];
  let dots = '<div class="lastwork-dots" id="lastworkDots">';
  for (let i = 0; i < galeriaVideo.length; i++) {
    dots += `<span class="lastwork-dot${i === lastworkCurrent ? ' active' : ''}" data-idx="${i}"></span>`;
  }
  dots += '</div>';
  container.innerHTML = `
    <div class="lastwork-single-row">
      <div class="lastwork-video">
        <iframe class="lastwork-iframe" src="${v.video}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0" allow="autoplay; encrypted-media" allowfullscreen frameborder="0"></iframe>
      </div>
      <div class="lastwork-info">
        <h3>${v.titulo[lang] || v.titulo['es']}</h3>
        <p>${v.descripcion[lang] || v.descripcion['es']}</p>
        ${dots}
        <div class="lastwork-progress-bar"><div class="lastwork-progress" id="lastworkProgress"></div></div>
      </div>
    </div>
  `;
  // Dots event
  document.querySelectorAll('.lastwork-dot').forEach(dot => {
    dot.onclick = function() {
      lastworkCurrent = parseInt(this.getAttribute('data-idx'));
      lastworkPaused = false;
      lastworkStartCycle();
    };
  });
}

function updateLastworkProgressBar() {
  const bar = document.getElementById('lastworkProgress');
  if (bar) {
    bar.style.width = (lastworkProgress * 100) + '%';
  }
}

function lastworkStartCycle() {
  if (lastworkTimer) clearTimeout(lastworkTimer);
  if (lastworkProgressTimer) clearInterval(lastworkProgressTimer);
  lastworkProgress = 0;
  renderLastWork(window.selectedLang || 'es');
  updateLastworkProgressBar();
  let elapsed = 0;
  lastworkProgressTimer = setInterval(() => {
    elapsed += 0.1;
    lastworkProgress = Math.min(elapsed / LASTWORK_VIDEO_TIME, 1);
    updateLastworkProgressBar();
    if (lastworkProgress >= 1) {
      clearInterval(lastworkProgressTimer);
    }
  }, 100);
  lastworkTimer = setTimeout(() => {
    lastworkCurrent = (lastworkCurrent + 1) % galeriaVideo.length;
    lastworkStartCycle();
  }, LASTWORK_VIDEO_TIME * 1000);
}

document.addEventListener('DOMContentLoaded', function() {
  lastworkStartCycle();
});

if (window.setLanguage) {
  const oldSetLang = window.setLanguage;
  window.setLanguage = function(lang) {
    oldSetLang(lang);
    renderLastWork(lang);
  };
}
