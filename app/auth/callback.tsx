import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        // Get the URL that opened the app
        const url = await Linking.getInitialURL();
        
        if (url) {
          // If the URL contains an access token, process it
          if (url.includes('access_token')) {
            const { data, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (data?.session) {
              // Navigate to home on successful authentication
              router.replace('/(tabs)/home');
              return;
            }
          }
        }
        
        // If we get here, something went wrong
        router.replace('/(auth)/login');
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        router.replace('/(auth)/login');
      }
    };

    handleAuthRedirect();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
