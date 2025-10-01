const fs = require('fs');
const path = require('path');

const routePath = path.join(__dirname, 'src', 'app', 'api', 'upload', 'route.ts');
console.log('Checking route path:', routePath);
console.log('File exists:', fs.existsSync(routePath));

if (fs.existsSync(routePath)) {
  const content = fs.readFileSync(routePath, 'utf8');
  console.log('File size:', content.length);

  // Check for syntax errors
  const hasExport = content.includes('export async function POST');
  console.log('Has POST export:', hasExport);

  // Check for problematic imports
  const imports = content.match(/import .+ from .+/g);
  console.log('\nImports found:');
  imports?.forEach(imp => console.log('  -', imp));
}
