/* CV — dos versiones (Minimalista / Completa).
   La vista activa vive en <html data-cv="...">; el CSS esconde la otra.
   Se recuerda en localStorage y respeta #minimal / #completa en la URL. */

(function () {
    'use strict';

    var root = document.documentElement;
    var botones = Array.prototype.slice.call(document.querySelectorAll('[data-cv-view]'));
    var CLAVE = 'cv_view';

    function pintarBotones(vista) {
        botones.forEach(function (b) {
            var activo = b.getAttribute('data-cv-view') === vista;
            b.setAttribute('aria-selected', activo ? 'true' : 'false');
        });
    }

    function setVista(vista, guardar) {
        if (vista !== 'minimal' && vista !== 'completa') return;
        root.setAttribute('data-cv', vista);
        pintarBotones(vista);
        if (guardar) {
            try { localStorage.setItem(CLAVE, vista); } catch (e) {}
        }
        if (window.location.hash !== '#' + vista) {
            try { history.replaceState(null, '', '#' + vista); } catch (e) {}
        }
    }

    var inicial = 'minimal';
    try {
        var guardada = localStorage.getItem(CLAVE);
        if (guardada === 'completa' || guardada === 'minimal') inicial = guardada;
    } catch (e) {}
    if (window.location.hash === '#completa' || window.location.hash === '#minimal') {
        inicial = window.location.hash.slice(1);
    }
    setVista(inicial, false);

    botones.forEach(function (b) {
        b.addEventListener('click', function () {
            setVista(b.getAttribute('data-cv-view'), true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    /* links internos que cambian de versión (ej. "ver la versión completa") */
    Array.prototype.forEach.call(document.querySelectorAll('[data-cv-link]'), function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            setVista(a.getAttribute('data-cv-link'), true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
})();
