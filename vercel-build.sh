#!/bin/bash
echo "🚀 Starting build for CONJU project..."
echo "📁 Current directory: $(pwd)"
echo "📦 Installing dependencies..."
npm install
echo "🔨 Building project..."
npm run build
echo "✅ Build completed!"
echo "📁 Contents of dist directory:"
ls -la dist/
echo "🎯 Build script completed successfully!"
