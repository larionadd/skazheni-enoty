import fs from "node:fs";
import path from "node:path";

function copyFolder(src, target) {
  const srcDir = path.resolve(src);
  const targetDir = path.resolve(target);
  if (fs.existsSync(srcDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.cpSync(srcDir, targetDir, {
      recursive: true,
      filter: (filePath) => !filePath.includes("node_modules") && !filePath.endsWith(".log") && !filePath.endsWith(".tmp")
    });
    console.log(`Successfully copied ${src} to ${target}!`);
  }
}

copyFolder("pumpkin-alchemy", "dist/pumpkin-alchemy");
copyFolder("quest-editor", "dist/quest-editor");
