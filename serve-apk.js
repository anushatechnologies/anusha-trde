const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8086;
const os = require('os');
const networkInterfaces = os.networkInterfaces();
let ip = '192.168.1.55';
for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (const iface of interfaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      ip = iface.address;
      break;
    }
  }
}
const debugApkPath = fs.existsSync(path.join(__dirname, 'app-debug.apk'))
  ? path.join(__dirname, 'app-debug.apk')
  : path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const releaseApkPath = fs.existsSync(path.join(__dirname, 'app-release.apk'))
  ? path.join(__dirname, 'app-release.apk')
  : path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

const server = http.createServer((req, res) => {
  if (req.url === '/app-release.apk') {
    fs.stat(releaseApkPath, (err, stats) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Release APK not found. Please compile the app first.');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stats.size,
      });
      const stream = fs.createReadStream(releaseApkPath);
      stream.pipe(res);
    });
  } else if (req.url === '/app-debug.apk') {
    fs.stat(debugApkPath, (err, stats) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Debug APK not found. Please compile the app first.');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stats.size,
      });
      const stream = fs.createReadStream(debugApkPath);
      stream.pipe(res);
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head>
          <title>Download APK</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; background-color: #F8FAFC; color: #1E293B; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            h2 { color: #0F172A; }
            .btn { display: inline-block; padding: 15px 30px; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px; width: 80%; max-width: 300px; }
            .btn-primary { background-color: #10B981; }
            .btn-secondary { background-color: #3B82F6; }
            .note { font-size: 0.9rem; color: #64748B; margin-top: 10px; }
            .badge { display: inline-block; background: #D1FAE5; color: #065F46; padding: 4px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Anusha Trade Mobile App APK</h2>
            <p>Scan or click below to download the APKs directly to your Android device:</p>
            
            <div style="margin-top: 30px; border: 1px solid #E2E8F0; padding: 20px; border-radius: 12px; background: #F8FAFC;">
              <span class="badge">RECOMMENDED (REAL-TIME PREVIEW)</span>
              <h3>Standalone Release APK</h3>
              <p class="note">Self-contained production build. Works in real-time, signed, and includes Firebase OTP verification.</p>
              <a href="/app-release.apk" class="btn btn-primary" download>Download Release APK</a>
            </div>

            <div style="margin-top: 20px; border: 1px solid #E2E8F0; padding: 20px; border-radius: 12px;">
              <h3>Developer Debug APK</h3>
              <p class="note">Uses Metro Bundler to support debugging features.</p>
              <a href="/app-debug.apk" class="btn btn-secondary" download>Download Debug APK</a>
            </div>
          </div>
        </body>
      </html>
    `);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running at http://${ip}:${port}/`);
});
