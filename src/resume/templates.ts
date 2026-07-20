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
];

export const templateById = new Map(templates.map((t) => [t.id, t]));

export function getTemplate(id: string): Template {
  return templateById.get(id) ?? templates[0];
}
