import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Key } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function ApprovalCodeSettings() {
    const { user } = useAuthStore();
    const [mode, setMode] = useState('idle'); // idle, set, forgot, verify
    const [isSaving, setIsSaving] = useState(false);

    const setForm = useForm();
    const forgotForm = useForm();

    if (user?.role !== 'admin') return null;

    const handleSetCode = async (data) => {
        if (data.code !== data.confirmCode) {
            toast.error('Codes do not match');
            return;
        }
        setIsSaving(true);
        try {
            await api.post('/users/approval-code/set', { code: data.code });
            toast.success('Approval code set successfully');
            setForm.reset();
            setMode('idle');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to set code');
        } finally {
            setIsSaving(false);
        }
    };

    const handleForgotRequest = async () => {
        setIsSaving(true);
        try {
            const res = await api.post('/users/approval-code/forgot');
            toast.success(res.data.message);
            setMode('verify');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to request OTP');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetCode = async (data) => {
        if (data.newCode !== data.confirmNewCode) {
            toast.error('New codes do not match');
            return;
        }
        setIsSaving(true);
        try {
            await api.post('/users/approval-code/reset', { 
                otp: data.otp,
                newCode: data.newCode
            });
            toast.success('Approval code reset successfully');
            forgotForm.reset();
            setMode('idle');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset code');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="p-6 mt-6 border-amber-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Key size={20} className="text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Admin Approval Code</h3>
                </div>
                {mode === 'idle' && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMode('set')}>Set Code</Button>
                        <Button variant="outline" size="sm" onClick={() => setMode('forgot')}>Forgot Code</Button>
                    </div>
                )}
            </div>

            {mode === 'idle' && (
                <p className="text-sm text-gray-500">
                    A 4-digit PIN required to approve manager edit requests. Keep this secure.
                </p>
            )}

            {mode === 'set' && (
                <form onSubmit={setForm.handleSubmit(handleSetCode)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="New Approval Code" 
                            type="password" 
                            placeholder="e.g. 1234"
                            required 
                            {...setForm.register('code', { required: true, minLength: 4 })} 
                        />
                        <Input 
                            label="Confirm Code" 
                            type="password" 
                            required 
                            {...setForm.register('confirmCode', { required: true, minLength: 4 })} 
                        />
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                        <Button type="submit" variant="primary" loading={isSaving}>Save Code</Button>
                        <Button type="button" variant="outline" onClick={() => setMode('idle')}>Cancel</Button>
                    </div>
                </form>
            )}

            {mode === 'forgot' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        We will send an OTP to your email: <strong>{user?.email}</strong>. (For testing, check backend server console logs for the OTP).
                    </p>
                    <div className="flex gap-2 pt-2 border-t">
                        <Button variant="primary" onClick={handleForgotRequest} loading={isSaving}>Send OTP</Button>
                        <Button variant="outline" onClick={() => setMode('idle')}>Cancel</Button>
                    </div>
                </div>
            )}

            {mode === 'verify' && (
                <form onSubmit={forgotForm.handleSubmit(handleResetCode)} className="space-y-4">
                    <Input 
                        label="Enter OTP" 
                        placeholder="6-digit OTP"
                        required 
                        {...forgotForm.register('otp', { required: true })} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="New Approval Code" 
                            type="password" 
                            required 
                            {...forgotForm.register('newCode', { required: true, minLength: 4 })} 
                        />
                        <Input 
                            label="Confirm New Code" 
                            type="password" 
                            required 
                            {...forgotForm.register('confirmNewCode', { required: true, minLength: 4 })} 
                        />
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                        <Button type="submit" variant="primary" loading={isSaving}>Reset Code</Button>
                        <Button type="button" variant="outline" onClick={() => setMode('idle')}>Cancel</Button>
                    </div>
                </form>
            )}
        </Card>
    );
}

