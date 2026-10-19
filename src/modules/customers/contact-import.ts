import { z } from "zod";

import { normalizePhoneNumber } from "@/lib/phone";

const MAX_CONTACT_ROWS = 500;
const emailSchema = z.string().email();
const trueValues = new Set(["1", "true", "yes", "y", "opted in", "opted-in"]);
const falseValues = new Set(["0", "false", "no", "n", "", "not opted in", "opted out"]);

export type ContactImportRecord = {
  row: number;
  fullName: string;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  email?: string;
  city?: string;
  notes?: string;
  tags: string[];
  marketingOptIn?: boolean;
};

export type ContactImportError = { row: number; message: string };

const headerAliases = {
  fullName: ["name", "fullname", "customername", "contactname"],
  phoneNumber: ["phone", "phonenumber", "mobile", "whatsapp", "whatsappnumber"],
  email: ["email", "emailaddress"],
  city: ["city", "location"],
  notes: ["notes", "note"],
  tags: ["tags", "tag"],
  marketingOptIn: ["marketingoptin", "marketingconsent", "consent", "optin"],
} as const;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvRows(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];

    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function findHeaderIndex(headers: string[], aliases: readonly string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

export function parseContactCsv(input: string): {
  records: ContactImportRecord[];
  errors: ContactImportError[];
} {
  const rows = parseCsvRows(input.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("The CSV must contain a header and at least one contact.");
  if (rows.length - 1 > MAX_CONTACT_ROWS) throw new Error(`A single import is limited to ${MAX_CONTACT_ROWS} contacts.`);

  const headers = rows[0].map(normalizeHeader);
  const indexes = {
    fullName: findHeaderIndex(headers, headerAliases.fullName),
    phoneNumber: findHeaderIndex(headers, headerAliases.phoneNumber),
    email: findHeaderIndex(headers, headerAliases.email),
    city: findHeaderIndex(headers, headerAliases.city),
    notes: findHeaderIndex(headers, headerAliases.notes),
    tags: findHeaderIndex(headers, headerAliases.tags),
    marketingOptIn: findHeaderIndex(headers, headerAliases.marketingOptIn),
  };

  if (indexes.fullName < 0 || indexes.phoneNumber < 0) {
    throw new Error("The CSV requires name and phone columns.");
  }

  const records: ContactImportRecord[] = [];
  const errors: ContactImportError[] = [];
  const seenPhones = new Set<string>();
  const read = (row: string[], index: number) => (index >= 0 ? row[index]?.trim() ?? "" : "");

  rows.slice(1).forEach((row, offset) => {
    const rowNumber = offset + 2;
    const fullName = read(row, indexes.fullName);
    const phoneNumber = read(row, indexes.phoneNumber);
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const email = read(row, indexes.email);
    const consentValue = read(row, indexes.marketingOptIn).toLowerCase();

    if (!fullName) {
      errors.push({ row: rowNumber, message: "Name is required." });
      return;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhoneNumber)) {
      errors.push({ row: rowNumber, message: "Phone must be a valid international number." });
      return;
    }
    if (seenPhones.has(normalizedPhoneNumber)) {
      errors.push({ row: rowNumber, message: "Duplicate phone number in this file." });
      return;
    }
    if (email && !emailSchema.safeParse(email).success) {
      errors.push({ row: rowNumber, message: "Email address is invalid." });
      return;
    }
    if (indexes.marketingOptIn >= 0 && !trueValues.has(consentValue) && !falseValues.has(consentValue)) {
      errors.push({ row: rowNumber, message: "Marketing consent must be yes or no." });
      return;
    }

    seenPhones.add(normalizedPhoneNumber);
    records.push({
      row: rowNumber,
      fullName,
      phoneNumber,
      normalizedPhoneNumber,
      email: email || undefined,
      city: read(row, indexes.city) || undefined,
      notes: read(row, indexes.notes) || undefined,
      tags: read(row, indexes.tags).split(/[|;]/).map((tag) => tag.trim()).filter(Boolean),
      marketingOptIn: indexes.marketingOptIn >= 0 ? trueValues.has(consentValue) : undefined,
    });
  });

  return { records, errors };
}
