import EditRequest from '../models/EditRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { sendToUser } from '../services/socketService.js';

// Manager creates a request
export const createEditRequest = async (req, res) => {
    try {
        const { moduleName, referenceString, reason } = req.body;
        
        const newRequest = new EditRequest({
            managerId: req.user._id,
            moduleName,
            referenceString,
            reason
        });
        
        await newRequest.save();
        
        // Notify Admins
        const admins = await User.find({ role: { $in: ['admin', 'superadmin', 'md'] } });
        const managerInfo = await User.findById(req.user._id);
        
        const notificationPromises = admins.map(async (admin) => {
            const notification = await Notification.create({
                recipient: admin._id,
                title: 'New Edit Access Request',
                message: `${managerInfo?.name || 'A manager'} is requesting edit access for ${moduleName} - ${referenceString}.`,
                type: 'approval',
                link: '/edit-approvals'
            });
            
            // Broadcast via Socket.IO
            sendToUser(admin._id.toString(), 'new_notification', notification);
        });
        
        await Promise.all(notificationPromises);

        res.status(201).json({ success: true, data: newRequest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Manager gets their own requests
export const getMyEditRequests = async (req, res) => {
    try {
        const requests = await EditRequest.find({ managerId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin gets all pending requests
export const getAllEditRequests = async (req, res) => {
    try {
        const requests = await EditRequest.find().populate('managerId', 'name email role').sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin approves a request
export const approveEditRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvalCode } = req.body;

        if (!approvalCode) {
            return res.status(400).json({ success: false, message: 'Approval code is required' });
        }

        const admin = await User.findById(req.user._id).select('+approvalCode');
        if (!admin || !admin.approvalCode) {
            return res.status(400).json({ success: false, message: 'Approval code not set in your profile' });
        }

        const isMatch = await bcrypt.compare(approvalCode, admin.approvalCode);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid approval code' });
        }
        
        const request = await EditRequest.findByIdAndUpdate(
            id,
            {
                status: 'approved',
                approvedBy: req.user._id,
                approvedAt: new Date()
            },
            { new: true }
        );
        
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        
        const mod = request.moduleName?.toLowerCase() || '';
        let link = '/';
        if (mod.includes('bill')) link = '/bills';
        else if (mod.includes('product')) link = '/products';
        else if (mod.includes('customer')) link = '/customers';
        else if (mod.includes('supplier')) link = '/suppliers';
        else if (mod.includes('sales') || mod.includes('order')) link = '/sales-orders';
        else if (mod.includes('grn')) link = '/grn';
        else if (mod.includes('poultry')) link = '/poultry/finances';
        else if (mod.includes('piggery')) link = '/piggery/finances';

        // Notify the manager ONLY on approval
        const notification = await Notification.create({
            recipient: request.managerId,
            title: 'Edit Access Approved',
            message: `Admin has approved your edit request for ${request.referenceString}. You can now view and edit this record.`,
            type: 'system',
            link: link,
            metadata: { referenceString: request.referenceString }
        });
        sendToUser(request.managerId.toString(), 'new_notification', notification);
        
        // Remove the original notification sent to admins
        await Notification.deleteMany({
            title: 'New Edit Access Request',
            message: { $regex: request.referenceString }
        });

        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin rejects a request
export const rejectEditRequest = async (req, res) => {
    try {
        const { id } = req.params;
        
        const request = await EditRequest.findByIdAndUpdate(
            id,
            { status: 'rejected' },
            { new: true }
        );

        if (request) {
            // Notify the manager
            const notification = await Notification.create({
                recipient: request.managerId,
                title: 'Edit Access Rejected',
                message: `Admin has rejected your edit request for ${request.referenceString}.`,
                type: 'system',
                link: '/'
            });
            sendToUser(request.managerId.toString(), 'new_notification', notification);
            
            // Remove the original notification sent to admins
            await Notification.deleteMany({
                title: 'New Edit Access Request',
                message: { $regex: request.referenceString }
            });
        }
        
        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
