// Document Model: convert typed Resume data into an ordered list of Blocks
// grouped by section. Blocks are the unit of layout & measurement.
// The renderer knows how to draw each Block kind but never inspects Resume data.

import type { CSSProperties } from "react";
import type { Resume } from "./schema";
import type { SectionId, Template, Theme } from "./templates";

export type Block =
  | { kind: "sectionTitle"; text: string }
  | { kind: "profileHeader"; profile: Resume["profile"] }
  | { kind: "contactStack"; profile: Resume["profile"] }
  | { kind: "summary"; text: string }
  | { kind: "entry"; entry: EntryData }
  | { kind: "entryContinuation"; entry: EntryData; bullets: string[]; showTitle: boolean }
  | { kind: "skillGroup"; category: string; items: string[] }
  | { kind: "skillGrid"; groups: { category: string; items: string[] }[] }
  | { kind: "chipList"; items: string[] }
  | { kind: "keyValueList"; rows: { key: string; value: string }[] }
  | { kind: "textLine"; text: string; muted?: boolean }
  | { kind: "divider" };

export type EntryData = {
  title: string;
  subtitle: string;
  meta: string; // right-side (dates, location)
  metaSub?: string;
  bullets: string[];
  tech: string[];
  description?: string;
};

export type BlockGroup = {
  id: string;
  section: SectionId;
  blocks: Block[];
  // Splittable groups can be broken across pages by the paginator (bullet lists,
  // long entry sequences). Non-splittable groups move as one.
  splittable: boolean;
};

function fmtRange(start: string, end: string, current: boolean): string {
  if (!start && !end && !current) return "";
  const e = current ? "Present" : end;
  if (start && e) return `${start} — ${e}`;
  return start || e;
}

function experienceEntries(resume: Resume): EntryData[] {
  return resume.experience.map((x) => ({
    title: x.role || x.company,
    subtitle: [x.company, x.location].filter(Boolean).join(" · "),
    meta: fmtRange(x.start, x.end, x.current),
    bullets: x.bullets,
    tech: x.tech,
    description: x.summary,
  }));
}

function projectEntries(resume: Resume): EntryData[] {
  return resume.projects.map((p) => ({
    title: p.name,
    subtitle: [p.role, p.url].filter(Boolean).join(" · "),
    meta: "",
    bullets: p.bullets,
    tech: p.tech,
    description: p.description,
  }));
}

function educationEntries(resume: Resume): EntryData[] {
  return resume.education.map((e) => ({
    title: [e.degree, e.field].filter(Boolean).join(" · "),
    subtitle: [e.school, e.location].filter(Boolean).join(" · "),
    meta: fmtRange(e.start, e.end, false),
    metaSub: e.gpa ? `GPA ${e.gpa}` : undefined,
    bullets: e.notes ? [e.notes] : [],
    tech: [],
  }));
}

function titleFor(id: SectionId): string {
  switch (id) {
    case "summary":
      return "Summary";
    case "experience":
      return "Experience";
    case "projects":
      return "Projects";
    case "education":
      return "Education";
    case "skills":
      return "Skills";
    case "certifications":
      return "Certifications";
    case "languages":
      return "Languages";
    case "awards":
      return "Awards";
    case "publications":
      return "Publications";
    case "references":
      return "References";
    case "profile":
      return "Profile";
  }
}

