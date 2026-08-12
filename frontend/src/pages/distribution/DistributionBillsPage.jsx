import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Receipt, ShoppingCart, Trash2, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { distributionApi } from '../../features/distribution/distributionApi';
import { useAuthStore, isRecordRecentlyCreated, isRecordApprovedForEdit } from '../../store/authStore';

export default function DistributionBillsPage() {
    const queryClient = useQueryClient();
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const navigate = useNavigate();
    const { user, createdRecords, approvedEditRecords, addCreatedRecord } = useAuthStore();
    const isDataEntry = user?.role === 'manager';

    const [paymentFilter, setPaymentFilter] = useState('');

    const { data: billsResp, isLoading } = useQuery({ 
        queryKey: ['dist-bills', paymentFilter], 
        queryFn: () => distributionApi.getBills(paymentFilter ? { paymentMethod: paymentFilter } : {})
    });
    const { data: itemsResp } = useQuery({ queryKey: ['dist-items'], queryFn: distributionApi.getItems });
    
    let bills = billsResp?.data?.data || [];
    const items = itemsResp?.data?.data || [];

    if (isDataEntry) {
        bills = bills.filter(b => 
            isRecordRecentlyCreated(b, createdRecords) || 
            isRecordApprovedForEdit(b, approvedEditRecords)
        );
    }

    const sales = bills.filter(b => b.type === 'SALE');
    const purchases = bills.filter(b => b.type === 'PURCHASE');

    const addMut = useMutation({
        mutationFn: distributionApi.createBill,
        onSuccess: (res) => {
            if (res?.data?._id || res?._id) {
                addCreatedRecord(res.data?._id || res._id);
            } else if (res?.data?.data?._id) {
                addCreatedRecord(res.data.data._id);
            }
            queryClient.invalidateQueries(['dist-bills']);
            queryClient.invalidateQueries(['dist-items']);
            setIsSaleModalOpen(false);
            setIsPurchaseModalOpen(false);
            Swal.fire({
                title: 'Success!',
                text: 'Bill recorded successfully!',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to record bill')
    });

    const updateMut = useMutation({
        mutationFn: async (data) => {
            const res = await api.put(`/distribution/bills/${data._id}`, data);
            return res.data;
        },
        onSuccess: (data, variables) => {
            useAuthStore.getState().removeApprovedEditRecord(variables.bill_number);
            useAuthStore.getState().removeApprovedEditRecord(variables._id);
            useAuthStore.getState().addCreatedRecord(variables._id);
            queryClient.invalidateQueries(['dist-bills']);
            queryClient.invalidateQueries(['dist-items']);
            setIsSaleModalOpen(false);
            setIsPurchaseModalOpen(false);
            setEditingBill(null);
            toast.success('Bill updated successfully!');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update bill')
    });

    const BillForm = ({ type, onClose, initialData }) => {
        const { register, control, handleSubmit, watch, setValue } = useForm({
            defaultValues: initialData ? {
                ...initialData,
                date: new Date(initialData.date).toISOString().split('T')[0],
                items: initialData.items.map(i => ({ ...i, item_id: i.item_id?._id || i.item_id }))
            } : {
                bill_number: `${type === 'SALE' ? 'INV' : 'BILL'}-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'Cash',
                items: [{ item_id: '', quantity: 1, unit_price: 0, total: 0 }]
            }
        });
        const { fields, append, remove } = useFieldArray({ control, name: 'items' });

        const watchItems = watch('items');

        const calculateRowTotal = (index) => {
            const item = watchItems[index];
            if (!item) return 0;
            return (item.quantity || 0) * (item.unit_price || 0);
        };

        const grandTotal = watchItems.reduce((acc, curr, idx) => {
            return acc + calculateRowTotal(idx);
        }, 0);

        const handleItemSelect = (index, itemId) => {
            const selected = items.find(i => i._id === itemId);
            if (selected && type === 'SALE') {
                setValue(`items.${index}.unit_price`, selected.selling_price);
            }
        };

        const onSubmit = (data) => {
            if (data.items.length === 0) return toast.error('Add at least one item');
            
            const processedItems = data.items.map(item => ({
                ...item,
                total: (item.quantity || 0) * (item.unit_price || 0)
            }));
            
            if (initialData) {
                updateMut.mutate({ ...data, items: processedItems, type, grand_total: grandTotal, _id: initialData._id });
            } else {
                addMut.mutate({ ...data, items: processedItems, type, grand_total: grandTotal });
            }
        };

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Bill Number" required {...register('bill_number')} />
                    <Input label="Date" type="date" required {...register('date')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label={type === 'SALE' ? "Customer Name" : "Supplier Name"} required {...register('party_name')} />
                    <Select label="Transaction Method" required {...register('paymentMethod')}>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Credit">Credit</option>
                    </Select>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-700">Items</h4>
                        <Button type="button" size="sm" variant="secondary" onClick={() => append({ item_id: '', quantity: 1, unit_price: 0, total: 0 })}>
                            <Plus size={14} className="mr-1" /> Add Row
                        </Button>
                    </div>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Select 
                                    label="Item" 
                                    required 
                                    {...register(`items.${index}.item_id`)}
                                    onChange={(e) => handleItemSelect(index, e.target.value)}
                                >
                                    <option value="" disabled>Select Item</option>
                                    {items.map(item => (
                                        <option key={item._id} value={item._id}>{item.name} ({item.stock_quantity} {item.unit} avail)</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="w-24">
                                <Input label="Qty" type="number" step="0.01" required {...register(`items.${index}.quantity`)} />
                            </div>
                            <div className="w-32">
                                <Input label="Price (Rs)" type="number" step="0.01" required {...register(`items.${index}.unit_price`)} />
                            </div>
                            <div className="w-32">
                                <Input label="Total" type="number" readOnly value={calculateRowTotal(index)} className="bg-gray-100" />
                            </div>
                            {index > 0 && (
                                <button type="button" onClick={() => remove(index)} className="p-2 mb-1 text-red-500 hover:bg-red-50 rounded-md">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    <div className="text-right pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">Grand Total</p>
                        <p className="text-2xl font-bold text-gray-900">Rs. {grandTotal.toLocaleString()}</p>
                    </div>
                </div>

                <Input label="Remarks" {...register('remarks')} />

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={addMut.isPending || updateMut.isPending}>
                        {initialData ? 'Update' : 'Save'} {type === 'SALE' ? 'Invoice' : 'Bill'}
                    </Button>
                </div>
            </form>
        );
    };

    const deleteMut = useMutation({
        mutationFn: distributionApi.deleteBill,
        onSuccess: () => {
            queryClient.invalidateQueries(['dist-bills']);
            queryClient.invalidateQueries(['dist-items']);
            toast.success('Bill deleted successfully');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete bill')
    });

    const handleDeleteBill = (id) => {
        if (window.confirm('Are you sure you want to delete this bill? This will reverse the stock changes associated with it.')) {
            deleteMut.mutate(id);
        }
    };

    const columns = [
        { label: 'Date', key: 'date', render: (row) => new Date(row.date).toLocaleDateString() },
        { label: 'Bill Number', key: 'bill_number', className: 'font-medium' },
        { label: 'Party Name', key: 'party_name' },
        { 
            label: 'Type', 
            key: 'type', 
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.type === 'SALE' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {row.type}
                </span>
            ) 
        },
        { 
            label: 'Transaction Method', 
            key: 'paymentMethod', 
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : row.paymentMethod === 'Cheque' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                    {row.paymentMethod || 'Cash'}
                </span>
            )
        },
        { label: 'Items', key: 'items', render: (row) => `${row.items.length} item(s)` },
        { label: 'Total', key: 'grand_total', render: (row) => `Rs. ${row.grand_total.toLocaleString()}` },
        {
            label: 'Actions',
            key: 'actions',
            render: (row) => (
                <div className="flex space-x-2">
                    {(!isDataEntry || isRecordApprovedForEdit(row, approvedEditRecords, createdRecords)) && (
                        <button 
                            onClick={() => {
                                setEditingBill(row);
                                if (row.type === 'SALE') setIsSaleModalOpen(true);
                                else setIsPurchaseModalOpen(true);
                            }} 
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Edit Bill"
                        >
                            <Edit2 size={16} />
                        </button>
                    )}
                    {!isDataEntry && (
                        <button 
                            onClick={() => handleDeleteBill(row._id)} 
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete Bill"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <PageHeader 
                    title="Chicken Distribution Bills & Invoices" 
                    description="Manage inward supplier bills and outward customer invoices"
                />
                <Select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full md:w-48 bg-white"
                >
                    <option value="">All Payment Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit">Credit</option>
                </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Section */}
                <Card className="p-4 border-t-4 border-t-green-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center text-green-700">
                            <ArrowUpRight className="mr-2" size={20} /> Sales Invoices
                        </h3>
                        <Button size="sm" onClick={() => { setEditingBill(null); setIsSaleModalOpen(true); }}>Issue Invoice</Button>
                    </div>
                    <Table columns={columns} data={sales} isLoading={isLoading} />
                </Card>

                {/* Purchases Section */}
                <Card className="p-4 border-t-4 border-t-amber-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center text-amber-700">
                            <ArrowDownRight className="mr-2" size={20} /> Purchase Bills
                        </h3>
                        <Button size="sm" onClick={() => { setEditingBill(null); setIsPurchaseModalOpen(true); }}>Record Bill</Button>
                    </div>
                    <Table columns={columns} data={purchases} isLoading={isLoading} />
                </Card>
            </div>

            <Modal isOpen={isSaleModalOpen} onClose={() => { setIsSaleModalOpen(false); setEditingBill(null); }} title={editingBill ? "Edit Sale Invoice" : "Issue Sale Invoice"} size="lg">
                <BillForm type="SALE" onClose={() => { setIsSaleModalOpen(false); setEditingBill(null); }} initialData={editingBill} />
            </Modal>

            <Modal isOpen={isPurchaseModalOpen} onClose={() => { setIsPurchaseModalOpen(false); setEditingBill(null); }} title={editingBill ? "Edit Purchase Bill" : "Record Purchase Bill"} size="lg">
                <BillForm type="PURCHASE" onClose={() => { setIsPurchaseModalOpen(false); setEditingBill(null); }} initialData={editingBill} />
            </Modal>
        </div>
    );
}
