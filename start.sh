#!/bin/bash

# Start Script for Orion-PharmaTics
# Starts both backend and frontend servers

set -e  # Exit on error

echo "🏥 Starting Orion-PharmaTics..."
echo "================================"
echo ""

# Check if script is run from the root directory
if [ ! -f "start.sh" ]; then    
    echo "❌ This script must be run from the root directory."
    exit 1
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  Backend dependencies not installed. Running npm install..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies not installed. Running npm install..."
    cd frontend && npm install && cd ..
fi

echo "✅ Dependencies checked"
echo ""

# Start backend server
echo "🚀 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo "🚀 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "================================"
echo "✅ Orion-PharmaTics is running!"
echo "================================"
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Handle cleanup on exit
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait