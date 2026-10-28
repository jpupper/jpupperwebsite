/* Portada de /jpupper/ — pinta la tira de la galería y los detalles de la página.
   Los proyectos salen del mismo API que la galería (/api/projects). */

(function () {
    'use strict';

    var cfg = window.appConfig || {};
    var apiUrl = cfg.apiUrl || '';

    var yearEl = document.getElementById('jp-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    var indexEl = document.getElementById('galeria-index');
    var countEl = document.getElementById('galeria-count');

    function renderIndex(projects) {
        var list = projects.slice().sort(function (a, b) {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }).slice(0, 8);

        indexEl.innerHTML = '';
        list.forEach(function (p, i) {
            var li = document.createElement('li');

            var a = document.createElement('a');
            a.className = 'galeria__row';
            a.href = 'gallery.html?open=' + encodeURIComponent(p.id || '');

            var num = document.createElement('span');
            num.className = 'galeria__row-n';
            num.textContent = ('0' + (i + 1)).slice(-2);

            var title = document.createElement('span');
            title.className = 'galeria__row-t';
            title.textContent = p.title;

            var tags = document.createElement('span');
            tags.className = 'galeria__row-tags';
            tags.textContent = (p.tags || []).slice(0, 3).join(' · ');

            a.appendChild(num);
            a.appendChild(title);
            a.appendChild(tags);
            li.appendChild(a);
            indexEl.appendChild(li);
        });

        if (countEl) {
            countEl.textContent = projects.length +
                (projects.length === 1 ? ' proyecto indexado' : ' proyectos indexados');
        }
    }

    if (indexEl) {
        fetch(apiUrl + '/api/projects')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var projects = Array.isArray(data) ? data : (data.projects || []);
                if (!projects.length) throw new Error('sin proyectos');
                renderIndex(projects);
            })
            .catch(function (err) {
                console.warn('No se pudieron cargar los proyectos:', err);
                if (countEl) countEl.textContent = 'Abrí la galería para ver los proyectos';
            });
    }
})();
