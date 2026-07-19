// Engine: measure -> paginate -> render pages.
//
// Renderer never measures; paginator never renders. The paginator emits a
// Page Model as a list of placed blocks with an explicit `topGap` in px,
// so what fits on a page mathematically is exactly what draws on the page.
//
// A4 at 96dpi = 794 x 1123 px. Same DOM is used for preview and print.

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { BlockView } from "./BlockView";
import {
  buildGroupsFor,
  themeCssVars,
  type Block,
  type BlockGroup,
} from "./model";
import type { Resume } from "./schema";
import type { LayoutKind, Spacing, Template, Theme } from "./templates";

const MM_TO_PX = 96 / 25.4;
export const PAGE_WIDTH_PX = Math.round(210 * MM_TO_PX); // ~794
export const PAGE_HEIGHT_PX = Math.round(297 * MM_TO_PX); // ~1123

type RegionKey = "header" | "footer" | "main" | "sidebar" | "second";
type Variant = "main" | "sidebar" | "header";

type Region = {
  key: RegionKey;
  variant: Variant;
  x: number;
  y: number;
  width: number;
  height: number;
  groups: BlockGroup[];
  padding: number;
  backgroundColor?: string;
  fullPageHeight?: boolean;
};

type PlacedBlock = {
  block: Block;
  topGap: number; // px before this block on the page (0 for first)
  height: number;
};

type PageColumn = {
  region: RegionKey;
  placed: PlacedBlock[];
};

type PageModel = {
  index: number;
  columns: PageColumn[];
};

// ---- Layout resolution ---------------------------------------------------

export function resolveRegions(resume: Resume, template: Template) {
  const s = template.spacing;
  const t = template.theme;
  const pageW = PAGE_WIDTH_PX;
  const pageH = PAGE_HEIGHT_PX;

  const contentX = s.pageMarginLeft;
  const contentY = s.pageMarginTop;
  const contentW = pageW - s.pageMarginLeft - s.pageMarginRight;
  const contentH = pageH - s.pageMarginTop - s.pageMarginBottom;

  const headerGroups = buildGroupsFor(resume, template.headerSections, "header");
  const mainGroups = buildGroupsFor(resume, template.mainSections, "main");
  const sidebarGroups = buildGroupsFor(resume, template.sidebarSections, "sidebar");
  const secondGroups = buildGroupsFor(resume, template.secondSidebarSections, "sidebar");
  const footerGroups = buildGroupsFor(resume, template.footerSections, "main");

  const regions: Region[] = [];
  const layout: LayoutKind = template.layout;

  if (layout === "leftSidebar" || layout === "rightSidebar") {
    const isLeft = layout === "leftSidebar";
    const sidebarW = s.sidebarWidth;
    const sidebarPad = s.sidebarPadding;
    const gap = s.columnGap;
    const sideX = isLeft ? 0 : pageW - sidebarW;
    const mainX = isLeft ? sidebarW + gap : s.pageMarginLeft;
    const mainW = pageW - sidebarW - gap - s.pageMarginLeft - s.pageMarginRight;

    if (sidebarGroups.length) {
      regions.push({
        key: "sidebar",
        variant: "sidebar",
        x: sideX,
        y: 0,
        width: sidebarW,
        height: pageH - sidebarPad * 2,
        groups: sidebarGroups,
        padding: sidebarPad,
        backgroundColor: t.sidebarBg,
        fullPageHeight: true,
      });
    }
    regions.push({
      key: "main",
      variant: "main",
      x: mainX,
      y: contentY,
      width: mainW,
      height: contentH,
      groups: [...headerGroups, ...mainGroups],
      padding: 0,
    });
    return { regions };
  }

  if (headerGroups.length && layout !== "single") {
    regions.push({
      key: "header",
      variant: "header",
      x: contentX,
      y: contentY,
      width: contentW,
      height: Number.POSITIVE_INFINITY,
      groups: headerGroups,
      padding: 0,
    });
  }

  if (footerGroups.length) {
    regions.push({
      key: "footer",
      variant: "main",
      x: contentX,
      y: pageH - s.pageMarginBottom - s.footerHeight,
      width: contentW,
      height: s.footerHeight || Number.POSITIVE_INFINITY,
      groups: footerGroups,
      padding: 0,
    });
  }

  const bodyY = contentY;
  const bodyH = contentH;
  const gap = s.columnGap;
  const sidebarW = s.sidebarWidth;

  if (layout === "single" || layout === "footer") {
    const g = layout === "single" ? [...headerGroups, ...mainGroups] : mainGroups;
    regions.push({
      key: "main",
      variant: "main",
      x: contentX,
      y: bodyY,
      width: contentW,
      height: bodyH,
      groups: g,
      padding: 0,
    });
  } else if (layout === "twoCol" || layout === "headerTwoCol") {
    const mainW = contentW - sidebarW - gap;
    regions.push({
      key: "main",
      variant: "main",
      x: contentX,
      y: bodyY,
      width: mainW,
      height: bodyH,
      groups: mainGroups,
      padding: 0,
    });
    regions.push({
      key: "sidebar",
      variant: "sidebar",
      x: contentX + mainW + gap,
      y: bodyY,
      width: sidebarW,
      height: bodyH,
      groups: sidebarGroups,
      padding: 0,
    });
  } else if (layout === "threeCol" || layout === "headerThreeCol") {
    const mainW = contentW - sidebarW * 2 - gap * 2;
    regions.push({
      key: "main",
      variant: "main",
      x: contentX,
      y: bodyY,
      width: mainW,
      height: bodyH,
      groups: mainGroups,
      padding: 0,
    });
    regions.push({
      key: "sidebar",
      variant: "sidebar",
      x: contentX + mainW + gap,
      y: bodyY,
      width: sidebarW,
      height: bodyH,
      groups: sidebarGroups,
      padding: 0,
    });
    regions.push({
      key: "second",
      variant: "sidebar",
      x: contentX + mainW + gap + sidebarW + gap,
      y: bodyY,
      width: sidebarW,
      height: bodyH,
      groups: secondGroups,
      padding: 0,
    });
  }

  return { regions };
}

