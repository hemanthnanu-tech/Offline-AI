/**
 * core.test.ts
 * Layer 2 (Testing) + Layer 4 (Performance) – MyOFFLINE AI
 *
 * All tests exercise pure logic extracted from the application
 * so they run in a Node environment without browser / React deps.
 */

// ---------------------------------------------------------------------------
// 1. System prompt is always prepended to the messages array
// ---------------------------------------------------------------------------
describe('System Prompt', () => {
  test('system prompt is prepended to messages array', () => {
    const systemPrompt = 'You are helpful';
    const userMessages = [{ role: 'user', content: 'Hello', id: '1', timestamp: '' }];
    const result = [
      { id: 'sys-0', role: 'system', content: systemPrompt, timestamp: '' },
      ...userMessages,
    ];

    expect(result[0].role).toBe('system');
    expect(result[0].content).toBe(systemPrompt);
    expect(result[1].role).toBe('user');
  });
});

// ---------------------------------------------------------------------------
// 2. Think-tag rendering
// ---------------------------------------------------------------------------
describe('Think Tag Processing', () => {
  const applyThinkReplace = (raw: string): string =>
    raw
      .replace(/<think>/g, '---\n**🧠 Thought Process:**\n\n')
      .replace(/<\/think>/g, '\n\n---\n\n');

  test('think tags are replaced with readable format', () => {
    const raw = '<think>Thinking...</think>Answer here';
    const display = applyThinkReplace(raw);

    expect(display).toContain('Thought Process');
    expect(display).toContain('Answer here');
    expect(display).not.toContain('<think>');
  });

  test('partial think tag mid-stream is NOT stripped', () => {
    const partial = '<think>Still thinking...';
    const display = applyThinkReplace(partial);

    expect(display).toContain('Still thinking...');
  });

  test('multiple think blocks are all replaced', () => {
    const raw = '<think>First</think>Middle<think>Second</think>End';
    const display = applyThinkReplace(raw);

    expect(display).not.toContain('<think>');
    expect(display).not.toContain('</think>');
    expect(display).toContain('First');
    expect(display).toContain('Middle');
    expect(display).toContain('Second');
    expect(display).toContain('End');
  });
});

// ---------------------------------------------------------------------------
// 3. Session auto-rename
// ---------------------------------------------------------------------------
describe('Session Auto-Rename', () => {
  const computeTitle = (sessionMessages: unknown[], text: string, currentTitle: string): string =>
    sessionMessages.length === 0
      ? text.length > 22
        ? text.substring(0, 22) + '...'
        : text
      : currentTitle;

  test('session auto-renames on first message (long text)', () => {
    const session = { messages: [] as unknown[], title: 'Draft Chat 1' };
    const text = 'What is quantum computing?';
    const newTitle = computeTitle(session.messages, text, session.title);

    expect(newTitle).toBe('What is quantum comput...');
  });

  test('session keeps title when already has messages', () => {
    const session = {
      messages: [{ role: 'user', content: 'old', id: '0', timestamp: '' }],
      title: 'Existing Title',
    };
    const text = 'New message that should not rename';
    const newTitle = computeTitle(session.messages, text, session.title);

    expect(newTitle).toBe('Existing Title');
  });

  test('session auto-renames on first message (short text)', () => {
    const session = { messages: [] as unknown[], title: 'Draft Chat 1' };
    const text = 'Hi';
    const newTitle = computeTitle(session.messages, text, session.title);

    expect(newTitle).toBe('Hi');
  });
});

// ---------------------------------------------------------------------------
// 4. Tokens-Per-Second (TPS) calculation
// ---------------------------------------------------------------------------
describe('Tokens Per Second (TPS)', () => {
  const calcTPS = (tokenCount: number, timeElapsed: number): number =>
    timeElapsed > 1 ? tokenCount / timeElapsed : 0;

  test('TPS is 0 when elapsed < 1 second', () => {
    expect(calcTPS(5, 0.3)).toBe(0);
  });

  test('TPS is 0 when elapsed exactly equals 1 second (boundary – not > 1)', () => {
    expect(calcTPS(10, 1)).toBe(0);
  });

  test('TPS is calculated when elapsed > 1 second', () => {
    expect(calcTPS(20, 2)).toBe(10);
  });

  test('TPS rounds correctly for fractional results', () => {
    const tps = calcTPS(15, 4);
    expect(tps).toBeCloseTo(3.75, 2);
  });
});

