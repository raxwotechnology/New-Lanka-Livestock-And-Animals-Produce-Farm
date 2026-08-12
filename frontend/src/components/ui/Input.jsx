import { forwardRef } from 'react';

const Input = forwardRef(({
    label,
    type = 'text',
    error,
    required = false,
    className = '',
    ...props
}, ref) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                ref={ref}
                type={type}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${error
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-200'
                    }`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;