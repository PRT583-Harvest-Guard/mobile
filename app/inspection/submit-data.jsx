import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Entities } from '@/constants/Entities';
import { ConfidenceLevels } from '@/constants/ConfidenceLevels';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton, DropDownField, FormField, LoadingIndicator, PageHeader } from '@/components';
import { router } from 'expo-router';

const SubmitData = () => {
  const today = new Date();
  const [form, setForm] = useState({
    "category": null,
    "entity": null,
    "confidenceLevel": null,
    "location": null,
    "areaSize": null,
    "plantDensity": null,
    "date": today
  });
  const [categories, setCategories] = useState([]);
  const [targetEntities, setTargetEntities] = useState([]);
  const [confidenceLevels, setConfidenceLevels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const submit = async () => {
    if (!form.category || !form.entity || !form.confidenceLevel || !form.location || !form.areaSize || !form.plantDensity) {
      Alert.alert("Error", "All fields are required!");
      return;
    }
    setIsSubmitting(true);
    try {
      router.push("/inspection/suggestion");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setCategories(Object.keys(Entities));
    setConfidenceLevels(ConfidenceLevels);
  }, []);

  useEffect(() => {
    setForm({ ...form, entity: null });
    setTargetEntities(form.category ? Entities[form.category] || [] : []);
  }, [form.category]);

  useEffect(() => {
    if (form.confidenceLevel) {
      const confidenceItem = confidenceLevels.find(
        item => item['confidence_level'] === form.confidenceLevel
      );
      if (!confidenceItem) return;
      if (confidenceItem['farmer_explanation'] === "") return;
      Alert.alert("Note", confidenceItem['farmer_explanation']);
    }
  }, [form.confidenceLevel])

  return (
    <SafeAreaView className='bg-white h-full'>
      <View className='w-full h-full'>
        <LoadingIndicator isLoading={isSubmitting} />
        {/* Header */}
        <PageHeader title="Get An Inspection Suggestion" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className='mt-16 mb-32'
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className='w-full min-h-[85vh] items-center justify-center gap-4 px-4'>
              {/* Field 1: Inspection Category */}
              <DropDownField
                label="Inspection Category"
                data={categories}
                onSelect={(e) => { setForm({ ...form, category: e }) }}
                selectedVal={form.category}
              />
              {/* Field 2: Target Entity */}
              <DropDownField
                label="Target Entity"
                data={targetEntities.map(item => item["common_name"])}
                onSelect={(e) => { setForm({ ...form, entity: e }) }}
                selectedVal={form.entity}
              />
              {/* Field 3: Confidence Level */}
              <DropDownField
                label="Confidence Level"
                data={confidenceLevels.map(item => item["confidence_level"])}
                onSelect={(e) => { setForm({ ...form, confidenceLevel: e }) }}
                selectedVal={form.confidenceLevel}
              />
              <Text className='text-base text-gray-500 font-pregular mt-4'>
                Add the details to submit your property data
              </Text>
              {/* Field 4: Location */}
              <FormField
                title="Your Property Location"
                titleStyles="text-black-100"
                handleTextChange={(e) => setForm({ ...form, location: e })}
                keyboardType='default'
              />
              {/* Field 5: Area Size */}
              <FormField
                title="Area Size (Square Kilo Meters)"
                titleStyles="text-black-100"
                handleTextChange={(e) => setForm({ ...form, areaSize: e ? `${e} km^2` : null })}
                keyboardType='decimal-pad'
              />
              {/* Field 6: Density of Plants */}
              <FormField
                title="Density of Plants (per Square Kilo Meters)"
                titleStyles="text-black-100"
                handleTextChange={(e) => setForm({ ...form, plantDensity: e ? `${e} / km^2` : null })}
                keyboardType='decimal-pad'
              />
              {/* Field 7: Date */}
              <FormField
                title="Date"
                titleStyles="text-black-100"
                value={today.toDateString()}
                editable={false}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      {/* Submit Button */}
      <CustomButton
        title="Submit"
        handlePress={submit}
        containerStyles="absolute bottom-6 left-0 right-0 m-4"
        theme="secondary"
      />
    </SafeAreaView>
  );
}

export default SubmitData;