// ---- Measurement ---------------------------------------------------------

type GroupMeasure = {
  group: BlockGroup;
  blockHeights: number[];
  interBlockGap: number; // gap used between blocks inside this group
  totalHeight: number;
  headerHeightIfSplit?: number;
  perBulletHeight?: number;
};

type RegionMeasure = {
  region: Region;
  groups: GroupMeasure[];
};

function MeasurementLayer({
  measurements,
  theme,
  onMeasured,
}: {
  measurements: { key: string; width: number; variant: Variant; node: ReactNode }[];
  theme: Theme;
  onMeasured: (heights: Record<string, number>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const heights: Record<string, number> = {};
    const nodes = containerRef.current.querySelectorAll<HTMLElement>("[data-measure-key]");
    nodes.forEach((el) => {
      const k = el.getAttribute("data-measure-key");
      if (k) heights[k] = el.getBoundingClientRect().height;
    });
    onMeasured(heights);
  }, [measurements, onMeasured, theme]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={containerRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: -100000,
        visibility: "hidden",
        pointerEvents: "none",
        ...themeCssVars(theme),
        fontFamily: theme.bodyFont,
        color: theme.text,
      }}
    >
      {measurements.map((m) => (
        <div
          key={m.key}
          data-measure-key={m.key}
          style={{ width: m.width, boxSizing: "border-box" }}
        >
          {m.node}
        </div>
      ))}
    </div>,
    document.body,
  );
}

function buildMeasureRequests(
  regions: Region[],
  theme: Theme,
  spacing: Spacing,
) {
  const requests: {
    key: string;
    width: number;
    variant: Variant;
    node: ReactNode;
  }[] = [];

  regions.forEach((r) => {
    const innerWidth = r.width - r.padding * 2;
    const ctx = { theme, spacing, variant: r.variant };
    r.groups.forEach((group, gi) => {
      group.blocks.forEach((block, bi) => {
        requests.push({
          key: `${r.key}:${gi}:${bi}`,
          width: innerWidth,
          variant: r.variant,
          node: <BlockView block={block} ctx={ctx} />,
        });
        if (block.kind === "entry" && block.entry.bullets.length > 1) {
          requests.push({
            key: `${r.key}:${gi}:${bi}:h0`,
            width: innerWidth,
            variant: r.variant,
            node: <BlockView block={{ kind: "entry", entry: { ...block.entry, bullets: [] } }} ctx={ctx} />,
          });
          requests.push({
            key: `${r.key}:${gi}:${bi}:h1`,
            width: innerWidth,
            variant: r.variant,
            node: <BlockView block={{ kind: "entry", entry: { ...block.entry, bullets: block.entry.bullets.slice(0, 1) } }} ctx={ctx} />,
          });
        }
      });
    });
  });

  return requests;
}

