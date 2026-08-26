/**
 * Sending work out of the app.
 *
 * This product competes with WhatsApp, not with other task apps: a task nobody was
 * told about is the exact failure it exists to remove. So assigning work ends where
 * the team already is — in a WhatsApp message — and the app keeps the record.
 */

/** Israeli mobile numbers are typed 05X-XXXXXXX and dialled internationally as 9725X.
 * Anything already in international form is left alone. */
export function toWhatsAppNumber(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}

/**
 * A wa.me link. With a number it opens that person's chat; without one it opens the
 * contact picker — worth keeping, because a phone number is optional and a manager
 * with no numbers saved must still be able to send.
 */
export function whatsAppLink(phone: string | undefined, text: string): string {
  const number = toWhatsAppNumber(phone);
  return `https://wa.me/${number ?? ""}?text=${encodeURIComponent(text)}`;
}
