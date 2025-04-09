const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware xác thực JWT
exports.authenticate = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Lấy thông tin user từ database
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            console.error('Authentication error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Middleware phân quyền Admin
exports.authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }
};

// Middleware phân quyền User
exports.authorizeUser = (req, res, next) => {
    if (req.user && req.user.role === 'user') {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized as user' });
    }
};

// Middleware to authorize delivery personnel
exports.authorizeDelivery = (req, res, next) => {
    if (req.user && req.user.role === 'delivery') {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized as delivery personnel' });
    }
};