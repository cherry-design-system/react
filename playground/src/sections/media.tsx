// Playground section: media, surfaces, AI chat kit and layout.
import {
  Copy,
  FileText,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  AvatarDropzone,
  AvatarGroup,
  Card,
  CardDescription,
  CardIcon,
  CardTitle,
  ChatInput,
  ChatLauncher,
  ChatMessage,
  ChatMessageList,
  ChatPanel,
  ChatSource,
  ChatSources,
  ChatSuggestion,
  ChatSuggestions,
  ChatTyping,
  CodeBlock,
  Col,
  Container,
  Dropzone,
  FileItem,
  Flex,
  Grid,
  IconButton,
  InlineCode,
  Link,
  Prose,
  Separator,
  Stack,
  StatCard,
  Table,
  type FileItemStatus,
} from "../../../src";
import { Section } from "../Section";

/** A gradient "photo" as a data URI, so no external image host is needed. */
const photo = (from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fff" fill-opacity=".85"/><path d="M12 60c3-12 11-18 20-18s17 6 20 18z" fill="#fff" fill-opacity=".85"/></svg>`,
  )}`;
const photoA = photo("#ef2f54", "#8b5cf6");
const photoB = photo("#3b82f6", "#10b981");

function Avatars() {
  return (
    <Stack gap={5}>
      <Flex gap={4} align="center">
        <Avatar name="Ada Lovelace" size="sm" />
        <Avatar name="Ada Lovelace" size="md" />
        <Avatar name="Ada Lovelace" size="lg" />
        <Avatar name="Ada Lovelace" size="xl" />
        <Avatar size="lg" alt="Guest" />
        <Avatar size="lg" src={photoA} name="Grace Hopper" status="online" />
        <Avatar size="lg" src={photoB} name="Alan Turing" status="away" />
        <Avatar size="lg" name="Linus Example" color="accent" status="busy" />
        <Avatar size="lg" name="cherry AI" color="ai" status="offline" />
        <Avatar size="lg" src="/missing.png" name="Broken Image" />
      </Flex>
      <Flex gap={8} align="center">
        {(["sm", "md", "lg"] as const).map((size) => (
          <AvatarGroup key={size} size={size} max={3} aria-label="Team">
            <Avatar src={photoA} name="Grace Hopper" />
            <Avatar name="Ada Lovelace" />
            <Avatar src={photoB} name="Alan Turing" />
            <Avatar name="Gordon Hill" />
            <Avatar name="Katherine Lee" />
            <Avatar name="Mary Major" />
          </AvatarGroup>
        ))}
      </Flex>
    </Stack>
  );
}

interface Upload {
  id: number;
  name: string;
  bytes: number;
  status: FileItemStatus;
  progress: number;
  error?: string;
}

function Uploads() {
  const [files, setFiles] = useState<Upload[]>([
    {
      id: 1,
      name: "brand-guidelines.pdf",
      bytes: 2_400_000,
      status: "uploading",
      progress: 64,
    },
    {
      id: 2,
      name: "brand-guidelines.pdf",
      bytes: 2_400_000,
      status: "complete",
      progress: 100,
    },
    {
      id: 3,
      name: "brand-guidelines.pdf",
      bytes: 12_400_000,
      status: "error",
      progress: 0,
      error: "File is over 10 MB",
    },
  ]);
  const nextId = useRef(4);

  // Fake upload: every uploading file advances until it completes.
  useEffect(() => {
    const timer = setInterval(() => {
      setFiles((all) =>
        all.map((f) =>
          f.status !== "uploading" || f.id === 1
            ? f
            : f.progress >= 100
              ? { ...f, status: "complete" }
              : { ...f, progress: Math.min(100, f.progress + 18) },
        ),
      );
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const add = (picked: File[]) =>
    setFiles((all) => [
      ...all,
      ...picked.map((file) => ({
        id: nextId.current++,
        name: file.name,
        bytes: file.size,
        status: "uploading" as const,
        progress: 0,
      })),
    ]);

  return (
    <Grid cols={{ xs: 1, md: 2 }} gap={6}>
      <Stack gap={3}>
        <Dropzone
          id="demo-dropzone"
          multiple
          accept="image/*,.pdf"
          maxBytes={10_000_000}
          hint="PNG, JPG, WebP, GIF or PDF · up to 10 MB"
          onFilesAdded={add}
          onFilesRejected={(r) =>
            setFiles((all) => [
              ...all,
              ...r.map((x) => ({
                id: nextId.current++,
                name: x.file.name,
                bytes: x.file.size,
                status: "error" as const,
                progress: 0,
                error:
                  x.reason === "size"
                    ? "File is over 10 MB"
                    : "This file type is not accepted",
              })),
            ])
          }
        />
        <Dropzone
          inline
          hint="PNG, JPG, WebP or GIF · up to 5 MB"
          accept="image/*"
        />
        <Dropzone inline disabled hint="Uploads are paused" />
      </Stack>
      <Stack gap={3}>
        {files.map((f) => (
          <FileItem
            key={f.id}
            name={f.name}
            bytes={f.bytes}
            status={f.status}
            progress={f.progress}
            error={f.error}
            onRemove={() => setFiles((all) => all.filter((x) => x.id !== f.id))}
          />
        ))}
        <Flex gap={6} align="center">
          <AvatarDropzone size="sm" />
          <AvatarDropzone size="md" defaultSrc={photoA} />
          <AvatarDropzone size="lg" />
        </Flex>
      </Stack>
    </Grid>
  );
}

const releases = [
  {
    name: "Button",
    status: "Stable",
    version: "2.0.0",
    downloads: 12_840,
    updated: "2 days ago",
  },
  {
    name: "Combobox",
    status: "Beta",
    version: "2.0.0-beta.3",
    downloads: 1_204,
    updated: "5 hours ago",
  },
  {
    name: "Sheet",
    status: "New",
    version: "2.0.0",
    downloads: 312,
    updated: "Just now",
  },
  {
    name: "Prose",
    status: "Deprecated",
    version: "1.4.2",
    downloads: 98,
    updated: "3 months ago",
  },
];

const sample = `import { Button } from "@cherry-design-system/react";

