/**
 * Group Mention Command
 */

import { command } from "../plugins.js";
import { sendMessage, getCommandArgs, sendError, withTyping } from "../utils/message.js";
import { getParticipantIds } from "../utils/group.js";
import { groupCache } from "../utils/cache.js";

command(
  {
    pattern: "mention",
    fromMe: false,
    desc: "Mention all users in group",
    type: "group",
    groupOnly: true,
  },
  async (message, conn) => {
    try {
      let mentionText = getCommandArgs(message.body, "mention");

      if (!mentionText && message.quoted) {
        mentionText = message.quoted.text || message.quoted.caption;
      }

      if (!mentionText) {
        mentionText = "🔔 *_Notified Everyone_*";
      }

      await withTyping(conn, message.from, async () => {
        let groupMetadata = groupCache.get(message.from);
        if (!groupMetadata) {
          groupMetadata = await conn.groupMetadata(message.from);
          groupCache.set(message.from, groupMetadata);
        }
        const participantIds = getParticipantIds(groupMetadata);

        const finalMessage = `╭━━━━*〔 📢 MENTION 〕*━━━━╮
┃
┃ ${mentionText}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

                                      await sendMessage(conn, message.from, finalMessage, {
                                          mentions: participantIds,
                                      });
      });
    } catch (error) {
      console.error("Error in mention command:", error);
      await sendError(
        conn,
        message.from,
        `╭━━━━*〔 📢 MENTION 〕*━━━━╮
┃
┃ ❌ *MENTION FAILED*
┃ Failed to mention group members.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);
