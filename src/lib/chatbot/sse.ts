/**
 * Pengurai aliran SSE gaya OpenAI/DeepSeek ("data: {...}\n") menjadi potongan
 * teks jawaban. Baris yang terpotong di tengah disimpan sampai potongan berikutnya.
 */
export function createSseTextParser() {
  let buffer = "";
  return (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    let text = "";
    for (const line of lines) {
      const data = line.startsWith("data:") ? line.slice(5).trim() : "";
      if (!data || data === "[DONE]") continue;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (typeof delta === "string") text += delta;
      } catch {
        // Bukan JSON (mis. komentar keep-alive): lewati.
      }
    }
    return text;
  };
}
