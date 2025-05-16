import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Image, Text, StatusBar, StyleSheet } from 'react-native';
import styles from '@/styles/splashStyles';

interface Props {
  logoSrc: any;          // require('…')
  tagline?: string;
  children?: React.ReactNode;  // If needed ActivityIndicator
}

const AppSplash: React.FC<Props> = ({ logoSrc, tagline, children }) => (
  <SafeAreaView style={styles.root}>
    <StatusBar barStyle="light-content" backgroundColor="#0E9F6E" />
    <View style={styles.centerBox}>
      <Image source={logoSrc} style={[local.logo, styles.logoShadow]} />
      {tagline && <Text style={styles.tagline}>{tagline}</Text>}
      {children}
    </View>
  </SafeAreaView>
);

const local = StyleSheet.create({ logo: { width: 180, height: 180 } });
export default AppSplash;
