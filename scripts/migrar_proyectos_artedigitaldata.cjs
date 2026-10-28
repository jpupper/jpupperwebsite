// Migra los proyectos de jpupperwebsite (Mongo `jpupper`) al perfil de jpupper en artedigitaldata
// como Posts NO LISTADOS (visibility: 'unlisted').
// Idempotente: saltea los títulos que ya existen en el perfil.
const path = '/root/artedigitaldata';
require(path + '/node_modules/dotenv').config({ path: path + '/.env' });
const mongoose = require(path + '/node_modules/mongoose');
const jwt = require(path + '/node_modules/jsonwebtoken');
const fs = require('fs');

const API = 'http://127.0.0.1:2495/artedigitaldata/api';
const IMG_BASE = 'https://vps-4455523-x.dattaweb.com/jpupper/';
const DRY = process.argv.includes('--dry');

const abs = (t) => (!t ? '' : (t.startsWith('http') ? t : IMG_BASE + String(t).replace(/^\/+/, '')));

function normalizeTags(tags) {
  const out = [];
  const seen = new Set();
  for (const t of tags || []) {
    const v = String(t).trim().toLowerCase();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function youtubeField(videolink) {
  const v = (videolink || '').trim();
  if (!v) return '';
  const shorts = v.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (shorts) return 'https://www.youtube.com/watch?v=' + shorts[1];
  if (/^https?:\/\//i.test(v)) return v;          // youtube, instagram, etc.
  // rutas locales del sitio (img/xxx.mp4) -> URL absoluta del VPS
  if (/\.(mp4|webm|mov)$/i.test(v)) return IMG_BASE + v.replace(/^\/+/, '');
  return '';
}

(async () => {
  await mongoose.connect(process.env.MONGODB_AUTH_URI);
  const u = await mongoose.connection.db.collection('users')
    .findOne({ username: { $regex: '^jpupper$', $options: 'i' } });
  if (!u) throw new Error('usuario jpupper no encontrado en la auth central');
  const token = jwt.sign(
    { id: String(u._id), username: u.username, role: u.role || 'USER' },
    process.env.JWT_SECRET, { expiresIn: '2h' }
  );
  console.log('usuario:', u.username, 'id:', String(u._id), 'role:', u.role);

  // Títulos ya existentes en el perfil (incluye no listados)
  const profRes = await fetch(API + '/profile/' + u.username);
  const prof = await profRes.json();
  const existing = new Set((prof.posts || []).map(p => String(p.title || '').trim().toLowerCase()));
  console.log('posts existentes en el perfil:', existing.size);

  const projects = JSON.parse(fs.readFileSync('/root/projects_dump.json', 'utf8'))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));

  let creados = 0, salteados = 0, errores = 0;
  for (const p of projects) {
    const title = String(p.title || '').trim();
    if (!title) continue;
    if (existing.has(title.toLowerCase())) { salteados++; continue; }

    const url = String(p.url || '').trim();
    const partes = [String(p.description || '').trim()];
    if (/^https?:\/\//i.test(url) && !/jeyder\.com\.ar/i.test(url)) partes.push('Proyecto: ' + url);
    const body = {
      title,
      description: partes.filter(Boolean).join('\n\n'),
      imageUrl: abs(p.thumbnail),
      youtube_video: youtubeField(p.videolink),
      tags: normalizeTags(p.tags),
      visibility: 'unlisted',
    };
    if (DRY) { console.log('[dry]', title, '|', body.imageUrl, '|', body.tags.join(',')); continue; }

    const r = await fetch(API + '/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(body),
    });
    if (r.status === 201) { creados++; existing.add(title.toLowerCase()); }
    else { errores++; console.log('ERROR', r.status, title, (await r.text()).slice(0, 160)); }
    await new Promise(res => setTimeout(res, 60));
  }
  console.log(JSON.stringify({ total: projects.length, creados, salteados, errores }));
  process.exit(0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
