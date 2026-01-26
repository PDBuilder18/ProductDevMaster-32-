# PDBuilder Testing Guide

## Quick Test Inputs for the Updated App

### 1. Basic App Navigation
Visit these URLs to explore the app:
- **Main App**: `http://localhost:5000/`
- **Conversation Interface**: `http://localhost:5000/conversation`
- **Admin Dashboard**: `http://localhost:5000/admin`

### 2. AI Conversation Testing

#### Problem Discovery Stage
Try these realistic business ideas:

**SaaS Product Example:**
```
"I want to build a project management tool for remote teams that helps track productivity and deadlines"
```

**E-commerce Example:**
```
"I'm planning to create an online marketplace for handmade crafts where artisans can sell directly to customers"
```

**Mobile App Example:**
```
"I want to develop a fitness app that creates personalized workout plans based on user goals and available equipment"
```

**B2B Service Example:**
```
"I'm thinking about starting a service that helps small businesses automate their social media marketing"
```

### 3. Complete Workflow Test

Follow this sequence to test the full workflow:

1. **Start a Conversation**
   - Go to `/conversation`
   - Enter: "I want to create a food delivery app for college campuses"

2. **Follow the AI Prompts**
   - The AI will ask clarifying questions about your problem
   - Answer naturally, like: "Students often wait too long for food delivery, especially during busy hours"

3. **Progress Through Stages**
   - Problem Discovery → Customer Research → Market Analysis → etc.
   - Each stage builds on your previous answers

4. **Test Export Feature**
   - Once you complete several stages, try exporting your progress
   - The system will generate a PDF with your product requirements

### 4. Admin Dashboard Testing

Visit `/admin` to monitor:
- System health status
- Integration availability 
- Real-time API performance
- Configuration validation

### 5. API Testing with cURL

Test backend endpoints directly:

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Create Session:**
```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"my-test-session","currentStep":1,"completedSteps":[],"data":{}}'
```

**AI Conversation:**
```bash
curl -X POST http://localhost:5000/api/sessions/my-test-session/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"I want to build a productivity app for students","stage":"problem-discovery"}'
```

### 6. Security Testing

**Rate Limiting Test:**
```bash
# Run multiple rapid requests to test rate limiting
for i in {1..10}; do curl http://localhost:5000/api/health; done
```

**Input Validation Test:**
Try entering problematic inputs in the conversation to see security validation:
- `<script>alert('test')</script>`
- Very long messages (10,000+ characters)
- Special characters and symbols

### 7. Real Business Scenarios

#### Scenario A: Tech Startup
```
Problem: "University students struggle to find study groups and academic support"
Follow-up: "I've noticed students often study alone and perform worse on exams"
Market: "There are study apps, but none specifically for finding study partners"
```

#### Scenario B: Local Business
```
Problem: "Small restaurants waste food because they can't predict daily demand"
Follow-up: "I've seen restaurants throw away perfectly good food every night"
Market: "There are inventory systems, but nothing focused on demand prediction"
```

#### Scenario C: Healthcare
```
Problem: "Elderly people forget to take medications on schedule"
Follow-up: "My grandmother missed doses and ended up in the hospital"
Market: "There are reminder apps, but they're not designed for elderly users"
```

### 8. Integration Testing

**GitHub Integration (requires API keys):**
```bash
curl -X GET http://localhost:5000/api/auth/github/repos \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN"
```

**Shopify Integration (requires setup):**
```bash
curl -X POST http://localhost:5000/api/auth/shopify/validate \
  -H "Content-Type: application/json" \
  -d '{"customerId":"123","domain":"your-shop.myshopify.com"}'
```

### 9. Error Handling Testing

Test how the app handles errors:

**Invalid Session:**
```bash
curl http://localhost:5000/api/sessions/non-existent-session
```

**Malformed Request:**
```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d 'invalid-json'
```

### 10. Performance Testing

**Concurrent Users:**
```bash
# Simulate multiple users creating sessions simultaneously
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/sessions \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"user-$i\",\"currentStep\":1,\"completedSteps\":[],\"data\":{}}" &
done
wait
```

## Expected Results

### Successful Tests Should Show:
- ✅ AI responds with relevant, contextual questions
- ✅ Sessions persist across page refreshes
- ✅ Admin dashboard shows healthy status
- ✅ Export generates downloadable PDF files
- ✅ Security middleware blocks malicious inputs
- ✅ Rate limiting protects against abuse

### Common Issues to Watch For:
- ⚠️ Slow AI responses (normal: 2-4 seconds)
- ⚠️ Session data not persisting (check browser storage)
- ⚠️ PDF export failing (check temp directory permissions)
- ⚠️ Integration status showing "disabled" (expected without API keys)

## Next Steps After Testing

1. **If everything works**: Ready for production deployment
2. **If you want GitHub integration**: Add GitHub OAuth app credentials
3. **If you want Shopify integration**: Set up Shopify app and add credentials
4. **If you want persistent data**: Configure PostgreSQL database connection

The app is designed to work perfectly with just the OpenAI API key, which is already configured and working!