// ---- Pagination ---------------------------------------------------------

function paginateRegion(
  rm: RegionMeasure,
  available: number,
  spacing: Spacing,
): PageColumn[] {
  if (!rm.groups.length) return [];

  const pages: PlacedBlock[][] = [[]];
  let used = 0;
  let prevSection: string | null = null;

  const currentPage = () => pages[pages.length - 1];

  const placeGroupOnCurrent = (gm: GroupMeasure, sectionGap: number) => {
    gm.group.blocks.forEach((b, i) => {
      const topGap = i === 0 ? sectionGap : gm.interBlockGap;
      currentPage().push({ block: b, topGap, height: gm.blockHeights[i] });
      used += topGap + gm.blockHeights[i];
    });
    prevSection = gm.group.section;
  };

  const newPage = () => {
    pages.push([]);
    used = 0;
    prevSection = null;
  };

  rm.groups.forEach((gm) => {
    const sectionGap =
      prevSection === null
        ? 0
        : prevSection === gm.group.section
        ? spacing.entryGap
        : spacing.sectionGap;
    const total = gm.totalHeight + sectionGap;

    if (used + total <= available) {
      placeGroupOnCurrent(gm, sectionGap);
      return;
    }

    // Try split
    const split = trySplitEntry(gm, used + sectionGap, available, spacing);
    if (split) {
      currentPage().push({
        block: split.first,
        topGap: sectionGap,
        height: split.firstHeight,
      });
      used += sectionGap + split.firstHeight;
      newPage();
      currentPage().push({
        block: split.rest,
        topGap: 0,
        height: split.restHeight,
      });
      used = split.restHeight;
      prevSection = gm.group.section;
      return;
    }

    // Move to next page
    if (currentPage().length === 0) {
      // Empty page and still doesn't fit -> place anyway (overflow hidden)
      placeGroupOnCurrent(gm, 0);
      newPage();
      return;
    }
    newPage();
    placeGroupOnCurrent(gm, 0);
  });

  if (currentPage().length === 0) pages.pop();

  return pages.map((placed) => ({ region: rm.region.key, placed }));
}

function trySplitEntry(
  gm: GroupMeasure,
  usedBefore: number,
  available: number,
  spacing: Spacing,
): { first: Block; firstHeight: number; rest: Block; restHeight: number } | null {
  const group = gm.group;
  if (!group.splittable) return null;
  const entryIdx = group.blocks.findIndex((b) => b.kind === "entry");
  if (entryIdx === -1) return null;
  const entryBlock = group.blocks[entryIdx] as Extract<Block, { kind: "entry" }>;
  const bullets = entryBlock.entry.bullets;
  if (bullets.length < 2) return null;
  const headerH = gm.headerHeightIfSplit;
  const perBullet = gm.perBulletHeight;
  if (headerH === undefined || perBullet === undefined) return null;

  const spaceLeft = available - usedBefore;
  const perRow = perBullet + spacing.bulletGap;
  const maxK = Math.floor((spaceLeft - headerH) / perRow);
  if (maxK < 1 || maxK >= bullets.length) return null;

  const first: Block = { kind: "entry", entry: { ...entryBlock.entry, bullets: bullets.slice(0, maxK) } };
  const rest: Block = {
    kind: "entryContinuation",
    entry: entryBlock.entry,
    bullets: bullets.slice(maxK),
    showTitle: true,
  };
  const firstHeight = headerH + maxK * perRow;
  const restHeight = headerH + (bullets.length - maxK) * perRow;
  return { first, firstHeight, rest, restHeight };
}

// ---- Document component --------------------------------------------------

