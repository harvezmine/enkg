/**
 * Memotong frame asli video YouTube ENKG (resources/youtube/frames, 1280×720)
 * menjadi foto untuk situs. Hanya frame dari ibadah ENKG sendiri (bertanda
 * "Every Nation Kelapa Gading") yang dipakai — bukan footage musik global.
 *
 *   node scripts/make-photos.mjs
 */
import sharp from "sharp";

const FRAMES = "resources/youtube/frames";
const OUT = "public/images/photos";

const crops = [
  // Ps. Raswan Gautama — khotbah "Ketika Tuhan Berkata Sekarang!", tangan terangkat di bawah lampu panggung
  { src: "VHUN4SEX1eY-2", out: "preaching-worship", left: 340, top: 0, width: 720, height: 680 },
  // Ps. Raswan Gautama — khotbah "Back To Acts", potret setengah badan
  { src: "BIX1eYfBr58-2", out: "pastor-raswan", left: 440, top: 230, width: 470, height: 490 },
  // Ps. Raswan Gautama — "Menanti", tangan terbuka di depan slide "Berkumpul Bersekutu"
  { src: "rbVZlU2wX6o-3", out: "gathering", left: 120, top: 40, width: 1040, height: 600 },
  // Kolase jemaat dari video "7 Years of Caleidoscope"
  { src: "RpeQN5sbQJ4-3", out: "community-collage", left: 0, top: 0, width: 1280, height: 720 },
];

for (const c of crops) {
  const info = await sharp(`${FRAMES}/${c.src}.jpg`)
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(`${OUT}/${c.out}.jpg`);
  console.log(`✓ ${c.out}.jpg ${info.width}×${info.height}`);
}
