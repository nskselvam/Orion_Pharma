#!/bin/bash

# PostgreSQL Database Setup Script for Orion-PharmaTics
# Pharmaceutical Supply Chain Management System

echo "🏥 Orion-PharmaTics Database Setup"
echo "=================================="
echo ""

# Database configuration
DB_NAME="orion_pharmatics"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo "📋 Database Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL service..."
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    echo "Please start PostgreSQL and try again."
    exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

# Create database
echo "📦 Creating database '$DB_NAME'..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Database created or already exists"
else
    echo "❌ Failed to create database"
    exit 1
fi
echo ""

# Run schema migration
echo "🗄️  Running schema migration..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f backend/src/config/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema migration completed successfully"
else
    echo "❌ Schema migration failed"
    exit 1
fi
echo ""

# Insert sample data (optional)
read -p "📝 Would you like to insert sample data? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Inserting sample data..."
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME << EOF
-- Insert sample batches
INSERT INTO batches (batch_id, medicine_name, origin, destination, origin_lat, origin_lng, destination_lat, destination_lng, quantity_in_stock, temperature)
VALUES 
    ('MED001', 'Paracetamol 500mg', 'Mumbai Warehouse', 'Delhi Hospital', 19.0760, 72.8777, 28.7041, 77.1025, 1000, 22.5),
    ('MED002', 'Insulin Glargine', 'Bangalore Lab', 'Chennai Pharmacy', 12.9716, 77.5946, 13.0827, 80.2707, 500, 4.5),
    ('MED003', 'Amoxicillin 250mg', 'Hyderabad Manufacturing', 'Pune Distributor', 17.3850, 78.4867, 18.5204, 73.8567, 2000, 20.0)
ON CONFLICT (batch_id) DO NOTHING;

-- Insert initial stages
INSERT INTO batch_stages (batch_id, name, location, temperature, coordinates_lat, coordinates_lng)
SELECT batch_id, 'Pfizer Manufacturing', 'manufacturer', temperature, origin_lat, origin_lng
FROM batches
WHERE batch_id IN ('MED001', 'MED002', 'MED003')
ON CONFLICT DO NOTHING;

-- Insert sample logs
INSERT INTO logs (batch_id, type, value)
SELECT batch_id, 'temperature', json_build_object('temperature', temperature, 'message', 'Initial temperature reading')
FROM batches
WHERE batch_id IN ('MED001', 'MED002', 'MED003');
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Sample data inserted successfully"
    else
        echo "⚠️  Some sample data may already exist"
    fi
fi
echo ""

# Verify setup
echo "🔍 Verifying database setup..."
BATCH_COUNT=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM batches;")
ALERT_COUNT=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM alerts;")
LOG_COUNT=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM logs;")

echo "📊 Database Statistics:"
echo "  Batches: $BATCH_COUNT"
echo "  Alerts: $ALERT_COUNT"
echo "  Logs: $LOG_COUNT"
echo ""

echo "✅ Database setup completed successfully!"
echo ""
echo "🚀 Next steps:"
echo "  1. Update backend/.env with your PostgreSQL credentials"
echo "  2. Run: cd backend && npm install"
echo "  3. Run: cd backend && npm run dev"
echo "  4. Test: curl http://localhost:5000/api/health/db"
echo ""
echo "📚 API Endpoints available:"
echo "  POST   /api/pharma/batch/create"
echo "  GET    /api/pharma/batch"
echo "  GET    /api/pharma/batch/:id"
echo "  GET    /api/pharma/alerts"
echo "  GET    /api/pharma/alerts/active"
echo "  POST   /api/pharma/simulate/temperature"
echo "  POST   /api/pharma/simulate/location"
echo "  GET    /api/pharma/verify/:batchId"
echo ""
