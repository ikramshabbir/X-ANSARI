/**
 * X-ANSARI v4.0.0
 * Command-specific reaction emojis
 */

export const COMMAND_REACTIONS = {
  antidelete: "🗑️",
  audit: "🔎",
  flag: "🚩",
  policy: "📜",
  role: "🎯",
  backup: "💾",
  metrics: "📈",

  tagall: "📢",
  notify: "🔔",
  groupinfo: "👥",
  promote: "⬆️",
  demote: "⬇️",
  acceptall: "✅",
  admins: "💪",
  mention: "📣",

  info: "ℹ️",
  menu: "📋",
  help: "🤖",
  lang: "🌐",
  disable: "🚫",
  enable: "✅",
  plugins: "🧩",
  broadcast: "📢",
  cmdlist: "📜",

  welcome: "🤝",
  goodbye: "👋",
  antilink: "🔗",
  antispam: "🚫",
  groupsettings: "⚙️",
  warn: "⚠️",
  unwarn: "✅",
  warns: "⚠️",
  mute: "🔇",
  unmute: "🔊",
  kickall: "🚀",
  kick: "🚫",

  createlog: "📝",
  setlog: "📋",
  setup: "🔧",
  groupsetup: "⚙️",

  mode: "⚙️",
  sudo: "👑",
  autoreact: "❤️",
  presence: "🟢",
  ping: "🚀",

  note: "📝",
  remind: "⏰",
  reminders: "📋",
  cancelremind: "❌",
  poll: "📊",
  repeat: "🔁",

  ig: "📸",
  insta: "📸",
  tiktok: "📸",
  tt: "📸",
  fb: "📸",

  sticker: "🖼️",
  s: "🖼️",
  take: "🏷️",
  steal: "🏷️",
  toimg: "🖼️",
  exif: "📝",

  tomp3: "🎵",
  toururl: "🔗",
  url: "🌐",
  quote: "💬",
  fancy: "😎",
  tts: "🗣️",
  ttp: "✍️",
  attp: "🎨",

  vv: "👁️",
  yt: "▶️",
  ytdl: "📥",
  ytmp3: "🎵",
  ytmp4: "🎬",
  p: "▶️",
  play: "🎵",
};

export const DEFAULT_COMMAND_REACTION = "⚡";

export function getCommandReaction(commandName = "") {
  const name = String(commandName)
    .trim()
    .toLowerCase()
    .replace(/^[.!/#]+/, "");

  return COMMAND_REACTIONS[name] || DEFAULT_COMMAND_REACTION;
}
