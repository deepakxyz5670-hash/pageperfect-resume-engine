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
  sectionTitleStyle: "underline" | "bar" | "plain" | "chip" | "timeline";
  bulletStyle: "dot" | "dash" | "square";
  radius: number; // px
  accentBar: boolean;
  // Optional header/avatar treatments (used by profileHeader block)
  headerBg?: string;
  headerText?: string;
  headerRadius?: number;
  avatar?: "none" | "initials";
  avatarPlacement?: "left" | "center" | "right";
  avatarSize?: number;
  avatarBg?: string;
  avatarText?: string;
  // Optional page-level decorations
  timelineBar?: {
    x: number; // distance from page left edge (px)
    color?: string; // defaults to accent
    width?: number; // defaults to 2
    labelWidth?: number; // reserved space for the label to the left of the bar
    labelGap?: number; // gap between label and bar
  };
  bookmark?: {
    position: "topLeft" | "topRight";
    color: string;
    width: number;
    height: number;
    accent?: string; // small stripe color
  };
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
  // --- Attached designs -------------------------------------------------

  tpl({
    id: "darkSidebarContact",
    name: "Dark Sidebar Contact",
    description: "Dark navy left card with name & summary, contact stack right.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile", "summary"],
    mainSections: ["education", "projects", "experience", "skills"],
    theme: {
      ...baseTheme,
      accent: "#14b8a6",
      primary: "#0f172a",
      sidebarBg: "#1e293b",
      sidebarText: "#f1f5f9",
      sectionTitleStyle: "plain",
      sectionTitleTransform: "uppercase",
      accentBar: false,
      bulletStyle: "square",
    },
    spacing: { ...baseSpacing, sidebarWidth: 280, sidebarPadding: 26, sectionGap: 16 },
  }),

  tpl({
    id: "tealCenteredHeader",
    name: "Teal Centered Header",
    description: "Full-width header, teal accents, centered section titles feel.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["education", "skills", "certifications", "languages"],
    theme: {
      ...baseTheme,
      accent: "#0d9488",
      primary: "#134e4a",
      sectionTitleStyle: "underline",
      sectionTitleTransform: "none",
      headingFont: 'Georgia, "Times New Roman", serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      accentBar: false,
      divider: "#5eead4",
    },
    spacing: { ...baseSpacing, sidebarWidth: 230 },
  }),

  tpl({
    id: "roseAccent",
    name: "Rose Accent",
    description: "Warm rose accent with serif display headings.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills"],
    headerSections: [],
    theme: {
      ...baseTheme,
      accent: "#be123c",
      primary: "#0f172a",
      headingFont: 'Georgia, "Times New Roman", serif',
      sectionTitleStyle: "underline",
      sectionTitleTransform: "uppercase",
      accentBar: false,
      divider: "#fecdd3",
    },
  }),

  tpl({
    id: "slateBadge",
    name: "Slate Badge",
    description: "Chip-style section titles on a compact single column.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills", "certifications"],
    headerSections: [],
    theme: {
      ...baseTheme,
      accent: "#334155",
      primary: "#0f172a",
      sectionTitleStyle: "chip",
      sectionTitleTransform: "uppercase",
      bulletStyle: "square",
      accentBar: false,
    },
    spacing: { ...baseSpacing, sectionGap: 12 },
  }),

  tpl({
    id: "amberDashed",
    name: "Amber Dashed",
    description: "Amber accent with dashed bullets and left-bar sections.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills"],
    headerSections: [],
    theme: {
      ...baseTheme,
      accent: "#d97706",
      primary: "#78350f",
      sectionTitleStyle: "bar",
      sectionTitleTransform: "uppercase",
      accentBar: true,
      bulletStyle: "dash",
    },
  }),

  tpl({
    id: "indigoRight",
    name: "Indigo Right",
    description: "Right-side indigo sidebar for contact + skills.",
    layout: "rightSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages", "certifications"],
    mainSections: ["summary", "experience", "projects", "education"],
    theme: {
      ...baseTheme,
      accent: "#6366f1",
      primary: "#1e1b4b",
      sidebarBg: "#eef2ff",
      sidebarText: "#1e1b4b",
      sectionTitleStyle: "bar",
      accentBar: true,
    },
    spacing: { ...baseSpacing, sidebarWidth: 240, sidebarPadding: 24 },
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

  // --- Professional Timeline (left labels, right content) ---------------
  tpl({
    id: "professionalTimeline",
    name: "Professional Timeline",
    description: "Left-column section labels with a timeline feel; purple header accent.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile"],
    mainSections: ["summary", "experience", "education", "projects", "skills", "certifications", "languages"],
    theme: {
      ...baseTheme,
      accent: "#7B2CBF",
      primary: "#111111",
      text: "#222222",
      muted: "#666666",
      divider: "#D8D8D8",
      sidebarBg: "transparent",
      sidebarText: "#222222",
      headingFont: 'Roboto, Arial, sans-serif',
      bodyFont: 'Roboto, Arial, sans-serif',
      sectionTitleStyle: "plain",
      sectionTitleTransform: "uppercase",
      accentBar: false,
      bulletStyle: "dot",
    },
    spacing: { ...baseSpacing, sidebarWidth: 170, columnGap: 24, sectionGap: 22, pageMarginTop: 30, pageMarginBottom: 30, pageMarginLeft: 28, pageMarginRight: 28 },
  }),

  // --- Professional One Column (ATS-friendly single column, Inter) ------
  tpl({
    id: "professionalOneColumn",
    name: "Professional One Column",
    description: "ATS-friendly single column with slate headings and generous spacing.",
    layout: "single",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "education", "skills", "certifications", "languages"],
    theme: {
      ...baseTheme,
      accent: "#24364B",
      primary: "#24364B",
      text: "#222222",
      muted: "#6B7280",
      divider: "#D9D9D9",
      headingFont: 'Inter, Helvetica, Arial, sans-serif',
      bodyFont: 'Inter, Helvetica, Arial, sans-serif',
      sectionTitleStyle: "underline",
      sectionTitleTransform: "uppercase",
      accentBar: false,
    },
    spacing: { ...baseSpacing, sectionGap: 24, pageMarginTop: 28, pageMarginBottom: 28, pageMarginLeft: 32, pageMarginRight: 32 },
  }),

  // --- Nunito Dark Card (dark sidebar + teal accents) -------------------
  tpl({
    id: "nunitoDarkCard",
    name: "Nunito Dark Card",
    description: "Dark rounded card sidebar with teal accents and Nunito Sans type.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile", "summary"],
    mainSections: ["experience", "projects", "education", "skills", "certifications"],
    theme: {
      ...baseTheme,
      accent: "#2F8A94",
      primary: "#374151",
      text: "#222222",
      muted: "#6B7280",
      divider: "#D7DCE2",
      sidebarBg: "#374151",
      sidebarText: "#ffffff",
      headingFont: '"Nunito Sans", Arial, sans-serif',
      bodyFont: '"Nunito Sans", Arial, sans-serif',
      sectionTitleStyle: "underline",
      sectionTitleTransform: "none",
      accentBar: false,
      radius: 6,
    },
    spacing: { ...baseSpacing, sidebarWidth: 280, sidebarPadding: 24, sectionGap: 16 },
  }),

  // --- Role-based unique templates --------------------------------------
  tpl({
    id: "atsBlackWhite",
    name: "ATS Black & White",
    description: "Pure grayscale, maximum parseability, no accents.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills", "certifications"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#000", primary: "#000", text: "#000", muted: "#333", divider: "#000", sectionTitleStyle: "underline", sectionTitleTransform: "uppercase", accentBar: false, headingFont: 'Arial, Helvetica, sans-serif', bodyFont: 'Arial, Helvetica, sans-serif' },
  }),

  tpl({
    id: "executivePlus",
    name: "Executive Plus",
    description: "Premium serif executive layout with deep navy accents.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "awards", "languages"],
    theme: { ...baseTheme, accent: "#0b1f3a", primary: "#0b1f3a", headingFont: '"Playfair Display", Georgia, serif', sectionTitleStyle: "underline", sectionTitleTransform: "uppercase", accentBar: false, divider: "#c9a86a" },
    spacing: { ...baseSpacing, sidebarWidth: 230 },
  }),

  tpl({
    id: "startup",
    name: "Startup",
    description: "Bold, punchy layout with lime accent for high-growth teams.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications"],
    theme: { ...baseTheme, accent: "#84cc16", primary: "#0a0a0a", sectionTitleStyle: "bar", accentBar: true, headingFont: '"Space Grotesk", Inter, sans-serif', bodyFont: 'Inter, sans-serif' },
  }),

  tpl({
    id: "techEngineer",
    name: "Tech Engineer",
    description: "Monospace touches, cyan accent, developer-friendly.",
    layout: "twoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#06b6d4", primary: "#0f172a", headingFont: '"JetBrains Mono", ui-monospace, monospace', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "chip", bulletStyle: "square", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 240 },
  }),

  tpl({
    id: "productManager",
    name: "Product Manager",
    description: "Structured two-column with confident indigo accent.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "awards"],
    theme: { ...baseTheme, accent: "#4338ca", primary: "#1e1b4b", sectionTitleStyle: "bar", accentBar: true, headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif' },
  }),

  tpl({
    id: "designerPortfolio",
    name: "Designer Portfolio",
    description: "Editorial serif display + soft coral accent for creatives.",
    layout: "rightSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages"],
    mainSections: ["summary", "projects", "experience", "education", "awards"],
    theme: { ...baseTheme, accent: "#f43f5e", primary: "#111827", sidebarBg: "#fff1f2", sidebarText: "#111827", headingFont: '"Fraunces", Georgia, serif', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "plain", sectionTitleTransform: "none", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 240 },
  }),

  tpl({
    id: "medical",
    name: "Medical",
    description: "Calming teal, clean serif headings for healthcare professionals.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "education", "certifications", "publications", "skills"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#0f766e", primary: "#134e4a", headingFont: 'Georgia, serif', sectionTitleStyle: "underline", accentBar: false, divider: "#99f6e4" },
  }),

  tpl({
    id: "legal",
    name: "Legal",
    description: "Traditional serif, burgundy accent, formal single column.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "education", "certifications", "publications", "awards"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#7f1d1d", primary: "#450a0a", headingFont: '"Libre Baskerville", Georgia, serif', bodyFont: 'Georgia, serif', sectionTitleStyle: "underline", sectionTitleTransform: "uppercase", accentBar: false },
  }),

  tpl({
    id: "finance",
    name: "Finance",
    description: "Conservative navy with gold divider for finance & banking.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "education", "certifications"],
    sidebarSections: ["skills", "awards", "languages"],
    theme: { ...baseTheme, accent: "#1e3a8a", primary: "#0b1f3a", divider: "#ca8a04", headingFont: 'Georgia, serif', sectionTitleStyle: "underline", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 220 },
  }),

  tpl({
    id: "sales",
    name: "Sales",
    description: "Energetic orange accent, metrics-forward two-column layout.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "awards"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#ea580c", primary: "#7c2d12", sectionTitleStyle: "bar", accentBar: true, headingFont: 'Inter, sans-serif' },
  }),

  tpl({
    id: "marketing",
    name: "Marketing",
    description: "Vibrant magenta accent with modern sans display.",
    layout: "twoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "awards"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#db2777", primary: "#4a044e", headingFont: '"Space Grotesk", Inter, sans-serif', sectionTitleStyle: "chip", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 230 },
  }),

  tpl({
    id: "dataScience",
    name: "Data Science",
    description: "Analytical layout with emerald accent and monospace headings.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "certifications", "languages"],
    mainSections: ["summary", "experience", "projects", "publications", "education"],
    theme: { ...baseTheme, accent: "#059669", primary: "#064e3b", sidebarBg: "#ecfdf5", sidebarText: "#064e3b", headingFont: '"JetBrains Mono", monospace', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "bar", accentBar: true, bulletStyle: "square" },
    spacing: { ...baseSpacing, sidebarWidth: 230 },
  }),

  tpl({
    id: "developer",
    name: "Developer",
    description: "Terminal-inspired dark sidebar with green accent.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages"],
    mainSections: ["summary", "experience", "projects", "education", "certifications"],
    theme: { ...baseTheme, accent: "#22c55e", primary: "#0f172a", sidebarBg: "#0f172a", sidebarText: "#e2e8f0", headingFont: '"JetBrains Mono", monospace', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "plain", sectionTitleTransform: "uppercase", accentBar: false, bulletStyle: "square" },
    spacing: { ...baseSpacing, sidebarWidth: 260, sidebarPadding: 24 },
  }),

  tpl({
    id: "student",
    name: "Student",
    description: "Friendly sky-blue accent with education-first ordering.",
    layout: "single",
    mainSections: ["profile", "summary", "education", "projects", "experience", "skills", "certifications", "awards"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#0284c7", primary: "#0c4a6e", sectionTitleStyle: "bar", accentBar: true, headingFont: 'Inter, sans-serif' },
  }),

  tpl({
    id: "fresher",
    name: "Fresher",
    description: "Clean, education-forward layout ideal for first-time job seekers.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "education", "projects", "experience"],
    sidebarSections: ["skills", "certifications", "languages", "awards"],
    theme: { ...baseTheme, accent: "#2563eb", primary: "#1e3a8a", sectionTitleStyle: "underline", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 220 },
  }),

  tpl({
    id: "freelancer",
    name: "Freelancer",
    description: "Projects-first layout with warm amber accent.",
    layout: "twoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "projects", "experience", "awards"],
    sidebarSections: ["skills", "certifications", "languages", "education"],
    theme: { ...baseTheme, accent: "#f59e0b", primary: "#78350f", sectionTitleStyle: "chip", accentBar: false, bulletStyle: "dash" },
    spacing: { ...baseSpacing, sidebarWidth: 230 },
  }),

  tpl({
    id: "consultant",
    name: "Consultant",
    description: "Refined charcoal palette with case-study emphasis.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "publications"],
    sidebarSections: ["skills", "education", "certifications", "languages", "awards"],
    theme: { ...baseTheme, accent: "#111827", primary: "#111827", headingFont: '"Playfair Display", Georgia, serif', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "underline", accentBar: false, divider: "#9ca3af" },
    spacing: { ...baseSpacing, sidebarWidth: 220 },
  }),

  tpl({
    id: "government",
    name: "Government",
    description: "Formal single column, deep green accent, serif type.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "education", "certifications", "awards", "publications"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#166534", primary: "#14532d", headingFont: 'Georgia, serif', bodyFont: 'Georgia, serif', sectionTitleStyle: "underline", sectionTitleTransform: "uppercase", accentBar: false },
  }),

  tpl({
    id: "creativeAgency",
    name: "Creative Agency",
    description: "Bold display type, violet accent, asymmetric two-column.",
    layout: "rightSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages", "awards"],
    mainSections: ["summary", "projects", "experience", "education"],
    theme: { ...baseTheme, accent: "#7c3aed", primary: "#2e1065", sidebarBg: "#f5f3ff", sidebarText: "#2e1065", headingFont: '"Fraunces", Georgia, serif', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "plain", sectionTitleTransform: "uppercase", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 240 },
  }),

  tpl({
    id: "internationalCV",
    name: "International CV",
    description: "Europass-inspired long-form CV with header + comprehensive sections.",
    layout: "headerThreeCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "publications"],
    sidebarSections: ["projects", "education"],
    secondSidebarSections: ["skills", "languages", "certifications", "awards", "references"],
    theme: { ...baseTheme, accent: "#0369a1", primary: "#0c4a6e", sectionTitleStyle: "underline", accentBar: false, headingFont: 'Inter, sans-serif' },
    spacing: { ...baseSpacing, sidebarWidth: 180, columnGap: 18 },
  }),

  // --- Premium design-system inspired templates -------------------------
  tpl({
    id: "minimalSwiss",
    name: "Minimal Swiss",
    description: "Swiss typographic grid, huge whitespace, thin gray dividers.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#111", primary: "#111", text: "#111", muted: "#555", divider: "#e5e5e5", headingFont: '"Inter", "Helvetica Neue", Arial, sans-serif', bodyFont: '"Inter", "Helvetica Neue", Arial, sans-serif', sectionTitleStyle: "plain", sectionTitleTransform: "uppercase", accentBar: false },
    spacing: { ...baseSpacing, sectionGap: 26, pageMarginTop: 56, pageMarginBottom: 56, pageMarginLeft: 56, pageMarginRight: 56 },
  }),

  tpl({
    id: "appleClean",
    name: "Apple Clean",
    description: "Rounded cards, generous whitespace, Apple-blue accent.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#0071e3", primary: "#1d1d1f", muted: "#6e6e73", divider: "#d2d2d7", sidebarBg: "#f5f5f7", headingFont: '"SF Pro Display", Inter, sans-serif', bodyFont: '"SF Pro Text", Inter, sans-serif', sectionTitleStyle: "plain", sectionTitleTransform: "none", accentBar: false, radius: 12 },
    spacing: { ...baseSpacing, sidebarWidth: 230, sectionGap: 18 },
  }),

  tpl({
    id: "googleMaterial",
    name: "Google Material",
    description: "Material 3 cards, 8px system, Roboto, blue accent.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills", "certifications"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#1a73e8", primary: "#202124", muted: "#5f6368", divider: "#dadce0", headingFont: 'Roboto, Inter, sans-serif', bodyFont: 'Roboto, Inter, sans-serif', sectionTitleStyle: "chip", sectionTitleTransform: "none", accentBar: false, radius: 8 },
    spacing: { ...baseSpacing, sectionGap: 16 },
  }),

  tpl({
    id: "notionResume",
    name: "Notion",
    description: "Editorial workspace look, small uppercase headings, soft gray.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#37352f", primary: "#37352f", muted: "#787774", divider: "#e9e9e7", headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "plain", sectionTitleTransform: "uppercase", accentBar: false },
    spacing: { ...baseSpacing, sectionGap: 20 },
  }),

  tpl({
    id: "linearStyle",
    name: "Linear",
    description: "Linear.app inspired — purple accent, soft borders, tight type.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#5e6ad2", primary: "#0e0e10", muted: "#6b7280", divider: "#e4e4e7", headingFont: '"Inter", sans-serif', bodyFont: '"Inter", sans-serif', sectionTitleStyle: "chip", sectionTitleTransform: "none", accentBar: false, radius: 8 },
    spacing: { ...baseSpacing, sidebarWidth: 220, sectionGap: 16 },
  }),

  tpl({
    id: "vercelStyle",
    name: "Vercel",
    description: "Monochrome developer-first, Geist typography, minimal accents.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#000", primary: "#000", muted: "#666", divider: "#eaeaea", headingFont: '"Geist", Inter, sans-serif', bodyFont: '"Geist", Inter, sans-serif', sectionTitleStyle: "plain", sectionTitleTransform: "uppercase", accentBar: false },
    spacing: { ...baseSpacing, sectionGap: 22, pageMarginTop: 48, pageMarginBottom: 48 },
  }),

  tpl({
    id: "githubReadme",
    name: "GitHub README",
    description: "README-flavored resume with monospace accents and tag chips.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "skills", "education", "certifications"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#0969da", primary: "#1f2328", muted: "#656d76", divider: "#d0d7de", headingFont: 'Inter, sans-serif', bodyFont: '"JetBrains Mono", ui-monospace, monospace', baseSize: 10, sectionTitleStyle: "underline", sectionTitleTransform: "none", accentBar: false, bulletStyle: "square" },
  }),

  tpl({
    id: "stripeStyle",
    name: "Stripe",
    description: "Editorial premium look with indigo/purple accents.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "awards"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#635bff", primary: "#0a2540", muted: "#425466", divider: "#e6e6ef", headingFont: '"Inter", sans-serif', bodyFont: '"Inter", sans-serif', sectionTitleStyle: "bar", accentBar: true, radius: 10 },
    spacing: { ...baseSpacing, sidebarWidth: 230, sectionGap: 18 },
  }),

  tpl({
    id: "openaiStyle",
    name: "OpenAI",
    description: "Calm AI aesthetic — green accent, rounded, generous spacing.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "publications", "skills", "education"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#10a37f", primary: "#202123", muted: "#6e6e80", divider: "#ececf1", headingFont: '"Inter", sans-serif', bodyFont: '"Inter", sans-serif', sectionTitleStyle: "plain", sectionTitleTransform: "none", accentBar: false, radius: 10 },
    spacing: { ...baseSpacing, sectionGap: 22 },
  }),

  tpl({
    id: "canvaPremium",
    name: "Canva Premium",
    description: "Colorful yet ATS-safe, coral accent, rounded blocks.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "awards"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#00c4cc", primary: "#2d3436", divider: "#dfe6e9", headingFont: '"Poppins", Inter, sans-serif', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "chip", accentBar: false, radius: 10 },
    spacing: { ...baseSpacing, sidebarWidth: 230 },
  }),

  tpl({
    id: "enhancvInspired",
    name: "Enhancv",
    description: "Achievement-forward with tinted skill cards and timeline.",
    layout: "rightSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages", "certifications"],
    mainSections: ["summary", "experience", "projects", "education", "awards"],
    theme: { ...baseTheme, accent: "#2b6cb0", primary: "#1a202c", sidebarBg: "#edf2f7", sidebarText: "#1a202c", headingFont: 'Inter, sans-serif', sectionTitleStyle: "bar", accentBar: true },
    spacing: { ...baseSpacing, sidebarWidth: 240 },
  }),

  tpl({
    id: "novoresumeInspired",
    name: "Novoresume",
    description: "Corporate two-column with elegant hierarchy and blue accent.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages", "certifications"],
    mainSections: ["summary", "experience", "education", "projects", "awards"],
    theme: { ...baseTheme, accent: "#2c5282", primary: "#1a365d", sidebarBg: "#2c5282", sidebarText: "#f7fafc", headingFont: 'Inter, sans-serif', sectionTitleStyle: "underline", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 240, sidebarPadding: 24 },
  }),

  tpl({
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Soft translucent card feel with pastel divider tones.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#8b5cf6", primary: "#1e1b4b", sidebarBg: "#f5f3ff", divider: "#ddd6fe", headingFont: 'Inter, sans-serif', sectionTitleStyle: "chip", accentBar: false, radius: 14 },
    spacing: { ...baseSpacing, sidebarWidth: 230, sectionGap: 18 },
  }),

  tpl({
    id: "neoBrutalism",
    name: "Neo Brutalism",
    description: "Bold borders, high contrast, punchy yellow accent.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills"],
    headerSections: [],
    theme: { ...baseTheme, accent: "#facc15", primary: "#000", text: "#000", divider: "#000", headingFont: '"Space Grotesk", Inter, sans-serif', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "chip", sectionTitleTransform: "uppercase", accentBar: true, bulletStyle: "square", radius: 0 },
    spacing: { ...baseSpacing, sectionGap: 18 },
  }),

  tpl({
    id: "bentoGrid",
    name: "Bento Grid",
    description: "Modular three-column bento card layout.",
    layout: "headerThreeCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience"],
    sidebarSections: ["projects", "education"],
    secondSidebarSections: ["skills", "certifications", "languages", "awards"],
    theme: { ...baseTheme, accent: "#0ea5e9", primary: "#0f172a", sidebarBg: "#f8fafc", headingFont: 'Inter, sans-serif', sectionTitleStyle: "chip", accentBar: false, radius: 12 },
    spacing: { ...baseSpacing, sidebarWidth: 190, columnGap: 16, sectionGap: 14 },
  }),

  tpl({
    id: "timelineProfessional",
    name: "Timeline Professional",
    description: "Premium vertical timeline with large company names.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "education", "skills", "certifications"],
    theme: { ...baseTheme, accent: "#1e40af", primary: "#0f172a", sidebarBg: "transparent", headingFont: 'Inter, sans-serif', sectionTitleStyle: "bar", accentBar: true, bulletStyle: "dot" },
    spacing: { ...baseSpacing, sidebarWidth: 180, sectionGap: 20 },
  }),

  tpl({
    id: "magazineStyle",
    name: "Magazine",
    description: "Editorial magazine layout with big serif headlines.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "publications"],
    sidebarSections: ["skills", "education", "awards", "languages"],
    theme: { ...baseTheme, accent: "#111", primary: "#111", divider: "#111", headingFont: '"Fraunces", "Playfair Display", Georgia, serif', bodyFont: 'Georgia, serif', sectionTitleStyle: "underline", sectionTitleTransform: "uppercase", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 210, sectionGap: 20 },
  }),

  tpl({
    id: "corporatePremium",
    name: "Corporate Premium",
    description: "Fortune-500 corporate with executive summary emphasis.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "awards"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#1f2937", primary: "#111827", divider: "#9ca3af", headingFont: '"IBM Plex Serif", Georgia, serif', bodyFont: 'Inter, sans-serif', sectionTitleStyle: "underline", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 220, sectionGap: 18 },
  }),

  tpl({
    id: "darkMode",
    name: "Dark Mode",
    description: "Charcoal background with blue accents; light print fallback.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages", "certifications"],
    mainSections: ["summary", "experience", "projects", "education"],
    theme: { ...baseTheme, accent: "#60a5fa", primary: "#0b1220", sidebarBg: "#111827", sidebarText: "#e5e7eb", headingFont: 'Inter, sans-serif', sectionTitleStyle: "bar", accentBar: true, radius: 10 },
    spacing: { ...baseSpacing, sidebarWidth: 250, sidebarPadding: 24 },
  }),

  tpl({
    id: "luxuryExecutive",
    name: "Luxury Executive",
    description: "Board-level layout, IBM Plex Serif headings, gold divider.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "awards", "publications"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: { ...baseTheme, accent: "#000", primary: "#000", divider: "#c9a86a", headingFont: '"IBM Plex Serif", Georgia, serif', bodyFont: '"Inter", sans-serif', sectionTitleStyle: "underline", sectionTitleTransform: "uppercase", accentBar: false },
    spacing: { ...baseSpacing, sidebarWidth: 230, sectionGap: 22, pageMarginTop: 48, pageMarginBottom: 48 },
  }),
];


