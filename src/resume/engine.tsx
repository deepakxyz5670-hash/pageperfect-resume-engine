// Engine: measure → paginate → render pages.
//
// This is the whole document pipeline. Renderer never measures; paginator
// never renders (it produces a Page Model consumed by the renderer).
//
// A4 at 96dpi ≈ 794 × 1123 px. We author in CSS mm/px so the same DOM prints
// unchanged. The measurement pass renders each block into a hidden container
// of the exact target width and reads getBoundingClientRect().height —
// guaranteeing "what you preview is what prints".

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
  type EntryData,
} from "./model";
import type { Resume } from "./schema";
import type { LayoutKind, Spacing, Template, Theme } from "./templates";

// ---- Page dimensions ------------------------------------------------------

// mm at 96dpi -> px. Fixed so preview and print resolve to the same layout.
const MM_TO_PX = 96 / 25.4;
export const PAGE_WIDTH_PX = Math.round(210 * MM_TO_PX); // ~794
export const PAGE_HEIGHT_PX = Math.round(297 * MM_TO_PX); // ~1123

// ---- Region model --------------------------------------------------------

type RegionKey = "header" | "footer" | "main" | "sidebar" | "second";
type Variant = "main" | "sidebar" | "header";

type Region = {
  key: RegionKey;
  variant: Variant;
  x: number;
  y: number;
  width: number;
  height: number; // available height for content
  groups: BlockGroup[];
  padding: number; // inner padding (sidebars/header get extra)
  backgroundColor?: string;
  fullPageHeight?: boolean; // for sidebars that span full page height
};

type PlacedBlock = {
  block: Block;
  topGap: number;
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

// Compute regions for a template. Body regions get an available height that is
// (pageHeight - top - bottom margins - headerHeight - footerHeight).
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

  const usesFullPageSidebar =
    template.layout === "leftSidebar" || template.layout === "rightSidebar";
  const sidebarW = s.sidebarWidth;
  const gap = s.columnGap;

  // ---- Sidebar layouts (sidebar spans full page height) ------------------
  if (usesFullPageSidebar) {
    const sidebarPad = s.sidebarPadding;
    const isLeft = template.layout === "leftSidebar";
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
    if (mainGroups.length || headerGroups.length) {
      // Header, if any, prepends into the main column top region.
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
    }
    return { regions, template };
  }

  // ---- Header / footer + body variants ----------------------------------
  let bodyY = contentY;
  let bodyH = contentH;

  if (headerGroups.length && template.layout !== "single") {
    // Header is measured; we reserve provisional height using headerHeight if
    // >0, else measure at paginate time. For simplicity we use a fixed slot.
    // (Measurement of header height happens in the measurement pass.)
    regions.push({
      key: "header",
      variant: "header",
      x: contentX,
      y: contentY,
      width: contentW,
      height: Number.POSITIVE_INFINITY, // measured, not paginated
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
    bodyH -= (s.footerHeight || 0) + s.sectionGap;
  }

  // Body columns
  const layout: LayoutKind = template.layout;
  if (layout === "single" || layout === "footer") {
    const g = headerGroups.length && layout === "single" ? [...headerGroups, ...mainGroups] : mainGroups;
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
    const sideW = sidebarW;
    const mainW = contentW - sideW - gap;
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
      width: sideW,
      height: bodyH,
      groups: sidebarGroups,
      padding: 0,
    });
  } else if (layout === "threeCol" || layout === "headerThreeCol") {
    const sideW = sidebarW;
    const secW = sidebarW;
    const mainW = contentW - sideW - secW - gap * 2;
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
      width: sideW,
      height: bodyH,
      groups: sidebarGroups,
      padding: 0,
    });
    regions.push({
      key: "second",
      variant: "sidebar",
      x: contentX + mainW + gap + sideW + gap,
      y: bodyY,
      width: secW,
      height: bodyH,
      groups: secondGroups,
      padding: 0,
    });
  }

  return { regions, template };
}

// ---- Measurement ---------------------------------------------------------

type BlockMeasure = {
  height: number;
};

type GroupMeasure = {
  group: BlockGroup;
  blockHeights: number[];
  totalHeight: number; // sum + entryGap * (n-1)
  headerHeightIfSplit?: number; // for splittable entry: entry with 0 bullets
  perBulletHeight?: number;
};

type RegionMeasure = {
  region: Region;
  groups: GroupMeasure[];
  measuredHeight?: number; // for header (unpaginated)
};

