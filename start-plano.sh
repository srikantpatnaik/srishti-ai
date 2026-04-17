#!/bin/bash

# Plano Gateway Startup Script for Srishti AI
# This script starts the Plano gateway for development

set -e

echo "🚀 Starting Plano Gateway for Srishti AI..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if planoai is installed
if ! command -v planoai &> /dev/null; then
    echo -e "${YELLOW}⚠️  planoai CLI not found. Installing...${NC}"
    
    # Try uv first (recommended)
    if command -v uv &> /dev/null; then
        echo "Installing via uv..."
        uv tool install planoai==0.4.19
    # Fall back to pip
    elif command -v pip &> /dev/null; then
        echo "Installing via pip..."
        pip install planoai==0.4.19
    else
        echo -e "${RED}❌ Error: Neither uv nor pip found.${NC}"
        echo "Please install Python and one of these package managers."
        echo "  - uv: https://github.com/astral-sh/uv"
        echo "  - pip: comes with Python"
        exit 1
    fi
fi

echo -e "${GREEN}✅ planoai CLI found${NC}"
echo ""

# Check if config file exists
if [ ! -f "plano_config.yaml" ]; then
    echo -e "${RED}❌ Error: plano_config.yaml not found${NC}"
    echo "Please create the configuration file first."
    exit 1
fi

echo -e "${GREEN}✅ Configuration file found${NC}"
echo ""

# Check if llama.cpp is running (our router)
echo "📡 Checking llama.cpp router at http://192.168.1.8:11434..."
if curl -s http://192.168.1.8:11434/v1/models > /dev/null; then
    echo -e "${GREEN}✅ Router (qwen3.5-4B) is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Router not accessible at http://192.168.1.8:11434${NC}"
    echo "   Make sure llama.cpp is running with:"
    echo "   ./llama-server -m qwen3.5-4B.gguf --host 192.168.1.8 --port 11434 --api"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📋 Starting Plano gateway..."
echo ""

# Start Plano
planoai up plano_config.yaml

echo ""
echo -e "${GREEN}✅ Plano gateway started!${NC}"
echo ""
echo "📍 Gateway running at: http://localhost:12000/v1"
echo "📍 Router model: qwen3.5-4B (llama.cpp at 192.168.1.8:11434)"
echo ""
echo "💡 Next steps:"
echo "   1. Start your Next.js app: npm run dev"
echo "   2. Test the chat interface"
echo "   3. Check logs: planoai logs"
echo ""
echo "🛑 To stop Plano: planoai down"
echo ""