// Build the groups for one section id. Returns [] if the section has no data.
export function buildSectionGroups(
  resume: Resume,
  section: SectionId,
  variant: "main" | "sidebar" | "header",
): BlockGroup[] {
  const groups: BlockGroup[] = [];
  const title = titleFor(section);

  const sectionTitleBlock: Block = { kind: "sectionTitle", text: title };

  switch (section) {
    case "profile": {
      if (variant === "sidebar") {
        groups.push({
          id: `${section}:contact`,
          section,
          splittable: false,
          blocks: [{ kind: "contactStack", profile: resume.profile }],
        });
      } else {
        groups.push({
          id: `${section}:header`,
          section,
          splittable: false,
          blocks: [{ kind: "profileHeader", profile: resume.profile }],
        });
      }
      return groups;
    }
    case "summary": {
      if (!resume.summary.trim()) return [];
      groups.push({
        id: `${section}:body`,
        section,
        splittable: true, // long summaries can wrap across pages
        blocks: [sectionTitleBlock, { kind: "summary", text: resume.summary }],
      });
      return groups;
    }
    case "experience":
    case "projects":
    case "education": {
      const entries =
        section === "experience"
          ? experienceEntries(resume)
          : section === "projects"
          ? projectEntries(resume)
          : educationEntries(resume);
      if (entries.length === 0) return [];
      // Header group: title alone, keeps with first entry via pagination rule.
      groups.push({
        id: `${section}:title`,
        section,
        splittable: false,
        blocks: [sectionTitleBlock],
      });
      entries.forEach((entry, i) => {
        groups.push({
          id: `${section}:entry:${i}`,
          section,
          splittable: entry.bullets.length > 1,
          blocks: [{ kind: "entry", entry }],
        });
      });
      return groups;
    }
    case "skills": {
      if (resume.skills.length === 0) return [];
      if (variant === "sidebar") {
        groups.push({
          id: `${section}:title`,
          section,
          splittable: false,
          blocks: [sectionTitleBlock],
        });
        resume.skills.forEach((g, i) => {
          if (g.items.length === 0) return;
          groups.push({
            id: `${section}:group:${i}`,
            section,
            splittable: false,
            blocks: [{ kind: "skillGroup", category: g.category, items: g.items }],
          });
        });
      } else {
        groups.push({
          id: `${section}:body`,
          section,
          splittable: false,
          blocks: [
            sectionTitleBlock,
            { kind: "skillGrid", groups: resume.skills.filter((s) => s.items.length) },
          ],
        });
      }
      return groups;
    }
    case "certifications": {
      if (resume.certifications.length === 0) return [];
      groups.push({
        id: `${section}:title`,
        section,
        splittable: false,
        blocks: [sectionTitleBlock],
      });
      resume.certifications.forEach((c, i) => {
        groups.push({
          id: `${section}:item:${i}`,
          section,
          splittable: false,
          blocks: [
            {
              kind: "keyValueList",
              rows: [
                {
                  key: c.name,
                  value: [c.issuer, c.date].filter(Boolean).join(" · "),
                },
              ],
            },
          ],
        });
      });
      return groups;
    }
    case "languages": {
      if (resume.languages.length === 0) return [];
      groups.push({
        id: `${section}:body`,
        section,
        splittable: false,
        blocks: [
          sectionTitleBlock,
          {
            kind: "keyValueList",
            rows: resume.languages.map((l) => ({ key: l.name, value: l.level })),
          },
        ],
      });
      return groups;
    }
    case "awards": {
      if (resume.awards.length === 0) return [];
      groups.push({
        id: `${section}:title`,
        section,
        splittable: false,
        blocks: [sectionTitleBlock],
      });
      resume.awards.forEach((a, i) => {
        groups.push({
          id: `${section}:item:${i}`,
          section,
          splittable: false,
          blocks: [
            {
              kind: "entry",
              entry: {
                title: a.title,
                subtitle: a.issuer,
                meta: a.date,
                bullets: a.description ? [a.description] : [],
                tech: [],
              },
            },
          ],
        });
      });
      return groups;
    }
    case "publications": {
      if (resume.publications.length === 0) return [];
      groups.push({
        id: `${section}:title`,
        section,
        splittable: false,
        blocks: [sectionTitleBlock],
      });
      resume.publications.forEach((p, i) => {
        groups.push({
          id: `${section}:item:${i}`,
          section,
          splittable: false,
          blocks: [
            {
              kind: "entry",
              entry: {
                title: p.title,
                subtitle: [p.publisher, p.url].filter(Boolean).join(" · "),
                meta: p.date,
                bullets: p.description ? [p.description] : [],
                tech: [],
              },
            },
          ],
        });
      });
      return groups;
    }
    case "references": {
      if (resume.references.length === 0) return [];
      groups.push({
        id: `${section}:body`,
        section,
        splittable: false,
        blocks: [
          sectionTitleBlock,
          {
            kind: "keyValueList",
            rows: resume.references.map((r) => ({
              key: r.name,
              value: [r.role, r.company, r.email, r.phone].filter(Boolean).join(" · "),
            })),
          },
        ],
      });
      return groups;
    }
  }
}

export function buildGroupsFor(
  resume: Resume,
  sections: SectionId[],
  variant: "main" | "sidebar" | "header",
): BlockGroup[] {
  return sections.flatMap((id) => buildSectionGroups(resume, id, variant));
}

// Style helpers derived from the theme, shared by preview and print renderers.
export function themeCssVars(t: Theme): CSSProperties {
  return {
    // typed as CSS custom properties
    ["--r-primary" as never]: t.primary,
    ["--r-accent" as never]: t.accent,
    ["--r-text" as never]: t.text,
    ["--r-muted" as never]: t.muted,
    ["--r-divider" as never]: t.divider,
    ["--r-sidebar-bg" as never]: t.sidebarBg,
    ["--r-sidebar-text" as never]: t.sidebarText,
    ["--r-heading-font" as never]: t.headingFont,
    ["--r-body-font" as never]: t.bodyFont,
    ["--r-base-size" as never]: `${t.baseSize}px`,
    ["--r-heading-weight" as never]: String(t.headingWeight),
    ["--r-radius" as never]: `${t.radius}px`,
  };
}

export function templateContext(template: Template) {
  return { theme: template.theme, spacing: template.spacing };
}
