import "@/app/globals.css";
import { fontCode, fontDesc, fontMain } from "@/lib/fonts";

export const metadata = {
  title: "Assetra",
  description: "Asset Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontMain.variable} ${fontCode.variable} ${fontDesc.variable} ${fontMain.className}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}