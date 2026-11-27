/** Pembaca FormData untuk Server Action: selalu string yang sudah dipangkas dan dibatasi panjangnya. */
export const text = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? "").trim().slice(0, max);
export const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";
export const nullable = (value: string) => (value === "" ? null : value);
