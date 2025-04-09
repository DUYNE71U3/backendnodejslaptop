const Order = require('../models/order');
const User = require('../models/user');
const Cart = require('../models/cart');

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);
        const cart = await Cart.find({ userId }).populate('productId');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (cart.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const products = cart.map(item => ({
            product: item.productId._id,
            quantity: item.quantity
        }));
        const totalPrice = cart.reduce((total, item) => total + item.productId.price * item.quantity, 0);

        // Check if user has enough balance when using wallet
        if (paymentMethod === 'VNPAY' && user.walletBalance < totalPrice) {
            return res.status(400).json({ 
                message: 'Insufficient wallet balance', 
                currentBalance: user.walletBalance,
                required: totalPrice 
            });
        }

        const order = new Order({
            user: userId,
            products,
            shippingAddress,
            paymentMethod,
            totalPrice
        });

        await order.save();

        // If payment method is wallet, deduct from balance
        if (paymentMethod === 'VNPAY') {
            user.walletBalance -= totalPrice;
            await user.save();
        }

        // Xóa giỏ hàng sau khi tạo đơn hàng thành công
        await Cart.deleteMany({ userId });

        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating order', error });
    }
};

// Lấy tất cả đơn hàng (chỉ admin)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'username email')
            .populate('products.product', 'name price');
        console.log('Orders fetched:', orders); // Debugging
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

// Cập nhật trạng thái đơn hàng (admin and customer service)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status
        order.status = status;
        
        // If status is changed to "Ready for Delivery", reset any delivery person assignment
        if (status === 'Ready for Delivery' && order.deliveryPerson) {
            order.deliveryPerson = null;
            order.deliveryStatus = 'Not Assigned';
        }

        await order.save();

        // Phát sự kiện qua Socket.IO
        const io = req.app.get('socketio'); // Lấy Socket.IO instance
        io.emit('order_updated', { orderId, status }); // Phát sự kiện

        res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status', error });
    }
};

// Lấy danh sách đơn hàng của người dùng
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ user: userId }).populate('products.product', 'name price');
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user orders', error });
    }
};

// Assign order to delivery person (admin only)
exports.assignDelivery = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryPersonId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if delivery person exists
        const deliveryPerson = await User.findById(deliveryPersonId);
        if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
            return res.status(404).json({ message: 'Delivery person not found' });
        }

        // Update order with delivery person
        order.deliveryPerson = deliveryPersonId;
        order.deliveryStatus = 'Assigned';
        order.status = 'Assigned to Delivery';
        
        // If called by customer service, track who made the change
        if (req.user.role === 'customer_service') {
            order.customerContactHistory.push({
                note: `Order assigned to delivery person ${deliveryPerson.username} by customer service`,
                agent: req.user.id
            });
        }
        
        await order.save();

        res.json({ 
            message: 'Order assigned to delivery person', 
            order,
            assignedBy: req.user.role
        });
    } catch (error) {
        console.error('Error assigning delivery:', error);
        res.status(500).json({ message: 'Error assigning delivery', error });
    }
};

// Get orders assigned to delivery person
exports.getDeliveryOrders = async (req, res) => {
    try {
        const deliveryPersonId = req.user.id;
        
        const orders = await Order.find({ 
            deliveryPerson: deliveryPersonId,
            deliveryStatus: { $nin: ['Delivered', 'Failed'] } 
        })
        .populate('user', 'username email')
        .populate('products.product', 'name price image');
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching delivery orders:', error);
        res.status(500).json({ message: 'Error fetching delivery orders', error });
    }
};

// Update delivery status (by delivery person)
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Check if delivery person is assigned to this order
        if (order.deliveryPerson.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not assigned to this order' });
        }
        
        // Update delivery status based on action
        switch (status) {
            case 'accepted':
                order.deliveryStatus = 'Accepted';
                order.status = 'Delivery Accepted';
                break;
            case 'rejected':
                order.deliveryStatus = 'Rejected';
                order.status = 'Ready for Delivery'; // Reset for reassignment
                order.deliveryPerson = null;
                break;
            case 'in_transit':
                order.deliveryStatus = 'In Transit';
                order.status = 'Out for Delivery';
                break;
            case 'delivered':
                order.deliveryStatus = 'Delivered';
                order.status = 'Delivered';
                order.deliveryDate = Date.now();
                break;
            case 'failed':
                order.deliveryStatus = 'Failed';
                order.status = 'Delivery Failed';
                order.deliveryAttempts += 1;
                break;
            default:
                return res.status(400).json({ message: 'Invalid status update' });
        }
        
        if (notes) {
            order.deliveryNotes = notes;
        }
        
        await order.save();
        
        res.json({ message: 'Delivery status updated', order });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ message: 'Error updating delivery status', error });
    }
};

// Add customer service note to order
exports.addCustomerNote = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { note } = req.body;
        const userId = req.user.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Add note to contact history
        order.customerContactHistory.push({
            note,
            agent: userId
        });

        // Update customer service fields
        order.customerServiceNotes = note;
        order.customerServiceAgent = userId;

        await order.save();

        res.json({ message: 'Customer service note added', order });
    } catch (error) {
        console.error('Error adding customer note:', error);
        res.status(500).json({ message: 'Error adding customer note', error });
    }
};

// Get customer service dashboard data
exports.getCustomerServiceDashboard = async (req, res) => {
    try {
        // Get total number of orders
        const totalOrders = await Order.countDocuments();
        
        // Get orders with customer service interactions
        const handledOrders = await Order.countDocuments({ customerServiceAgent: { $exists: true, $ne: null } });
        
        // Get orders by status
        const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        const processingOrders = await Order.countDocuments({ status: 'Processing' });
        const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
        const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
        
        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'username');
        
        res.json({
            totalOrders,
            handledOrders,
            ordersByStatus: {
                pending: pendingOrders,
                processing: processingOrders,
                delivered: deliveredOrders,
                cancelled: cancelledOrders
            },
            recentOrders
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Error fetching dashboard data', error });
    }
};