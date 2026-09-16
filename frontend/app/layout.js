import "@/app/globals.css";
import { fontCode, fontDesc, fontMain } from "@/lib/fonts";

export const metadata = {
  title: "Assetra",
  description: "Asset Management System",
};

export default async function RootLayout({ children, params }) {
  const { locale = "en" } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontMain.variable} ${fontCode.variable} ${fontDesc.variable} ${fontMain.className}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
