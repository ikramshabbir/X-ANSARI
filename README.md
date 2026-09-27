<div align="center"><b>🦅 X-ANSARI MD</b>

⚡ Fast • Powerful • Modern WhatsApp Automation

A feature-rich WhatsApp bot built with Node.js & Baileys

<p>
  <img src="https://img.shields.io/badge/X--ANSARI-MD-black?style=for-the-badge" alt="X-ANSARI">
  <img src="https://img.shields.io/badge/Version-4.0.0-blue?style=for-the-badge" alt="Version 4.0.0">
  <img src="https://img.shields.io/badge/Node.js-20%2B-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Baileys-6.7.24-purple?style=for-the-badge" alt="Baileys">
</p><p>
  <b>⚡ Built for speed.</b>
  &nbsp;•&nbsp;
  <b>🛡️ Built for stability.</b>
  &nbsp;•&nbsp;
  <b>🦅 Built for WhatsApp.</b>
</p></div>---

<b>🌟 About X-ANSARI</b>

X-ANSARI MD is a modern, modular and feature-rich WhatsApp bot designed to provide a fast and powerful WhatsApp automation experience.

Built with Node.js and Baileys, X-ANSARI combines media tools, group management, owner controls, utilities, automation and a modular plugin architecture into one bot.

«🦅 X-ANSARI — More than a bot. A complete WhatsApp experience.»

---

<b>✨ Features</b>

⚡ Core

- 🚀 Fast command processing
- 🔄 Automatic reconnection
- 💾 SQLite database support
- 🧩 Modular plugin architecture
- 🛡️ Command access control
- 📊 Command logging & metrics
- 🌐 Public / private bot modes
- 🌍 Multi-language support
- 🎯 Prefix-based command system

👑 Owner & Administration

- 👑 Owner-only commands
- 🛡️ Group administration
- 🔗 Anti-link protection
- 🚫 Anti-spam controls
- ⚠️ Warning system
- 🔇 User mute management
- 👋 Welcome & goodbye messages
- ⚙️ Per-group settings

🎨 Media & Utilities

- 🖼️ Image tools
- 🎨 Sticker tools
- 🎵 Audio/media utilities
- 📝 Text-to-speech tools
- ✨ Fancy text generation
- 💬 Quote generation
- 🖌️ Image/text effects
- 🎬 Media conversion powered by FFmpeg

🤖 Automation

- 💬 Automatic reactions
- 🎯 Keyword-based reaction categories
- 🧠 Smart command handling
- ⚡ Fast response path for lightweight commands
- 🔧 Configurable automation features

---

<b>📦 Requirements</b>

Before installing X-ANSARI, make sure your environment has:

Requirement| Version
Node.js| 20+
npm| Latest recommended
Git| Recommended
FFmpeg| Required for media features
SQLite| Included through Node package

«💡 Node.js 20+ is recommended for the current project.»

---

<b>🚀 Installation</b>

1️⃣ Clone the repository

git clone https://github.com/ikramshabbir/X-ANSARI.git

Enter the project:

cd X-ANSARI

---

2️⃣ Install dependencies

npm install

For environments where optional/native dependencies need to be built:

npm install --include=optional --foreground-scripts

---

3️⃣ Configure environment

Create your environment file:

cp .env.example .env

If ".env.example" does not exist, create ".env" manually:

nano .env

---

⚙️ Configuration

A typical ".env" configuration can look like:

BOT_MODE=public
BOT_LANG=en

PREFIX=.

SUDO=

STICKER_PACKNAME=X-ANSARI
STICKER_AUTHOR=X-ANSARI

🔧 Configuration options

Variable| Description
"BOT_MODE"| Bot mode: "public" or "private"
"BOT_LANG"| Bot language
"PREFIX"| Command prefix
"SUDO"| Additional privileged users
"STICKER_PACKNAME"| Sticker pack name
"STICKER_AUTHOR"| Sticker author

«⚠️ Do not upload your real ".env" file or authentication credentials to GitHub.»

---

<b>▶️ Start X-ANSARI</b>

Start the bot with:

npm start

The bot will initialize its database, plugins and WhatsApp connection.

---

<b>📱 WhatsApp Pairing</b>

On first startup, follow the pairing/login instructions provided by the bot.

After authentication, the session is stored locally so the bot can reconnect without requiring repeated pairing.

«🔐 Never share your WhatsApp authentication/session files.»

---

<b>🧩 Commands</b>

The default command prefix is:

.

For example:

.ping
.menu
.help

---

<b>⚡ General Commands</b>

Command| Description
".ping"| Check bot response
".menu"| Display command menu
".help"| Show command help

---

<b>👑 Owner Commands</b>

Owner commands are restricted to authorized users.

Examples include:

.broadcast
.repeat
.exif

---

<b>🛡️ Group Management</b>

Depending on enabled plugins:

.warn
.mute
.kick
.promote
.demote

Additional group features may include:

- Anti-link
- Anti-spam
- Welcome messages
- Goodbye messages
- Warning system
- Plugin restrictions

---

<b>🎨 Media Commands</b>

X-ANSARI provides various media utilities, including:

.sticker
.ttp
.attp
.tts
.quote
.fancy

Available commands depend on the currently installed plugins.

---

<b>🤖 AutoReact</b>

X-ANSARI includes a lightweight keyword-based automatic reaction system.

It can be controlled through:

.autoreact on
.autoreact off
.autoreact status

AutoReact is designed around local keyword/category matching rather than requiring an external AI API.

Supported reaction categories can include:

