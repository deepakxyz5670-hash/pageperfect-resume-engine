// Block renderer. Pure presentation: given a Block, draw it.
// The same component is used by the measurement pass and the on-page render,
// which guarantees measurement matches rendered layout exactly.

import type { CSSProperties } from "react";
import { Mail, Phone, MapPin, Globe, Link as LinkIcon } from "lucide-react";
import type { Block } from "./model";
import type { Theme, Spacing } from "./templates";

type Ctx = {
  theme: Theme;
  spacing: Spacing;
  variant: "main" | "sidebar" | "header";
};

function sectionTitleStyle(theme: Theme, variant: Ctx["variant"]): CSSProperties {
  const base: CSSProperties = {
    fontFamily: "var(--r-heading-font)",
    fontWeight: theme.headingWeight,
    color: variant === "sidebar" && theme.sidebarBg !== "transparent" ? theme.sidebarText : theme.primary,
    fontSize: `${theme.baseSize + 1.5}px`,
    letterSpacing: theme.sectionTitleTransform === "uppercase" ? "0.08em" : "normal",
    textTransform: theme.sectionTitleTransform,
    margin: 0,
    paddingBottom: 4,
    lineHeight: 1.2,
  };
  if (theme.sectionTitleStyle === "underline") {
    return { ...base, borderBottom: `1px solid ${theme.divider}`, paddingBottom: 3 };
  }
  if (theme.sectionTitleStyle === "bar") {
    return {
      ...base,
      paddingLeft: 10,
      borderLeft: theme.accentBar ? `3px solid ${theme.accent}` : "none",
    };
  }
  if (theme.sectionTitleStyle === "chip") {
    return {
      ...base,
      display: "inline-block",
      background: theme.accent,
      color: "#fff",
      padding: "3px 10px",
      borderRadius: theme.radius,
    };
  }
  return base;
}

function bulletChar(theme: Theme): string {
  if (theme.bulletStyle === "dash") return "–";
  if (theme.bulletStyle === "square") return "▪";
  return "•";
}

