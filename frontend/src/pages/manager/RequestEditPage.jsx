import { useState, useEffect } from 'react';
import { ShieldAlert, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function RequestEditPage() {
    const [searchParams] = useSearchParams();
    const [moduleName, setModuleName] = useState('Invoices');
    const [customModule, setCustomModule] = useState('');
    const [referenceString, setReferenceString] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const refParam = searchParams.get('ref');
        const moduleParam = searchParams.get('module');
        if (refParam) setReferenceString(refParam);
        if (moduleParam) {
            setModuleName(moduleParam);
            setCustomModule(moduleParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const activeModule = customModule.trim() || moduleName;
        if (!activeModule || !referenceString || !reason) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/edit-requests', { 
                moduleName: activeModule, 
                referenceString, 
                reason 
            });

            Swal.fire({
                title: 'Request Sent!',
                text: `Edit access request for "${activeModule}" sent to Admin successfully. Once approved, you will gain 5 minutes edit access.`,
                icon: 'success',
                confirmButtonColor: '#3085d6',
            });

            setReferenceString('');
            setReason('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Request Edit Access"
                description="Submit a request to the Admin to unlock a record for manager editing (Access valid for 5 minutes once approved)."
                icon={ShieldAlert}
                showRequestEdit={false}
            />

            <div className="max-w-2xl mx-auto">
                <Card title="Submit Edit Access Request" className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Module / System Area</label>
                            <input
                                type="text"
                                value={customModule || moduleName}
                                onChange={(e) => {
                                    setCustomModule(e.target.value);
                                    setModuleName(e.target.value);
                                }}
                                placeholder="e.g. Poultry Batch Expenses & Income, Invoices, Bills..."
                                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 dark:text-gray-100 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Record Reference / Description (ID, Code, Name)</label>
                            <input 
                                type="text"
                                required
                                placeholder="e.g. 1st batch, INV-1002, Bill #1005, or Sale of Animals/Birds"
                                value={referenceString}
                                onChange={(e) => setReferenceString(e.target.value)}
                                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 dark:text-gray-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Edit Request</label>
                            <textarea 
                                required
                                rows="3"
                                placeholder="Explain why edit access is needed..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 dark:text-gray-100"
                            />
                        </div>

                        <Button type="submit" className="w-full justify-center bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending Request...' : 'Send Request to Admin'}
                            <Send size={16} className="ml-2" />
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
