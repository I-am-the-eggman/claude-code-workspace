/**
 * Anthropic API CORS プロキシ
 *
 * 使い方:
 *   node proxy.js
 *
 * その後ブラウザで http://localhost:3001 を開く。
 * Node.js 標準モジュールのみ使用（npm install 不要）。
 */

const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");
const PORT  = 3001;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-calls",
  "Access-Control-Max-Age":       "86400",
};

http.createServer((req, res) => {

  // preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // /v1/... → Anthropic へ転送
  if (req.url.startsWith("/v1/")) {
    const options = {
      hostname: "api.anthropic.com",
      port:     443,
      path:     req.url,
      method:   req.method,
      headers:  Object.assign({}, req.headers, { host: "api.anthropic.com" }),
    };

    const proxy = https.request(options, (proxyRes) => {
      const headers = Object.assign({}, proxyRes.headers, CORS_HEADERS);
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });

    proxy.on("error", (err) => {
      res.writeHead(502, CORS_HEADERS);
      res.end(JSON.stringify({ error: err.message }));
    });

    req.pipe(proxy);
    return;
  }

  // それ以外 → index.html を配信
  const filePath = req.url === "/" ? "/index.html" : req.url;
  const fullPath = path.join(__dirname, filePath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext  = path.extname(fullPath);
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log(`\nプロキシ起動中: http://localhost:${PORT}`);
  console.log("ブラウザで上記URLを開いてください。Ctrl+C で終了。\n");
});
