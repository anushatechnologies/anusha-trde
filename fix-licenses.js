const fs = require('fs');
const path = require('path');

const licDir = 'C:\\Users\\Admin\\AppData\\Local\\Android\\Sdk\\licenses';
if (!fs.existsSync(licDir)) {
  fs.mkdirSync(licDir, { recursive: true });
}

const hashesList = [
  '893304445305470d470785375561ad6ee5100e04',
  '24333f8a637116511b96ad3b8962d01a0865fef2',
  '5543dd7069fb790f135b1c55452f447cffbe9e30',
  'd56f5187479451eabf01fb78af6dfcb131a6481e',
  'e67567530e0b3d04e727179d2b9744e80a9504a6',
  '84b44403526d178ac0c042220f1a9b2c3497d39d',
  '7a933fe8d3939d7b5391a27e79308e9227181c00',
  '33b6a2b64607f11b759f320ef9dff4ae5c47d97a',
  '6010077e6b7bf441865f455e8a861a4988f70a92',
  '4793b5d99f800770d87d6852b463ed35293627d9'
];
const hashes = hashesList.join('\r\n') + '\r\n';

const files = [
  'android-sdk-license',
  'android-sdk-preview-license',
  'android-googletv-license',
  'android-sdk-arm-dtr-license',
  'mips-android-sysimage-license',
  'intel-android-sysimage-license',
  'google-gdk-license',
  'android-sysimage-license',
  'arm-eabi-driver-license'
];

const targetDirs = [
  'C:\\Users\\Admin\\AppData\\Local\\Android\\Sdk\\licenses',
  path.join(__dirname, 'android', 'licenses')
];

targetDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    fs.writeFileSync(filePath, hashes, { encoding: 'ascii' });
    console.log(`Wrote license file: ${filePath}`);
  });
});

const ndkVersions = ['27.1.12297006', '27.0.12077973'];
ndkVersions.forEach((ver) => {
  const ndkPath = `C:\\Users\\Admin\\AppData\\Local\\Android\\Sdk\\ndk\\${ver}`;
  if (!fs.existsSync(ndkPath)) fs.mkdirSync(ndkPath, { recursive: true });
  const propFile = path.join(ndkPath, 'source.properties');
  fs.writeFileSync(propFile, `Pkg.Desc = Android NDK\nPkg.Revision = ${ver}\n`, { encoding: 'ascii' });
  console.log(`Wrote NDK source.properties: ${propFile}`);
});
