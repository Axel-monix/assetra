const QRCode = require("qrcode");

const APP_URL = process.env.APP_URL || "http://localhost:3000";

function buildQrTargetUrl(assetCode) {
  return `${APP_URL}/items/${assetCode}`;
}

async function generateQrPng(assetCode) {
  const targetUrl = buildQrTargetUrl(assetCode);
  return QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 500,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

module.exports = { buildQrTargetUrl, generateQrPng };