import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KI Content Fabrik — Social Media Creator',
  description: 'KI-gestützte Social-Media-Content-Erstellung',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
