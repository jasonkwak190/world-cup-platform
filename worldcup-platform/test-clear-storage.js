// Test script to simulate clearing localStorage
const { clearAllStoredData } = require('./src/utils/storage');

console.log('Testing localStorage clear functionality...');

// This simulates what happens when localStorage is cleared
const simulateEmptyLocalStorage = () => {
  // Mock localStorage
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0
  };
  
  console.log('localStorage mocked as empty');
  
  // Test getStoredWorldCups with empty storage
  try {
    const { getStoredWorldCups } = require('./src/utils/storage');
    const result = getStoredWorldCups();
    console.log('getStoredWorldCups with empty storage:', result);
    console.log('Type:', typeof result, 'isArray:', Array.isArray(result));
  } catch (error) {
    console.error('Error testing getStoredWorldCups:', error);
  }
  
  // Test getWorldCupById with empty storage
  try {
    const { getWorldCupById } = require('./src/utils/storage');
    const result = getWorldCupById('test-id');
    console.log('getWorldCupById with empty storage:', result);
  } catch (error) {
    console.error('Error testing getWorldCupById:', error);
  }
};

simulateEmptyLocalStorage();
console.log('Test completed successfully!');