// One-off helper: renders design/og-poster.svg to src/og-poster.png (1200x630).
// Not part of the build, because text rendering depends on fonts installed on
// the machine. Replace the PNG with a designed image when one exists.
import sharp from 'sharp';

await sharp('design/og-poster.svg').resize(1200, 630).png({ compressionLevel: 9 }).toFile('src/og-poster.png');
console.log('Wrote src/og-poster.png');
