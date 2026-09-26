import { ME } from "@/test/fixtures";
import { selectHasUnread, selectMe, selectSignedIn, uniOfEmail } from "../selectors";
import { initialState, type AppState } from "../state";

const signedIn: AppState = { ...initialState, session: { ...initialState.session, booted: true, token: "t", me: ME } };

describe("uniOfEmail", () => {
  it("detects Flinders and defaults to Adelaide", () => {
    expect(uniOfEmail("chan0042@flinders.edu.au")).toBe("Flinders Uni");
    expect(uniOfEmail("a1234567@student.adelaide.edu.au")).toBe("Adelaide Uni");
  });
});

describe("selectSignedIn", () => {
  it("needs a token, consent and a profile", () => {
    expect(selectSignedIn(signedIn)).toBe(true);
    expect(selectSignedIn(initialState)).toBe(false);
    const noConsent = { ...signedIn, session: { ...signedIn.session, me: { ...ME, consentComplete: false } } };
    expect(selectSignedIn(noConsent)).toBe(false);
    const noProfile = { ...signedIn, session: { ...signedIn.session, me: { ...ME, profile: null } } };
    expect(selectSignedIn(noProfile)).toBe(false);
  });
});

describe("selectMe", () => {
  it("shapes the account like other people", () => {
    expect(selectMe(signedIn)).toEqual({
      id: ME.userId,
      nick: "Koala_Kai",
      major: "Computer Science",
      uni: "Adelaide Uni",
      avatar: 3,
      avatarUrl: ME.profile?.avatarUrl,
    });
  });

  it("falls back before the profile exists", () => {
    const state = { ...initialState, session: { ...initialState.session, email: "chan0042@flinders.edu.au" } };
    expect(selectMe(state)).toMatchObject({ nick: "You", major: "", uni: "Flinders Uni", avatar: -1 });
  });
});

describe("selectHasUnread", () => {
  it("is true when any chat has unread messages", () => {
    const person = { id: "p", nick: "p", major: "", uni: "Adelaide Uni" as const, avatar: -1 };
    const chat = { id: "c1", person, preview: "", unread: 0, lastAt: "" };
    expect(selectHasUnread({ ...initialState, chats: [chat] })).toBe(false);
    expect(selectHasUnread({ ...initialState, chats: [chat, { ...chat, id: "c2", unread: 2 }] })).toBe(true);
  });
});