export function ResumeDocument({
  resume,
  template,
  onPageCount,
}: {
  resume: Resume;
  template: Template;
  onPageCount?: (n: number) => void;
}) {
  const { regions } = useMemo(() => resolveRegions(resume, template), [resume, template]);
  const measureRequests = useMemo(
    () => buildMeasureRequests(regions, template.theme, template.spacing),
    [regions, template],
  );

  const [heights, setHeights] = useState<Record<string, number>>({});
  const measureKey = useMemo(() => measureRequests.map((r) => r.key).join("|"), [measureRequests]);
  useEffect(() => {
    setHeights({});
  }, [measureKey]);

  const allMeasured =
    measureRequests.length > 0 &&
    measureRequests.every((r) => heights[r.key] !== undefined);

  const regionMeasures: RegionMeasure[] = useMemo(() => {
    if (!allMeasured) return [];
    return regions.map((r) => {
      const groups: GroupMeasure[] = r.groups.map((group, gi) => {
        const blockHeights = group.blocks.map((_b, bi) => heights[`${r.key}:${gi}:${bi}`] ?? 0);
        const interBlockGap = template.spacing.bulletGap;
        const total =
          blockHeights.reduce((a, b) => a + b, 0) +
          Math.max(0, blockHeights.length - 1) * interBlockGap;
        let headerHeightIfSplit: number | undefined;
        let perBulletHeight: number | undefined;
        group.blocks.forEach((b, bi) => {
          if (b.kind === "entry" && b.entry.bullets.length > 1) {
            const h0 = heights[`${r.key}:${gi}:${bi}:h0`];
            const h1 = heights[`${r.key}:${gi}:${bi}:h1`];
            if (h0 !== undefined && h1 !== undefined) {
              headerHeightIfSplit = h0;
              perBulletHeight = Math.max(0, h1 - h0);
            }
          }
        });
        return { group, blockHeights, interBlockGap, totalHeight: total, headerHeightIfSplit, perBulletHeight };
      });
      return { region: r, groups };
    });
  }, [allMeasured, regions, heights, template.spacing.bulletGap]);

  const headerRM = regionMeasures.find((r) => r.region.key === "header");
  const footerRM = regionMeasures.find((r) => r.region.key === "footer");
  const bodyRMs = regionMeasures.filter((r) => r.region.key !== "header" && r.region.key !== "footer");

  const headerHeight = headerRM
    ? headerRM.groups.reduce(
        (sum, g, i) => sum + g.totalHeight + (i > 0 ? template.spacing.sectionGap : 0),
        0,
      )
    : 0;
  const footerHeight = footerRM
    ? footerRM.groups.reduce(
        (sum, g, i) => sum + g.totalHeight + (i > 0 ? template.spacing.entryGap : 0),
        0,
      )
    : 0;

  const pagesPerRegion = useMemo(() => {
    const out: Record<string, PageColumn[]> = {};
    if (!allMeasured) return out;
    bodyRMs.forEach((rm) => {
      let available: number;
      if (rm.region.fullPageHeight) {
        available = PAGE_HEIGHT_PX - rm.region.padding * 2;
      } else if (rm.region.key === "main") {
        available =
          rm.region.height -
          (headerHeight > 0 ? headerHeight + template.spacing.sectionGap : 0) -
          (footerHeight > 0 ? footerHeight + template.spacing.sectionGap : 0);
      } else {
        available =
          rm.region.height -
          (footerHeight > 0 ? footerHeight + template.spacing.sectionGap : 0);
      }
      out[rm.region.key] = paginateRegion(rm, available, template.spacing);
    });
    return out;
  }, [allMeasured, bodyRMs, headerHeight, footerHeight, template.spacing]);

  const totalPages = useMemo(() => {
    if (!allMeasured) return 1;
    let n = 1;
    Object.values(pagesPerRegion).forEach((pcs) => {
      if (pcs.length > n) n = pcs.length;
    });
    return n;
  }, [allMeasured, pagesPerRegion]);

  useEffect(() => {
    onPageCount?.(totalPages);
  }, [totalPages, onPageCount]);

  const pageModels: PageModel[] = useMemo(() => {
    const arr: PageModel[] = [];
    for (let i = 0; i < totalPages; i++) {
      const cols: PageColumn[] = [];
      bodyRMs.forEach((rm) => {
        const p = pagesPerRegion[rm.region.key]?.[i];
        cols.push(p ?? { region: rm.region.key, placed: [] });
      });
      arr.push({ index: i, columns: cols });
    }
    return arr;
  }, [totalPages, bodyRMs, pagesPerRegion]);

  return (
    <>
      <MeasurementLayer
        measurements={measureRequests}
        theme={template.theme}
        onMeasured={(h) => {
          setHeights((prev) => {
            const merged = { ...prev, ...h };
            const changed = Object.keys(merged).some((k) => prev[k] !== merged[k]);
            return changed ? merged : prev;
          });
        }}
      />
      {allMeasured &&
        pageModels.map((pm, i) => (
          <PageView
            key={i}
            page={pm}
            regions={regions}
            template={template}
            headerRM={headerRM}
            footerRM={footerRM}
            headerHeight={headerHeight}
            footerHeight={footerHeight}
            showHeader={i === 0}
            showFooter={true}
          />
        ))}
      {!allMeasured && <PagePlaceholder />}
    </>
  );
}

