#!/bin/bash

# Test script for NazarTs Gateway API endpoints
BASE_URL="http://localhost:3000"

echo "🚀 Testing NazarTs Gateway API endpoints..."
echo "=================================================="

# Test 1: Get all analytics
echo "1. Testing GET /api/dashboard/analytics"
curl -s "$BASE_URL/api/dashboard/analytics" | jq '.' || echo "Failed to get analytics"
echo -e "\n"

# Test 2: Get list of clients
echo "2. Testing GET /api/dashboard/clients"
CLIENTS_RESPONSE=$(curl -s "$BASE_URL/api/dashboard/clients")
echo "$CLIENTS_RESPONSE" | jq '.'

# Extract first client MAC address for filtered tests
FIRST_CLIENT=$(echo "$CLIENTS_RESPONSE" | jq -r '.clients[0].clientMacAddress // empty')

if [ ! -z "$FIRST_CLIENT" ]; then
    echo -e "\n"
    
    # Test 3: Get analytics filtered by client
    echo "3. Testing GET /api/dashboard/analytics?clientMacAddress=$FIRST_CLIENT"
    curl -s "$BASE_URL/api/dashboard/analytics?clientMacAddress=$FIRST_CLIENT" | jq '.' || echo "Failed to get filtered analytics"
    echo -e "\n"
    
    # Test 4: Get specific client analytics
    echo "4. Testing GET /api/dashboard/clients/$FIRST_CLIENT"
    curl -s "$BASE_URL/api/dashboard/clients/$FIRST_CLIENT" | jq '.' || echo "Failed to get client analytics"
    echo -e "\n"
else
    echo "No clients found in the database. Please run the sample data script first."
fi

# Test 5: Health check
echo "5. Testing GET /api/dashboard/health"
curl -s "$BASE_URL/api/dashboard/health" | jq '.' || echo "Failed to get health status"
echo -e "\n"

echo "✅ API testing completed!"
echo "=================================================="

# Test message publishing endpoint
echo "6. Testing POST /api/messages/publish with sample message"
SAMPLE_MESSAGE='{
  "filePath": "/test/sample.txt",
  "fileName": "sample.txt", 
  "fileExtension": ".txt",
  "directory": "/test",
  "fileType": "document",
  "category": "document",
  "changeType": "add",
  "timestamp": '$(date +%s000)',
  "size": 1024,
  "isDirectory": false,
  "clientMacAddress": "AA:BB:CC:DD:EE:FF"
}'

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$SAMPLE_MESSAGE" \
  "$BASE_URL/api/messages/publish" | jq '.' || echo "Failed to publish message"

echo -e "\n✅ Message publishing test completed!"