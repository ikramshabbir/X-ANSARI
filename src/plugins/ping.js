/**
 * Ping Command — single-message response
 */

import { command } from "../plugins.js";
import { reply, ackCommand } from "../utils/message.js";

command(
  {
    pattern: "ping",
    fromMe: false,
    desc: "Check bot response time",
    type: "misc",
  },
  async (message, conn) => {
    await ackCommand(conn, message, "🦅");
    const start = Date.now();
    await reply(conn, message, `Pong · ${Date.now() - start}ms`);
  }
);
