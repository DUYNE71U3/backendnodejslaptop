const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware xác thực JWT
exports.authenticate = async (req, res, next) => {
    try {
        console.log('Authentication middleware - headers:', req.headers);
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication failed: No token provided' });
        }
        
        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Authentication failed: Invalid token' });
    }
};

// Middleware phân quyền Admin
exports.authorizeAdmin = (req, res, next) => {
    console.log('Authorize admin middleware - user role:', req.user?.role);
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: admin only' });
    }
    next();
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

// Middleware to authorize customer service personnel
exports.authorizeCustomerService = (req, res, next) => {
    if (req.user && req.user.role === 'customer_service') {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized as customer service personnel' });
    }
};