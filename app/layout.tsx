import "./globals.css"; // 이 줄이 반드시 있어야 스타일이 적용됩니다.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
