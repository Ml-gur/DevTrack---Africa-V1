#!/usr/bin/env node

/**
 * Verify Build Configuration
 * Ensures Vite and Vercel are configured to use 'build' directory
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Build Configuration...\n');

let hasErrors = false;

// Check 1: Verify vercel.json
console.log('📦 Checking vercel.json...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf-8'));
  
  if (vercelConfig.outputDirectory === 'build') {
    console.log('  ✅ Output directory: build');
  } else {
    console.log(`  ❌ Output directory: ${vercelConfig.outputDirectory} (should be 'build')`);
    hasErrors = true;
  }
} catch (error) {
  console.log('  ❌ Error reading vercel.json:', error.message);
  hasErrors = true;
}

// Check 2: Verify vite.config.ts
console.log('\n⚡ Checking vite.config.ts...');
try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf-8');
  
  if (viteConfig.includes("outDir: 'build'")) {
    console.log('  ✅ Build output directory: build');
  } else if (viteConfig.includes('outDir')) {
    console.log('  ⚠️  outDir specified but not set to "build"');
    hasErrors = true;
  } else {
    console.log('  ⚠️  outDir not explicitly set (defaults to "dist")');
    hasErrors = true;
  }
} catch (error) {
  console.log('  ❌ Error reading vite.config.ts:', error.message);
  hasErrors = true;
}

// Check 3: Verify .gitignore includes build directory
console.log('\n📝 Checking .gitignore...');
try {
  if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf-8');
    
    if (gitignore.includes('build') || gitignore.includes('build/')) {
      console.log('  ✅ build/ directory in .gitignore');
    } else {
      console.log('  ⚠️  build/ directory not in .gitignore (recommended to add)');
    }
  } else {
    console.log('  ⚠️  .gitignore not found');
  }
} catch (error) {
  console.log('  ⚠️  Error reading .gitignore:', error.message);
}

// Check 4: PWA files exist
console.log('\n📱 Checking PWA files...');
const pwaFiles = [
  'public/service-worker.js',
  'public/site.webmanifest'
];

pwaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - Missing`);
    hasErrors = true;
  }
});

// Check 5: Verify PWA meta tags in index.html
console.log('\n🌐 Checking index.html for PWA tags...');
try {
  const indexHtml = fs.readFileSync('index.html', 'utf-8');
  
  const requiredTags = [
    { tag: 'manifest', name: 'Manifest link' },
    { tag: 'theme-color', name: 'Theme color' },
    { tag: 'apple-mobile-web-app-capable', name: 'Apple mobile capable' }
  ];
  
  requiredTags.forEach(({ tag, name }) => {
    if (indexHtml.includes(tag)) {
      console.log(`  ✅ ${name}`);
    } else {
      console.log(`  ❌ ${name} - Missing`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log('  ❌ Error reading index.html:', error.message);
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (!hasErrors) {
  console.log('\n✅ ALL CHECKS PASSED!\n');
  console.log('Configuration is correct:');
  console.log('- Vercel will deploy from: build/');
  console.log('- Vite will build to: build/');
  console.log('- PWA files are present');
  console.log('- Ready for deployment!\n');
  console.log('Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test: npm run preview');
  console.log('3. Deploy: git push origin main\n');
  process.exit(0);
} else {
  console.log('\n❌ CONFIGURATION ERRORS FOUND\n');
  console.log('Please fix the errors above before deploying.\n');
  process.exit(1);
}
