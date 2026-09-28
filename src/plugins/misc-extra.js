/**
 * Language, per-group plugin toggle, broadcast
 */

import { command, getMenuCommands } from "../plugins.js";
import {
  reply,
  replyOk,
  replyFail,
  getCommandArgs,
  withTyping,
} from "../utils/message.js";
import {
  getLang,
  setLang,
  AVAILABLE_LANGS,
  t,
} from "../utils/i18n.js";
import {
  getGroupSettings,
  setGroupSettings,
} from "../utils/groupSettings.js";
import { BOT_INFO } from "../config/constants.js";
import { isOwnerMessage } from "../utils/access.js";

command(
  {
    pattern: "lang",
    fromMe: false,
    desc: "Show/set bot language (en|id|hi)",
    type: "misc",
  },
  async (message, conn) => {
    const args = (getCommandArgs(message.body, "lang") || "").trim().toLowerCase();
    if (!args) {
      const lang = await getLang();
      await reply(
        conn,
        message,
        `╭━━━〔 *🌐 LANG* 〕━━━╮
┃
┃ 🌐 *LANGUAGE*
┃ 🗣️ *CURRENT:* ${lang}
┃ 📋 *AVAILABLE:* ${AVAILABLE_LANGS.join(", ")}
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }
    try {
      const next = await setLang(args);
      await replyOk(conn, message, await t("LANG_SET", { lang: next }));
    } catch {
      await replyFail(
        conn,
        message,
        `Supported: ${AVAILABLE_LANGS.join(", ")}`
      );
    }
  }
);

command(
  {
    pattern: "disable",
    fromMe: false,
    desc: "Disable a command in this group",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const name = (getCommandArgs(message.body, "disable") || "")
      .trim()
      .toLowerCase();
    if (!name) {
      await reply(
        conn,
        message,
        `╭━━━〔 *🚫 DISABLE* 〕━━━╮
┃
┃ ⚠️ *COMMAND NAME REQUIRED*
┃
┃ 💡 *USAGE:* ${BOT_INFO.PREFIX}disable <command>
┃
╰━━━━━━━━━━━━━━━━━╯`
      )
      return;
    }
    // Protect critical commands
    const protectedCmds = new Set([
      "enable",
      "disable",
      "mode",
      "sudo",
      "menu",
      "help",
      "plugins",
    ]);
    if (protectedCmds.has(name)) {
      await reply(
      conn,
      message,
      `╭━━━〔 *🚫 DISABLE* 〕━━━╮
┃
┃ 🔒 *COMMAND PROTECTED*
┃ That command cannot be disabled.
┃
╰━━━━━━━━━━━━━━━━━╯`
    )
      return;
    }
    const s = await getGroupSettings(message.from);
    const list = new Set((s.disabledPlugins || []).map((x) => x.toLowerCase()));
    list.add(name);
    await setGroupSettings(message.from, {
      disabledPlugins: [...list],
    });
    await reply(
      conn,
      message,
      `╭━━━〔 *🚫 DISABLE* 〕━━━╮
┃
┃ ✅ *COMMAND DISABLED*
┃ 🔧 *COMMAND:* ${BOT_INFO.PREFIX}${name}
┃
╰━━━━━━━━━━━━━━━━━╯`
    )
  }
);

command(
  {
    pattern: "enable",
    fromMe: false,
    desc: "Re-enable a command in this group",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const name = (getCommandArgs(message.body, "enable") || "")
      .trim()
      .toLowerCase();
    if (!name) {
      await reply(
        conn,
        message,
        `╭━━━〔 *✅ ENABLE* 〕━━━╮
┃
┃ ⚠️ *COMMAND NAME REQUIRED*
┃
┃ 💡 *USAGE:* ${BOT_INFO.PREFIX}enable <command>
┃
╰━━━━━━━━━━━━━━━━━╯`
      )
      return;
    }
    const s = await getGroupSettings(message.from);
    await setGroupSettings(message.from, {
      disabledPlugins: (s.disabledPlugins || []).filter(
        (x) => x.toLowerCase() !== name
      ),
    });
    await reply(
      conn,
      message,
      `╭━━━〔 *✅ ENABLE* 〕━━━╮
┃
┃ ✅ *COMMAND ENABLED*
┃ 🔧 *COMMAND:* ${BOT_INFO.PREFIX}${name}
┃
╰━━━━━━━━━━━━━━━━━╯`
    )
  }
);

command(
  {
    pattern: "plugins",
    fromMe: false,
    desc: "List disabled commands in this group",
    type: "admin",
    groupOnly: true,
  },
  async (message, conn) => {
    const s = await getGroupSettings(message.from);
    const disabled = s.disabledPlugins || [];
    if (!disabled.length) {
      await reply(
        conn,
        message,
        `╭━━━〔 *🔌 PLUGINS* 〕━━━╮
┃
┃ 📭 *NO DISABLED COMMANDS*
┃ All commands are enabled.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }
    await reply(
      conn,
      message,
      `╭━━━〔 *🔌 PLUGINS* 〕━━━╮
┃
┃ 🚫 *DISABLED COMMANDS*
┃
┃ ${disabled.map((c) => `• ${BOT_INFO.PREFIX}${c}`).join("\n┃ ")}
┃
╰━━━━━━━━━━━━━━━━━╯`
    )
  }
);

command(
  {
    pattern: "broadcast",
    fromMe: true,
    desc: "Broadcast message to all groups (owner)",
    type: "owner",
  },
  async (message, conn) => {
    if (!isOwnerMessage(message, conn) && !message.key.fromMe) {
      await reply(
        conn,
        message,
        `╭━━━〔 *📢 BROADCAST* 〕━━━╮
┃
┃ 🔒 *OWNER ONLY*
┃ This command is restricted to the owner.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const text = (getCommandArgs(message.body, "broadcast") || "").trim();
    if (!text) {
      await reply(
        conn,
        message,
        `╭━━━〔 *📢 BROADCAST* 〕━━━╮
┃
┃ ⚠️ *MESSAGE REQUIRED*
┃
┃ 💡 *USAGE:* ${BOT_INFO.PREFIX}broadcast <message>
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    await withTyping(conn, message.from, async () => {
      let groups = {};
      try {
        groups = await conn.groupFetchAllParticipating();
      } catch (err) {
        await reply(
          conn,
          message,
          `╭━━━〔 *📢 BROADCAST* 〕━━━╮
┃
┃ ❌ *GROUP FETCH FAILED*
┃ ${err?.message || err}
┃
╰━━━━━━━━━━━━━━━━━╯`
        );
        return;
      }

      const jids = Object.keys(groups || {});
      let ok = 0;
      for (const jid of jids) {
        try {
          await conn.sendMessage(jid, {
            text: `📢 *Broadcast*\n\n${text}`,
          });
          ok += 1;
          // gentle rate limit
          await new Promise((r) => setTimeout(r, 400));
        } catch {
          /* skip */
        }
      }

      await replyOk(
        conn,
        message,
        `╭━━━〔 *📢 BROADCAST* 〕━━━╮
┃
┃ ✅ *BROADCAST COMPLETE*
┃ 📤 *SENT:* ${ok}
┃ 👥 *TOTAL GROUPS:* ${jids.length}
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
    }, { timeoutMs: 120_000 });
  }
);

// Optional: list all command names (owner debug)
command(
  {
    pattern: "cmdlist",
    fromMe: true,
    desc: "List all command names",
    type: "owner",
    dontAddCommandList: true,
  },
  async (message, conn) => {
    const cmds = getMenuCommands()
      .map((c) => c.patternName)
      .sort();
    await reply(
        conn,
        message,
        `╭━━━〔 *📋 CMDLIST* 〕━━━╮
┃
┃ 📋 *TOTAL COMMANDS:* ${cmds.length}
┃
┃ ${cmds.join(", ")}
┃
╰━━━━━━━━━━━━━━━━━╯`
      )
  }
);
