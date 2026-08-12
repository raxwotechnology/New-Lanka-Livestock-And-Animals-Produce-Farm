export default function Card({ children, className = '', ...props }) {
    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}