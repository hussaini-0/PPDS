"use server";

import { revalidatePath } from "next/cache";

import { parseContactCsv } from "@/modules/customers/contact-import";
import { importPotentialCustomers } from "@/modules/customers/service";
import { requirePermission } from "@/modules/auth/session";

export type ContactImportState = {
  status: "idle" | "success" | "error";
  message?: string;
  createdCustomers?: number;
  updatedCustomers?: number;
  createdLeads?: number;
  rejectedRows?: Array<{ row: number; message: string }>;
};

export async function importContactsAction(
  _state: ContactImportState,
  formData: FormData,
): Promise<ContactImportState> {
  const session = await requirePermission("MANAGE_CUSTOMERS");
  const file = formData.get("contacts");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a CSV file to import." };
  }
  if (file.size > 1_000_000) {
    return { status: "error", message: "The CSV must be 1 MB or smaller." };
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { status: "error", message: "Only CSV files are accepted." };
  }

  try {
    const parsed = parseContactCsv(await file.text());
    if (parsed.records.length === 0) {
      return {
        status: "error",
        message: "No valid contacts were found.",
        rejectedRows: parsed.errors.slice(0, 20),
      };
    }

    const result = await importPotentialCustomers({
      businessId: session.user.businessId,
      actorId: session.user.id,
      records: parsed.records,
    });
    revalidatePath("/dashboard/contacts");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `${parsed.records.length} valid contact${parsed.records.length === 1 ? "" : "s"} processed.`,
      ...result,
      rejectedRows: parsed.errors.slice(0, 20),
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "The contact import failed.",
    };
  }
}
