/**
 * Icon Generator for Polaris PWA
 * 
 * Generates all required icon sizes from the source SVG.
 * 
 * Usage:
 *   npm run generate-icons
 * 
 * Requirements:
 *   npm install sharp --save-dev
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SOURCE_SVG = path.join(__dirname, "../public/icon.svg");
const ICONS_DIR = path.join(__dirname, "../public/icons");
const SPLASH_DIR = path.join(__dirname, "../public/splash");

// Standard PWA icon sizes
const ICON_SIZES = [32, 72, 96, 128, 144, 152, 192, 384, 512];

// Maskable icons need extra padding (safe zone is 80% of icon)
const MASKABLE_SIZES = [192, 512];

// Apple touch icon
const APPLE_TOUCH_SIZE = 180;

// iOS splash screen sizes (width x height)
const SPLASH_SCREENS = [
  { width: 750, height: 1334, name: "splash-750x1334" },      // iPhone 8, SE
  { width: 1125, height: 2436, name: "splash-1125x2436" },    // iPhone X, XS, 11 Pro
  { width: 1170, height: 2532, name: "splash-1170x2532" },    // iPhone 12, 13, 14
  { width: 1284, height: 2778, name: "splash-1284x2778" },    // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function generateIcon(size, suffix = "") {
  const filename = `icon${suffix}-${size}.png`;
  const outputPath = path.join(ICONS_DIR, filename);
  
  await sharp(SOURCE_SVG)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  
  console.log(`Generated: ${filename}`);
}

async function generateMaskableIcon(size) {
  const filename = `icon-maskable-${size}.png`;
  const outputPath = path.join(ICONS_DIR, filename);
  
  // Maskable icons need the icon centered with padding
  // Safe zone is 80%, so icon should be 80% of total size
  const iconSize = Math.floor(size * 0.7);
  const padding = Math.floor((size - iconSize) / 2);
  
  // Create icon with padding on dark background
  const iconBuffer = await sharp(SOURCE_SVG)
    .resize(iconSize, iconSize)
    .toBuffer();
  
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 }, // #0a0a0a
    },
  })
    .composite([
      {
        input: iconBuffer,
        left: padding,
        top: padding,
      },
    ])
    .png()
    .toFile(outputPath);
  
  console.log(`Generated: ${filename}`);
}

async function generateAppleTouchIcon() {
  const filename = "apple-touch-icon.png";
  const outputPath = path.join(ICONS_DIR, filename);
  
  await sharp(SOURCE_SVG)
    .resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE)
    .png()
    .toFile(outputPath);
  
  console.log(`Generated: ${filename}`);
}

async function generateSplashScreen({ width, height, name }) {
  const outputPath = path.join(SPLASH_DIR, `${name}.png`);
  
  // Icon size: roughly 25% of the smaller dimension
  const iconSize = Math.floor(Math.min(width, height) * 0.25);
  const iconX = Math.floor((width - iconSize) / 2);
  const iconY = Math.floor((height - iconSize) / 2) - Math.floor(height * 0.05); // Slightly above center
  
  const iconBuffer = await sharp(SOURCE_SVG)
    .resize(iconSize, iconSize)
    .toBuffer();
  
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 }, // #0a0a0a
    },
  })
    .composite([
      {
        input: iconBuffer,
        left: iconX,
        top: iconY,
      },
    ])
    .png()
    .toFile(outputPath);
  
  console.log(`Generated: ${name}.png`);
}

async function main() {
  console.log("🌟 Generating Polaris PWA icons...\n");
  
  // Ensure directories exist
  await ensureDir(ICONS_DIR);
  await ensureDir(SPLASH_DIR);
  
  // Generate standard icons
  console.log("Standard icons:");
  for (const size of ICON_SIZES) {
    await generateIcon(size);
  }
  
  // Generate maskable icons
  console.log("\nMaskable icons:");
  for (const size of MASKABLE_SIZES) {
    await generateMaskableIcon(size);
  }
  
  // Generate Apple touch icon
  console.log("\nApple touch icon:");
  await generateAppleTouchIcon();
  
  // Generate splash screens
  console.log("\niOS splash screens:");
  for (const splash of SPLASH_SCREENS) {
    await generateSplashScreen(splash);
  }
  
  console.log("\n✅ All icons generated successfully!");
  console.log(`   Icons: ${ICONS_DIR}`);
  console.log(`   Splash: ${SPLASH_DIR}`);
}

main().catch(console.error);

