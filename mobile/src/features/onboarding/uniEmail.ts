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
