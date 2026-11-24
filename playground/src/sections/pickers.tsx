// Playground section: pickers. Owned by one agent; one <Section> per component.
import { useState } from "react";
import { LayoutGrid, List, Bold, Italic, Underline } from "lucide-react";
import {
  Button,
  Calendar,
  ConfirmButton,
  DatePicker,
  DateTimePicker,
  Field,
  Snippet,
  Tag,
  TimePicker,
  ToggleGroup,
  ToggleGroupItem,
  type DateRange,
} from "../../../src";
import { Section } from "../Section";

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

function CalendarDemo() {
  const [day, setDay] = useState<Date | null>(new Date(y, m, 27));
  const [range, setRange] = useState<DateRange | null>({
    start: new Date(y, m, 18),
    end: new Date(y, m, 25),
  });
  return (
    <div className="pg-row" style={{ alignItems: "flex-start", gap: 24 }}>
      <Calendar value={day} onChange={setDay} locale="en-US" />
      <Calendar mode="range" value={range} onChange={setRange} locale="en-US" />
      <Calendar
        locale="de-DE"
        min={new Date(y, m, 5)}
        max={new Date(y, m + 1, 20)}
        isDateDisabled={isWeekend}
        aria-label="Weekdays only"
      />
    </div>
  );
}

function DatePickerDemo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <div className="pg-row" style={{ alignItems: "flex-start" }}>
      <DatePicker
        aria-label="Start date"
        value={date}
        onChange={setDate}
        locale="en-US"
        id="pg-date-empty"
      />
      <DatePicker
        aria-label="Due date"
        defaultValue={new Date(y, m, 27)}
        locale="en-US"
        id="pg-date-filled"
      />
      <Field label="Deadline" error="Pick a weekday" style={{ width: 260 }}>
        <DatePicker
          locale="en-US"
          isDateDisabled={isWeekend}
          fullWidth
          size="md"
        />
      </Field>
      <DatePicker aria-label="Disabled date" disabled locale="en-US" />
    </div>
  );
}

function TimePickerDemo() {
  return (
    <div className="pg-row" style={{ alignItems: "flex-start" }}>
      <TimePicker
        aria-label="Start time"
        defaultValue="09:30"
        hourCycle={12}
        locale="en-US"
        min="08:00"
        max="18:00"
        id="pg-time-12"
      />
      <TimePicker
        aria-label="Departure"
        defaultValue="14:30"
        hourCycle={24}
        locale="en-GB"
        id="pg-time-24"
      />
      <TimePicker
        aria-label="Alarm"
        layout="columns"
        step={5}
        defaultValue="07:45"
        hourCycle={12}
        locale="en-US"
        id="pg-time-columns"
      />
      <Field label="Check-in" error="Required" style={{ width: 200 }}>
        <TimePicker fullWidth />
      </Field>
    </div>
  );
}

function DateTimePickerDemo() {
  const [value, setValue] = useState<Date | null>(new Date(y, m, 27, 9, 30));
  return (
    <div className="pg-row" style={{ alignItems: "flex-start" }}>
      <DateTimePicker
        aria-label="Meeting"
        value={value}
        onChange={setValue}
        locale="en-US"
        hourCycle={12}
        id="pg-datetime"
      />
      <Field label="Publish at" hint="Your local time zone">
        <DateTimePicker locale="en-GB" hourCycle={24} />
      </Field>
    </div>
  );
}

function ConfirmButtonDemo() {
  const [files, setFiles] = useState(["report-q3.pdf", "invoice-0042.pdf"]);
  return (
    <div className="pg-stack">
      {files.map((file) => (
        <div
          key={file}
          className="pg-row"
          style={{ justifyContent: "space-between" }}
        >
          <span>{file}</span>
          <ConfirmButton
            aria-label={`Delete ${file}`}
            onConfirm={() => setFiles((list) => list.filter((f) => f !== file))}
          />
        </div>
      ))}
      <div className="pg-row">
        <ConfirmButton
          aria-label="Delete project"
          size="lg"
          onConfirm={() => {}}
        />
        <ConfirmButton
          aria-label="Delete disabled"
          disabled
          onConfirm={() => {}}
        />
        {files.length < 2 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiles(["report-q3.pdf", "invoice-0042.pdf"])}
          >
            Reset files
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function TagDemo() {
  const initial = ["React", "TypeScript", "CSS", "Accessibility"];
  const [tags, setTags] = useState(initial);
  return (
    <div className="pg-stack" style={{ maxWidth: "none" }}>
      <div className="pg-row" id="pg-tags">
        {tags.map((tag) => (
          <Tag
            key={tag}
            onRemove={() => setTags((list) => list.filter((t) => t !== tag))}
          >
            {tag}
          </Tag>
        ))}
        {tags.length < initial.length ? (
          <Tag
            variant="outline"
            onClick={() => setTags(initial)}
            style={{ cursor: "pointer" }}
          >
            Reset
          </Tag>
        ) : null}
      </div>
      <div className="pg-row">
        <Tag>Neutral</Tag>
        <Tag variant="outline">Outline</Tag>
        <Tag variant="accent">Accent</Tag>
        <Tag variant="outline" onRemove={() => {}}>
          Outline
        </Tag>
        <Tag variant="accent" onRemove={() => {}}>
          Accent
        </Tag>
        <Tag size="sm" onRemove={() => {}}>
          Small
        </Tag>
      </div>
    </div>
  );
}

function ToggleGroupDemo() {
  const [range, setRange] = useState("week");
  const [format, setFormat] = useState<string[]>(["bold"]);
  return (
    <div className="pg-stack" style={{ maxWidth: "none" }}>
      <div className="pg-row">
        <ToggleGroup
          aria-label="Range"
          value={range}
          onValueChange={setRange}
          size="sm"
          id="pg-toggle-single-sm"
        >
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          aria-label="Range"
          value={range}
          onValueChange={setRange}
          id="pg-toggle-single"
        >
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="pg-row">
        <ToggleGroup aria-label="View" defaultValue="list" size="sm">
          <ToggleGroupItem value="list" aria-label="List">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid">
            <LayoutGrid />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup aria-label="View" defaultValue="list">
          <ToggleGroupItem value="list" aria-label="List">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid">
            <LayoutGrid />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="multiple"
          aria-label="Text format"
          value={format}
          onValueChange={setFormat}
          id="pg-toggle-multiple"
        >
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Bold />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Italic />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <Underline />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

export function PickersSections() {
  return (
    <>
      <Section title="Calendar">
        <CalendarDemo />
      </Section>
      <Section title="DatePicker">
        <DatePickerDemo />
      </Section>
      <Section title="TimePicker">
        <TimePickerDemo />
      </Section>
      <Section title="DateTimePicker">
        <DateTimePickerDemo />
      </Section>
      <Section title="ConfirmButton">
        <ConfirmButtonDemo />
      </Section>
      <Section title="Snippet">
        <div className="pg-stack" style={{ maxWidth: 420 }}>
          <Snippet>pnpm add @cherry-design-system/react</Snippet>
          <Snippet prompt=">" copyText="npx cherry init">
            npx cherry init --template next-app-router --with-tokens
          </Snippet>
        </div>
      </Section>
      <Section title="ToggleGroup">
        <ToggleGroupDemo />
      </Section>
      <Section title="Tag">
        <TagDemo />
      </Section>
    </>
  );
}
