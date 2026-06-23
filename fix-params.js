const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Update the type signature
      if (content.includes('{ params }: { params: { id: string } }')) {
        content = content.replace(
          /\{ params \}: \{ params: \{ id: string \} \}/g,
          '{ params }: { params: Promise<{ id: string }> }'
        );
        changed = true;
      }

      // Await params inline
      if (content.includes('params.id')) {
        content = content.replace(/params\.id/g, '(await params).id');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src', 'app', 'api'));
