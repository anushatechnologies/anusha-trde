const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function safeResolve(requestPath) {
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.join(distDir, normalizedPath);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(path.resolve(distDir))) {
    return null;
  }

  return resolved;
}

function serveFile(filePath, response) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      const fallbackPath = path.join(distDir, 'index.html');

      fs.readFile(fallbackPath, (fallbackError, fallbackContent) => {
        if (fallbackError) {
          response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Unable to read exported app.');
          return;
        }

        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(fallbackContent);
      });

      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const type = mimeTypes[extension] || 'application/octet-stream';

    response.writeHead(200, { 'Content-Type': type });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const requestedPath = safeResolve(request.url || '/');

  if (!requestedPath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  serveFile(requestedPath, response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`InvestApp preview running at http://127.0.0.1:${port}`);
});
