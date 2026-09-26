import { REPLIES } from "@/data/seed";
import type { MeetupEvent } from "@/data/types";
import { reducer } from "../reducer";
import { initialState } from "../state";

const event: MeetupEvent = {
  id: "e-new",
  title: "Friday coffee & code",
  cat: "Social",
  day: "FRI",
  date: "2",
  time: "6:00 pm",
  when: "Fri 2 Oct · 6:00 pm",
  where: { name: "Barr Smith Library", latitude: -34.91888, longitude: 138.60448 },
  going: 0,
  cap: 20,
  desc: "",
};

describe("session", () => {
  it("keeps the profile after sign out so setup is skipped next time", () => {
    let state = reducer(initialState, { type: "updateProfile", profile: { nick: "CompassRookie", major: "Law" } });
    state = reducer(state, { type: "enterApp" });
    state = reducer(state, { type: "signOut" });
    expect(state.session.signedIn).toBe(false);
    expect(state.session.nick).toBe("CompassRookie");
  });
});

describe("meetups", () => {
  it("toggles joining an event", () => {
    const joined = reducer(initialState, { type: "toggleJoin", eventId: "e1" });
    expect(joined.joined.e1).toBe(true);
    expect(reducer(joined, { type: "toggleJoin", eventId: "e1" }).joined.e1).toBe(false);
  });

  it("puts a hosted event first and marks the host as going", () => {
    const state = reducer(initialState, { type: "addEvent", event });
    expect(state.events[0].id).toBe("e-new");
    expect(state.joined["e-new"]).toBe(true);
  });
});

describe("chat", () => {
  it("adds a context line only once per thread and clears unread", () => {
    let state = reducer(initialState, { type: "openChat", personId: "p7", topic: "flat", context: "About: Sunny room" });
    state = reducer(state, { type: "openChat", personId: "p7", topic: "flat", context: "About: Sunny room" });
    expect(state.chats.p7.filter((m) => m.from === "system")).toHaveLength(1);

    const read = reducer(initialState, { type: "openChat", personId: "p5", topic: "item" });
    expect(read.unread.p5).toBe(false);
  });

  it("appends the opening message from me", () => {
    const state = reducer(initialState, {
      type: "openChat",
      personId: "p7",
      topic: "flat",
      context: "About: Sunny room",
      firstMessage: "Is it still available?",
    });
    expect(state.chats.p7.at(-1)).toEqual({ from: "me", text: "Is it still available?" });
  });

  it("cycles through the topic's canned replies and stops typing", () => {
    let state = reducer(initialState, { type: "openChat", personId: "p7", topic: "flat", firstMessage: "Hi" });
    state = reducer(state, { type: "setTyping", personId: "p7" });
    state = reducer(state, { type: "receiveReply", personId: "p7" });
    state = reducer(state, { type: "receiveReply", personId: "p7" });
    const replies = state.chats.p7.filter((m) => m.from === "them").map((m) => m.text);
    expect(replies).toEqual([REPLIES.flat[0], REPLIES.flat[1]]);
    expect(state.typingWith).toBeNull();
  });

  it("continues after messages already in the thread (seeded chat with p5)", () => {
    const state = reducer(initialState, { type: "receiveReply", personId: "p5" });
    // p5 already sent one message, so the next canned reply is the second one
    expect(state.chats.p5.at(-1)?.text).toBe(REPLIES.item[1]);
  });
});
