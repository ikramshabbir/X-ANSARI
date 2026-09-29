/**
 * Enterprise commands: audit, flags, policy, role, backup, metrics
 */

import { command } from "../plugins.js";
import {
  reply,
  replyOk,
  replyFail,
  getCommandArgs,
  withTyping,
} from "../utils/message.js";
import { writeAudit, queryAudit, clearAudit } from "../enterprise/audit.js";
import { getFlags, setFlag, COMMAND_FLAGS } from "../enterprise/flags.js";
import { getPolicies, setPolicy } from "../enterprise/policy.js";
import {
  setUserRole,
  listRoles,
  resolveRole,
  can,
  ROLES,
} from "../enterprise/rbac.js";
import { createBackup } from "../enterprise/backup.js";
import { getMetricsSnapshot } from "../enterprise/metrics.js";
import { queueStats } from "../enterprise/queue.js";
import { isLogGroupAsync } from "../utils/logGroup.js";
import {
  isOwnerMessage,
  isPrivileged,
  normalizeNumber,
} from "../utils/access.js";
import { resolveTargetUser, displayId } from "../utils/group.js";
import { BOT_INFO } from "../config/constants.js";
import fs from "fs/promises";

async function requireLogGroup(message) {
  return isLogGroupAsync(message.from);
}

command(
  {
    pattern: "audit",
    fromMe: true,
    desc: "Show audit log (system group)",
    type: "owner",
  },
  async (message, conn) => {
    if (!(await can(message, conn, "audit.read"))) {
      await replyFail(
        conn,
        message,
        `╭━━﹝ *📋 AUDIT* ﹞━━╮
┃
┃ ❌ *PERMISSION DENIED*
┃ No permission.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }
    if (!(await requireLogGroup(message))) {
      await replyFail(
        conn,
        message,
        `╭━━﹝ *📋 AUDIT* ﹞━━╮
┃
┃ ⚠️ *SYSTEM LOG GROUP REQUIRED*
┃ Use \`#audit\` only in the *system log group*.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const raw = (getCommandArgs(message.body, "audit") || "").trim();
    if (raw === "clear" && isOwnerMessage(message, conn)) {
      await clearAudit();
      await writeAudit({
        action: "audit.clear",
        actor: message.sender,
        chat: message.from,
      });
      await replyOk(
      conn,
      message,
      `╭━━﹝ *📋 AUDIT* ﹞━━╮\n` +
      `┃\n` +
      `┃ ✅ *AUDIT LOG CLEARED*\n` +
      `┃ 🧹 All audit entries removed.\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━╯`
    );
      return;
    }

    const [filter, lim] = raw.split(/\s+/);
    const limit = parseInt(lim || filter, 10);
    const rows = await queryAudit({
      limit: Number.isFinite(limit) ? limit : 15,
      action: Number.isFinite(limit) ? undefined : filter || undefined,
    });

    if (!rows.length) {
      await reply(
      conn,
      message,
      `╭━━﹝ *📋 AUDIT* ﹞━━╮\n` +
      `┃\n` +
      `┃ 📭 *AUDIT LOG EMPTY*\n` +
      `┃ No audit entries found.\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━╯`
    );
      return;
    }

    const lines = rows.map((r) => {
      const t = new Date(r.ts).toISOString().slice(5, 19).replace("T", " ");
      return `• \`${t}\` *${r.action}* by ${r.actor}` +
        (r.target ? ` → ${r.target}` : "") +
        (r.chat ? `\n  chat:${r.chat}` : "");
    });
    await reply(
    conn,
    message,
    `╭━━﹝ *📋 AUDIT* ﹞━━╮\n` +
    `┃\n` +
    `┃ 📋 *AUDIT LOG — LATEST*\n` +
    `┃\n` +
    `${lines
      .join("\n")
      .split("\n")
      .map((x) => `┃ ${x}`)
      .join("\n")}\n` +
    `┃\n` +
    `╰━━━━━━━━━━━━━━━━━╯`
  );
  }
);

