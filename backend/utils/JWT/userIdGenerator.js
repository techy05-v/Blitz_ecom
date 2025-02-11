const generateUserId = () => {
    const randomPart = Math.random().toString(36).substring(2, 6);
    const timestampPart = Date.now().toString().slice(-4);
    return `user${randomPart}${timestampPart}`;
};

module.exports = {generateUserId}