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
        email: '',
        password: '',
        confirmPassword: '',
    });

    const { name, email, password, confirmPassword } = user;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isAuthenticated) {
            router.push('/');
        }

        if (error && setAlert && clearErrors) {
            setAlert(error, 'danger');
            clearErrors();
        }
        // eslint-disable-next-line
    }, [error, isAuthenticated, router]);

    if (!mounted) return null;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setUser({ ...user, [e.target.name]: e.target.value });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name === '' || email === '' || password === '') {
            if (setAlert) setAlert('Please enter all fields', 'danger');
            setIsSubmitting(false);
        } else if (password !== confirmPassword) {
            if (setAlert) setAlert('Passwords do not match', 'danger');
            setIsSubmitting(false);
        } else {
            setIsSubmitting(true);
            if (register) {
                const success = await register({
                    name,
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
        <div className="flex justify-center items-center mt-10">
            <Card className="w-full max-w-md p-4">
                <CardHeader className="flex justify-center pb-0">
                    <h1 className="text-2xl font-bold">
                        Account <span className="text-primary">Register</span>
                    </h1>
                </CardHeader>
                <CardBody>
                    <form onSubmit={onSubmit} className="flex flex-col gap-4">
                        <Input
                            label="Name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={onChange}
                            required
                            variant="bordered"
                        />
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            value={email}
                            onChange={onChange}
                            required
                            variant="bordered"
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={onChange}
                            required
                            minLength={6}
                            variant="bordered"
                        />
                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={onChange}
                            required
                            minLength={6}
                            variant="bordered"
                        />
                        <Button
                            color="primary"
                            type="submit"
                            isLoading={isSubmitting}
                            className="w-full font-bold text-lg"
                        >
                            {isSubmitting ? 'Registering...' : 'Register'}
                        </Button>
                    </form>
                </CardBody>
                <CardFooter className="justify-center">
                    <p className="text-sm">Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link></p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
