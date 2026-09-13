/**
 * Membuat aset brand dari logo PNG Linktree (putih di atas hitam, 600×600).
 *
 *   npm run brand
 *
 * Kecerahan tiap piksel dipakai sebagai alpha, jadi hasilnya logo transparan
 * yang bisa diwarnai apa saja tanpa sisa kotak hitam. Ganti SOURCE dengan file
 * logo resmi bila tim desain sudah mengirim versi beresolusi tinggi.
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "resources/linktree/avatar-enkg.png";

async function tintedLogo(hex, file) {
  const { data, info } = await sharp(SOURCE)
    .removeAlpha()
    .trim({ threshold: 12 })
    .toColourspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const pixels = info.width * info.height;
  const rgba = Buffer.alloc(pixels * 4);
  for (let i = 0; i < pixels; i++) rgba.set([r, g, b, data[i * info.channels]], i * 4);

  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(file);
  return info;
}

await mkdir("src/assets/brand", { recursive: true });

const info = await tintedLogo("#fcf4e4", "src/assets/brand/logo-light.png");
await tintedLogo("#1c4484", "src/assets/brand/logo-navy.png");

// Konvensi file App Router: otomatis jadi <meta og:image> dan favicon.
const logo = await sharp("src/assets/brand/logo-light.png").resize({ width: 640 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#1c4484" } })
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile("src/app/opengraph-image.png");
await sharp(SOURCE).resize(512).png().toFile("src/app/icon.png");
await sharp(SOURCE).resize(180).png().toFile("src/app/apple-icon.png");

console.log(`✓ logo ${info.width}×${info.height}, opengraph-image, icon, apple-icon`);
