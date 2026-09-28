/**
 * Premium Ping Command
 */

import { command } from "../plugins.js";
import { reply } from "../utils/message.js";
import {
  startPingTracking,
  attachPingMessage,
} from "../utils/pingLatency.js";

command(
  {
    pattern: "ping",
    fromMe: false,
    desc: "Check bot response time",
    type: "misc",
  },
  async (message, conn) => {
    /*
     * Start latency tracking BEFORE sending PONG.
     * The tracker waits for WhatsApp SERVER_ACK.
     */
    const tracking = startPingTracking();

    // PONG
    const pongText = `╭━━━〔 *⏳ PONG* 〕━━━╮
┃
┃  *⏳ PONG!*
┃  *⚡ Speed   :* Loading...
┃
╰━━━━━━━━━━━━━━━━━╯`;

    const pong = await reply(
      conn,
      message,
      pongText
    );

    /*
     * Attach the actual outgoing WhatsApp
     * message ID to the latency tracker.
     */
    attachPingMessage(
      tracking.token,
      pong?.key?.remoteJid || message.from,
      pong?.key?.id
    );

    /*
     * Wait for the real SERVER_ACK.
     * Timeout returns null after 15 seconds.
     */
    const pingSpeed = await tracking.promise;

    const speedText =
      pingSpeed !== null
        ? `${pingSpeed}ms`
        : "Timeout";

    // PING
    const pingText = `╭━━━〔 *🏓 PING* 〕━━━╮
┃
┃  *🏓 PING!*
┃  *⚡ Speed :* ${speedText}
┃  *🤖 Status :* Online
┃  *🚀 Bot    :* X-ANSARI
┃
╰━━━━━━━━━━━━━━━━━╯`;

    await reply(
      conn,
      message,
      pingText
    );
  }
);
