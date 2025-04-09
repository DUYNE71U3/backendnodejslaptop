const User = require('../models/user');
const crypto = require('crypto');
const moment = require('moment');
const Payment = require('../models/payment');

// VNPAY Configuration
const vnp_TmnCode = process.env.VNP_TMN_CODE || "JAMQYX29";
const vnp_HashSecret = process.env.VNP_HASH_SECRET || "ESYLTZY5FBFCTSM16IMQUVCEHDTIQJD2";
const vnp_Url = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = process.env.VNP_RETURN_URL || "http://localhost:3000/payment-callback";

// Get wallet balance
exports.getWalletBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ balance: user.walletBalance });
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create VNPAY payment URL
exports.createPaymentRequest = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            console.error('Invalid amount:', amount);
            return res.status(400).json({ message: 'Invalid amount' });
        }

        // Format date & create order ID exactly as in VNPAY's example
        const createDate = moment().format('YYYYMMDDHHmmss');
        const orderId = moment().format('HHmmss');
        
        // Save payment record
        const payment = new Payment({
            orderId: orderId,
            userId: req.user.id,
            amount: parseInt(amount),
            status: 'pending'
        });
        await payment.save();
        
        // IMPORTANT: This implementation follows VNPAY's documentation exactly
        
        // Create raw request object
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Nap tien vi dien tu';
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = parseInt(amount) * 100;
        vnp_Params['vnp_ReturnUrl'] = vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = '127.0.0.1'; // Fixed IP for consistency
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_BankCode'] = 'NCB';

        // Sort alphabetically before signing
        vnp_Params = sortObject(vnp_Params);
        
        // Create raw signature string exactly as VNPAY does
        const signData = Object.keys(vnp_Params)
            .map(key => `${key}=${vnp_Params[key]}`)
            .join('&');
        
        // Make SHA512 HMAC signature
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        // Add secure hash after object is sorted and signed
        vnp_Params['vnp_SecureHash'] = signed;
        
        // Create full URL using URLSearchParams
        // Note: This preserves exact parameter encoding format that VNPAY expects
        const paymentUrl = `${vnp_Url}?${new URLSearchParams(vnp_Params).toString()}`;
        
        console.log('VNPAY Payment URL:', paymentUrl);
        console.log('SignData for hash calculation:', signData);
        console.log('Generated hash:', signed);
        console.log('Payment Record Created:', payment);
        
        res.json({ paymentUrl });
    } catch (error) {
        console.error('Error creating payment request:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Handle VNPAY return callback
exports.handleCallback = async (req, res) => {
    try {
        // Get query parameters from URL
        const vnp_Params = req.query;
        
        // Get the secure hash from the parameters
        const secureHash = vnp_Params['vnp_SecureHash'];
        
        // Remove hash fields from validation set
        const verifyParams = { ...vnp_Params };
        delete verifyParams['vnp_SecureHash'];
        delete verifyParams['vnp_SecureHashType'];
        
        // Sort parameters for consistent signature creation
        const sortedParams = sortObject(verifyParams);
        
        // Create raw signature string exactly as VNPAY does
        const signData = Object.keys(sortedParams)
            .map(key => `${key}=${sortedParams[key]}`)
            .join('&');
        
        // Create HMAC SHA512 signature
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        console.log('Callback verification:');
        console.log('- SignData:', signData);
        console.log('- Received hash:', secureHash);
        console.log('- Calculated hash:', calculatedHash);
        
        // Check if signatures match
        if (calculatedHash === secureHash) {
            // Get the transaction details
            const txnRef = vnp_Params['vnp_TxnRef'];
            const responseCode = vnp_Params['vnp_ResponseCode'];
            
            console.log('Payment response: TxnRef=', txnRef, 'ResponseCode=', responseCode);
            
            // Process payment status update
            if (responseCode === '00') {
                // Find the payment record
                const payment = await Payment.findOne({ orderId: txnRef });
                
                if (payment) {
                    // Update payment status to success
                    payment.status = 'success';
                    await payment.save();
                    
                    // Find user and update wallet balance
                    const user = await User.findById(payment.userId);
                    if (user) {
                        user.walletBalance += payment.amount;
                        await user.save();
                        console.log('Wallet updated. New balance:', user.walletBalance);
                    }
                }
            }
            
            // Redirect back to frontend with all parameters preserved
            return res.redirect(`/payment-callback?${new URLSearchParams(req.query).toString()}`);
        } else {
            console.error('Hash verification failed');
            return res.redirect('/payment-callback?vnp_ResponseCode=97&vnp_Message=InvalidSignature');
        }
    } catch (error) {
        console.error('Error processing callback:', error);
        return res.redirect('/payment-callback?vnp_ResponseCode=99&vnp_Message=SystemError');
    }
};

// Handle VNPAY IPN (Instant Payment Notification)
exports.vnpayIpn = async (req, res) => {
    try {
        // Get query parameters from URL
        const vnp_Params = req.query;
        
        // Get the secure hash from the parameters
        const secureHash = vnp_Params['vnp_SecureHash'];
        
        // Remove hash fields from validation set
        const verifyParams = { ...vnp_Params };
        delete verifyParams['vnp_SecureHash'];
        delete verifyParams['vnp_SecureHashType'];
        
        // Sort parameters for consistent signature creation
        const sortedParams = sortObject(verifyParams);
        
        // Create raw signature string exactly as VNPAY does
        const signData = Object.keys(sortedParams)
            .map(key => `${key}=${sortedParams[key]}`)
            .join('&');
        
        // Create HMAC SHA512 signature
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        console.log('IPN Verification:');
        console.log('- SignData:', signData);
        console.log('- Received hash:', secureHash);
        console.log('- Calculated hash:', calculatedHash);
        
        // Check if signatures match
        if (calculatedHash === secureHash) {
            // Get the transaction details
            const txnRef = vnp_Params['vnp_TxnRef'];
            const responseCode = vnp_Params['vnp_ResponseCode'];
            
            // Find the payment record
            const payment = await Payment.findOne({ orderId: txnRef });
            
            if (!payment) {
                return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }
            
            // Only process if payment is pending
            if (payment.status === 'pending') {
                if (responseCode === '00') {
                    // Update payment status
                    payment.status = 'success';
                    await payment.save();
                    
                    // Update user wallet
                    const user = await User.findById(payment.userId);
                    if (!user) {
                        return res.status(200).json({ RspCode: '02', Message: 'User not found' });
                    }
                    
                    // Add payment amount to wallet
                    user.walletBalance += payment.amount;
                    await user.save();
                    
                    console.log('IPN: Payment successful. Wallet updated.');
                    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
                } else {
                    // Update payment status to failed
                    payment.status = 'failed';
                    await payment.save();
                    
                    console.log('IPN: Payment failed. ResponseCode:', responseCode);
                    return res.status(200).json({ RspCode: responseCode, Message: 'Confirm Fail' });
                }
            } else {
                // Payment already processed
                return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
            }
        } else {
            // Invalid signature
            return res.status(200).json({ RspCode: '97', Message: 'Invalid Signature' });
        }
    } catch (error) {
        console.error('Error processing IPN:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

// Helper function to sort object by key
function sortObject(obj) {
    let sorted = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
        if (obj.hasOwnProperty(key)) {
            sorted[key] = obj[key];
        }
    }
    
    return sorted;
}