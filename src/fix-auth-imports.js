#!/usr/bin/env node

/**
 * Fix Auth Context Imports
 * Automatically fixes incorrect auth context imports
 */

const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  {
    from: "from '../contexts/LocalOnlyAuthContext'",
    to: "from '../contexts/SupabaseAuthContext'"
  },
  {
    from: "from '../contexts/LocalAuthContext'",
    to: "from '../contexts/SupabaseAuthContext'"
  },
  {
    from: 'from "../contexts/LocalOnlyAuthContext"',
    to: 'from "../contexts/SupabaseAuthContext"'
  },
  {
    from: 'from "../contexts/LocalAuthContext"',
    to: 'from "../contexts/SupabaseAuthContext"'
  }
];

const EXCLUDED_FILES = [
  'LocalDashboard.tsx',
  'LocalDashboardEnhanced.tsx',
  'local-storage-database.ts',
  'local-only-database-service.ts',
  'LocalOnlyAuthContext.tsx',
  'LocalAuthContext.tsx'
];

function fixFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip excluded files
  if (EXCLUDED_FILES.includes(fileName)) {
    return { file: filePath, status: 'skipped' };
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const replacement of REPLACEMENTS) {
    if (content.includes(replacement.from)) {
      content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { file: filePath, status: 'fixed' };
  }
  
  return { file: filePath, status: 'ok' };
}

function scanAndFix(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        scanAndFix(filePath, results);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const result = fixFile(filePath);
      if (result.status !== 'ok') {
        results.push(result);
      }
    }
  }
  
  return results;
}

console.log('🔧 Fixing auth context imports...\n');

const componentsDir = path.join(__dirname, 'components');
const utilsDir = path.join(__dirname, 'utils');

const results = [
  ...scanAndFix(componentsDir),
  ...scanAndFix(utilsDir)
];

const fixed = results.filter(r => r.status === 'fixed');
const skipped = results.filter(r => r.status === 'skipped');

console.log('\n📊 Summary:');
console.log(`✅ Fixed: ${fixed.length} files`);
console.log(`⏭️  Skipped: ${skipped.length} files (legacy)`);

if (fixed.length > 0) {
  console.log('\n🔧 Fixed files:');
  fixed.forEach(r => console.log(`   ${r.file}`));
}

console.log('\n✅ Auth imports fixed!');
console.log('\n🔄 Next steps:');
console.log('   1. Clear browser cache (Ctrl+Shift+R)');
console.log('   2. Or visit: /FORCE_CLEAR_CACHE.html');
console.log('   3. Reload the application\n');
