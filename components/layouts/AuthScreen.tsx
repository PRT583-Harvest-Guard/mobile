import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { palette } from '@/styles/colors';

interface Props {
  children: React.ReactNode;
}

const AuthScreen: React.FC<Props> = ({ children }) => (
  <SafeAreaView style={styles.root}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.primary },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});

export default AuthScreen;
