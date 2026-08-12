import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { productFormSchema } from './productSchemas';
import { useCategories, useBrands, useCreateProduct, useUpdateProduct } from './useProducts';

export default function ProductFormModal({ isOpen, onClose, product = null }) {
    const isEdit = !!product;

    const { data: categoriesData } = useCategories();
    const { data: brandsData } = useBrands();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            productCode: '',
            productShortCode: '',
            type: 'trading',
            status: 'active',
            taxable: true,
            taxRate: 18,
            sellable: true,
            allowBackorder: false,
            minimumOrderQuantity: 1,
            unitOfMeasure: 'pcs',
        },
    });

    // When opening in edit mode, populate form
    useEffect(() => {
        if (isOpen && product) {
            reset({
                productCode: product.productCode || '',
                productShortCode: product.productShortCode || '',
                name: product.name || '',
                shortName: product.shortName || '',
                sku: product.sku || '',
                barcode: product.barcode || '',
                productType: product.productType || 'finished_good',
                canBeSold: product.canBeSold ?? true,
                canBePurchased: product.canBePurchased ?? true,
                canBeManufactured: product.canBeManufactured ?? false,
                description: product.description || '',
                categoryId: product.categoryId?._id || product.categoryId || '',
                brandId: product.brandId?._id || product.brandId || '',
                type: product.type || 'trading',
                unitOfMeasure: product.unitOfMeasure || '',
                basePrice: product.basePrice || 0,
                mrp: product.mrp || 0,
                taxable: product.tax?.taxable ?? true,
                taxRate: product.tax?.taxRate ?? 18,
                hsCode: product.tax?.hsCode || '',
                minimumLevel: product.stockLevels?.minimumLevel || 0,
                reorderLevel: product.stockLevels?.reorderLevel || 0,
                maximumLevel: product.stockLevels?.maximumLevel || 0,
                unitsPerCarton: product.packaging?.unitsPerCarton || 0,
                cartonsPerPallet: product.packaging?.cartonsPerPallet || 0,
                minimumOrderQuantity: product.salesConfig?.minimumOrderQuantity || 1,
                sellable: product.salesConfig?.sellable ?? true,
                allowBackorder: product.salesConfig?.allowBackorder ?? false,
                status: product.status || 'active',
                notes: product.notes || '',
            });
        } else if (isOpen && !product) {
            // Reset to defaults when creating new
            reset({
                productCode: '',
                productShortCode: '',
                type: 'trading',
                status: 'active',
                taxable: true,
                taxRate: 18,
                sellable: true,
                allowBackorder: false,
                minimumOrderQuantity: 1,
                unitOfMeasure: 'pcs',
            });
        }
    }, [isOpen, product, reset]);

    const onSubmit = async (data) => {
        // Transform flat form data back into nested structure for API
        const payload = {
            productCode: data.productCode || undefined,
            productShortCode: data.productShortCode || undefined,
            name: data.name,
            shortName: data.shortName || undefined,
            sku: data.sku || undefined,
            barcode: data.barcode || undefined,
            productType: data.productType,
            canBeSold: data.canBeSold,
            canBePurchased: data.canBePurchased,
            canBeManufactured: data.canBeManufactured,
            description: data.description || undefined,
            categoryId: data.categoryId,
            brandId: data.brandId || undefined,
            type: data.type,
            unitOfMeasure: data.unitOfMeasure,
            basePrice: data.basePrice,
            mrp: data.mrp || undefined,
            tax: {
                taxable: data.taxable,
                taxRate: data.taxRate || 0,
                hsCode: data.hsCode || undefined,
            },
            stockLevels: {
                minimumLevel: data.minimumLevel || 0,
                reorderLevel: data.reorderLevel || 0,
                maximumLevel: data.maximumLevel || 0,
            },
            packaging: {
                unitsPerCarton: data.unitsPerCarton || 0,
                cartonsPerPallet: data.cartonsPerPallet || 0,
            },
            salesConfig: {
                minimumOrderQuantity: data.minimumOrderQuantity || 1,
                sellable: data.sellable,
                allowBackorder: data.allowBackorder,
            },
            status: data.status,
            notes: data.notes || undefined,
        };

        try {
            if (isEdit) {
                await updateProduct.mutateAsync({ id: product._id, data: payload });
            } else {
                await createProduct.mutateAsync(payload);
            }
            onClose();
        } catch (err) {
            // Errors already toasted via hook
        }
    };

    const categoryOptions = (categoriesData?.data || []).map((c) => ({
        value: c._id,
        label: `${c.name} (${c.code})`,
    }));
    const brandOptions = (brandsData?.data || []).map((b) => ({
        value: b._id,
        label: b.name,
    }));

    const isLoading = createProduct.isPending || updateProduct.isPending;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? `Edit Product — ${product?.productCode}` : 'Quick Add Product'}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input 
                            label="Product Name" 
                            required 
                            error={errors.name?.message} 
                            {...register('name')} 
                        />
                        <Input 
                            label="Unit of Measure (e.g. pcs, kg)" 
                            required 
                            error={errors.unitOfMeasure?.message} 
                            {...register('unitOfMeasure')} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Select
                            label="Category"
                            required
                            error={errors.categoryId?.message}
                            options={categoryOptions}
                            {...register('categoryId')}
                        />
                        <Select
                            label="Brand"
                            error={errors.brandId?.message}
                            options={brandOptions}
                            {...register('brandId')}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            label="Unit Price (Selling Price)"
                            type="number"
                            step="0.01"
                            required
                            error={errors.basePrice?.message}
                            {...register('basePrice')}
                        />
                        <Input
                            label="Cost Price (MRP)"
                            type="number"
                            step="0.01"
                            error={errors.mrp?.message}
                            {...register('mrp')}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Initial Stock isn't natively supported in the product schema directly, 
                            so we'll map it to minimumLevel just to fulfill the UI request 
                            or you can handle it via an inventory adjustment route later. */}
                        <Input
                            label="Initial Stock / Quantity"
                            type="number"
                            disabled={isEdit}
                            placeholder={isEdit ? "Manage stock via Inventory" : "0"}
                            error={errors.minimumLevel?.message}
                            {...register('minimumLevel')}
                        />
                        <Input
                            label="Reorder Level (Min. Alert)"
                            type="number"
                            error={errors.reorderLevel?.message}
                            {...register('reorderLevel')}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <Button variant="outline" onClick={onClose} type="button" disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isLoading}>
                        {isEdit ? 'Update Product' : 'Save Product'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}