// Serve the built artifact with its actual hosting headers for release QA.
import http from "node:http";
import { URL } from "node:url";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const rules = [];
for (const line of (await readFile(path.join(root, "_headers"), "utf8")).split(
  "\n",
)) {
  if (line.startsWith("/")) rules.push({ route: line.trim(), headers: {} });
  else if (line.trim() && rules.length) {
    const colon = line.indexOf(":");
    if (colon > 0)
      rules.at(-1).headers[line.slice(0, colon).trim()] = line
        .slice(colon + 1)
        .trim();
  }
}
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".txt": "text/plain",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let file = path.resolve(root, "." + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      try {
        if (!(await stat(file)).isFile()) file = path.join(root, "index.html");
      } catch {
        file = path.join(root, "index.html");
      }
      for (const rule of rules)
        if (rule.route === "/*" || rule.route === pathname) {
          for (const [name, value] of Object.entries(rule.headers))
            res.setHeader(name, value);
        }
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] ?? "application/octet-stream",
      );
      res.end(req.method === "HEAD" ? undefined : await readFile(file));
    } catch {
      res.writeHead(500).end("QA server error");
    }
  })
  .listen(4180, "127.0.0.1");
