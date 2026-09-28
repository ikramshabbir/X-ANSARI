/**
 * Onboarding, log-group, status, groupsetup, help
 */

import { command } from "../plugins.js";
import { reply, replyOk, replyFail, getCommandArgs } from "../utils/message.js";
import {
  ensureLogGroup,
  getLogGroupJid,
  setLogGroupJid,
  systemLog,
  isSetupDone,
} from "../utils/logGroup.js";
import { kvDel } from "../database/botKv.js";
import { runSetupCommand, checkFfmpeg } from "../onboarding/setup.js";
import {
  setGroupSettings,
} from "../utils/groupSettings.js";
import { getMode, isOwnerMessage, isPrivileged } from "../utils/access.js";
import { getLang } from "../utils/i18n.js";
import { BOT_INFO } from "../config/constants.js";
import os from "os";

command(
  {
    pattern: "createlog",
    fromMe: true,
    desc: "Create/recreate the system log group",
    type: "owner",
  },
  async (message, conn) => {
    if (!(await isPrivileged(message, conn))) {
      await replyFail(conn, message, `╭━━━━*〔 📝 CREATELOG 〕*━━━━╮
┃
┃ 🔒 *OWNER/SUDO ONLY*
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      return;
    }
    await kvDel("log_group_jid");
    const res = await ensureLogGroup(conn);
    if (res.needsManual) {
      await replyFail(
        conn,
        message,
        `╭━━━━*〔 📝 CREATELOG 〕*━━━━╮
┃
┃ ⚠️ *MANUAL SETUP REQUIRED*
┃
┃ Create a group, add the bot,
┃ then ${BOT_INFO.PREFIX}setlog
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }
    if (!res.jid) {
      await replyFail(
        conn,
        message,
        `╭━━━━*〔 📝 CREATELOG 〕*━━━━╮
┃
┃ ❌ *CREATELOG FAILED*
┃ ${res.error || "Unknown error"}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }
    await replyOk(
      conn,
      message,
      `╭━━━━*〔 📝 CREATELOG 〕*━━━━╮
┃
┃ ${res.created ? "✅ *SYSTEM GROUP CREATED*" : "✅ *SYSTEM GROUP FOUND*"}
┃
┃ 🆔 *JID:* \`${res.jid}\`
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "setlog",
    fromMe: true,
    desc: "Mark this group as the system log group",
    type: "owner",
    groupOnly: true,
  },
  async (message, conn) => {
    if (!isOwnerMessage(message, conn) && !message.key.fromMe) {
      await replyFail(conn, message, `╭━━━━*〔 📝 SETLOG 〕*━━━━╮
┃
┃ 🔒 *OWNER ONLY*
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      return;
    }
    if (!message.isGroup) {
      await replyFail(conn, message, `╭━━━━*〔 📝 SETLOG 〕*━━━━╮
┃
┃ ⚠️ *GROUP REQUIRED*
┃ Run this command inside a group.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      return;
    }
    await setLogGroupJid(message.from);
    await replyOk(
        conn,
        message,
        `╭━━━━*〔 📝 SETLOG 〕*━━━━╮
┃
┃ ✅ *SYSTEM LOG GROUP SET*
┃
┃ Run ${BOT_INFO.PREFIX}setup here.
┃
┃ _Errors will only be posted in this group._
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
    await systemLog("success", `Log group set to ${message.from}`);
  }
);

command(
  {
    pattern: "setup",
    fromMe: true,
    desc: "Onboarding wizard (system log group only)",
    type: "owner",
  },
  async (message, conn) => {
    if (!(await isPrivileged(message, conn))) {
      await replyFail(
      conn,
      message,
      `╭━━━━*〔 ⚙️ SETUP 〕*━━━━╮
┃
┃ 🔒 *OWNER/SUDO ONLY*
┃ This command is restricted to owner/sudo.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
    );
      return;
    }
    const args = getCommandArgs(message.body, "setup") || "";
    let result = await runSetupCommand(message, conn, args);
    if (result.continue) {
      result = await runSetupCommand(message, conn, "start");
    }
    if (result.ok) await reply(conn, message, result.text);
    else await replyFail(conn, message, result.text);
  }
);

command(
  {
    pattern: "groupsetup",
    fromMe: false,
    desc: "Quick group moderation setup",
    type: "admin",
    groupOnly: true,
    adminOnly: true,
  },
  async (message, conn) => {
    const args = (getCommandArgs(message.body, "groupsetup") || "")
      .trim()
      .toLowerCase();

    if (!args || args === "help") {
      await reply(
        conn,
        message,
        `╭━━━━*〔 🧑‍🔧 GROUP SETUP 〕*━━━━╮
┃
┃ ⚙️ *QUICK GROUP MODERATION*
┃
┃ ${BOT_INFO.PREFIX}groupsetup recommended
┃ Welcome + antilink + antispam ON
┃
┃ ${BOT_INFO.PREFIX}groupsetup minimal
┃ Welcome only
┃
┃ ${BOT_INFO.PREFIX}groupsetup off
┃ Disable all moderation features
┃
┃ 💡 Tweak with ${BOT_INFO.PREFIX}groupsettings
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    if (args === "recommended" || args === "full") {
      await setGroupSettings(message.from, {
        welcome: true,
        goodbye: true,
        antilink: true,
        antispam: true,
      });
      await replyOk(
        conn,
        message,
        `╭━━━━*〔 🧑‍🔧 GROUP SETUP 〕*━━━━╮
┃
┃ ✅ *RECOMMENDED APPLIED*
┃
┃ 👋 Welcome: ON
┃ 👋 Goodbye: ON
┃ 🔗 Antilink: ON
┃ 🛡️ Antispam: ON
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    if (args === "minimal") {
      await setGroupSettings(message.from, {
        welcome: true,
        goodbye: false,
        antilink: false,
        antispam: false,
      });
      await replyOk(conn, message, `╭━━━━*〔 🧑‍🔧 GROUP SETUP 〕*━━━━╮
┃
┃ ✅ *MINIMAL APPLIED*
┃
┃ 👋 Welcome: ON
┃ 🔗 Antilink: OFF
┃ 🛡️ Antispam: OFF
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      return;
    }

    if (args === "off") {
      await setGroupSettings(message.from, {
        welcome: false,
        goodbye: false,
        antilink: false,
        antispam: false,
      });
      await replyOk(conn, message, `╭━━━━*〔 🧑‍🔧 GROUP SETUP 〕*━━━━╮
┃
┃ 🔴 *MODERATION DISABLED*
┃
┃ 👋 Welcome: OFF
┃ 👋 Goodbye: OFF
┃ 🔗 Antilink: OFF
┃ 🛡️ Antispam: OFF
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      return;
    }

    await replyFail(conn, message, `╭━━━━*〔 🧑‍🔧 GROUP SETUP 〕*━━━━╮
┃
┃ ⚠️ *INVALID OPTION*
┃
┃ Use:
┃ ${BOT_INFO.PREFIX}groupsetup recommended
┃ ${BOT_INFO.PREFIX}groupsetup minimal
┃ ${BOT_INFO.PREFIX}groupsetup off
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
  }
);

command(
  {
    pattern: "status",
    fromMe: false,
    desc: "Bot health status",
    type: "misc",
  },
  async (message, conn) => {
    const privileged = await isPrivileged(message, conn);
    const ff = await checkFfmpeg();
    const mode = await getMode();
    const lang = await getLang();
    const logJid = await getLogGroupJid();
    const setup = await isSetupDone();

    const totalSeconds = Math.floor(process.uptime());
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const uptime =
      `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const mem = Math.round(
      process.memoryUsage().rss / 1024 / 1024
    );

    let text =
      `╭━━━━*〔 📊 STATUS 〕*━━━━╮\n` +
      `┃\n` +
      `┃ 🤖 *BOT*\n` +
      `┃ ├─ Name      : ${BOT_INFO.NAME}\n` +
      `┃ └─ Version   : v${BOT_INFO.VERSION}\n` +
      `┃\n` +
      `┃ ⚡ *SYSTEM*\n` +
      `┃ ├─ Uptime    : ${uptime}\n` +
      `┃ ├─ Mode      : ${mode}\n` +
      `┃ ├─ Language  : ${lang}\n` +
      `┃ ├─ FFmpeg    : ${ff.ok ? "✅ Ready" : "❌ Missing"}\n` +
      `┃ └─ Setup     : ${setup ? "✅ Complete" : "⏳ Pending"}\n`;

    if (privileged) {
      text +=
        `┃\n` +
        `┃ 🔐 *OWNER INFO*\n` +
        `┃ ├─ RSS       : ${mem} MB\n` +
        `┃ ├─ Platform  : ${os.platform()}\n` +
        `┃ ├─ Log Group : ${logJid || "Not set"}\n` +
        `┃ └─ User      : ${conn.user?.id || "Unknown"}\n`;
    }

    text +=
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    await reply(conn, message, text);
  }
);
