  import "@/app/globals.css";
  import { NextIntlClientProvider } from "next-intl";
  import { getLocale, getMessages } from "next-intl/server";
  import { fontCode, fontDesc, fontMain } from "@/lib/fonts";
  import ConnectionGuard from "@/components/common/connectionGuard";

  export const metadata = {
    title: "Assetra",
    description: "Track Your Stuff",
  };

  export default async function RootLayout({ children }) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
      <html lang={locale} suppressHydrationWarning>
        <body
          className={`${fontMain.variable} ${fontCode.variable} ${fontDesc.variable} ${fontMain.className}`}
          suppressHydrationWarning
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ConnectionGuard />
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }