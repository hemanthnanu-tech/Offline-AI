# Offline AI 🧠🔒

A high-fidelity, fully private, local-first sandbox environment for running Large Language Models (LLMs) completely offline. Designed for power users, developers, and privacy advocates who want a premium ChatGPT-like experience without compromising their data.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)
![Privacy](https://img.shields.io/badge/privacy-100%25_Offline-emerald.svg)

---

## ✨ Features

- **100% Offline & Private:** All computations happen locally on your hardware. Zero data is sent to the cloud, third-party APIs, or external servers when running the local backend.
- **Sleek, Modern UI:** A beautifully crafted, responsive interface featuring floating components, glassmorphism, smooth framer-motion animations, and Apple/Arc-inspired design.
- **Hardware Monitor & Optimization:** Keep track of your system resources with a built-in live CPU & RAM monitor. Overloaded? Hit the "KILL / CLEAN RAM" button to instantly free up memory and unload active models.
- **Native Vision / Multimodal Support:** Send images directly to supported models (like Gemma 3 or Llama 3.2 Vision). The server automatically detects `mmproj` files or handles single-file native vision models gracefully.
- **Web Demo with API Support:** Trying out the GitHub Pages live demo? You can chat instantly without downloading massive AI models by securely pasting a free Google Gemini API Key in the settings.
- **Seamless Model Switching:** Drop any supported `.gguf` model into the `models/` directory and hot-swap between them directly from the chat interface.

## 📸 Screenshots

*(Replace the links below with your actual screenshot images once uploaded to the repository)*

![App Screenshot 1](./assets/screenshot1-placeholder.png)
<br>
![App Screenshot 2](./assets/screenshot2-placeholder.png)

## 🌐 Live UI Preview

You can view a live preview of the User Interface on GitHub Pages: **[Click Here for Live Demo](https://hemanthnanu-tech.github.io/Offline-AI/)**

> **Note:** The GitHub Pages link is a lightweight browser demo. By default, it will show a showcase UI. To actually chat on the GitHub Pages demo, simply open **Settings > Model Settings** and paste a free Google Gemini API key to securely stream responses via API.

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite, Framer Motion
- **Backend/Inference:** Node.js bridging to `llama-server` (llama.cpp) for blazing-fast local GGUF inference on CPU & GPU.
- **Styling:** Custom CSS variables for robust theming, glassmorphism, premium shadows, and dynamic UI states.

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
   
   Once you download a `.gguf` file, create a folder named `models` in the root directory and place your `.gguf` files inside. 
   **Vision Support:** If your model supports vision but requires a projector, place the `*mmproj*.gguf` file in the same directory and it will be auto-detected!
   ```text
   Offline-AI/
   ├── models/
   │   ├── gemma-3-4b-it-q4_k_m.gguf  (Single-file multimodal)
   │   ├── llama-3-8b-instruct.gguf
   │   └── mmproj-model.gguf          (Optional vision projector)
   ├── src/
   ...
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```
   *The application will automatically detect your models and start the local development server at `http://localhost:5173`.*

### 🌐 Deploying Updates to GitHub Pages

To update the live GitHub Pages UI demo, simply run:
```bash
npm run deploy
```
This will automatically build the app and push the `/dist` folder to the `gh-pages` branch. Wait a minute or two for GitHub to process the changes, and your live site will be updated!

## 📖 Usage Guide

- **Switching Models:** Click on the "Offline AI" header at the top of the chat to open the model switcher dropdown.
- **Hardware Controls:** Use the "Clean RAM" button in the top right to kill the currently loaded model process. Go to **Settings > Model Settings** to swap between GPU rendering and CPU rendering.
- **Codex Engine:** Open the sidebar and toggle "Codex Engine" to force the AI into an expert programming persona.
- **Personalization:** Click the gear icon next to your profile name in the bottom left to update your user context, language, voice settings, and toggle dark mode.

## 🛡️ Data Protection Guarantee

Offline AI is built on a strict local-first philosophy. Your chat logs, custom prompts, and personal settings remain entirely on your local file system. When running the local Node.js server, the application does not contain any telemetry, tracking, or network requests to external inference providers. (Note: The GitHub Pages browser demo securely pings Google APIs only if you explicitly provide an API key).

## 👨‍💻 Credits & Contributions

**Lead Architect & Developer:** Hemanth Kumar K

Designed with a focus on delivering a state-of-the-art UI/UX combined with uncompromising privacy. 

---
*Feel free to fork, modify, and build upon this sandbox!*
