#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Running type check..."
npm run type-check

echo "Building with Vite..."
npx vite build

echo "Build completed successfully!"
