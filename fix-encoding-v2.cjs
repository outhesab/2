const fs = require('fs');
const path = require('path');

function fixContent(content) {
  let s = content;
  
  // Turkish characters mojibake (UTF-8 bytes read as Latin-1/Windows-1252)
  const turkishPairs = [
    ['\u00C3\u009C', 'Ü'], ['\u00C3\u00BC', 'ü'],
    ['\u00C3\u0096', 'Ö'], ['\u00C3\u00B6', 'ö'],
    ['\u00C3\u0087', 'Ç'], ['\u00C3\u00A7', 'ç'],
    ['\u00C3\u009E', 'Ğ'], ['\u00C3\u009F', 'ğ'],
    ['\u00C4\u00B0', 'İ'], ['\u00C4\u00B1', 'ı'],
    ['\u00C5\u009E', 'Ş'], ['\u00C5\u009F', 'ş'],
    ['\u00C3\u00A4', 'ä'], ['\u00C3\u00A9', 'é'],
    ['\u00C3\u00A8', 'è'], ['\u00C3\u00A1', 'á'],
    ['\u00C3\u00AD', 'í'], ['\u00C3\u00B3', 'ó'],
    ['\u00C3\u00BA', 'ú'], ['\u00C3\u00B1', 'ñ'],
  ];
  
  for (const [bad, good] of turkishPairs) {
    s = s.split(bad).join(good);
  }

  // Emoji mojibake patterns - comprehensive
  // These are UTF-8 emoji bytes read as Windows-1252/Latin-1
  const emojiPairs = [
    // 🎨 paint emoji
    ['\u011f\u00BF\u0160\u00A8', '🎨'],
    // 🔌 plug
    ['\u011f\u00BF\u201C\u0152', '🔌'],
    // 🏢 office
    ['\u011f\u00BF\u00A0\u00A2', '🏢'],
    // 🪵 wood
    ['\u011f\u00BF\u00AA\u00B5', '🪵'],
    // 🔊 loud
    ['\u011f\u00BF\u201C\u0160', '🔊'],
    // 🤖 robot
    ['\u011f\u00BF\u00A4\u2013', '🤖'],
    // 💾 floppy
    ['\u011f\u00BF\u2019\u00BE', '💾'],
    // 📊 chart
    ['\u011f\u00BF\u201C\u0160', '📊'],
    // 📋 clipboard  
    ['\u011f\u00BF\u201C\u2039', '📋'],
    // 🔧 wrench
    ['\u011f\u00BF\u201C\u00A7', '🔧'],
    // 📥 inbox
    ['\u011f\u00BF\u201C\u00A5', '📥'],
    // 📂 folder
    ['\u011f\u00BF\u2014\u201A', '📂'],
    // 🔒 lock
    ['\u011f\u00BF\u201C \u00A0', '🔒'],
    // 🗺️ map
    ['\u011f\u00BF\u2014\u00BA', '🗺️'],
    // 📱 phone
    ['\u011f\u00BF\u00A4\u00A5', '📱'],
    // 📤 send
    ['\u011f\u00BF\u2019\u00BD', '📤'],
    // 📑 bookmark
    ['\u011f\u00BF\u201C\u00A3', '📑'],
    // ⌨️ keyboard
    ['\u00E2\u008C\u00A8', '⌨️'],
    // ℹ️ info
    ['\u00E2\u0084\u00B9', 'ℹ️'],
    // ✅ check
    ['\u00E2\u009C\u0085', '✅'],
    // ❌ cross
    ['\u00E2\u009D\u008C', '❌'],
    // ⚠️ warning - multiple patterns
    ['\u00E2\u009A\u00A0 \u00EF\u00B8\u008F', '⚠️'],
    ['\u00E2\u009B\u00A1\u00EF\u00B8\u008F', '⚠️'],
    ['\u00E2\u009A\u00A0\u00EF\u00B8\u008F', '⚠️'],
    // 🎵 note
    ['\u011f\u00BF\u0160\u00AA', '🎵'],
    // 🔇 mute
    ['\u011f\u00BF\u201C\u00C2', '🔇'],
    // 🎶 notes
    ['\u011f\u00BF\u0160\u00A7', '🎶'],
    // 🗣️ speech
    ['\u011f\u00BF\u2014\u00A3\u00EF\u00B8\u008F', '🗣️'],
    // 👁️ eye
    ['\u011f\u00BF\u2018\u0081\u00EF\u00B8\u008F', '👁️'],
    // 👁ï¸ eye variant
    ['\u011f\u00BF\u2018\u0081\u00EF\u00B8\u008F', '👁️'],
    // 🔐 locked
    ['\u011f\u00BF\u201C\u00A0', '🔐'],
    // 🏗️ construction
    ['\u011f\u00BF\u00A0\u00A0\u00EF\u00B8\u008F', '🏗️'],
    // 📊 chart
    ['\u011f\u00BF\u201C\u0160', '📊'],
    // 🏦 bank
    ['\u011f\u00BF\u00A0\u00A6', '🏦'],
    // 💰 money
    ['\u011f\u00BF\u2019\u00B0', '💰'],
    // 🛒 cart
    ['\u011f\u00BF\u2019\u00A7', '🛒'],
    // 📦 box
    ['\u011f\u00BF\u201C\u00A6', '📦'],
    // 👤 user
    ['\u011f\u00BF\u2018\u00A4', '👤'],
    // 🏭 factory
    ['\u011f\u00BF\u00A0\u00AD', '🏭'],
    // 🚚 truck
    ['\u011f\u00BF\u201A\u00BA', '🚚'],
    // 💳 credit card
    ['\u011f\u00BF\u2019\u00B3', '💳'],
    // 📈 chart up
    ['\u011f\u00BF\u201C\u00C8', '📈'],
    // ⚖️ balance
    ['\u00E2\u009A\u0096\u00EF\u00B8\u008F', '⚖️'],
    // ⏳ hourglass
    ['\u00E2\u008F\u00B3', '⏳'],
    // 🧩 puzzle
    ['\u011f\u00BF\u00A7\u00A9', '🧩'],
    // 📝 memo
    ['\u011f\u00BF\u201C\u00AD', '📝'],
    // 📍 pin
    ['\u011f\u00BF\u201C\u00B1', '📍'],
    // ➕ plus
    ['\u00E2\u009E\u0095', '➕'],
    // 🔎 search
    ['\u011f\u00BF\u201C\u008E', '🔎'],
    // 📋 clipboard variant
    ['\u011f\u00BF\u201C\u008B', '📋'],
    // 💾 save variant
    ['\u011f\u00BF\u2019\u00BC', '💾'],
    // 🗑️ trash
    ['\u011f\u00BF\u2014\u00B1\u00EF\u00B8\u008F', '🗑️'],
    // 🧾 receipt
    ['\u011f\u00BF\u00A7\u00BE', '🧾'],
    // 📊 chart bar
    ['\u011f\u00BF\u201C\u00BA', '📊'],
    // 🪙 coin
    ['\u011f\u00BF\u00AA\u00A9', '🪙'],
    // 🤝 handshake
    ['\u011f\u00BF\u00A4\u009D', '🤝'],
    // 🔄 refresh
    ['\u011f\u00BF\u2014\u00B4', '🔄'],
    // 🛡️ shield
    ['\u011f\u00BF\u2019\u00A1\u00EF\u00B8\u008F', '🛡️'],
    // 🔥 fire
    ['\u011f\u00BF\u201C\u00A8', '🔥'],
    // 💎 gem
    ['\u011f\u00BF\u2019\u20AC', '💎'],
    // 🔤 ABC
    ['\u011f\u00BF\u201C\u0151', '🔤'],
    // ⚡ lightning
    ['\u00E2\u009A\u00A1', '⚡'],
    // 🧩 puzzle variant
    ['\u011f\u00BF\u00A7\u00A9', '🧩'],
    // 💠 diamond
    ['\u011f\u00BF\u2019\u00A8', '💠'],
    // 🏷️ tag
    ['\u011f\u00BF\u00B7\u00AF\u00A0\u00EF\u00B8\u008F', '🏷️'],
    ['\u011f\u00BF\u00B7\u00AF\u00A0 ', '🏷️'],
    // 📁 folder variant
    ['\u011f\u00BF\u201C\u0087', '📁'],
    // 🐢 turtle
    ['\u011f\u00BF\u201A\u00A2', '🐢'],
    // 🚫 prohibited
    ['\u011f\u00BF\u201A\u00AB', '🚫'],
    // ↑↓ arrows
    ['\u00E2\u0086\u0091', '↑'],
    ['\u00E2\u0086\u0093', '↓'],
    ['\u00E2\u0086\u0092', '→'],
    ['\u00E2\u0086\u0090', '←'],
    // ✕ close
    ['\u00E2\u009C\u0095', '✕'],
    // ✨ sparkle
    ['\u00E2\u009C\u00A8', '✨'],
    // ▲▼ triangles
    ['\u00E2\u0096\u00B2', '▲'],
    ['\u00E2\u0096\u00BC', '▼'],
    // ● bullet
    ['\u00E2\u0097\u008F', '●'],
    // ■ square
    ['\u00E2\u0096\u00A0', '■'],
    // … ellipsis
    ['\u00E2\u0080\u00A6', '…'],
    // — em dash
    ['\u00E2\u0080\u0094', '—'],
    // – en dash
    ['\u00E2\u0080\u0093', '–'],
    // » right guillemet
    ['\u00E2\u0080\u00A1', '»'],
    // ✓ checkmark
    ['\u00E2\u009C\u0093', '✓'],
    ['\u00E2\u009C\u0094', '✔'],
    // 🏷️ tag alt pattern
    ['\u00BF\u00B7\u00AF\u00A0', '🏷️'],
  ];
  
  for (const [bad, good] of emojiPairs) {
    if (bad && good) s = s.split(bad).join(good);
  }
  
  // Catch remaining ğŸ patterns with a regex approach
  // ğŸ followed by any 1-2 char = likely emoji
  // Replace any remaining "ğŸ" with empty or skip
  s = s.replace(/\u011f\u00BF/g, '');
  
  return s;
}

function walkAndFix(dir) {
  const entries = fs.readdirSync(dir);
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && entry !== 'node_modules' && entry !== '.git') {
      count += walkAndFix(fullPath);
    } else if (/\.(tsx?|css|json|html)$/.test(entry)) {
      try {
        const original = fs.readFileSync(fullPath, 'utf-8');
        const fixed = fixContent(original);
        if (fixed !== original) {
          fs.writeFileSync(fullPath, fixed, 'utf-8');
          console.log(`✅ ${path.relative(process.cwd(), fullPath)}`);
          count++;
        }
      } catch (e) {
        console.error(`❌ ${path.relative(process.cwd(), fullPath)}: ${e.message}`);
      }
    }
  }
  return count;
}

console.log('🔧 Kapsamlı encoding fix...');
const n = walkAndFix('src');
console.log(`\n✨ ${n} dosya düzeltildi.`);
