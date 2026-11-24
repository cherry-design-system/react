// Playground section: forms. Owned by one agent; one <Section> per component.
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Checkbox,
  Combobox,
  Field,
  NumberField,
  OTPInput,
  Password,
  Radio,
  RadioGroup,
  Range,
  Select,
  Textarea,
} from "../../../src";
import { Section } from "../Section";

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))",
  gap: 24,
  alignItems: "start",
};
const col: CSSProperties = { display: "grid", gap: 12, alignContent: "start" };
const caption: CSSProperties = {
  margin: 0,
  color: "var(--cherry-fg-muted)",
  fontSize: "var(--cherry-text-body-xs-size)",
};

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={col}>
      <p style={caption}>{label}</p>
      {children}
    </div>
  );
}

const sizes = ["sm", "md", "lg"] as const;

function CheckboxDemo() {
  const [items, setItems] = useState([true, false, true]);
  const all = items.every(Boolean);
  const some = items.some(Boolean) && !all;
  return (
    <div style={grid}>
      <Demo label="Sizes">
        {sizes.map((s) => (
          <Checkbox
            key={s}
            size={s}
            label={`Accept terms (${s})`}
            defaultChecked={s !== "sm"}
          />
        ))}
      </Demo>
      <Demo label="Indeterminate parent">
        <Checkbox
          label="All notifications"
          checked={all}
          indeterminate={some}
          onChange={() => setItems(items.map(() => !all))}
        />
        <div style={{ ...col, paddingInlineStart: 26 }}>
          {["Email", "Push", "SMS"].map((name, i) => (
            <Checkbox
              key={name}
              label={name}
              checked={items[i]}
              onChange={() => setItems(items.map((v, j) => (j === i ? !v : v)))}
            />
          ))}
        </div>
      </Demo>
      <Demo label="States">
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled checked" disabled defaultChecked />
        <Field label="Terms" error="You must accept the terms">
          <Checkbox label="I accept" />
        </Field>
      </Demo>
    </div>
  );
}

function RadioDemo() {
  const [plan, setPlan] = useState<string | null>("pro");
  return (
    <div style={grid}>
      <Demo label={`Controlled (value: ${plan})`}>
        <RadioGroup aria-label="Plan" value={plan} onValueChange={setPlan}>
          <Radio value="free" label="Free" />
          <Radio value="pro" label="Pro" />
          <Radio value="team" label="Team" disabled />
        </RadioGroup>
      </Demo>
      <Demo label="Sizes, horizontal">
        {sizes.map((s) => (
          <RadioGroup
            key={s}
            aria-label={`Size ${s}`}
            size={s}
            orientation="horizontal"
            defaultValue="a"
          >
            <Radio value="a" label="Option" />
            <Radio value="b" label="Option" />
          </RadioGroup>
        ))}
      </Demo>
      <Demo label="In a Field">
        <Field label="Delivery" error="Choose a delivery option">
          <RadioGroup>
            <Radio value="std" label="Standard" />
            <Radio value="exp" label="Express" />
          </RadioGroup>
        </Field>
        <Field label="Billing" disabled>
          <RadioGroup defaultValue="m">
            <Radio value="m" label="Monthly" />
            <Radio value="y" label="Yearly" />
          </RadioGroup>
        </Field>
      </Demo>
    </div>
  );
}

function TextareaDemo() {
  return (
    <div style={grid}>
      <Field label="Message" hint="Grows as you type.">
        <Textarea placeholder="Write a message…" />
      </Field>
      <Field label="Bio">
        <Textarea
          placeholder="Tell us about you"
          showCount
          maxLength={120}
          size="lg"
          maxRows={6}
        />
      </Field>
      <Field label="Feedback" error="Please add a few words">
        <Textarea placeholder="Write a message…" size="sm" />
      </Field>
      <Field label="Notes" disabled>
        <Textarea defaultValue="Read only for now." autoResize={false} />
      </Field>
    </div>
  );
}

function PasswordDemo() {
  return (
    <div style={grid}>
      {sizes.map((s) => (
        <Field key={s} label={`Password (${s})`}>
          <Password size={s} defaultValue="correct horse" autoComplete="off" />
        </Field>
      ))}
      <Field label="New password" error="At least 12 characters">
        <Password defaultValue="short" autoComplete="off" />
      </Field>
      <Field label="Disabled" disabled>
        <Password defaultValue="secret" autoComplete="off" />
      </Field>
    </div>
  );
}

const countries = (
  <>
    <option value="al">Albania</option>
    <option value="de">Germany</option>
    <option value="it">Italy</option>
    <option value="pt" disabled>
      Portugal (soon)
    </option>
    <option value="us">United States</option>
  </>
);

