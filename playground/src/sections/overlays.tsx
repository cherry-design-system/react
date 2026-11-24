// Playground section: overlays. Owned by one agent; one <Section> per component.
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Box,
  Copy,
  Info,
  Layers,
  MoreHorizontal,
  Pencil,
  Search,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Field,
  IconButton,
  Input,
  Kbd,
  Menu,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  Modal,
  ModalBody,
  ModalFooter,
  Popover,
  SearchDialog,
  SearchGroup,
  SearchResult,
  Sheet,
  SheetBody,
  SheetFooter,
  Tooltip,
  type SheetSide,
} from "../../../src";
import { Section } from "../Section";

// The playground's `.pg-section h2` rule is unlayered, so it would beat the
// dialogs' own (layered) title styles; render them at the body instead.
function AtBody({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

function ModalDemo() {
  const [open, setOpen] = useState<null | "delete" | "plain" | "form">(null);
  const close = () => setOpen(null);
  return (
    <div className="pg-row">
      <Button variant="outline" onClick={() => setOpen("delete")}>
        Delete project
      </Button>
      <Button variant="outline" onClick={() => setOpen("plain")}>
        Without title
      </Button>
      <Button variant="outline" onClick={() => setOpen("form")}>
        Large with form
      </Button>

      <AtBody>
        <Modal
          open={open === "delete"}
          onClose={close}
          title="Delete project?"
          description="This permanently removes the project and its deployments. You can’t undo this action."
        >
          <ModalFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button variant="accent" onClick={close}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>

        <Modal open={open === "plain"} onClose={close}>
          <ModalBody>
            This is the modal content. It closes on Escape, on a click outside,
            or with the close button.
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Continue</Button>
          </ModalFooter>
        </Modal>

        <Modal
          open={open === "form"}
          onClose={close}
          size="lg"
          title="Invite teammates"
          description="They get an email with a link to join this workspace."
        >
          <ModalBody>
            <div className="pg-stack" style={{ maxWidth: "none" }}>
              <Field
                label="Email"
                hint="Separate several addresses with commas."
              >
                <Input placeholder="ada@example.com" />
              </Field>
              <Field label="Message">
                <Input placeholder="Optional note" />
              </Field>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Send invites</Button>
          </ModalFooter>
        </Modal>
      </AtBody>
    </div>
  );
}

function SheetDemo() {
  const [side, setSide] = useState<SheetSide | null>(null);
  const [last, setLast] = useState<SheetSide>("right");
  const close = () => setSide(null);
  const openSide = (s: SheetSide) => {
    setLast(s);
    setSide(s);
  };
  return (
    <div className="pg-row">
      <Button variant="outline" onClick={() => openSide("right")}>
        Right
      </Button>
      <Button variant="outline" onClick={() => openSide("left")}>
        Left
      </Button>
      <Button variant="outline" onClick={() => openSide("bottom")}>
        Bottom
      </Button>
      {/* One sheet whose side stays put while it slides out. */}
      <AtBody>
        <Sheet
          open={side !== null}
          onClose={close}
          side={last}
          title="Edit profile"
          description="Changes apply to every workspace."
        >
          <SheetBody>
            <div className="pg-stack" style={{ maxWidth: "none" }}>
              <Field label="Name">
                <Input defaultValue="Ada Lovelace" />
              </Field>
              <Field label="Email" hint="We’ll only use it for receipts.">
                <Input defaultValue="ada@example.com" />
              </Field>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Save changes</Button>
          </SheetFooter>
        </Sheet>
      </AtBody>
    </div>
  );
}

function PopoverDemo() {
  return (
    <div className="pg-row">
      <Button variant="outline" popoverTarget="pg-popover-share">
        Share (bottom start)
      </Button>
      <Popover
        id="pg-popover-share"
        align="start"
        title="Share preview"
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              popoverTarget="pg-popover-share"
              popoverTargetAction="hide"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              popoverTarget="pg-popover-share"
              popoverTargetAction="hide"
            >
              Copy link
            </Button>
          </>
        }
      >
        Anyone with the link can view this preview. Links expire after 7 days.
      </Popover>

      <Button variant="outline" popoverTarget="pg-popover-top">
        Top
      </Button>
      <Popover id="pg-popover-top" placement="top" title="Share preview">
        Anyone with the link can view this preview.
      </Popover>

      <Button variant="outline" popoverTarget="pg-popover-right">
        Right
      </Button>
      <Popover id="pg-popover-right" placement="right" title="Details">
        Opens to the right of its trigger.
      </Popover>

      <Button variant="outline" popoverTarget="pg-popover-left">
        Left (end)
      </Button>
      <Popover id="pg-popover-left" placement="left" align="end">
        No title, aligned to the end.
      </Popover>
    </div>
  );
}

function TooltipDemo() {
  return (
    <div className="pg-row" style={{ padding: "24px 0" }}>
      <Tooltip content="Copy to clipboard">
        <IconButton aria-label="Copy" variant="outline" icon={<Copy />} />
      </Tooltip>
      <Tooltip content="Notifications" placement="bottom">
        <IconButton aria-label="Bell" variant="outline" icon={<Bell />} />
      </Tooltip>
      <Tooltip content="Settings" placement="left">
        <IconButton
          aria-label="Settings"
          variant="outline"
          icon={<Settings />}
        />
      </Tooltip>
      <Tooltip content="More information" placement="right">
        <IconButton aria-label="Info" variant="outline" icon={<Info />} />
      </Tooltip>
      <Tooltip content="Saves a draft first">
        <Button variant="outline">Publish</Button>
      </Tooltip>
      <Tooltip content="Never shows" disabled>
        <Button variant="ghost">Disabled tooltip</Button>
      </Tooltip>
    </div>
  );
}

function MenuDemo() {
  const [last, setLast] = useState("nothing yet");
  return (
    <div className="pg-row">
      <Menu trigger={<Button variant="outline">Project actions</Button>}>
        <MenuGroup label="Project">
          <MenuItem
            icon={<Copy />}
            shortcut="⌘C"
            onClick={() => setLast("Copy link")}
          >
            Copy link
          </MenuItem>
          <MenuItem
            icon={<Layers />}
            shortcut="⌘D"
            onClick={() => setLast("Duplicate")}
          >
            Duplicate
          </MenuItem>
          <MenuItem
            icon={<Send />}
            shortcut="⇧⌘S"
            onClick={() => setLast("Share")}
          >
            Share
          </MenuItem>
          <MenuItem icon={<Pencil />} disabled>
            Rename
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem
          icon={<Trash2 />}
          shortcut="⌘⌫"
          variant="danger"
          onClick={() => setLast("Delete")}
        >
          Delete
        </MenuItem>
      </Menu>
      <Menu
        align="end"
        aria-label="More"
        trigger={
          <IconButton
            aria-label="More"
            variant="outline"
            icon={<MoreHorizontal />}
          />
        }
      >
        <MenuItem onClick={() => setLast("Edit")}>Edit</MenuItem>
        <MenuItem onClick={() => setLast("Archive")}>Archive</MenuItem>
        <MenuItem onClick={() => setLast("Report")}>Report</MenuItem>
      </Menu>
      <Menu
        placement="top"
        trigger={<Button variant="ghost">Opens upward</Button>}
      >
        <MenuItem>First</MenuItem>
        <MenuItem>Second</MenuItem>
      </Menu>
      <span style={{ color: "var(--cherry-fg-muted)", fontSize: 14 }}>
        Last chosen: {last}
      </span>
    </div>
  );
}

const COMPONENTS = [
  {
    group: "Form",
    name: "Button",
    text: "Primary, secondary, outline, ghost and accent actions.",
  },
  {
    group: "Form",
    name: "Input",
    text: "Text field with icons, suffix and error state.",
  },
  {
    group: "Form",
    name: "Select",
    text: "Native select styled to match the inputs.",
  },
  {
    group: "Form",
    name: "OTP Input",
    text: "One-time codes, one box per digit.",
  },
  {
    group: "Feedback",
    name: "Toast",
    text: "Stacked notifications with a filled status tile whose glyph draws in and pops.",
  },
  {
    group: "Feedback",
    name: "Modal",
    text: "Native dialog that fades and scales in over a fading backdrop.",
  },
  {
    group: "Feedback",
    name: "Callout",
    text: "Inline message for tips, warnings and errors.",
  },
  {
    group: "Overlays",
    name: "Popover",
    text: "Anchored panel on the native popover attribute.",
  },
  {
    group: "Overlays",
    name: "Tooltip",
    text: "Short hint on hover and keyboard focus.",
  },
  {
    group: "Overlays",
    name: "Menu",
    text: "Menu button with arrow keys and typeahead.",
  },
];

function SearchDemo() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(true);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [active, setActive] = useState(COMPONENTS[0]!.name);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const hits = COMPONENTS.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const groups = [...new Set(hits.map((c) => c.group))];
  const shown = COMPONENTS.find((c) => c.name === active) ?? hits[0];

  const choose = (name: string) => {
    setPicked(name);
    setOpen(false);
  };

  return (
    <div className="pg-row">
      <Button
        variant="outline"
        leadingIcon={<Search />}
        onClick={() => {
          setPreview(true);
          setOpen(true);
        }}
      >
        Search components <Kbd size="sm">⌘K</Kbd>
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setPreview(false);
          setOpen(true);
        }}
      >
        List only
      </Button>
      <span style={{ color: "var(--cherry-fg-muted)", fontSize: 14 }}>
        Picked: {picked ?? "none"}
      </span>
      <SearchDialog
        open={open}
        onClose={() => setOpen(false)}
        query={query}
        onQueryChange={setQuery}
        placeholder="Search components"
        status={`${hits.length} of ${COMPONENTS.length}`}
        preview={
          preview && hits.length > 0 && shown ? (
            <div className="pg-search-preview">
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  height: 140,
                  marginBottom: 12,
                  border: "1px solid var(--cherry-border-default)",
                  borderRadius: "var(--cherry-radius-xl)",
                  background: "var(--cherry-bg-subtle)",
                  color: "var(--cherry-fg-subtle)",
                }}
              >
                <Box />
              </div>
              <strong style={{ fontSize: 14 }}>{shown.name}</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "var(--cherry-fg-muted)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {shown.text}
              </p>
            </div>
          ) : undefined
        }
        empty={
          <>
            <Search aria-hidden="true" />
            <strong style={{ color: "var(--cherry-fg-default)" }}>
              No results for “{query}”
            </strong>
            <span>Try a component name like Button or Toast.</span>
          </>
        }
      >
        {groups.map((group) => (
          <SearchGroup key={group} label={group}>
            {hits
              .filter((c) => c.group === group)
              .map((c) => (
                <SearchResult
                  key={c.name}
                  onSelect={() => choose(c.name)}
                  onHighlight={() => setActive(c.name)}
                >
                  {c.name}
                </SearchResult>
              ))}
          </SearchGroup>
        ))}
      </SearchDialog>
    </div>
  );
}

function KbdDemo() {
  return (
    <div className="pg-row">
      <Kbd>esc</Kbd>
      <Kbd>⌘K</Kbd>
      <Kbd aria-label="Up arrow">
        <ArrowUp />
      </Kbd>
      <Kbd aria-label="Down arrow">
        <ArrowDown />
      </Kbd>
      <Kbd size="sm">esc</Kbd>
      <Kbd size="sm">⇧⌘P</Kbd>
      <span style={{ color: "var(--cherry-fg-muted)", fontSize: 14 }}>
        Press <Kbd size="sm">⌘</Kbd> <Kbd size="sm">K</Kbd> to search
      </span>
    </div>
  );
}

export function OverlaysSections() {
  return (
    <>
      <Section title="Modal">
        <ModalDemo />
      </Section>
      <Section title="Sheet">
        <SheetDemo />
      </Section>
      <Section title="Popover">
        <PopoverDemo />
      </Section>
      <Section title="Tooltip">
        <TooltipDemo />
      </Section>
      <Section title="Menu">
        <MenuDemo />
      </Section>
      <Section title="Search dialog">
        <SearchDemo />
      </Section>
      <Section title="Kbd">
        <KbdDemo />
      </Section>
    </>
  );
}
