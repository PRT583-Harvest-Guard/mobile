import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, ActivityIndicator, StyleSheet, RefreshControl, ScrollView } from 'react-native'
import Header from '@/components/ui/Header'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { palette } from '@/styles/colors'

interface Props {
  title: string
  children: React.ReactNode
  loading?: boolean
  onRefresh?: () => void
  headerShown?: boolean
  breadcrumbShown?: boolean
}

const Screen: React.FC<Props> = ({
  title,
  children,
  loading = false,
  onRefresh,
  headerShown = true,
  breadcrumbShown = true,
}) => {
  const Wrapper = onRefresh ? ScrollView : View
  const wrapperProps = onRefresh
    ? {
      contentContainerStyle: styles.content,
      refreshControl: (
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={palette.accent}
        />
      ),
    }
    : { style: styles.content }

  return (
    <SafeAreaView style={styles.root}>
      {headerShown && <Header title={title} />}
      {breadcrumbShown && <Breadcrumb />}
      <Wrapper {...wrapperProps}>
        {loading && !onRefresh ? (
          <ActivityIndicator size="large" color={palette.accent} style={styles.loader} />
        ) : (
          children
        )}
      </Wrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.gray100 },
  content: { flexGrow: 1, padding: 16 },
  loader: { marginTop: 40 },
})

export default Screen
