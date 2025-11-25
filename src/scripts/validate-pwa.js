#!/usr/bin/env node

/**
 * PWA Validation Script for DevTrack Africa
 * Validates all PWA requirements before deployment
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_ICONS = [
  'icon-72x72.png',
  'icon-96x96.png',
  'icon-128x128.png',
  'icon-144x144.png',
  'icon-152x152.png',
  'icon-192x192.png',
  'icon-384x384.png',
  'icon-512x512.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png'
];

const REQUIRED_FILES = [
  'manifest.json',
  'site.webmanifest',
  'service-worker.js',
  'sw.js'
];

let errors = [];
let warnings = [];
let passes = [];

console.log('🔍 Validating PWA Setup for DevTrack Africa...\n');

// Check if public folder exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  errors.push('Public directory not found!');
  process.exit(1);
}

// Check manifest files
console.log('📄 Checking manifest files...');
REQUIRED_FILES.forEach(file => {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    passes.push(`✅ ${file} found`);
    
    // Validate manifest.json content
    if (file === 'manifest.json' || file === 'site.webmanifest') {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const manifest = JSON.parse(content);
        
        // Check required manifest properties
        const requiredProps = ['name', 'short_name', 'start_url', 'display', 'icons'];
        requiredProps.forEach(prop => {
          if (manifest[prop]) {
            passes.push(`  ✅ ${file} has "${prop}"`);
          } else {
            errors.push(`  ❌ ${file} missing "${prop}"`);
          }
        });

        // Check theme color
        if (manifest.theme_color) {
          if (manifest.theme_color === '#10b981') {
            passes.push(`  ✅ Theme color is correct (#10b981)`);
          } else {
            warnings.push(`  ⚠️  Theme color is ${manifest.theme_color}, expected #10b981`);
          }
        } else {
          warnings.push(`  ⚠️  No theme color specified`);
        }

        // Check icons array
        if (manifest.icons && manifest.icons.length > 0) {
          passes.push(`  ✅ Manifest has ${manifest.icons.length} icons`);
          
          // Check for 192x192 and 512x512
          const has192 = manifest.icons.some(icon => icon.sizes === '192x192');
          const has512 = manifest.icons.some(icon => icon.sizes === '512x512');
          
          if (has192 && has512) {
            passes.push(`  ✅ Has required 192x192 and 512x512 icons`);
          } else {
            errors.push(`  ❌ Missing required 192x192 or 512x512 icons in manifest`);
          }
        } else {
          errors.push(`  ❌ No icons in manifest`);
        }

      } catch (e) {
        errors.push(`  ❌ Invalid JSON in ${file}: ${e.message}`);
      }
    }
  } else {
    // sw.js is optional (we use service-worker.js)
    if (file === 'sw.js') {
      warnings.push(`⚠️  ${file} not found (optional)`);
    } else {
      errors.push(`❌ ${file} not found`);
    }
  }
});

// Check icon files
console.log('\n🎨 Checking icon files...');
let foundIcons = 0;
let missingIcons = [];

REQUIRED_ICONS.forEach(icon => {
  const iconPath = path.join(publicDir, icon);
  if (fs.existsSync(iconPath)) {
    foundIcons++;
    passes.push(`✅ ${icon} found`);
  } else {
    missingIcons.push(icon);
    warnings.push(`⚠️  ${icon} not found - generate it!`);
  }
});

console.log(`\nFound ${foundIcons}/${REQUIRED_ICONS.length} required icons`);

// Check service worker
console.log('\n⚙️  Checking service worker...');
const swPath = path.join(publicDir, 'service-worker.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Check for essential service worker features
  const features = {
    'install event': /addEventListener\(['"]install/,
    'activate event': /addEventListener\(['"]activate/,
    'fetch event': /addEventListener\(['"]fetch/,
    'cache storage': /caches\.open/,
    'cache versioning': /CACHE.*VERSION|VERSION.*CACHE/i
  };

  Object.entries(features).forEach(([feature, regex]) => {
    if (regex.test(swContent)) {
      passes.push(`✅ Service worker has ${feature}`);
    } else {
      warnings.push(`⚠️  Service worker missing ${feature}`);
    }
  });
} else {
  errors.push('❌ service-worker.js not found');
}

// Check index.html
console.log('\n📝 Checking index.html...');
const indexPath = path.join(process.cwd(), 'index.html');
if (fs.existsSync(indexPath)) {
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check for PWA meta tags
  const metaTags = [
    { name: 'theme-color', pattern: /<meta.*name=["']theme-color["']/ },
    { name: 'apple-mobile-web-app-capable', pattern: /<meta.*name=["']apple-mobile-web-app-capable["']/ },
    { name: 'viewport', pattern: /<meta.*name=["']viewport["']/ },
    { name: 'manifest link', pattern: /<link.*rel=["']manifest["']/ },
    { name: 'apple-touch-icon', pattern: /<link.*rel=["']apple-touch-icon["']/ }
  ];

  metaTags.forEach(({ name, pattern }) => {
    if (pattern.test(htmlContent)) {
      passes.push(`✅ index.html has ${name}`);
    } else {
      errors.push(`❌ index.html missing ${name}`);
    }
  });

  // Check for service worker registration
  if (/navigator\.serviceWorker\.register/.test(htmlContent)) {
    passes.push('✅ Service worker registration script found');
  } else {
    errors.push('❌ No service worker registration in index.html');
  }
} else {
  errors.push('❌ index.html not found');
}

// Check for PWA components
console.log('\n🧩 Checking PWA components...');
const componentsDir = path.join(process.cwd(), 'components');
const pwaComponents = [
  'PWAInstallPrompt.tsx',
  'PWAUpdatePrompt.tsx',
  'OfflineIndicator.tsx'
];

pwaComponents.forEach(component => {
  const componentPath = path.join(componentsDir, component);
  if (fs.existsSync(componentPath)) {
    passes.push(`✅ ${component} exists`);
  } else {
    warnings.push(`⚠️  ${component} not found`);
  }
});

// Check for PWA hooks
const hooksDir = path.join(componentsDir, 'hooks');
const hookPath = path.join(hooksDir, 'usePWA.ts');
if (fs.existsSync(hookPath)) {
  passes.push('✅ usePWA.ts hook exists');
} else {
  warnings.push('⚠️  usePWA.ts hook not found');
}

// Check for PWA utilities
const utilsDir = path.join(process.cwd(), 'utils');
const pwaDetectionPath = path.join(utilsDir, 'pwa-detection.ts');
if (fs.existsSync(pwaDetectionPath)) {
  passes.push('✅ pwa-detection.ts utility exists');
} else {
  warnings.push('⚠️  pwa-detection.ts utility not found');
}

// Generate report
console.log('\n' + '='.repeat(60));
console.log('📊 PWA VALIDATION REPORT');
console.log('='.repeat(60));

console.log(`\n✅ PASSED: ${passes.length} checks`);
passes.forEach(pass => console.log('  ' + pass));

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS: ${warnings.length}`);
  warnings.forEach(warning => console.log('  ' + warning));
}

if (errors.length > 0) {
  console.log(`\n❌ ERRORS: ${errors.length}`);
  errors.forEach(error => console.log('  ' + error));
}

// Final verdict
console.log('\n' + '='.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 PERFECT! Your PWA setup is complete and ready!');
  console.log('\n✅ Next steps:');
  console.log('  1. Run: npm run build');
  console.log('  2. Run: npm run preview');
  console.log('  3. Test on mobile devices');
  console.log('  4. Deploy to production');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('✅ GOOD! PWA setup is valid, but has some warnings.');
  console.log('\n📝 Recommendations:');
  if (missingIcons.length > 0) {
    console.log('  - Generate missing icons: open public/generate-all-pwa-assets.html');
  }
  console.log('  - Review warnings above');
  console.log('  - Test PWA installation on real devices');
  process.exit(0);
} else {
  console.log('❌ FAILED! PWA setup has critical errors.');
  console.log('\n🔧 Action required:');
  console.log('  - Fix all errors listed above');
  console.log('  - Re-run this validation script');
  console.log('  - Check the PWA setup guide: 📱_PWA_COMPLETE_SETUP_GUIDE.md');
  process.exit(1);
}
