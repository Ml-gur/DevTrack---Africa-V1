#!/usr/bin/env node

/**
 * Supabase Setup Verification Script
 * Verifies that the Supabase environment is correctly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DevTrack Africa - Supabase Setup Verification\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: .env file exists
console.log('📝 Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('  ❌ .env file not found');
  console.log('     Create one from .env.example');
  hasErrors = true;
} else {
  console.log('  ✅ .env file exists');
  
  // Read and parse .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
  
  // Check required variables
  const required = [
    'VITE_SUPABASE_PROJECT_ID',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  console.log('\n🔑 Checking environment variables...');
  required.forEach(varName => {
    if (!envVars[varName]) {
      console.log(`  ❌ ${varName} is not set`);
      hasErrors = true;
    } else if (envVars[varName].includes('your_') || envVars[varName].includes('_here')) {
      console.log(`  ⚠️  ${varName} contains placeholder value`);
      hasWarnings = true;
    } else {
      console.log(`  ✅ ${varName} is set`);
    }
  });
}

// Check 2: .gitignore includes .env
console.log('\n📋 Checking .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  console.log('  ⚠️  .gitignore not found - .env might be committed!');
  hasWarnings = true;
} else {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env')) {
    console.log('  ✅ .env is in .gitignore');
  } else {
    console.log('  ❌ .env is NOT in .gitignore - add it now!');
    hasErrors = true;
  }
}

// Check 3: Supabase client configuration
console.log('\n🔧 Checking Supabase client...');
const supabaseClientPath = path.join(__dirname, 'lib', 'supabaseClient.ts');
if (!fs.existsSync(supabaseClientPath)) {
  console.log('  ❌ lib/supabaseClient.ts not found');
  hasErrors = true;
} else {
  const clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
  if (clientContent.includes('import.meta.env.VITE_SUPABASE')) {
    console.log('  ✅ Using environment variables');
  } else {
    console.log('  ⚠️  May be using hardcoded credentials');
    hasWarnings = true;
  }
}

// Check 4: Offline functionality files
console.log('\n💾 Checking offline functionality...');
const offlineFiles = [
  'utils/offline-sync-manager.ts',
  'utils/offline-database-wrapper.ts',
  'utils/supabase/config.ts'
];

offlineFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} exists`);
  } else {
    console.log(`  ❌ ${file} not found`);
    hasErrors = true;
  }
});

// Check 5: Service worker
console.log('\n🔄 Checking service worker...');
const swPath = path.join(__dirname, 'public', 'service-worker.js');
if (!fs.existsSync(swPath)) {
  console.log('  ❌ public/service-worker.js not found');
  hasErrors = true;
} else {
  console.log('  ✅ Service worker exists');
}

// Check 6: Testing component
console.log('\n🧪 Checking testing components...');
const testerPath = path.join(__dirname, 'components', 'OfflineFunctionalityTester.tsx');
if (fs.existsSync(testerPath)) {
  console.log('  ✅ OfflineFunctionalityTester.tsx exists');
} else {
  console.log('  ⚠️  OfflineFunctionalityTester.tsx not found');
  hasWarnings = true;
}

// Check 7: Documentation
console.log('\n📚 Checking documentation...');
const docFiles = [
  'SUPABASE_ENV_SETUP_GUIDE.md',
  '.env.example'
];

docFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} exists`);
  } else {
    console.log(`  ⚠️  ${file} not found`);
    hasWarnings = true;
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (!hasErrors && !hasWarnings) {
  console.log('\n✅ All checks passed! Your setup is perfect.\n');
  console.log('Next steps:');
  console.log('  1. Run: npm install');
  console.log('  2. Run: npm run dev');
  console.log('  3. Test offline functionality in the browser');
  console.log('  4. Use the OfflineFunctionalityTester component');
  console.log('\nReady for production! 🚀\n');
  process.exit(0);
} else {
  if (hasErrors) {
    console.log('\n❌ ERRORS FOUND - Please fix before continuing\n');
  }
  if (hasWarnings) {
    console.log('\n⚠️  WARNINGS FOUND - Review and address if needed\n');
  }
  
  console.log('📖 For detailed setup instructions, see:');
  console.log('   SUPABASE_ENV_SETUP_GUIDE.md\n');
  
  if (hasErrors) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
