import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { AuthProvider } from "@/context/AuthContext";

const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "منصة الأزهري للتأهيل والتدريب المهني",
  description: "Al-Azhari Prometric & Pearson VUE Platform. منصة متخصصة في إعداد الممرضين لاجتياز اختبارات البرومترك.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let user = null;

  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (e) {
      // Invalid token
    }
  }

  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased min-h-screen flex flex-col bg-[#F8FAFC]`}>
        <AuthProvider initialUser={user}>
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
