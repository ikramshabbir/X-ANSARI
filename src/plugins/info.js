/**
 * Premium Info Command
 * Shows detailed message and user information
 */

import { command } from "../plugins.js";
import { reply } from "../utils/message.js";
import { isPnUser, isLidUser } from "../functions.js";

command(
  {
    pattern: "info",
    fromMe: false,
    desc: "Shows user and message information",
    type: "misc",
  },
  async (message, conn) => {
    try {
      const chatType = message.isGroup ? "Group" : "Direct Message";

      const senderType = isLidUser(message.participant)
        ? "LID (Local Identifier)"
        : isPnUser(message.participant)
          ? "PN (Phone Number)"
          : "Unknown";

      let info =
        `╭━━━〔 *💬 INFO* 〕━━━╮\n` +
        `┃\n` +
        `┃ 💬 *CHAT*\n` +
        `┃ ├─ Type      : ${chatType}\n` +
        `┃ ├─ ID        : ${message.from}\n`;

      if (message.fromAlt) {
        info += `┃ └─ Alt ID    : ${message.fromAlt}\n`;
      } else {
        info += `┃ └─ Alt ID    : Not available\n`;
      }

      info +=
        `┃\n` +
        `┃ 👤 *SENDER*\n` +
        `┃ ├─ Name      : ${message.pushName || "Unknown"}\n` +
        `┃ ├─ ID        : ${message.participant || "Unknown"}\n`;

      if (message.participantAlt) {
        info += `┃ ├─ Alt ID    : ${message.participantAlt}\n`;
      } else {
        info += `┃ ├─ Alt ID    : Not available\n`;
      }

      info +=
        `┃ ├─ Preferred : ${message.sender || "Unknown"}\n` +
        `┃ └─ ID Type   : ${senderType}\n` +
        `┃\n` +
        `┃ 📨 *MESSAGE*\n` +
        `┃ ├─ Type      : ${message.type || "Unknown"}\n` +
        `┃ ├─ ID        : ${message.id || "Unknown"}\n` +
        `┃ └─ Quoted    : ${message.quoted ? "Yes" : "No"}\n`;

      if (message.isGroup) {
        try {
          const groupMetadata = await conn.groupMetadata(message.from);

          info +=
            `┃\n` +
            `┃ 👥 *GROUP*\n` +
            `┃ ├─ Name      : ${groupMetadata.subject || "Unknown"}\n` +
            `┃ ├─ Members   : ${groupMetadata.participants?.length || 0}\n`;

          if (groupMetadata.owner) {
            info += `┃ ├─ Owner ID  : ${groupMetadata.owner}\n`;
          }

          if (groupMetadata.ownerPn) {
            info += `┃ └─ Owner PN  : ${groupMetadata.ownerPn}\n`;
          } else {
            info += `┃ └─ Owner PN  : Not available\n`;
          }
        } catch {
          info +=
            `┃\n` +
            `┃ 👥 *GROUP*\n` +
            `┃ └─ Metadata  : Could not fetch\n`;
        }
      }

      info +=
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━╯`;

      await reply(conn, message, info);
    } catch (error) {
      console.error("Error in info command:", error);
      await reply(
        conn,
        message,
        `╭━━━〔 *💬 INFO* 〕━━━╮
┃
┃ ❌ *INFO FAILED*
┃ Failed to get information.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);
