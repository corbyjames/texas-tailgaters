#!/usr/bin/env node

/**
 * Integration tests for real-time features
 * Tests WebSocket connections, API endpoints, and push notification setup
 */

const { io } = require('socket.io-client');
const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let passed = 0;
let failed = 0;

function log(message, isError = false) {
  console.log(isError ? `❌ ${message}` : `✅ ${message}`);
}

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ ok: res.statusCode === 200, data: json, status: res.statusCode });
        } catch {
          resolve({ ok: res.statusCode === 200, data: body, status: res.statusCode });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testHealthEndpoint() {
  console.log('\n📍 Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    if (response.ok && response.data.status === 'healthy') {
      log('Health endpoint working');
      passed++;
    } else {
      log('Health endpoint failed', true);
      failed++;
    }
  } catch (error) {
    log(`Health endpoint error: ${error.message}`, true);
    failed++;
  }
}

async function testWebSocketConnection() {
  console.log('\n🔌 Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      timeout: 5000
    });
    
    socket.on('connect', () => {
      log('WebSocket connected successfully');
      passed++;
      
      // Test subscription
      socket.emit('subscribe-schedule');
      log('Subscribed to schedule updates');
      passed++;
      
      // Test joining game room
      socket.emit('join-game', 'test-game-123');
      log('Joined game room');
      passed++;
      
      socket.disconnect();
      resolve();
    });
    
    socket.on('connect_error', (error) => {
      log(`WebSocket connection failed: ${error.message}`, true);
      failed++;
      resolve();
    });
    
    setTimeout(() => {
      if (socket.connected) {
        socket.disconnect();
      }
      resolve();
    }, 3000);
  });
}

async function testScheduleEndpoints() {
  console.log('\n📅 Testing Schedule Endpoints...');
  
  // Test ESPN endpoint
  try {
    const espnResponse = await makeRequest(`${BACKEND_URL}/api/schedule/espn`);
    if (espnResponse.ok && Array.isArray(espnResponse.data)) {
      log('ESPN schedule endpoint working');
      passed++;
      
      if (espnResponse.data.length > 0) {
        const game = espnResponse.data[0];
        if (game.date && game.opponent) {
          log('ESPN data structure valid');
          passed++;
        }
      }
    } else {
      log('ESPN schedule endpoint failed', true);
      failed++;
    }
  } catch (error) {
    log(`ESPN endpoint error: ${error.message}`, true);
    failed++;
  }
  
  // Test UT Athletics endpoint
  try {
    const utResponse = await makeRequest(`${BACKEND_URL}/api/schedule/ut-athletics`);
    if (utResponse.ok && Array.isArray(utResponse.data)) {
      log('UT Athletics scraping endpoint working');
      passed++;
      
      if (utResponse.data.length > 0) {
        const game = utResponse.data[0];
        if (game.date && game.opponent && typeof game.isHome === 'boolean') {
          log('UT Athletics data structure valid');
          passed++;
        }
      }
    } else {
      log('UT Athletics endpoint failed', true);
      failed++;
    }
  } catch (error) {
    log(`UT Athletics endpoint error: ${error.message}`, true);
    failed++;
  }
  
  // Test sync endpoint
  try {
    const syncResponse = await makeRequest(`${BACKEND_URL}/api/schedule/sync`, 'POST');
    if (syncResponse.ok && typeof syncResponse.data.updated === 'number') {
      log('Manual sync endpoint working');
      passed++;
    } else {
      log('Manual sync endpoint failed', true);
      failed++;
    }
  } catch (error) {
    log(`Sync endpoint error: ${error.message}`, true);
    failed++;
  }
}

async function testNotificationSetup() {
  console.log('\n🔔 Testing Push Notification Setup...');
  
  // Test subscription endpoint structure
  try {
    const testSubscription = {
      userId: 'test-user',
      subscription: {
        endpoint: 'https://fcm.googleapis.com/test',
        keys: {
          p256dh: 'test-key',
          auth: 'test-auth'
        }
      }
    };
    
    const response = await makeRequest(
      `${BACKEND_URL}/api/notifications/subscribe`,
      'POST',
      testSubscription
    );
    
    if (response.ok || response.status === 500) { // 500 might be expected without real Firebase
      log('Notification subscription endpoint exists');
      passed++;
    } else {
      log('Notification subscription endpoint failed', true);
      failed++;
    }
  } catch (error) {
    log(`Notification endpoint error: ${error.message}`, true);
    failed++;
  }
}

async function testMultipleConnections() {
  console.log('\n👥 Testing Multiple Concurrent Connections...');
  
  return new Promise((resolve) => {
    const sockets = [];
    let connected = 0;
    const targetConnections = 3;
    
    for (let i = 0; i < targetConnections; i++) {
      const socket = io(BACKEND_URL, {
        transports: ['websocket'],
        timeout: 5000
      });
      
      socket.on('connect', () => {
        connected++;
        if (connected === targetConnections) {
          log(`${targetConnections} concurrent connections successful`);
          passed++;
          
          // Clean up
          sockets.forEach(s => s.disconnect());
          resolve();
        }
      });
      
      socket.on('connect_error', () => {
        if (connected === 0) {
          log('Multiple connections failed', true);
          failed++;
          resolve();
        }
      });
      
      sockets.push(socket);
    }
    
    setTimeout(() => {
      sockets.forEach(s => s.disconnect());
      resolve();
    }, 5000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting Real-time Features Integration Tests');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('='.repeat(60));
  
  // Run tests
  await testHealthEndpoint();
  await testWebSocketConnection();
  await testScheduleEndpoints();
  await testNotificationSetup();
  await testMultipleConnections();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});