// --- Templates with header background & avatar treatments ----------------
templates.push(
  tpl({
    id: "navyHeaderBanner",
    name: "Navy Header Banner",
    description: "Full-width navy header banner with initials avatar on the left.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: {
      ...baseTheme,
      accent: "#38bdf8",
      primary: "#0f172a",
      headerBg: "#0b1f3a",
      headerText: "#f8fafc",
      headerRadius: 12,
      avatar: "initials",
      avatarPlacement: "left",
      avatarBg: "#38bdf8",
      avatarText: "#0b1f3a",
      sectionTitleStyle: "bar",
      accentBar: true,
      headingFont: 'Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sidebarWidth: 230, sectionGap: 18 },
  }),
  tpl({
    id: "centeredAvatarClean",
    name: "Centered Avatar",
    description: "Centered avatar & name over a clean single column.",
    layout: "single",
    mainSections: ["profile", "summary", "experience", "projects", "education", "skills"],
    headerSections: [],
    theme: {
      ...baseTheme,
      accent: "#7c3aed",
      primary: "#111827",
      avatar: "initials",
      avatarPlacement: "center",
      avatarBg: "#7c3aed",
      avatarText: "#fff",
      avatarSize: 84,
      sectionTitleStyle: "underline",
      accentBar: false,
      headingFont: '"Space Grotesk", Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sectionGap: 20 },
  }),
  tpl({
    id: "emeraldHeaderCard",
    name: "Emerald Header Card",
    description: "Rounded emerald header card with right-aligned avatar.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "awards"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: {
      ...baseTheme,
      accent: "#059669",
      primary: "#064e3b",
      headerBg: "#065f46",
      headerText: "#ecfdf5",
      headerRadius: 16,
      avatar: "initials",
      avatarPlacement: "right",
      avatarBg: "#ecfdf5",
      avatarText: "#065f46",
      sectionTitleStyle: "chip",
      accentBar: false,
      radius: 10,
      headingFont: 'Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sidebarWidth: 230, sectionGap: 18 },
  }),
  tpl({
    id: "splitContactMain",
    name: "Split Contact & Main",
    description: "Dark left sidebar with avatar + all contact details, main content on the right.",
    layout: "leftSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages", "certifications"],
    mainSections: ["summary", "experience", "projects", "education", "awards"],
    theme: {
      ...baseTheme,
      accent: "#f59e0b",
      primary: "#0f172a",
      sidebarBg: "#111827",
      sidebarText: "#f9fafb",
      avatar: "initials",
      avatarPlacement: "left",
      avatarBg: "#f59e0b",
      avatarText: "#111827",
      avatarSize: 76,
      sectionTitleStyle: "bar",
      accentBar: true,
      headingFont: 'Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sidebarWidth: 260, sidebarPadding: 24, sectionGap: 16 },
  }),
  tpl({
    id: "rightContactCard",
    name: "Right Contact Card",
    description: "Name & summary on the left, tinted contact card on the right.",
    layout: "rightSidebar",
    headerSections: [],
    sidebarSections: ["profile", "skills", "languages"],
    mainSections: ["summary", "experience", "projects", "education", "certifications", "awards"],
    theme: {
      ...baseTheme,
      accent: "#0ea5e9",
      primary: "#0c4a6e",
      sidebarBg: "#f0f9ff",
      sidebarText: "#0c4a6e",
      avatar: "initials",
      avatarPlacement: "left",
      avatarBg: "#0ea5e9",
      avatarText: "#fff",
      sectionTitleStyle: "underline",
      accentBar: false,
      headingFont: 'Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sidebarWidth: 250, sidebarPadding: 22 },
  }),
  tpl({
    id: "gradientHeader",
    name: "Gradient Header",
    description: "Warm gradient-style header banner with centered avatar.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: {
      ...baseTheme,
      accent: "#f43f5e",
      primary: "#4c0519",
      headerBg: "linear-gradient(135deg, #f43f5e 0%, #f97316 100%)",
      headerText: "#fff",
      headerRadius: 14,
      avatar: "initials",
      avatarPlacement: "center",
      avatarBg: "#fff",
      avatarText: "#be123c",
      avatarSize: 80,
      sectionTitleStyle: "bar",
      accentBar: true,
      headingFont: '"Poppins", Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sidebarWidth: 220, sectionGap: 18 },
  }),
  tpl({
    id: "monoBlackHeader",
    name: "Mono Black Header",
    description: "Bold black banner header with square avatar-initials and Space Grotesk type.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
    theme: {
      ...baseTheme,
      accent: "#facc15",
      primary: "#000",
      headerBg: "#0a0a0a",
      headerText: "#fafafa",
      headerRadius: 4,
      avatar: "initials",
      avatarPlacement: "left",
      avatarBg: "#facc15",
      avatarText: "#000",
      sectionTitleStyle: "plain",
      sectionTitleTransform: "uppercase",
      accentBar: false,
      bulletStyle: "square",
      headingFont: '"Space Grotesk", Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sidebarWidth: 220 },
  }),
  tpl({
    id: "creamAvatarBook",
    name: "Cream Avatar Book",
    description: "Warm cream palette, editorial serif, purple initials avatar left of a two-column body.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "publications"],
    sidebarSections: ["skills", "education", "certifications", "languages", "awards"],
    theme: {
      ...baseTheme,
      accent: "#7c3aed",
      primary: "#1f1147",
      headerBg: "#fdf6ec",
      headerText: "#1f1147",
      headerRadius: 12,
      avatar: "initials",
      avatarPlacement: "left",
      avatarBg: "#7c3aed",
      avatarText: "#fff",
      avatarSize: 74,
      sectionTitleStyle: "underline",
      accentBar: false,
      headingFont: '"Fraunces", Georgia, serif',
      bodyFont: 'Inter, sans-serif',
      divider: "#e5d5c0",
    },
    spacing: { ...baseSpacing, sidebarWidth: 220, sectionGap: 20 },
  }),
  tpl({
    id: "timelineLeftAvatar",
    name: "Timeline Left Avatar",
    description: "Left profile avatar in a dark navy sidebar, timeline dot section titles on the main column.",
    layout: "leftSidebar",
    headerSections: [],
    mainSections: ["summary", "experience", "projects", "education", "certifications"],
    sidebarSections: ["profile", "skills", "languages", "awards"],
    theme: {
      ...baseTheme,
      primary: "#0b1220",
      accent: "#38bdf8",
      sidebarBg: "#0b1220",
      sidebarText: "#e2e8f0",
      divider: "#1e293b",
      avatar: "initials",
      avatarPlacement: "center",
      avatarBg: "#38bdf8",
      avatarText: "#0b1220",
      avatarSize: 84,
      sectionTitleStyle: "bar",
      accentBar: true,
      headingFont: '"Space Grotesk", Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sidebarWidth: 230, sidebarPadding: 26 },
  }),
  tpl({
    id: "folderTabRight",
    name: "Folder Tab Right",
    description: "Emerald right sidebar acts as a folder tab holding contact, skills, and languages.",
    layout: "rightSidebar",
    headerSections: [],
    mainSections: ["summary", "experience", "projects", "education", "publications"],
    sidebarSections: ["profile", "skills", "languages", "certifications", "awards"],
    theme: {
      ...baseTheme,
      primary: "#064e3b",
      accent: "#10b981",
      sidebarBg: "#064e3b",
      sidebarText: "#ecfdf5",
      divider: "#a7f3d0",
      avatar: "initials",
      avatarPlacement: "center",
      avatarBg: "#10b981",
      avatarText: "#052e2b",
      avatarSize: 72,
      sectionTitleStyle: "chip",
      accentBar: false,
      headingFont: '"Manrope", Inter, sans-serif',
      radius: 6,
    },
    spacing: { ...baseSpacing, sidebarWidth: 220, sidebarPadding: 24 },
  }),
  tpl({
    id: "verticalTimeline",
    name: "Vertical Timeline",
    description: "Left accent bar section titles create a vertical timeline down the page.",
    layout: "single",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "education", "skills", "certifications"],
    theme: {
      ...baseTheme,
      primary: "#1e1b4b",
      accent: "#6366f1",
      divider: "#c7d2fe",
      headerBg: "#eef2ff",
      headerText: "#1e1b4b",
      headerRadius: 10,
      avatar: "initials",
      avatarPlacement: "left",
      avatarBg: "#6366f1",
      avatarText: "#fff",
      avatarSize: 70,
      sectionTitleStyle: "bar",
      accentBar: true,
      headingFont: '"Sora", Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sectionGap: 18 },
  }),
  tpl({
    id: "amberFolderCorner",
    name: "Amber Folder Corner",
    description: "Warm amber header band with a left profile avatar and rounded folder-corner accents.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "publications"],
    sidebarSections: ["skills", "education", "certifications", "languages", "awards"],
    theme: {
      ...baseTheme,
      primary: "#78350f",
      accent: "#d97706",
      divider: "#fde68a",
      headerBg: "#fef3c7",
      headerText: "#78350f",
      headerRadius: 14,
      avatar: "initials",
      avatarPlacement: "left",
      avatarBg: "#d97706",
      avatarText: "#fff",
      avatarSize: 78,
      sectionTitleStyle: "underline",
      accentBar: false,
      headingFont: '"Fraunces", Georgia, serif',
      bodyFont: 'Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sidebarWidth: 220, sectionGap: 18 },
  }),
  tpl({
    id: "monoTimelineDev",
    name: "Mono Timeline Dev",
    description: "Monospace developer resume with a lime timeline bar and left avatar block.",
    layout: "headerTwoCol",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "education"],
    sidebarSections: ["skills", "certifications", "awards", "languages"],
    theme: {
      ...baseTheme,
      primary: "#0f172a",
      accent: "#84cc16",
      divider: "#e2e8f0",
      headerBg: "#0f172a",
      headerText: "#f8fafc",
      headerRadius: 6,
      avatar: "initials",
      avatarPlacement: "left",
      avatarBg: "#84cc16",
      avatarText: "#0f172a",
      avatarSize: 72,
      sectionTitleStyle: "bar",
      accentBar: true,
      headingFont: '"JetBrains Mono", ui-monospace, monospace',
      bodyFont: 'Inter, sans-serif',
      radius: 3,
    },
    spacing: { ...baseSpacing, sidebarWidth: 210, sectionGap: 16 },
  }),
  tpl({
    id: "roseFolderStripe",
    name: "Rose Folder Stripe",
    description: "Full-width rose header ribbon with a centered avatar and clean single-column body.",
    layout: "single",
    headerSections: ["profile"],
    mainSections: ["summary", "experience", "projects", "education", "skills", "awards"],
    theme: {
      ...baseTheme,
      primary: "#881337",
      accent: "#e11d48",
      divider: "#fecdd3",
      headerBg: "linear-gradient(135deg, #fb7185, #e11d48)",
      headerText: "#fff",
      headerRadius: 0,
      avatar: "initials",
      avatarPlacement: "center",
      avatarBg: "#fff",
      avatarText: "#e11d48",
      avatarSize: 88,
      sectionTitleStyle: "underline",
      accentBar: false,
      headingFont: '"Playfair Display", Georgia, serif',
      bodyFont: 'Inter, sans-serif',
    },
    spacing: { ...baseSpacing, sectionGap: 18, pageMarginTop: 0 },
  }),
);

export const templateById = new Map(templates.map((t) => [t.id, t]));



export function getTemplate(id: string): Template {
  return templateById.get(id) ?? templates[0];
}
