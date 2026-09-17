// Genera los íconos PNG y la imagen para redes sociales a partir de public/favicon.svg.
// Si reemplazas el logotipo, actualiza public/favicon.svg y ejecuta: bun run icons
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const logo = await readFile("public/favicon.svg");

for (const [file, size] of [
  ["public/apple-touch-icon.png", 180],
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
] as const) {
  // Fondo del color de la marca para que el ícono no quede transparente en iOS.
  const icon = await sharp(logo, { density: 600 }).resize(Math.round(size * 0.86)).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#fbf8f1" } })
    .composite([{ input: icon, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(file);
  console.log(`✓ ${file}`);
}

// Imagen para compartir en redes sociales (1200×630).
const pines = [70, 150, 230, 970, 1050, 1130]
  .map((x, i) => {
    const h = [150, 190, 130, 170, 210, 140][i]!;
    const base = 600;
    const w = h * 0.42;
    return `<path d="M${x} ${base - h} L${x + w * 0.5} ${base - h * 0.55} H${x + w * 0.22} L${x + w * 0.62} ${base - h * 0.18} H${x + w * 0.08} V${base} H${x - w * 0.08} V${base - h * 0.18} H${x - w * 0.62} L${x - w * 0.22} ${base - h * 0.55} H${x - w * 0.5} Z"/>`;
  })
  .join("");

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c1f13"/><stop offset="0.6" stop-color="#1b3924"/><stop offset="1" stop-color="#2d6b3e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#sky)"/>
  <circle cx="960" cy="170" r="150" fill="#f4d58d" fill-opacity="0.12"/>
  <path d="M0 470 C 200 420 360 450 560 410 S 900 380 1200 430 V630 H0Z" fill="#255533"/>
  <path d="M0 540 C 250 500 500 530 750 505 S 1050 515 1200 500 V630 H0Z" fill="#1b3924"/>
  <g fill="#0c1f13">${pines}</g>
  <path d="M0 590 C 300 565 600 585 900 572 S 1100 580 1200 570 V630 H0Z" fill="#0c1f13"/>
  <text x="600" y="250" text-anchor="middle" font-family="Georgia, 'DejaVu Serif', serif" font-size="76" font-weight="700" fill="#ffffff">Propietarios Unidos</text>
  <text x="600" y="320" text-anchor="middle" font-family="Georgia, 'DejaVu Serif', serif" font-size="42" fill="#fcd34d">Bosque La Primavera</text>
  <text x="600" y="380" text-anchor="middle" font-family="'DejaVu Sans', Arial, sans-serif" font-size="26" fill="#dfeee2">Cuidamos, mejoramos y defendemos el bosque · Tala, Jalisco</text>
</svg>`;

const logoForOg = await sharp(logo, { density: 600 }).resize(110).png().toBuffer();
await sharp(Buffer.from(og))
  .composite([{ input: logoForOg, top: 60, left: 545 }])
  .png({ compressionLevel: 9 })
  .toFile("public/og-image.png");
console.log("✓ public/og-image.png");
