#!/usr/bin/env python3
"""Sube public/ de jpupperwebsite a /jpupper/ por FTPS, probando las cuentas
disponibles en los .env del VPS y quedandose con la que ve las carpetas de las apps.
Sube solo lo que cambia (tamano distinto o inexistente). Nunca toca .ht*.
Uso: python3 subir_jpupper_ftp.py [--dry]
"""
import ftplib, os, sys, ssl

DRY = '--dry' in sys.argv
LOCAL = '/root/jpupperwebsite/public'
REMOTE = '/jpupper'
# Los thumbnails de proyectos los sirve el BACKEND del VPS (URLs absolutas),
# no hacen falta en el FTP y son ~86 MB: se excluyen del deploy.
EXCLUIR = {'img/projects'}

ENVS = ['/root/fscauth/.env', '/root/jpupperwebsite/.env']


def leer_env(path):
    d = {}
    if not os.path.exists(path):
        return d
    for line in open(path, encoding='utf-8', errors='ignore'):
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        d[k.strip()] = v.strip().strip('"').strip("'")
    return d


def conectar(host, user, pwd):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    ftp = ftplib.FTP_TLS(context=ctx)
    ftp.connect(host, 21, timeout=40)
    ftp.login(user, pwd)
    ftp.prot_p()
    return ftp


candidatos = []
seen = set()
for e in ENVS:
    d = leer_env(e)
    if d.get('FTP_HOST') and d.get('FTP_USER'):
        key = (d['FTP_HOST'], d['FTP_USER'])
        if key not in seen:
            seen.add(key)
            candidatos.append((e, d['FTP_HOST'], d['FTP_USER'], d['FTP_PASS']))

elegido = None
for origen, host, user, pwd in candidatos:
    try:
        ftp = conectar(host, user, pwd)
        raiz = ftp.nlst()
        apps = [x for x in ('jpupper', 'jpstagedesign', 'jpshadereditor', 'carloskernel') if x in raiz]
        print(f'{origen}: {user} OK -> raiz ve {len(raiz)} items, apps: {apps}')
        if not apps or 'jpupper' not in raiz:
            print('   (no es la cuenta del webroot, sigo)')
            ftp.quit()
            continue
        elegido = (ftp, user)
        break
    except Exception as ex:
        print(f'{origen}: {user} FALLA -> {type(ex).__name__}: {str(ex)[:90]}')

if not elegido:
    print('NINGUNA CUENTA SIRVE')
    sys.exit(1)

ftp, user = elegido
print(f'--- subiendo con {user} a {REMOTE} (dry={DRY})')

def listar(ftp):
    """{nombre: tamano} del directorio actual, parseando LIST."""
    out = {}

    def cb(linea):
        partes = linea.split(None, 8)
        if len(partes) == 9 and not linea.startswith('d'):
            try:
                out[partes[8]] = int(partes[4])
            except ValueError:
                pass

    try:
        ftp.retrlines('LIST', cb)
    except Exception as ex:
        print('   (LIST fallo:', str(ex)[:60], ')')
    return out


subidos = saltados = errores = 0


def sync(local_dir, remote_dir):
    global subidos, saltados, errores
    try:
        ftp.cwd(remote_dir)
    except ftplib.error_perm:
        if DRY:
            print('  [dry] mkdir', remote_dir)
            return
        ftp.mkd(remote_dir)
        ftp.cwd(remote_dir)
    existentes = listar(ftp)
    usar_size = False
    for item in sorted(os.listdir(local_dir)):
        if item.startswith('.ht'):
            continue
        lp = os.path.join(local_dir, item)
        rp = f'{remote_dir}/{item}'
        rel = os.path.relpath(lp, LOCAL).replace(os.sep, '/')
        if any(rel == x or rel.startswith(x + '/') for x in EXCLUIR):
            print('  (salteado)', rp)
            continue
        if os.path.isdir(lp):
            sync(lp, rp)
            ftp.cwd(remote_dir)
            continue
        tam = os.path.getsize(lp)
        remoto = existentes.get(item)
        if usar_size:
            try:
                remoto = ftp.size(item)
            except Exception:
                remoto = None
        if remoto == tam:
            saltados += 1
            continue
        if DRY:
            print('  [dry] UP', rp, tam)
            subidos += 1
            continue
        with open(lp, 'rb') as fh:
            ftp.storbinary(f'STOR {item}', fh)
        subidos += 1
        print('  UP', rp, tam)


try:
    sync(LOCAL, REMOTE)
    print(f'--- listo: subidos={subidos} sin_cambios={saltados} errores={errores}')
finally:
    try:
        ftp.quit()
    except Exception:
        pass
