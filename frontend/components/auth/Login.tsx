'use client';

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
import { AlertContext } from '../../context/alert/AlertContext';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import Link from 'next/link';

const Login = () => {
    const authContext = useContext(AuthContext);
    const alertContext = useContext(AlertContext);
    const router = useRouter();

    const { login, error, clearErrors, isAuthenticated } = authContext || {};
    const { setAlert } = alertContext || {};

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState({
        email: '',
        password: '',
    });

    const { email, password } = user;
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }

        if (error && setAlert && clearErrors) {
            setAlert(error, 'danger');
            clearErrors();
        }
        // eslint-disable-next-line
    }, [error, isAuthenticated, router]);


    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setUser({ ...user, [e.target.name]: e.target.value });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email === '' || password === '') {
            if (setAlert) setAlert('Please fill in all fields', 'danger');
            setIsSubmitting(false);
        } else {
            setIsSubmitting(true);
            if (login) {
                const success = await login({
                    email,
                    password,
                });
                if (!success) {
                    setIsSubmitting(false);
                }
            }
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center pt-10 pb-20">
            <div className="relative w-full max-w-md p-8 sm:p-10 rounded-[2rem] glass border border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-cyan-500/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl animate-fade-in group">
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-blue-400/20 dark:bg-blue-600/20 blur-3xl rounded-full z-0 pointer-events-none group-hover:bg-blue-400/30 transition-colors duration-500" />
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-cyan-400/20 dark:bg-cyan-600/20 blur-3xl rounded-full z-0 pointer-events-none group-hover:bg-cyan-400/30 transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 mb-6">
                        <i className="fas fa-layer-group text-2xl" />
                    </div>
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-2 tracking-tight text-center">Welcome Back</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center">Sign in to your SmartContact account</p>
                    
                    <form onSubmit={onSubmit} className="w-full space-y-5">
                        <Input
                            label="Email Address"
                            placeholder="Enter your email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={onChange}
                            required
                            variant="faded"
                            size="lg"
                            classNames={{
                                inputWrapper: "bg-slate-50 dark:bg-slate-900/50 shadow-sm",
                            }}
                            startContent={<i className="fas fa-envelope text-slate-400 mr-2" />}
                        />
                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={onChange}
                            required
                            variant="faded"
                            size="lg"
                            classNames={{
                                inputWrapper: "bg-slate-50 dark:bg-slate-900/50 shadow-sm",
                            }}
                            startContent={<i className="fas fa-lock text-slate-400 mr-2" />}
                        />
                        
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            size="lg"
                            className="w-full font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5 transition-all mt-4"
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors">
                            Create one now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
