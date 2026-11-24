// Playground section: navigation. Owned by one agent; one <Section> per component.
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Home,
  LayoutGrid,
  Megaphone,
  Palette,
  PanelLeft,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import {
  Accordion,
  AccordionItem,
  Banner,
  Breadcrumb,
  Button,
  Callout,
  EmptyState,
  IconButton,
  NavItem,
  NavPill,
  Pagination,
  Progress,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Skeleton,
  Stepper,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "../../../src";
import { Section } from "../Section";

const stack = { display: "grid", gap: 24 } as const;

function NavPillDemo() {
  const items = ["Home", "Components", "Theming", "Sponsors", "Docs"];
  const [active, setActive] = useState("Home");
  return (
    <NavPill aria-label="Site">
      {items.map((label) => (
        <NavItem
          key={label}
          href="#"
          active={active === label}
          onClick={(event) => {
            event.preventDefault();
            setActive(label);
          }}
        >
          {label}
        </NavItem>
      ))}
    </NavPill>
  );
}

function SidebarDemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("Home");
  const item = (label: string, icon: ReactElement, badge?: string) => (
    <SidebarItem
      href="#"
      icon={icon}
      badge={badge}
      active={active === label}
      title={collapsed ? label : undefined}
      onClick={(event) => {
        event.preventDefault();
        setActive(label);
      }}
    >
      {label}
    </SidebarItem>
  );
  const groups = (
    <>
      <SidebarGroup label="Workspace">
        {item("Home", <Home />)}
        {item("Components", <LayoutGrid />, "12")}
        {item("Theming", <Palette />)}
        {item("Analytics", <BarChart3 />)}
      </SidebarGroup>
      <SidebarGroup label="Resources" collapsible>
        {item("Documentation", <BookOpen />)}
        {item("Team", <Users />)}
        {item("Settings", <Settings />)}
      </SidebarGroup>
    </>
  );
  return (
    <div className="pg-row" style={{ alignItems: "stretch", height: 520 }}>
      <Sidebar
        id="pg-sidebar"
        collapsed={collapsed}
        header={
          <>
            <strong
              style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}
            >
              {collapsed ? "c" : "cherry"}
            </strong>
            {collapsed ? null : (
              <IconButton
                aria-label="Collapse sidebar"
                size="sm"
                icon={<PanelLeft />}
                onClick={() => setCollapsed(true)}
              />
            )}
          </>
        }
        footer={
          collapsed ? (
            <IconButton
              aria-label="Expand sidebar"
              size="sm"
              icon={<PanelLeft />}
              onClick={() => setCollapsed(false)}
            />
          ) : (
            <span style={{ fontSize: 14 }}>Ada Lovelace</span>
          )
        }
      >
        {groups}
      </Sidebar>
      <Sidebar collapsed header={<strong>c</strong>} navLabel="Rail">
        {groups}
      </Sidebar>
    </div>
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(3);
  return (
    <div style={stack}>
      <Pagination page={page} totalPages={10} onPageChange={setPage} />
      <Pagination
        page={page}
        totalPages={10}
        variant="compact"
        onPageChange={setPage}
      />
      <Pagination page={1} totalPages={4} getHref={(p) => `#page-${p}`} />
    </div>
  );
}

const steps = [
  { label: "Account", description: "Your details" },
  { label: "Workspace", description: "Name and brand" },
  { label: "Invite", description: "Add your team" },
  { label: "Launch", description: "Ship it" },
];

function StepperDemo() {
  const [current, setCurrent] = useState(1);
  return (
    <div style={stack}>
      <Stepper steps={steps} current={current} aria-label="Setup" />
      <div className="pg-row">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          Back
        </Button>
        <Button
          size="sm"
          onClick={() => setCurrent((c) => Math.min(steps.length, c + 1))}
        >
          Continue
        </Button>
      </div>
      <Stepper
        steps={steps}
        current={current}
        orientation="vertical"
        aria-label="Setup (vertical)"
      />
    </div>
  );
}

function BannerDemo() {
  const [key, setKey] = useState(0);
  const action = (
    <a href="#">
      Read the migration guide <ArrowRight aria-hidden="true" />
    </a>
  );
  return (
    <div style={{ display: "grid", gap: 12 }} key={key}>
      {(["inverse", "accent", "subtle"] as const).map((variant) => (
        <Banner
          key={variant}
          variant={variant}
          icon={<Megaphone />}
          action={action}
          dismissible
        >
          cherry 2.0 is here: zero runtime, Server Components and a Figma kit.
        </Banner>
      ))}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setKey((k) => k + 1)}
        >
          Reset banners
        </Button>
      </div>
    </div>
  );
}

