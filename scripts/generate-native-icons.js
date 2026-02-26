/**
 * Generate native app icons for Capacitor Android and iOS projects
 * from the source SVG icon.
 *
 * Usage:
 *   npm run generate-native-icons
 *
 * Requirements:
 *   npm install sharp --save-dev
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SOURCE_SVG = path.join(__dirname, "../public/icon.svg");

const ANDROID_RES = path.join(__dirname, "../android/app/src/main/res");
const IOS_ASSETS = path.join(__dirname, "../ios/App/App/Assets.xcassets/AppIcon.appiconset");

// Android mipmap sizes (square, dp-to-px)
const ANDROID_ICON_SIZES = [
  { size: 48, folder: "mipmap-mdpi" },
  { size: 72, folder: "mipmap-hdpi" },
  { size: 96, folder: "mipmap-xhdpi" },
  { size: 144, folder: "mipmap-xxhdpi" },
  { size: 192, folder: "mipmap-xxxhdpi" },
];

// Android foreground (adaptive icon layer, slightly larger)
const ANDROID_FOREGROUND_SIZES = [
  { size: 108, folder: "mipmap-mdpi" },
  { size: 162, folder: "mipmap-hdpi" },
  { size: 216, folder: "mipmap-xhdpi" },
  { size: 324, folder: "mipmap-xxhdpi" },
  { size: 432, folder: "mipmap-xxxhdpi" },
];

// iOS icon sizes (all are 1x in the asset catalog, Xcode handles scaling)
const IOS_ICON_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];

async function generateAndroidIcons() {
  console.log("Android launcher icons:");
  for (const { size, folder } of ANDROID_ICON_SIZES) {
    const dir = path.join(ANDROID_RES, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Standard icon
    await sharp(SOURCE_SVG)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, "ic_launcher.png"));

    // Round icon
    const roundMask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
    );
    const iconBuf = await sharp(SOURCE_SVG).resize(size, size).png().toBuffer();
    await sharp(iconBuf)
      .composite([{ input: roundMask, blend: "dest-in" }])
      .png()
      .toFile(path.join(dir, "ic_launcher_round.png"));

    console.log(`  ${folder}: ${size}x${size}`);
  }

  console.log("\nAndroid adaptive foreground icons:");
  for (const { size, folder } of ANDROID_FOREGROUND_SIZES) {
    const dir = path.join(ANDROID_RES, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const iconSize = Math.floor(size * 0.65);
    const padding = Math.floor((size - iconSize) / 2);

    const iconBuf = await sharp(SOURCE_SVG).resize(iconSize, iconSize).toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: iconBuf, left: padding, top: padding }])
      .png()
      .toFile(path.join(dir, "ic_launcher_foreground.png"));

    console.log(`  ${folder}: ${size}x${size}`);
  }
}

async function generateIosIcons() {
  console.log("\niOS app icons:");

  if (!fs.existsSync(IOS_ASSETS)) {
    fs.mkdirSync(IOS_ASSETS, { recursive: true });
  }

  const images = [];

  for (const size of IOS_ICON_SIZES) {
    const filename = `icon-${size}.png`;
    await sharp(SOURCE_SVG)
      .resize(size, size)
      .png()
      .toFile(path.join(IOS_ASSETS, filename));

    images.push({
      filename,
      idiom: size === 1024 ? "ios-marketing" : "universal",
      platform: "ios",
      size: `${size}x${size}`,
    });

    console.log(`  ${filename}: ${size}x${size}`);
  }

  // Write Contents.json for Xcode
  const contents = {
    images: [
      {
        filename: "icon-1024.png",
        idiom: "universal",
        platform: "ios",
        size: "1024x1024",
      },
    ],
    info: {
      author: "xcode",
      version: 1,
    },
  };

  fs.writeFileSync(
    path.join(IOS_ASSETS, "Contents.json"),
    JSON.stringify(contents, null, 2)
  );
}

async function main() {
  console.log("Generating native app icons from icon.svg...\n");

  if (fs.existsSync(path.join(ANDROID_RES))) {
    await generateAndroidIcons();
  } else {
    console.log("Skipping Android (android/ directory not found)");
  }

  if (fs.existsSync(path.join(__dirname, "../ios"))) {
    await generateIosIcons();
  } else {
    console.log("Skipping iOS (ios/ directory not found)");
  }

  console.log("\nDone!");
}

main().catch(console.error);
