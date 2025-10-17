#!/bin/bash

# Script para migrar console.* a logger masivamente
# Encuentra archivos con console.* y muestra estadísticas

echo "=== Archivos en src/lib/progress con console.* ==="
cd src/lib/progress
for file in *.js; do
  if [[ ! "$file" =~ \.test\.js$ ]] && [[ -f "$file" ]]; then
    count=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
    if [ "$count" -gt "0" ]; then
      echo "$count $file"
    fi
  fi
done | sort -rn

echo ""
echo "=== Archivos en src/lib/core con console.* ==="
cd ../core
for file in *.js; do
  if [[ ! "$file" =~ \.test\.js$ ]] && [[ -f "$file" ]]; then
    count=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
    if [ "$count" -gt "0" ]; then
      echo "$count $file"
    fi
  fi
done | sort -rn

echo ""
echo "=== Archivos en src/features con console.* ==="
cd ../../features
for file in **/*.{js,jsx}; do
  if [[ ! "$file" =~ \.test\. ]] && [[ -f "$file" ]]; then
    count=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
    if [ "$count" -gt "0" ]; then
      echo "$count $file"
    fi
  fi
done | sort -rn

echo ""
echo "=== TOTAL por directorio ==="
echo "progress: $(grep -r "console\." ../lib/progress --include="*.js" --exclude="*.test.js" | wc -l) llamadas"
echo "core: $(grep -r "console\." ../lib/core --include="*.js" --exclude="*.test.js" | wc -l) llamadas"
echo "features: $(grep -r "console\." ../../features --include="*.js" --include="*.jsx" --exclude="*.test.*" | wc -l) llamadas"
