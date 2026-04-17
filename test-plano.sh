#!/bin/bash

# Test Plano Integration for Srishti AI

set -e

echo "🧪 Testing Plano Integration..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Check if planoai is installed
echo "Test 1: Checking planoai CLI..."
if command -v planoai &> /dev/null; then
    echo -e "${GREEN}✅ planoai CLI installed${NC}"
else
    echo -e "${RED}❌ planoai CLI not found${NC}"
    echo "   Run: ./start-plano.sh to install"
    exit 1
fi

# Test 2: Check config file
echo ""
echo "Test 2: Checking configuration..."
if [ -f "plano_config.yaml" ]; then
    echo -e "${GREEN}✅ plano_config.yaml exists${NC}"
else
    echo -e "${RED}❌ plano_config.yaml not found${NC}"
    exit 1
fi

# Test 3: Check if llama.cpp router is accessible
echo ""
echo "Test 3: Checking router (llama.cpp)..."
if curl -s http://192.168.1.8:11434/v1/models > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Router accessible at http://192.168.1.8:11434${NC}"
else
    echo -e "${YELLOW}⚠️  Router not accessible${NC}"
    echo "   Make sure llama.cpp is running with:"
    echo "   ./llama-server -m qwen3.5-4B.gguf --host 192.168.1.8 --port 11434 --api"
fi

# Test 4: Check if Plano gateway is running
echo ""
echo "Test 4: Checking Plano gateway..."
if curl -s http://localhost:12000/v1/models > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Plano gateway running on port 12000${NC}"
    
    # Test routing
    echo ""
    echo "Test 5: Testing routing..."
    RESPONSE=$(curl -s -X POST http://localhost:12000/v1/chat/completions \
        -H "Content-Type: application/json" \
        -d '{
            "messages": [{"role": "user", "content": "What is 2+2?"}],
            "model": ""
        }')
    
    if echo "$RESPONSE" | grep -q "choices"; then
        echo -e "${GREEN}✅ Routing working${NC}"
        MODEL_USED=$(echo "$RESPONSE" | grep -o '"model":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   Model used: $MODEL_USED"
    else
        echo -e "${YELLOW}⚠️  Routing response unexpected${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Plano gateway not running${NC}"
    echo "   Start it with: ./start-plano.sh"
fi

# Test 5: Check Next.js app
echo ""
echo "Test 6: Checking Next.js app..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Next.js app running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Next.js app not running${NC}"
    echo "   Start it with: npm run dev"
fi

# Test 6: Check environment variables
echo ""
echo "Test 7: Checking environment..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local exists${NC}"
    
    if grep -q "PLANO_GATEWAY_URL" .env.local; then
        echo -e "${GREEN}✅ PLANO_GATEWAY_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  PLANO_GATEWAY_URL not in .env.local${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To start using Plano:"
echo "  1. Ensure llama.cpp is running (router)"
echo "  2. Run: ./start-plano.sh"
echo "  3. Run: npm run dev"
echo "  4. Open: http://localhost:3000"
echo ""
echo "For help: cat PLANO_README.md"
echo ""