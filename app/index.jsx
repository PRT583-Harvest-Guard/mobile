// app/index.jsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

import AppSplash from '@/components/layouts/AppSplash';
import { palette } from '@/styles/colors';
import logo from '@/assets/images/icon.png';
import initStuff from '@/services/initStuff';

export default function Splash() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const delay = (ms) => new Promise(res => setTimeout(res, ms));
      await delay(2000);
      const isLogged = await initStuff();
      setLoggedIn(isLogged);
      setReady(true);

    })();
  }, []);


  // not ready → show Splash
  if (!ready) {
    return (
      <AppSplash logoSrc={logo} tagline="Powered by CDU">
        <ActivityIndicator
          size="large"
          color={palette.textLight}
          style={{ marginTop: 32 }}
        />
      </AppSplash>
    );
  }

  // main page
  return <Redirect href={loggedIn ? '/(tabs)/home' : '/(auth)/sign-in'} />;
}
