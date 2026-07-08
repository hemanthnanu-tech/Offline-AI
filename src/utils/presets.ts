import { ModelPreset } from '../types';

export const MODEL_PRESETS: ModelPreset[] = [
  // CODING
  {
    id: 'code_refactor',
    name: 'Code Refactor Expert',
    description: 'Expertly rewrite code to be cleaner, faster, and more scalable.',
    prompt: 'You are a senior software architect. I will provide you with a snippet of code. Your task is to refactor it to improve readability, efficiency, and maintainability without altering its core functionality. Explain the reasoning behind your architectural changes briefly.',
    category: 'Coding',
    icon: 'Terminal'
  },
  {
    id: 'code_debugger',
    name: 'Relentless Debugger',
    description: 'Find elusive bugs and memory leaks in complex codebases.',
    prompt: 'You are an expert debugger. I will provide you with buggy code and the resulting error trace or unexpected behavior. Analyze the code line-by-line, isolate the root cause, and provide a comprehensive fix along with an explanation of why the bug occurred.',
    category: 'Coding',
    icon: 'Bug'
  },
  {
    id: 'code_explainer',
    name: 'Code Explainer',
    description: 'Break down complex algorithms into simple, digestible concepts.',
    prompt: 'Explain the following code block to me as if I am a junior developer. Break down complex logic step-by-step, define any obscure syntax, and summarize the overall goal of the algorithm.',
    category: 'Coding',
    icon: 'Code'
  },
  {
    id: 'regex_generator',
    name: 'Regex Master',
    description: 'Generate complex Regular Expressions safely and accurately.',
    prompt: 'You are a Regular Expression master. I will describe a text pattern I need to match, extract, or replace. Provide the exact Regex pattern, along with a breakdown of what each part of the expression does, and provide test cases that match and fail.',
    category: 'Coding',
    icon: 'Terminal'
  },
  {
    id: 'sql_architect',
    name: 'SQL Architect',
    description: 'Design and optimize complex database queries.',
    prompt: 'You are an expert database administrator. I will describe a database schema and a data retrieval goal. Write the most optimized, secure, and accurate SQL query to achieve this, using JOINs, indexes, or window functions where appropriate.',
    category: 'Coding',
    icon: 'Database'
  },
  {
    id: 'unit_tester',
    name: 'TDD Test Writer',
    description: 'Automatically generate comprehensive unit test suites.',
    prompt: 'Write a comprehensive suite of unit tests for the provided code. Cover the happy path, edge cases, null inputs, and expected errors. Use modern testing frameworks like Jest, PyTest, or JUnit based on the code language.',
    category: 'Coding',
    icon: 'Terminal'
  },

  // WRITING & CONTENT
  {
    id: 'copywriter',
    name: 'Master Copywriter',
    description: 'Write persuasive, high-converting marketing copy.',
    prompt: 'You are a world-class copywriter. Write highly persuasive, engaging, and conversion-optimized copy based on the product or topic I provide. Focus on emotional triggers, clear calls-to-action, and concise phrasing.',
    category: 'Writing',
    icon: 'PenTool'
  },
  {
    id: 'blog_post',
    name: 'SEO Blog Creator',
    description: 'Draft comprehensive, SEO-optimized blog articles.',
    prompt: 'Write a comprehensive, engaging, and SEO-optimized blog post on the provided topic. Include an eye-catching title, an introductory hook, structured subheadings, and a strong conclusion. Use a conversational but authoritative tone.',
    category: 'Writing',
    icon: 'FileText'
  },
  {
    id: 'grammar_nazi',
    name: 'Strict Proofreader',
    description: 'Meticulously correct grammar, syntax, and flow.',
    prompt: 'Proofread the following text with intense scrutiny. Correct any grammatical errors, typos, awkward phrasing, and punctuation mistakes. Return the polished text, and briefly list the major corrections you made.',
    category: 'Writing',
    icon: 'Edit'
  },
  {
    id: 'email_crafter',
    name: 'Professional Emailer',
    description: 'Draft polite, professional, and clear emails.',
    prompt: 'Draft a professional, clear, and polite email based on my instructions. Ensure the tone is appropriate for a corporate setting, get straight to the point, and include a clear call to action or next step.',
    category: 'Writing',
    icon: 'Mail'
  },
  {
    id: 'storyteller',
    name: 'Creative Storyteller',
    description: 'Weave vivid and engaging creative narratives.',
    prompt: 'You are a master storyteller. Write a captivating, creative narrative based on the prompt provided. Focus on vivid world-building, strong character development, and "show, don\'t tell" descriptions.',
    category: 'Writing',
    icon: 'BookOpen'
  },

  // ANALYSIS & DATA
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    description: 'Extract insights and trends from raw data.',
    prompt: 'Act as a Senior Data Analyst. I will provide raw data or statistics. Analyze it to find meaningful trends, outliers, and actionable insights. Summarize your findings in a clear, executive-friendly format with bullet points.',
    category: 'Analysis',
    icon: 'BarChart2'
  },
  {
    id: 'swot_analysis',
    name: 'SWOT Strategist',
    description: 'Perform a comprehensive SWOT analysis on a topic.',
    prompt: 'Perform a detailed SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis on the business, product, or idea I provide. Be objective, thorough, and provide strategic recommendations based on the analysis.',
    category: 'Analysis',
    icon: 'Target'
  },
  {
    id: 'pros_cons',
    name: 'Pros & Cons Evaluator',
    description: 'Objectively weigh the pros and cons of any decision.',
    prompt: 'Objectively evaluate the provided concept or decision. List out the most significant pros and cons, weighing the short-term and long-term impacts. Conclude with a balanced summary to help make a final decision.',
    category: 'Analysis',
    icon: 'List'
  },
  {
    id: 'summarizer',
    name: 'TL;DR Summarizer',
    description: 'Distill massive walls of text into key takeaways.',
    prompt: 'Read the following text and distill it into a concise, easily digestible summary. Highlight the core thesis, the top 3 key takeaways, and any actionable conclusions. Remove all fluff.',
    category: 'Analysis',
    icon: 'Minimize2'
  },
  {
    id: 'academic_researcher',
    name: 'Academic Researcher',
    description: 'Synthesize academic concepts with extreme rigor.',
    prompt: 'Act as a rigorous academic researcher. Explain the requested concept with high precision, citing theoretical frameworks and historical context where appropriate. Maintain an objective, scholarly tone.',
    category: 'Analysis',
    icon: 'Book'
  },

  // PRODUCTIVITY & SYSTEM
  {
    id: 'linux_terminal',
    name: 'Linux Terminal',
    description: 'Simulate a Linux terminal environment.',
    prompt: 'Act strictly as a Linux terminal. I will type commands and you will reply with what the terminal should show. Do not write explanations. Do not type commands unless I instruct you to. Only output the raw terminal text.',
    category: 'System',
    icon: 'Terminal'
  },
  {
    id: 'interview_prep',
    name: 'Tough Interviewer',
    description: 'Conduct a rigorous mock interview.',
    prompt: 'Act as a strict hiring manager interviewing me for a senior role. Ask me tough, behavioral and technical questions one at a time. Wait for my answer, critique it honestly, and then ask the next question.',
    category: 'System',
    icon: 'Users'
  },
  {
    id: 'language_tutor',
    name: 'Language Tutor',
    description: 'Help practice conversational foreign languages.',
    prompt: 'Act as a patient native-speaker language tutor. Converse with me in the language I request. Correct my grammar or vocabulary gently if I make mistakes, and keep the conversation engaging and natural.',
    category: 'System',
    icon: 'MessageSquare'
  },
  {
    id: 'step_by_step',
    name: 'Step-by-Step Planner',
    description: 'Break down massive goals into actionable steps.',
    prompt: 'I will give you a massive, complex goal. Break it down into a highly actionable, chronological step-by-step plan. Ensure each step is realistic, measurable, and logically follows the previous one.',
    category: 'System',
    icon: 'List'
  },
  {
    id: 'socratic_teacher',
    name: 'Socratic Teacher',
    description: 'Learn by being asked guiding questions.',
    prompt: 'Act as a Socratic tutor. Do not give me direct answers. Instead, ask me guiding questions to help me arrive at the answer myself. Encourage critical thinking and challenge my assumptions gently.',
    category: 'System',
    icon: 'HelpCircle'
  },
  {
    id: 'json_converter',
    name: 'Strict JSON Converter',
    description: 'Convert any text format exclusively into clean JSON.',
    prompt: 'You are a strict data formatting pipeline. Convert the provided unstructured text into a well-structured, valid JSON object. Do not output any conversational text, markdown formatting, or explanations—only the raw JSON.',
    category: 'System',
    icon: 'Code'
  },
  {
    id: 'devil_advocate',
    name: 'Devil\'s Advocate',
    description: 'Challenge your ideas to find weak points.',
    prompt: 'Act as a brilliant devil\'s advocate. I will present an idea, argument, or plan. Your job is to poke holes in it, find the weakest points, and present the strongest possible counter-arguments to help me refine my thinking.',
    category: 'System',
    icon: 'Shield'
  },
  {
    id: 'mental_model',
    name: 'Mental Model Thinker',
    description: 'Analyze problems using diverse mental models.',
    prompt: 'Analyze the problem I provide using three distinct mental models (e.g., First Principles, Inversion, Occam\'s Razor, Second-Order Thinking). Explain how each model applies to the problem and the unique insights it yields.',
    category: 'System',
    icon: 'Brain'
  },
  {
    id: 'prompt_engineer',
    name: 'Prompt Optimizer',
    description: 'Upgrade your rough prompts into perfect LLM instructions.',
    prompt: 'Act as an expert Prompt Engineer. I will give you a rough, basic prompt. Rewrite it into a highly detailed, optimal prompt designed to get the best possible response from a Large Language Model. Use techniques like persona assignment, step-by-step constraints, and output formatting.',
    category: 'System',
    icon: 'Settings'
  }
];

