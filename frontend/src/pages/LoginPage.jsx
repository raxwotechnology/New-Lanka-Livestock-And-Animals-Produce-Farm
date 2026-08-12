import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';

import { authApi } from '../features/auth/authApi';
import { loginSchema } from '../features/auth/authSchemas';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import Button from '../components/ui/Button';
import logoImg from '../assets/logo.jpg';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const isDarkMode = theme === 'dark';
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (response) => {
            const { token, ...user } = response.data;
            login(user, token);
            toast.success(`Welcome back, ${user.firstName}!`);
            navigate('/dashboard');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
        },
    });

    // Already logged in? Go to dashboard
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const onSubmit = (data) => {
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b1329] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 relative transition-colors duration-200">
            {/* Top Right Theme Toggle Button */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#131e3a] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 text-xs font-semibold cursor-pointer"
                    aria-label="Toggle theme"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDarkMode ? (
                        <>
                            <Sun size={18} className="text-amber-400" />
                            <span>Light Mode</span>
                        </>
                    ) : (
                        <>
                            <Moon size={18} className="text-slate-600" />
                            <span>Dark Mode</span>
                        </>
                    )}
                </button>
            </div>

            <div className="w-full max-w-md my-auto">
                {/* Logo/Brand */}
                <div className="text-center mb-8 flex flex-col items-center justify-center">
                    <img 
                        src={logoImg} 
                        alt="New Lanka Livestock And Animals Produce Farm Logo" 
                        className="h-28 w-auto mb-4 rounded-2xl shadow-md object-contain bg-white p-2 border border-slate-200/80 dark:border-slate-800" 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/logo.jpg';
                        }}
                    />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white px-2 tracking-tight leading-snug">
                        New Lanka Livestock And Animals Produce Farm
                    </h1>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-[#131e3a] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-6 sm:p-8 transition-colors duration-200">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Sign in</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Enter your credentials to access your account
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                placeholder="admin@example.com"
                                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0b1329] border ${
                                    errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                                } rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    className={`w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-[#0b1329] border ${
                                        errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                                    } rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            className="py-2.5 font-semibold text-sm rounded-xl"
                            loading={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
                        Forgot your password? Contact your administrator.
                    </p>
                </div>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                    © {new Date().getFullYear()} New Lanka Livestock And Animals Produce Farm. All rights reserved.
                </p>
            </div>
        </div>
    );
}