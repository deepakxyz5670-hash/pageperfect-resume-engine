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
  if (theme.sectionTitleStyle === "timeline") {
    // Rendered specially in the sectionTitle case below.
    return { ...base, padding: 0 };
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
    case "sectionTitle": {
      if (theme.sectionTitleStyle === "timeline" && theme.timelineBar) {
        const bar = theme.timelineBar;
        const labelWidth = bar.labelWidth ?? 96;
        const labelGap = bar.labelGap ?? 20;
        const barWidth = bar.width ?? 2;
        // Offset from the main region's left edge (= pageMarginLeft) back
        // to the bar. Bullet centers on the bar; label sits to the left.
        const barOffsetFromMain = spacing.pageMarginLeft - bar.x;
        return (
          <div style={{ position: "relative", minHeight: theme.baseSize + 6 }}>
            {/* Label to the left of the bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: -(barOffsetFromMain + labelGap),
                width: labelWidth,
                textAlign: "right",
                fontFamily: "var(--r-heading-font)",
                fontWeight: theme.headingWeight,
                color: theme.primary,
                fontSize: `${theme.baseSize + 0.5}px`,
                letterSpacing:
                  theme.sectionTitleTransform === "uppercase" ? "0.1em" : "normal",
                textTransform: theme.sectionTitleTransform,
                lineHeight: 1.2,
                overflowWrap: "anywhere",
              }}
            >
              {block.text}
            </div>
            {/* Bullet centered on the vertical bar */}
            <div
              style={{
                position: "absolute",
                top: 2,
                left: -(barOffsetFromMain + 5) + barWidth / 2,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: bar.color ?? theme.accent,
                boxShadow: "0 0 0 3px #fff",
              }}
            />
          </div>
        );
      }
      return <h2 style={sectionTitleStyle(theme, variant)}>{block.text}</h2>;
    }

    case "profileHeader": {
      const p = block.profile;
      const items = [
        p.email && { icon: Mail, text: p.email },
        p.phone && { icon: Phone, text: p.phone },
        p.location && { icon: MapPin, text: p.location },
        p.website && { icon: Globe, text: p.website },
        ...p.links.map((l) => ({ icon: LinkIcon, text: `${l.label}: ${l.url}` })),
      ].filter(Boolean) as { icon: typeof Mail; text: string }[];

      const hasHeaderBg = !!theme.headerBg;
      const nameColor = hasHeaderBg ? theme.headerText || "#fff" : theme.primary;
      const subColor = hasHeaderBg ? theme.headerText || "#fff" : theme.accent;
      const itemColor = hasHeaderBg ? theme.headerText || "#fff" : mutedColor;
      const placement = theme.avatarPlacement ?? "left";
      const showAvatar = theme.avatar === "initials";
      const avatarSize = theme.avatarSize ?? 68;
      const initials = (p.fullName || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("");

      const avatarNode = showAvatar ? (
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            background: theme.avatarBg || theme.accent,
            color: theme.avatarText || "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--r-heading-font)",
            fontWeight: theme.headingWeight,
            fontSize: Math.round(avatarSize * 0.38),
            flexShrink: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {initials}
        </div>
      ) : null;

      const textCol = (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 0,
            flex: 1,
            textAlign: placement === "center" ? "center" : "left",
          }}
        >
          <div
            style={{
              fontFamily: "var(--r-heading-font)",
              fontSize: `${theme.baseSize + 12}px`,
              fontWeight: theme.headingWeight,
              color: nameColor,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
            }}
          >
            {p.fullName || "Your Name"}
          </div>
          {p.headline && (
            <div
              style={{
                fontFamily: "var(--r-body-font)",
                fontSize: `${theme.baseSize + 1}px`,
                color: subColor,
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
                color: itemColor,
                fontSize: `${theme.baseSize - 0.5}px`,
                marginTop: 2,
                justifyContent: placement === "center" ? "center" : "flex-start",
              }}
            >
              {items.map((it, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    maxWidth: "100%",
                    overflowWrap: "anywhere",
                  }}
                >
                  <it.icon size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{it.text}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      );

      const inner = showAvatar ? (
        <div
          style={{
            display: "flex",
            flexDirection:
              placement === "center" ? "column" : placement === "right" ? "row-reverse" : "row",
            alignItems: "center",
            gap: 16,
            minWidth: 0,
          }}
        >
          {avatarNode}
          {textCol}
        </div>
      ) : (
        textCol
      );

      if (hasHeaderBg) {
        return (
          <div
            style={{
              background: theme.headerBg,
              color: theme.headerText || "#fff",
              padding: "20px 22px",
              borderRadius: theme.headerRadius ?? theme.radius,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {inner}
          </div>
        );
      }
      return inner;
    }

    case "contactStack": {
      const p = block.profile;
      const showAvatar = theme.avatar === "initials";
      const avatarSize = theme.avatarSize ?? 68;
      const initials = (p.fullName || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("");
      const rowStyle = {
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
        minWidth: 0,
      } as const;
      const textStyle = {
        overflowWrap: "anywhere" as const,
        minWidth: 0,
        flex: 1,
      };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          {showAvatar && (
            <div
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: "50%",
                background: theme.avatarBg || theme.accent,
                color: theme.avatarText || "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--r-heading-font)",
                fontWeight: theme.headingWeight,
                fontSize: Math.round(avatarSize * 0.38),
                marginBottom: 4,
              }}
            >
              {initials}
            </div>
          )}
          <div
            style={{
              fontFamily: "var(--r-heading-font)",
              fontSize: `${theme.baseSize + 8}px`,
              fontWeight: theme.headingWeight,
              color: isSidebarTinted ? theme.sidebarText : theme.primary,
              lineHeight: 1.15,
              wordBreak: "break-word",
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
              minWidth: 0,
            }}
          >
            {p.email && (
              <span style={rowStyle}>
                <Mail size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={textStyle}>{p.email}</span>
              </span>
            )}
            {p.phone && (
              <span style={rowStyle}>
                <Phone size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={textStyle}>{p.phone}</span>
              </span>
            )}
            {p.location && (
              <span style={rowStyle}>
                <MapPin size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={textStyle}>{p.location}</span>
              </span>
            )}
            {p.website && (
              <span style={rowStyle}>
                <Globe size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={textStyle}>{p.website}</span>
              </span>
            )}
            {p.links.map((l, i) => (
              <span key={i} style={rowStyle}>
                <LinkIcon size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={textStyle}>
                  {l.label}: {l.url}
                </span>
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
                    minWidth: 0,
                    flex: 1,
                    overflowWrap: "anywhere",
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
                      flexShrink: 0,
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
                  <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{entry.subtitle}</span>
                  {entry.metaSub && (
                    <span style={{ flexShrink: 0, textAlign: "right", overflowWrap: "anywhere" }}>
                      {entry.metaSub}
                    </span>
                  )}
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
                  <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{b}</span>
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
              overflowWrap: "anywhere",
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
            gridTemplateColumns: "minmax(0, auto) minmax(0, 1fr)",
            columnGap: 14,
            rowGap: 4,
            minWidth: 0,
          }}
        >
          {block.groups.map((g, i) => (
            <div key={i} style={{ display: "contents" }}>
              <div
                style={{
                  fontSize: `${theme.baseSize - 0.5}px`,
                  fontWeight: 600,
                  color: theme.primary,
                  overflowWrap: "anywhere",
                }}
              >
                {g.category}
              </div>
              <div
                style={{
                  fontSize: `${theme.baseSize}px`,
                  color: textColor,
                  lineHeight: 1.45,
                  minWidth: 0,
                  overflowWrap: "anywhere",
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
                minWidth: 0,
              }}
            >
              <span style={{ fontWeight: 500, minWidth: 0, overflowWrap: "anywhere" }}>{r.key}</span>
              {r.value && (
                <span style={{ color: mutedColor, textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>
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
