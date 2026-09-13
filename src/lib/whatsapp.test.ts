import { describe, expect, it } from "vitest";

import { whatsappLink } from "./whatsapp";

describe("whatsappLink", () => {
  it("membersihkan format nomor internasional", () => {
    expect(whatsappLink("+62 851-7543-6935")).toBe("https://wa.me/6285175436935");
  });

  it("mengubah awalan 0 menjadi 62 dan menyertakan pesan", () => {
    expect(whatsappLink("085175436935", "Halo ENKG")).toBe(
      "https://wa.me/6285175436935?text=Halo%20ENKG",
    );
  });

  it("meng-encode baris baru dan tanda baca", () => {
    expect(whatsappLink("6285175436935", "Nama: Budi\nPesan: Mau tanya?")).toBe(
      "https://wa.me/6285175436935?text=Nama%3A%20Budi%0APesan%3A%20Mau%20tanya%3F",
    );
  });
});
