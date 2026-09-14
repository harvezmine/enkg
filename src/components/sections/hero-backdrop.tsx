import Image from "next/image";

import { Parallax } from "../parallax";
import { HeroGlobe } from "./hero-globe";

/**
 * Latar hero. Dua lapis, dua-duanya dekoratif:
 *
 * 1. Globe, pusatnya ditaruh di luar tepi kiri atas, jadi yang terlihat hanya
 *    kuadran kanan bawahnya, melengkung di belakang judul. Satu dunia, dan
 *    judulnya duduk di dalamnya.
 * 2. Foto jemaat, besar dan beropasitas rendah, menutupi bagian kanan hero lalu
 *    memudar ke arah teks. Fotonya menghadirkan orang tanpa melawan judul.
 *
 * Foto jemaat yang punya keterangan dan alt sungguhan ada di section Siapa Kita,
 * jadi lapisan ini murni suasana dan disembunyikan dari screen reader.
 */
const photos = [
  { src: "/images/photos/jemaat-lengkap.jpg", cls: "hero-backdrop-a", sizes: "50vw" },
  { src: "/images/photos/jemaat-paskah.jpg", cls: "hero-backdrop-b", sizes: "44vw" },
  { src: "/images/photos/jemaat-meja.jpg", cls: "hero-backdrop-c", sizes: "34vw" },
] as const;

export function HeroBackdrop() {
  return (
    <div className="hero-backdrop" aria-hidden="true">
      <HeroGlobe className="hero-backdrop-globe" />
      <Parallax speed={-3} className="hero-backdrop-photos">
        {photos.map((photo) => (
          <div key={photo.src} className={`hero-backdrop-photo ${photo.cls}`}>
            <Image src={photo.src} alt="" fill sizes={photo.sizes} priority />
          </div>
        ))}
      </Parallax>
    </div>
  );
}
