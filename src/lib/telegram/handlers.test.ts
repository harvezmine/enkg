import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const api = { answerCallback: vi.fn(), editMessage: vi.fn(), leaveChat: vi.fn(), sendMessage: vi.fn() };
vi.mock("./api", () => api);

const data = {
  anniversaryEntries: vi.fn(),
  birthdayEntries: vi.fn(),
  findRecipientByChat: vi.fn(),
  findRecipientByDigits: vi.fn(),
  linkRecipient: vi.fn(),
  scheduleByDay: vi.fn(),
  unlinkChat: vi.fn(),
  waitingMembers: vi.fn(),
};
vi.mock("./data", () => data);

const members = { assignFromTelegram: vi.fn(), memberCard: vi.fn() };
vi.mock("./members", () => members);
vi.mock("./config", () => ({ publicAdminUrl: () => null }));

const { encodeAssign } = await import("./format");
const { handleUpdate } = await import("./handlers");

const PERSON = "78e2726a-a50f-4c1d-88e2-e06b59fec9be";
const GROUP = "4e5b0822-ffe6-4a2e-8818-7458588a81bb";
const recipient = {
  id: "r1",
  name: "Andi",
  phone: "0812 1111 2222",
  phone_digits: "081211112222",
  chat_id: 5001,
  telegram_user_id: 5001,
  chat_type: "private",
  topics: ["jemaat_baru"],
  is_active: true,
};

const press = (chatId: number, fromId: number) =>
  handleUpdate({
    update_id: 1,
    callback_query: {
      id: "cb",
      from: { id: fromId, first_name: "X" },
      data: encodeAssign({ kind: "person", id: PERSON }, GROUP),
      message: { message_id: 10, chat: { id: chatId, type: "private" } },
    },
  });

beforeEach(() => {
  for (const fn of [...Object.values(api), ...Object.values(data), ...Object.values(members)]) fn.mockReset();
  members.assignFromTelegram.mockResolvedValue({ toast: "ok", html: "ok" });
});

describe("tombol assign", () => {
  it("ditolak dari chat yang bukan penerima", async () => {
    data.findRecipientByChat.mockResolvedValue(null);
    await press(9999, 9999);
    expect(members.assignFromTelegram).not.toHaveBeenCalled();
    expect(api.answerCallback).toHaveBeenCalledWith("cb", expect.stringContaining("tidak punya akses"), true);
  });

  it("ditolak kalau yang menekan bukan pemilik chat penerima", async () => {
    data.findRecipientByChat.mockResolvedValue(recipient);
    await press(5001, 7777);
    expect(members.assignFromTelegram).not.toHaveBeenCalled();
  });

  it("jalan untuk penerima yang tersambung, oleh orangnya sendiri", async () => {
    data.findRecipientByChat.mockResolvedValue(recipient);
    await press(5001, 5001);
    expect(members.assignFromTelegram).toHaveBeenCalledWith({ kind: "person", id: PERSON }, GROUP, "Andi");
  });
});

describe("menyambungkan lewat nomor", () => {
  const contact = (fromId: number, contactUserId: number, phone = "+6281211112222", type = "private") =>
    handleUpdate({
      update_id: 2,
      message: {
        message_id: 1,
        chat: { id: fromId, type },
        from: { id: fromId, first_name: "Andi" },
        contact: { phone_number: phone, user_id: contactUserId },
      },
    });

  it("nomor terdaftar langsung tersambung", async () => {
    data.findRecipientByDigits.mockResolvedValue({ ...recipient, chat_id: null, telegram_user_id: null });
    await contact(5001, 5001);
    expect(data.findRecipientByDigits).toHaveBeenCalledWith("081211112222");
    expect(data.linkRecipient).toHaveBeenCalledWith("r1", { chatId: 5001, userId: 5001, by: "Andi" });
  });

  it("kontak orang lain tidak menyambungkan apa pun", async () => {
    await contact(5001, 6002);
    expect(data.findRecipientByDigits).not.toHaveBeenCalled();
    expect(data.linkRecipient).not.toHaveBeenCalled();
  });

  it("nomor yang tidak terdaftar ditolak", async () => {
    data.findRecipientByDigits.mockResolvedValue(null);
    await contact(5001, 5001, "+6289999999999");
    expect(data.linkRecipient).not.toHaveBeenCalled();
    expect(api.sendMessage).toHaveBeenCalledWith(5001, expect.stringContaining("belum terdaftar"), expect.anything());
  });

  it("orang yang belum tersambung tidak mendapat data dari perintah", async () => {
    data.findRecipientByChat.mockResolvedValue(null);
    await handleUpdate({ update_id: 3, message: { message_id: 1, chat: { id: 42, type: "private" }, from: { id: 42 }, text: "/ulangtahun" } });
    expect(data.birthdayEntries).not.toHaveBeenCalled();
    expect(api.sendMessage).toHaveBeenCalledWith(42, expect.stringContaining("Kirim nomor saya"), expect.anything());
  });

  it("perintah di grup hanya dijawab dengan petunjuk chat pribadi", async () => {
    await handleUpdate({ update_id: 4, message: { message_id: 1, chat: { id: -100, type: "group" }, from: { id: 1 }, text: "/jadwal" } });
    expect(data.findRecipientByChat).not.toHaveBeenCalled();
    expect(api.sendMessage).toHaveBeenCalledWith(-100, expect.stringContaining("chat pribadi"));
  });
});
