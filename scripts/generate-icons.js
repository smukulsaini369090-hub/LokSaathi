const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="saffron" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff9933"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="url(#saffron)" stroke-width="12" stroke-dasharray="16 8" opacity="0.6"/>
  <circle cx="256" cy="256" r="145" fill="#ffffff" opacity="0.08"/>
  <g transform="translate(256, 250)">
    <text text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="180" fill="#ffffff">लो</text>
  </g>
  <rect x="156" y="375" width="200" height="38" rx="19" fill="url(#saffron)"/>
  <text x="256" y="399" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="19" fill="#ffffff" letter-spacing="3">LOKSAATHI</text>
</svg>
`;

async function makeIcons() {
  const svgBuffer = Buffer.from(svg);

  // 1. icon-512.png
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/icons/icon-512.png');

  // 2. icon-192.png
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/icons/icon-192.png');

  // 3. apple-touch-icon.png
  await sharp(svgBuffer).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png');

  // 4. maskable icon (full bleed)
  const maskableSvg = svg.replace('rx="112"', 'rx="0"');
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile('public/icons/icon-512-maskable.png');

  console.log('✅ Generated all PWA icons successfully in public/icons/');
}

makeIcons().catch(console.error);
