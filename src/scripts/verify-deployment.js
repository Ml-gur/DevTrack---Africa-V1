#!/usr/bin/env node

/**
 * DevTrack Africa - Deployment Verification Script
 * Checks if the project is ready for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DevTrack Africa - Deployment Verification\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'index.html',
  'vercel.json',
  'App.tsx',
  'lib/supabaseClient.ts',
  'utils/supabase/info.tsx',
  'contexts/SupabaseAuthContext.tsx',
  'utils/supabase-database.ts',
  'supabase/migrations/001_initial_schema.sql',
  'supabase/functions/server/index.tsx',
  'public/service-worker.js',
  'public/site.webmanifest'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Check 2: Package.json configuration
console.log('\n📦 Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

if (packageJson.scripts && packageJson.scripts.build) {
  console.log('  ✅ Build script exists');
} else {
  console.log('  ❌ Build script missing');
  hasErrors = true;
}

if (packageJson.dependencies && packageJson.dependencies['@supabase/supabase-js']) {
  console.log('  ✅ Supabase dependency installed');
} else {
  console.log('  ❌ Supabase dependency missing');
  hasErrors = true;
}

// Check 3: Supabase configuration
console.log('\n☁️  Checking Supabase configuration...');
const supabaseInfoPath = 'utils/supabase/info.tsx';
if (fs.existsSync(supabaseInfoPath)) {
  const supabaseInfo = fs.readFileSync(supabaseInfoPath, 'utf-8');
  
  if (supabaseInfo.includes('projectId') && supabaseInfo.includes('publicAnonKey')) {
    console.log('  ✅ Supabase credentials configured');
    
    // Check if using placeholder values
    if (supabaseInfo.includes('your-project-id') || supabaseInfo.includes('your-anon-key')) {
      console.log('  ⚠️  WARNING: Using placeholder Supabase credentials');
      hasWarnings = true;
    }
  } else {
    console.log('  ❌ Supabase credentials not properly configured');
    hasErrors = true;
  }
} else {
  console.log('  ❌ Supabase info file missing');
  hasErrors = true;
}

// Check 4: TypeScript configuration
console.log('\n📝 Checking TypeScript configuration...');
if (fs.existsSync('tsconfig.json')) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
    if (tsconfig.compilerOptions) {
      console.log('  ✅ TypeScript configuration valid');
    }
  } catch (error) {
    console.log('  ❌ TypeScript configuration invalid');
    hasErrors = true;
  }
}

// Check 5: Vite configuration
console.log('\n⚡ Checking Vite configuration...');
if (fs.existsSync('vite.config.ts')) {
  console.log('  ✅ Vite configuration exists');
} else {
  console.log('  ❌ Vite configuration missing');
  hasErrors = true;
}

// Check 6: PWA files
console.log('\n📱 Checking PWA configuration...');
const pwaFiles = [
  'public/service-worker.js',
  'public/site.webmanifest'
];

pwaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - Missing (PWA features may not work)`);
    hasWarnings = true;
  }
});

// Check 7: Vercel configuration
console.log('\n🔺 Checking Vercel configuration...');
if (fs.existsSync('vercel.json')) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf-8'));
    
    if (vercelConfig.buildCommand) {
      console.log('  ✅ Build command configured');
    }
    
    if (vercelConfig.outputDirectory) {
      console.log('  ✅ Output directory configured');
    }
    
    if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
      console.log('  ✅ SPA routing configured');
    }
    
    if (vercelConfig.headers && vercelConfig.headers.length > 0) {
      console.log('  ✅ Security headers configured');
    }
  } catch (error) {
    console.log('  ❌ vercel.json is invalid JSON');
    hasErrors = true;
  }
} else {
  console.log('  ❌ vercel.json missing');
  hasErrors = true;
}

// Check 8: Environment variables template
console.log('\n🔐 Checking environment configuration...');
if (fs.existsSync('.env.example')) {
  console.log('  ✅ Environment variables template exists');
} else {
  console.log('  ⚠️  .env.example missing (not critical)');
  hasWarnings = true;
}

// Check 9: Node version
console.log('\n🟢 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 18) {
  console.log(`  ✅ Node.js ${nodeVersion} (compatible)`);
} else {
  console.log(`  ⚠️  Node.js ${nodeVersion} (recommend 18.x or higher)`);
  hasWarnings = true;
}

// Check 10: Build test
console.log('\n🔨 Running build test...');
console.log('  ℹ️  Skipping actual build (run "npm run build" manually to test)');

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 DEPLOYMENT VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (!hasErrors && !hasWarnings) {
  console.log('\n✅ ALL CHECKS PASSED! Ready for deployment.\n');
  console.log('Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test locally: npm run preview');
  console.log('3. Deploy to Vercel');
  console.log('\nSee VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions.\n');
  process.exit(0);
} else if (!hasErrors && hasWarnings) {
  console.log('\n⚠️  CHECKS PASSED WITH WARNINGS\n');
  console.log('The project will likely deploy successfully, but review warnings above.');
  console.log('\nNext steps:');
  console.log('1. Review warnings');
  console.log('2. Run: npm run build');
  console.log('3. Deploy to Vercel');
  console.log('\nSee VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions.\n');
  process.exit(0);
} else {
  console.log('\n❌ DEPLOYMENT NOT READY\n');
  console.log('Please fix the errors above before deploying.');
  console.log('\nCommon fixes:');
  console.log('- Install dependencies: npm install');
  console.log('- Configure Supabase credentials in utils/supabase/info.tsx');
  console.log('- Ensure all required files exist');
  console.log('\nSee VERCEL_DEPLOYMENT_GUIDE.md for help.\n');
  process.exit(1);
}
