# Offline AI 🧠⚡️

A high-fidelity, fully private, local-first sandbox environment for running Large Language Models (LLMs) completely offline. Designed for power users, developers, and privacy advocates who demand a premium ChatGPT-like experience without compromising their data.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)
![Privacy](https://img.shields.io/badge/privacy-100%25_AirGapped-emerald.svg)

---

## ✨ Features & Capabilities

**Offline AI** has been massively upgraded with 50+ new capabilities, refinements, and performance enhancements across the stack.

### 🛡️ 100% Air-Gapped Privacy
- **Zero Data Harvesting:** All computations execute strictly on your local hardware. 
- **Sandboxed Storage:** Chat threads, settings, and cached outputs are stored securely in local JSON/localStorage.
- **Data Controls:** Export your entire chat history to a JSON backup, clear specific threads, or factory reset the sandbox completely.

### 🎨 Premium UI & Theming
- **Dynamic Accent Colors:** Choose from Indigo, Emerald, Rose, Amber, Black, White, and Brown. The UI dynamically recalculates foreground contrast for a perfect look.
- **Glassmorphism & Micro-animations:** Ambient gradient backgrounds, blurred backdrops, and active-scale click animations for a squishy, tactile feel.
- **Dark & Light Modes:** Flawless theming powered by Tailwind CSS v4, completely overhauled to prevent High Contrast Mode collisions.
- **Enhanced Markdown:** Beautiful syntax-highlighted code blocks, stylized tables, blockquotes, and inline code formatting.

### 🤖 Advanced Model Settings
- **Hardware-Accelerated Inference:** Powered by a customized Node.js bridge to `llama.cpp` (`llama-server`).
- **Vision Subsystem (mmproj):** Drag-and-drop images directly into the chat. The app automatically proxies requests to LLaVA / Vision projectors if loaded!
- **Hyperparameter Tuning:** Full UI control over Temperature, Top-P, Top-K, Max Tokens, and Context Size.
- **System Prompting:** Inject a core persona or set of constraints that persist across all conversations.
- **Precision Offloading:** Toggle between FP16 and FP32 for hardware-specific optimizations.

### 💬 Next-Gen Chat Experience
- **Prompt Library:** A built-in library of 20+ power-user prompts. Trigger them instantly by typing `/` in the chat!
- **Dictation & Text-to-Speech:** Built-in microphone access for speech-to-text, and read-aloud functionality for assistant responses.
- **Performance Optimized:** Inputs are debounced, React components are memoized (`React.memo`, `useCallback`), and textarea auto-resizing is mathematically bounded to prevent memory leaks.
- **Token Estimator:** Real-time character counting and Token estimation (~4 chars/token) right below your input.
- **Personalization:** Set your Preferred Name, Date of Birth, Custom Instructions, and even customize the "Assistant Name" (e.g., Jarvis).

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18 or higher recommended)
2. **llama.cpp** binaries (specifically `llama-server.exe` on Windows).
3. **GGUF Models**: You will need to download your own `.gguf` weights (e.g., Llama-3, Mistral, LLaVA).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hemanthnanu-tech/Offline-AI.git
   cd Offline-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup your Models:
   - Create a folder named `models/` in the root directory.
   - Place your `.gguf` files (and any `mmproj` vision files) inside.

4. Start the Application:
   ```bash
   npm run dev
   ```

*(Note: The companion backend script must be running to bridge `llama-server` with the UI. Refer to the proxy server documentation if running outside the standard dev script.)*

---

## 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- **Icons & Typography:** Lucide React, Google Inter
- **Markdown & Highlighting:** React Markdown, Remark-GFM, React Syntax Highlighter

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#) if you want to contribute.

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
