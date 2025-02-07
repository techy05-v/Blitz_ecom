// userModel.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    user_name: String,
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.google_id;
        }
    },
    user_id: {
        type: String,
        unique: true,
        required: true
    },
    google_id: {
        type: String,
        sparse: true
    },
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
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wishlist'
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

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ google_id: 1 }, { sparse: true });

// Export the model
module.exports = mongoose.model("User", UserSchema);