const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add clearCurrentChat handler
if (!code.includes('const clearCurrentChat = useCallback(() => {')) {
  const handler = `  const clearCurrentChat = useCallback(() => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [] };
      }
      return s;
    }));
    toast.success('Chat cleared');
  }, [activeSessionId]);`;
  
  code = code.replace(
    'const clearAllChats = useCallback(() => {',
    handler + '\n\n  const clearAllChats = useCallback(() => {'
  );
}

// 2. Pass it to ChatContainer
if (!code.includes('onClearCurrentChat={clearCurrentChat}')) {
  code = code.replace(
    'onDeleteMessage={handleDeleteMessage}',
    'onDeleteMessage={handleDeleteMessage}\n              onClearCurrentChat={clearCurrentChat}'
  );
}

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for clear chat');
