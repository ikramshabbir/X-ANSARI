/**
 * Group moderation: welcome, goodbye, antilink, antispam, warn, mute, kick
 */

import { command } from "../plugins.js";
import {
  reply,
  replyOk,
  replyFail,
  getCommandArgs,
  withTyping,
} from "../utils/message.js";
import {
  getGroupSettings,
  setGroupSettings,
  toggleGroupFlag,
  addWarn,
  getWarns,
  resetWarns,
} from "../utils/groupSettings.js";
import { resolveTargetUser, displayId } from "../utils/group.js";
import { normalizeNumber } from "../utils/access.js";
import { t } from "../utils/i18n.js";
import { BOT_INFO } from "../config/constants.js";
import { groupCache } from "../utils/cache.js";

function onOff(v) {
  return v ? "ON" : "OFF";
}

command(
  {
    pattern: "welcome",
    fromMe: false,
    desc: "Toggle/set welcome message",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const args = (getCommandArgs(message.body, "welcome") || "").trim();

    if (!args) {
      const s = await toggleGroupFlag(message.from, "welcome");

      await reply(
        conn,
        message,
        `╭━━━〔 *👋 WELCOME* 〕━━━╮
┃
┃ ${s.welcome ? await t("WELCOME_ON") : await t("WELCOME_OFF")}
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    if (args === "on" || args === "off") {
      await setGroupSettings(message.from, {
        welcome: args === "on",
      });

      await reply(
      conn,
      message,
      `╭━━━〔 *👋 WELCOME* 〕━━━╮
┃
┃ ✅ *WELCOME UPDATED*
┃ 📝 *TEXT:* ${args}
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
      return;
    }

    await setGroupSettings(message.from, {
      welcome: true,
      welcomeText: args,
    });

    await reply(
        conn,
        message,
        `╭━━━〔 *👋 WELCOME* 〕━━━╮
┃
┃ ${args === "on" ? await t("WELCOME_ON") : await t("WELCOME_OFF")}
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
  }
);

command(
  {
    pattern: "goodbye",
    fromMe: false,
    desc: "Toggle/set goodbye message",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const args = (getCommandArgs(message.body, "goodbye") || "").trim();

    if (!args) {
      const s = await toggleGroupFlag(message.from, "goodbye");

      await reply(
        conn,
        message,
        `╭━━━〔 *👋 GOODBYE* 〕━━━╮
┃
┃ ${s.goodbye ? await t("GOODBYE_ON") : await t("GOODBYE_OFF")}
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    if (args === "on" || args === "off") {
      await setGroupSettings(message.from, {
        goodbye: args === "on",
      });

      await reply(
      conn,
      message,
      `╭━━━〔 *👋 GOODBYE* 〕━━━╮
┃
┃ ✅ *GOODBYE UPDATED*
┃ 📝 *TEXT:* ${args}
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
      return;
    }

    await setGroupSettings(message.from, {
      goodbye: true,
      goodbyeText: args,
    });

    await reply(
        conn,
        message,
        `╭━━━〔 *👋 GOODBYE* 〕━━━╮
┃
┃ ${args === "on" ? await t("GOODBYE_ON") : await t("GOODBYE_OFF")}
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
  }
);

command(
  {
    pattern: "antilink",
    fromMe: false,
    desc: "Toggle anti-link",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
  },
  async (message, conn) => {
    const args = (
      getCommandArgs(message.body, "antilink") || ""
    )
      .trim()
      .toLowerCase();

    let s;

    if (args === "on" || args === "off") {
      s = await setGroupSettings(message.from, {
        antilink: args === "on",
      });
    } else {
      s = await toggleGroupFlag(
        message.from,
        "antilink"
      );
    }

    await reply(
      conn,
      message,
      `╭━━━〔 *🔗 ANTILINK* 〕━━━╮
┃
┃ 🔗 *ANTI-LINK:* ${onOff(s.antilink)}
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "antispam",
    fromMe: false,
    desc: "Toggle anti-spam",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const args = (
      getCommandArgs(message.body, "antispam") || ""
    )
      .trim()
      .toLowerCase();

    let s;

    if (args === "on" || args === "off") {
      s = await setGroupSettings(message.from, {
        antispam: args === "on",
      });
    } else {
      s = await toggleGroupFlag(
        message.from,
        "antispam"
      );
    }

    await reply(
      conn,
      message,
      `╭━━━〔 *🛡️ ANTISPAM* 〕━━━╮
┃
┃ 🛡️ *ANTI-SPAM:* ${onOff(s.antispam)}
┃ 📊 *LIMIT:* ${s.antispamLimit}
┃ ⏱️ *WINDOW:* ${s.antispamWindowMs}ms
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "groupsettings",
    fromMe: false,
    desc: "Show group moderation settings",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const s = await getGroupSettings(message.from);

    await reply(
      conn,
      message,
      `╭━━〔 *⚙️ GROUP SETTINGS* 〕━━╮
┃
┃ 👋 *WELCOME:* ${onOff(s.welcome)}
┃ 👋 *GOODBYE:* ${onOff(s.goodbye)}
┃ 🔗 *ANTILINK:* ${onOff(s.antilink)}
┃ 🛡️ *ANTISPAM:* ${onOff(s.antispam)}
┃ ⚠️ *WARN LIMIT:* ${s.warnLimit}
┃ 🔇 *MUTED:* ${s.muted.length}
┃ 🚫 *DISABLED:* ${s.disabledPlugins.join(", ") || "none"}
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "warn",
    fromMe: false,
    desc: "Warn a user (kick at limit)",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
  },
  async (message, conn) => {
    await withTyping(
      conn,
      message.from,
      async () => {
        const target = resolveTargetUser(message);

        if (!target) {
          await replyFail(
            conn,
            message,
            `Reply/mention a user.\nUsage: ${BOT_INFO.PREFIX}warn @user`
          );
          return;
        }

        const settings = await getGroupSettings(
          message.from
        );

        const norm =
          normalizeNumber(target) || target;

        const count = await addWarn(
          message.from,
          norm
        );

        const limit = settings.warnLimit || 3;

        const text = (
          await t("WARNED", {
            count,
            limit,
          })
        ).replace(
          "@user",
          `@${displayId(target)}`
        );

        await conn.sendMessage(
          message.from,
          {
            text,
            mentions: [target],
          }
        );

        if (count >= limit) {
          try {
            await conn.groupParticipantsUpdate(
              message.from,
              [target],
              "remove"
            );

            await resetWarns(
              message.from,
              norm
            );

            const kicked = (
              await t("KICKED_WARNS")
            ).replace(
              "@user",
              `@${displayId(target)}`
            );

            await conn.sendMessage(
              message.from,
              {
                text: kicked,
                mentions: [target],
              }
            );
          } catch {
            await reply(
              conn,
              message,
              `╭━━━〔 *⚠️ WARN* 〕━━━╮
┃
┃ ❌ *REMOVE FAILED*
┃ Could not remove user (need admin).
┃
╰━━━━━━━━━━━━━━━━━╯`
            );
          }
        }
      }
    );
  }
);

command(
  {
    pattern: "unwarn",
    fromMe: false,
    desc: "Reset warns for a user",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const target = resolveTargetUser(message);

    if (!target) {
      await reply(
      conn,
      message,
      `╭━━━〔 *⚠️ UNWARN* 〕━━━╮
┃
┃ ⚠️ *USER REQUIRED*
┃ Reply/mention a user.
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
      return;
    }

    const norm =
      normalizeNumber(target) || target;

    await resetWarns(
      message.from,
      norm
    );

    await reply(
      conn,
      message,
      `╭━━━〔 *⚠️ UNWARN* 〕━━━╮
┃
┃ ✅ *WARNS RESET*
┃ 👤 @${displayId(target)}
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "warns",
    fromMe: false,

    // 👇 ONLY CHANGE
    desc: "Mention group on status",

    type: "admin",
    groupOnly: true,
  },
  async (message, conn) => {
    const target =
      resolveTargetUser(message) ||
      message.sender;

    const norm =
      normalizeNumber(target) || target;

    const count = await getWarns(
      message.from,
      norm
    );

    const settings =
      await getGroupSettings(message.from);

    await reply(
      conn,
      message,
      `╭━━━〔 *⚠️ WARNS* 〕━━━╮
┃
┃ 👤 *USER:* @${displayId(target)}
┃ ⚠️ *WARNS:* ${count}/${settings.warnLimit}
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "mute",
    fromMe: false,
    desc: "Mute a user in this group",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const target =
      resolveTargetUser(message);

    if (!target) {
      await reply(
      conn,
      message,
      `╭━━━〔 *🔇 MUTE* 〕━━━╮
┃
┃ ⚠️ *USER REQUIRED*
┃ Reply/mention a user.
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
      return;
    }

    const s =
      await getGroupSettings(message.from);

    const n =
      normalizeNumber(target) || target;

    if (!s.muted.includes(n)) {
      s.muted.push(n);
    }

    await setGroupSettings(
      message.from,
      {
        muted: s.muted,
      }
    );

    await reply(
      conn,
      message,
      `╭━━━〔 *🔇 MUTE* 〕━━━╮
┃
┃ 🔇 *MUTED*
┃ 👤 @${displayId(target)}
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "unmute",
    fromMe: false,
    desc: "Unmute a user",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const target =
      resolveTargetUser(message);

    if (!target) {
      await reply(
      conn,
      message,
      `╭━━━〔 *🔊 UNMUTE* 〕━━━╮
┃
┃ ⚠️ *USER REQUIRED*
┃ Reply/mention a user.
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
      return;
    }

    const s =
      await getGroupSettings(message.from);

    const n =
      normalizeNumber(target) || target;

    await setGroupSettings(
      message.from,
      {
        muted: (s.muted || []).filter(
          (x) => x !== n
        ),
      }
    );

    await reply(
      conn,
      message,
      `╭━━━〔 *🔊 UNMUTE* 〕━━━╮
┃
┃ 🔊 *UNMUTED*
┃ 👤 @${displayId(target)}
┃
╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "kickall",
    fromMe: false,
    desc: "Remove all group members",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
  },
  async (message, conn) => {
    try {
      const metadata = await conn.groupMetadata(message.from);
      const participants = metadata?.participants || [];

      const botJid =
        conn.user?.id?.split(":")[0] +
        "@" +
        (conn.user?.id?.includes("@") ? conn.user.id.split("@")[1] : "s.whatsapp.net");

      const botNumber = botJid.split("@")[0];

      const protectedUsers = new Set([
        metadata.owner,
        botJid,
        `${botNumber}@s.whatsapp.net`,
      ]);

      const targets = participants
        .filter((p) => {
          const jid = p?.id;
          if (!jid) return false;

          // Never remove group owner.
          if (jid === metadata.owner) return false;

          // Never remove the bot itself.
          if (protectedUsers.has(jid)) return false;

          // Keep other group admins safe.
          if (p.admin === "admin" || p.admin === "superadmin") return false;

          return true;
        })
        .map((p) => p.id);

      if (!targets.length) {
        await reply(
              conn,
              message,
              `╭━━━〔 *🚀 KICKALL* 〕━━━╮
┃
┃ ❌ *KICKALL FAILED*
┃ Failed to remove all members.
┃ Bot must be admin.
┃
╰━━━━━━━━━━━━━━━━━╯`
            );
        return;
      }

      let removed = 0;

      for (let i = 0; i < targets.length; i += 5) {
        const batch = targets.slice(i, i + 5);

        try {
          await conn.groupParticipantsUpdate(
            message.from,
            batch,
            "remove"
          );
          removed += batch.length;
        } catch {}
      }

      groupCache.delete(message.from);

      await replyOk(
        conn,
        message,
        `🚀 Removed ${removed} group member${removed === 1 ? "" : "s"}.`
      );
    } catch {
      await replyFail(
        conn,
        message,
        "Failed to kick all members (bot must be admin)."
      );
    }
  }
);


command(
  {
    pattern: "kick",
    fromMe: false,
    desc: "Remove a member",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
  },
  async (message, conn) => {
    const target =
      resolveTargetUser(message);

    if (!target) {
      await reply(
        conn,
        message,
        `╭━━━〔 *🦵 KICK* 〕━━━╮
┃
┃ ⚠️ *USER REQUIRED*
┃ Reply/mention a user.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    try {
      await conn.groupParticipantsUpdate(
        message.from,
        [target],
        "remove"
      );

      groupCache.delete(
        message.from
      );

      await reply(
        conn,
        message,
        `╭━━━〔 *🦵 KICK* 〕━━━╮
┃
┃ ✅ *REMOVED*
┃ 👤 @${displayId(target)}
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    } catch {
      await reply(
        conn,
        message,
        `╭━━━〔 *🦵 KICK* 〕━━━╮
┃
┃ ❌ *KICK FAILED*
┃ Bot must be admin.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);
