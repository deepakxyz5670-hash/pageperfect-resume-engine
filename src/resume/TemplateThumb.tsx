// Synthetic template thumbnails — a fast, deterministic mini preview built
// from template theme + layout that lets users visually pick a template.
// Not pixel-exact, but reflects the palette, layout, header and decorations.

import type { CSSProperties } from "react";
import type { Template } from "./templates";
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from "./engine";

const W = 120; // thumb width in px
const H = Math.round((W * PAGE_HEIGHT_PX) / PAGE_WIDTH_PX);
const SCALE = W / PAGE_WIDTH_PX;

function bar(color: string, width: number, height = 4, radius = 1): CSSProperties {
  return { width, height, background: color, borderRadius: radius };
}

export function TemplateThumb({ template, selected, onClick }: {
  template: Template;
  selected: boolean;
  onClick: () => void;
}) {
  const t = template.theme;
  const s = template.spacing;
  const layout = template.layout;

  const mainColor = t.text || "#334155";
  const mutedColor = t.muted || "#94a3b8";
  const accent = t.accent;
  const divider = t.divider;

  // Compute scaled dims
  const marginL = s.pageMarginLeft * SCALE;
  const marginR = s.pageMarginRight * SCALE;
  const marginT = Math.max(s.pageMarginTop, 40) * SCALE;
  const sidebarW = s.sidebarWidth * SCALE;
  const gap = s.columnGap * SCALE;

  const hasSidebarLeft = layout === "leftSidebar";
  const hasSidebarRight = layout === "rightSidebar";
  const hasTwoCol = layout === "twoCol" || layout === "headerTwoCol";
  const hasThreeCol = layout === "threeCol" || layout === "headerThreeCol";

  // Compute region rects in thumbnail px
  const mainRect = (() => {
    if (hasSidebarLeft) return { x: sidebarW + gap, y: marginT, w: W - sidebarW - gap - marginR };
    if (hasSidebarRight) return { x: marginL, y: marginT, w: W - sidebarW - gap - marginL };
    if (hasTwoCol) return { x: marginL, y: marginT, w: W - sidebarW - gap - marginL - marginR };
    if (hasThreeCol) return { x: marginL, y: marginT, w: W - sidebarW * 2 - gap * 2 - marginL - marginR };
    return { x: marginL, y: marginT, w: W - marginL - marginR };
  })();

  const sidebarRect = (() => {
    if (hasSidebarLeft) return { x: 0, y: 0, w: sidebarW, h: H };
    if (hasSidebarRight) return { x: W - sidebarW, y: 0, w: sidebarW, h: H };
    if (hasTwoCol) return { x: W - sidebarW - marginR, y: marginT, w: sidebarW, h: H - marginT - marginT };
    if (hasThreeCol) return { x: mainRect.x + mainRect.w + gap, y: marginT, w: sidebarW, h: H - marginT * 2 };
    return null;
  })();

  const secondRect = hasThreeCol
    ? { x: (sidebarRect?.x ?? 0) + (sidebarRect?.w ?? 0) + gap, y: marginT, w: sidebarW, h: H - marginT * 2 }
    : null;

  // Header (banner) rect for templates with headerBg
  const hasHeaderBg = !!t.headerBg;
  const headerHeight = hasHeaderBg ? 22 : 0;

  const contentLines = [
    // section 1
    { title: true, w: 0.4 },
    { title: false, w: 0.95 },
    { title: false, w: 0.9 },
    { title: false, w: 0.85 },
    // section 2
    { title: true, w: 0.35, gapBefore: 6 },
    { title: false, w: 0.9 },
    { title: false, w: 0.88 },
    { title: false, w: 0.6 },
    // section 3
    { title: true, w: 0.3, gapBefore: 6 },
    { title: false, w: 0.9 },
    { title: false, w: 0.7 },
  ];

  const renderColumn = (rect: { x: number; y: number; w: number }, opts?: { sidebarTint?: boolean }) => {
    const tint = opts?.sidebarTint;
    const text = tint && t.sidebarBg !== "transparent" ? t.sidebarText : mainColor;
    const muted = tint && t.sidebarBg !== "transparent" ? t.sidebarText : mutedColor;
    let cursor = rect.y;
    return contentLines.map((ln, i) => {
      cursor += ln.gapBefore ?? 2;
      const h = ln.title ? 4 : 2.5;
      const el = (
        <div
          key={i}
          style={{
            position: "absolute",
            left: rect.x,
            top: cursor,
            ...bar(ln.title ? accent : ln.w > 0.7 ? text : muted, rect.w * ln.w, h, 1),
            opacity: ln.title ? 1 : 0.55,
          }}
        />
      );
      cursor += h + 2;
      return el;
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={template.name}
      style={{
        position: "relative",
        width: W,
        height: H,
        flexShrink: 0,
        borderRadius: 4,
        overflow: "hidden",
        background: "#fff",
        border: selected ? `2px solid ${accent}` : "1px solid #d4d4d8",
        boxShadow: selected ? `0 0 0 3px ${accent}22` : "0 1px 2px rgba(0,0,0,0.06)",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {/* Sidebar tint */}
      {sidebarRect && t.sidebarBg && t.sidebarBg !== "transparent" && (
        <div
          style={{
            position: "absolute",
            left: sidebarRect.x,
            top: sidebarRect.y,
            width: sidebarRect.w,
            height: sidebarRect.h,
            background: t.sidebarBg,
          }}
        />
      )}
      {/* Header banner */}
      {hasHeaderBg && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: headerHeight,
            background: t.headerBg,
          }}
        />
      )}
      {/* Timeline bar decoration */}
      {t.timelineBar && (
        <div
          style={{
            position: "absolute",
            left: t.timelineBar.x * SCALE,
            top: 0,
            bottom: 0,
            width: Math.max(1, (t.timelineBar.width ?? 2) * SCALE),
            background: t.timelineBar.color ?? accent,
          }}
        />
      )}
      {/* Bookmark ribbon */}
      {t.bookmark && (
        <div
          style={{
            position: "absolute",
            top: 0,
            [t.bookmark.position === "topLeft" ? "left" : "right"]: 4,
            width: t.bookmark.width * SCALE * 1.4,
            height: t.bookmark.height * SCALE * 1.2,
            background: t.bookmark.color,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)",
          } as CSSProperties}
        />
      )}
      {/* Name bar (avatar + name) */}
      <div
        style={{
          position: "absolute",
          left: mainRect.x,
          top: hasHeaderBg ? 6 : mainRect.y,
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        {t.avatar === "initials" && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: t.avatarBg ?? accent,
            }}
          />
        )}
        <div style={bar(hasHeaderBg ? (t.headerText ?? "#fff") : t.primary, mainRect.w * 0.5, 4, 1)} />
      </div>

      {/* Content lines in main */}
      <div style={{ position: "absolute", inset: 0 }}>
        {renderColumn({ ...mainRect, y: (hasHeaderBg ? headerHeight + 6 : mainRect.y) + 8 })}
      </div>

      {/* Sidebar content lines */}
      {sidebarRect && (
        <div style={{ position: "absolute", inset: 0 }}>
          {renderColumn(
            { x: sidebarRect.x + 4, y: sidebarRect.y + 8, w: sidebarRect.w - 8 },
            { sidebarTint: true },
          )}
        </div>
      )}
      {secondRect && (
        <div style={{ position: "absolute", inset: 0 }}>
          {renderColumn({ x: secondRect.x + 4, y: secondRect.y + 8, w: secondRect.w - 8 })}
        </div>
      )}

      {/* Accent divider under name for underline styles */}
      {t.sectionTitleStyle === "underline" && (
        <div
          style={{
            position: "absolute",
            left: mainRect.x,
            top: (hasHeaderBg ? headerHeight + 6 : mainRect.y) + 6,
            width: mainRect.w * 0.6,
            height: 1,
            background: divider,
          }}
        />
      )}
    </button>
  );
}

export const THUMB_WIDTH = W;
export const THUMB_HEIGHT = H;
