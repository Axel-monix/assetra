const QRCode = require("qrcode");

function buildQrTargetUrl(assetCode) {
  const rawAppUrl = process.env.APP_URL || "http://localhost:3000";
  const appUrl = rawAppUrl.replace(/\/+$/, "");
  return `${appUrl}/items/${encodeURIComponent(assetCode)}`;
}

function injectLogoIntoQrSvg(rawSvg) {
  const viewBoxMatch = rawSvg.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/);
  const size = viewBoxMatch ? parseFloat(viewBoxMatch[1]) : 41;

  // Badge takes ~26% of QR width (~6.8% total area, safe within Error Correction 'H' 30% limit)
  const badgeSize = Number((size * 0.26).toFixed(2));
  const badgeX = Number(((size - badgeSize) / 2).toFixed(2));
  const badgeY = Number(((size - badgeSize) / 2).toFixed(2));
  const outerRx = Number((badgeSize * 0.22).toFixed(2));

  // Inset dark card
  const inset = Number((badgeSize * 0.06).toFixed(2));
  const innerSize = Number((badgeSize - inset * 2).toFixed(2));
  const innerX = Number((badgeX + inset).toFixed(2));
  const innerY = Number((badgeY + inset).toFixed(2));
  const innerRx = Number((innerSize * 0.2).toFixed(2));

  // Logo within dark card with breathing room padding
  const logoPadding = Number((innerSize * 0.12).toFixed(2));
  const logoSize = Number((innerSize - logoPadding * 2).toFixed(2));
  const logoX = Number((innerX + logoPadding).toFixed(2));
  const logoY = Number((innerY + logoPadding).toFixed(2));

  const logoOverlay = `
  <g id="assetra-qr-logo">
    <!-- Clean white safety boundary separating QR code matrix from logo -->
    <rect x="${badgeX}" y="${badgeY}" width="${badgeSize}" height="${badgeSize}" rx="${outerRx}" fill="#ffffff" />
    <!-- Sleek Assetra deep dark-indigo badge card -->
    <rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" rx="${innerRx}" fill="#0f0c24" />
    <!-- Embedded Assetra Logo Vector -->
    <svg x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="assetraA_qr" x1="24" y1="14" x2="61" y2="76" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFFFFF"/>
          <stop offset="1" stop-color="#C9CAFF"/>
        </linearGradient>
        <linearGradient id="assetraBox_qr" x1="45" y1="54" x2="58" y2="84" gradientUnits="userSpaceOnUse">
          <stop stop-color="#9E6BFF"/>
          <stop offset="1" stop-color="#4D28DC"/>
        </linearGradient>
      </defs>
      <path d="M14 76L38 22C39.8 17.9 45.6 17.9 47.4 22L64 59" stroke="url(#assetraA_qr)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M30 61L47 51L64 61L47 71L30 61Z" fill="#B77CFF"/>
      <path d="M30 61V78L47 88V71L30 61Z" fill="#5A2BE0"/>
      <path d="M47 71V88L64 78V61L47 71Z" fill="url(#assetraBox_qr)"/>
      <path d="M47 51L64 61L58 65L41 55L47 51Z" fill="#7F43F0"/>
      <rect x="70" y="30" width="9" height="9" rx="1.5" fill="#F4F4FF"/>
      <rect x="80" y="21" width="10" height="10" rx="1.5" fill="#F4F4FF"/>
      <rect x="72" y="44" width="12" height="12" rx="1.5" fill="#E8E8FF"/>
      <rect x="83" y="59" width="7" height="7" rx="1.5" fill="#F4F4FF"/>
      <rect x="71" y="68" width="8" height="8" rx="1.5" fill="#E8E8FF"/>
    </svg>
  </g>
</svg>`;

  return rawSvg.replace("</svg>", logoOverlay);
}

async function generateQrSvg(assetCode) {
  const targetUrl = buildQrTargetUrl(assetCode);
  const rawSvg = await QRCode.toString(targetUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
  });

  return injectLogoIntoQrSvg(rawSvg);
}

async function generateQrPng(assetCode) {
  const targetUrl = buildQrTargetUrl(assetCode);
  return QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 500,
    margin: 2,
    errorCorrectionLevel: "H",
  });
}

module.exports = {
  buildQrTargetUrl,
  generateQrSvg,
  generateQrPng,
};
