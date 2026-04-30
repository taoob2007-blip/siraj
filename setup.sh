#!/bin/bash

# SIRAJ Quick Start Script
# This script sets up the project step-by-step

echo "================================================"
echo "SIRAJ - Next.js RFQ Platform Setup"
echo "================================================"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Step 2: Environment setup
echo "🔧 Step 2: Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ .env.local created (please edit with your Supabase credentials)"
else
    echo "ℹ️  .env.local already exists"
fi
echo ""

# Step 3: shadcn/ui initialization
echo "🎨 Step 3: Initializing shadcn/ui..."
echo ""
echo "Run these commands manually:"
echo ""
echo "  npx shadcn-ui@latest init"
echo "  npx shadcn-ui@latest add button input label textarea select card table badge dialog"
echo ""

# Step 4: Summary
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "📝 Next steps:"
echo "  1. Edit .env.local with your Supabase credentials"
echo "  2. Run: npx shadcn-ui@latest init"
echo "  3. Run: npx shadcn-ui@latest add button input label textarea select card table badge dialog"
echo "  4. Run: npm run dev"
echo ""
echo "🚀 Start development at: http://localhost:3000"
echo ""
