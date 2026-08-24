import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "../backend/server.js";

export default async function apiHandler(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request(`https://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : Buffer.concat(chunks),
  });
  const response = await handle(request);
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  res.end(Buffer.from(await response.arrayBuffer()));
}
