const mongoose = require('mongoose');
async function list() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/');
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const dbs = await admin.listDatabases();
        console.log('Databases:', dbs.databases.map(d => d.name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
list();
