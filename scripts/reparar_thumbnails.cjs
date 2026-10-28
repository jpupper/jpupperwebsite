// Repara las referencias a thumbnails que ya no existen en disco: para cada
// proyecto cuya imagen falta, busca OTRO archivo del MISMO proyecto (mismo slug,
// p. ej. la generación anterior del auto-thumb o el render original .png) y
// reescribe `thumbnail`. No inventa imágenes: si no hay ningún archivo, no toca.
const path = '/root/jpupperwebsite';
require(path + '/node_modules/dotenv').config({ path: path + '/.env' });
const mongoose = require(path + '/node_modules/mongoose');
const fs = require('fs');

const DIR = path + '/public/img/projects';
const DRY = process.argv.includes('--dry');

const slug = (t) => String(t).split('/').pop()
  .replace(/^auto-thumb-/, '')
  .replace(/-\d{10,}\.[a-z0-9]+$/i, '')
  .replace(/\.[a-z0-9]+$/i, '')
  .toLowerCase();

const stamp = (f) => {
  const m = f.match(/-(\d{10,})\.[a-z0-9]+$/i);
  return m ? Number(m[1]) : 0;
};

(async () => {
  const files = fs.readdirSync(DIR);
  const bySlug = {};
  for (const f of files) {
    (bySlug[slug(f)] = bySlug[slug(f)] || []).push(f);
  }
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jpupper');
  const col = mongoose.connection.db.collection('projects');
  const projects = await col.find({}).toArray();

  let fixed = 0, sinNada = 0, yaOk = 0;
  const log = [];
  for (const p of projects) {
    const cur = String(p.thumbnail || '').split('/').pop();
    if (cur && files.includes(cur)) { yaOk++; continue; }
    const cands = (bySlug[slug(p.thumbnail)] || []).filter(f => f !== cur);
    if (!cands.length) { sinNada++; continue; }
    cands.sort((a, b) => {
      const aAuto = /^auto-thumb-/.test(a) ? 1 : 0;
      const bAuto = /^auto-thumb-/.test(b) ? 1 : 0;
      if (aAuto !== bAuto) return aAuto - bAuto;  // primero el render original
      return stamp(b) - stamp(a);                 // despues el auto-thumb mas nuevo
    });
    const nueva = 'img/projects/' + cands[0];
    log.push({ id: p.id, vieja: p.thumbnail, nueva });
    if (!DRY) await col.updateOne({ _id: p._id }, { $set: { thumbnail: nueva, updatedAt: new Date() } });
    fixed++;
  }
  console.log(JSON.stringify({ total: projects.length, yaOk: yaOk, reparados: fixed, sinNingunaImagen: sinNada, dry: DRY }));
  log.slice(0, 30).forEach(l => console.log('  ', l.id, ':', l.vieja, '->', l.nueva));
  process.exit(0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
