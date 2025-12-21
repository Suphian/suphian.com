# 📁 Assets Folder

This folder contains all visual and media assets for the site. Everything is organized by type for easy management.

## 📂 Folder Structure

```
assets/
├── textures/          → Grain overlays, patterns, and texture images
├── images/            → General images (headshots, illustrations, etc.)
├── logos/             → Company and brand logos (SVG format preferred)
├── projects/          → Project showcase images and screenshots
├── audio/             → Audio files (pronunciations, sound effects)
└── optimized/         → Optimized/compressed versions of images (WebP format)
```

## 🎨 Asset Guidelines

### Textures
- **Purpose**: Global overlays, grain effects, patterns
- **Format**: PNG (for transparency) or WebP
- **Naming**: Descriptive names like `grain-texture.png`, `paper-overlay.png`
- **Usage**: Applied globally via CSS or as background overlays

### Images
- **Purpose**: General photography, illustrations, hero images
- **Format**: JPG (photos), PNG (transparency), WebP (optimized)
- **Naming**: Descriptive names like `headshot.jpg`, `hero-image.webp`
- **Usage**: Direct references in components

### Logos
- **Purpose**: Company logos, brand marks
- **Format**: SVG (preferred) or PNG
- **Naming**: Company name like `google-logo.svg`, `capitalg-logo.svg`
- **Usage**: Inline SVGs or image tags

### Projects
- **Purpose**: Project screenshots, case study images
- **Format**: JPG or WebP
- **Naming**: `project1.jpg`, `project2.jpg`, or descriptive names
- **Usage**: Project showcase components

### Audio
- **Purpose**: Pronunciation guides, sound effects
- **Format**: M4A, WAV, MP3
- **Naming**: Descriptive like `suphian-pronunciation.m4a`
- **Usage**: Audio elements in components

## 🚀 Adding New Assets

1. **Choose the right folder** based on asset type
2. **Use descriptive filenames** (lowercase, hyphens for spaces)
3. **Optimize before adding**:
   - Images: Compress and use WebP when possible
   - SVGs: Minify and optimize paths
   - Audio: Use compressed formats (M4A, MP3)
4. **Update references** in code if moving existing assets
5. **Commit to GitHub** so the asset is available in all environments

## 📝 Current Assets

### Textures
- `grain-texture.png` - Global grain overlay (seamless, subtle)

### Images
- `headshot.jpg` - Professional headshot

### Logos
- `google-logo.svg` - Google logo
- `capitalg-logo.svg` - CapitalG logo
- `gv-logo.svg` - GV logo
- `huge-logo.svg` - Huge logo
- `youtube-logo.svg` - YouTube logo

### Projects
- `project1.jpg` through `project5.jpg` - Project showcase images

### Audio
- `suphian-pronunciation.m4a` - Name pronunciation guide
- `suphian-pronunciation.wav` - Name pronunciation guide (WAV format)

## 💡 Tips

- **Keep file sizes reasonable** - Large assets slow down the site
- **Use WebP for photos** - Better compression than JPG/PNG
- **SVG for logos** - Scalable and small file size
- **Optimize before committing** - Use tools like ImageOptim, Squoosh, or TinyPNG
- **Version control** - All assets should be in Git for consistency across environments

---

**Last Updated**: When assets are added or reorganized

