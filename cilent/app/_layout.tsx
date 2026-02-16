import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native';
import { AuthProvider } from '@/context/AuthContext';
import { ContactProvider } from '@/context/ContactContext';
import { useAuth } from '@/context/AuthContext';

import { useColorScheme } from '@/hooks/use-color-scheme';

function NavigationRoot() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  React.useEffect(() => {
    // Wait for both auth loading and navigation state to be ready
    if (loading || !navigationState?.key) {
      return;
    }

    // Public routes that don't require authentication
    const publicRoutes = ['login', 'register'];
    const isPublicRoute = publicRoutes.includes(segments[0] as string);
    
    // Protected routes require authentication
    const isProtectedRoute = !isPublicRoute;

    console.log('Navigation effect:', { 
      isAuthenticated, 
      isProtectedRoute, 
      segments,
      firstSegment: segments[0] 
    });

    // Use setTimeout to avoid navigation during render
    const timeout = setTimeout(() => {
      if (!isAuthenticated && isProtectedRoute) {
        // User is not authenticated but trying to access protected routes
        console.log('Redirecting to login (not authenticated)');
        router.replace('/login');
      } else if (isAuthenticated && isPublicRoute) {
        // User is authenticated but on public routes (login/register)
        console.log('Redirecting to tabs (authenticated)');
        router.replace('/(tabs)');
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, loading, segments, navigationState?.key]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade'
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen 
        name="call/[id]" 
        options={{ 
          presentation: 'fullScreenModal'
        }} 
      />
      <Stack.Screen name="contact/[id]" options={{ title: 'Contact Details', headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView 
      style={{ flex: 1 }} 
      className={colorScheme === 'dark' ? 'dark' : ''}
    >
      <HeroUINativeProvider colorScheme={colorScheme === 'dark' ? 'dark' : 'light'}>
        <AuthProvider>
          <ContactProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <NavigationRoot />
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </ThemeProvider>
          </ContactProvider>
        </AuthProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
