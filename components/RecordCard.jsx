import React from 'react'
import { View, Text } from 'react-native'

const RecordCard = ({date, category, confidenceLevel, inspectionSections, plantsPerSection, otherStyles}) => {
  return (
    <View className={`w-full p-4 flex-col items-start justify-center gap-1 bg-primary rounded-2xl ${otherStyles}`}>
      <Text className="text-base text-secondary font-plight">{date}</Text>
      <Text className="text-base text-white font-plight">Category: {category}</Text>
      <Text className="text-base text-white font-plight">Confidence Level: {confidenceLevel}</Text>
      <Text className="text-base text-white font-plight">Inspection Sections: {inspectionSections}</Text>
      <Text className="text-base text-white font-plight">Inspected Plants per Section: {plantsPerSection}</Text>
    </View>
  );
}

export default RecordCard;
