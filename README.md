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

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A compatible `.gguf` LLM model (e.g., Llama-3, Phi-3).

### Installation
1. Clone the repository and navigate into the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Place your models inside the `models/` folder, or simply upload them later via the app's Settings menu.

### Usage
For the absolute best modern experience, simply double-click the **`Launch Offline AI.bat`** file.

This professional launcher will:
1. Safely clean up any existing ghost tasks.
2. Silently launch the background Node and AI servers.
3. Automatically open Offline AI in your default web browser.
4. Gracefully close its own terminal window so you can chat in peace!

*(Note: When you're done, simply close your browser tab. The built-in heartbeat system will automatically shut down the background servers and free up your system memory after 15 seconds!)*

## 🛠️ Architecture & Technologies
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, Vite, esbuild.
- **Inference Engine**: `llama.cpp` (embedded `llama-server.exe`).

## 👨‍💻 Credits
**Developed and Designed by:** Hemanth Kumar K  
*Built for the future of private, decentralized AI.*
