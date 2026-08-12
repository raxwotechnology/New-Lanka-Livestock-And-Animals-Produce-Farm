import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, BarChart3, Package, ShoppingCart, Users, Settings, Navigation,
    FolderTree, Award, UserCircle, Tags, Warehouse, Boxes, Truck,
    ShoppingBag, FileText, Receipt, Wallet, Workflow, Factory, ShieldCheck,
    RotateCcw, Wrench, AlertTriangle, FileMinus, X, Users as UsersIcon, Building2, Clock, Calendar as CalendarIcon, Plane, Calculator, DollarSign, Upload,
    ClipboardList, UserPlus, Ship, Layers, History, FileSpreadsheet,
    ChevronDown, ChevronRight, CheckSquare, ClipboardCheck, BadgeCheck,
    PackageCheck, CreditCard, Tag, Mail, Sparkles, Bird, Activity, Plus, Search, Calendar
} from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import { useAuthStore } from '../../store/authStore';
import { useDateFilterStore } from '../../store/dateFilterStore';

// ── Regular grouped menu structure ─────────────────────────────────────────
const menuGroups = [
    {
        label: 'Overview',
        icon: LayoutDashboard,
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: 'dashboard.view' },
        ],
    },
    {
        label: 'Catalog',
        icon: FolderTree,
        items: [
            { label: 'Products', icon: Package, path: '/products', permission: 'products.view' },
            { label: 'Categories', icon: FolderTree, path: '/categories', permission: 'products.view' },
            { label: 'Brands', icon: Award, path: '/brands', permission: 'products.view' },
        ],
    },
    {
        label: 'Inventory',
        icon: Warehouse,
        items: [
            { label: 'Warehouses', icon: Warehouse, path: '/warehouses', permission: 'inventory.view' },
            { label: 'Stock', icon: Boxes, path: '/stock', permission: 'inventory.view' },
        ],
    },
    {
        label: 'Customers',
        icon: UserCircle,
        items: [
            { label: 'Customers', icon: UserCircle, path: '/customers', permission: 'customers.view' },
            { label: 'Customer Groups', icon: Tags, path: '/customer-groups', permission: 'customers.view' },
        ],
    },
    {
        label: 'CRM & Global Sales',
        icon: ShoppingCart,
        items: [
            { label: 'Leads/Inquiries', icon: UserPlus, path: '/crm/inquiries', permission: 'customers.view' },
            { label: 'Quotations', icon: FileText, path: '/crm/quotations', permission: 'sales.view' },
            { label: 'Sales Orders', icon: ShoppingCart, path: '/sales-orders', permission: 'sales.view' },
            { label: 'POS', icon: Calculator, path: '/pos', permission: 'pos.access' },
        ],
    },
    {
        label: 'Logistics & Export',
        icon: Ship,
        items: [
            { label: 'Shipment Tracking', icon: Ship, path: '/logistics/shipments', permission: 'inventory.view' },
            { label: 'Warehouse Export', icon: Warehouse, path: '/warehouses', permission: 'inventory.view' },
            { label: 'Gate Passes', icon: ShieldCheck, path: '/logistics/gate-passes', permission: 'inventory.view' },
            { label: 'Gate Security Screen', icon: Navigation, path: '/gate-screen', permission: 'inventory.view' },
        ],
    },
    {
        label: 'Procurement',
        icon: Truck,
        items: [
            { label: 'Suppliers', icon: Truck, path: '/suppliers', permission: 'suppliers.view' },
            { label: 'Purchase Orders', icon: ShoppingBag, path: '/purchase-orders', permission: 'purchasing.view' },
            { label: 'Bills', icon: Receipt, path: '/bills', permission: 'bills.view' },
        ],
    },
    {
        label: 'Finance',
        icon: Wallet,
        items: [
            { label: 'Invoices', icon: FileText, path: '/invoices', permission: 'invoices.view' },
            { label: 'Payments', icon: Wallet, path: '/payments', permission: 'payments.view' },
            { label: 'Cheque Ledger', icon: FileSpreadsheet, path: '/finance/cheques', permission: 'payments.view' },
            { label: 'Bank Accounts', icon: Building2, path: '/finance/bank-accounts', permission: 'payments.view' },
            { label: 'Petty Cash', icon: DollarSign, path: '/finance/petty-cash', permission: 'payments.view' },
            { label: 'Fixed Assets', icon: Tag, path: '/finance/fixed-assets', permission: 'payments.view' },
            { label: 'Credit Notes', icon: FileMinus, path: '/credit-notes', permission: 'credit_notes.view' },
        ],
    },
    {
        label: 'Production',
        icon: Factory,
        items: [
            { label: 'BOMs (Recipes)', icon: Workflow, path: '/boms', permission: 'bom.view' },
            { label: 'Process Templates', icon: ClipboardList, path: '/manufacturing/templates', permission: 'production.view' },
            { label: 'Production Batches', icon: Layers, path: '/manufacturing/batches', permission: 'production.view' },
            { label: 'Production Orders', icon: Factory, path: '/production-orders', permission: 'production.view' },
        ],
    },
    {
        label: 'Fleet & Logistics',
        icon: Navigation,
        items: [
            { label: 'Vehicle Management', icon: Truck, path: '/fleet/vehicles', permission: 'inventory.view' },
            { label: 'Trip Logs', icon: Navigation, path: '/fleet/vehicles', permission: 'inventory.view' },
            { label: 'Maintenance', icon: Wrench, path: '/maintenance/requests', permission: 'admin.settings' },
        ],
    },
    {
        label: 'After-Sales',
        icon: RotateCcw,
        items: [
            { label: 'Returns (RMA)', icon: RotateCcw, path: '/returns', permission: 'returns.view' },
            { label: 'Supplier Returns', icon: RotateCcw, path: '/supplier-returns', permission: 'supplier_returns.view' },
            { label: 'Damages', icon: AlertTriangle, path: '/damages', permission: 'damages.view' },
            { label: 'Repairs', icon: Wrench, path: '/repairs', permission: 'repairs.view' },
        ],
    },
    {
        label: 'POULTRY',
        icon: Bird,
        items: [
            { label: 'Poultry Batches', icon: Layers, path: '/poultry/batches', permission: 'production.view' },
            { label: 'Batch Expenses & Income', icon: DollarSign, path: '/poultry/finances', permission: 'production.view' },
            { label: 'Daily Logs', icon: Bird, path: '/poultry/daily-logs', permission: 'production.view' },
            { label: 'Batch Analytics', icon: Activity, path: '/poultry/batch-analytics', permission: 'production.view' },
        ],
    },
    {
        label: 'PIGGERY',
        icon: Layers,
        items: [
            { label: 'Pig Batches', icon: Layers, path: '/piggery/batches', permission: 'production.view' },
            { label: 'Breeding & Farrowing', icon: Bird, path: '/piggery/breeding', permission: 'production.view' },
            { label: 'Finances', icon: DollarSign, path: '/piggery/finances', permission: 'production.view' },
        ],
    },
    {
        label: 'CHICKEN DISTRIBUTION',
        icon: Boxes,
        items: [
            { label: 'Product Items', icon: Boxes, path: '/distribution/items', permission: 'inventory.view' },
            { label: 'Bills & Invoices', icon: Receipt, path: '/distribution/bills', permission: 'sales.view' },
        ],
    },
    {
        label: 'Administration',
        icon: Settings,
        adminOnly: true,
        items: [
            { label: 'Edit Approvals', icon: ShieldCheck, path: '/edit-approvals', permission: 'admin.users.view' },
            { label: 'Users', icon: Users, path: '/users', permission: 'admin.users.view' },
            { label: 'Roles', icon: ShieldCheck, path: '/roles', permission: 'admin.roles.view' },
            { label: 'Data Import', icon: Upload, path: '/import', permission: 'admin.settings' },
            { label: 'Audit Logs', icon: History, path: '/audit-logs', permission: 'view_audit_logs' },
            { label: 'SMS Dispatch Logs', icon: Mail, path: '/audit-logs/sms', permission: 'view_audit_logs' },
            { label: 'Settings', icon: Settings, path: '/settings', permission: 'admin.settings' },
        ],
    },
    {
        label: 'DATA ENTRY TOOLS',
        icon: ShieldCheck,
        managerOnly: true,
        items: [
            { label: 'Request Edit Access', icon: ShieldCheck, path: '/manager/request-edit' },
        ],
    },
    {
        label: 'HR',
        icon: UsersIcon,
        items: [
            { label: 'Employees', icon: UsersIcon, path: '/employees', permission: 'hr.employees.view' },
            { label: 'Departments', icon: Building2, path: '/departments', permission: 'hr.employees.view' },
            { label: 'Designations', icon: Award, path: '/designations', permission: 'hr.employees.view' },
            { label: 'Shifts', icon: Clock, path: '/shifts', permission: 'hr.employees.view' },
            { label: 'Attendance', icon: CalendarIcon, path: '/attendance', permission: 'hr.attendance.view' },
            { label: 'Employee of Month', icon: Award, path: '/employees/month', permission: 'hr.employees.view' },
            { label: 'Leave Requests', icon: Plane, path: '/leaves', permission: 'hr.leaves.view' },
            { label: 'Holidays', icon: CalendarIcon, path: '/holidays', permission: 'hr.employees.view' },
            { label: 'Salary Structures', icon: Calculator, path: '/salary-structures', permission: 'hr.salary.view' },
            { label: 'Payroll', icon: DollarSign, path: '/payroll', permission: 'hr.payroll.view' },
        ],
    },
    {
        label: 'Reports & AI',
        icon: BarChart3,
        items: [
            { label: 'Reports', icon: BarChart3, path: '/reports', anyPermission: ['reports.sales', 'reports.financial', 'reports.inventory', 'reports.hr', 'reports.production'] },
            { label: 'Future Predictions', icon: Sparkles, path: '/reports/predictions', anyPermission: ['reports.sales', 'reports.financial', 'reports.inventory', 'reports.production'] },
        ],
    },
];

