/**
 * Premium Ping Command
 */

import { performance } from "node:perf_hooks";
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

    const start = performance.now();

    const speed = Math.max(0, Math.round(performance.now() - start));

    const text = `╭━━━〔 *🏓 PING* 〕━━━╮
┃
┃  *🏓 PONG! :* ${speed}ms
┃  *⚡ Speed :* ${speed}ms
┃  *🤖 Status :* Online
┃  *🚀 Bot    :* X-ANSARI
┃
╰━━━━━━━━━━━━━━━━━╯`;

    await reply(conn, message, text);
  }
);
