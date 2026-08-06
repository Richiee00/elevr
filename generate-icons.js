import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = './public';

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function generate() {
  try {
    console.log('Generating PNG icons from SVG using sharp...');

    // 1. Transparent icons
    await sharp('./public/logo-square-trans.svg')
      .resize(192, 192)
      .png()
      .toFile('./public/icon-192.png');
    console.log('Created icon-192.png');

    await sharp('./public/logo-square-trans.svg')
      .resize(512, 512)
      .png()
      .toFile('./public/icon-512.png');
    console.log('Created icon-512.png');

    await sharp('./public/logo-square-trans.svg')
      .resize(32, 32)
      .png()
      .toFile('./public/favicon.png');
    console.log('Created favicon.png');

    // 2. Dark solid background icons (maskable / apple-touch-icon)
    await sharp('./public/logo-square-dark.svg')
      .resize(192, 192)
      .png()
      .toFile('./public/icon-192-maskable.png');
    console.log('Created icon-192-maskable.png');

    await sharp('./public/logo-square-dark.svg')
      .resize(512, 512)
      .png()
      .toFile('./public/icon-512-maskable.png');
    console.log('Created icon-512-maskable.png');

    await sharp('./public/logo-square-dark.svg')
      .resize(180, 180)
      .png()
      .toFile('./public/apple-touch-icon.png');
    console.log('Created apple-touch-icon.png');

    console.log('All PNG icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generate();
