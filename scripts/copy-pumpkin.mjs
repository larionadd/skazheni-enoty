import fs from "node:fs";
import path from "node:path";

const srcDir = path.resolve("pumpkin-alchemy");
const targetDir = path.resolve("dist/pumpkin-alchemy");

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(srcDir, targetDir, {
    recursive: true,
    filter: (src) => !src.includes("node_modules") && !src.endsWith(".log") && !src.endsWith(".tmp")
  });
  console.log("Successfully copied pumpkin-alchemy to dist/pumpkin-alchemy!");
}
