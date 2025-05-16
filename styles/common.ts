import { StyleSheet, Platform } from 'react-native'
import { palette } from './colors'

export const shadow = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
})

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
}

export const safeGap = Platform.OS === 'ios' ? 16 : 12