function SelectDemo() {
  return (
    <div style={grid}>
      {sizes.map((s) => (
        <Field key={s} label={`Country (${s})`}>
          <Select size={s} placeholder="Select an option">
            {countries}
          </Select>
        </Field>
      ))}
      <Field label="Shipping" error="Pick a country">
        <Select placeholder="Select an option">{countries}</Select>
      </Field>
      <Field label="Region" disabled>
        <Select defaultValue="de">{countries}</Select>
      </Field>
    </div>
  );
}

function NumberFieldDemo() {
  const [qty, setQty] = useState<number | null>(24);
  return (
    <div style={grid}>
      <Demo label={`Controlled (value: ${qty})`}>
        <Field label="Quantity">
          <NumberField value={qty} onValueChange={setQty} min={0} max={99} />
        </Field>
      </Demo>
      <Demo label="Sizes">
        {sizes.map((s) => (
          <NumberField
            key={s}
            aria-label={`Size ${s}`}
            size={s}
            defaultValue={2}
            min={0}
          />
        ))}
      </Demo>
      <Demo label="States">
        <Field label="Price" hint="Steps of 0.5">
          <NumberField defaultValue={1.5} step={0.5} min={0} />
        </Field>
        <Field label="Guests" error="Up to 8 guests">
          <NumberField defaultValue={12} />
        </Field>
        <Field label="Seats" disabled>
          <NumberField defaultValue={24} />
        </Field>
      </Demo>
    </div>
  );
}

function RangeDemo() {
  const [volume, setVolume] = useState(60);
  return (
    <div style={grid}>
      <Demo label={`Controlled (volume: ${volume})`}>
        <Field label="Volume">
          <Range
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </Field>
      </Demo>
      <Demo label="Sizes">
        {sizes.map((s) => (
          <Range key={s} aria-label={`Size ${s}`} size={s} defaultValue={60} />
        ))}
      </Demo>
      <Demo label="States">
        <Field label="Brightness" error="Too bright for night mode">
          <Range defaultValue={90} />
        </Field>
        <Field label="Contrast" disabled>
          <Range defaultValue={40} />
        </Field>
      </Demo>
    </div>
  );
}

function OTPDemo() {
  const [code, setCode] = useState("");
  return (
    <div style={{ ...col, gap: 20 }}>
      <Field
        label="Verification code"
        hint={
          code.length === 6
            ? `Complete: ${code}`
            : "Paste or type the 6 digits."
        }
      >
        <OTPInput separator value={code} onValueChange={setCode} />
      </Field>
      <Demo label="Without separator, sizes">
        {sizes.map((s) => (
          <OTPInput
            key={s}
            aria-label={`Code ${s}`}
            size={s}
            defaultValue="428"
          />
        ))}
      </Demo>
      <Field label="Code" error="That code has expired">
        <OTPInput separator defaultValue="428915" />
      </Field>
      <Field label="Code" disabled>
        <OTPInput separator size="sm" />
      </Field>
    </div>
  );
}

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "nest", label: "NestJS" },
  { value: "netlify", label: "Netlify Functions" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix", disabled: true },
  { value: "astro", label: "Astro" },
  { value: "svelte", label: "SvelteKit" },
  { value: "vite", label: "Vite" },
];

function ComboboxDemo() {
  const [fw, setFw] = useState<string | null>("next");
  return (
    <div style={grid}>
      <Field label="Framework" hint={`Selected: ${fw ?? "none"}`}>
        <Combobox
          options={frameworks}
          value={fw}
          onValueChange={setFw}
          placeholder="Select a framework…"
          emptyMessage="No frameworks found"
          emptyHint="Try another search."
        />
      </Field>
      {sizes.map((s) => (
        <Field key={s} label={`Size ${s}`}>
          <Combobox
            size={s}
            options={frameworks}
            placeholder="Select a framework…"
          />
        </Field>
      ))}
      <Field label="Stack" error="Pick a framework">
        <Combobox options={frameworks} placeholder="Select a framework…" />
      </Field>
      <Field label="Locked" disabled>
        <Combobox options={frameworks} defaultValue="astro" />
      </Field>
    </div>
  );
}

export function FormsSections() {
  return (
    <>
      <Section title="Checkbox">
        <CheckboxDemo />
      </Section>
      <Section title="Radio">
        <RadioDemo />
      </Section>
      <Section title="Textarea">
        <TextareaDemo />
      </Section>
      <Section title="Password">
        <PasswordDemo />
      </Section>
      <Section title="Select">
        <SelectDemo />
      </Section>
      <Section title="NumberField">
        <NumberFieldDemo />
      </Section>
      <Section title="Range">
        <RangeDemo />
      </Section>
      <Section title="OTPInput">
        <OTPDemo />
      </Section>
      <Section title="Combobox">
        <ComboboxDemo />
      </Section>
    </>
  );
}
