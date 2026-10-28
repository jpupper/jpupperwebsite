require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

async function syncLocalToRemote(client, localFolder, remoteFolder) {
    if (!fs.existsSync(localFolder)) {
        console.warn(`[OMITIDO] No se encontro la carpeta local ${localFolder}`);
        return;
    }
    await client.ensureDir(remoteFolder);

    const remoteList = await client.list();
    const remoteMap = new Map();
    for (const item of remoteList) {
        remoteMap.set(item.name, item);
    }

    const localItems = fs.readdirSync(localFolder);

    for (const item of localItems) {
        // PROTOCOLO FULLSCREEN: jamas subir archivos de configuración Apache
        // (.htaccess, .htpasswd, etc.). El .htaccess central vive en megaskill.
        if (item.startsWith('.ht')) continue;

        const localPath = path.join(localFolder, item);
        const stat = fs.statSync(localPath);

        if (stat.isDirectory()) {
            await syncLocalToRemote(client, localPath, remoteFolder + '/' + item);
            await client.cd(remoteFolder);
        } else {
            const remoteItem = remoteMap.get(item);

            if (!remoteItem || remoteItem.size !== stat.size) {
                console.log('[SUBIENDO] ' + remoteFolder + '/' + item);
                await client.uploadFrom(localPath, item);
            }
        }
    }
}

async function uploadToFtp() {
    const client = new ftp.Client();
    client.ftp.verbose = false;

    const ftpHost = process.env.FTP_HOST;
    const ftpUser = process.env.FTP_USER;
    const ftpPassword = process.env.FTP_PASS;

    try {
        console.log('--- Iniciando conexion FTP inteligente para JPWebsite ---');
        console.log('Comparando tamanios de archivos... Solo subiendo lo modificado o nuevo.');

        // Ferozo exige FTPS: TLS explicito en el canal de control (si no, 550
        // "SSL/TLS required on the control channel") y datos protegidos.
        await client.access({
            host: ftpHost,
            user: ftpUser,
            password: ftpPassword,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        // Para jpupper, usualmente va a un subdirectorio /jpupper
        const remoteDir = '/jpupper'; 
        const localPublicFolder = path.join(__dirname, '../public');
        const localImgFolder = path.join(__dirname, '../img');

        console.log('Sincronizando /public a /jpupper...');
        await syncLocalToRemote(client, localPublicFolder, remoteDir);

        console.log('Sincronizando /img a /jpupper/img...');
        await syncLocalToRemote(client, localImgFolder, remoteDir + '/img');

        console.log('==========================================');
        console.log('Sincronizacion FTP completada con exito!');
        console.log('==========================================');

    } catch (err) {
        console.error('Ocurrio un error en la subida FTP:', err);
    } finally {
        client.close();
    }
}

uploadToFtp();