// ── Approvals accordion structure ───────────────────────────────────────────
// Each category has an icon, label, and list of links with permissions.
const approvalCategories = [
    {
        id: 'inbound',
        label: 'Inbound Materials',
        icon: PackageCheck,
        description: 'GRN Quality & Quantity',
        items: [
            { label: 'Purchase Orders', icon: ShoppingBag, path: '/purchase-orders', permission: 'purchasing.view' },
            { label: 'Goods Receipts (GRN)', icon: ClipboardCheck, path: '/bills', permission: 'bills.view' },
            { label: 'Supplier Returns', icon: RotateCcw, path: '/supplier-returns', permission: 'supplier_returns.view' },
        ],
    },
    {
        id: 'production',
        label: 'Production Batches',
        icon: Factory,
        description: 'QC & Lab Release',
        items: [
            { label: 'Production Orders', icon: Factory, path: '/production-orders', permission: 'production.view' },
            { label: 'Production Batches', icon: Layers, path: '/manufacturing/batches', permission: 'production.view' },
            { label: 'BOMs (Recipes)', icon: Workflow, path: '/boms', permission: 'bom.view' },
        ],
    },
    {
        id: 'expenses',
        label: 'Expense & Petty Cash',
        icon: DollarSign,
        description: 'Operational Cash Releases',
        items: [
            { label: 'Petty Cash', icon: DollarSign, path: '/finance/petty-cash', permission: 'payments.view' },
            { label: 'Bills', icon: Receipt, path: '/bills', permission: 'bills.view' },
            { label: 'Payments', icon: Wallet, path: '/payments', permission: 'payments.view' },
        ],
    },
    {
        id: 'sales',
        label: 'Sales & Pricing',
        icon: Tag,
        description: 'Discount Override Approvals',
        items: [
            { label: 'Sales Orders', icon: ShoppingCart, path: '/sales-orders', permission: 'sales.view' },
            { label: 'Quotations', icon: FileText, path: '/crm/quotations', permission: 'sales.view' },
            { label: 'Invoices', icon: FileText, path: '/invoices', permission: 'invoices.view' },
            { label: 'Credit Notes', icon: CreditCard, path: '/credit-notes', permission: 'credit_notes.view' },
        ],
    },
    {
        id: 'returns',
        label: 'Returns & After-Sales',
        icon: RotateCcw,
        description: 'RMA & Damage Review',
        items: [
            { label: 'Customer Returns (RMA)', icon: RotateCcw, path: '/returns', permission: 'returns.view' },
            { label: 'Repairs', icon: Wrench, path: '/repairs', permission: 'repairs.view' },
            { label: 'Damages', icon: AlertTriangle, path: '/damages', permission: 'damages.view' },
        ],
    },
];

