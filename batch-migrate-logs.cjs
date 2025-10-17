#!/usr/bin/env node

/**
 * Script de migración MASIVA de console.* a logger
 * Procesa múltiples archivos automáticamente
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  'src/lib/progress',
  'src/lib/core',
  'src/features'
];

const SKIP_FILES = [
  '.test.js',
  '.test.jsx',
  'logger.js',
  'tests.js'
];

function shouldSkipFile(filename) {
  return SKIP_FILES.some(skip => filename.includes(skip));
}

function getLoggerNamespace(filePath) {
  if (filePath.includes('src/lib/progress')) return 'progress';
  if (filePath.includes('src/lib/core')) return 'core';
  if (filePath.includes('src/features')) return 'features';
  return 'app';
}

function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if already has logger
  if (content.includes('createLogger') || content.includes('const logger =')) {
    return { migrated: false, reason: 'already has logger' };
  }

  // Count console.* calls
  const consoleCount = (content.match(/console\./g) || []).length;
  if (consoleCount === 0) {
    return { migrated: false, reason: 'no console calls' };
  }

  const filename = path.basename(filePath, path.extname(filePath));
  const namespace = getLoggerNamespace(filePath);
  const isJSX = filePath.endsWith('.jsx');

  // Add logger import
  let newContent = content;

  // Find where to insert import
  const importRegex = /^import .+$/gm;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.indexOf(lastImport) + lastImport.length;

    const loggerImport = isJSX
      ? `\nimport { createLogger } from '../../lib/utils/logger.js'\n\nconst logger = createLogger('${namespace}:${filename}')\n`
      : `\nimport { createLogger } from '../utils/logger.js'\n\nconst logger = createLogger('${namespace}:${filename}')\n`;

    newContent = content.slice(0, lastImportIndex) + loggerImport + content.slice(lastImportIndex);
  } else {
    // No imports, add at top
    const loggerImport = `import { createLogger } from '../utils/logger.js'\n\nconst logger = createLogger('${namespace}:${filename}')\n\n`;
    newContent = loggerImport + content;
  }

  // Replace console.log with logger.debug
  newContent = newContent.replace(/console\.log\(/g, 'logger.debug(');

  // Replace console.info with logger.info
  newContent = newContent.replace(/console\.info\(/g, 'logger.info(');

  // Replace console.warn with logger.warn
  newContent = newContent.replace(/console\.warn\(/g, 'logger.warn(');

  // Replace console.error with logger.error
  newContent = newContent.replace(/console\.error\(/g, 'logger.error(');

  fs.writeFileSync(filePath, newContent, 'utf8');

  return { migrated: true, consoleCount };
}

function processDirectory(dir) {
  const results = {
    processed: 0,
    migrated: 0,
    skipped: 0,
    totalConsoleRemoved: 0,
    files: []
  };

  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && !shouldSkipFile(file)) {
        results.processed++;
        const result = migrateFile(filePath);

        if (result.migrated) {
          results.migrated++;
          results.totalConsoleRemoved += result.consoleCount;
          results.files.push({ path: filePath, count: result.consoleCount });
        } else {
          results.skipped++;
        }
      }
    }
  }

  walkDir(dir);
  return results;
}

// Main execution
console.log('🚀 MIGRACIÓN MASIVA DE CONSOLE.* A LOGGER\n');

const totalResults = {
  processed: 0,
  migrated: 0,
  skipped: 0,
  totalConsoleRemoved: 0,
  byDirectory: {}
};

for (const dir of TARGET_DIRS) {
  console.log(`📁 Procesando ${dir}...`);
  const results = processDirectory(dir);

  totalResults.processed += results.processed;
  totalResults.migrated += results.migrated;
  totalResults.skipped += results.skipped;
  totalResults.totalConsoleRemoved += results.totalConsoleRemoved;
  totalResults.byDirectory[dir] = results;

  console.log(`  ✅ Migrados: ${results.migrated} archivos`);
  console.log(`  ⏭️  Saltados: ${results.skipped} archivos`);
  console.log(`  🧹 Console eliminados: ${results.totalConsoleRemoved}\n`);
}

console.log('📊 RESUMEN FINAL:');
console.log(`  Total archivos procesados: ${totalResults.processed}`);
console.log(`  Total archivos migrados: ${totalResults.migrated}`);
console.log(`  Total archivos saltados: ${totalResults.skipped}`);
console.log(`  🎉 TOTAL CONSOLE.* ELIMINADOS: ${totalResults.totalConsoleRemoved}`);

console.log('\n📝 Top 10 archivos migrados:');
const allFiles = Object.values(totalResults.byDirectory).flatMap(d => d.files);
allFiles.sort((a, b) => b.count - a.count).slice(0, 10).forEach((file, i) => {
  console.log(`  ${i + 1}. ${path.basename(file.path)}: ${file.count} calls`);
});

process.exit(0);
