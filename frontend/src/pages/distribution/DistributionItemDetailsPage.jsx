import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, DollarSign, Upload, FileText, Trash2, Maximize2, X } from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { distributionApi } from '../../features/distribution/distributionApi';

export default function DistributionItemDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);

    const [previewImage, setPreviewImage] = useState(null);

    const { data: resp, isLoading } = useQuery({ 
        queryKey: ['dist-item-details', id], 
        queryFn: () => distributionApi.getItemById(id) 
    });

    const item = resp?.data?.data?.item;
    const history = resp?.data?.data?.history || [];

    const uploadMut = useMutation({
        mutationFn: (fileData) => distributionApi.uploadItemAttachment(id, fileData),
        onSuccess: () => {
            queryClient.invalidateQueries(['dist-item-details', id]);
            toast.success('Attachment uploaded successfully');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload attachment')
    });

    const deleteMut = useMutation({
        mutationFn: (attachmentId) => distributionApi.deleteItemAttachment(id, attachmentId),
        onSuccess: () => {
            queryClient.invalidateQueries(['dist-item-details', id]);
            toast.success('Attachment deleted');
        },
        onError: (err) => toast.error('Failed to delete attachment')
    });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input
        e.target.value = null;

        // Check file size (limit to ~10MB to match typical express limit)
        if (file.size > 10 * 1024 * 1024) {
            return toast.error('File size must be less than 10MB');
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            uploadMut.mutate({
                file_data: reader.result,
                file_name: file.name,
                file_type: file.type
            });
        };
        reader.onerror = () => toast.error('Failed to read file');
        reader.readAsDataURL(file);
    };

    if (isLoading) return <div className="p-6 text-gray-500">Loading item details...</div>;
    if (!item) return <div className="p-6 text-red-500">Item not found.</div>;

    const historyColumns = [
        { label: 'Date', key: 'date', render: (row) => new Date(row.date).toLocaleDateString() },
        { label: 'Type', key: 'type', render: (row) => (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.type === 'SALE' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {row.type}
            </span>
        )},
        { 
            label: 'Transaction Method', 
            key: 'paymentMethod', 
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : row.paymentMethod === 'Cheque' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                    {row.paymentMethod || 'Cash'}
                </span>
            )
        },
        { label: 'Bill No', key: 'bill_number' },
        { label: 'Party', key: 'party_name' },
        { label: 'Qty', key: 'quantity', render: (row) => `${row.quantity} ${item.unit}` },
        { label: 'Unit Price', key: 'unit_price', render: (row) => `Rs. ${row.unit_price}` },
        { label: 'Total', key: 'total', render: (row) => `Rs. ${row.total.toLocaleString()}` }
    ];

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <PageHeader 
                    title={item.name}
                    description={`Category: ${item.category} | Added: ${new Date(item.createdAt).toLocaleDateString()}`}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-t-4 border-t-blue-500">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-full"><Package size={32} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Available Stock</p>
                            <p className="text-3xl font-bold text-gray-900">{item.stock_quantity} <span className="text-xl text-gray-500 font-normal">{item.unit}</span></p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-t-4 border-t-green-500">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-green-100 text-green-600 rounded-full"><DollarSign size={32} /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Standard Selling Price</p>
                            <p className="text-3xl font-bold text-gray-900">Rs. {item.selling_price.toLocaleString()} <span className="text-xl text-gray-500 font-normal">/ {item.unit}</span></p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                {/* Distribution History */}
                <div className="xl:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">Chicken Distribution History</h3>
                    <Card className="p-0 overflow-hidden">
                        {history.length > 0 ? (
                            <Table columns={historyColumns} data={history} />
                        ) : (
                            <div className="p-6 text-center text-gray-500">No sales or purchases recorded for this item yet.</div>
                        )}
                    </Card>
                </div>

                {/* Attachments & Proof Documents */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-800">Bill Attachments</h3>
                        <div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                className="hidden" 
                                accept="image/jpeg,image/png,application/pdf"
                            />
                            <Button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="flex items-center gap-2 py-1 px-3 text-sm"
                                disabled={uploadMut.isPending}
                            >
                                <Upload size={14} /> {uploadMut.isPending ? 'Uploading...' : 'Upload'}
                            </Button>
                        </div>
                    </div>
                    
                    <Card className="p-4 bg-gray-50 border-dashed border-2">
                        {(!item.attachments || item.attachments.length === 0) ? (
                            <div className="text-center py-8 text-gray-400 flex flex-col items-center">
                                <FileText size={48} className="mb-2 opacity-50" />
                                <p className="text-sm">No attachments found.</p>
                                <p className="text-xs mt-1">Upload manual bill photos or receipts here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {item.attachments.map(att => (
                                    <div key={att._id} className="relative group bg-white p-2 rounded-lg border shadow-sm flex flex-col items-center hover:shadow-md transition-shadow">
                                        {att.file_type.startsWith('image/') ? (
                                            <div 
                                                className="w-full h-48 bg-white rounded flex items-center justify-center cursor-pointer overflow-hidden border"
                                                onClick={() => setPreviewImage(att.file_data)}
                                                title="Click to Enlarge / Zoom"
                                            >
                                                <img src={att.file_data} alt={att.file_name} className="w-full h-full object-contain bg-white" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-48 bg-white rounded border flex items-center justify-center cursor-pointer" onClick={() => {
                                                if (att.file_type === 'application/pdf') {
                                                    const newWindow = window.open();
                                                    newWindow.document.write(`<iframe src="${att.file_data}" width="100%" height="100%" style="border:none;"></iframe>`);
                                                }
                                            }}>
                                                <FileText size={48} className="text-gray-400" />
                                            </div>
                                        )}
                                        <div className="mt-2 text-xs truncate w-full text-center font-medium" title={att.file_name}>{att.file_name}</div>
                                        <div className="text-[10px] text-gray-500">{new Date(att.uploaded_at).toLocaleDateString()}</div>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete attachment?')) deleteMut.mutate(att._id); }}
                                            className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-4xl max-h-full">
                        <button className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2"><X size={32} /></button>
                        <img src={previewImage} alt="Attachment Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                    </div>
                </div>
            )}
        </div>
    );
}
