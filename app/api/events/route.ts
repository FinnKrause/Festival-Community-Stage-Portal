import { addClient, getLogs, getViewerCount, removeClient } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const stream = new ReadableStream<string>({
    start(controller) {
      addClient(controller);

      controller.enqueue(`data: ${JSON.stringify({ event: "connected" })}\n\n`);

      const abort = () => {
        removeClient(controller);

        try {
          controller.close();
        } catch {}
      };

      req.signal.addEventListener("abort", abort);

      controller.enqueue(`data: ${JSON.stringify({ event: "connected" })}\n\n`);

      controller.enqueue(
        `data: ${JSON.stringify({ event: "viewer_count", data: getViewerCount() })}\n\n`,
      );

      for (const log of getLogs()) {
        controller.enqueue(
          `data: ${JSON.stringify({ event: "server_log", data: log })}\n\n`,
        );
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
