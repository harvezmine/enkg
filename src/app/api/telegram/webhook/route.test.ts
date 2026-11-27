import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const handleUpdate = vi.fn();
vi.mock("@/lib/telegram/handlers", () => ({ handleUpdate }));

const SECRET = "webhook_secret_1234567890";

describe("webhook Telegram", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    handleUpdate.mockReset();
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  const post = async (headers: Record<string, string>, body = { update_id: 1 }) => {
    const { POST } = await import("./route");
    return POST(new Request("http://localhost/api/telegram/webhook", { method: "POST", headers, body: JSON.stringify(body) }));
  };

  it("menolak permintaan tanpa secret", async () => {
    const res = await post({ "content-type": "application/json" });
    expect(res.status).toBe(401);
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it("menolak secret yang salah", async () => {
    const res = await post({ "x-telegram-bot-api-secret-token": `${SECRET}x` });
    expect(res.status).toBe(401);
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it("meneruskan update bila secret benar", async () => {
    const res = await post({ "x-telegram-bot-api-secret-token": SECRET }, { update_id: 7 });
    expect(res.status).toBe(200);
    expect(handleUpdate).toHaveBeenCalledWith({ update_id: 7 });
  });

  it("diam (503) bila bot belum dikonfigurasi", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const res = await post({ "x-telegram-bot-api-secret-token": SECRET });
    expect(res.status).toBe(503);
  });
});
