import { create } from 'zustand';

function getMonthDetails(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;
    const lastDay = new Date(year, dateObj.getMonth() + 1, 0).getDate();
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    const monthLabel = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    return { monthStr, year, month, startDate, endDate, monthLabel };
}

const initial = getMonthDetails();

export const useDateFilterStore = create((set) => ({
    isEnabled: false, // Default to OFF, enabled on demand by user
    filterType: 'month', // 'month' | 'custom' | 'all'
    selectedMonth: initial.monthStr, // e.g. '2026-08'
    monthLabel: initial.monthLabel, // e.g. 'August 2026'
    startDate: initial.startDate,
    endDate: initial.endDate,

    toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),
    setIsEnabled: (val) => set({ isEnabled: val }),

    setMonth: (monthStr) => {
        if (!monthStr) return;
        const [y, m] = monthStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, 1);
        const details = getMonthDetails(dateObj);
        set({
            filterType: 'month',
            selectedMonth: details.monthStr,
            monthLabel: details.monthLabel,
            startDate: details.startDate,
            endDate: details.endDate,
        });
    },

    setCustomRange: (startDate, endDate) => {
        set({
            filterType: 'custom',
            startDate,
            endDate,
            monthLabel: `${startDate} to ${endDate}`,
        });
    },

    resetToCurrentMonth: () => {
        const details = getMonthDetails();
        set({
            filterType: 'month',
            selectedMonth: details.monthStr,
            monthLabel: details.monthLabel,
            startDate: details.startDate,
            endDate: details.endDate,
        });
    },
}));
