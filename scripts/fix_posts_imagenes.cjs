// Alinea el imageUrl de los posts ya migrados con el thumbnail vigente del
// proyecto en jpupperwebsite (después de reparar las referencias rotas).
const path = '/root/artedigitaldata';
require(path + '/node_modules/dotenv').config({ path: path + '/.env' });
const mongoose = require(path + '/node_modules/mongoose');
const jwt = require(path + '/node_modules/jsonwebtoken');
const fs = require('fs');

const API = 'http://127.0.0.1:2495/artedigitaldata/api';
const IMG = 'https://vps-4455523-x.dattaweb.com/jpupper/';
const DIR = '/root/jpupperwebsite/public/img/projects';
const DRY = process.argv.includes('--dry');

(async () => {
  await mongoose.connect(process.env.MONGODB_AUTH_URI);
  const u = await mongoose.connection.db.collection('users')
    .findOne({ username: { $regex: '^jpupper$', $options: 'i' } });
  const token = jwt.sign({ id: String(u._id), username: u.username, role: u.role || 'USER' },
    process.env.JWT_SECRET, { expiresIn: '2h' });

  const prof = await (await fetch(API + '/profile/' + u.username)).json();
  const posts = prof.posts || [];

  const projects = JSON.parse(fs.readFileSync('/root/projects_dump.json', 'utf8'));
  // el dump es previo a la reparación: leer el estado actual de la base de proyectos
  await mongoose.connection.close();
  const conn2 = await mongoose.createConnection('mongodb://127.0.0.1:27017/jpupper').asPromise();
  const actuales = await conn2.db.collection('projects').find({}).toArray();

  const byTitle = new Map();
  for (const p of actuales) byTitle.set(String(p.title).trim().toLowerCase(), p);

  let patched = 0, iguales = 0, sinProyecto = 0;
  for (const post of posts) {
    const proj = byTitle.get(String(post.title || '').trim().toLowerCase());
    if (!proj) { sinProyecto++; continue; }
    const t = String(proj.thumbnail || '');
    const file = t.split('/').pop();
    // sin archivo en disco: mejor sin imagen (el front pinta "sin imagen") que un 404
    const nueva = (!t || !fs.existsSync(DIR + '/' + file))
      ? ''
      : (t.startsWith('http') ? t : IMG + t.replace(/^\/+/, ''));
    if ((post.imageUrl || '') === nueva) { iguales++; continue; }
    if (DRY) { console.log('[dry]', post.title, '\n   ', post.imageUrl, '\n ->', nueva); continue; }
    const r = await fetch(API + '/posts/' + (post._id || post.id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ imageUrl: nueva }),
    });
    if (r.ok) { patched++; } else { console.log('ERROR', r.status, post.title, (await r.text()).slice(0, 120)); }
    await new Promise(res => setTimeout(res, 40));
  }
  console.log(JSON.stringify({ posts: posts.length, patched, iguales, sinProyecto, dry: DRY }));
  process.exit(0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
