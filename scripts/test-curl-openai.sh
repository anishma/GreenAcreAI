#!/bin/bash

# Test OpenAI API with raw curl
source .env

echo "Testing OpenAI API with curl..."
echo "API Key: ${OPENAI_API_KEY:0:20}..."
echo ""

curl -v https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 10
  }' 2>&1
