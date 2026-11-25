import { Bell, Mail, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { CherryLogo } from "./CherryLogo";
import { GitHubMark } from "./GitHubMark";
import {
  Badge,
  Button,
  createBrand,
  Field,
  IconButton,
  Input,
  Spinner,
  ThemeToggle,
  Toaster,
  ToastProvider,
  Toggle,
  useToast,
} from "../../src";

const acme = createBrand("acme", { accent: "#5b5bd6" });
const brandStyle = document.createElement("style");
brandStyle.textContent = acme.css;
document.head.appendChild(brandStyle);
applyPreviewAccent();

import { Section } from "./Section";
import { applyPreviewAccent, previewName, previewQuery } from "./preview";
import { OverlaysSections } from "./sections/overlays";
import { FormsSections } from "./sections/forms";
import { PickersSections } from "./sections/pickers";
import { NavigationSections } from "./sections/navigation";
import { MediaSections } from "./sections/media";

function Buttons() {
  return (
    <div className="pg-row">
      <Button>Get started</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Learn more</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="accent" leadingIcon={<Plus />}>
        New project
      </Button>
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
      <IconButton aria-label="Search" icon={<Search />} />
      <IconButton
        aria-label="Notifications"
        variant="outline"
        icon={<Bell />}
      />
      <IconButton aria-label="Delete" variant="solid" icon={<Trash2 />} />
    </div>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="pg-row">
      <Button
        variant="outline"
        onClick={() =>
          toast.show("Changes saved", { color: "success", autoHide: 4000 })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.show("Payment failed", {
            color: "error",
            description: "Your card was declined.",
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.show("Storage almost full", {
            color: "warning",
            autoHide: 5000,
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.show("New version available", {
            color: "info",
            action: { label: "Reload", onClick: () => undefined },
          })
        }
      >
        Info + action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.show("Copied to clipboard", {
            color: "default",
            autoHide: 3000,
          })
        }
      >
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          void toast
            .promise(new Promise((resolve) => setTimeout(resolve, 1800)), {
              loading: "Deploying",
              success: "Deployed",
              error: "Deploy failed",
            })
            .catch(() => undefined)
        }
      >
        Promise
      </Button>
    </div>
  );
}

// Shared by the "Badges and spinners" row and the stand-alone /preview/spinner.
const spinners = (
  <>
    <Spinner size="xs" />
    <Spinner size="md" />
    <Spinner size="lg" />
  </>
);

function Showcase() {
  const [email, setEmail] = useState("");
  return (
    <>
      <Section title="Buttons">
        <Buttons />
      </Section>
      <Section title="Badges and spinners" id="badges">
        <div className="pg-row">
          <Badge>Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success" dot>
            Live
          </Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Failed</Badge>
          <Badge variant="info">Beta</Badge>
          {/* The badges preview shows badges only; spinners have their own. */}
          {previewName === null ? spinners : null}
        </div>
      </Section>
      <Section title="Spinner" id="spinner" previewOnly>
        <div className="pg-row">{spinners}</div>
      </Section>
      <Section title="Fields">
        <div className="pg-stack">
          <Field label="Email" hint="We never share it.">
            <Input
              type="email"
              placeholder="you@example.com"
              leadingIcon={<Mail />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field
            label="Username"
            error={
              email.includes("@") ? undefined : "Enter a valid email above"
            }
            required
          >
            <Input placeholder="ada" />
          </Field>
          <Toggle label="Email notifications" defaultChecked />
          <Toggle label="Weekly digest" />
        </div>
      </Section>
      <Section title="Toast">
        <ToastDemo />
      </Section>
    </>
  );
}

function AllSections() {
  return (
    <>
      <Showcase />
      <FormsSections />
      <PickersSections />
      <NavigationSections />
      <OverlaysSections />
      <MediaSections />
    </>
  );
}

// /preview and /preview/<id>: see preview.ts.
function PreviewApp() {
  if (previewName === "") {
    return (
      <main className="pg pg-preview-index">
        <h1>cherry previews</h1>
        <p>
          One component per page, for embeds and screenshots. Add{" "}
          <code>?theme=dark</code> or <code>?theme=light</code> to pin the mode,
          and <code>?accent=%23be123c</code> for a brand color.
        </p>
        <ul>
          <AllSections />
        </ul>
      </main>
    );
  }
  return (
    <main className="pg-preview">
      <AllSections />
      <p className="pg-preview-missing">
        No preview named <code>{previewName}</code>.{" "}
        <a href={`/preview${previewQuery}`}>See all previews</a>
      </p>
    </main>
  );
}

export function App() {
  return (
    <ToastProvider>
      {previewName !== null ? (
        <PreviewApp />
      ) : (
        <>
          <main className="pg">
            <header className="pg-header">
              <h1 className="pg-title">
                <CherryLogo title="cherry" size={28} />
                <span>playground</span>
              </h1>
              <ThemeToggle />
            </header>
            <AllSections />
            <div data-cherry-mode="dark" className="pg-section">
              <h2>Dark scope inside the page</h2>
              <Buttons />
            </div>
            <div {...acme.attributes} className="pg-section">
              <h2>Brand scope (acme)</h2>
              <Buttons />
            </div>
          </main>
          <footer className="pg-footer">
            <a
              className="pg-footer__github"
              href="https://github.com/cherry-design-system/react"
              aria-label="cherry on GitHub"
            >
              <GitHubMark />
            </a>
          </footer>
        </>
      )}
      <Toaster />
    </ToastProvider>
  );
}