command(
  {
    pattern: "flag",
    fromMe: true,
    desc: "Feature flags: #flag list | #flag media off",
    type: "owner",
  },
  async (message, conn) => {
    if (!(await can(message, conn, "flag")) && !(await isPrivileged(message, conn))) {
      await replyFail(
        conn,
        message,
        `╭━━﹝ *🚩 FLAG* ﹞━━╮
┃
┃ ❌ *PERMISSION DENIED*
┃ No permission.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const raw = (getCommandArgs(message.body, "flag") || "").trim();
    if (!raw || raw === "list") {
      const flags = await getFlags();
      const lines = Object.entries(flags)
        .map(([k, v]) => `• ${k}: *${v ? "ON" : "OFF"}*`)
        .join("\n");
      await reply(
      conn,
      message,
      `╭━━﹝ *🚩 FLAG* ﹞━━╮\n` +
      `┃\n` +
      `┃ 🚩 *FEATURE FLAGS*\n` +
      `┃\n` +
      `${lines.split("\n").map((x) => `┃ ${x.replace(/^• /, "")}`).join("\n")}\n` +
      `┃\n` +
      `┃ 🔗 *Mapped:* ${Object.keys(COMMAND_FLAGS).slice(0, 12).join(", ")}…\n` +
      `┃ 💡 *Usage:* \`${BOT_INFO.PREFIX}flag <name> on|off\`\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━╯`
    );
    return;
    }

    const [name, state] = raw.split(/\s+/);
    if (!name || !["on", "off", "true", "false", "1", "0"].includes((state || "").toLowerCase())) {
      await replyFail(
        conn,
        message,
        `Usage: \`${BOT_INFO.PREFIX}flag media off\``
      );
      return;
    }
    const on = ["on", "true", "1"].includes(state.toLowerCase());
    const flags = await setFlag(name, on);
    await writeAudit({
      action: "flag.set",
      actor: message.sender,
      meta: { name, on },
      chat: message.from,
    });
    await replyOk(
      conn,
      message,
      `╭━━﹝ *🚩 FLAG* ﹞━━╮\n` +
      `┃\n` +
      `┃ ✅ *FLAG UPDATED*\n` +
      `┃ 🚩 *NAME:* ${name}\n` +
      `┃ ${flags[name] ? "🟢" : "🔴"} *STATUS:* ${flags[name] ? "ON" : "OFF"}\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "policy",
    fromMe: true,
    desc: "View/set global policies",
    type: "owner",
  },
  async (message, conn) => {
    if (!(await can(message, conn, "policy"))) {
      await replyFail(
        conn,
        message,
        `╭━━﹝ *📜 POLICY* ﹞━━╮
┃
┃ ❌ *PERMISSION DENIED*
┃ No permission.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }
    const raw = (getCommandArgs(message.body, "policy") || "").trim();
    if (!raw || raw === "list") {
      const p = await getPolicies();
      await reply(
        conn,
        message,
        `╭━━﹝ *📜 POLICY* ﹞━━╮\n` +
        `┃\n` +
        `┃ 📜 *GLOBAL POLICIES*\n` +
        `┃\n` +
        `${Object.entries(p)
          .map(([k, v]) => `┃ • ${k}: \`${v}\``)
          .join("\n")}\n` +
        `┃\n` +
        `┃ 💡 *Set:* \`${BOT_INFO.PREFIX}policy rateLimitPerUser 30\`\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const [key, ...rest] = raw.split(/\s+/);
    let value = rest.join(" ").trim();
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (value === "null" || value === "none") value = null;
    else if (/^\d+$/.test(value)) value = Number(value);

    const p = await setPolicy(key, value);
    await writeAudit({
      action: "policy.set",
      actor: message.sender,
      meta: { key, value },
      chat: message.from,
    });
    await replyOk(
      conn,
      message,
      `╭━━﹝ *📜 POLICY* ﹞━━╮\n` +
      `┃\n` +
      `┃ ✅ *POLICY UPDATED*\n` +
      `┃ 📜 *KEY:* ${key}\n` +
      `┃ ⚙️ *VALUE:* \`${p[key]}\`\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━╯`
    );
  }
);

