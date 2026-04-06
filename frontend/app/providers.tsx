"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import axios from "axios";
import { HeroUIProvider } from "@heroui/system";

// Set global axios defaults immediately
if (typeof window !== 'undefined') {
  axios.defaults.baseURL = '/api';
}

import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthStateProvider } from "../context/auth/AuthContext";
import { ContactStateProvider } from "../context/contact/ContactContext";
import { AlertStateProvider } from "../context/alert/AlertContext";
import GlobalSocketListener from "../components/layout/GlobalSocketListener";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <AuthStateProvider>
          <ContactStateProvider>
            <AlertStateProvider>
              <GlobalSocketListener />
              {children}
            </AlertStateProvider>
          </ContactStateProvider>
        </AuthStateProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
