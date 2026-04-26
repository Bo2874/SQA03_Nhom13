import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken, accessExpiresIn, refreshToken, refreshExpiresIn } =
      body.data;

    cookies().set(ACCESS_TOKEN, accessToken, {
      secure: true,
      maxAge: accessExpiresIn / 1000,
      sameSite: "strict",
      path: "/",
    });

    cookies().set(REFRESH_TOKEN, refreshToken, {
      secure: true,
      maxAge: refreshExpiresIn / 1000,
      sameSite: "strict",
      path: "/",
    });

    return NextResponse.json({ message: "Cookies set successfully!" });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" });
  }
}

export async function DELETE() {
  try {
    cookies().delete(ACCESS_TOKEN);
    cookies().delete(REFRESH_TOKEN);

    return NextResponse.json({ message: "Cookies deleted successfully!" });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" });
  }
}
