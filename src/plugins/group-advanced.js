/**
 * Advanced Group Management Plugin
 * Deduplicated, LID-aware, consistent utils API usage
 */

import { command } from "../plugins.js";
import {
  sendMessage,
  sendError,
  replyOk,
  replyFail,
  getMentions,
  withTyping,
} from "../utils/message.js";
import {
  getAdmins,
  getParticipantIds,
  formatGroupInfo,
  displayId,
  resolveTargetUser,
} from "../utils/group.js";
import { groupCache } from "../utils/cache.js";
import { isPnUser, isLidUser } from "../functions.js";
import { USAGE_HINTS } from "../config/constants.js";

async function getGroupMeta(conn, jid) {
  const cached = groupCache.get(jid);
  if (cached) return cached;
  const meta = await conn.groupMetadata(jid);
  groupCache.set(jid, meta);
  return meta;
}

// ==================== TAG ALL ====================
command(
  {
    pattern: "tagall",
    fromMe: true,
    desc: "Tag all group members",
    type: "group",
    groupOnly: true,
  },
  async (message, conn) => {
    try {
      await withTyping(conn, message.from, async () => {
        const groupMetadata = await getGroupMeta(conn, message.from);
        const participants = groupMetadata.participants;
        const mentionIds = getParticipantIds(groupMetadata);

        let tagMessage = `╭━━━﹝ *👥 TAGALL* ﹞━━━╮
┃
┃ 🏷️ *GROUP:* ${groupMetadata.subject}
┃ 👥 *TOTAL MEMBERS:* ${participants.length}
┃
╰━━━━━━━━━━━━━━━━━╯\n\n`;

participants.forEach((participant, index) => {
          tagMessage += `${index + 1}. @${displayId(participant)}\n`;
        });

        await sendMessage(conn, message.from, tagMessage, {
          mentions: mentionIds,
          quoted: message,
        });
      });
    } catch (error) {
      console.error("Error in tagall command:", error);
      await replyFail(
        conn,
        message,
        `╭━━━﹝ *👥 TAGALL* ﹞━━━╮
┃
┃ ❌ *TAGALL FAILED*
┃ Failed to tag all members.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);

// ==================== NOTIFY ====================
command(
  {
    pattern: "notify",
    fromMe: true,
    desc: "Ping everyone with a short alert",
    type: "group",
    groupOnly: true,
  },
  async (message, conn) => {
    try {
      await withTyping(conn, message.from, async () => {
        const groupMetadata = await getGroupMeta(conn, message.from);
        const notifyMessage = `╭━━━﹝ *📢 NOTIFY* ﹞━━━╮
┃
┃ 🔔 *ATTENTION EVERYONE!*
┃
╰━━━━━━━━━━━━━━━━━╯`;

                  await sendMessage(conn, message.from, notifyMessage, {
                      mentions: getParticipantIds(groupMetadata),
                      quoted: message,
                  });
      });
    } catch (error) {
      console.error("Error in notify command:", error);
      await replyFail(
        conn,
        message,
        `╭━━━﹝ *📢 NOTIFY* ﹞━━━╮
┃
┃ ❌ *NOTIFY FAILED*
┃ Failed to notify members.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);

// ==================== GROUP INFO ====================
command(
  {
    pattern: "groupinfo",
    fromMe: false,
    desc: "Get detailed group information",
    type: "group",
    groupOnly: true,
  },
  async (message, conn) => {
    try {
      const groupMetadata = await getGroupMeta(conn, message.from);
      const lidUsers = groupMetadata.participants.filter((p) => isLidUser(p.id));
      const pnUsers = groupMetadata.participants.filter((p) => isPnUser(p.id));

      let info =
        `╭━〔 *👥 GROUP INFO* 〕━╮\n` +
        `┃\n`;

      info += formatGroupInfo(groupMetadata);

      info +=
        `┃\n` +
        `┃ 🆔 *IDENTIFIER TYPES*\n` +
        `┃ ├─ LID Users   : ${lidUsers.length}\n` +
        `┃ └─ PN Users    : ${pnUsers.length}\n` +
        `╰━━━━━━━━━━━━━━━━━╯`;

      await sendMessage(conn, message.from, info);
    } catch (error) {
      console.error("Error in groupinfo command:", error);
      await replyFail(
        conn,
        message,
        `╭━〔 *👥 GROUP INFO* 〕━╮
┃
┃ ❌ *GROUP INFO FAILED*
┃ Failed to get group information.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);

// ==================== PROMOTE ====================
command(
  {
    pattern: "promote",
    fromMe: false,
    desc: "Promote a member to admin (mention or reply)",
    type: "group",
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
  },
  async (message, conn) => {
    try {
      const targetUser = resolveTargetUser(message) || getMentions(message)[0];
      if (!targetUser) {
        return await sendError(conn, message.from, USAGE_HINTS.promote);
      }

      await withTyping(conn, message.from, async () => {
        await conn.groupParticipantsUpdate(message.from, [targetUser], "promote");
        groupCache.delete(message.from);
        await replyOk(
          conn,
          message,
          `╭━━━﹝ *⬆️ PROMOTE* ﹞━━━╮
┃
┃ ✅ *PROMOTED*
┃ 👤 @${displayId(targetUser)}
┃ 🛡️ *ROLE:* Admin
┃
╰━━━━━━━━━━━━━━━━━╯`,
          { mentions: [targetUser] }
        );
      });
    } catch (error) {
      console.error("Error in promote command:", error);
      await replyFail(
        conn,
        message,
        `╭━━━﹝ *⬆️ PROMOTE* ﹞━━━╮
┃
┃ ❌ *PROMOTE FAILED*
┃ Failed to promote user.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);

// ==================== DEMOTE ====================
command(
  {
    pattern: "demote",
    fromMe: false,
    desc: "Demote an admin to member (mention or reply)",
    type: "group",
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
  },
  async (message, conn) => {
    try {
      const targetUser = resolveTargetUser(message) || getMentions(message)[0];
      if (!targetUser) {
        return await sendError(conn, message.from, USAGE_HINTS.demote);
      }

      await withTyping(conn, message.from, async () => {
        await conn.groupParticipantsUpdate(message.from, [targetUser], "demote");
        groupCache.delete(message.from);
        await replyOk(
          conn,
          message,
          `╭━━━﹝ *⬇️ DEMOTE* ﹞━━━╮
┃
┃ ✅ *DEMOTED*
┃ 👤 @${displayId(targetUser)}
┃ 👤 *ROLE:* Member
┃
╰━━━━━━━━━━━━━━━━━╯`,
          { mentions: [targetUser] }
        );
      });
    } catch (error) {
      console.error("Error in demote command:", error);
      await replyFail(
        conn,
        message,
        `╭━━━﹝ *⬇️ DEMOTE* ﹞━━━╮
┃
┃ ❌ *DEMOTE FAILED*
┃ Failed to demote user.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);

// ==================== ACCEPT ALL ====================
command(
  {
    pattern: "acceptall",
    fromMe: true,
    desc: "Approve all pending requests",
    type: "group",
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
  },
  async (message, conn) => {
    try {
      await withTyping(conn, message.from, async () => {
        const response = await conn.groupRequestParticipantsList(message.from);
        const requests = Array.isArray(response) ? response : [];

        if (requests.length === 0) {
          return await sendError(
            conn,
            message.from,
            `╭━〔 *✅ ACCEPT ALL* 〕━╮
┃
┃ 📭 *NO PENDING REQUESTS*
┃ No join requests found.
┃
╰━━━━━━━━━━━━━━━━━╯`
          );
        }

        const participants = requests
          .map((request) => request?.jid || request?.id || request?.participant)
          .filter(Boolean);

        if (participants.length === 0) {
          return await sendError(
            conn,
            message.from,
            `╭━〔 *✅ ACCEPT ALL* 〕━╮
┃
┃ ⚠️ *NO VALID REQUESTS*
┃ No valid pending requests found.
┃
╰━━━━━━━━━━━━━━━━━╯`
          );
        }

        await conn.groupRequestParticipantsUpdate(
          message.from,
          participants,
          "approve"
        );

        await replyOk(
          conn,
          message,
          `╭━〔 *✅ ACCEPT ALL* 〕━╮
┃
┃ ✅ *REQUESTS APPROVED*
┃ 👥 *COUNT:* ${participants.length}
┃
╰━━━━━━━━━━━━━━━━━╯`
        );
      });
    } catch (error) {
      console.error("Error in acceptall command:", error);
      await replyFail(
        conn,
        message,
        `╭━〔 *✅ ACCEPT ALL* 〕━╮
┃
┃ ❌ *APPROVAL FAILED*
┃ Failed to approve pending requests.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);

// ==================== ADMINS ====================
command(
  {
    pattern: "admins",
    fromMe: false,
    desc: "List all group admins",
    type: "group",
    groupOnly: true,
  },
  async (message, conn) => {
    try {
      const groupMetadata = await getGroupMeta(conn, message.from);
      const adminsList = getAdmins(groupMetadata);

      if (adminsList.length === 0) {
        return await sendError(
          conn,
          message.from,
          `╭━━━﹝ *👑 ADMINS* ﹞━━━╮
┃
┃ 📭 *NO ADMINS FOUND*
┃ This group has no admins.
┃
╰━━━━━━━━━━━━━━━━━╯`
        );
      }

      let adminList = `╭━━━﹝ *👑 ADMINS* ﹞━━━╮
┃
┃ 🏷️ *GROUP:* ${groupMetadata.subject}
┃ 👥 *TOTAL ADMINS:* ${adminsList.length}
┃
╰━━━━━━━━━━━━━━━━━╯\n\n`;

                                                const mentionIds = [];
      adminsList.forEach((admin, index) => {
        mentionIds.push(admin.id);
        const role = admin.admin === "superadmin" ? "👑 Super Admin" : "🛡️ Admin";
        adminList += `${index + 1}. @${displayId(admin)} - ${role}\n`;
      });

      await sendMessage(conn, message.from, adminList, { mentions: mentionIds });
    } catch (error) {
      console.error("Error in admins command:", error);
      await replyFail(
        conn,
        message,
        `╭━━━﹝ *👑 ADMINS* ﹞━━━╮
┃
┃ ❌ *ADMINS FAILED*
┃ Failed to get admin list.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);
