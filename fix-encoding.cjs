const fs = require('fs');
const path = require('path');

const replacements = [
  // Emoji mappings
  ['\u011f\u00BF\u0160\u00A8', '\u{1F3A8}'], // 🎨
  ['\u011f\u00BF\u201C\u0152', '\u{1F50C}'], // 🔌
  ['\u011f\u00BF\u00A0\u00A2', '\u{1F3E2}'], // 🏢
  ['\u011f\u00BF\u00B7\u00AF\u00A0 ', '\u{1F3F7}\uFE0F'], // 🏷️
  ['\u011f\u00BF\u00AA\u00B5', '\u{1FAB5}'], // 🪵
  ['\u011f\u00BF\u201C\u0160', '\u{1F50A}'], // 🔊
  ['\u011f\u00BF\u00A4\u2013', '\u{1F916}'], // 🤖
  ['\u011f\u00BF\u2019\u00BE', '\u{1F4BE}'], // 💾
  ['\u011f\u00BF\u201C\u0160', '\u{1F4CA}'], // 📊
  ['\u011f\u00BF\u201C\u2039', '\u{1F4CB}'], // 📋
  ['\u00E2\u008C\u00A8', '\u2328\uFE0F'], // ⌨️
  ['\u011f\u00BF\u201C\u00A7', '\u{1F527}'], // 🔧
  ['\u011f\u00BF\u201C\u00A5', '\u{1F4E5}'], // 📥
  ['\u011f\u00BF\u2014\u201A', '\u{1F4C2}'], // 📂
  ['\u011f\u00BF\u201C \u00A0', '\u{1F512}'], // 🔒
  ['\u011f\u00BF\u2014\u00BA', '\u{1F5FA}\uFE0F'], // 🗺️
  ['\u00E2\u0084\u00B9', '\u2139\uFE0F'], // ℹ️
  ['\u011f\u00BF\u00A4\u00A5', '\u{1F4F1}'], // 📱
  ['\u011f\u00BF\u2019\u00BD', '\u{1F4E4}'], // 📤
  ['\u011f\u00BF\u201C\u00A3', '\u{1F4D1}'], // 📑

  // Turkish characters (mojibake from UTF-8 read as Latin-1)
  ['\u00C3\u009C', '\u00DC'], // Ü
  ['\u00C3\u00BC', '\u00FC'], // ü
  ['\u00C3\u0096', '\u00D6'], // Ö
  ['\u00C3\u00B6', '\u00F6'], // ö
  ['\u00C4\u00B0', '\u0130'], // İ
  ['\u00C4\u00B1', '\u0131'], // ı
  ['\u00C5\u009E', '\u015E'], // Ş
  ['\u00C5\u009F', '\u015F'], // ş
  ['\u00C3\u0087', '\u00C7'], // Ç
  ['\u00C3\u00A7', '\u00E7'], // ç

  // More emoji mojibake
  ['\u00E2\u009C\u0085', '\u2705'], // ✅
  ['\u00E2\u009D\u008C', '\u274C'], // ❌
  ['\u00E2\u009A\u00A0 \u00EF\u00B8\u008F', '\u26A0\uFE0F'], // ⚠️
  ['\u00E2\u009B\u00A1\u00EF\u00B8\u008F', '\u26A0\uFE0F'], // ⚠️
  ['\u00E2\u0080\u00A1', '\u00BB'], // »
  ['\u00E2\u0086\u0092', '\u2192'], // →
  ['\u00E2\u0086\u0090', '\u2190'], // ←
  ['\u00E2\u0086\u0091', '\u2191'], // ↑
  ['\u00E2\u0086\u0093', '\u2193'], // ↓
  ['\u00E2\u0080\u0094', '\u2014'], // —
  ['\u00E2\u0080\u0093', '\u2013'], // –
  ['\u00E2\u0097\u008F', '\u25CF'], // ●
  ['\u00E2\u0096\u00A0', '\u25A0'], // ■
  ['\u00E2\u0096\u00B2', '\u25B2'], // ▲
  ['\u00E2\u0096\u00BC', '\u25BC'], // ▼
  ['\u00E2\u009C\u0093', '\u2713'], // ✓
  ['\u00E2\u009C\u0094', '\u2714'], // ✔
  ['\u00E2\u0080\u00A6', '\u2026'], // …

  // Additional common mojibake
  ['\u00C3\u00A4', '\u00E4'], // ä
  ['\u00C3\u00A9', '\u00E9'], // é
  ['\u00C3\u00A8', '\u00E8'], // è
  ['\u00C3\u00A1', '\u00E1'], // á
  ['\u00C3\u00AD', '\u00ED'], // í
  ['\u00C3\u00B3', '\u00F3'], // ó
  ['\u00C3\u00BA', '\u00FA'], // ú
  ['\u00C3\u00B1', '\u00F1'], // ñ
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;
    for (const [bad, good] of replacements) {
      if (content.includes(bad)) {
        content = content.split(bad).join(good);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    return false;
  } catch (e) {
    console.error(`❌ Error: ${path.relative(process.cwd(), filePath)} - ${e.message}`);
    return false;
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      count += walkDir(fullPath);
    } else if (/\.(tsx?|css|json|html)$/.test(file)) {
      if (fixFile(fullPath)) count++;
    }
  }
  return count;
}

console.log('🔧 Encoding fix started...');
const fixed = walkDir('src');
console.log(`\n✨ Done! Fixed ${fixed} files.`);
