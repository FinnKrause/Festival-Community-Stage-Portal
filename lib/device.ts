export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("deviceId");

  if (!id) {
    id = generateUUID();
    localStorage.setItem("deviceId", id);
  }

  return id;
}

function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto) {
    const cryptoObj = window.crypto as Crypto;

    // Use randomUUID if available
    if (typeof cryptoObj.randomUUID === "function") {
      return cryptoObj.randomUUID();
    }

    // Use getRandomValues fallback
    const buf = new Uint8Array(16);
    cryptoObj.getRandomValues(buf);

    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;

    const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, "0"));

    return (
      hex.slice(0, 4).join("") +
      "-" +
      hex.slice(4, 6).join("") +
      "-" +
      hex.slice(6, 8).join("") +
      "-" +
      hex.slice(8, 10).join("") +
      "-" +
      hex.slice(10, 16).join("")
    );
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