command(
  {
    pattern: "role",
    fromMe: true,
    desc: "RBAC: #role set @user admin | list",
    type: "owner",
  },
  async (message, conn) => {
    if (!(await can(message, conn, "role.manage")) && !isOwnerMessage(message, conn)) {
      await replyFail(
        conn,
        message,
        `╭━━﹝ *👤 ROLE* ﹞━━╮
┃
┃ ❌ *PERMISSION DENIED*
┃ Owner/admin only.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const raw = (getCommandArgs(message.body, "role") || "").trim();
    if (!raw || raw === "list") {
      const map = await listRoles();
      const entries = Object.entries(map);
      if (!entries.length) {
        await reply(
          conn,
          message,
          `╭━━﹝ *👤 ROLE* ﹞━━╮\n` +
          `┃\n` +
          `┃ 📭 *ROLE LIST EMPTY*\n` +
          `┃ No custom roles assigned.\n` +
          `┃ 🛡️ Sudo users default to admin.\n` +
          `┃\n` +
          `╰━━━━━━━━━━━━━━━━━╯`
        );
        return;
      }
      await reply(
        conn,
        message,
        `╭━━﹝ *👤 ROLE* ﹞━━╮\n` +
        `┃\n` +
        `┃ 👤 *ROLE LIST*\n` +
        `┃\n` +
        `${entries.map(([n, r]) => `┃ • ${n}: *${r}*`).join("\n")}\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const [action, a2, a3] = raw.split(/\s+/);
    if (action === "me") {
      const r = await resolveRole(message, conn);
      await reply(
        conn,
        message,
        `╭━━﹝ *👤 ROLE* ﹞━━╮\n` +
        `┃\n` +
        `┃ 👤 *YOUR ROLE*\n` +
        `┃ 🛡️ *ROLE:* ${r}\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    if (action === "set") {
      let target = a2;
      let role = a3;
      if (!role) {
        role = a2;
        target = resolveTargetUser(message);
      }
      const n = normalizeNumber(target);
      if (!n || !role) {
        await replyFail(
          conn,
          message,
          `Usage: \`${BOT_INFO.PREFIX}role set @user admin\`\nRoles: ${ROLES.filter((r) => r !== "owner").join(", ")}`
        );
        return;
      }
      try {
        const r = await setUserRole(n, role);
        await writeAudit({
          action: "role.set",
          actor: message.sender,
          target: n,
          meta: { role: r },
        });
        await replyOk(
        conn,
        message,
        `╭━━﹝ *👤 ROLE* ﹞━━╮\n` +
        `┃\n` +
        `┃ ✅ *ROLE UPDATED*\n` +
        `┃ 👤 *USER:* ${n}\n` +
        `┃ 🛡️ *ROLE:* ${r}\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━━╯`
      );
      } catch (err) {
        await replyFail(
          conn,
          message,
          `╭━━﹝ *👤 ROLE* ﹞━━╮
┃
┃ ❌ *ROLE UPDATE FAILED*
┃ ${err.message}
┃
╰━━━━━━━━━━━━━━━━━╯`
        );
      }
      return;
    }

    await replyFail(
        conn,
        message,
        `╭━━﹝ *👤 ROLE* ﹞━━╮
┃
┃ ⚠️ *INVALID ACTION*
┃ Use \`list\`, \`me\`, or \`set\`.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
  }
);

command(
  {
    pattern: "backup",
    fromMe: true,
    desc: "Export BotKV backup (optional auth db)",
    type: "owner",
  },
  async (message, conn) => {
    if (!(await can(message, conn, "backup")) && !isOwnerMessage(message, conn)) {
      await replyFail(
        conn,
        message,
        `╭━━﹝ *💾 BACKUP* ﹞━━╮
┃
┃ ❌ *PERMISSION DENIED*
┃ No permission.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }

    const raw = (getCommandArgs(message.body, "backup") || "").trim().toLowerCase();
    const includeAuth = raw === "full" || raw === "auth";

    await withTyping(conn, message.from, async () => {
      try {
        const { jsonPath, dbCopy, checksum } = await createBackup({
          includeAuth,
        });
        await writeAudit({
          action: "backup.create",
          actor: message.sender,
          meta: { includeAuth, checksum },
          chat: message.from,
        });

        const buf = await fs.readFile(jsonPath);
        await conn.sendMessage(message.from, {
          document: buf,
          mimetype: "application/json",
          fileName: `xasena-backup-${checksum}.json`,
          caption:
              `╭━━﹝ *💾 BACKUP* ﹞━━╮\n` +
              `┃\n` +
              `┃ ✅ *BACKUP READY*\n` +
              `┃ 🔐 *SHA256:* \`${checksum}\`\n` +
              (dbCopy ? `┃ 💿 *DB COPY:* \`${dbCopy}\`\n` : "") +
              `┃\n` +
              `╰━━━━━━━━━━━━━━━━━╯`,
});
      } catch (err) {
        await replyFail(
          conn,
          message,
          `╭━━﹝ *💾 BACKUP* ﹞━━╮
┃
┃ ❌ *BACKUP FAILED*
┃ ${err?.message || "Backup failed"}
┃
╰━━━━━━━━━━━━━━━━━╯`
        );
      }
    });
  }
);

command(
  {
    pattern: "metrics",
    fromMe: true,
    desc: "Show runtime metrics",
    type: "owner",
  },
  async (message, conn) => {
    if (!(await isPrivileged(message, conn))) {
      await replyFail(
        conn,
        message,
        `╭━━﹝ *💾 BACKUP* ﹞━━╮
┃
┃ ❌ *PERMISSION DENIED*
┃ Owner/sudo only.
┃
╰━━━━━━━━━━━━━━━━━╯`
      );
      return;
    }
    const m = getMetricsSnapshot();
    const q = queueStats();
    await reply(
      conn,
      message,
      `╭━━﹝ *💾 BACKUP* ﹞━━╮\n` +
    `┃\n` +
    `┃ 📈 *RUNTIME METRICS*\n` +
    `┃\n` +
    `┃ ⏱️ *Uptime:* ${m.uptime_s}s\n` +
    `┃ 📊 *Commands:* ${m.counters.commands || 0}\n` +
    `┃ ❌ *Errors:* ${m.counters.errors || 0} (last min: ${m.errors_last_min})\n` +
    `┃ ⚙️ *Jobs:* ${m.counters.jobs_ok || 0}/${m.counters.jobs_fail || 0}\n` +
    `┃ ⚡ *Avg Job:* ${m.avg_job_ms}ms\n` +
    `┃ 📦 *Queue:* ${q.active} active / ${q.pending} pending\n` +
    `┃ 🏢 *Tenant:* \`${process.env.TENANT_ID || "default"}\`\n` +
    `┃\n` +
    `╰━━━━━━━━━━━━━━━━━╯`
);
  }
);
