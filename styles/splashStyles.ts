import { StyleSheet } from 'react-native';
import { palette } from './colors';

export default StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.primary },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoShadow: {
    shadowColor: palette.shadow, shadowOpacity: 0.25,
    shadowRadius: 6, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tagline: { marginTop: 24, fontSize: 18, color: palette.textLight, fontWeight: '600' },
});
