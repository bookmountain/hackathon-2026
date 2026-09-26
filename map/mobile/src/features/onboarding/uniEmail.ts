// Only verified Adelaide University and Flinders student/staff emails can sign in
const UNI_EMAIL = /^[^@\s]+@(student\.)?(adelaide|flinders)\.edu\.au$/i;

export const UNI_EMAIL_ERROR = "Use your verified @adelaide.edu.au or @flinders.edu.au email.";

export const DEMO_EMAIL = "a1234567@student.adelaide.edu.au";
export const DEMO_CODE = "482913";

export function isUniEmail(email: string): boolean {
  return UNI_EMAIL.test(email.trim());
}
