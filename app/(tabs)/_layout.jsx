import React from 'react'
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#0D4715",
        tabBarInactiveTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#E9762B",
          borderTopWidth: 1,
          borderTopColor: "#BD5511",
          height: 70,
          paddingTop: 10,
          paddingBottom: 5
        }
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View className='items-center justify-center w-48 h-48'>
              <MaterialCommunityIcons name="home-variant" size={focused ? 36 : 24} color={color} />
            </View>
          )
        }}
      />

      <Tabs.Screen
        name='farm'
        options={{
          title: "Farm",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View className='items-center justify-center w-48 h-48'>
              <MaterialCommunityIcons name="tree" size={focused ? 36 : 24} color={color} />
            </View>
          )
        }}
      />

      <Tabs.Screen
        name='history'
        options={{
          title: "History",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View className='items-center justify-center w-48 h-48'>
              <MaterialCommunityIcons name="history" size={focused ? 36 : 24} color={color} />
            </View>
          )
        }}
      />

      <Tabs.Screen
        name='settings'
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View className='items-center justify-center w-48 h-48'>
              <MaterialCommunityIcons name="cog" size={focused ? 36 : 24} color={color} />
            </View>
          )
        }}
      />
    </Tabs>
  );
}

export default TabsLayout;
