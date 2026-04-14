#!/bin/bash

# Test script for Orion-PharmaTics Pharma System

echo "🧪 Testing Orion-PharmaTics Pharma System"
echo "=========================================="
echo ""

# Configuration
BACKEND_URL="http://localhost:5000"
DB_NAME="orion_pharmatics"
DB_USER="postgres"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5

    echo -n "Testing: $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Check if backend is running
echo "1. Checking Backend Server..."
if curl -s "$BACKEND_URL/api/health/db" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Backend server is running"
else
    echo -e "   ${RED}✗${NC} Backend server is NOT running"
    echo ""
    echo "Please start the backend server first:"
    echo "  cd backend && npm run dev"
    exit 1
fi
echo ""

# Check database connection
echo "2. Checking Database Connection..."
if psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Database connection successful"
else
    echo -e "   ${RED}✗${NC} Cannot connect to database"
    echo ""
    echo "Please run the database setup:"
    echo "  ./setup-database.sh"
    exit 1
fi
echo ""

# Check database tables
echo "3. Checking Database Tables..."
TABLES=("batches" "batch_stages" "alerts" "logs")
for table in "${TABLES[@]}"; do
    if psql -U $DB_USER -d $DB_NAME -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓${NC} Table '$table' exists"
    else
        echo -e "   ${RED}✗${NC} Table '$table' missing"
    fi
done
echo ""

# API Tests
echo "4. Testing API Endpoints..."
echo ""

# Health check
test_endpoint "GET" "/api/health/db" "200" "Database health check"

# Get all batches
test_endpoint "GET" "/api/pharma/batch" "200" "Get all batches"

# Get active alerts
test_endpoint "GET" "/api/pharma/alerts/active" "200" "Get active alerts"

# Search locations
test_endpoint "GET" "/api/pharma/location/search?query=Mumbai" "200" "Location search"

# Create batch
BATCH_DATA='{
  "batchId": "TEST001",
  "medicineName": "Test Medicine",
  "origin": "Mumbai",
  "destination": "Delhi",
  "temperature": 22
}'

# Check if batch exists, delete if it does
psql -U $DB_USER -d $DB_NAME -c "DELETE FROM batches WHERE batch_id = 'TEST001';" > /dev/null 2>&1

test_endpoint "POST" "/api/pharma/batch/create" "201" "Create new batch" "$BATCH_DATA"

# Get specific batch
test_endpoint "GET" "/api/pharma/batch/TEST001" "200" "Get batch details"

# Verify batch
test_endpoint "GET" "/api/pharma/verify/TEST001" "200" "Verify batch"

# Simulate temperature
TEMP_DATA='{"batchId": "TEST001", "value": 25}'
test_endpoint "POST" "/api/pharma/simulate/temperature" "200" "Simulate temperature" "$TEMP_DATA"

# Simulate location
LOC_DATA='{"batchId": "TEST001"}'
test_endpoint "POST" "/api/pharma/simulate/location" "200" "Simulate location change" "$LOC_DATA"

# Get simulation status
test_endpoint "GET" "/api/pharma/simulate/status?batchId=TEST001" "200" "Get simulation status"

# Get batch alerts
test_endpoint "GET" "/api/pharma/alerts/batch/TEST001" "200" "Get batch alerts"

# Delete test batch
test_endpoint "DELETE" "/api/pharma/batch/TEST001" "200" "Delete batch"

echo ""
echo "=========================================="
echo "Test Results:"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
