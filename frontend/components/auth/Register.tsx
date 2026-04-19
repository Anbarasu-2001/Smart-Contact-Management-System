"use client";

import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import Link from "next/link";

import { AlertContext } from "../../context/alert/AlertContext";
import { AuthContext } from "../../context/auth/AuthContext";

const Register = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const router = useRouter();

  const { register, error, clearErrors, isAuthenticated } = authContext || {};
  const { setAlert } = alertContext || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { name, phone, email, password, confirmPassword } = user;

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }

    if (error && setAlert && clearErrors) {
      setAlert(error, "danger");
      clearErrors();
    }
    // eslint-disable-next-line
    }, [error, isAuthenticated, router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setUser({ ...user, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name === "" || phone === "" || email === "" || password === "") {
      if (setAlert) setAlert("Please enter all fields", "danger");
      setIsSubmitting(false);
    } else if (password.length < 6) {
      if (setAlert)
        setAlert("Password must be at least 6 characters", "danger");
      setIsSubmitting(false);
    } else if (password !== confirmPassword) {
      if (setAlert) setAlert("Passwords do not match", "danger");
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
    <div className="flex-1 w-full min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#c1f7f5] via-[#e0d6fb] to-[#ffd6ec]">
      <div className="relative w-full max-w-md p-10 rounded-[2rem] border border-[#d6c8f7] shadow-[0_0_24px_4px_rgba(208,180,255,0.10)] bg-white/60 backdrop-blur-xl group">
        {/* Mild Pastel Glow Orbs */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#c1f7f5]/30 blur-3xl rounded-full z-0 pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#ffd6ec]/30 blur-3xl rounded-full z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#c1f7f5] to-[#ffd6ec] shadow-md">
            <svg fill="none" height="36" viewBox="0 0 64 64" width="36">
              <circle
                cx="32"
                cy="32"
                fill="#18122B"
                r="26"
                stroke="#2fffa3"
                strokeWidth="2.5"
              />
              <g stroke="#2fffa3" strokeLinecap="round" strokeWidth="2.2">
                <path d="M32 10c8 0 14 6 14 14" />
                <path d="M32 54c-8 0-14-6-14-14" />
                <path d="M54 32c0 8-6 14-14 14" />
                <path d="M10 32c0-8 6-14 14-14" />
                <path d="M45 19c4 4 4 10 0 14" />
                <path d="M19 45c-4-4-4-10 0-14" />
                <path d="M45 45c-4 4-10 4-14 0" />
                <path d="M19 19c4-4 10-4 14 0" />
              </g>
              <g fill="#2fffa3">
                <circle cx="32" cy="10" r="2" />
                <circle cx="32" cy="54" r="2" />
                <circle cx="54" cy="32" r="2" />
                <circle cx="10" cy="32" r="2" />
                <circle cx="45" cy="19" r="1.5" />
                <circle cx="19" cy="45" r="1.5" />
                <circle cx="45" cy="45" r="1.5" />
                <circle cx="19" cy="19" r="1.5" />
              </g>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-[#7e5cff] tracking-tight text-center drop-shadow-[0_0_6px_#e0d6fb]">
            Create Account
          </h1>
          <p className="text-base font-medium text-[#7e5cff]/70 text-center">
            Join SmartContact today
          </p>

          <form className="w-full flex flex-col gap-6" onSubmit={onSubmit}>
            <Input
              required
              classNames={{
                inputWrapper:
                  "bg-white/90 border border-[#c1f7f5] focus-within:border-[#d6c8f7] shadow-[0_0_4px_#c1f7f5]",
              }}
              label="Full Name"
              name="name"
              placeholder="Enter your name"
              size="lg"
              startContent={<i className="fas fa-user text-[#7e5cff]" />}
              type="text"
              value={name}
              variant="faded"
              onChange={onChange}
            />
            <Input
              required
              classNames={{
                inputWrapper:
                  "bg-white/90 border border-[#c1f7f5] focus-within:border-[#d6c8f7] shadow-[0_0_4px_#c1f7f5]",
              }}
              label="Phone Number"
              name="phone"
              placeholder="+91XXXXXXXXXX"
              size="lg"
              startContent={<i className="fas fa-phone text-[#7e5cff]" />}
              type="tel"
              value={phone}
              variant="faded"
              onChange={onChange}
            />
            <Input
              required
              classNames={{
                inputWrapper:
                  "bg-white/90 border border-[#c1f7f5] focus-within:border-[#d6c8f7] shadow-[0_0_4px_#c1f7f5]",
              }}
              label="Email Address"
              name="email"
              placeholder="Enter your email"
              size="lg"
              startContent={<i className="fas fa-envelope text-[#7e5cff]" />}
              type="email"
              value={email}
              variant="faded"
              onChange={onChange}
            />
            <Input
              required
              classNames={{
                inputWrapper:
                  "bg-white/90 border border-[#ffd6ec] focus-within:border-[#d6c8f7] shadow-[0_0_4px_#ffd6ec]",
              }}
              label="Password"
              minLength={6}
              name="password"
              placeholder="Min 6 characters"
              size="lg"
              startContent={<i className="fas fa-lock text-[#ff72c0]" />}
              type="password"
              value={password}
              variant="faded"
              onChange={onChange}
            />
            <Input
              required
              classNames={{
                inputWrapper:
                  "bg-white/90 border border-[#ffd6ec] focus-within:border-[#d6c8f7] shadow-[0_0_4px_#ffd6ec]",
              }}
              label="Confirm Password"
              minLength={6}
              name="confirmPassword"
              placeholder="Re-enter your password"
              size="lg"
              startContent={
                <i className="fas fa-check-double text-[#ff72c0]" />
              }
              type="password"
              value={confirmPassword}
              variant="faded"
              onChange={onChange}
            />

            <Button
              className="w-full font-bold bg-gradient-to-r from-[#c1f7f5] to-[#d6c8f7] text-[#7e5cff] shadow-md hover:from-[#d6c8f7] hover:to-[#c1f7f5] transition-all"
              isLoading={isSubmitting}
              size="lg"
              type="submit"
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </form>

          <div className="text-sm font-medium text-[#7e5cff]/70">
            Already have an account?{" "}
            <Link
              className="text-[#ff72c0] font-bold hover:opacity-80 transition-colors"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
