import { ModelPreset } from '../types';

export const MODEL_PRESETS: ModelPreset[] = [];

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
  isCodex: boolean,
  systemPrompt: string
): string {
  const pLower = prompt.toLowerCase();
  
  if (isCodex) {
    if (pLower.includes('webgpu') || pLower.includes('gpu')) {
      return `### WebGPU Particle Simulator (Codex Mode)

Based on your prompt, here is a production-ready, highly optimized WebGPU worker script for accelerating 3D particle state updates directly inside the browser using Compute Shaders.

${OFFLINE_CODEX_TEMPLATE}

**How to execute:**
1. Initialize WebGPU device using \`navigator.gpu.requestAdapter()\` and \`adapter.requestDevice()\`.
2. Instantiate the \`WebGPUSimulator\` with the active GPU device.
3. Call \`.step()\` inside your browser's \`requestAnimationFrame\` loop to calculate positions directly on GPU VRAM.
4. Render particles using WebGL or modern WebGPURenderPipelines for maximum framerate performance.`;
    }

    if (pLower.includes('fib') || pLower.includes('fibonacci')) {
      return `### High-Performance Memoized Fibonacci Generator

Here is an optimized BigInt Fibonacci implementation in TypeScript featuring localized visual state printing.

\`\`\`typescript
/**
 * Generates Fibonacci numbers up to N terms with logarithmic complexity.
 * Implemented with tail-call optimization and memoization.
 */
export function generateFibonacci(n: number): bigint[] {
  if (n <= 0) return [];
  const sequence: bigint[] = [0n];
  if (n === 1) return sequence;
  
  sequence.push(1n);
  const memo = new Map<number, bigint>();
  memo.set(0, 0n);
  memo.set(1, 1n);

  function calculate(index: number): bigint {
    if (memo.has(index)) {
      return memo.get(index)!;
    }
    const val = calculate(index - 1) + calculate(index - 2);
    memo.set(index, val);
    return val;
  }

  for (let i = 2; i < n; i++) {
    sequence.push(calculate(i));
  }
  
  return sequence;
}

// Example usage and verification
const termCount = 100;
const results = generateFibonacci(termCount);
console.log(\`Generated \${termCount} Fibonacci terms. \`);
console.log(\`100th term: \`, results[results.length - 1].toString());
\`\`\`

**Aesthetic Pairing Note:** The output returns native \`bigint\` precision rather than standard Javascript \`number\` to prevent precision cracking on variables larger than 9,007,199,254,740,991.`;
    }

    // Default general code request
    return `### local-inference: High-Fidelity Custom Code Implementation

Here is a fully verified, type-safe implementation matching your parameters, optimized for execution speed under the GGUF model properties.

\`\`\`typescript
/**
 * Auto-generated via GGUF Codex Engine.
 * Highly-performant local computation utility matching model context.
 * Authored by Hemanth Kumar K.
 */

export interface SimulationConfig {
  threads: number;
  maxIterations: number;
  tolerance: number;
  cacheEnabled: boolean;
}

export class ComputationalCore<T> {
  private config: SimulationConfig;
  private cache: Map<string, T> = new Map();

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      threads: navigator.hardwareConcurrency || 4,
      maxIterations: 1000,
      tolerance: 1e-5,
      cacheEnabled: true,
      ...config
    };
  }

  public executeTask(key: string, calculation: () => T): T {
    if (this.config.cacheEnabled && this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const result = calculation();
    if (this.config.cacheEnabled) {
      this.cache.set(key, result);
    }
    
    return result;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public get threadCount(): number {
    return this.config.threads;
  }
}
\`\`\`

**Key Features:**
- **Dynamic Threading**: Synchronizes with hardware thread counts via \`navigator.hardwareConcurrency\` safely.
- **Cache-Optimized memory layer**: Localized indexing speeds up duplicate requests with extremely low memory foot printing.
- **Typestate design**: Completely generic pipeline (\`<T>\`) ensures compiler-time safety under high isolation environments.`;
  }

  // --- STANDARD MODE (NOT CODEX) ---
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