export function Save() {
  // a class still wins over cherry
  return <Button variant="primary" className="w-full">Save</Button>;
}
`;

function Surfaces() {
  return (
    <Stack gap={6}>
      <Grid cols={{ xs: 1, md: 3 }} gap={4}>
        <Card>
          <CardIcon>
            <Layers />
          </CardIcon>
          <CardTitle>Token-driven theming</CardTitle>
          <CardDescription>
            Swap brands and flip light or dark from a single set of variables.
          </CardDescription>
        </Card>
        <Card variant="elevated" interactive tabIndex={0}>
          <CardTitle>Elevated, interactive</CardTitle>
          <CardDescription>
            Lifts on hover. Focus it with Tab to see the ring.
          </CardDescription>
        </Card>
        <Card variant="filled" padding="lg">
          <CardTitle>Filled, large padding</CardTitle>
          <CardDescription>
            A quiet surface for grouped content.
          </CardDescription>
        </Card>
      </Grid>
      <Grid cols={{ xs: 1, md: 3 }} gap={4}>
        <StatCard
          label="Monthly active users"
          value="12,480"
          delta="+12.4%"
          trend="up"
          deltaLabel="vs last month"
          data={[4, 6, 5, 7, 6, 8, 7, 9, 8, 11, 10, 12]}
        />
        <StatCard
          label="Conversion rate"
          value="3.2%"
          delta="-0.8%"
          trend="down"
          deltaLabel="vs last month"
          data={[12, 11, 12, 9, 10, 8, 7, 8, 6, 5, 4, 3]}
        />
        <StatCard
          label="Infra cost"
          value="$1,920"
          delta="+4.1%"
          trend="up"
          inverse
          deltaLabel="up is bad here"
          data={[5, 5, 6, 5, 6, 7, 7, 8]}
        />
      </Grid>
    </Stack>
  );
}

function TableDemo({ striped }: { striped?: boolean }) {
  return (
    <Table
      striped={striped}
      scrollLabel={
        striped ? "Component releases, striped" : "Component releases"
      }
    >
      <thead>
        <tr>
          <th>Component</th>
          <th>Status</th>
          <th>Version</th>
          <th data-numeric>Downloads</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {releases.map((r) => (
          <tr key={r.name}>
            <th scope="row">{r.name}</th>
            <td>{r.status}</td>
            <td>
              <InlineCode>{r.version}</InlineCode>
            </td>
            <td data-numeric>{r.downloads.toLocaleString("en-US")}</td>
            <td>{r.updated}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function Typography() {
  return (
    <Grid cols={{ xs: 1, lg: 2 }} gap={8}>
      <Prose>
        <h2>Rendered markdown</h2>
        <p>
          Prose styles <a href="#links">links</a>, lists, tables and{" "}
          <code>inline code</code> with cherry typography. Use it for docs and
          for assistant answers.
        </p>
        <ul>
          <li>Token-driven light and dark modes</li>
          <li>Responsive primitives per breakpoint</li>
          <li>Server-rendered, tree-shaken icons</li>
        </ul>
        <ol>
          <li>Install the package</li>
          <li>Import the stylesheet once</li>
        </ol>
        <blockquote>Static CSS, zero runtime.</blockquote>
        <pre>pnpm add @cherry-design-system/react</pre>
      </Prose>
      <Stack gap={5}>
        <Flex gap={6} align="center">
          <Link href="#docs">Read the docs</Link>
          <Link href="#docs" variant="muted">
            Read the docs
          </Link>
          <Link href="https://example.com" external>
            Example site
          </Link>
        </Flex>
        <p style={{ margin: 0, color: "var(--cherry-fg-muted)" }}>
          Call <InlineCode>useColorMode()</InlineCode> to read the active mode.
        </p>
        <Separator />
        <Flex
          gap={3}
          align="center"
          wrap="nowrap"
          style={{ color: "var(--cherry-fg-muted)", fontSize: 14 }}
        >
          <span>Docs</span>
          <Separator orientation="vertical" style={{ height: 16 }} />
          <span>Components</span>
          <Separator orientation="vertical" style={{ height: 16 }} />
          <span>Tokens</span>
        </Flex>
        <Separator label="or" />
        <CodeBlock
          code={sample}
          filename="save-button.tsx"
          language="tsx"
          highlightLines={[5]}
        />
      </Stack>
    </Grid>
  );
}

interface Turn {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

const assistantAvatar = (
  <Avatar size="sm" color="ai" alt="cherry Assistant" icon={<Sparkles />} />
);
const replyActions = (
  <>
    <IconButton size="sm" aria-label="Copy answer" icon={<Copy />} />
    <IconButton size="sm" aria-label="Regenerate" icon={<RotateCcw />} />
  </>
);

function ChatDemo({ variant = "inline" }: { variant?: "inline" | "drawer" }) {
  const [turns, setTurns] = useState<Turn[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hi! Ask me anything about cherry components, theming or tokens.",
    },
    { id: 2, role: "user", text: "How does theming work in cherry?" },
    {
      id: 3,
      role: "assistant",
      text: "Pass a light and a dark theme to the provider. Every color becomes a CSS variable, so switching modes never re-renders a component.",
      sources: ["Getting Started", "Theming"],
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const [open, setOpen] = useState(false);
  const id = useRef(4);

  const send = (text: string) => {
    setTurns((t) => [...t, { id: id.current++, role: "user", text }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setTurns((t) => [
        ...t,
        {
          id: id.current++,
          role: "assistant",
          text: "modes() runs an interpolation for both modes; modeValue(light, dark) is the plain-CSS form.",
          sources: ["Modes", "Tokens", "Brand theming"],
        },
      ]);
    }, 1600);
  };

  const panel = (
    <ChatPanel
      variant={variant}
      open={variant === "inline" ? undefined : open}
      onOpenChange={setOpen}
      title="cherry Assistant"
      actions={
        <IconButton size="sm" aria-label="Reset chat" icon={<RotateCcw />} />
      }
    >
      <ChatMessageList streaming={thinking}>
        {turns.map((t) => (
          <ChatMessage
            key={t.id}
            role={t.role}
            avatar={t.role === "assistant" ? assistantAvatar : undefined}
            actions={
              t.role === "assistant" && t.id > 1 ? replyActions : undefined
            }
          >
            {t.text}
            {t.sources ? (
              <ChatSources style={{ marginTop: 12 }}>
                {t.sources.map((s) => (
                  <ChatSource
                    key={s}
                    href={`#${s.toLowerCase().replace(/ /g, "-")}`}
                  >
                    {s}
                  </ChatSource>
                ))}
              </ChatSources>
            ) : null}
          </ChatMessage>
        ))}
        <ChatTyping active={thinking} />
        {!thinking && turns.length < 5 ? (
          <ChatSuggestions>
            <ChatSuggestion
              onClick={() => send("Explain modes() vs modeValue()")}
            >
              Explain modes() vs modeValue()
            </ChatSuggestion>
            <ChatSuggestion onClick={() => send("How do I add a brand?")}>
              How do I add a brand?
            </ChatSuggestion>
          </ChatSuggestions>
        ) : null}
      </ChatMessageList>
      <ChatInput
        glow
        loading={thinking}
        onSend={send}
        placeholder="Ask anything about cherry…"
        footnote="AI can make mistakes. Check important info."
        actions={
          <>
            <IconButton size="sm" aria-label="Add" icon={<Plus />} />
            <IconButton
              size="sm"
              aria-label="Attach a document"
              icon={<FileText />}
            />
          </>
        }
      />
    </ChatPanel>
  );

  if (variant === "inline")
    return <div style={{ height: 640, maxWidth: 440 }}>{panel}</div>;
  return (
    <>
      <Flex gap={3} align="center">
        <ChatLauncher
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          id="demo-launcher"
        />
        <ChatLauncher
          glow
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        />
      </Flex>
      {panel}
    </>
  );
}

