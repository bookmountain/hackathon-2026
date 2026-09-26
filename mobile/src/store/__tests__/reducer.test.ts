import type { ChatThread } from "@/data/types";
import { EVENT, ME } from "@/test/fixtures";
import { reducer } from "../reducer";
import { initialState, type AppState } from "../state";

const chat: ChatThread = {
  id: "c1",
  person: { id: "tom", nick: "TomTheTutor", major: "Mathematics", uni: "Adelaide Uni", avatar: -1 },
  preview: "Hey!",
  unread: 0,
  lastAt: "2026-09-26T08:00:00Z",
};
const other: ChatThread = { ...chat, id: "c2" };

describe("session", () => {
  it("finishes booting with the restored session", () => {
    const state = reducer(initialState, { type: "booted", session: { token: "t", me: ME } });
    expect(state.session).toMatchObject({ booted: true, token: "t", me: ME });
  });

  it("forgets everything on sign-out", () => {
    let state = reducer(initialState, { type: "setSession", session: { token: "t", me: ME } });
    state = reducer(state, { type: "setEvents", events: [EVENT] });
    state = reducer(state, { type: "signOut" });
    expect(state.session).toEqual({ booted: true, token: null, me: null, email: "", devCode: null });
    expect(state.events).toEqual([]);
  });
});

describe("events", () => {
  const withEvent = reducer(initialState, { type: "setEvents", events: [EVENT] });

  it("replaces an event by id, or adds a new one first", () => {
    const joined = reducer(withEvent, { type: "putEvent", event: { ...EVENT, joined: true, going: 16 } });
    expect(joined.events).toEqual([{ ...EVENT, joined: true, going: 16 }]);
    const hosted = reducer(joined, { type: "putEvent", event: { ...EVENT, id: "e-new", host: true } });
    expect(hosted.events.map((e) => e.id)).toEqual(["e-new", "e1"]);
  });

  it("takes live headcounts and marks full events", () => {
    const state = reducer(withEvent, { type: "setGoing", eventId: "e1", going: 30 });
    expect(state.events[0]).toMatchObject({ going: 30, full: true });
    expect(reducer(withEvent, { type: "removeEvent", eventId: "e1" }).events).toEqual([]);
  });
});

describe("chats", () => {
  let state: AppState;
  beforeEach(() => {
    state = reducer(initialState, { type: "setChats", chats: [other, chat] });
    state = reducer(state, { type: "setMessages", chatId: "c1", messages: [{ id: "m1", from: "them", text: "Hey!" }] });
  });

  it("adds an incoming message, moves the chat to the top and counts it unread", () => {
    const next = reducer(state, {
      type: "addMessage",
      chatId: "c1",
      message: { id: "m2", from: "them", text: "Still keen?" },
      preview: "Still keen?",
      unread: true,
    });
    expect(next.messages.c1.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(next.chats.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(next.chats[0]).toMatchObject({ preview: "Still keen?", unread: 1 });
  });

  it("ignores a message it already has (send response + real-time echo)", () => {
    const again = reducer(state, {
      type: "addMessage",
      chatId: "c1",
      message: { id: "m1", from: "them", text: "Hey!" },
      preview: "Hey!",
      unread: true,
    });
    expect(again.messages.c1).toHaveLength(1);
    expect(again.chats.find((c) => c.id === "c1")?.unread).toBe(0);
  });

  it("clears typing when their message lands, and unread when read", () => {
    let next = reducer(state, { type: "setTyping", chatId: "c1" });
    expect(next.typingIn).toBe("c1");
    next = reducer(next, {
      type: "addMessage",
      chatId: "c1",
      message: { id: "m2", from: "them", text: "Yes" },
      preview: "Yes",
      unread: true,
    });
    expect(next.typingIn).toBeNull();
    expect(reducer(next, { type: "markRead", chatId: "c1" }).chats[0].unread).toBe(0);
  });
});
