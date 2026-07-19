// Templates define layout only — never data.
// A template is a pure configuration object; adding a new one requires no
// changes to the rendering, measurement, or pagination engines.

export type SectionId =
  | "profile"
  | "summary"
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "certifications"
  | "languages"
  | "awards"
  | "publications"
  | "references";

export type LayoutKind =
  | "single"
  | "twoCol"
  | "threeCol"
  | "leftSidebar"
  | "rightSidebar"
  | "headerTwoCol"
  | "headerThreeCol"
  | "footer";

export type Theme = {
  primary: string;
  accent: string;
  text: string;
  muted: string;
  divider: string;
  sidebarBg: string;
  sidebarText: string;
  headingFont: string;
  bodyFont: string;
  baseSize: number; // px
  headingWeight: number;
  sectionTitleTransform: "uppercase" | "none";
  sectionTitleStyle: "underline" | "bar" | "plain" | "chip";
  bulletStyle: "dot" | "dash" | "square";
  radius: number; // px
  accentBar: boolean;
};

export type Spacing = {
  pageMarginTop: number; // px
  pageMarginRight: number;
  pageMarginBottom: number;
  pageMarginLeft: number;
  sectionGap: number; // gap between section blocks
  entryGap: number; // gap between entries within a section
  bulletGap: number;
  columnGap: number;
  headerHeight: number; // 0 = auto
  footerHeight: number;
  sidebarWidth: number; // px (only for sidebar layouts)
  headerPadding: number;
  sidebarPadding: number;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  layout: LayoutKind;
  theme: Theme;
  spacing: Spacing;
  // Which sections go where. Anything not listed is skipped.
  headerSections: SectionId[];
  mainSections: SectionId[];
  sidebarSections: SectionId[];
  secondSidebarSections: SectionId[]; // for three-column layouts
  footerSections: SectionId[];
};

const baseTheme: Theme = {
  primary: "#0f172a",
  accent: "#2563eb",
  text: "#0f172a",
  muted: "#64748b",
  divider: "#e2e8f0",
  sidebarBg: "#f1f5f9",
  sidebarText: "#0f172a",
  headingFont:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  bodyFont:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  baseSize: 10.5,
  headingWeight: 700,
  sectionTitleTransform: "uppercase",
  sectionTitleStyle: "bar",
  bulletStyle: "dot",
  radius: 4,
  accentBar: true,
};

const baseSpacing: Spacing = {
  pageMarginTop: 44,
  pageMarginRight: 48,
  pageMarginBottom: 44,
  pageMarginLeft: 48,
  sectionGap: 14,
  entryGap: 10,
  bulletGap: 4,
  columnGap: 24,
  headerHeight: 0,
  footerHeight: 0,
  sidebarWidth: 210,
  headerPadding: 20,
  sidebarPadding: 22,
};

const allMain: SectionId[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "certifications",
  "awards",
  "publications",
];

const sidebarDefaults: SectionId[] = [
  "skills",
  "languages",
  "certifications",
  "awards",
];

function tpl(overrides: Partial<Template> & { id: string; name: string; description: string; layout: LayoutKind }): Template {
  return {
    theme: { ...baseTheme, ...(overrides.theme ?? {}) },
    spacing: { ...baseSpacing, ...(overrides.spacing ?? {}) },
    headerSections: ["profile"],
    mainSections: allMain,
    sidebarSections: [],
    secondSidebarSections: [],
    footerSections: [],
    ...overrides,
  };
}

export const templates: Template[] = [
  tpl({
    id: "modern",
    name: "Modern",
    description: "Clean single column with accent bar section titles.",
    layout: "single",
    theme: {
      ...baseTheme,
      accent: "#2563eb",
      sectionTitleStyle: "bar",
      accentBar: true,
    },
  }),
  tpl({
    id: "classic",
    name: "Classic",
    description: "Traditional serif look with underlined section titles.",
    layout: "single",
    theme: {
      ...baseTheme,
      accent: "#0f172a",
      headingFont: 'Georgia, "Times New Roman", Times, serif',
      bodyFont: 'Georgia, "Times New Roman", Times, serif',
      sectionTitleStyle: "underline",
      sectionTitleTransform: "uppercase",
      accentBar: false,
    },
  }),
  tpl({
    id: "ats",
    name: "ATS Safe",
    description: "Maximum parseability. Plain titles, no columns, no color.",
    layout: "single",
    theme: {
      ...baseTheme,
      accent: "#000000",
      primary: "#000000",
      text: "#000000",
      muted: "#333333",
      sectionTitleStyle: "plain",
      sectionTitleTransform: "uppercase",
      accentBar: false,
      divider: "#000000",
    },
    spacing: { ...baseSpacing, sectionGap: 12 },
  }),
  tpl({
    id: "leftSidebar",
    name: "Left Sidebar",
    description: "Contact and skills in a tinted left column.",
    layout: "leftSidebar",
    sidebarSections: ["profile", ...sidebarDefaults],
    mainSections: ["summary", "experience", "projects", "education"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#0ea5e9", sectionTitleStyle: "bar" },
  }),
  tpl({
    id: "rightSidebar",
    name: "Right Sidebar",
    description: "Main content left, at-a-glance sidebar on the right.",
    layout: "rightSidebar",
    sidebarSections: ["profile", ...sidebarDefaults],
    mainSections: ["summary", "experience", "projects", "education"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#7c3aed" },
  }),
  tpl({
    id: "twoColumn",
    name: "Two Column",
    description: "Balanced two column body, no sidebar tint.",
    layout: "twoCol",
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages", "awards"],
    headerSections: ["profile"],
    theme: {
      ...baseTheme,
      accent: "#059669",
      sidebarBg: "transparent",
      sectionTitleStyle: "bar",
    },
    spacing: { ...baseSpacing, sidebarWidth: 240 },
  }),
  tpl({
    id: "threeColumn",
    name: "Three Column",
    description: "Compact three column dashboard layout.",
    layout: "threeCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience"],
    sidebarSections: ["projects", "education"],
    secondSidebarSections: ["skills", "certifications", "languages", "awards"],
    theme: { ...baseTheme, accent: "#f97316", sidebarBg: "transparent" },
    spacing: { ...baseSpacing, columnGap: 18, sidebarWidth: 190 },
  }),
  tpl({
    id: "headerTwoCol",
    name: "Header + Two Column",
    description: "Full-width header, then a two column body.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#e11d48" },
    spacing: { ...baseSpacing, sidebarWidth: 220 },
  }),
  tpl({
    id: "headerThreeCol",
    name: "Header + Three Column",
    description: "Header up top with three columns beneath it.",
    layout: "headerThreeCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience"],
    sidebarSections: ["projects", "education"],
    secondSidebarSections: ["skills", "certifications", "languages", "awards"],
    theme: { ...baseTheme, accent: "#0891b2", sidebarBg: "transparent" },
    spacing: { ...baseSpacing, columnGap: 18, sidebarWidth: 180 },
  }),
  tpl({
    id: "footer",
    name: "Footer Layout",
    description: "Single column with a persistent references footer.",
    layout: "footer",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "education", "skills"],
    footerSections: ["references", "languages"],
    theme: { ...baseTheme, accent: "#334155" },
    spacing: { ...baseSpacing, footerHeight: 90 },
  }),
];

export const templateById = new Map(templates.map((t) => [t.id, t]));

export function getTemplate(id: string): Template {
  return templateById.get(id) ?? templates[0];
}
