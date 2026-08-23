#!/bin/bash
set -e

echo "=== AgentCI Build Script ==="

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
echo "Frontend built successfully."
cd ..

# Install backend deps
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
echo "Backend dependencies installed."
cd ..

echo "=== Build Complete ==="
