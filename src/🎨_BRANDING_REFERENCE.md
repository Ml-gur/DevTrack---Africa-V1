# 🎨 DevTrack Africa - Branding Reference
## Visual Identity & Asset Guide

---

## 🌍 Brand Concept

**DevTrack Africa** combines African heritage with modern software development, represented through:

- **Africa Silhouette** - Representing the continent and our target audience
- **Code Brackets `< >`** - Symbolizing software development
- **Purple Gradient** - Modern, tech-forward color scheme
- **Professional Typography** - Clean, readable, trustworthy

---

## 🎨 Color Palette

### Primary Colors

```
Purple Primary:   #8B5CF6  (Vibrant violet)
Purple Secondary: #6366F1  (Indigo blue)
```

### Secondary Colors

```
White:           #FFFFFF  (Clean backgrounds)
Light Purple:    #E0E7FF  (Accents and overlays)
Dark Gray:       #1F2937  (Text)
Medium Gray:     #718096  (Secondary text)
```

### Gradient

```css
background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
```

---

## 📐 Logo Specifications

### Full Logo (`/public/logo.svg`)

**Dimensions:** 200×60 pixels  
**Usage:** Navigation bars, headers, marketing materials  
**Components:**
- Icon mark (circular, 60×60)
- "DevTrack" text (bold, 18px)
- "AFRICA" subtitle (semibold, 14px, purple, letter-spacing: 1.5px)

**Spacing:**
- Icon to text: 5px gap
- Text vertical center-aligned

**Do's:**
- Use on white or light backgrounds
- Maintain aspect ratio when resizing
- Keep minimum width of 100px for readability

**Don'ts:**
- Don't change colors (use as-is)
- Don't separate icon from text
- Don't distort or stretch

---

## 🎯 Icon Design

### Favicon (`/public/favicon.svg`)

**Dimensions:** 64×64 pixels  
**Format:** SVG (scalable)  
**Design Elements:**
1. Circular purple gradient background
2. White Africa continent silhouette (centered)
3. Code brackets overlay (`< >`)
4. Center dot detail

**Usage:**
- Browser tabs
- Bookmarks
- Quick reference icon

---

## 📱 PWA Icons

All PWA icons follow the same design system:

### Icon Sizes Required

| Size    | File Name              | Purpose                    |
|---------|------------------------|----------------------------|
| 16×16   | favicon-16x16.png      | Browser tabs (small)       |
| 32×32   | favicon-32x32.png      | Browser tabs (standard)    |
| 180×180 | apple-touch-icon.png   | iOS home screen            |
| 192×192 | icon-192x192.png       | Android home screen        |
| 512×512 | icon-512x512.png       | Splash screens, app drawer |

### Design Consistency

