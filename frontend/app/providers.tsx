"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthStateProvider } from "../context/auth/AuthContext";
import { ContactStateProvider } from "../context/contact/ContactContext";
import { AlertStateProvider } from "../context/alert/AlertContext";

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
              {children}
            </AlertStateProvider>
          </ContactStateProvider>
        </AuthStateProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
