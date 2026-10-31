// Draws the 1200x630 share image (task M7-05) from SVG with sharp, into public/og-image.png.
// Run: node scripts/make-og-image.mjs
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#161b18"/>
  <path d="M0 630 L300 330 L470 520 L620 400 L860 630 Z" fill="#232a26"/>
  <path d="M520 630 L800 360 L960 500 L1060 430 L1200 560 L1200 630 Z" fill="#10301f"/>
  <g transform="translate(80 80) scale(3)">
    <circle cx="35" cy="13" r="5.5" fill="#f2b13a"/>
    <path d="M3 40 L17 16 L24 27 L30 19 L45 40 Z" fill="#3c9a66"/>
    <path d="M17 16 L21 23 L18.5 22 L17 25 L15.5 22 L13 23 Z" fill="#eaf0ec"/>
    <path d="M30 40 L30 36 M30 36 L24 36 L30 26 L36 36 Z" fill="#a9e2c0"/>
  </g>
  <text x="80" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="#ffffff">LULC Mapping</text>
  <text x="80" y="380" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="#ffffff">Training</text>
  <text x="80" y="450" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#c3ccc6">A free course in land use and land cover mapping</text>
  <text x="80" y="492" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#c3ccc6">with Google Earth Engine: composites to area estimates</text>
  <rect x="80" y="530" width="120" height="6" rx="3" fill="#f2b13a"/>
  <text x="80" y="580" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#a9e2c0">wangdiues.github.io/lulc-mapping-training</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og-image.png');
console.log('public/og-image.png written');
