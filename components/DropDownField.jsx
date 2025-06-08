import React from 'react'
import { View, Text, } from 'react-native'
import SelectDropDown from 'react-native-select-dropdown'
import Entypo from '@expo/vector-icons/Entypo';

const DropDownField = ({ label, data, onSelect, selectedVal, disabled = false }) => {
  return (
    <View className='w-full flex-col items-start justify-center'>
      <Text className='text-black-100 text-base font-psemibold mb-2'>
        {label}
      </Text>
      <SelectDropDown
        key={selectedVal || selectedVal === 0 ? selectedVal : 'empty'}
        data={data || []}
        onSelect={onSelect}
        disabled={disabled}
        defaultButtonText="Select..."
        defaultValue={selectedVal}
        renderButton={(selectedItem, isOpened) => (
          <View className='w-full h-16 px-4 bg-white rounded-2xl border-2 border-secondary items-center justify-center relative'>
            {selectedItem !== undefined && selectedItem !== null && (
              <Text className='w-full text-center text-base text-black-200 font-pregular'>
                {selectedItem}
              </Text>
            )}
            <View className='absolute h-full right-4 top-[30%]'>
              {isOpened
                ? <Entypo name="chevron-up" size={24} color="black" />
                : <Entypo name="chevron-down" size={24} color="black" />
              }
            </View>
          </View>
        )}
        renderItem={(item) => (
          <View className={`w-full p-2 ${selectedVal === item ? 'bg-secondary' : ''}`}>
            <Text className={`w-full text-base font-plight ${selectedVal === item ? 'text-white' : 'text-black-200'}`}>
              {item}
            </Text>
          </View>
        )}
      />
    </View>
  )
}

export default DropDownField;