function ProgressDemo() {
  const [value, setValue] = useState(60);
  useEffect(() => {
    const id = setInterval(
      () => setValue((v) => (v >= 100 ? 10 : v + 15)),
      2000,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        display: "grid",
        gap: 24,
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      }}
    >
      <Progress value={value} label="Uploading assets..." showValue />
      <Progress
        value={100}
        label="Upload complete"
        showValue
        variant="success"
      />
      <Progress value={35} label="Upload failed" showValue variant="danger" />
      <Progress label="Preparing export" />
      <Progress value={40} size="sm" aria-label="Small progress" />
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div className="pg-row" style={{ alignItems: "flex-start", gap: 48 }}>
      <div style={{ width: 240 }}>
        <Skeleton lines={3} />
      </div>
      <Skeleton shape="circle" />
      <div
        style={{
          display: "grid",
          gap: 16,
          width: 240,
          padding: 20,
          border: "1px solid var(--cherry-border-default)",
          borderRadius: "var(--cherry-radius-xl)",
        }}
      >
        <Skeleton shape="rect" />
        <div className="pg-row" style={{ flexWrap: "nowrap" }}>
          <Skeleton shape="circle" width={32} />
          <Skeleton lines={2} />
        </div>
      </div>
    </div>
  );
}

export function NavigationSections() {
  return (
    <>
      <Section title="NavPill">
        <NavPillDemo />
      </Section>

      <Section title="Tabs">
        <div style={stack}>
          <Tabs defaultValue="overview">
            <TabList aria-label="Project (pill)">
              <Tab value="overview">Overview</Tab>
              <Tab value="details">Details</Tab>
              <Tab value="settings">Settings</Tab>
            </TabList>
            <TabPanel value="overview">
              cherry tabs group related content into panels. The selected tab
              sits on a raised surface inside a muted track.
            </TabPanel>
            <TabPanel value="details">
              Arrow keys move between tabs, Home and End jump to the ends.
            </TabPanel>
            <TabPanel value="settings">Settings for this project.</TabPanel>
          </Tabs>
          <Tabs defaultValue="activity" variant="underline">
            <TabList aria-label="Project (underline)">
              <Tab value="activity">Activity</Tab>
              <Tab value="members">Members</Tab>
              <Tab value="billing" disabled>
                Billing
              </Tab>
              <Tab value="integrations">Integrations</Tab>
            </TabList>
            <TabPanel value="activity">
              Recent activity in this workspace.
            </TabPanel>
            <TabPanel value="members">Everyone with access.</TabPanel>
            <TabPanel value="billing">Billing is disabled.</TabPanel>
            <TabPanel value="integrations">
              Connected apps and webhooks.
            </TabPanel>
          </Tabs>
        </div>
      </Section>

      <Section title="Sidebar">
        <SidebarDemo />
      </Section>

      <Section title="Breadcrumb">
        <div style={stack}>
          <Breadcrumb
            items={[
              { label: "Docs", href: "#" },
              { label: "Components", href: "#" },
              { label: "Combobox" },
            ]}
          />
          <Breadcrumb
            separator="slash"
            items={[
              { label: "Docs", href: "#" },
              { label: "Components", href: "#" },
              { label: "Combobox" },
            ]}
          />
        </div>
      </Section>

      <Section title="Pagination">
        <PaginationDemo />
      </Section>

      <Section title="Stepper">
        <StepperDemo />
      </Section>

      <Section title="Accordion">
        <div
          style={{
            display: "grid",
            gap: 32,
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          <Accordion type="single" id="pg-accordion-single">
            <AccordionItem title="What is cherry?" defaultOpen>
              A white-label React design system with theming, dark mode and
              responsive primitives. It animates open and the chevron flips to
              match.
            </AccordionItem>
            <AccordionItem title="Does it need client JS?">
              No. The accordion is native details and summary, so it renders in
              Server Components.
            </AccordionItem>
            <AccordionItem title="Can several be open?">
              Not in this group: type="single" opens one at a time.
            </AccordionItem>
          </Accordion>
          <Accordion variant="inline" id="pg-accordion-multiple">
            <AccordionItem title="What is cherry?">
              A white-label React design system with theming, dark mode and
              responsive primitives.
            </AccordionItem>
            <AccordionItem title="How is it themed?">
              Every color, radius and shadow is a CSS variable.
            </AccordionItem>
            <AccordionItem title="Can several be open?">
              Yes: this group uses the default type="multiple".
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      <Section title="Banner">
        <BannerDemo />
      </Section>

      <Section title="Callout">
        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <Callout>A note callout for supplementary details.</Callout>
          <Callout variant="info">
            An info callout for neutral information.
          </Callout>
          <Callout variant="warning" title="Heads up">
            A warning callout for things to watch out for.
          </Callout>
          <Callout variant="danger">
            A danger callout for destructive outcomes.
          </Callout>
          <Callout variant="success">
            A success callout for confirmations.
          </Callout>
        </div>
      </Section>

      <Section title="EmptyState">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          <EmptyState
            title="No projects yet"
            description="Create your first project to start building with cherry."
            actions={
              <>
                <Button>New project</Button>
                <Button variant="outline">Learn more</Button>
              </>
            }
          />
          <EmptyState
            icon={<Search />}
            title="No results for “sparkle”"
            description="Try another keyword or clear the filters."
            actions={<Button variant="outline">Clear search</Button>}
          />
        </div>
      </Section>

      <Section title="Progress">
        <ProgressDemo />
      </Section>

      <Section title="Skeleton">
        <SkeletonDemo />
      </Section>
    </>
  );
}