function PagePlaceholder() {
  return (
    <div
      className="resume-page"
      style={{
        width: PAGE_WIDTH_PX,
        height: PAGE_HEIGHT_PX,
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.08)",
        margin: "0 auto",
      }}
    />
  );
}

function PageView({
  page,
  regions,
  template,
  headerRM,
  footerRM,
  headerHeight,
  footerHeight,
  showHeader,
  showFooter,
}: {
  page: PageModel;
  regions: Region[];
  template: Template;
  headerRM?: RegionMeasure;
  footerRM?: RegionMeasure;
  headerHeight: number;
  footerHeight: number;
  showHeader: boolean;
  showFooter: boolean;
}) {
  const s = template.spacing;
  const t = template.theme;

  const pageStyle: CSSProperties = {
    ...themeCssVars(t),
    width: PAGE_WIDTH_PX,
    height: PAGE_HEIGHT_PX,
    position: "relative",
    background: "#fff",
    color: t.text,
    fontFamily: t.bodyFont,
    fontSize: t.baseSize,
    overflow: "hidden",
    boxSizing: "border-box",
  };

  const renderPlacedBlocks = (placed: PlacedBlock[], variant: Variant) => (
    <>
      {placed.map((pb, i) => (
        <div key={i} style={{ marginTop: pb.topGap }}>
          <BlockView block={pb.block} ctx={{ theme: t, spacing: s, variant }} />
        </div>
      ))}
    </>
  );

  // Render header/footer inline: they aren't paginated (single-page slots).
  const renderStaticRegion = (rm: RegionMeasure, variant: Variant) => {
    // Reuse the same gap system by faking "placed" list.
    let prevSection: string | null = null;
    const placed: PlacedBlock[] = [];
    rm.groups.forEach((gm) => {
      const sectionGap =
        prevSection === null
          ? 0
          : prevSection === gm.group.section
          ? s.entryGap
          : s.sectionGap;
      gm.group.blocks.forEach((b, i) => {
        placed.push({
          block: b,
          topGap: i === 0 ? sectionGap : gm.interBlockGap,
          height: gm.blockHeights[i],
        });
      });
      prevSection = gm.group.section;
    });
    return renderPlacedBlocks(placed, variant);
  };

  return (
    <div className="resume-page" style={pageStyle}>
      {regions.map((r) => {
        const isHeader = r.key === "header";
        const isFooter = r.key === "footer";
        const isBody = !isHeader && !isFooter;

        if (isHeader && !showHeader) return null;
        if (isFooter && !showFooter) return null;

        let y = r.y;
        let height = r.height;

        if (r.key === "main" && showHeader && headerHeight > 0) {
          y = r.y + headerHeight + s.sectionGap;
          height = r.height - headerHeight - s.sectionGap;
        }
        if (isBody && footerHeight > 0 && !r.fullPageHeight) {
          height = height - footerHeight - s.sectionGap;
        }

        const bg =
          r.backgroundColor && r.backgroundColor !== "transparent"
            ? r.backgroundColor
            : undefined;

        return (
          <div
            key={r.key}
            style={{
              position: "absolute",
              left: r.x,
              top: r.fullPageHeight ? 0 : y,
              width: r.width,
              height: r.fullPageHeight
                ? PAGE_HEIGHT_PX
                : isHeader
                ? "auto"
                : height,
              padding: r.padding,
              boxSizing: "border-box",
              background: bg,
              color: r.variant === "sidebar" && bg ? t.sidebarText : undefined,
              overflow: "hidden",
            }}
          >
            {isBody
              ? renderPlacedBlocks(
                  page.columns.find((c) => c.region === r.key)?.placed ?? [],
                  r.variant,
                )
              : isHeader && headerRM
              ? renderStaticRegion(headerRM, r.variant)
              : isFooter && footerRM
              ? renderStaticRegion(footerRM, r.variant)
              : null}
          </div>
        );
      })}
    </div>
  );
}
