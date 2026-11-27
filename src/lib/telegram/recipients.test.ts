import { describe, expect, it } from "vitest";

import { canAssign, checkContact, isLinkedRecipient, recipientDigits, recipientStatus, type Recipient } from "./recipients";

const recipient = (patch: Partial<Recipient> = {}): Recipient => ({
  id: "r1",
  name: "Andi",
  phone: "0812 1111 2222",
  phone_digits: "081211112222",
  chat_id: 5001,
  telegram_user_id: 5001,
  linked_at: "2026-11-27T00:00:00Z",
  title: null,
  chat_type: "private",
  topics: ["ulang_tahun", "jemaat_baru"],
  is_active: true,
  last_digest_on: null,
  linked_by: "Andi",
  created_at: "",
  updated_at: "",
  ...patch,
});

describe("nomor dari tombol Kirim nomor saya", () => {
  it("nomor +62 dari Telegram cocok dengan nomor 08 yang diketik admin", () => {
    expect(checkContact({ chatType: "private", fromId: 9, contactUserId: 9, phoneNumber: "+62 812-1111-2222" })).toEqual({
      ok: true,
      digits: recipientDigits("0812 1111 2222"),
    });
    expect(checkContact({ chatType: "private", fromId: 9, contactUserId: 9, phoneNumber: "6281211112222" })).toEqual({
      ok: true,
      digits: "081211112222",
    });
  });

  it("menolak kontak orang lain yang diteruskan", () => {
    expect(checkContact({ chatType: "private", fromId: 9, contactUserId: 10, phoneNumber: "081211112222" })).toEqual({
      ok: false,
      reason: "bukan_milik_sendiri",
    });
    expect(checkContact({ chatType: "private", fromId: 9, contactUserId: undefined, phoneNumber: "081211112222" }).ok).toBe(false);
  });

  it("menolak kontak yang dikirim di grup", () => {
    expect(checkContact({ chatType: "group", fromId: 9, contactUserId: 9, phoneNumber: "081211112222" })).toEqual({
      ok: false,
      reason: "bukan_pribadi",
    });
  });

  it("nomor admin yang belum lengkap tidak diterima", () => {
    expect(recipientDigits("0812")).toBeNull();
  });
});

describe("hak akses penerima", () => {
  it("penerima tersambung boleh memakai perintah di chat miliknya", () => {
    expect(isLinkedRecipient(recipient(), 5001, 5001)).toBe(true);
  });

  it("bukan penerima, penerima nonaktif, atau yang belum tersambung tidak boleh", () => {
    expect(isLinkedRecipient(null, 5001, 5001)).toBe(false);
    expect(isLinkedRecipient(recipient({ is_active: false }), 5001, 5001)).toBe(false);
    expect(isLinkedRecipient(recipient({ chat_id: null, telegram_user_id: null }), 5001, 5001)).toBe(false);
  });

  it("tombol assign ditolak untuk orang lain, chat lain, atau tanpa pengingat jemaat baru", () => {
    expect(canAssign(recipient(), 5001, 5001)).toBe(true);
    expect(canAssign(recipient(), 5001, 7777)).toBe(false);
    expect(canAssign(recipient(), -100123, 5001)).toBe(false);
    expect(canAssign(recipient({ topics: ["ulang_tahun"] }), 5001, 5001)).toBe(false);
    expect(canAssign(null, 5001, 5001)).toBe(false);
  });

  it("status untuk admin", () => {
    expect(recipientStatus(recipient())).toBe("tersambung");
    expect(recipientStatus(recipient({ chat_id: null, telegram_user_id: null }))).toBe("menunggu");
    expect(recipientStatus(recipient({ is_active: false }))).toBe("nonaktif");
  });
});
