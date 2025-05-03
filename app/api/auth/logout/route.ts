import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  // Clear the session cookie
  cookies().set({
    name: "session",
    value: "",
    maxAge: 0,
    path: "/",
  })

  return NextResponse.json({ success: true }, { status: 200 })
}