- ❤️ Love
- 😂 Funny
- 😍 Amazing
- 👍 Agree
- 🙏 Islamic / Dua
- 😢 Sad
- 😮 Surprise
- 🎉 Congratulations
- 👋 Greeting
- 🌅 Morning
- 🌙 Night
- 👋 Goodbye
- 🥺 Accident

---

<b>🗂️ Project Structure</b>

X-ANSARI/
│
├── index.js
├── package.json
├── package-lock.json
├── .env
│
├── src/
│   │
│   ├── config/
│   │
│   ├── database/
│   │
│   ├── enterprise/
│   │
│   ├── messages/
│   │   ├── handler.js
│   │   └── serialize.js
│   │
│   ├── plugins/
│   │
│   ├── socket/
│   │   └── connection.js
│   │
│   └── utils/
│       ├── message.js
│       ├── group.js
│       └── groupSettings.js
│
└── README.md

---

<b>🧩 Plugin System</b>

X-ANSARI uses a modular command/plugin architecture.

A typical plugin can register a command using:

command(
  {
    pattern: "example",
    fromMe: false,
    desc: "Example command",
    type: "misc",
  },
  async (message, conn) => {
    // command logic
  }
);

This makes it easy to add, remove or maintain individual commands without modifying the entire bot.

---

<b>⚡ Performance</b>

X-ANSARI is designed around lightweight command processing.

The bot includes:

- ⚡ Fast command execution
- 🧠 Command caching where appropriate
- 💾 Persistent settings
- 🔄 Connection recovery
- 🧩 Modular processing
- 🚀 Optimized lightweight command paths

For example:

.ping
      ↓
Command Detection
      ↓
Fast Execution
      ↓
Pong

---

<b>🎬 FFmpeg</b>

FFmpeg is required by several media-related commands.

Check whether FFmpeg is available:

ffmpeg -version

If your hosting environment already provides FFmpeg, X-ANSARI can use the available binary.

For Termux:

pkg install ffmpeg

---

<b>🖥️ Deployment</b>

X-ANSARI can run on multiple environments.

📱 Termux

Install Node.js and required packages, then:

git clone https://github.com/ikramshabbir/X-ANSARI.git
cd X-ANSARI
npm install
npm start

For keeping the bot running:

npm install -g pm2

Then:

pm2 start index.js --name X-ANSARI

Save the process:

pm2 save

---

☁️ VPS / Linux

Clone the repository:

git clone https://github.com/ikramshabbir/X-ANSARI.git
cd X-ANSARI

Install dependencies:

npm install

Start:

npm start

For production:

pm2 start index.js --name X-ANSARI
pm2 save

---

<b>🐳 Docker</b>

A Docker-based deployment can be created using a Node.js 20+ image.

Example:

FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]

Build:

docker build -t x-ansari .

Run:

docker run -d --name x-ansari x-ansari

«⚠️ Make sure persistent storage is configured for authentication/session data.»

---

<b>🔐 Security</b>

Never expose:

- ".env"
- WhatsApp session/authentication files
- Database credentials
- API keys
- Hosting credentials
- GitHub tokens

Add sensitive files to ".gitignore":

.env
*.db
sessions/
auth/
node_modules/
logs/

---

<b>🛠️ Troubleshooting</b>

Bot does not start

Check Node:

node -v

Check npm:

npm -v

Reinstall dependencies:

rm -rf node_modules
npm install

---

FFmpeg not detected

Check:

which ffmpeg

Then:

ffmpeg -version

---

SQLite errors

Reinstall native dependencies:

npm install --include=optional --foreground-scripts

Then test:

node -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); console.log('SQLITE WORKING'); db.close()"

Expected:

SQLITE WORKING

---

<b>🔄 Updating</b>

Before updating, make sure your local changes are committed.

Pull the latest version:

git pull origin main

Install updated dependencies:

npm install

Restart:

npm start

---

<b>📌 Development</b>

Clone the repository:

git clone https://github.com/ikramshabbir/X-ANSARI.git

Create a branch:

git checkout -b feature/my-feature

Make your changes and test:

node --check index.js

Commit:

git add .
git commit -m "Add new feature"

Push:

git push origin feature/my-feature

---

<b>🤝 Contributing</b>

Contributions, improvements and bug reports are welcome.

Contribution flow

Fork
  ↓
Create Branch
  ↓
Make Changes
  ↓
Test
  ↓
Commit
  ↓
Push
  ↓
Pull Request

Please keep contributions:

- Clean
- Modular
- Tested
- Documented
- Compatible with the existing architecture

---

<b>🐛 Bug Reports</b>

When reporting an issue, include:

- Node.js version
- npm version
- Operating system / hosting
- Error message
- Relevant logs
- Steps to reproduce

Please never share authentication/session credentials in an issue.

---

<b>📜 License</b>

This project is provided for personal and educational use.

Please review the repository license before redistributing or publishing modified versions.

---

<b>👑 Credits</b>

<div align="center"><b>🦅 X-ANSARI MD</b>

Developed & maintained by

IKRAM SHABBIR

<p>
  <b>⚡ Speed</b> •
  <b>🛡️ Stability</b> •
  <b>🧩 Modularity</b> •
  <b>🚀 Innovation</b>
</p>---

❤️ Special Thanks

To the open-source developers and projects that make WhatsApp automation possible.

Special thanks to the Baileys ecosystem and all contributors whose work helps power projects like X-ANSARI.

---

<p>
  <b>⭐ Star the repository if you like X-ANSARI</b>
</p><p>
  <b>🦅 X-ANSARI — Built with passion, powered by code.</b>
</p></div>
