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

/**
 * Foto Instagram gereja sendiri (resources/instagram, ~1299px). Jauh lebih baik
 * daripada potongan kolase YouTube: ini foto utuh, bukan crop dari crop, jadi
 * tiap tile mosaik dapat tiga kali lebih banyak piksel asli.
 * Rasio target disetel mendekati rasio slotnya di globals.css.
 */
const igCrops = [
  // Slot mosaik terbesar (rasio 2.12): jemaat lengkap, segala usia, di Stream Hall.
  { src: "fellowship-group", out: "jemaat-lengkap", left: 0, top: 150, width: 1440, height: 679 },
  // Slot mosaik 1.70: jemaat Paskah dengan Ps. Raswan di depan.
  { src: "easter-pastor", out: "jemaat-gembala", left: 0, top: 177, width: 1080, height: 635 },
  // Slot mosaik 2.34: kelompok di panggung.
  { src: "enfast-stage", out: "jemaat-panggung", left: 0, top: 620, width: 1440, height: 615 },
  // Slot mosaik 1.89: persekutuan di meja, momen paling hangat dan paling dekat.
  { src: "fellowship-table", out: "jemaat-meja", left: 0, top: 120, width: 1080, height: 571 },
  // Life Group, rasio 3/2. Post asalnya memang bicara soal persekutuan dan Life
  // Group, jadi foto ini jujur dipakai di section itu, bukan foto acara lain.
  { src: "fellowship-table", out: "lifegroup-meja", left: 0, top: 45, width: 1080, height: 720 },
  // Siapa Kita, rasio 26/15: jemaat Paskah berpakaian putih, anak-anak di depan.
  { src: "easter-group", out: "jemaat-paskah", left: 0, top: 120, width: 1440, height: 831 },
];

for (const c of igCrops) {
  const info = await sharp(`resources/instagram/${c.src}.jpg`)
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(`${OUT}/${c.out}.jpg`);
  console.log(`\u2713 ${c.out}.jpg ${info.width}\u00d7${info.height}`);
}

for (const c of crops) {
  const info = await sharp(`${FRAMES}/${c.src}.jpg`)
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(`${OUT}/${c.out}.jpg`);
  console.log(`✓ ${c.out}.jpg ${info.width}×${info.height}`);
}
