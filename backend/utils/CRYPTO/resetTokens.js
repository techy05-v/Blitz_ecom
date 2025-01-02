const crypto = require('crypto');

const generateResetToken = () => {
    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for storage
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Create expiry time - 60 minutes from now
    const tokenExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    
    return {
        resetToken,     // Original token to send to user
        hashedToken,    // Hashed version to store in DB
        tokenExpire     // Expiration timestamp
    };
};

module.exports = { generateResetToken };