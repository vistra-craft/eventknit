#!/usr/bin/env node

/**
 * Script to test the events API endpoint directly
 * Usage: node scripts/test-events-api.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const env = process.env.NODE_ENV || 'production';
const envPath = path.resolve(__dirname, '..', `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testEventsAPI() {
  try {
    console.log('🧪 Testing Events API...\n');
    console.log(`📊 Environment: ${env}`);
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);

    // Test 1: Get all approved public events
    console.log('Test 1: GET /events?status=APPROVED&type=PUBLIC&limit=100');
    const url1 = `${API_BASE_URL}/events?status=APPROVED&type=PUBLIC&limit=100`;
    console.log(`   URL: ${url1}\n`);
    
    const response1 = await fetch(url1);
    const data1 = await response1.json();
    
    console.log(`   Status: ${response1.status}`);
    console.log(`   Success: ${data1.success}`);
    console.log(`   Events Count: ${data1.data?.events?.length || 0}`);
    console.log(`   Total: ${data1.data?.total || 0}`);
    
    if (data1.data?.events && data1.data.events.length > 0) {
      console.log(`\n   First 3 events:`);
      data1.data.events.slice(0, 3).forEach((event, i) => {
        console.log(`     ${i + 1}. ${event.title} (${event.id})`);
        console.log(`        Status: ${event.status}, Type: ${event.type}`);
      });
    } else {
      console.log(`   ⚠️  No events returned!`);
    }

    // Test 2: Get all events (no filters)
    console.log('\n\nTest 2: GET /events (no filters)');
    const url2 = `${API_BASE_URL}/events`;
    console.log(`   URL: ${url2}\n`);
    
    const response2 = await fetch(url2);
    const data2 = await response2.json();
    
    console.log(`   Status: ${response2.status}`);
    console.log(`   Success: ${data2.success}`);
    console.log(`   Events Count: ${data2.data?.events?.length || 0}`);
    console.log(`   Total: ${data2.data?.total || 0}`);

    // Test 3: Check event types
    if (data2.data?.events && data2.data.events.length > 0) {
      console.log(`\n   Event Status/Type breakdown:`);
      const statusTypeCounts = {};
      data2.data.events.forEach(event => {
        const key = `${event.status || 'null'}/${event.type || 'null'}`;
        statusTypeCounts[key] = (statusTypeCounts[key] || 0) + 1;
      });
      Object.entries(statusTypeCounts).forEach(([key, count]) => {
        console.log(`     ${key}: ${count}`);
      });
    }

    console.log('\n\n✅ API Test Complete!');
    
    if (data1.data?.events?.length === 0 && data2.data?.events?.length > 0) {
      console.log('\n⚠️  ISSUE FOUND:');
      console.log('   Events exist but are not returned with APPROVED + PUBLIC filters!');
      console.log('   This suggests a filtering issue in the backend.');
    } else if (data1.data?.events?.length > 0) {
      console.log('\n✅ Events are being returned correctly!');
      console.log('   If they\'re not showing on the frontend, check:');
      console.log('   1. Browser console for errors');
      console.log('   2. Network tab for API calls');
      console.log('   3. Data transformation in event-utils.ts');
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Could not connect to API server!');
      console.error('   Make sure the server is running: npm run dev');
    }
    process.exit(1);
  }
}

testEventsAPI().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});




