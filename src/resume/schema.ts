// Resume data schema. Data is independent from templates and rendering.
// Any missing field is normalized to a safe default so the builder never crashes.

import { z } from "zod";

const link = z.object({
  label: z.string().default(""),
  url: z.string().default(""),
});

const experience = z.object({
  company: z.string().default(""),
  role: z.string().default(""),
  location: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  current: z.boolean().default(false),
  summary: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  tech: z.array(z.string()).default([]),
});

const project = z.object({
  name: z.string().default(""),
  role: z.string().default(""),
  url: z.string().default(""),
  description: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  tech: z.array(z.string()).default([]),
});

const education = z.object({
  school: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  location: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  gpa: z.string().default(""),
  notes: z.string().default(""),
});

const skillGroup = z.object({
  category: z.string().default(""),
  items: z.array(z.string()).default([]),
});

const certification = z.object({
  name: z.string().default(""),
  issuer: z.string().default(""),
  date: z.string().default(""),
  url: z.string().default(""),
});

const language = z.object({
  name: z.string().default(""),
  level: z.string().default(""),
});

const award = z.object({
  title: z.string().default(""),
  issuer: z.string().default(""),
  date: z.string().default(""),
  description: z.string().default(""),
});

const publication = z.object({
  title: z.string().default(""),
  publisher: z.string().default(""),
  date: z.string().default(""),
  url: z.string().default(""),
  description: z.string().default(""),
});

const reference = z.object({
  name: z.string().default(""),
  role: z.string().default(""),
  company: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
});

export const resumeSchema = z.object({
  profile: z
    .object({
      fullName: z.string().default(""),
      headline: z.string().default(""),
      email: z.string().default(""),
      phone: z.string().default(""),
      location: z.string().default(""),
      website: z.string().default(""),
      links: z.array(link).default([]),
    })
    .default({
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      links: [],
    }),
  summary: z.string().default(""),
  experience: z.array(experience).default([]),
  projects: z.array(project).default([]),
  education: z.array(education).default([]),
  skills: z.array(skillGroup).default([]),
  certifications: z.array(certification).default([]),
  languages: z.array(language).default([]),
  awards: z.array(award).default([]),
  publications: z.array(publication).default([]),
  references: z.array(reference).default([]),
});

export type Resume = z.infer<typeof resumeSchema>;
export type Experience = z.infer<typeof experience>;
export type Project = z.infer<typeof project>;
export type Education = z.infer<typeof education>;
export type SkillGroup = z.infer<typeof skillGroup>;
export type Certification = z.infer<typeof certification>;
export type Language = z.infer<typeof language>;
export type Award = z.infer<typeof award>;
export type Publication = z.infer<typeof publication>;
export type Reference = z.infer<typeof reference>;

// Best-effort field remapping from common alternate shapes (e.g. legacy JSON,
// JSON Resume). Unknown fields are ignored, missing fields fall back to schema
// defaults, so imports never throw.
export function normalizeResume(raw: unknown): Resume {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const basics = (obj.basics ?? {}) as Record<string, unknown>;
  const profileIn = (obj.profile ?? {}) as Record<string, unknown>;

  const mapped: Record<string, unknown> = {
    profile: {
      fullName:
        profileIn.fullName ??
        profileIn.name ??
        (obj as Record<string, unknown>).name ??
        basics.name ??
        "",
      headline: profileIn.headline ?? profileIn.title ?? basics.label ?? "",
      email: profileIn.email ?? basics.email ?? "",
      phone: profileIn.phone ?? basics.phone ?? "",
      location:
        profileIn.location ??
        basics.location ??
        (typeof basics.location === "object" && basics.location
          ? (basics.location as Record<string, unknown>).city
          : "") ??
        "",
      website: profileIn.website ?? basics.website ?? basics.url ?? "",
      links: profileIn.links ?? basics.profiles ?? [],
    },
    summary: obj.summary ?? basics.summary ?? "",
    experience: obj.experience ?? obj.work ?? [],
    projects: obj.projects ?? [],
    education: obj.education ?? [],
    skills: obj.skills ?? [],
    certifications: obj.certifications ?? obj.certificates ?? [],
    languages: obj.languages ?? [],
    awards: obj.awards ?? [],
    publications: obj.publications ?? [],
    references: obj.references ?? [],
  };

  return resumeSchema.parse(mapped);
}

