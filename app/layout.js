import "./globals.scss";
import localFont from 'next/font/local';
import MouseFollowCircle from "@/components/MouseFollowCircle/MouseFollowCircle";
import CursorManager from '@/components/CursorManager/CursorManager';

const biz_ud_mincho = localFont({
  src: [
    {
      path: "./fonts/BIZUDMincho/BIZUDMincho-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/BIZUDMincho/BIZUDMincho-Bold.ttf",
      weight: "700",
      style: "bold",
    },
  ],
  variable: "--font-biz-ud-mincho",
  display: "swap",
});

export const metadata = {
  title: "MARC&MORITZ",
  description: "Creative Partnership since 2018",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${biz_ud_mincho.variable}`}
      >
        <CursorManager />
        {children}
        <MouseFollowCircle />
      </body>
    </html>
  );
}
