import { isUniEmail } from "../uniEmail";

describe("isUniEmail", () => {
  it.each([
    "a1234567@adelaide.edu.au",
    "a1234567@student.adelaide.edu.au",
    "chan0042@flinders.edu.au",
    "  Chan0042@Flinders.edu.au ",
  ])("accepts %s", (email) => {
    expect(isUniEmail(email)).toBe(true);
  });

  it.each([
    "koala@gmail.com",
    "a1234567@unisa.edu.au",
    "bob@evil-flinders.edu.au",
    "bob@flinders.edu.au.evil.com",
    "a1234567@staff.adelaide.edu.au",
    "@adelaide.edu.au",
    "",
  ])("rejects %s", (email) => {
    expect(isUniEmail(email)).toBe(false);
  });
});