export const sampleResume: Resume = normalizeResume({
  profile: {
    fullName: "Alex Morgan",
    headline: "Senior Product Engineer",
    email: "alex.morgan@example.com",
    phone: "+1 (415) 555-0142",
    location: "San Francisco, CA",
    website: "alexmorgan.dev",
    links: [
      { label: "GitHub", url: "github.com/alexmorgan" },
      { label: "LinkedIn", url: "linkedin.com/in/alexmorgan" },
    ],
  },
  summary:
    "Product engineer with 8+ years shipping consumer and B2B web products. Deep experience in TypeScript, React, and design systems, with a track record of leading small teams from zero-to-one through scale. Comfortable across the stack, biased toward simple systems and shipped work.",
  experience: [
    {
      company: "Northwind Labs",
      role: "Staff Product Engineer",
      location: "Remote",
      start: "2022",
      end: "Present",
      current: true,
      bullets: [
        "Led rebuild of the analytics platform, cutting p95 dashboard load from 6.2s to 780ms.",
        "Designed a plugin runtime enabling 40+ integrations shipped by partner teams in 6 months.",
        "Mentored 5 engineers; introduced a lightweight RFC process now used across the org.",
        "Owned the migration to a monorepo with typed cross-package APIs and preview deployments.",
      ],
      tech: ["TypeScript", "React", "PostgreSQL", "Cloudflare Workers"],
    },
    {
      company: "Kestrel",
      role: "Senior Software Engineer",
      location: "New York, NY",
      start: "2019",
      end: "2022",
      current: false,
      bullets: [
        "Built the core scheduling engine handling 4M events/day with sub-100ms tail latency.",
        "Shipped the initial mobile web experience; grew weekly active users from 12k to 180k.",
        "Reduced infra spend 38% by right-sizing services and moving cold paths to queues.",
      ],
      tech: ["Node.js", "Redis", "React Native Web"],
    },
    {
      company: "Bright Foundry",
      role: "Software Engineer",
      location: "Boston, MA",
      start: "2016",
      end: "2019",
      current: false,
      bullets: [
        "Implemented the design system used across 12 internal apps.",
        "Drove accessibility audit remediation to WCAG 2.1 AA.",
      ],
      tech: ["React", "Sass", "Storybook"],
    },
  ],
  projects: [
    {
      name: "Papercut",
      url: "papercut.app",
      description:
        "Minimalist markdown journal with local-first sync. 8k monthly active users.",
      bullets: [
        "Built CRDT-based sync in a Cloudflare Durable Object.",
        "Featured in Console #124 and Hacker News front page.",
      ],
      tech: ["TypeScript", "Yjs", "Cloudflare"],
    },
    {
      name: "Grid Studio",
      url: "gridstudio.io",
      description:
        "Open-source layout inspector for CSS Grid, 3.4k GitHub stars.",
      bullets: ["Zero-dependency runtime, ships in under 8kb gzipped."],
      tech: ["TypeScript", "Web Components"],
    },
  ],
  education: [
    {
      school: "Carnegie Mellon University",
      degree: "B.S.",
      field: "Computer Science",
      location: "Pittsburgh, PA",
      start: "2012",
      end: "2016",
      gpa: "3.8",
      notes: "Minor in Design. Undergraduate research in HCI.",
    },
  ],
  skills: [
    {
      category: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "Go", "SQL"],
    },
    {
      category: "Frameworks",
      items: ["React", "TanStack", "Node.js", "Next.js", "Vite"],
    },
    {
      category: "Infra",
      items: ["Cloudflare Workers", "PostgreSQL", "Redis", "Docker"],
    },
    { category: "Tooling", items: ["Figma", "Linear", "GitHub Actions"] },
  ],
  certifications: [
    {
      name: "AWS Solutions Architect Associate",
      issuer: "Amazon Web Services",
      date: "2023",
      url: "",
    },
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Professional" },
  ],
  awards: [
    {
      title: "Engineering Excellence Award",
      issuer: "Northwind Labs",
      date: "2024",
      description: "For leading the analytics platform rebuild.",
    },
  ],
  publications: [],
  references: [],
});
