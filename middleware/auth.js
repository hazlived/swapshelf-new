
const verifyAdminCredentials = (username, password) => {
    // You can change these credentials or load from environment variables
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
};

const adminAuth = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }
};

module.exports = {
    adminAuth,
    verifyAdminCredentials
};
