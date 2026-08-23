
// - fontMain  (Manrope)        -> font utama 
// - fontCode  (JetBrains Mono) -> khusus kode barang / serial number
// - fontDesc  (Inter)          -> khusus deskripsi/spesifikasi barang

import { Manrope, JetBrains_Mono, Inter } from "next/font/google";

export const fontMain = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-main",
  display: "swap",
});

export const fontCode = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-code",
  display: "swap",
});

export const fontDesc = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-desc",
  display: "swap",
});
