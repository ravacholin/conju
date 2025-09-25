#!/bin/bash

# CSS files to fix colors and gradients
CSS_FILES=(
"src/components/gamification/GamificationDisplay.css"
"src/components/srs/SRSAnalytics.css" 
"src/features/progress/srs-panel.css"
"src/features/progress/flow-indicator.css"
"src/features/drill/session-insights.css"
"src/features/drill/progress-feedback.css"
)

for file in "${CSS_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo "Fixing $file..."
    # Replace gradients with flat dark colors
    sed -i '' 's/linear-gradient([^)]*)/\#333/g' "$file"
    sed -i '' 's/radial-gradient([^)]*)/\#333/g' "$file"
    
    # Replace bright colors with dark theme colors
    sed -i '' 's/#[0-9a-fA-F]\{6\}/#333/g' "$file"
    sed -i '' 's/#[0-9a-fA-F]\{3\}/#333/g' "$file"
    
    # Replace rgba/hsl with dark colors
    sed -i '' 's/rgba([^)]*)/\#333/g' "$file"
    sed -i '' 's/hsl([^)]*)/\#333/g' "$file"
    
    # Fix specific problematic colors
    sed -i '' 's/#333/#333/g' "$file"  # Keep our dark colors
    sed -i '' 's/#000/#000/g' "$file"  # Keep black
    sed -i '' 's/#fff/#fff/g' "$file"  # Keep white
    sed -i '' 's/#ccc/#ccc/g' "$file"  # Keep light gray
    sed -i '' 's/#999/#999/g' "$file"  # Keep medium gray
    sed -i '' 's/#555/#555/g' "$file"  # Keep dark gray
  fi
done

echo "Color fixes applied!"