// Render blocks into a hidden container to measure exact heights.
// Uses a portal so measurements happen at real DOM widths without disturbing
// the visible layout.
function MeasurementLayer({
  measurements,
  theme,
  spacing,
  onMeasured,
}: {
  measurements: {
    key: string;
    width: number;
    variant: Variant;
    node: ReactNode;
  }[];
  theme: Theme;
  spacing: Spacing;
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
  }, [measurements, onMeasured, theme, spacing]);

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

// Build the list of measure requests for a region: every block, plus for
// splittable entry blocks also a 0-bullet variant to compute per-bullet height.
function buildMeasureRequests(
  regions: Region[],
  ctxByRegion: Record<RegionKey, { theme: Theme; spacing: Spacing; variant: Variant }>,
) {
  const requests: {
    key: string;
    width: number;
    variant: Variant;
    node: ReactNode;
  }[] = [];

  regions.forEach((r) => {
    const ctx = ctxByRegion[r.key];
    const innerWidth = r.width - r.padding * 2;
    r.groups.forEach((group, gi) => {
      group.blocks.forEach((block, bi) => {
        requests.push({
          key: `${r.key}:${gi}:${bi}`,
          width: innerWidth,
          variant: r.variant,
          node: <BlockView block={block} ctx={ctx} />,
        });
        if (block.kind === "entry" && block.entry.bullets.length > 1) {
          // Measure entry with no bullets, and entry with 1 bullet, to derive
          // per-bullet height. Bullet gaps are captured because full entry
          // measurement also includes them.
          const zeroBullets: Block = {
            kind: "entry",
            entry: { ...block.entry, bullets: [] },
          };
          const oneBullet: Block = {
            kind: "entry",
            entry: { ...block.entry, bullets: block.entry.bullets.slice(0, 1) },
          };
          requests.push({
            key: `${r.key}:${gi}:${bi}:h0`,
            width: innerWidth,
            variant: r.variant,
            node: <BlockView block={zeroBullets} ctx={ctx} />,
          });
          requests.push({
            key: `${r.key}:${gi}:${bi}:h1`,
            width: innerWidth,
            variant: r.variant,
            node: <BlockView block={oneBullet} ctx={ctx} />,
          });
        }
      });
    });
  });

  return requests;
}

// ---- Pagination ---------------------------------------------------------

function paginateRegion(
  region: RegionMeasure,
  available: number,
  spacing: Spacing,
): PageColumn[] {
  if (!region.region.groups.length) return [];

  const pages: Block[][] = [[]];
  let used = 0;
  let prevSection: string | null = null;

  const push = (page: number, block: Block, size: number, gap: number) => {
    pages[page].push(block);
    used = used + gap + size;
  };

  const newPage = () => {
    pages.push([]);
    used = 0;
    prevSection = null;
  };

  region.groups.forEach((gm) => {
    const group = gm.group;
    const groupHeight = gm.totalHeight;
    const gap =
      prevSection === null
        ? 0
        : prevSection === group.section
        ? spacing.entryGap
        : spacing.sectionGap;

    if (used + gap + groupHeight <= available) {
      // Place entire group on current page
      let g = gap;
      gm.group.blocks.forEach((b, i) => {
        push(pages.length - 1, b, gm.blockHeights[i], i === 0 ? g : spacing.bulletGap);
        g = 0;
      });
      // Recompute used deterministically (sum block heights + interior entryGap)
      used = used - (gap + groupHeight) + gap + groupHeight;
      prevSection = group.section;
      return;
    }

    // Doesn't fit: try to split if allowed
    const splitInfo = trySplitEntry(gm, used + gap, available, spacing);
    if (splitInfo) {
      pages[pages.length - 1].push(splitInfo.first);
      newPage();
      pages[pages.length - 1].push(splitInfo.rest);
      // Estimate used after continuation for gap tracking
      used = splitInfo.restHeight;
      prevSection = group.section;
      return;
    }

    // Move whole group to next page
    if (pages[pages.length - 1].length === 0) {
      // Empty page and still doesn't fit: place anyway (avoid infinite loop).
      gm.group.blocks.forEach((b, i) => {
        pages[pages.length - 1].push(b);
      });
      used = groupHeight;
      prevSection = group.section;
      newPage();
      return;
    }
    newPage();
    gm.group.blocks.forEach((b) => pages[pages.length - 1].push(b));
    used = groupHeight;
    prevSection = group.section;
  });

  // Trim trailing empty page
  if (pages[pages.length - 1].length === 0) pages.pop();

  return pages.map((blocks) => ({ region: region.region.key, blocks }));
}

