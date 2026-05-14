import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'wellasset board',
    description: 'Real Estate Analysis & Schedule Management',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body className={inter.className}>
                {children}
                <Script src="https://js.live.net/v7.2/OneDrive.js" strategy="lazyOnload" />
            </body>
        </html>
    );
}
