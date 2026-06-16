import { createWriteStream, existsSync, mkdirSync } from "fs";
import { get } from "https";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dest = join(__dirname, "../public/images/fredson-muianga.jpg");
const url =
  "https://drive.google.com/uc?export=download&id=1IMVc6YsOL3AVk-bRWC2_KFqD9BmH6Bcd";

if (!existsSync(join(__dirname, "../public/images"))) {
  mkdirSync(join(__dirname, "../public/images"), { recursive: true });
}

if (existsSync(dest)) {
  console.log("Founder image already exists, skipping download.");
  process.exit(0);
}

function download(url, dest, redirects = 0) {
  if (redirects > 5) {
    console.error("Too many redirects");
    process.exit(1);
  }
  get(url, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      download(res.headers.location, dest, redirects + 1);
      return;
    }
    const file = createWriteStream(dest);
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log("Founder image downloaded successfully.");
    });
  }).on("error", (err) => {
    console.error("Download failed:", err.message);
  });
}

download(url, dest);