function trySplitEntry(
  gm: GroupMeasure,
  usedBefore: number,
  available: number,
  spacing: Spacing,
): { first: Block; rest: Block; restHeight: number } | null {
  const group = gm.group;
  if (!group.splittable) return null;
  // Only entry blocks are splittable in v1.
  const entryIdx = group.blocks.findIndex((b) => b.kind === "entry");
  if (entryIdx === -1) return null;
  const entryBlock = group.blocks[entryIdx] as Extract<Block, { kind: "entry" }>;
  const bullets = entryBlock.entry.bullets;
  if (bullets.length < 2) return null;

  const headerH = gm.headerHeightIfSplit;
  const perBullet = gm.perBulletHeight;
  if (headerH === undefined || perBullet === undefined) return null;

  const spaceLeft = available - usedBefore;
  // Header + K bullets must fit; each bullet costs perBullet + bulletGap.
  const perRow = perBullet + spacing.bulletGap;
  const maxK = Math.floor((spaceLeft - headerH) / perRow);
  if (maxK < 1) return null;
  if (maxK >= bullets.length) return null;

  const firstBullets = bullets.slice(0, maxK);
  const restBullets = bullets.slice(maxK);

  const first: Block = {
    kind: "entry",
    entry: { ...entryBlock.entry, bullets: firstBullets },
  };
  const rest: Block = {
    kind: "entryContinuation",
    entry: entryBlock.entry,
    bullets: restBullets,
    showTitle: true,
  };
  const restHeight = headerH + restBullets.length * perRow;
  return { first, rest, restHeight };
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
  const { regions } = useMemo(
    () => resolveRegions(resume, template),
    [resume, template],
  );

  const ctxByRegion = useMemo(() => {
    const map = {} as Record<RegionKey, { theme: Theme; spacing: Spacing; variant: Variant }>;
    regions.forEach((r) => {
      map[r.key] = { theme: template.theme, spacing: template.spacing, variant: r.variant };
    });
    return map;
  }, [regions, template]);

  const measureRequests = useMemo(
    () => buildMeasureRequests(regions, ctxByRegion),
    [regions, ctxByRegion],
  );

  const [heights, setHeights] = useState<Record<string, number>>({});
  const measureKey = useMemo(
    () => measureRequests.map((r) => r.key).join("|"),
    [measureRequests],
  );
  // Reset heights whenever the request set changes (template or resume change).
  useEffect(() => {
    setHeights({});
  }, [measureKey]);

  const allMeasured = measureRequests.length > 0 &&
    measureRequests.every((r) => heights[r.key] !== undefined);

  // Build measured groups per region
  const regionMeasures: RegionMeasure[] = useMemo(() => {
    if (!allMeasured) return [];
    return regions.map((r) => {
      const groups: GroupMeasure[] = r.groups.map((group, gi) => {
        const blockHeights = group.blocks.map((_b, bi) => heights[`${r.key}:${gi}:${bi}`] ?? 0);
        const total =
          blockHeights.reduce((a, b) => a + b, 0) +
          Math.max(0, blockHeights.length - 1) * template.spacing.bulletGap;

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

        return {
          group,
          blockHeights,
          totalHeight: total,
          headerHeightIfSplit,
          perBulletHeight,
        };
      });
      return { region: r, groups };
    });
  }, [allMeasured, regions, heights, template.spacing.bulletGap]);

  // Compute header height (if any)
  const headerRegion = regionMeasures.find((r) => r.region.key === "header");
  const headerHeight = headerRegion
    ? headerRegion.groups.reduce((sum, g, i) => sum + g.totalHeight + (i > 0 ? template.spacing.sectionGap : 0), 0)
    : 0;

  // Available height for paginated regions
  const bodyRegions = regionMeasures.filter(
    (r) => r.region.key !== "header" && r.region.key !== "footer",
  );
  const footerRegion = regionMeasures.find((r) => r.region.key === "footer");

  const footerHeight = footerRegion
    ? footerRegion.groups.reduce((sum, g, i) => sum + g.totalHeight + (i > 0 ? template.spacing.entryGap : 0), 0)
    : 0;

  // Paginate each body region independently
  const pagesPerRegion: Record<RegionKey, PageColumn[]> = useMemo(() => {
    const out = {} as Record<RegionKey, PageColumn[]>;
    if (!allMeasured) return out;
    bodyRegions.forEach((r) => {
      const isFullPage = r.region.fullPageHeight;
      let available: number;
      if (isFullPage) {
        available = PAGE_HEIGHT_PX - r.region.padding * 2;
      } else if (r.region.key === "main") {
        available = r.region.height - headerHeight - (headerHeight > 0 ? template.spacing.sectionGap : 0) - (footerHeight > 0 ? footerHeight + template.spacing.sectionGap : 0);
      } else {
        available = r.region.height - (footerHeight > 0 ? footerHeight + template.spacing.sectionGap : 0);
      }
      out[r.region.key] = paginateRegion(r, available, template.spacing);
    });
    return out;
  }, [allMeasured, bodyRegions, headerHeight, footerHeight, template.spacing]);

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

  // Build final PageModel[]
  const pageModels: PageModel[] = useMemo(() => {
    const arr: PageModel[] = [];
    for (let i = 0; i < totalPages; i++) {
      const cols: PageColumn[] = [];
      bodyRegions.forEach((r) => {
        const p = pagesPerRegion[r.region.key]?.[i];
        if (p) cols.push(p);
        else cols.push({ region: r.region.key, blocks: [] });
      });
      arr.push({ index: i, columns: cols });
    }
    return arr;
  }, [totalPages, bodyRegions, pagesPerRegion]);

  return (
    <>
      <MeasurementLayer
        measurements={measureRequests}
        theme={template.theme}
        spacing={template.spacing}
        onMeasured={(h) => {
          setHeights((prev) => {
            // Only update if changed to avoid loops.
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
            ctxByRegion={ctxByRegion}
            headerRegion={headerRegion}
            footerRegion={footerRegion}
            headerHeight={headerHeight}
            footerHeight={footerHeight}
            showHeader={i === 0}
            showFooter={true}
            pageNumber={i + 1}
            pageCount={totalPages}
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
  ctxByRegion,
  headerRegion,
  footerRegion,
  headerHeight,
  footerHeight,
  showHeader,
  showFooter,
}: {
  page: PageModel;
  regions: Region[];
  template: Template;
  ctxByRegion: Record<RegionKey, { theme: Theme; spacing: Spacing; variant: Variant }>;
  headerRegion?: RegionMeasure;
  footerRegion?: RegionMeasure;
  headerHeight: number;
  footerHeight: number;
  showHeader: boolean;
  showFooter: boolean;
  pageNumber: number;
  pageCount: number;
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

  return (
    <div className="resume-page" style={pageStyle}>
      {regions.map((r) => {
        const isBody = r.key !== "header" && r.key !== "footer";
        const showThis =
          (r.key === "header" && showHeader) ||
          (r.key === "footer" && showFooter) ||
          isBody;
        if (!showThis) return null;

        // For a "main" body region on page 1 with a header, push down by header height.
        let y = r.y;
        let height = r.height;
        if (r.key === "main" && showHeader && headerHeight > 0) {
          y = r.y + headerHeight + s.sectionGap;
          height = r.height - headerHeight - s.sectionGap;
        }
        if (isBody && footerHeight > 0 && !r.fullPageHeight) {
          height = height - footerHeight - s.sectionGap;
        }

        const bodyBlocks = isBody
          ? page.columns.find((c) => c.region === r.key)?.blocks ?? []
          : r.groups.flatMap((g) => g.blocks);

        const bg = r.backgroundColor && r.backgroundColor !== "transparent" ? r.backgroundColor : undefined;

        const gapForBlocks = (blocks: Block[], groups: BlockGroup[]) => {
          // We use section-level gaps between blocks from different groups and
          // entryGap between blocks from same section. For rendered blocks we
          // just apply the templated section gap between top-level entries; a
          // finer-grained pass would map each rendered block back to its group.
          return blocks;
        };

        return (
          <div
            key={r.key}
            style={{
              position: "absolute",
              left: r.x,
              top: r.fullPageHeight ? 0 : y,
              width: r.width,
              height: r.fullPageHeight ? PAGE_HEIGHT_PX : height,
              padding: r.padding,
              boxSizing: "border-box",
              background: bg,
              color: r.variant === "sidebar" && bg ? t.sidebarText : undefined,
              display: "flex",
              flexDirection: "column",
              gap: computeRegionGap(r, template),
              overflow: "hidden",
            }}
          >
            {bodyBlocks.map((b, i) => (
              <BlockView
                key={i}
                block={b}
                ctx={{
                  theme: t,
                  spacing: s,
                  variant: r.variant,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function computeRegionGap(_r: Region, template: Template): number {
  // Rendered blocks are separated by entryGap; larger section gaps are baked
  // into the paginator's used-height accounting so preview matches print.
  return template.spacing.entryGap;
}
