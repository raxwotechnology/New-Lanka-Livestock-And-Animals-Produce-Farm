import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';

import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCreateUser } from './useUsers';

const createSchema = z.object({
    firstName: z.string().min(1, 'First name required').max(50),
    lastName: z.string().min(1, 'Last name required').max(50),
    email: z.string().email('Invalid email'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain uppercase')
        .regex(/[a-z]/, 'Must contain lowercase')
        .regex(/[0-9]/, 'Must contain number'),
    phone: z.string().optional().or(z.literal('')),
});

export default function ManagerAccountModal({ isOpen, onClose }) {
    const createMutation = useCreateUser();

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(createSchema),
        defaultValues: {
            firstName: '', lastName: '', email: '', password: '', phone: '',
        },
    });

    const generateTempPassword = () => {
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const nums = "0123456789";
        
        // Ensure at least one of each required type
        let pass = '';
        pass += upper[Math.floor(Math.random() * upper.length)];
        pass += lower[Math.floor(Math.random() * lower.length)];
        pass += nums[Math.floor(Math.random() * nums.length)];
        
        // Fill the rest to make it 8 characters
        const allChars = lower + upper + nums;
        for (let i = 0; i < 5; i++) {
            pass += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the characters
        return pass.split('').sort(() => 0.5 - Math.random()).join('');
    };

    useEffect(() => {
        if (isOpen) {
            reset({
                firstName: '', lastName: '', email: '', password: generateTempPassword(), phone: '',
            });
        }
    }, [isOpen, reset]);

    const handleGenerate = () => {
        setValue('password', generateTempPassword());
    };

    const onSubmit = async (data) => {
        try {
            await createMutation.mutateAsync({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                phone: data.phone || undefined,
                role: 'manager',
            });
            onClose();
        } catch { }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Manager Account" size="lg">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
                        <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
                    </div>
                    <Input label="Email / Username" type="email" required error={errors.email?.message} {...register('email')} />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                {...register('password')} 
                            />
                            <Button type="button" variant="outline" onClick={handleGenerate} title="Generate New Password">
                                <RefreshCw size={16} />
                            </Button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                            Share this generated password with the manager. They can change it after their first login.
                        </p>
                    </div>

                    <Input label="Phone" type="tel" {...register('phone')} />

                    <div className="mt-2 p-3 rounded-lg border border-orange-500/30 bg-orange-50 text-sm">
                        <p className="font-medium text-orange-700">Role: Manager</p>
                        <p className="text-orange-600/80 mt-1">This user will be assigned the system manager role and will have necessary management access permissions.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
                    <Button variant="outline" type="button" onClick={onClose} disabled={createMutation.isPending}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={createMutation.isPending}>
                        Create Manager Account
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
