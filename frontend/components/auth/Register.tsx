'use client';

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
import { AlertContext } from '../../context/alert/AlertContext';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import Link from 'next/link';

const Register = () => {
    const authContext = useContext(AuthContext);
    const alertContext = useContext(AlertContext);
    const router = useRouter();

    const { register, error, clearErrors, isAuthenticated } = authContext || {};
    const { setAlert } = alertContext || {};

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const { name, phone, email, password, confirmPassword } = user;
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
        if (name === '' || phone === '' || email === '' || password === '') {
            if (setAlert) setAlert('Please enter all fields', 'danger');
            setIsSubmitting(false);
        } else if (password.length < 6) {
            if (setAlert) setAlert('Password must be at least 6 characters', 'danger');
            setIsSubmitting(false);
        } else if (password !== confirmPassword) {
            if (setAlert) setAlert('Passwords do not match', 'danger');
            setIsSubmitting(false);
        } else {
            setIsSubmitting(true);
            if (register) {
                const success = await register({
                    name,
                    phone,
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
        <div className="w-full h-full flex items-center justify-center pt-8 pb-16">
            <div className="relative w-full max-w-md p-8 sm:p-10 rounded-[2rem] glass border border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-violet-500/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl animate-fade-in group">
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-violet-400/20 dark:bg-violet-600/20 blur-3xl rounded-full z-0 pointer-events-none group-hover:bg-violet-400/30 transition-colors duration-500" />
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-indigo-400/20 dark:bg-indigo-600/20 blur-3xl rounded-full z-0 pointer-events-none group-hover:bg-indigo-400/30 transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-violet-500/20 mb-6">
                        <i className="fas fa-user-plus text-2xl" />
                    </div>
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-2 tracking-tight text-center">Create Account</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center">Join SmartContact today</p>
                    
                    <form onSubmit={onSubmit} className="w-full space-y-4">
                        <Input
                            label="Full Name"
                            placeholder="Enter your name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={onChange}
                            required
                            variant="faded"
                            size="md"
                            classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-900/50 shadow-sm" }}
                            startContent={<i className="fas fa-user text-slate-400 mr-2" />}
                        />
                        <Input
                            label="Phone Number"
                            placeholder="+91XXXXXXXXXX"
                            name="phone"
                            type="tel"
                            value={phone}
                            onChange={onChange}
                            required
                            variant="faded"
                            size="md"
                            classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-900/50 shadow-sm" }}
                            startContent={<i className="fas fa-phone text-slate-400 mr-2" />}
                        />
                        <Input
                            label="Email Address"
                            placeholder="Enter your email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={onChange}
                            required
                            variant="faded"
                            size="md"
                            classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-900/50 shadow-sm" }}
                            startContent={<i className="fas fa-envelope text-slate-400 mr-2" />}
                        />
                        <Input
                            label="Password"
                            placeholder="Min 6 characters"
                            name="password"
                            type="password"
                            value={password}
                            onChange={onChange}
                            required
                            minLength={6}
                            variant="faded"
                            size="md"
                            classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-900/50 shadow-sm" }}
                            startContent={<i className="fas fa-lock text-slate-400 mr-2" />}
                        />
                        <Input
                            label="Confirm Password"
                            placeholder="Re-enter your password"
                            name="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={onChange}
                            required
                            minLength={6}
                            variant="faded"
                            size="md"
                            classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-900/50 shadow-sm" }}
                            startContent={<i className="fas fa-check-double text-slate-400 mr-2" />}
                        />
                        
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            size="lg"
                            className="w-full font-semibold bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all mt-4"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
