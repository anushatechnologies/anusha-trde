const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://ee4d0a3f987c35.lhr.life/';
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

const dests = [
  path.join('C:', 'Users', 'HP', '.gemini', 'antigravity-ide', 'brain', 'a8e74c1e-3784-4101-9b38-edd1fefeca2a', 'qr_code.png'),
  path.join('C:', 'Users', 'HP', '.gemini', 'antigravity-ide', 'brain', 'a8e74c1e-3784-4101-9b38-edd1fefeca2a', 'apk_download_qr_1779783634816.png')
];

https.get(qrApiUrl, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to generate QR code: ${res.statusCode}`);
    return;
  }
  
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    dests.forEach((dest) => {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buffer);
      console.log(`Successfully generated and saved QR code to: ${dest}`);
    });
  });
}).on('error', (err) => {
  console.error(`Error requesting QR code: ${err.message}`);
});
