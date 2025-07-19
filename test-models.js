#!/usr/bin/env node


const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting FoodSewa Model Tests...');
console.log('📋 Make sure MongoDB is running on localhost:27017');
console.log('');

try {
  // Check if Jest is installed
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ Jest is not installed. Installing Jest and dependencies...');
    execSync('npm install --save-dev jest @babel/core @babel/preset-env babel-jest', { stdio: 'inherit' });
    console.log('✅ Jest installed successfully!');
  }

  // Run the tests
  console.log('🧪 Running model tests...');
  console.log('');
  
  execSync('npx jest __tests__/models/ --verbose', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('');
  console.log('🎉 All tests completed!');
  console.log('📊 Check the coverage report in the coverage/ directory');
  
} catch (error) {
  console.error('❌ Test execution failed:');
  console.error(error.message);
  process.exit(1);
}