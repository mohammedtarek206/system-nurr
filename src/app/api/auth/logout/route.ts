import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: "تم تسجيل الخروج بنجاح" });
  response.cookies.delete('token');
  return response;
}
