import { isUniEmail, joinUniEmail, splitUniEmail } from "../uniEmail";

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

describe("the ID + domain dropdown", () => {
  it("joins the ID to the picked domain", () => {
    expect(joinUniEmail(" A1234567 ", "adelaide.edu.au")).toBe("a1234567@adelaide.edu.au");
    expect(joinUniEmail("chan0042", "flinders.edu.au")).toBe("chan0042@flinders.edu.au");
  });

  it("keeps a pasted full address as is", () => {
    expect(joinUniEmail("a1234567@student.adelaide.edu.au", "flinders.edu.au")).toBe("a1234567@student.adelaide.edu.au");
  });

  it("splits an address back into ID and domain", () => {
    expect(splitUniEmail("a1900000@adelaide.edu.au")).toEqual({ id: "a1900000", domain: "adelaide.edu.au" });
    expect(splitUniEmail("mrea0012@flinders.edu.au")).toEqual({ id: "mrea0012", domain: "flinders.edu.au" });
  });
});
