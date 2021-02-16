const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema ({
    userID: {
        type: String,
        trim: true,
        required: true,
        max: 32,
    },
    plan: {
        type: String,
        trim: true,
        required: true,
        max: 32,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: false,
    },
    title: {
        type: String,
        trim: true,
        required: true,
        max: 32,
    },
    description: {
        type: String,
        trim: true,
        required: true,
        max: 255,
    },
    link: {
        type: String,
        trim: true,
        required: true,
        max: 255,
    },
    contact: {
        type: String,
        trim: true,
        required: true,
        max: 32,
    },
});

module.exports = mongoose.model("Contribution", contributionSchema);