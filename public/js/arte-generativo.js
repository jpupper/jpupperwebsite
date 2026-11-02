/* Arte generativo — índice de las obras de JPupper y KetiTaki en Tezos.
   Datos: data/arte-generativo.json (bajado de objkt, ver scripts/generar_arte_generativo.py).
   - Tabs por categoría: KetiTaki / JPupper HEN / JPupper fxhash
   - Al pasar el mouse: el sistema generativo corriendo (iframe al CDN de objkt)
   - Click: modal con el generador, semilla original / nueva y link a objkt
   El CDN de objkt bloquea por Referer: todas las img/iframe van con no-referrer. */

(function () {
    'use strict';

    var B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    var $ = function (s) { return document.querySelector(s); };

    var anio = document.getElementById('jp-year');
    if (anio) anio.textContent = String(new Date().getFullYear());

    var root = document.getElementById('ag-grid');
    if (!root) return;

    var el = {
        tabs: document.getElementById('ag-tabs'),
        count: document.getElementById('ag-count'),
        modal: document.getElementById('ag-modal'),
        mTitle: document.getElementById('ag-m-title'),
        mMeta: document.getElementById('ag-m-meta'),
        mFrame: document.getElementById('ag-m-frame'),
        mSeed: document.getElementById('ag-m-seed'),
        mNew: document.getElementById('ag-m-new'),
        mOrig: document.getElementById('ag-m-orig'),
        mObjkt: document.getElementById('ag-m-objkt'),
        mClose: document.getElementById('ag-m-close'),
    };

    var estado = { cats: [], activa: null, obra: null };

    function semillaNueva() {
        var s = 'oo';
        for (var i = 0; i < 49; i++) s += B58[Math.floor(Math.random() * B58.length)];
        return s;
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function esGenerativo(o) { return !!o.g && o.pl !== 'HEN'; }
    function objktURL(o) {
        return o.c && o.tok
            ? 'https://objkt.com/tokens/' + o.c + '/' + o.tok
            : 'https://objkt.com/users/tz1cZpxNs8WtpJxfMu7CK39KopAaMdEUYHwR/created';
    }

    /* ---------- pintado ---------- */

    function pintarTabs() {
        el.tabs.innerHTML = estado.cats.map(function (c) {
            return '<button class="ag-tab" role="tab" data-cat="' + esc(c.id) + '" aria-selected="' +
                (estado.activa === c.id) + '">' + esc(c.nombre) +
                '<small>' + c.proyectos.length + '</small></button>';
        }).join('');
    }

    function tarjeta(o, i) {
        var gen = esGenerativo(o);
        return '<button class="ag-card" type="button" data-i="' + i + '"' +
            (gen ? ' data-gen="' + esc(o.g) + '" data-seed="' + esc((o.s && o.s[0]) || '') + '"' : '') + '>' +
            '<span class="ag-card__img">' +
                '<span class="ag-card__badges">' +
                    (gen ? '<em class="ag-b ag-b--live">▶ live</em>' : '') +
                    '<em class="ag-b">' + esc(o.pl) + '</em>' +
                '</span>' +
                (o.t ? '<img src="' + esc(o.t) + '" alt="' + esc(o.n) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '') +
            '</span>' +
            '<span class="ag-card__body">' +
                '<strong>' + esc(o.n) + '</strong>' +
                '<small>' + (o.e || 1) + (o.e === 1 ? ' obra' : ' obras') + (o.f ? ' · ' + esc(o.f) : '') + '</small>' +
            '</span>' +
        '</button>';
    }

    function pintarGrilla() {
        var cat = estado.cats.filter(function (c) { return c.id === estado.activa; })[0];
        if (!cat) return;
        root.innerHTML = cat.proyectos.map(tarjeta).join('');
        var obras = cat.proyectos.reduce(function (n, o) { return n + (o.e || 1); }, 0);
        el.count.textContent = cat.nombre + ' · ' + cat.proyectos.length + ' proyectos · ' +
            obras.toLocaleString('es-AR') + ' obras';
        revelarImagenes();
    }

    /* fundido de las portadas (el CDN tarda y son ~60 imágenes por categoría) */
    function revelarImagenes() {
        var imgs = root.querySelectorAll('.ag-card__img img');
        Array.prototype.forEach.call(imgs, function (img) {
            if (img.complete && img.naturalWidth) {
                img.classList.add('cargada');
            } else {
                img.addEventListener('load', function () { img.classList.add('cargada'); }, { once: true });
                img.addEventListener('error', function () { img.classList.add('cargada'); }, { once: true });
            }
        });
    }

    /* ---------- preview en vivo ---------- */

    var puedeHover = function () {
        return window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    };
    var tVivo = null, vivo = null;

    function quitarVivo() {
        clearTimeout(tVivo);
        if (vivo) { vivo.remove(); vivo = null; }
    }

    root.addEventListener('mouseover', function (e) {
        if (!puedeHover()) return;
        var c = e.target.closest('.ag-card');
        if (!c || !c.dataset.gen || vivo === c) return;
        clearTimeout(tVivo);
        tVivo = setTimeout(function () {
            quitarVivo();
            var cont = c.querySelector('.ag-card__img');
            if (!cont) return;
            var f = document.createElement('iframe');
            f.src = c.dataset.gen + '?fxhash=' + encodeURIComponent(c.dataset.seed || semillaNueva());
            f.loading = 'lazy';
            f.referrerPolicy = 'no-referrer';
            f.title = 'vista previa';
            cont.appendChild(f);
            vivo = f;
        }, 250);
    });
    root.addEventListener('mouseout', function (e) {
        var c = e.target.closest('.ag-card');
        if (c && vivo && c.contains(vivo)) quitarVivo();
    });
    root.addEventListener('scroll', quitarVivo, { passive: true });

    /* ---------- modal ---------- */

    function mostrarGenerador(o, semilla) {
        el.mSeed.textContent = semilla;
        el.mFrame.innerHTML = '<iframe src="' + esc(o.g) + '?fxhash=' + esc(semilla) +
            '" title="' + esc(o.n) + '" allow="fullscreen" referrerpolicy="no-referrer"></iframe>';
    }

    function abrir(o) {
        estado.obra = o;
        el.mTitle.textContent = o.n;
        el.mMeta.textContent = o.a + ' · ' + o.pl + ' · ' + (o.e || 1) +
            ((o.e || 1) === 1 ? ' obra' : ' obras') + (o.f ? ' · ' + o.f : '');
        el.mObjkt.href = objktURL(o);
        el.modal.hidden = false;
        document.body.classList.add('ag-lock');

        if (esGenerativo(o)) {
            mostrarGenerador(o, (o.s && o.s[0]) || semillaNueva());
            el.mNew.hidden = false;
            el.mOrig.hidden = !(o.s && o.s.length);
        } else {
            el.mNew.hidden = true;
            el.mOrig.hidden = true;
            el.mSeed.textContent = 'HEN · pieza original';
            el.mFrame.innerHTML = o.art
                ? '<iframe src="' + esc(o.art) + '" title="' + esc(o.n) + '" allow="fullscreen" referrerpolicy="no-referrer"></iframe>'
                : (o.t ? '<img src="' + esc(o.t) + '" alt="' + esc(o.n) + '" referrerpolicy="no-referrer">' : '');
        }
    }

    function cerrar() {
        el.modal.hidden = true;
        el.mFrame.innerHTML = '';
        document.body.classList.remove('ag-lock');
        estado.obra = null;
    }

    /* ---------- eventos ---------- */

    el.tabs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cat]');
        if (!b) return;
        estado.activa = b.dataset.cat;
        pintarTabs();
        pintarGrilla();
    });

    root.addEventListener('click', function (e) {
        var c = e.target.closest('.ag-card');
        if (!c) return;
        var cat = estado.cats.filter(function (x) { return x.id === estado.activa; })[0];
        var o = cat && cat.proyectos[Number(c.dataset.i)];
        if (o) abrir(o);
    });

    el.mClose.addEventListener('click', cerrar);
    el.modal.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-cerrar')) cerrar();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !el.modal.hidden) cerrar();
    });
    el.mNew.addEventListener('click', function () {
        if (estado.obra) mostrarGenerador(estado.obra, semillaNueva());
    });
    el.mOrig.addEventListener('click', function () {
        var o = estado.obra;
        if (!o || !o.s || !o.s.length) return;
        mostrarGenerador(o, o.s[Math.floor(Math.random() * o.s.length)]);
    });

    /* ---------- arranque ---------- */

    fetch('data/arte-generativo.json', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
            estado.cats = d.categorias || [];
            estado.activa = (estado.cats[0] || {}).id;
            pintarTabs();
            pintarGrilla();
        })
        .catch(function (err) {
            console.warn('Arte generativo: no se pudieron cargar los datos', err);
            el.count.textContent = 'No se pudieron cargar las obras';
        });
})();
