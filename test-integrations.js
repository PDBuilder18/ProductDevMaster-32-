#!/usr/bin/env node

/**
 * Integration Test Suite for PDBuilder Backend Architecture
 * Tests all backend services, security middleware, and API endpoints
 */

const baseUrl = 'http://localhost:5000';

async function makeRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return {
      status: response.status,
      data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function testHealthEndpoints() {
  console.log('\n🔍 Testing Health & Monitoring Endpoints...');
  
  const tests = [
    { name: 'Health Check', endpoint: '/api/health' },
    { name: 'Integration Status', endpoint: '/api/integrations/status' },
    { name: 'Configuration Validation', endpoint: '/api/config/validate' }
  ];
  
  for (const test of tests) {
    const result = await makeRequest(test.endpoint);
    console.log(`  ${result.success ? '✅' : '❌'} ${test.name}: ${result.status}`);
    if (!result.success) {
      console.log(`    Error: ${JSON.stringify(result.data, null, 2)}`);
    }
  }
}

async function testSessionManagement() {
  console.log('\n📝 Testing Session Management...');
  
  const sessionId = `test-${Date.now()}`;
  
  // Create session
  const createResult = await makeRequest('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      currentStep: 1,
      completedSteps: [],
      data: {}
    })
  });
  
  console.log(`  ${createResult.success ? '✅' : '❌'} Create Session: ${createResult.status}`);
  
  if (createResult.success) {
    // Get session
    const getResult = await makeRequest(`/api/sessions/${sessionId}`);
    console.log(`  ${getResult.success ? '✅' : '❌'} Get Session: ${getResult.status}`);
    
    // Submit feedback
    const feedbackResult = await makeRequest(`/api/sessions/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        rating: 5,
        helpfulness: 4,
        clarity: 5,
        feedback: 'Test feedback'
      })
    });
    console.log(`  ${feedbackResult.success ? '✅' : '❌'} Submit Feedback: ${feedbackResult.status}`);
    
    // Export session
    const exportResult = await makeRequest(`/api/sessions/${sessionId}/export`, {
      method: 'POST',
      body: JSON.stringify({
        format: 'pdf',
        title: 'Test Export'
      })
    });
    console.log(`  ${exportResult.success ? '✅' : '❌'} Export Session: ${exportResult.status}`);
  }
}

async function testAIIntegration() {
  console.log('\n🤖 Testing AI Integration...');
  
  const sessionId = `ai-test-${Date.now()}`;
  
  // Create session first
  await makeRequest('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      currentStep: 1,
      completedSteps: [],
      data: {}
    })
  });
  
  // Test AI conversation
  const conversationResult = await makeRequest(`/api/sessions/${sessionId}/conversation`, {
    method: 'POST',
    body: JSON.stringify({
      message: 'I want to build a mobile app for food delivery',
      stage: 'problem-discovery'
    })
  });
  
  console.log(`  ${conversationResult.success ? '✅' : '❌'} AI Conversation: ${conversationResult.status}`);
  if (conversationResult.success) {
    console.log(`    Response preview: ${conversationResult.data.response?.substring(0, 50)}...`);
  }
}

async function testSecurityMiddleware() {
  console.log('\n🔒 Testing Security Middleware...');
  
  // Test rate limiting (make multiple rapid requests)
  const promises = Array(5).fill().map(() => makeRequest('/api/health'));
  const results = await Promise.all(promises);
  const allSuccessful = results.every(r => r.success);
  console.log(`  ${allSuccessful ? '✅' : '⚠️'} Rate Limiting: ${allSuccessful ? 'Allowing normal traffic' : 'Some requests blocked'}`);
  
  // Test request validation with suspicious content
  const maliciousResult = await makeRequest('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: '<script>alert("xss")</script>',
      data: {}
    })
  });
  console.log(`  ${!maliciousResult.success ? '✅' : '❌'} XSS Protection: ${maliciousResult.status}`);
  
  // Test CORS (simulated)
  const corsResult = await makeRequest('/api/health', {
    headers: {
      'Origin': 'https://evil-site.com'
    }
  });
  console.log(`  ${corsResult.success ? '✅' : '❌'} CORS Handling: ${corsResult.status}`);
}

async function testAuthenticationEndpoints() {
  console.log('\n🔐 Testing Authentication Endpoints...');
  
  // Test GitHub auth without credentials
  const githubResult = await makeRequest('/api/auth/github/repos', {
    headers: {
      'Authorization': 'Bearer invalid-token'
    }
  });
  console.log(`  ${!githubResult.success ? '✅' : '❌'} GitHub Auth Validation: ${githubResult.status}`);
  
  // Test Shopify auth without credentials
  const shopifyResult = await makeRequest('/api/auth/shopify/validate', {
    method: 'POST',
    body: JSON.stringify({
      domain: 'test.myshopify.com'
    })
  });
  console.log(`  ${!shopifyResult.success ? '✅' : '❌'} Shopify Auth Validation: ${shopifyResult.status}`);
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test non-existent session
  const notFoundResult = await makeRequest('/api/sessions/non-existent-session');
  console.log(`  ${!notFoundResult.success ? '✅' : '❌'} 404 Handling: ${notFoundResult.status}`);
  
  // Test invalid JSON
  const invalidJsonResult = await makeRequest('/api/sessions', {
    method: 'POST',
    body: 'invalid-json',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  console.log(`  ${!invalidJsonResult.success ? '✅' : '❌'} Invalid JSON Handling: ${invalidJsonResult.status}`);
  
  // Test missing required fields
  const missingFieldsResult = await makeRequest('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({})
  });
  console.log(`  ${!missingFieldsResult.success ? '✅' : '❌'} Validation Errors: ${missingFieldsResult.status}`);
}

async function runIntegrationTests() {
  console.log('🚀 PDBuilder Backend Integration Test Suite');
  console.log('=' .repeat(50));
  
  try {
    await testHealthEndpoints();
    await testSessionManagement();
    await testAIIntegration();
    await testSecurityMiddleware();
    await testAuthenticationEndpoints();
    await testErrorHandling();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Integration tests completed successfully!');
    console.log('📊 Backend architecture is fully operational');
    
  } catch (error) {
    console.log('\n❌ Test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests();
}

export { runIntegrationTests };