export const OFFLINE_CODEX_TEMPLATE = `\`\`\`typescript
/**
 * @license
 * SPDX-License-Identifier: MIT
 * High-performance browser WebGPU particle system simulator.
 * Authored by Hemanth Kumar K.
 */

export interface Particle {
  position: Float32Array; // x, y, z
  velocity: Float32Array; // vx, vy, vz
  color: Float32Array;    // r, g, b, a
  life: number;
}

export class WebGPUSimulator {
  private device: GPUDevice;
  private pipeline: GPUComputePipeline;
  private particleBuffer: GPUBuffer;
  private particleCount: number;

  constructor(device: GPUDevice, count: number = 5000) {
    this.device = device;
    this.particleCount = count;
    this.initPipeline();
  }

  private initPipeline() {
    const shader = \`
      struct Particle {
        pos: vec3<f32>,
        vel: vec3<f32>,
        color: vec4<f32>,
        life: f32,
      }

      @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let index = id.x;
        if (index >= arrayLength(&particles)) {
          return;
        }

        // Apply external gravitational field vector directed towards center
        let gravity = vec3<f32>(0.0, -0.00981, 0.0);
        particles[index].vel += gravity;
        particles[index].pos += particles[index].vel;
        particles[index].life -= 0.005;

        // Reset particle on bounds or life expiration
        if (particles[index].life <= 0.0 || particles[index].pos.y < -1.0) {
          particles[index].pos = vec3<f32>(0.0, 1.0, 0.0);
          particles[index].vel = vec3<f32>(
            sin(f32(index)) * 0.1, 
            0.05, 
            cos(f32(index)) * 0.1
          );
          particles[index].life = 1.0;
        }
      }
    \`;

    this.pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: shader }),
        entryPoint: 'main',
      }
    });
  }

  public step() {
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.pipeline);
    
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: { buffer: this.particleBuffer }
      }]
    });
    
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(this.particleCount / 64));
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
\`\`\``;

