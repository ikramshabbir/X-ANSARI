/**
 * First-run / setup wizard — runs in the system log group only
 */

import { kvGet, kvSet } from "../database/botKv.js";
import { getLogGroupJid, isSetupDone, markSetupDone, systemLog } from "../utils/logGroup.js";
import { getMode, setMode } from "../utils/access.js";
import { getLang, setLang, AVAILABLE_LANGS } from "../utils/i18n.js";
import { kvGet as kvGetRaw, kvSet as kvSetRaw } from "../database/botKv.js";
import { BOT_INFO, MEDIA } from "../config/constants.js";
import { getFfmpegPath } from "../utils/ffmpeg.js";
const STEP_KEY = "setup_step";

export async function getSetupStep() {
  return (await kvGet(STEP_KEY)) || "idle";
}

export async function setSetupStep(step) {
  await kvSet(STEP_KEY, step);
}

export async function checkFfmpeg() {
  const ffmpegPath = getFfmpegPath();

  if (ffmpegPath) {
    return { ok: true, path: ffmpegPath };
  }

  return {
    ok: false,
    error: "FFmpeg not found",
  };
}

/**
 * Post welcome + checklist into log group after connect
 */
export async function startOnboardingIfNeeded(conn) {
  const logJid = await getLogGroupJid();
  if (!logJid) return;

  const done = await isSetupDone();
  const ff = await checkFfmpeg();

  if (!ff.ok) {
    await systemLog(
      "warn",
      "FFmpeg not on PATH — #ytmp3 / #tomp3 / video stickers will fail.",
      ff.error
    );
  } else {
    await systemLog("info", "FFmpeg OK");
  }

  if (done) {
    await systemLog(
      "success",
      `${BOT_INFO.NAME} online · mode=${await getMode()} · lang=${await getLang()}`
    );
    return;
  }

  await setSetupStep("await_start");
  await conn.sendMessage(logJid, {
    text:
      `👋 *Welcome to ${BOT_INFO.NAME}*\n\n` +
      `This is your *system / log group*.\n` +
      `• Setup & diagnostics stay *here*\n` +
      `• Other chats only see friendly replies (no stack traces)\n\n` +
      `*Owner:* Linked WhatsApp session ✅\n` +
      `*FFmpeg:* ${ff.ok ? "✅" : "❌ missing"}\n\n` +
      `Run \`${BOT_INFO.PREFIX}setup\` to start the wizard.\n` +
      `Or \`${BOT_INFO.PREFIX}setup skip\` to mark setup done.`,
  });
}

/**
 * Handle #setup conversation inside log group
 */
export async function runSetupCommand(message, conn, args) {
  const logJid = await getLogGroupJid();
  if (!logJid || message.from !== logJid) {
    return {
      ok: false,
      text:
        `╭━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ ⚠️ *SYSTEM LOG GROUP REQUIRED*
┃
┃ Setup runs only in the system log group.
┃
┃ 💡 Use ${BOT_INFO.PREFIX}createlog / ${BOT_INFO.PREFIX}setlog
┃ first, then run setup there.
┃
╰━━━━━━━━━━━━━━━━━╯`,
    };
  }

  const raw = (args || "").trim().toLowerCase();

  if (raw === "skip" || raw === "done") {
    await markSetupDone(true);
    await setSetupStep("done");
    return {
      ok: true,
      text: `╭━━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ ✅ *SETUP COMPLETE*
┃
┃ Use ${BOT_INFO.PREFIX}menu anywhere.
┃
╰━━━━━━━━━━━━━━━━━╯`,
    };
  }

  if (raw === "reset") {
    await markSetupDone(false);
    await setSetupStep("owner");
    return {
      ok: true,
      text: `╭━━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ 🔄 *SETUP RESET*
┃ Continuing wizard…
┃
╰━━━━━━━━━━━━━━━━━╯`,
      continue: true,
    };
  }

  if (!raw || raw === "start") {
    await setSetupStep("owner");
  }

  const step = await getSetupStep();
  return advanceWizard(message, conn, step, raw);
}

