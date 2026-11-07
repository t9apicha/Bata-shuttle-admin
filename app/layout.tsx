import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout"; 

export const metadata: Metadata = {
  title: "ShuttleTrack RSU - Admin",
  description: "Shuttle Bus Admin Management Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen flex font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}