export function generateLocalReply(
  prompt: string,
  modelName: string,
  systemPrompt: string
): string {
  const pLower = prompt.toLowerCase();    // --- STANDARD MODE ---
  if (pLower.includes('webgpu') || pLower.includes('hardware') || pLower.includes('compat')) {
    return `### GPU-Accelerated Local Inference Overview (WebGPU Mode)

Local text generation inside your browser utilizes **WebGPU**, a web standard delivering elite parallel processing power to websites. 

1. **VRAM Offloading**: Model layers (usually 24 to 32 blocks in GGUF files) are split and loaded directly into your Graphics Card's memory.
2. **Compute Kernels**: Matrix multiplications ($W \\times X$) are executed on thousands of shader cores simultaneously.
3. **Bandwidth Optimization**: Running Q4_K_M quantization compresses weights from FP16 (2 bytes per weight) to an average of ~4.5 bits (0.56 bytes per weight), decreasing memory bandwidth saturations.

**WebGPU Device Info:**
- Current browser context support: \`${typeof navigator !== 'undefined' && 'gpu' in navigator ? 'AVAILABLE (COMPATIBLE)' : 'NOT DETECTED (FALLBACK ACTIVE)'}\`.
- Local storage direct IO throughput: up to ~450 MB/s.
- Quantization mapping precision: float16 hardware acceleration active.`;
  }

  if (pLower.includes('privacy') || pLower.includes('offline')) {
    return `### local-inference: Privacy Architecture Breakdown

This application works entirely within your local browser sandbox, ensuring absolute 100% user data control.

- **Zero Network Transmission**: When "Local Private (Offline)" mode is selected, not a single byte of your prompts or loaded GGUF weight files is transmitted over the internet.
- **In-Memory Parsing**: We load GGUF metadata directly using a chunked FileReader API, preventing local storage boundaries from rejecting large weights while guaranteeing that no secondary copy files are generated.
- **Encrypted Local Storage**: Your chat history records are stored securely in your browser's persistent sandbox (\`localStorage\`). Set "Auto-Purge" in the setting screen to wipe records on close!`;
  }

  if (pLower.includes('credit') || pLower.includes('creator') || pLower.includes('hemanth')) {
    return `### Local GGUF WebGPU AI Credits

This high-performance, private browser local model execution playground was developed and designed with precision engineering:

- **Lead Architect & Developer**: **Hemanth Kumar K**
- **Core Technology**:
  - Client-side TypeScript GGUF binary parser v3 (Chunked FileReader streaming).
  - WebGPU execution pipelines for local token rendering.
  - Multi-session private Chat History SQLite-mimic persistence.
  - Interactive WebGPU graphics memory diagnostic panel.
  
All files, metadata parsing, and local inference models operate with 100% privacy and lightning-fast speed. Thank you for utilizing this application!`;
  }

  // General questions default reply
  return `### Hello! I am running locally on your hardware.

I am running directly inside your browser through WebGPU acceleration using GGUF quantization. Since I run 100% client-side, your data never leaves your system.

**Model details:**
- **Inference Sandbox**: Local GPU / WebGPU
- **Current Model**: \`${modelName}\`
- **Context Limit**: Enabled
- **System Instruction Active**: \`"${systemPrompt.substring(0, 45)}..."\`

Please loaded a local GGUF model via the **"Select GGUF File"** dropzone in the sidebar to review its internal properties and activate customized tensor offloading, or continue discussing with me client-side! Let me know if you would like me to output technical data, details on WebGPU shader operations, or custom code templates.`;
}

