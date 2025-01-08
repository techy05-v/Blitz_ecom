const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    user_name: String,
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: function () {
            return this.google_id ? false : true;
        }
    },
    user_id: {
        type: String,
        default: "blitz" + Date.now() + Math.floor(Math.random() * 100000 + Date.now() + 900000)
    },
    google_id: String,
    avatar: String,
    profileImage: String,
    phone_number: String,
    gender: String,
    dob: Date,
    isBlocked: {
        type: Boolean,
        default: false
    },
    resetToken: String,
    resetTokenExpiry: Date,
    adress: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "AddressSchema"
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: "users"
});

module.exports = mongoose.model("User", UserSchema);