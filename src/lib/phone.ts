export function normalizePhoneNumber(input: string) {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("92") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+92${digits.slice(1)}`;
  }

  if (digits.startsWith("3") && digits.length === 10) {
    return `+92${digits}`;
  }

  if (input.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }

  return `+${digits}`;
}
