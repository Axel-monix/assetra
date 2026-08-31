const QRCode = require("qrcode");

const QR_UPLOAD_ENDPOINT = process.env.QR_UPLOAD_ENDPOINT;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function generateQrCode(assetCode) {
  if (!QR_UPLOAD_ENDPOINT) {
    throw new Error("QR_UPLOAD_ENDPOINT belum diset di .env");
  }

  const detailUrl = `${APP_URL}/items/${assetCode}`;

  const qrBuffer = await QRCode.toBuffer(detailUrl, {
    width: 500,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const formData = new FormData();
  formData.append(
    "foto",
    new Blob([qrBuffer], { type: "image/png" }),
    `${assetCode}.png`,
  );

  const response = await fetch(QR_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Gagal upload QR code ke server");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Gagal upload QR code ke server");
  }

  return result.foto;
}

module.exports = { generateQrCode };