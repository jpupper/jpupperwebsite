const mongoose = require('mongoose');

const referenceSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, default: '' },
    thumbnail: { type: String, default: '' }
}, { _id: false });

const budgetItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    }
});

const budgetSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    projectName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    client: {
        type: String,
        required: true
    },
    paymentTerms: {
        type: String,
        required: true
    },
    technicalRequirements: {
        type: String,
        required: true
    },
    references: [referenceSchema],
    items: [budgetItemSchema],
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique alphanumeric code
budgetSchema.statics.generateCode = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

module.exports = mongoose.model('Budget', budgetSchema);