// ── Helper: Check if any item in a category is on the active route ──────────
function useIsCategoryActive(items) {
    const location = useLocation();
    return items.some((item) => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/')));
}

// ── Collapsible Menu Group Accordion component ────────────────────────────
function MenuGroupAccordion({ group, hasPermission, hasAnyPermission, isAdmin, searchQuery = '' }) {
    const location = useLocation();

    // Filter items user has permission to see
    const visibleItems = group.items.filter((item) => {
        if (isAdmin) return true;
        if (item.permission) return hasPermission(item.permission);
        if (item.anyPermission) return hasAnyPermission(item.anyPermission);
        return true;
    });

    const isMatch = (text) => text.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const groupMatches = searchQuery ? isMatch(group.label) : false;

    const filteredItems = searchQuery
        ? visibleItems.filter((item) => isMatch(item.label) || groupMatches)
        : visibleItems;

    const isCategoryActive = filteredItems.some(
        (item) => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
    );

    const [isOpen, setIsOpen] = useState(isCategoryActive || searchQuery.trim().length > 0);

    // Auto open category if current path matches an item inside or user is searching
    useEffect(() => {
        if (isCategoryActive || searchQuery.trim().length > 0) {
            setIsOpen(true);
        }
    }, [isCategoryActive, searchQuery]);

    if (filteredItems.length === 0) return null;

    // Overview group -> render directly as a single dashboard link
    if (group.label === 'Overview' && filteredItems.length === 1 && !searchQuery) {
        const item = filteredItems[0];
        const ItemIcon = item.icon;
        return (
            <div className="mb-1">
                <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                            isActive
                                ? 'bg-white text-primary-600 shadow-sm border border-slate-200/90 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800/60'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                        }`
                    }
                >
                    <ItemIcon size={16} className="flex-shrink-0 transition-colors" />
                    <span className="truncate">{item.label}</span>
                </NavLink>
            </div>
        );
    }

    const CategoryIcon = group.icon || LayoutDashboard;

    return (
        <div className="mb-1">
            {/* Main Category Accordion Header */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isCategoryActive
                        ? 'bg-white text-primary-600 shadow-sm border border-slate-200/90 dark:bg-slate-800/90 dark:text-primary-300 dark:border-slate-700'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon size={16} className={`flex-shrink-0 ${isCategoryActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate uppercase text-[11px] tracking-wider font-bold">{group.label}</span>
                </div>
                <div className="flex items-center ml-2">
                    {isOpen ? (
                        <ChevronDown size={14} className="text-slate-400 flex-shrink-0 transition-transform duration-200" />
                    ) : (
                        <ChevronRight size={14} className="text-slate-400 flex-shrink-0 transition-transform duration-200" />
                    )}
                </div>
            </button>

            {/* Sub-items Panel */}
            <div
                style={{
                    maxHeight: isOpen ? `${filteredItems.length * 42 + 10}px` : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                <div className="ml-3.5 pl-3 border-l-2 border-slate-200 dark:border-slate-700 mt-1 mb-1.5 space-y-0.5">
                    {filteredItems.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                            <NavLink
                                key={`${item.label}-${item.path}`}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                        isActive
                                            ? 'bg-primary-600 text-white font-semibold shadow-xs'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`
                                }
                            >
                                <ItemIcon size={14} className="flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Approval accordion sub-category component ────────────────────────────────
function ApprovalCategory({ category, hasPermission, hasAnyPermission, isAdmin }) {
    const visibleItems = category.items.filter((item) => {
        if (isAdmin) return true;
        if (item.permission) return hasPermission(item.permission);
        if (item.anyPermission) return hasAnyPermission(item.anyPermission);
        return true;
    });

    const isActive = useIsCategoryActive(visibleItems);
    const [isOpen, setIsOpen] = useState(isActive);

    // Auto-open if a child is currently active
    useEffect(() => {
        if (isActive) setIsOpen(true);
    }, [isActive]);

    if (visibleItems.length === 0) return null;

    const Icon = category.icon;

    return (
        <div className="mb-0.5">
            {/* Category header button */}
            <button
                onClick={() => hasAnyPermission && setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                        ? 'bg-primary-600 text-white font-medium shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
                <Icon size={15} className="flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                    <p className="truncate leading-tight">{category.label}</p>
                    <p className="text-[10px] opacity-80 truncate leading-tight">{category.description}</p>
                </div>
                {isOpen
                    ? <ChevronDown size={13} className="flex-shrink-0 opacity-80" />
                    : <ChevronRight size={13} className="flex-shrink-0 opacity-80" />
                }
            </button>

            {/* Collapsible items */}
            <div
                style={{
                    maxHeight: isOpen ? `${visibleItems.length * 44}px` : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.22s ease',
                }}
            >
                <div className="ml-3 pl-3 border-l-2 border-primary-200 dark:border-primary-800 mt-0.5 mb-1 space-y-0.5">
                    {visibleItems.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                            <NavLink
                                key={`${item.label}-${item.path}`}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary-600 text-white font-medium shadow-xs'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`
                                }
                            >
                                <ItemIcon size={13} className="flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Main Sidebar component ────────────────────────────────────────────────────
export default function Sidebar({ isOpen, onClose }) {
    const sidebarRef = useRef(null);
    const { hasPermission, hasAnyPermission, isAdmin } = usePermission();
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const { isEnabled, toggleEnabled, selectedMonth, monthLabel, setMonth } = useDateFilterStore();

    // Close on outside click (mobile)
    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e) => {
            if (window.innerWidth < 1024 && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                onClose();
            }
        };
        const timerId = setTimeout(() => {
            document.addEventListener('mousedown', handleOutsideClick);
        }, 100);
        return () => {
            clearTimeout(timerId);
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen, onClose]);

    // Filter regular groups by permission
    const visibleGroups = menuGroups
        .filter((group) => {
            if (!group) return false;
            if (group.adminOnly && !['admin', 'superadmin', 'md'].includes(user?.role)) return false;
            if (group.managerOnly && user?.role !== 'manager') return false;
            return true;
        })
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                if (user?.role === 'manager') {
                    const hiddenPaths = ['/reports', '/finance/cheques', '/finance/bank-accounts', '/finance/petty-cash', '/finance/fixed-assets', '/logistics/gate-passes', '/gate-screen', '/pos', '/poultry/batch-analytics'];
                    if (hiddenPaths.some(p => item.path.startsWith(p))) return false;
                }

                if (isAdmin) return true;
                if (item.permission) return hasPermission(item.permission);
                if (item.anyPermission) return hasAnyPermission(item.anyPermission);
                return true;
            }),
        }))
        .filter((g) => g.items.length > 0);

    return (
        <>
            {/* Backdrop overlay (mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar panel */}
            <aside
                ref={sidebarRef}
                style={{
                    width: isOpen ? '256px' : '0px',
                    minWidth: isOpen ? '256px' : '0px',
                    overflow: 'hidden',
                    transition: 'width 0.25s ease, min-width 0.25s ease',
                    flexShrink: 0,
                }}
                className="h-screen bg-slate-50/95 dark:bg-[#131e3a] border-r border-slate-200/80 dark:border-slate-800 flex flex-col z-40 fixed inset-y-0 left-0 lg:relative lg:block transition-colors"
            >
                <div className="w-64 flex flex-col h-full">

                    {/* ── Logo / Brand ── */}
                    <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-white/40 dark:bg-slate-900/30">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Logo"; }} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-slate-100 leading-none text-[13px] uppercase tracking-wider">New Lanka LF</h2>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight font-medium">Livestock & Animal Produce</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition"
                            aria-label="Close sidebar"
                            title="Close sidebar"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* ── Sidebar Navigation Search & Tools Bar ── */}
                    <div className="px-3 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-white/30 dark:bg-slate-900/20 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 flex items-center">
                                <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search menu..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-medium pl-8 pr-7 py-1.5 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                        title="Clear search"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={toggleEnabled}
                                title={isEnabled ? "Disable Monthly Date Filter" : "Enable Monthly Date Filter"}
                                className={`p-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 border ${
                                    isEnabled
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                <Calendar size={14} />
                            </button>
                        </div>
                    </div>

                    {/* ── Global System Monthly Date Filter Widget (Collapsible - Only when enabled) ── */}
                    {isEnabled && (
                        <div className="px-3 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-primary-50/50 dark:bg-primary-950/30 flex-shrink-0 transition-all">
                            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-800/80 rounded-xl px-2.5 py-1.5 shadow-2xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Calendar size={14} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-primary-600 dark:text-primary-400 leading-none">System Month</span>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">{monthLabel}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <div className="relative cursor-pointer">
                                        <input
                                            type="month"
                                            value={selectedMonth}
                                            onChange={(e) => e.target.value && setMonth(e.target.value)}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                            title="Change System Month"
                                        />
                                        <span className="text-[10px] bg-primary-600 text-white font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 hover:bg-primary-700 transition-colors">
                                            Change
                                        </span>
                                    </div>
                                    <button
                                        onClick={toggleEnabled}
                                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                        title="Turn Off Filter"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Scrollable nav ── */}
                    <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-3 space-y-4">

                        {/* ── Regular menu groups (Collapsible Accordions) ── */}
                        <div className="space-y-1">
                            {visibleGroups.map((group) => (
                                <MenuGroupAccordion
                                    key={group.label}
                                    group={group}
                                    hasPermission={hasPermission}
                                    hasAnyPermission={hasAnyPermission}
                                    isAdmin={isAdmin}
                                    searchQuery={searchQuery}
                                />
                            ))}
                        </div>

                        {/* ── Approvals Section ── */}
                        {user?.role !== 'manager' && (
                            <div>
                                {/* Section heading with badge */}
                                <div className="flex items-center gap-2 px-3 mb-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                                        Approvals
                                    </p>
                                    <div className="flex items-center gap-1 bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-1.5 py-0.5">
                                        <BadgeCheck size={9} />
                                        <span className="text-[9px] font-bold uppercase tracking-wide">Hub</span>
                                    </div>
                                </div>

                                {/* Accordion categories */}
                                <div className="space-y-0.5">
                                    {approvalCategories.map((category) => {
                                        if (
                                            (category.adminOnly && !['admin', 'superadmin', 'md'].includes(user?.role)) ||
                                            (category.managerOnly && user?.role !== 'manager')
                                        ) {
                                            return null;
                                        }
                                        return (
                                            <ApprovalCategory
                                                key={category.id}
                                                category={category}
                                                hasPermission={hasPermission}
                                                hasAnyPermission={hasAnyPermission}
                                                isAdmin={isAdmin}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </nav>

                    {/* ── Footer ── */}
                    <div className="p-3.5 px-4 border-t border-slate-200/80 dark:border-slate-800 flex-shrink-0 bg-white/40 dark:bg-slate-900/30">
                        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
                            <span>v1.0.0 · Enterprise</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-100 dark:ring-emerald-950" title="System Online" />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}