function ChatParts() {
  return (
    <Stack gap={5} style={{ maxWidth: 520 }}>
      <ChatMessage role="user">How does theming work in cherry?</ChatMessage>
      <ChatMessage avatar={assistantAvatar} streaming>
        Pass a light and a dark theme to the provider
      </ChatMessage>
      <ChatTyping />
      <ChatSources>
        <ChatSource href="#getting-started">Getting Started</ChatSource>
        <ChatSource href="#theming">Theming</ChatSource>
      </ChatSources>
      <ChatInput placeholder="Ask anything about cherry…" />
      <ChatInput glow defaultValue="Explain modes() vs modeValue()" />
    </Stack>
  );
}

const cell = {
  padding: "12px 16px",
  borderRadius: "var(--cherry-radius-md)",
  background: "var(--cherry-bg-muted)",
  font: "500 13px/1.4 var(--cherry-font-sans)",
} as const;

function Layout() {
  return (
    <Stack gap={6}>
      <Container
        padding={{ xs: 4, lg: 8 }}
        style={{ outline: "1px dashed var(--cherry-border-strong)" }}
      >
        <Grid cols={{ xs: 1, sm: 2, lg: 4 }} gap={{ xs: 3, lg: 5 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={cell}>
              Cell {i + 1}
            </div>
          ))}
          <Col span={{ xs: "full", lg: 2 }} style={cell}>
            Col span full, 2 from lg
          </Col>
          <Col span={{ xs: "full", sm: 1, lg: 2 }} style={cell}>
            Col span full, 1 from sm, 2 from lg
          </Col>
        </Grid>
      </Container>
      <Flex
        direction={{ xs: "column", md: "row" }}
        justify="space-between"
        align="center"
        gap={3}
      >
        <div style={cell}>Column below md</div>
        <div style={cell}>Row from md</div>
        <div style={cell}>Space between</div>
      </Flex>
    </Stack>
  );
}

export function MediaSections() {
  return (
    <>
      <Section title="Avatar and AvatarGroup">
        <Avatars />
      </Section>
      <Section title="Dropzone, FileItem and AvatarDropzone">
        <Uploads />
      </Section>
      <Section title="Card and StatCard">
        <Surfaces />
      </Section>
      <Section title="Table">
        <Stack gap={4}>
          <TableDemo />
          <TableDemo striped />
        </Stack>
      </Section>
      <Section title="Prose, Link, InlineCode, Separator, CodeBlock">
        <Typography />
      </Section>
      <Section title="Chat panel (inline)" id="chat-inline">
        <ChatDemo />
      </Section>
      <Section title="Chat panel (drawer)" id="chat-drawer">
        <ChatDemo variant="drawer" />
      </Section>
      <Section title="Chat parts">
        <ChatParts />
      </Section>
      <Section title="Layout: Container, Grid, Col, Flex">
        <Layout />
      </Section>
    </>
  );
}
