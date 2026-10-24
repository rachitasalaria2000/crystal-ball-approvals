import React from "react";
import "./globals.css";
export const metadata = {
  title: "Approvals & Review | Crystal Ball",
  description: "An AI assistant for the OomniEye approvals workflow",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
