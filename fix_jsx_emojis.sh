#!/bin/bash

# Fix emojis in JSX files
find src -name "*.jsx" -type f -exec sed -i '' \
  -e 's/🎯//g' \
  -e 's/🔥//g' \
  -e 's/✨//g' \
  -e 's/🚀//g' \
  -e 's/💻//g' \
  -e 's/📧//g' \
  -e 's/📊//g' \
  -e 's/⏰//g' \
  -e 's/🍳//g' \
  -e 's/💼//g' \
  -e 's/🏠//g' \
  -e 's/🌙//g' \
  -e 's/👶//g' \
  -e 's/👨‍🍳//g' \
  -e 's/📺//g' \
  -e 's/🐕//g' \
  -e 's/💃//g' \
  -e 's/🎮//g' \
  -e 's/📚//g' \
  -e 's/🌍//g' \
  -e 's/☕️//g' \
  -e 's/☕//g' \
  -e 's/👥//g' \
  -e 's/🏃‍♂️//g' \
  -e 's/🔄//g' \
  {} +

echo "Emoji removal complete!"
