const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach(name => {
    const filePath = path.join(currentDirPath, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      if(filePath.endsWith('.jsx')) callback(filePath, stat);
    } else if (stat.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
}

let changes = 0;
walkSync('src/pages', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  // Match "display: 'flex', justifyContent: 'space-between', alignItems: 'center'" and insert flexWrap
  let newContent = content.replace(
    /display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center'/g, 
    "display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'"
  );
  if(content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    changes++;
    console.log('Fixed banner flexWrap in:', filePath);
  }
});
console.log('Total files patched with flexWrap:', changes);
