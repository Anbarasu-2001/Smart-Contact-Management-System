const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure env vars are loaded

module.exports = function (req, res, next) {
    const authHeader = req.header('authorization') || '';
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : null;
    const legacyToken = req.header('x-auth-token');
    const token = bearerToken || legacyToken;

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure user exists in payload
        if (!decoded.user) {
            return res.status(401).json({ msg: 'Token is valid but user data is missing' });
        }

        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
