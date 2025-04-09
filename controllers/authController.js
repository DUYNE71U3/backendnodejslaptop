const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Tạo token JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Đăng ký tài khoản
exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Kiểm tra username hoặc email đã tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

        // Tạo user mới
        const user = new User({ username, email, password, role: role || 'user' });
        await user.save();

        // Trả về thông báo thành công
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

// Get user info
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Tìm người dùng theo username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create delivery account (admin only)
exports.createDeliveryAccount = async (req, res) => {
    try {
        const { username, email, password, phoneNumber, vehicleType } = req.body;

        // Check if username or email already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

        // Create delivery account
        const user = new User({ 
            username, 
            email, 
            password, 
            role: 'delivery',
            phoneNumber,
            vehicleType
        });
        await user.save();

        res.status(201).json({ message: 'Delivery account created successfully' });
    } catch (error) {
        console.error('Error creating delivery account:', error);
        res.status(500).json({ message: 'Error creating delivery account', error });
    }
};

// Get all delivery accounts (admin only)
exports.getAllDeliveryAccounts = async (req, res) => {
    try {
        const deliveryAccounts = await User.find({ role: 'delivery' })
            .select('-password');
        res.json(deliveryAccounts);
    } catch (error) {
        console.error('Error fetching delivery accounts:', error);
        res.status(500).json({ message: 'Error fetching delivery accounts', error });
    }
};

// Create customer service account (admin only)
exports.createCustomerServiceAccount = async (req, res) => {
    try {
        const { username, email, password, phoneNumber } = req.body;

        // Check if username or email already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

        // Create customer service account
        const user = new User({ 
            username, 
            email, 
            password, 
            role: 'customer_service',
            phoneNumber
        });
        await user.save();

        res.status(201).json({ message: 'Customer service account created successfully' });
    } catch (error) {
        console.error('Error creating customer service account:', error);
        res.status(500).json({ message: 'Error creating customer service account', error });
    }
};

// Get all customer service accounts (admin only)
exports.getAllCustomerServiceAccounts = async (req, res) => {
    try {
        const customerServiceAccounts = await User.find({ role: 'customer_service' })
            .select('-password');
        res.json(customerServiceAccounts);
    } catch (error) {
        console.error('Error fetching customer service accounts:', error);
        res.status(500).json({ message: 'Error fetching customer service accounts', error });
    }
};