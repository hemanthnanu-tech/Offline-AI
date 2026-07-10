const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const banner = `
  console.clear();
  console.log('\\x1b[36m%s\\x1b[0m', '=======================================================');
  console.log('\\x1b[36m%s\\x1b[0m', '      ███████╗ ██████╗ ██████╗ ██████╗ ███████╗       ');
  console.log('\\x1b[36m%s\\x1b[0m', '      ██╔════╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝       ');
  console.log('\\x1b[36m%s\\x1b[0m', '      █████╗  ██║   ██║██████╔╝██████╔╝█████╗         ');
  console.log('\\x1b[36m%s\\x1b[0m', '      ██╔══╝  ██║   ██║██╔══██╗██╔══██╗██╔══╝         ');
  console.log('\\x1b[36m%s\\x1b[0m', '      ██║     ╚██████╔╝██║  ██║██║  ██║███████╗       ');
  console.log('\\x1b[36m%s\\x1b[0m', '      ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝       ');
  console.log('\\x1b[36m%s\\x1b[0m', '=======================================================');
  console.log('\\x1b[35m%s\\x1b[0m', '           O F F L I N E   A I   S Y S T E M           ');
  console.log('\\x1b[36m%s\\x1b[0m', '=======================================================');
  console.log('\\x1b[33m%s\\x1b[0m', '              Created by: Hemanth Kumar K              ');
  console.log('\\x1b[36m%s\\x1b[0m', '=======================================================');
  console.log('');
`;

content = content.replace(/app\.listen\(PORT, HOST, \(\) => \{/, 'app.listen(PORT, HOST, () => {' + banner);

fs.writeFileSync('server.ts', content);
console.log('Successfully patched server.ts');
