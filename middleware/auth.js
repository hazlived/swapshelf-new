const verifyAdminCredentials = (username, password) => {
    // Load from env or defaults
    const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').trim();

    // Normalize and trim incoming credentials
    const providedUser = (username || '').trim().toLowerCase();
    const providedPass = (password || '').trim();

    console.log('🔐 Admin login attempt:', { providedUser, providedPass: '***' });
    console.log('🔑 Expected credentials:', { ADMIN_USERNAME, ADMIN_PASSWORD: '***' });

    const isValid = providedUser === ADMIN_USERNAME && providedPass === ADMIN_PASSWORD;
    console.log('✅ Login result:', isValid ? 'SUCCESS' : 'FAILED');

    return isValid;
};

const adminAuth = (req, res, next) => {
    console.log('🛡️ Admin auth check – Session isAdmin:', req.session?.isAdmin);
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        console.log('❌ Admin access denied');
        return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }
};

module.exports = {
    adminAuth,
    verifyAdminCredentials
};
