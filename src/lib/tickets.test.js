import { describe, expect, it } from "vitest";
import { MAX_REPLY, buildQuery, buildReplyPayload, validateReply } from "./tickets.js";

describe("buildQuery", () => {
  it("keeps only filled filters and trims the search", () => {
    expect(
      buildQuery({ status: "active", priority: "", q: "  TSS-1 " }, { limit: 25, offset: 0 })
    ).toBe("status=active&q=TSS-1&limit=25&offset=0");
  });
});

describe("validateReply", () => {
  it("rejects empty and over-long text", () => {
    expect(validateReply("   ")).not.toBe("");
    expect(validateReply("x".repeat(MAX_REPLY + 1))).not.toBe("");
    expect(validateReply("hello")).toBe("");
  });
});

describe("buildReplyPayload", () => {
  it("sends a notes as internal with no status or pictures", () => {
    expect(
      buildReplyPayload({ message: " hi ", internal: true, status: "open", attachments: ["a"] })
    ).toEqual({
      message: "hi",
      internal: true,
    });
  });
  it("sends status and attachments for a reply", () => {
    expect(buildReplyPayload({ message: "hi", status: "resolved", attachments: ["a"] })).toEqual({
      message: "hi",
      status: "resolved",
      attachments: ["a"],
    });
  });
});
