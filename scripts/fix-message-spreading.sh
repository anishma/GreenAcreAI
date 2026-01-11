#!/bin/bash

# Fix message spreading bug in all agent nodes
# LangGraph concat reducer doubles messages when we spread ...state.messages

FILES=(
  "src/lib/agents/nodes/address-extraction.ts"
  "src/lib/agents/nodes/quote-calculation.ts"
  "src/lib/agents/nodes/frequency-collection.ts"
  "src/lib/agents/nodes/booking.ts"
  "src/lib/agents/nodes/closing.ts"
  "src/lib/agents/nodes/property-lookup.ts"
)

for file in "${FILES[@]}"; do
  echo "Fixing $file..."

  # Replace all instances of:
  #   messages: [
  #     ...state.messages,
  # with:
  #   messages: [

  sed -i '' '/messages: \[/,/\.\.\. state\.messages,/{
    s/\.\.\. *state\.messages, *$/REMOVE_THIS_LINE/
  }' "$file"

  # Remove the REMOVE_THIS_LINE markers
  sed -i '' '/REMOVE_THIS_LINE/d' "$file"
done

echo "✅ All files fixed!"
