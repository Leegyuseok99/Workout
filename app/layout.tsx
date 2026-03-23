"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./globals.css"; // 이 줄이 반드시 있어야 스타일이 적용됩니다.

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
