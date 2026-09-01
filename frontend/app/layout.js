import "@/app/globals.css";
import { fontCode, fontDesc, fontMain } from "@/lib/fonts";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Assetra",
  description: "Asset Management System",
};

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${fontMain.variable} ${fontCode.variable} ${fontDesc.variable} ${fontMain.className}`}
        suppressHydrationWarning
      >
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}