const fs = require('fs');
let content = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// We want to add a pulsing cursor to the end of the streaming message
content = content.replace(
  `                            >
                              {msg.content || ''}
                            </ReactMarkdown>`,
  `                            >
                              {(msg.content || '') + (generating && index === messages.length - 1 && !isUser ? ' █' : '')}
                            </ReactMarkdown>`
);

fs.writeFileSync('src/components/ChatContainer.tsx', content);
console.log('Added typing cursor');
