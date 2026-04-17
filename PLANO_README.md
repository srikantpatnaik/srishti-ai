# Plano Integration for Srishti AI

## Overview

Srishti AI now uses **Plano** for dynamic LLM routing. This replaces the static `settings.yaml` routing with intelligent, preference-based model selection.

## Architecture

```
User Request
    ↓
Next.js API (/api/chat)
    ↓
Plano Gateway (localhost:12000)
    ↓
Plano Router (qwen3.5-4B on llama.cpp)
    ↓
Selected Model (gpt-4o, gpt-4o-mini, claude, etc.)
```

## Components

### 1. Plano Gateway
- **URL**: `http://localhost:12000/v1`
- **Config**: `plano_config.yaml`
- **Session Cache**: In-memory (development mode)
- **Guardrails**: Jailbreak protection, content moderation, PII redaction

### 2. Router Model
- **Model**: qwen3.5-4B (your existing llama.cpp instance)
- **Endpoint**: `http://192.168.1.8:11434/v1`
- **Role**: Analyzes requests and routes to appropriate models

### 3. Routing Preferences

| Task Type | Routed To | Why |
|-----------|-----------|-----|
| Code generation | gpt-4o | Best code quality |
| App building | gpt-4o | Complex reasoning |
| Simple QA | gpt-4o-mini | Fast, cost-effective |
| Casual chat | gpt-4o-mini | Lightweight |
| Local tasks | qwen3.5-4B | Offline capability |

## Quick Start

### 1. Ensure llama.cpp is running
```bash
# On your llama.cpp server (192.168.1.8)
./llama-server \
  -m qwen3.5-4B.gguf \
  --host 192.168.1.8 \
  --port 11434 \
  --api \
  -c 32768
```

### 2. Start Plano Gateway
```bash
# In project root
./start-plano.sh
```

This will:
- Install `planoai` CLI if needed
- Verify llama.cpp router is accessible
- Start Plano gateway on port 12000

### 3. Start Next.js App
```bash
npm run dev
```

### 4. Test
Open http://localhost:3000 and try:
- "Build a calculator app" → Routes to gpt-4o
- "What's 2+2?" → Routes to gpt-4o-mini
- Regular chat → Routes based on complexity

## Configuration

### Environment Variables (`.env.local`)
```bash
PLANO_GATEWAY_URL=http://localhost:12000/v1
LLAMA_CPP_URL=http://192.168.1.8:11434/v1
LLAMA_CPP_API_KEY=sk-123
OPENAI_API_KEY=your_key_here
```

### Plano Config (`plano_config.yaml`)
Key sections:
- `llm_providers`: Define models and routing preferences
- `model_aliases`: Semantic model names
- `routing`: Session affinity settings
- `filter_chains`: Guardrails configuration
- `tracing`: Observability settings

## Model Affinity (Session Consistency)

Plano uses **model affinity** to maintain consistent model selection within a session:

1. **First request**: Router analyzes and selects model
2. **Subsequent requests**: Same model used (cached)
3. **Session ID**: Stored in localStorage as `plano_session_id`
4. **TTL**: 1 hour (configurable in `plano_config.yaml`)

This prevents model switching mid-conversation for better UX.

## Guardrails

Enabled by default:
- ✅ **Jailbreak Protection**: Blocks prompt injection attempts
- ✅ **Content Moderation**: Filters harmful content
- ✅ **PII Redaction**: Removes sensitive data (emails, phones, etc.)

Configure in `plano_config.yaml` under `filter_chains`.

## Fallback Behavior

If Plano gateway is unavailable:
1. API automatically falls back to direct llama.cpp
2. Response includes `X-Fallback: true` header
3. No routing intelligence (uses qwen3.5-4B directly)

## Observability

### Logs
```bash
# View Plano logs
planoai logs

# Access logs (JSON format)
cat /tmp/plano/access.log
```

### Tracing
- 100% sampling in development
- All requests traced with W3C trace context
- Check logs for `traceparent` headers

## Testing Routing

Test specific routing scenarios:

```bash
# Test code generation routing
curl -X POST http://localhost:12000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Build a calculator app"}],
    "model": ""
  }'

# Check which model was used in response
# Response includes "model": "gpt-4o" (or other selected model)
```

## Troubleshooting

### Plano won't start
```bash
# Check if port 12000 is in use
lsof -i :12000

# Kill process if needed
kill -9 <PID>

# Restart
planoai down
planoai up plano_config.yaml
```

### Router not accessible
```bash
# Test llama.cpp endpoint
curl http://192.168.1.8:11434/v1/models

# Check network connectivity
ping 192.168.1.8

# Verify llama.cpp is running with --api flag
```

### Routing not working
```bash
# Check Plano logs for errors
planoai logs | grep -i error

# Verify config is valid
planoai validate plano_config.yaml

# Check if models are configured in plano_config.yaml
cat plano_config.yaml | grep -A 5 "llm_providers"
```

### Session affinity not working
```bash
# Clear old session
localStorage.removeItem("plano_session_id")

# Refresh page to generate new session ID
# Check browser console for session ID
```

## Production Deployment

For production (future):
1. **Redis**: Add Redis for session persistence across instances
2. **vLLM**: Serve Plano-Orchestrator-30B on GPU for better routing
3. **Kubernetes**: Deploy with Docker Compose or K8s manifests
4. **Monitoring**: Integrate with Prometheus/Grafana

See `PLANO.md` for full production deployment guide.

## Commands Reference

```bash
# Start Plano
planoai up plano_config.yaml

# Stop Plano
planoai down

# View logs
planoai logs

# Validate config
planoai validate plano_config.yaml

# Check status
planoai status
```

## Files Changed

- ✅ `plano_config.yaml` - Plano gateway configuration
- ✅ `app/api/chat/route.ts` - Updated to use Plano
- ✅ `app/page.tsx` - Added session ID management
- ✅ `.env.local` - Environment variables
- ✅ `start-plano.sh` - Startup script

## Files Archived (Legacy)

- `settings.yaml` - Old static routing (keep as backup)
- `app/api/router/route.ts` - Old routing endpoint

## Next Steps

1. **Fine-tune router**: Train qwen3.5-4B on routing tasks for better accuracy
2. **Add more models**: Configure additional LLM providers in `plano_config.yaml`
3. **Production Redis**: Set up Redis for multi-instance deployments
4. **Upgrade to 30B model**: Deploy Plano-Orchestrator-30B on GPU when available

## Support

- Plano Docs: https://docs.planoai.dev/
- Plano GitHub: https://github.com/katanemo/plano
- Issues: Check `planoai logs` for error details