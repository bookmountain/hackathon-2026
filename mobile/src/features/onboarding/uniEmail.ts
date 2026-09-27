// Only verified Adelaide University and Flinders student/staff emails can sign in
const UNI_EMAIL = /^[^@\s]+@(student\.)?(adelaide|flinders)\.edu\.au$/i;

export const UNI_EMAIL_ERROR = "Use your verified @adelaide.edu.au or @flinders.edu.au email.";

/** Koala_Kai, the demo account seeded on the hosted API */
export const DEMO_EMAIL = "a1900000@adelaide.edu.au";
export const DEMO_PASSWORD = "password123";

export const PASSWORD_MIN = 8;

export function isUniEmail(email: string): boolean {
  return UNI_EMAIL.test(email.trim());
}

/** The two sign-in domains, for the email screen's dropdown */
export const UNI_DOMAINS = [
  { domain: "adelaide.edu.au", uni: "Adelaide Uni" },
  { domain: "flinders.edu.au", uni: "Flinders" },
] as const;

export type UniDomain = (typeof UNI_DOMAINS)[number]["domain"];

/** The ID typed next to the dropdown plus the picked domain; a pasted full address is used as is */
export function joinUniEmail(id: string, domain: UniDomain): string {
  const name = id.trim().toLowerCase();
  return name.includes("@") ? name : `${name}@${domain}`;
}

/** Splits an address back into the ID and dropdown domain (the demo account button) */
export function splitUniEmail(email: string): { id: string; domain: UniDomain } {
  const [id, host = ""] = email.trim().toLowerCase().split("@");
  return { id, domain: /flinders/.test(host) ? "flinders.edu.au" : "adelaide.edu.au" };
}
