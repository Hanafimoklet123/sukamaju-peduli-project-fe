import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { DemoProvider } from "@/lib/demo-provider";
export const metadata: Metadata = {
  title: { default: "Sukamaju Peduli", template: "%s | Sukamaju Peduli" },
  description:
    "Layanan pengaduan masyarakat Kelurahan Sukamaju. Versi tinjauan frontend.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      {/* Browser extensions such as Grammarly add body attributes before hydration. */}
      <body suppressHydrationWarning>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
