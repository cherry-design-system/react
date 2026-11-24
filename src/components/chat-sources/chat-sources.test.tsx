import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatSource, ChatSources } from "./index";

describe("ChatSources", () => {
  it("is a named ordered list of links", () => {
    render(
      <ChatSources>
        <ChatSource href="/start">Getting Started</ChatSource>
        <ChatSource href="/theming">Theming</ChatSource>
      </ChatSources>,
    );
    const list = screen.getByRole("list", { name: "Sources" });
    expect(list.tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Theming" })).toHaveClass(
      "cherry-chat-source",
    );
  });
});
