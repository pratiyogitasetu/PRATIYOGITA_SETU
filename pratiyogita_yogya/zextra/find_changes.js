import fs from 'fs';
import readline from 'readline';

const logPath = 'C:/Users/GEORGIAN/.gemini/antigravity-ide/brain/c68687b0-17bb-4868-a816-28db7ea8fcc3/.system_generated/logs/transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('index.css') && line.includes('replace_file_content')) {
      console.log('--- FOUND INDEX.CSS CHANGE ---');
      try {
        const obj = JSON.parse(line);
        console.log(JSON.stringify(obj.tool_calls || obj.content, null, 2));
      } catch (e) {
        console.log(line.substring(0, 1000));
      }
    }
  }
}

main().catch(console.error);