async function advanceWizard(message, conn, step, raw) {
  const p = BOT_INFO.PREFIX;

  if (step === "idle" || step === "await_start" || step === "owner") {
    await setSetupStep("mode");
    return {
      ok: true,
      text:
        `✅ Owner: Linked WhatsApp session\n\n` +
        `╭━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ ✅ *OWNER:* Linked WhatsApp session
┃
┃ *STEP 1/4 — MODE*
┃
┃ ${p}setup public — anyone can use commands
┃ ${p}setup private — owner + sudo only
┃
┃ *CURRENT:* ${await getMode()}
┃
╰━━━━━━━━━━━━━━━━━╯`,
    };
  }

  if (step === "mode") {
    if (raw === "public" || raw === "private") {
      await setMode(raw);
    } else if (raw && raw !== "start") {
      return {
        ok: false,
        text: `╭━━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ ⚠️ *INVALID MODE*
┃
┃ Reply:
┃ ${p}setup public
┃ ${p}setup private
┃
╰━━━━━━━━━━━━━━━━━╯`,
      };
    } else {
      return {
        ok: true,
        text:
          `╭━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ *STEP 2/4 — MODE*
┃
┃ ${p}setup public
┃ ${p}setup private
┃
┃ *CURRENT:* ${await getMode()}
┃
╰━━━━━━━━━━━━━━━━━╯`,
      };
    }
    await setSetupStep("lang");
    return {
      ok: true,
      text:
        `╭━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ ✅ *MODE:* ${await getMode()}
┃
┃ *STEP 3/4 — LANGUAGE*
┃
┃ Reply: ${p}setup en | id | hi
┃ *AVAILABLE:* ${AVAILABLE_LANGS.join(", ")}
┃ *CURRENT:* ${await getLang()}
┃
╰━━━━━━━━━━━━━━━━━╯`,
    };
  }

  if (step === "lang") {
    if (AVAILABLE_LANGS.includes(raw)) {
      await setLang(raw);
    } else if (raw && !["start", "public", "private"].includes(raw)) {
      return {
        ok: false,
        text: `╭━━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ ⚠️ *INVALID LANGUAGE*
┃
┃ Pick one:
┃ ${AVAILABLE_LANGS.join(", ")}
┃
╰━━━━━━━━━━━━━━━━━╯`,
      };
    } else if (!AVAILABLE_LANGS.includes(raw)) {
      return {
        ok: true,
        text: `╭━━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ *STEP 3/4 — LANGUAGE*
┃
┃ ${p}setup en | id | hi
┃ *CURRENT:* ${await getLang()}
┃
╰━━━━━━━━━━━━━━━━━╯`,
      };
    }
    await setSetupStep("exif");
    return {
      ok: true,
      text: `╭━━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ ✅ *LANG:* ${await getLang()}
┃
┃ *STEP 4/4 — STICKER PACK*
┃
┃ Reply: ${p}setup PackName|Author
┃
┃ Or ${p}setup skip to keep defaults
┃ *DEFAULT:* ${MEDIA.STICKER_PACKNAME} / ${MEDIA.STICKER_AUTHOR}
┃
╰━━━━━━━━━━━━━━━━━╯`,
    };
  }

  if (step === "exif") {
    if (raw && raw !== "skip" && raw.includes("|")) {
      const [pack, author] = raw.split("|").map((s) => s.trim());
      if (pack) await kvSetRaw("sticker_packname", pack);
      if (author) await kvSetRaw("sticker_author", author);
    }
    await markSetupDone(true);
    await setSetupStep("done");
    const pack = (await kvGetRaw("sticker_packname")) || MEDIA.STICKER_PACKNAME;
    const author = (await kvGetRaw("sticker_author")) || MEDIA.STICKER_AUTHOR;
    return {
      ok: true,
      text: `╭━━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ ✅ *SETUP COMPLETE*
┃
┃ ⚙️ *MODE:* ${await getMode()}
┃ 🌐 *LANG:* ${await getLang()}
┃ 🏷️ *STICKERS:* ${pack} / ${author}
┃
┃ *TRY NEXT:*
┃ ${p}ping
┃ ${p}menu
┃ ${p}status
┃ ${p}groupsetup — in a user group
┃
┃ _System errors stay in this group._
┃
╰━━━━━━━━━━━━━━━━━╯`,
    };
  }

  return {
    ok: true,
    text: `╭━━━━*〔 ⚙️ SETUP 〕*━━━╮
┃
┃ 💤 *SETUP IDLE*
┃
┃ Run ${p}setup to begin
┃ or ${p}setup reset.
┃
╰━━━━━━━━━━━━━━━━━╯`,
  };
}
