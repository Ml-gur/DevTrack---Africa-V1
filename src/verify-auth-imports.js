#!/usr/bin/env node

/**
 * Verify Auth Context Imports
 * Checks all files to ensure they're using the correct auth context
 */

const fs = require('fs');
const path = require('path');

const CORRECT_IMPORT = "from '../contexts/SupabaseAuthContext'";
const WRONG_IMPORTS = [
  "from '../contexts/LocalOnlyAuthContext'",
  "from '../contexts/LocalAuthContext'",
  "from '../contexts/AuthContext'"
];

const EXCLUDED_FILES = [
  'LocalDashboard.tsx',
  'LocalDashboardEnhanced.tsx',
  'local-storage-database.ts',
  'local-only-database-service.ts'
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Skip excluded files
  if (EXCLUDED_FILES.includes(fileName)) {
    return { file: filePath, status: 'skipped', reason: 'legacy file' };
  }
  
  // Check for wrong imports
  for (const wrongImport of WRONG_IMPORTS) {
    if (content.includes(wrongImport)) {
      return {
        file: filePath,
        status: 'error',
        found: wrongImport,
        line: content.split('\n').findIndex(line => line.includes(wrongImport)) + 1
      };
    }
  }
  
  // Check if file uses auth
  if (content.includes('useAuth') && !content.includes(CORRECT_IMPORT) && !content.includes('createContext')) {
    // Make sure it's actually importing useAuth, not defining it
    if (content.includes('import') && content.includes('useAuth')) {
      return {
        file: filePath,
        status: 'warning',
        reason: 'Uses useAuth but no Supabase import found'
      };
    }
  }
  
  return { file: filePath, status: 'ok' };
}

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        scanDirectory(filePath, results);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const result = checkFile(filePath);
      if (result.status !== 'ok') {
        results.push(result);
      }
    }
  }
  
  return results;
}

console.log('🔍 Scanning for incorrect auth context imports...\n');

const componentsDir = path.join(__dirname, 'components');
const utilsDir = path.join(__dirname, 'utils');

const issues = [
  ...scanDirectory(componentsDir),
  ...scanDirectory(utilsDir)
];

if (issues.length === 0) {
  console.log('✅ All files are using the correct auth context!\n');
} else {
  console.log('❌ Found issues:\n');
  
  issues.forEach(issue => {
    console.log(`File: ${issue.file}`);
    console.log(`Status: ${issue.status}`);
    if (issue.found) {
      console.log(`Found: ${issue.found} (line ${issue.line})`);
      console.log(`Should be: ${CORRECT_IMPORT}`);
    }
    if (issue.reason) {
      console.log(`Reason: ${issue.reason}`);
    }
    console.log('---');
  });
  
  console.log(`\n❌ Total issues found: ${issues.length}`);
  console.log('\n🔧 Run this command to fix:');
  console.log('   node fix-auth-imports.js\n');
}

// Return exit code
process.exit(issues.filter(i => i.status === 'error').length);
