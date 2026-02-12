'use client';

import React, { useContext } from 'react';
import {
    Navbar as HeroNavbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
} from '@heroui/navbar';
import { Link } from '@heroui/link';
import { Button } from '@heroui/button';
import NextLink from 'next/link';
import { AuthContext } from '../../context/auth/AuthContext';
import { ContactContext } from '../../context/contact/ContactContext';
import { ThemeSwitch } from '../theme-switch';

export const Navbar = () => {
    const authContext = useContext(AuthContext);
    const contactContext = useContext(ContactContext);

    const { isAuthenticated, logout, user } = authContext || {}; // Handle potential undefined context
    const { clearCurrent } = contactContext || {};

    const onLogout = () => {
        if (logout) logout();
        if (clearCurrent) clearCurrent();
    };

    const authLinks = (
        <>
            <NavbarItem>
                <span className="text-sm">Hello {user && user.name}</span>
            </NavbarItem>
            <NavbarItem>
                <Button as={NextLink} color="danger" href="#" variant="flat" onPress={onLogout}>
                    Logout
                </Button>
            </NavbarItem>
        </>
    );

    const guestLinks = (
        <>
            <NavbarItem>
                <Button as={NextLink} color="primary" href="/login" variant="flat">
                    Login
                </Button>
            </NavbarItem>
            <NavbarItem>
                <Button as={NextLink} color="secondary" href="/register" variant="solid">
                    Register
                </Button>
            </NavbarItem>
        </>
    );

    return (
        <HeroNavbar maxWidth="xl" position="sticky">
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    <NextLink className="flex justify-start items-center gap-1" href="/">
                        <p className="font-bold text-inherit">Smart Contact Manager</p>
                    </NextLink>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
                <NavbarItem className="hidden sm:flex gap-2">
                    <ThemeSwitch />
                </NavbarItem>
                {isAuthenticated ? authLinks : guestLinks}
            </NavbarContent>

            <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
                <ThemeSwitch />
                <NavbarMenuToggle />
            </NavbarContent>

            <NavbarMenu>
                {isAuthenticated ? (
                    <NavbarMenuItem>
                        <Link color="danger" href="#" onPress={onLogout} size="lg">
                            Logout
                        </Link>
                    </NavbarMenuItem>
                ) : (
                    <>
                        <NavbarMenuItem>
                            <Link color="foreground" href="/login" size="lg">Login</Link>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <Link color="foreground" href="/register" size="lg">Register</Link>
                        </NavbarMenuItem>
                    </>
                )}
            </NavbarMenu>
        </HeroNavbar>
    );
};
