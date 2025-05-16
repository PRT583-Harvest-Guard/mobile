import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { radius, shadow } from '@/styles/common'
import { palette } from '@/styles/colors'

interface Props {
  title: string
  showBackButton?: boolean
  rightSlot?: React.ReactNode
}

const Header: React.FC<Props> = ({ title, showBackButton = true, rightSlot }) => {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {showBackButton && (
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      <Text style={styles.title}>{title}</Text>

      {rightSlot ? (
        <View style={styles.right}>{rightSlot}</View>
      ) : (
        <View style={styles.rightPlaceholder} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    ...shadow.card,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: palette.textLight,
    textAlign: 'center',
  },
  iconBtn: { padding: 4 },
  right: { padding: 4 },
  rightPlaceholder: { width: 24 },
})

export default Header