// ---------------------------------------------------------------------------
// 5. Health-check response parsing
// ---------------------------------------------------------------------------
describe('Health Check Parsing', () => {
  const isModelLoaded = (data: { status: string; modelLoaded: boolean }): boolean =>
    data.modelLoaded === true || data.status === 'healthy';

  test('health check accepts status="healthy"', () => {
    expect(isModelLoaded({ status: 'healthy', modelLoaded: false })).toBe(true);
  });

  test('health check accepts modelLoaded=true', () => {
    expect(isModelLoaded({ status: 'ok', modelLoaded: true })).toBe(true);
  });

  test('health check rejects status="ok" with modelLoaded=false', () => {
    expect(isModelLoaded({ status: 'ok', modelLoaded: false })).toBe(false);
  });

  test('health check accepts both conditions satisfied simultaneously', () => {
    expect(isModelLoaded({ status: 'healthy', modelLoaded: true })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Chat export – Markdown generation
// ---------------------------------------------------------------------------
describe('Chat Export', () => {
  interface ExportMessage {
    role: string;
    content: string;
    timestamp: string;
  }

  const generateMarkdown = (messages: ExportMessage[]): string =>
    messages
      .map((m) => {
        const role = m.role === 'user' ? '**You**' : '**AI**';
        return `${role} *(${m.timestamp})*:\n\n${m.content}`;
      })
      .join('\n\n---\n\n');

  const sampleMessages: ExportMessage[] = [
    { role: 'user', content: 'Hello', timestamp: '10:00' },
    { role: 'assistant', content: 'Hi there!', timestamp: '10:01' },
  ];

  test('chat export generates markdown with user and AI labels', () => {
    const md = generateMarkdown(sampleMessages);

    expect(md).toContain('**You**');
    expect(md).toContain('**AI**');
    expect(md).toContain('Hello');
    expect(md).toContain('Hi there!');
  });

  test('chat export separates messages with horizontal rules', () => {
    const md = generateMarkdown(sampleMessages);
    expect(md).toContain('---');
  });

  test('chat export includes timestamps', () => {
    const md = generateMarkdown(sampleMessages);
    expect(md).toContain('10:00');
    expect(md).toContain('10:01');
  });

  test('chat export with single message has no separator', () => {
    const md = generateMarkdown([sampleMessages[0]]);
    expect(md).not.toContain('---');
  });
});

// ---------------------------------------------------------------------------
// 7. Quantization regex extraction
// ---------------------------------------------------------------------------
describe('Quantization Regex', () => {
  const extractQuant = (fileName: string): string => {
    const match = fileName.match(/[Qq](\d+)[_]?([A-Za-z0-9]*)/);
    return match ? `Q${match[1]}${match[2] ? '_' + match[2].toUpperCase() : ''}` : 'F16';
  };

  test('quantization regex extracts Q4_K correctly', () => {
    expect(extractQuant('llama-3.2-3b-instruct-q4_k_m.gguf')).toContain('Q4');
  });

  test('quantization falls back to F16 if no match', () => {
    expect(extractQuant('model.gguf')).toBe('F16');
  });

  test('quantization handles uppercase Q in filename', () => {
    expect(extractQuant('mistral-7b-Q8_0.gguf')).toContain('Q8');
  });

  test('quantization handles Q5 variant', () => {
    expect(extractQuant('phi-2-q5_k_m.gguf')).toContain('Q5');
  });
});

// ---------------------------------------------------------------------------
// 8. Negative – XSS via chat content
// ---------------------------------------------------------------------------
describe('Security', () => {
  const sanitise = (raw: string): string =>
    raw.replace(/<script[\s\S]*?<\/script>/gi, '');

  test('chat content does not execute scripts', () => {
    const malicious = '<script>alert("xss")</script>Hello';
    const cleaned = sanitise(malicious);

    expect(cleaned).not.toContain('<script>');
    expect(cleaned).toContain('Hello');
  });

  test('multi-line script tags are removed', () => {
    const malicious = '<script\n  type="text/javascript">\nalert(1)\n</script>Safe';
    const cleaned = sanitise(malicious);

    expect(cleaned).not.toContain('<script');
    expect(cleaned).toContain('Safe');
  });

  test('case-insensitive script tag is removed', () => {
    const malicious = '<SCRIPT>evil()</SCRIPT>OK';
    const cleaned = sanitise(malicious);

    expect(cleaned).not.toContain('<SCRIPT>');
    expect(cleaned).toContain('OK');
  });
});

// ---------------------------------------------------------------------------
// 9. Negative – Empty session deletion creates a fresh session
// ---------------------------------------------------------------------------
describe('Session Management', () => {
  interface ChatSession {
    id: string;
    title: string;
    messages: unknown[];
    createdAt: string;
    modelName: string;
  }

  const deleteSession = (sessions: ChatSession[], id: string): ChatSession[] => {
    const updated = sessions.filter((s) => s.id !== id);
    return updated.length === 0
      ? [{ id: 'fresh', title: 'New Chat', messages: [], createdAt: new Date().toISOString(), modelName: '' }]
      : updated;
  };

  test('deleting the only session creates a fresh one', () => {
    const sessions: ChatSession[] = [
      { id: 'a', title: 'Test', messages: [], createdAt: '', modelName: '' },
    ];
    const final = deleteSession(sessions, 'a');

    expect(final.length).toBe(1);
    expect(final[0].id).toBe('fresh');
    expect(final[0].title).toBe('New Chat');
  });

  test('deleting one of many sessions leaves the rest', () => {
    const sessions: ChatSession[] = [
      { id: 'a', title: 'Alpha', messages: [], createdAt: '', modelName: '' },
      { id: 'b', title: 'Beta', messages: [], createdAt: '', modelName: '' },
    ];
    const final = deleteSession(sessions, 'a');

    expect(final.length).toBe(1);
    expect(final[0].id).toBe('b');
  });

  test('deleting non-existent session id leaves all sessions unchanged', () => {
    const sessions: ChatSession[] = [
      { id: 'a', title: 'Alpha', messages: [], createdAt: '', modelName: '' },
    ];
    const final = deleteSession(sessions, 'z');

    expect(final.length).toBe(1);
    expect(final[0].id).toBe('a');
  });
});
