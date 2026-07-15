<div align="center">
  <h1>Offline AI</h1>
  <p><strong>A Modern, Premium, and Fully Local AI Chat Experience</strong></p>
  <p><i>Developed and Designed by: <b>Hemanth Kumar K</b></i></p>
</div>

---

## 🌟 Overview
**Offline AI** is a beautifully designed, high-performance, completely local AI client for running Large Language Models (LLMs) and Vision models natively on your hardware. It offers a ChatGPT-like experience with zero telemetry, meaning your data never leaves your computer.

Featuring a stunning glassmorphism UI, advanced memory management, and multi-modal support, Offline AI is the ultimate sandbox for testing and chatting with local `.gguf` and `.mmproj` models.

## ✨ Key Features
- **Local AI Execution**: Run powerful AI models offline using the highly optimized `llama.cpp` backend.
- **Multi-Modal Vision Support**: Drag and drop images directly into the chat to analyze them using local Vision adapters (`.mmproj`).
- **Premium Glassmorphism UI**: A gorgeous, modern interface with dynamic accents, smooth animations, and automatic dark/light mode syncing.
- **Smart Memory Management**: Automatic background process termination (Heartbeat System) safely kills heavy AI processes to free up RAM when you close your browser tab.
- **Strict Anti-Hallucination Guardrails**: Core system prompts and finely-tuned temperature controls force the AI to be honest and factual instead of guessing.
- **Instant Model Uploads**: Upload new `.gguf` models directly through the beautiful Settings UI—no need to dig through folders.
- **Zero Telemetry**: 100% private, secure, and offline.
- **Zero Install**: No Node.js installation required. Everything is bundled or downloaded locally with one click.

## 🚀 Getting Started

### Prerequisites
- A compatible `.gguf` LLM model (e.g., Llama-3, Phi-3) placed inside the `models/` folder.
- **No Node.js installation required** — a portable runtime is bundled/downloaded automatically.

### First-Time Setup (Run Once)
1. Clone or download this repository.
2. Place your `.gguf` model inside the `models/` folder.
3. **Double-click `Setup - Download Runtime.bat`** — this downloads a portable Node.js runtime (~65 MB) directly into the project folder. This only needs to be done **once**. After that, the app is 100% offline forever.

> **Note:** The `runtime/` folder is not committed to git (it's in `.gitignore`). On a new machine, just run the setup bat once.

### Launch the App
After the one-time setup, simply **double-click `Launch Offline AI.bat`** every time you want to use the app.

This professional launcher will:
1. Safely clean up any existing ghost tasks.
2. Silently launch the background Node and AI servers.
3. Wait for the server to be fully ready, then open Offline AI in your default browser.

*(When you're done, simply close your browser tab. The built-in heartbeat system will automatically shut down the background servers and free up your system memory after 15 seconds!)*

### Included Batch Files

| File | Purpose |
|---|---|
| `Setup - Download Runtime.bat` | **Run once** — downloads portable Node.js into `runtime/` |
| `Launch Offline AI.bat` | **Daily use** — starts the app with zero installs needed |
| `Kill All Servers.bat` | Emergency stop — kills all background AI and server processes |

## 🛠️ Architecture & Technologies
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js (portable, no install), Express, esbuild.
- **Inference Engine**: `llama.cpp` (embedded `llama-server.exe`).

## 👨‍💻 Credits
**Developed and Designed by:** Hemanth Kumar K
*Built for the future of private, decentralized AI.*
