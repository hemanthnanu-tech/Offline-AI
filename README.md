# Offline AI 🧠🔒

A high-fidelity, fully private, local-first sandbox environment for running Large Language Models (LLMs) completely offline. Designed for power users, developers, and privacy advocates who want a premium ChatGPT-like experience without compromising their data.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)
![Privacy](https://img.shields.io/badge/privacy-100%25_Offline-emerald.svg)

---

## ✨ Features

- **100% Offline & Private:** All computations happen locally on your hardware. Zero data is sent to the cloud, third-party APIs, or external servers.
- **Sleek, Modern UI:** A beautifully crafted, responsive interface with smooth animations, dark/light mode support, and a highly polished chat experience.
- **Codex Engine Mode:** Toggle a dedicated coding mode that instantly instructs the AI to act as an Expert Software Architect, generating long, accurate, and bug-free code implementations.
- **Seamless Model Switching:** Drop any supported `.gguf` model into the `models/` directory and hot-swap between them directly from the chat interface.
- **Prompt Library:** Save, manage, and quickly access your favorite system prompts or use our detailed pre-added expert prompts.
- **Deep Personalization:** Tailor the AI's behavior by adding your name, date of birth, and custom details in the settings. The AI natively adapts to your persona.
- **Rich Interaction:** Full support for Markdown, syntax-highlighted code blocks, text-to-speech dictation, response regeneration, and real-time generation speed metrics (Tokens per Second).

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend/Inference:** Node.js, `node-llama-cpp` (for blazing-fast local GGUF inference)
- **Styling:** Custom CSS variables for robust theming and dynamic UI states.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- At least one `.gguf` formatted LLM (e.g., Llama 3, Mistral, Phi-3).

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hemanthnanu-tech/Offline-AI.git
   cd Offline-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Download AI Models (GGUF)**
   This application runs using local `.gguf` model files. You can find and download thousands of open-source models (like Llama 3, Mistral, Phi-3, etc.) for free from [Hugging Face](https://huggingface.co/models?search=gguf).
   
   Once you download a `.gguf` file, create a folder named `models` in the root directory and place your `.gguf` files inside:
   ```text
   Offline-AI/
   ├── models/
   │   ├── llama-3-8b-instruct.Q4_K_M.gguf
   │   └── another-model.gguf
   ├── src/
   ...
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```
   *The application will automatically detect your models and start the local development server.*

## 📖 Usage

- **Switching Models:** Click on the "Offline AI" header at the top of the chat to open the model switcher dropdown.
- **Codex Engine:** Open the sidebar and toggle "Codex Engine" to force the AI into an expert programming persona.
- **Personalization:** Click the gear icon next to your profile name in the bottom left to update your user context and toggle dark mode.

## 🛡️ Data Protection Guarantee

Offline AI is built on a strict local-first philosophy. Your chat logs, custom prompts, and personal settings remain entirely on your local file system. The application does not contain any telemetry, tracking, or network requests to external inference providers.

## 👨‍💻 Credits & Contributions

**Lead Architect & Developer:** Hemanth Kumar K

Designed with a focus on delivering a state-of-the-art UI/UX combined with uncompromising privacy. 

---
*Feel free to fork, modify, and build upon this sandbox!*
