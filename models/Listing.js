const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['BOOK', 'NOTES'],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    author_subject: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    condition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor'],
        required: true
    },
    location: {
        type: String,
        maxlength: 100
    },
    owner_email: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    images: [{
        type: String
    }],
    tags: [{
        type: String,
        maxlength: 50
    }],
    status: {
        type: String,
        enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ON_HOLD', 'COMPLETED', 'WITHDRAWN', 'EXPIRED'],
        default: 'PENDING_REVIEW'
    },
    featured: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Index for searching
listingSchema.index({ title: 'text', description: 'text', tags: 'text' });
listingSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model('Listing', listingSchema);
