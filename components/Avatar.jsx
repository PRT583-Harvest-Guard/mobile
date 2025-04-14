import React from 'react'
import { Image, View } from 'react-native'
import Icon from '@mdi/react';
import { mdiAccount } from '@mdi/js';

const Avatar = ({ user }) => {
  return (
    <Image
      source={{ uri: user?.avatar }}
      className='w-full h-full rounded-full bg-gray-500'
      resizeMode='cover'
    />
  );
}

export default Avatar;