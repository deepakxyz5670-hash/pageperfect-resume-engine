import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Printer, FileJson, FileDown, Upload, RotateCcw } from "lucide-react";
import { ResumeDocument, PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from "@/resume/engine";
import { normalizeResume, sampleResume, type Resume } from "@/resume/schema";
import { templates, getTemplate } from "@/resume/templates";
import { TemplateThumb } from "@/resume/TemplateThumb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resume Builder — print-accurate document engine" },
      {
        name: "description",
        content:
          "Import JSON, pick a template, preview A4 pages, and print or export to PDF. Preview matches print exactly.",
      },
      { property: "og:title", content: "Resume Builder" },
      {
        property: "og:description",
        content:
          "A print-accurate resume builder with measurement-driven pagination and multiple templates.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Builder,
});

const STORAGE_KEY = "resume.data.v1";
const TEMPLATE_KEY = "resume.template.v1";

function Builder() {
  const [resume, setResume] = useState<Resume>(sampleResume);
  const [templateId, setTemplateId] = useState<string>("modern");
  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(sampleResume, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(0.72);
  const fileRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const r = normalizeResume(JSON.parse(saved));
        setResume(r);
        setJsonText(JSON.stringify(r, null, 2));
      }
      const savedTpl = localStorage.getItem(TEMPLATE_KEY);
      if (savedTpl) setTemplateId(savedTpl);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
    } catch {
      // ignore
    }
  }, [resume]);
  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_KEY, templateId);
    } catch {
      // ignore
    }
  }, [templateId]);

  const template = useMemo(() => getTemplate(templateId), [templateId]);

  const applyJson = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      const norm = normalizeResume(parsed);
      setResume(norm);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      applyJson(text);
    };
    reader.readAsText(file);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resume.profile.fullName || "resume").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setResume(sampleResume);
    setJsonText(JSON.stringify(sampleResume, null, 2));
    setJsonError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Toolbar */}
      <header className="no-print sticky top-0 z-20 flex flex-col gap-2 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-3">
            <div className="h-7 w-7 rounded-md bg-neutral-900 text-white grid place-items-center text-xs font-bold">R</div>
            <div className="font-semibold tracking-tight">Resume Studio</div>
          </div>
          <div className="mx-2 h-6 w-px bg-neutral-200" />
          <label className="text-xs text-neutral-500">Template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm max-w-[220px]"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="mx-2 h-6 w-px bg-neutral-200" />
          <label className="text-xs text-neutral-500">Zoom</label>
          <input
            type="range"
            min={0.4}
            max={1.2}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-28"
          />
          <span className="w-10 text-xs tabular-nums text-neutral-500">{Math.round(zoom * 100)}%</span>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-neutral-500">
              {pageCount} page{pageCount === 1 ? "" : "s"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              <Upload size={14} /> Import JSON
            </button>
            <button
              onClick={exportJson}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              <FileJson size={14} /> Export JSON
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>
        {/* Template thumbnail slider */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 -mx-1 px-1 scrollbar-thin">
          {templates.map((t) => (
            <div key={t.id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <TemplateThumb
                template={t}
                selected={t.id === templateId}
                onClick={() => setTemplateId(t.id)}
              />
              <div
                className={`text-[10px] leading-tight max-w-[120px] truncate ${
                  t.id === templateId ? "text-neutral-900 font-medium" : "text-neutral-500"
                }`}
              >
                {t.name}
              </div>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-1" style={{ minHeight: "calc(100vh - 220px)" }}>
        {/* Sidebar: JSON editor */}
        <aside className="no-print flex w-[380px] shrink-0 flex-col border-r border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
            <div className="text-sm font-medium">Resume JSON</div>
            <div className="text-xs text-neutral-500 flex items-center gap-1">
              <FileDown size={12} /> Edits update preview live
            </div>
          </div>
          <textarea
            spellCheck={false}
            value={jsonText}
            onChange={(e) => applyJson(e.target.value)}
            className="flex-1 resize-none border-0 p-4 font-mono text-[11px] leading-relaxed outline-none"
          />
          {jsonError && (
            <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {jsonError}
            </div>
          )}
          <div className="border-t border-neutral-200 px-4 py-3">
            <div className="text-xs font-medium mb-2">{template.name}</div>
            <div className="text-xs text-neutral-500">{template.description}</div>
          </div>
        </aside>

        {/* Preview */}
        <main className="flex-1 overflow-auto p-8">
          <div id="print-root" className="mx-auto flex flex-col items-center gap-6">
            <div
              style={{
                width: PAGE_WIDTH_PX * zoom,
                display: "flex",
                flexDirection: "column",
                gap: 24 * zoom,
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  width: PAGE_WIDTH_PX,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <ResumeDocument
                    resume={resume}
                    template={template}
                    onPageCount={setPageCount}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Print styles — the preview DOM IS the printed output */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
          /* Hide everything, then reveal only the pages */
          body * { visibility: hidden !important; }
          #print-root, #print-root * { visibility: visible !important; }
          /* Neutralize layout wrappers (flex containers, scroll areas, zoom transforms) */
          #print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: ${PAGE_WIDTH_PX}px !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          #print-root > div,
          #print-root > div > div,
          #print-root > div > div > div {
            transform: none !important;
            width: ${PAGE_WIDTH_PX}px !important;
            gap: 0 !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .resume-page {
            width: ${PAGE_WIDTH_PX}px !important;
            height: ${PAGE_HEIGHT_PX}px !important;
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
            border: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
          }
          .resume-page:last-child { page-break-after: auto; break-after: auto; }
        }
        .resume-page {
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
}
