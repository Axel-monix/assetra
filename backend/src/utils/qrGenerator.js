const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const QR_DIR = path.join(__dirname, "..", "..", "public", "qrcodes");

async function generateQrCode(assetCode) {
  if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
  }
  const filePath = path.join(QR_DIR, `${assetCode}.png`);
  await QRCode.toFile(filePath, assetCode, { width: 300, margin: 1 });
  return `/qrcodes/${assetCode}.png`;
}

module.exports = { generateQrCode };