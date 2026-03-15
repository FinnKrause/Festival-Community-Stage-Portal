/* eslint-disable @typescript-eslint/no-explicit-any */

type Controller = ReadableStreamDefaultController<string>;

const clients = new Set<Controller>();
const logBuffer: any[] = [];
const MAX_LOGS = 200;

export function addClient(controller: Controller) {
  clients.add(controller);
  broadcast("viewer_count", clients.size);
}

export function removeClient(controller: Controller) {
  clients.delete(controller);
  broadcast("viewer_count", clients.size);
}

export function getViewerCount() {
  return clients.size;
}

function send(controller: Controller, payload: string) {
  try {
    controller.enqueue(payload);
  } catch {
    clients.delete(controller);
  }
}

export function broadcast(event: string, data?: any) {
  const payload = `data: ${JSON.stringify({ event, data })}\n\n`;

  for (const client of clients) {
    send(client, payload);
  }
}

/* -------------------------
   SERVER LOG CAPTURE
------------------------- */

function pushLog(level: string, args: any[]) {
  const msg = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");

  const entry = {
    level,
    msg,
    time: new Date().toISOString(),
  };

  logBuffer.push(entry);

  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }

  broadcast("server_log", entry);
}

export function getLogs() {
  return logBuffer;
}

/* override console methods */

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args: any[]) => {
  pushLog("log", args);
  originalLog(...args);
};

console.warn = (...args: any[]) => {
  pushLog("warn", args);
  originalWarn(...args);
};

console.error = (...args: any[]) => {
  pushLog("error", args);
  originalError(...args);
};

/*
Heartbeat verhindert:
- Safari SSE Disconnect
- Reverse Proxy Timeout
- Mobile Browser Sleep Disconnects
*/

setInterval(() => {
  const payload = `data: ${JSON.stringify({ event: "heartbeat" })}\n\n`;

  for (const client of clients) {
    send(client, payload);
  }
}, 15000);
