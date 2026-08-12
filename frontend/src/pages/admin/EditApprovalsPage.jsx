import { useState } from 'react';
import { ShieldCheck, Check, X, Search } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import Badge from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';

export default function EditApprovalsPage() {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approvalCode, setApprovalCode] = useState('');
    const { addApprovedEditRecord } = useAuthStore();

    const { data: requests, refetch, isLoading } = useQuery({
        queryKey: ['admin-edit-requests'],
        queryFn: () => api.get('/edit-requests').then(res => res.data.data)
    });

    const handleApprove = async () => {
        if (!approvalCode) {
            toast.error('Please enter your Approval Code (PIN).');
            return;
        }

        try {
            await api.put(`/edit-requests/${selectedRequest._id}/approve`, { 
                approvalCode
            });
            toast.success('Request approved');
            
            // Unlock by reference string on the frontend
            if (selectedRequest.referenceString) {
                addApprovedEditRecord(selectedRequest.referenceString);
            }
            
            setSelectedRequest(null);
            setApprovalCode('');
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve request');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this edit request?')) return;
        
        try {
            await api.put(`/edit-requests/${id}/reject`);
            toast.success('Request rejected');
            if (selectedRequest?._id === id) setSelectedRequest(null);
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject request');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Edit Approvals (Admin)"
                description="Review and approve manager requests to unlock and edit previously added records."
                icon={ShieldCheck}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-500">Loading requests...</div>
                    ) : (!requests || requests.length === 0) ? (
                        <Card className="p-10 text-center text-gray-500">
                            No edit requests found.
                        </Card>
                    ) : (
                        requests.map(req => (
                            <Card key={req._id} className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900">{req.referenceString}</h3>
                                        <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}>
                                            {req.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">Module: {req.moduleName} | Requested by: {req.managerId?.name}</p>
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-200">
                                        <span className="font-semibold">Reason:</span> {req.reason}
                                    </div>
                                    {req.status === 'approved' && req.approvedRecordId && (
                                        <p className="text-xs text-green-600 mt-2 font-mono">Unlocked Record ID: {req.approvedRecordId}</p>
                                    )}
                                </div>

                                {req.status === 'pending' && (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleReject(req._id)}
                                        >
                                            <X size={16} className="mr-1" /> Reject
                                        </Button>
                                        <Button 
                                            variant="primary" 
                                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                                            onClick={() => setSelectedRequest(req)}
                                        >
                                            <Check size={16} className="mr-1" /> Approve...
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>

                {/* Approval Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {selectedRequest ? (
                        <Card className="p-5 sticky top-6 border-blue-200 shadow-lg ring-1 ring-blue-500 ring-opacity-50">
                            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Approve Request</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                You are approving access for <strong>{selectedRequest.managerId?.name}</strong> to edit <strong>{selectedRequest.referenceString}</strong>.
                            </p>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Approval Code
                                </label>
                                <input
                                    type="password"
                                    value={approvalCode}
                                    onChange={(e) => setApprovalCode(e.target.value)}
                                    placeholder="Enter your PIN"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setSelectedRequest(null)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                                    Confirm Unlock
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-5 bg-gray-50 text-center text-gray-500 text-sm">
                            Select a pending request to approve it and attach the specific record ID.
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
