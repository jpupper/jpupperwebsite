const mongoose = require('mongoose');
const config = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const Project = require('../models/Project');

async function migrateProjects() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Read projects.json
        const projectsData = await fs.readFile(
            path.join(__dirname, '..', 'public', 'js', 'projects.json'),
            'utf8'
        );
        const { projects } = JSON.parse(projectsData);

        // Delete existing projects
        await Project.deleteMany({});

        // Insert all projects
        await Project.insertMany(projects);

        console.log(`Successfully migrated ${projects.length} projects`);
        process.exit(0);
    } catch (error) {
        console.error('Error migrating projects:', error);
        process.exit(1);
    }
}

migrateProjects();
