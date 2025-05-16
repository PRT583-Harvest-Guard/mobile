import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSegments, useRouter } from 'expo-router'
import { radius } from '@/styles/common'
import { palette } from '@/styles/colors'

const Breadcrumb = () => {
  const segments = useSegments()           // e.g. ['(tabs)', 'farm', 'details']
  const router = useRouter()

  // filter layout marks e.g.(tabs)
  const path = segments.filter(s => !s.startsWith('('))

  return (
    <View style={styles.container}>
      {path.map((segment, idx) => {
        const isLast = idx === path.length - 1
        const href = '/' + path.slice(0, idx + 1).join('/')
        return (
          <React.Fragment key={segment}>
            {idx > 0 && <Text style={styles.sep}>›</Text>}
            {isLast ? (
              <Text style={styles.active}>{segment}</Text>
            ) : (
              <TouchableOpacity onPress={() => router.push(href)}>
                <Text style={styles.link}>{segment}</Text>
              </TouchableOpacity>
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  link: { color: palette.primary, fontWeight: '500', fontSize: 14 },
  sep: { color: '#999', marginHorizontal: 4 },
  active: { color: palette.accent, fontWeight: '700', fontSize: 14 },
})

export default Breadcrumb