export function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  const { theme, spacing, variant } = ctx;
  const isSidebarTinted = variant === "sidebar" && theme.sidebarBg !== "transparent";
  const textColor = isSidebarTinted ? theme.sidebarText : theme.text;
  const mutedColor = isSidebarTinted ? theme.sidebarText : theme.muted;

  switch (block.kind) {
    case "sectionTitle":
      return <h2 style={sectionTitleStyle(theme, variant)}>{block.text}</h2>;

    case "profileHeader": {
      const p = block.profile;
      const items = [
        p.email && { icon: Mail, text: p.email },
        p.phone && { icon: Phone, text: p.phone },
        p.location && { icon: MapPin, text: p.location },
        p.website && { icon: Globe, text: p.website },
        ...p.links.map((l) => ({ icon: LinkIcon, text: `${l.label}: ${l.url}` })),
      ].filter(Boolean) as { icon: typeof Mail; text: string }[];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: "var(--r-heading-font)",
              fontSize: `${theme.baseSize + 12}px`,
              fontWeight: theme.headingWeight,
              color: theme.primary,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            {p.fullName || "Your Name"}
          </div>
          {p.headline && (
            <div
              style={{
                fontFamily: "var(--r-body-font)",
                fontSize: `${theme.baseSize + 1}px`,
                color: theme.accent,
                fontWeight: 500,
              }}
            >
              {p.headline}
            </div>
          )}
          {items.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 14px",
                color: mutedColor,
                fontSize: `${theme.baseSize - 0.5}px`,
                marginTop: 2,
              }}
            >
              {items.map((it, i) => (
                <span
                  key={i}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <it.icon size={11} strokeWidth={2} />
                  <span>{it.text}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "contactStack": {
      const p = block.profile;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: "var(--r-heading-font)",
              fontSize: `${theme.baseSize + 8}px`,
              fontWeight: theme.headingWeight,
              color: isSidebarTinted ? theme.sidebarText : theme.primary,
              lineHeight: 1.15,
            }}
          >
            {p.fullName || "Your Name"}
          </div>
          {p.headline && (
            <div
              style={{
                fontSize: `${theme.baseSize}px`,
                color: isSidebarTinted ? theme.sidebarText : theme.accent,
                fontWeight: 500,
              }}
            >
              {p.headline}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              color: mutedColor,
              fontSize: `${theme.baseSize - 0.5}px`,
              marginTop: 4,
            }}
          >
            {p.email && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={11} /> {p.email}
              </span>
            )}
            {p.phone && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Phone size={11} /> {p.phone}
              </span>
            )}
            {p.location && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={11} /> {p.location}
              </span>
            )}
            {p.website && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Globe size={11} /> {p.website}
              </span>
            )}
            {p.links.map((l, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LinkIcon size={11} /> {l.label}: {l.url}
              </span>
            ))}
          </div>
        </div>
      );
    }

    case "summary":
      return (
        <p
          style={{
            margin: 0,
            fontSize: `${theme.baseSize}px`,
            lineHeight: 1.5,
            color: textColor,
          }}
        >
          {block.text}
        </p>
      );

    case "entry":
    case "entryContinuation": {
      const entry = block.entry;
      const bullets =
        block.kind === "entryContinuation" ? block.bullets : entry.bullets;
      const showHeader = block.kind === "entry" || block.showTitle;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {showHeader && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "baseline",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--r-heading-font)",
                    fontSize: `${theme.baseSize + 0.5}px`,
                    fontWeight: 600,
                    color: textColor,
                  }}
                >
                  {entry.title}
                  {block.kind === "entryContinuation" && (
                    <span style={{ fontWeight: 400, color: mutedColor }}> (cont.)</span>
                  )}
                </div>
                {entry.meta && (
                  <div
                    style={{
                      fontSize: `${theme.baseSize - 0.5}px`,
                      color: mutedColor,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.meta}
                  </div>
                )}
              </div>
              {(entry.subtitle || entry.metaSub) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    fontSize: `${theme.baseSize - 0.5}px`,
                    color: mutedColor,
                  }}
                >
                  <span>{entry.subtitle}</span>
                  {entry.metaSub && <span>{entry.metaSub}</span>}
                </div>
              )}
            </>
          )}
          {entry.description && showHeader && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: `${theme.baseSize}px`,
                lineHeight: 1.45,
                color: textColor,
              }}
            >
              {entry.description}
            </p>
          )}
          {bullets.length > 0 && (
            <ul
              style={{
                margin: "4px 0 0",
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: spacing.bulletGap,
              }}
            >
              {bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "12px 1fr",
                    gap: 6,
                    fontSize: `${theme.baseSize}px`,
                    lineHeight: 1.45,
                    color: textColor,
                  }}
                >
                  <span style={{ color: theme.accent, lineHeight: 1.45 }}>
                    {bulletChar(theme)}
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {entry.tech.length > 0 && showHeader && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginTop: 4,
              }}
            >
              {entry.tech.map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: `${theme.baseSize - 1.5}px`,
                    padding: "2px 6px",
                    background: `${theme.accent}14`,
                    color: theme.accent,
                    borderRadius: theme.radius,
                    lineHeight: 1.2,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "skillGroup":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div
            style={{
              fontSize: `${theme.baseSize - 0.5}px`,
              fontWeight: 600,
              color: isSidebarTinted ? theme.sidebarText : theme.primary,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {block.category}
          </div>
          <div
            style={{
              fontSize: `${theme.baseSize}px`,
              color: textColor,
              lineHeight: 1.45,
            }}
          >
            {block.items.join(", ")}
          </div>
        </div>
      );

    case "skillGrid":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 14,
            rowGap: 4,
          }}
        >
          {block.groups.map((g, i) => (
            <div key={i} style={{ display: "contents" }}>
              <div
                style={{
                  fontSize: `${theme.baseSize - 0.5}px`,
                  fontWeight: 600,
                  color: theme.primary,
                  whiteSpace: "nowrap",
                }}
              >
                {g.category}
              </div>
              <div
                style={{
                  fontSize: `${theme.baseSize}px`,
                  color: textColor,
                  lineHeight: 1.45,
                }}
              >
                {g.items.join(", ")}
              </div>
            </div>
          ))}
        </div>
      );

    case "chipList":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {block.items.map((it, i) => (
            <span
              key={i}
              style={{
                fontSize: `${theme.baseSize - 1}px`,
                padding: "2px 8px",
                borderRadius: theme.radius,
                background: `${theme.accent}18`,
                color: theme.accent,
              }}
            >
              {it}
            </span>
          ))}
        </div>
      );

    case "keyValueList":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {block.rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                fontSize: `${theme.baseSize}px`,
                color: textColor,
                lineHeight: 1.4,
              }}
            >
              <span style={{ fontWeight: 500 }}>{r.key}</span>
              {r.value && (
                <span style={{ color: mutedColor, textAlign: "right" }}>
                  {r.value}
                </span>
              )}
            </div>
          ))}
        </div>
      );

    case "textLine":
      return (
        <div
          style={{
            fontSize: `${theme.baseSize}px`,
            color: block.muted ? mutedColor : textColor,
            lineHeight: 1.45,
          }}
        >
          {block.text}
        </div>
      );

    case "divider":
      return (
        <div style={{ height: 1, background: theme.divider, width: "100%" }} />
      );
  }
}
