const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const regex = /\s*--accent:\s*#818cf8;\s*--accent-hover:\s*#6366f1;/;
code = code.replace(regex, '');

fs.writeFileSync('src/index.css', code);
console.log('Removed hardcoded accents from index.css');
