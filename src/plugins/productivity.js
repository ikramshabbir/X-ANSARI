/**
 * Notes, reminders, polls
 */

import { command } from "../plugins.js";
import {
  reply,
  replyOk,
  replyFail,
  getCommandArgs,
} from "../utils/message.js";
import { saveNote, getNote, deleteNote, listNotes } from "../utils/notes.js";
import {
  addReminder,
  listReminders,
  cancelReminder,
  parseWhen,
} from "../utils/reminders.js";
import { t } from "../utils/i18n.js";
import { BOT_INFO } from "../config/constants.js";
import { normalizeNumber } from "../utils/access.js";

command(
  {
    pattern: "note",
    fromMe: false,
    desc: "Save/get/delete personal notes",
    type: "misc",
  },
  async (message, conn) => {
    const raw = (getCommandArgs(message.body, "note") || "").trim();
    const owner = message.sender;
    if (!raw) {
      await replyFail(
        conn,
        message,
        `╭━━━━*〔 📝 NOTE 〕*━━━━╮
┃
┃ ⚠️ *USAGE*
┃ ${BOT_INFO.PREFIX}note set <id> <text>
┃ ${BOT_INFO.PREFIX}note get <id>
┃ ${BOT_INFO.PREFIX}note del <id>
┃ ${BOT_INFO.PREFIX}note list
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const [action, id, ...rest] = raw.split(/\s+/);
    const act = action.toLowerCase();

    if (act === "list") {
      const notes = await listNotes(owner);
      if (!notes.length) {
        await reply(conn, message, `╭━━━━*〔 📝 NOTES 〕*━━━━╮
┃
┃ 📭 *NO NOTES*
┃ No saved notes found.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
        return;
      }
      await reply(
        conn,
        message,
        `╭━━━━*〔 📝 NOTES 〕*━━━━╮
┃
┃ 📝 *SAVED NOTES*
┃
┃ ${notes.map((n) => `• *${n.id}* — ${n.text.slice(0, 60)}`).join("\n┃ ")}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    if (act === "get") {
      if (!id) {
        await replyFail(conn, message, `╭━━━━*〔 📝 NOTE 〕*━━━━╮
┃
┃ ⚠️ *NOTE ID REQUIRED*
┃ Provide note id.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
        return;
      }
      const n = await getNote(owner, id);
      if (!n) {
        await replyFail(
        conn,
        message,
        `╭━━━━*〔 📝 NOTE 〕*━━━━╮
┃
┃ ❌ *NOTE NOT FOUND*
┃ ${await t("NOTE_NOT_FOUND")}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
        return;
      }
      await reply(conn, message, `╭━━━━*〔 📝 NOTE 〕*━━━━╮
┃
┃ 📝 *NOTE:* \`${id}\`
┃
┃ ${n.text}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
      return;
    }

    if (act === "del" || act === "delete" || act === "rm") {
      if (!id) {
        await replyFail(
        conn,
        message,
        `╭━━━━*〔 📝 NOTE 〕*━━━━╮
┃
┃ ⚠️ *NOTE ID REQUIRED*
┃ Provide note id.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
        return;
      }
      const ok = await deleteNote(owner, id);
      if (!ok) {
        await replyFail(
        conn,
        message,
        `╭━━━━*〔 📝 NOTE 〕*━━━━╮
┃
┃ ❌ *NOTE NOT FOUND*
┃ ${await t("NOTE_NOT_FOUND")}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
        return;
      }
      await replyOk(conn, message, await t("NOTE_DELETED", { id }));
      return;
    }

    if (act === "set" || act === "add" || act === "save") {
      const text = rest.join(" ").trim();
      if (!id || !text) {
        await replyFail(
          conn,
          message,
          `╭━━━━*〔 📝 NOTE 〕*━━━━╮
┃
┃ ⚠️ *USAGE*
┃ ${BOT_INFO.PREFIX}note set <id> <text>
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
        );
        return;
      }
      await saveNote(owner, id, text);
      await replyOk(conn, message, await t("NOTE_SAVED", { id }));
      return;
    }

    // Shorthand: #note <id> <text> → set
    const text = [id, ...rest].join(" ").trim();
    if (action && text) {
      await saveNote(owner, action, text);
      await replyOk(conn, message, await t("NOTE_SAVED", { id: action }));
      return;
    }

    await replyFail(conn, message, `╭━━━━*〔 📝 NOTE 〕*━━━━╮
┃
┃ ❌ *UNKNOWN ACTION*
┃ Unknown note action.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
  }
);

command(
  {
    pattern: "remind",
    fromMe: false,
    desc: "Set a reminder (e.g. 10m buy milk)",
    type: "misc",
  },
  async (message, conn) => {
    const raw = (getCommandArgs(message.body, "remind") || "").trim();

    if (!raw) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 ⏰ REMIND 〕*━━━━╮
┃
┃ ⚠️ *USAGE*
┃ ${BOT_INFO.PREFIX}remind <time> <text>
┃
┃ 🕐 *TIME:* 30s, 10m, 2h, 1d
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const [whenToken, ...rest] = raw.split(/\s+/);
    const at = parseWhen(whenToken);
    const text = rest.join(" ").trim();

    if (!at || !text) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 ⏰ REMIND 〕*━━━━╮
┃
┃ ❌ *INVALID REMINDER*
┃ Invalid time or empty text.
┃
┃ 💡 *EXAMPLE:* ${BOT_INFO.PREFIX}remind 10m Check oven
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const id = `r_${Date.now().toString(36)}`;

    await addReminder({
      id,
      jid: message.from,
      text,
      at,
      createdBy: normalizeNumber(message.sender) || message.sender,
    });

    const when = new Date(at).toLocaleString();

    await reply(
      conn,
      message,
      `╭━━━━*〔 ⏰ REMIND 〕*━━━━╮
┃
┃ ✅ *REMINDER SET*
┃ ⏰ *WHEN:* ${when}
┃ 📝 *TEXT:* ${text}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }
);
command(
  {
    pattern: "reminders",
    fromMe: false,
    desc: "List pending reminders in this chat",
    type: "misc",
  },
  async (message, conn) => {
    const list = await listReminders(message.from);

    if (!list.length) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 ⏰ REMINDERS 〕*━━━━╮
┃
┃ 📭 *NO REMINDERS*
┃ No pending reminders found.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    await reply(
      conn,
      message,
      `╭━━━━*〔 ⏰ REMINDERS 〕*━━━━╮
┃
┃ ⏰ *PENDING REMINDERS*
┃
┃ ${list
        .map(
          (r) =>
            `• \`${r.id}\` ${new Date(r.at).toLocaleString()} — ${r.text}`
        )
        .join("\n┃ ")}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }
);
command(
  {
    pattern: "cancelremind",
    fromMe: false,
    desc: "Cancel reminder by id",
    type: "misc",
  },
  async (message, conn) => {
    const id = (getCommandArgs(message.body, "cancelremind") || "").trim();

    if (!id) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 ❌ CANCEL REMIND 〕*━━━━╮
┃
┃ ⚠️ *REMINDER ID REQUIRED*
┃
┃ 💡 *USAGE:* ${BOT_INFO.PREFIX}cancelremind <id>
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const ok = await cancelReminder(id);

    if (!ok) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 ❌ CANCEL REMIND 〕*━━━━╮
┃
┃ ❌ *REMINDER NOT FOUND*
┃ No reminder found with this ID.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    await reply(
      conn,
      message,
      `╭━━━━*〔 ❌ CANCEL REMIND 〕*━━━━╮
┃
┃ ✅ *REMINDER CANCELLED*
┃ 🆔 *ID:* \`${id}\`
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }
);
command(
  {
    pattern: "poll",
    fromMe: false,
    desc: "Create a poll: question | opt1 | opt2",
    type: "misc",
  },
  async (message, conn) => {
    const raw = (getCommandArgs(message.body, "poll") || "").trim();

    if (!raw.includes("|")) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 📊 POLL 〕*━━━━╮
┃
┃ ⚠️ *INVALID POLL*
┃
┃ 💡 *USAGE:*
┃ ${BOT_INFO.PREFIX}poll Question? | Option A | Option B
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
    const name = parts[0];
    const values = parts.slice(1);

    if (!name || values.length < 2) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 📊 POLL 〕*━━━━╮
┃
┃ ⚠️ *OPTIONS REQUIRED*
┃ Need a question and at least 2 options.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    if (values.length > 12) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 📊 POLL 〕*━━━━╮
┃
┃ ⚠️ *TOO MANY OPTIONS*
┃ Maximum 12 options are allowed.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    try {
      await conn.sendMessage(message.from, {
        poll: {
          name,
          values,
          selectableCount: 1,
        },
      });
    } catch (err) {
      await reply(
        conn,
        message,
        `╭━━━━*〔 📊 POLL 〕*━━━━╮
┃
┃ ❌ *POLL FAILED*
┃ ${err?.message || "Unsupported"}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
      );
    }
  }
);