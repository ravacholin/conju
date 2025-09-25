#!/bin/bash

# Remove ALL emojis and problematic styling from JSX and JS files
echo "🧹 Starting comprehensive emoji and color cleanup..."

# Remove all emojis from JSX/JS files (more comprehensive)
find src -name "*.jsx" -o -name "*.js" | grep -v node_modules | xargs -I {} sed -i '' \
  -e 's/[😀-🙏]//g' \
  -e 's/[🌀-🗿]//g' \
  -e 's/[🚀-🛿]//g' \
  -e 's/[🇠-🇿]//g' \
  -e 's/[⚠-⚿]//g' \
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
  -e 's/🔄//g' \
  -e 's/⚡//g' \
  -e 's/💡//g' \
  -e 's/📈//g' \
  -e 's/📉//g' \
  -e 's/🌟//g' \
  -e 's/💪//g' \
  -e 's/🧠//g' \
  -e 's/🔮//g' \
  -e 's/⭐//g' \
  -e 's/🤖//g' \
  -e 's/🧘//g' \
  -e 's/💰//g' \
  -e 's/style={{[^}]*color[^}]*}}//g' \
  {}

# Remove bright colors from CSS files
find src -name "*.css" | xargs -I {} sed -i '' \
  -e 's/#ff[0-9a-fA-F]\{4\}/#333/g' \
  -e 's/#[0-9a-fA-F]\{2\}ff[0-9a-fA-F]\{2\}/#333/g' \
  -e 's/#[0-9a-fA-F]\{4\}ff/#333/g' \
  -e 's/rgb(255,.*)/\#333/g' \
  -e 's/rgb(.*,255,.*)/\#333/g' \
  -e 's/rgb(.*,.*,255)/\#333/g' \
  -e 's/rgba(255,.*)/\#333/g' \
  -e 's/linear-gradient([^;]*);/background: \#333;/g' \
  -e 's/radial-gradient([^;]*);/background: \#333;/g' \
  {}

echo "✅ Comprehensive cleanup complete!"
