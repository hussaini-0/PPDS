import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createProjectInquiry } from "@/modules/cms/service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const inquiry = await createProjectInquiry(formData);
    return NextResponse.json({ id: inquiry.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create enquiry." }, { status: 500 });
  }
}
