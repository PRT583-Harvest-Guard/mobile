/**
 * Toast Utility Functions
 * 
 * This file contains utility functions for displaying toast messages
 * using react-native-toast-message.
 */

import Toast from 'react-native-toast-message';

/**
 * Show a success toast message
 * @param {string} message - The message to display
 * @param {string} [title='Success'] - The title of the toast
 * @param {Object} [options={}] - Additional options for the toast
 */
export const showSuccessToast = (message, title = 'Success', options = {}) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
    props: {
      heightScale: 1.2, // 20% bigger
    },
    ...options,
  });
};

/**
 * Show an error toast message
 * @param {string} message - The message to display
 * @param {string} [title='Error'] - The title of the toast
 * @param {Object} [options={}] - Additional options for the toast
 */
export const showErrorToast = (message, title = 'Error', options = {}) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
    autoHide: true,
    ...options,
  });
};

/**
 * Show an info toast message
 * @param {string} message - The message to display
 * @param {string} [title='Info'] - The title of the toast
 * @param {Object} [options={}] - Additional options for the toast
 */
export const showInfoToast = (message, title = 'Info', options = {}) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 3000,
    autoHide: true,
    ...options,
  });
};

/**
 * Show a warning toast message
 * @param {string} message - The message to display
 * @param {string} [title='Warning'] - The title of the toast
 * @param {Object} [options={}] - Additional options for the toast
 */
export const showWarningToast = (message, title = 'Warning', options = {}) => {
  Toast.show({
    type: 'warning',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 3500,
    autoHide: true,
    ...options,
  });
};

/**
 * Show a confirmation toast message with an action button
 * @param {string} message - The message to display
 * @param {string} [title='Confirm'] - The title of the toast
 * @param {Function} [onPress=null] - The function to call when the action button is pressed
 * @param {string} [actionText='OK'] - The text to display on the action button
 * @param {Object} [options={}] - Additional options for the toast
 */
export const showConfirmToast = (
  message, 
  title = 'Confirm', 
  onPress = null, 
  actionText = 'OK', 
  options = {}
) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 5000,
    autoHide: true,
    onPress: onPress,
    props: {
      actionText,
    },
    ...options,
  });
};

/**
 * Hide all currently displayed toasts
 */
export const hideAllToasts = () => {
  Toast.hide();
};
