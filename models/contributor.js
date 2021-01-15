const mongoose = require("mongoose");

const contributorSchema = new mongoose.Schema ({
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

module.exports = mongoose.model("Contributor", contributorSchema);