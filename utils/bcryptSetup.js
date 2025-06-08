/**
 * bcryptSetup.js
 * 
 * This file sets up bcrypt with a secure random fallback using expo-crypto.
 * It addresses the warning: "Using Math.random is not cryptographically secure!"
 */

import bcrypt from 'react-native-bcrypt';
import * as Crypto from 'expo-crypto';

// Set a cryptographically secure random fallback for bcrypt
bcrypt.setRandomFallback((len) => {
  const buf = new Uint8Array(len);
  
  // Generate random bytes using expo-crypto
  const randomBytes = Crypto.getRandomBytes(len);
  
  // Copy the random bytes to our buffer
  for (let i = 0; i < len; i++) {
    buf[i] = randomBytes[i];
  }
  
  return buf;
});

export default bcrypt;
