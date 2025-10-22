const mongoose = require('mongoose');
const config = require('../config/database');
const Tag = require('../models/Tag');

async function initTags() {
    try {
        await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existen tags
        const existingTags = await Tag.find();
        console.log(`📊 Tags existentes: ${existingTags.length}`);

        if (existingTags.length === 0) {
            console.log('📝 Creando tags iniciales...');
            
            const initialTags = [
                { name: 'mobile', displayName: 'Mobile' },
                { name: 'nft', displayName: 'NFT' },
                { name: 'interactive', displayName: 'Interactive' },
                { name: '3d', displayName: '3D' },
                { name: '2d', displayName: '2D' },
                { name: 'static', displayName: 'Static' },
                { name: 'unreal', displayName: 'Unreal' },
                { name: 'opensource', displayName: 'Open Source' },
                { name: 'learning', displayName: 'Learning' },
                { name: 'unity', displayName: 'Unity' },
                { name: 'touchdesigner', displayName: 'TouchDesigner' },
                { name: 'python', displayName: 'Python' },
                { name: 'c++', displayName: 'C++' },
                { name: 'openframeworks', displayName: 'OpenFrameworks' },
                { name: 'processing', displayName: 'Processing' },
                { name: 'videogame', displayName: 'Video Game' },
                { name: 'multiplayer', displayName: 'Multiplayer' },
                { name: 'donemobile', displayName: 'Hecho en Mobile' },
                { name: 'vr', displayName: 'VR' },
                { name: 'ar', displayName: 'AR' },
                { name: 'kinect', displayName: 'Kinect' },
                { name: 'lidar', displayName: 'LIDAR' },
                { name: 'web', displayName: 'Web' }
            ];

            await Tag.insertMany(initialTags);
            console.log(`✅ ${initialTags.length} tags creados exitosamente`);
        } else {
            console.log('ℹ️  Ya existen tags en la base de datos');
            console.log('Si quieres agregar tags faltantes, usa el admin panel o elimina todos los tags primero');
        }

        await mongoose.connection.close();
        console.log('✅ Proceso completado');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

initTags();
