import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const getUsers = asyncHandler(async (req, res) => {
    const { role, search, isActive, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
        filter.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
        User.find(filter).sort({ firstName: 1 }).skip(skip).limit(Number(limit)),
        User.countDocuments(filter),
    ]);

    res.json({ success: true, count: users.length, total, data: users });
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    res.json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, role, isActive, permissions } = req.body;
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, phone, role, isActive, permissions },
        { new: true, runValidators: true }
    );
    if (!user) { res.status(404); throw new Error('User not found'); }
    res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400); throw new Error('Cannot delete yourself');
    }
    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();
    res.json({ success: true, message: 'User deleted' });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

    const updatedUser = await user.save();

    res.json({
        success: true,
        data: {
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
            permissions: updatedUser.permissions,
            isActive: updatedUser.isActive,
        }
    });
});

export const setApprovalCode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code || code.length < 4) {
        res.status(400);
        throw new Error('Approval code must be at least 4 characters');
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    const salt = await bcrypt.genSalt(10);
    user.approvalCode = await bcrypt.hash(code, salt);
    await user.save();
    res.json({ success: true, message: 'Approval code set successfully' });
});

export const forgotApprovalCode = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    user.approvalOtp = await bcrypt.hash(otp, salt);
    user.approvalOtpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    
    console.log(`\n\n========================================`);
    console.log(`OTP for Approval Code Reset: ${otp}`);
    console.log(`Email would be sent to: ${user.email}`);
    console.log(`========================================\n\n`);
    
    res.json({ success: true, message: 'OTP generated. Check server console.' });
});

export const resetApprovalCode = asyncHandler(async (req, res) => {
    const { otp, newCode } = req.body;
    if (!otp || !newCode || newCode.length < 4) {
        res.status(400);
        throw new Error('Valid OTP and new code (min 4 chars) are required');
    }
    
    const user = await User.findById(req.user._id).select('+approvalOtp +approvalOtpExpiry');
    if (!user || !user.approvalOtp) {
        res.status(400);
        throw new Error('No OTP request found');
    }
    
    if (user.approvalOtpExpiry < Date.now()) {
        res.status(400);
        throw new Error('OTP expired');
    }
    
    const isMatch = await bcrypt.compare(otp, user.approvalOtp);
    if (!isMatch) {
        res.status(400);
        throw new Error('Invalid OTP');
    }
    
    const salt = await bcrypt.genSalt(10);
    user.approvalCode = await bcrypt.hash(newCode, salt);
    user.approvalOtp = undefined;
    user.approvalOtpExpiry = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Approval code reset successfully' });
});
