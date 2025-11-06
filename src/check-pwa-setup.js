#!/usr/bin/env node

/**
 * PWA Setup Checker
 * Verifies all PWA requirements are met
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking PWA Setup...\n');

let allGood = true;
const issues = [];
const warnings = [];

// Check files exist
const requiredFiles = [
  { path: 'public/site.webmanifest', name: 'Manifest file' },
  { path: 'public/service-worker.js', name: 'Service Worker' },
  { path: 'index.html', name: 'Index HTML' },
];

const iconFiles = [
  { path: 'public/favicon-16x16.png', name: '16x16 favicon', required: false },
  { path: 'public/favicon-32x32.png', name: '32x32 favicon', required: false },
  { path: 'public/apple-touch-icon.png', name: 'Apple touch icon', required: false },
  { path: 'public/icon-192x192.png', name: '192x192 icon', required: true },
  { path: 'public/icon-512x512.png', name: '512x512 icon', required: true },
];

console.log('📁 Checking Required Files:\n');

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file.path));
  if (exists) {
    console.log(`  ✅ ${file.name}`);
  } else {
    console.log(`  ❌ ${file.name} - MISSING`);
    issues.push(`Missing ${file.name} at ${file.path}`);
    allGood = false;
  }
});

console.log('\n🎨 Checking Icon Files:\n');

iconFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file.path));
  if (exists) {
    console.log(`  ✅ ${file.name}`);
  } else {
    if (file.required) {
      console.log(`  ❌ ${file.name} - MISSING (REQUIRED!)`);
      issues.push(`Missing required icon: ${file.name}`);
      allGood = false;
    } else {
      console.log(`  ⚠️  ${file.name} - Missing (optional)`);
      warnings.push(`Optional icon missing: ${file.name}`);
    }
  }
});

// Check manifest content
console.log('\n📋 Checking Manifest:\n');

try {
  const manifestPath = path.join(process.cwd(), 'public/site.webmanifest');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.name) {
      console.log(`  ✅ Name: "${manifest.name}"`);
    } else {
      console.log('  ❌ Name missing');
      issues.push('Manifest missing "name" field');
      allGood = false;
    }
    
    if (manifest.short_name) {
      console.log(`  ✅ Short name: "${manifest.short_name}"`);
    } else {
      console.log('  ⚠️  Short name missing');
      warnings.push('Manifest missing "short_name" field');
    }
    
    if (manifest.start_url) {
      console.log(`  ✅ Start URL: "${manifest.start_url}"`);
    } else {
      console.log('  ❌ Start URL missing');
      issues.push('Manifest missing "start_url" field');
      allGood = false;
    }
    
    if (manifest.display) {
      console.log(`  ✅ Display: "${manifest.display}"`);
    } else {
      console.log('  ⚠️  Display mode missing');
      warnings.push('Manifest missing "display" field');
    }
    
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`  ✅ Icons defined: ${manifest.icons.length} icons`);
      
      // Check for required icon sizes
      const has192 = manifest.icons.some(icon => icon.sizes === '192x192');
      const has512 = manifest.icons.some(icon => icon.sizes === '512x512');
      
      if (has192) {
        console.log('    ✅ 192x192 icon defined');
      } else {
        console.log('    ❌ 192x192 icon NOT defined');
        issues.push('Manifest missing 192x192 icon');
        allGood = false;
      }
      
      if (has512) {
        console.log('    ✅ 512x512 icon defined');
      } else {
        console.log('    ❌ 512x512 icon NOT defined');
        issues.push('Manifest missing 512x512 icon');
        allGood = false;
      }
    } else {
      console.log('  ❌ No icons defined');
      issues.push('Manifest has no icons');
      allGood = false;
    }
  }
} catch (error) {
  console.log('  ❌ Error reading manifest:', error.message);
  issues.push('Error reading manifest file');
  allGood = false;
}

// Check index.html
console.log('\n📄 Checking Index HTML:\n');

try {
  const htmlPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    if (html.includes('site.webmanifest')) {
      console.log('  ✅ Manifest linked');
    } else {
      console.log('  ❌ Manifest NOT linked');
      issues.push('index.html missing manifest link');
      allGood = false;
    }
    
    if (html.includes('theme-color')) {
      console.log('  ✅ Theme color defined');
    } else {
      console.log('  ⚠️  Theme color missing');
      warnings.push('index.html missing theme-color meta tag');
    }
    
    if (html.includes('apple-mobile-web-app-capable')) {
      console.log('  ✅ iOS web app capable');
    } else {
      console.log('  ⚠️  iOS web app capable tag missing');
      warnings.push('index.html missing apple-mobile-web-app-capable');
    }
  }
} catch (error) {
  console.log('  ❌ Error reading index.html:', error.message);
  issues.push('Error reading index.html');
  allGood = false;
}

// Check App.tsx for service worker registration
console.log('\n⚙️  Checking Service Worker Registration:\n');

try {
  const appPath = path.join(process.cwd(), 'App.tsx');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    if (appContent.includes('serviceWorker.register') || appContent.includes('navigator.serviceWorker')) {
      console.log('  ✅ Service Worker registration found in App.tsx');
    } else {
      console.log('  ❌ Service Worker registration NOT found');
      issues.push('App.tsx missing service worker registration');
      allGood = false;
    }
    
    if (appContent.includes('PWAInstallPrompt')) {
      console.log('  ✅ PWAInstallPrompt component used');
    } else {
      console.log('  ⚠️  PWAInstallPrompt component not used');
      warnings.push('Consider using PWAInstallPrompt component');
    }
  }
} catch (error) {
  console.log('  ⚠️  Could not check App.tsx:', error.message);
  warnings.push('Could not verify service worker registration');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY:\n');

if (allGood && issues.length === 0) {
  console.log('✅ ✅ ✅  PWA SETUP COMPLETE! ✅ ✅ ✅\n');
  console.log('Your app is ready to be installed as a PWA!\n');
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings (optional):');
    warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }
  
  console.log('🚀 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Open in browser');
  console.log('   3. Look for install button');
  console.log('   4. Install and test!');
} else {
  console.log('❌ PWA SETUP INCOMPLETE\n');
  console.log('🔧 Issues to fix:\n');
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
  
  console.log('\n💡 How to fix:');
  
  if (issues.some(i => i.includes('icon'))) {
    console.log('\n   📱 Missing icons:');
    console.log('      Open: http://localhost:5173/generate-pwa-icons.html');
    console.log('      Click: "Download All Icons"');
    console.log('      Move files to: /public folder');
  }
  
  if (issues.some(i => i.includes('Service Worker'))) {
    console.log('\n   ⚙️  Service Worker issue:');
    console.log('      Check that /public/service-worker.js exists');
    console.log('      Check App.tsx has service worker registration');
  }
  
  if (issues.some(i => i.includes('Manifest'))) {
    console.log('\n   📋 Manifest issue:');
    console.log('      Check /public/site.webmanifest exists');
    console.log('      Verify it has name, icons, and start_url');
  }
  
  console.log('\n📚 Full guide: /🚀_PWA_COMPLETE_SETUP.md');
}

console.log('\n' + '='.repeat(50) + '\n');

// Exit with error code if issues found
process.exit(allGood ? 0 : 1);
