const mongoose = require('mongoose');
async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/jpupper');
        const projects = await mongoose.connection.db.collection('projects')
            .find({ 
                $or: [
                    { title: { $regex: /interactivo|juego|touch|mapa|pantalla/i } },
                    { description: { $regex: /interactivo|juego|touch|mapa|pantalla/i } }
                ] 
            })
            .limit(5)
            .toArray();
        console.log(JSON.stringify(projects.map(p => ({ 
            id: p.id, 
            title: p.title, 
            url: p.url || '', 
            thumbnail: p.thumbnail || '' 
        })), null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
run();
