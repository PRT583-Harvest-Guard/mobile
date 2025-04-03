import React from 'react'
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native'
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';

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
              <Entypo name="home" size={focused ? 36 : 24} color={color} />
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
              <FontAwesome name="history" size={focused ? 36 : 24} color={color} />
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
              <Ionicons name="settings-sharp" size={focused ? 36 : 24} color={color} />
            </View>
          )
        }}
      />
    </Tabs>
  );
}

export default TabsLayout;