All icons share:
- Purple gradient background (#8B5CF6 → #6366F1)
- Africa continent silhouette in white
- Code brackets in light purple (#E0E7FF)
- Center dot detail
- Rounded or circular shape options

---

## 🖼️ Icon Variations

The icon generator (`/public/generate-pwa-icons.html`) supports three styles:

### 1. Square (Default)
- Clean, modern look
- Works well for all sizes
- Professional appearance

### 2. Rounded Square
- Softer edges (15% border radius)
- Modern mobile aesthetic
- Recommended for PWA icons

### 3. Circle
- Bold, distinctive
- Stands out on home screens
- Great for brand recognition

**Recommendation:** Use **Rounded Square** for the best balance of professionalism and modern design.

---

## 📏 Minimum Size Requirements

### Logo
- **Minimum width:** 100px
- **Ideal range:** 150-250px
- **Maximum:** No limit (SVG scales)

### Icons
- **Never scale down** below specified sizes
- **Always use exact sizes** for PWA (16, 32, 180, 192, 512)
- **Maintain aspect ratio** (1:1 square)

---

## 🎭 Usage Guidelines

### Where to Use the Full Logo

✅ **Recommended:**
- Website navigation bar
- Landing page header
- Email signatures
- Marketing materials
- Slide presentations
- Social media cover photos

❌ **Not Recommended:**
- Small buttons (use icon only)
- Favicons (use SVG favicon)
- App icons (use PWA icons)

### Where to Use Icon Only

✅ **Recommended:**
- Browser tabs (favicon)
- Mobile home screens (PWA icons)
- App shortcuts
- Small UI elements
- Social media profile pictures

---

## 🌐 Social Media Specifications

### Profile Picture
**Size:** 512×512 icon (circular)  
**File:** `icon-512x512.png`  
**Platforms:** Twitter, LinkedIn, GitHub, Facebook

### Cover Photo
**Dimensions:** Create using logo + gradient  
**Recommended layout:**
- Full width gradient background
- Logo centered or left-aligned
- Tagline: "Project Management for African Developers"

---

## 💾 File Locations

```
/public/
├── favicon.svg              # SVG favicon (64×64)
├── logo.svg                 # Full logo (200×60)
├── favicon-16x16.png        # Generated PWA icon
├── favicon-32x32.png        # Generated PWA icon
├── apple-touch-icon.png     # Generated PWA icon
├── icon-192x192.png         # Generated PWA icon
├── icon-512x512.png         # Generated PWA icon
└── generate-pwa-icons.html  # Icon generator tool
```

---

## 🛠️ How to Generate Icons

1. Open `/public/generate-pwa-icons.html` in browser
2. Icons auto-generate with DevTrack Africa branding
3. Adjust style if desired (Square/Rounded/Circle)
4. Click "Download All Icons"
5. Move 5 PNG files to `/public` folder

**Settings (Pre-configured):**
- Background: Purple gradient (#8B5CF6 → #6366F1)
- Design: Africa silhouette + code brackets
- Text Color: White/Light Purple
- Style: Rounded (recommended)

---

## 🎨 Brand Personality

**Words that describe DevTrack Africa:**
- Professional
- Modern
- Pan-African
- Tech-forward
- Empowering
- Reliable
- Innovative
- Community-driven

**Visual mood:**
- Clean and uncluttered
- Bold but approachable
- Technical but accessible
- African but universal
- Premium but accessible

---

## 📐 Typography

### Primary Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 
             'Segoe UI', 'Roboto', 'Oxygen', 
             'Ubuntu', 'Cantarell', sans-serif;
```

### Logo Text Specifications

**"DevTrack"**
- Weight: 700 (Bold)
- Size: 18px
- Color: #1F2937 (Dark Gray)

**"AFRICA"**
- Weight: 600 (Semibold)
- Size: 14px
- Color: #8B5CF6 (Purple Primary)
- Letter-spacing: 1.5px
- Transform: Uppercase

---

## 🖼️ Design Elements

### Africa Silhouette
- Simplified, recognizable continent shape
- Centered in circular frame
- White fill with 95% opacity
- Smooth curves, no harsh edges

### Code Brackets
- Stroke: #E0E7FF (Light Purple)
- Width: 2.5px
- Style: Rounded caps and joins
- Position: Overlaying Africa silhouette
- Pattern: `< >` with center dot

### Gradient Direction
- Start: Top-left (#8B5CF6)
- End: Bottom-right (#6366F1)
- Angle: 135 degrees

---

## ✅ Quality Checklist

When using DevTrack Africa branding, ensure:

- [ ] Colors match exact hex codes
- [ ] Africa silhouette is clearly visible
- [ ] Code brackets are present (for icons)
- [ ] Gradient flows top-left to bottom-right
- [ ] Logo maintains readability at small sizes
- [ ] Icons are exact required dimensions
- [ ] Purple tones are consistent across all assets
- [ ] White space is preserved around logo

---

## 🎯 Quick Reference

**Primary Color:** `#8B5CF6`  
**Logo File:** `/public/logo.svg`  
**Icon File:** `/public/favicon.svg`  
**Generator:** `/public/generate-pwa-icons.html`  
**Style:** Modern, African, Tech-forward  
**Mood:** Professional yet approachable  

---

**Last Updated:** November 6, 2025  
**Version:** 1.0  
**Status:** Production Ready 🚀
