import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { subscribeToNewsletter } from "@/modules/cms/service";

export async function POST(request: Request) {
  try {
    const subscriber = await subscribeToNewsletter(await request.json());
    return NextResponse.json({ id: subscriber.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    return NextResponse.json({ error: "Unable to subscribe." }, { status: 500 });
  }
}
