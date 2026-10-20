import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, ArrowRight, X } from 'lucide-react';
import { ShortRoute } from '../types';
import { shortLabel } from '../lib/links';

interface BulkImportViewProps {
  onImportRoutes: (routes: Partial<ShortRoute>[]) => void;
  onNotification: (msg: string) => void;
  onSwitchView: (view: any) => void;
}

export const BulkImportView: React.FC<BulkImportViewProps> = ({
  onImportRoutes,
  onNotification,
  onSwitchView,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<
    { alias: string; dest: string; campaign: string; status: 'Valid' | 'Conflict' }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const sampleCsvContent = `slug,destination_url,campaign,tags
q4-announcement,https://pulseanalytics.cloud/press/q4-announcement,Q3 Global Growth,"#press,#q4"
summit-keynote,https://conference.axora.io/keynote-livestream,Product Launch 2025,"#livestream"
partner-perks,https://store.enterprise.com/partners/vip-perks,Black Friday & Cyber Week,"#vip,#deals"
developer-docs-v2,https://docs.axora.io/quickstart-2025,Engineering Docs Relink,"#docs,#sdk"`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'axora-bulk-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotification('Downloaded CSV sample template');
  };

  const simulateLoadData = () => {
    setParsedRows([
      {
        alias: 'q4-announcement',
        dest: 'https://pulseanalytics.cloud/press/q4-announcement',
        campaign: 'Q3 Global Growth',
        status: 'Valid',
      },
      {
        alias: 'summit-keynote',
        dest: 'https://conference.axora.io/keynote-livestream',
        campaign: 'Product Launch 2025',
        status: 'Valid',
      },
      {
        alias: 'partner-perks',
        dest: 'https://store.enterprise.com/partners/vip-perks',
        campaign: 'Black Friday & Cyber Week',
        status: 'Valid',
      },
      {
        alias: 'developer-docs-v2',
        dest: 'https://docs.axora.io/quickstart-2025',
        campaign: 'Engineering Docs Relink',
        status: 'Valid',
      },
    ]);
    onNotification('Parsed 4 routes from sample batch upload');
  };

  const handleFinalImport = () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      const newItems = parsedRows.map((r) => ({
        shortCode: r.alias,
        originalDestination: r.dest,
        campaign: r.campaign,
        clicks: 0,
        uniqueVisitors: 0,
        ctr: 0,
        edgeStatus: 'Active' as const,
        tags: ['#bulk-import'],
        passcodeEnabled: false,
        clickThreshold: 50000,
        ttl: '30d',
      }));
      onImportRoutes(newItems);
      setIsProcessing(false);
      onNotification(`Imported and deployed ${parsedRows.length} shortlinks to edge nodes!`);
      onSwitchView('campaigns');
    }, 1000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header card */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-sans">Bulk Shortlink Ingestion</h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6">
          Upload CSV or JSON files with thousands of URLs. aXora will automatically generate aliases, issue dynamic QR codes, and provision SSL certs at edge nodes.
        </p>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            simulateLoadData();
          }}
          onClick={simulateLoadData}
          className={`p-8 border-2 border-dashed rounded-2xl transition cursor-pointer mb-6 group ${
            dragActive
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-white/15 hover:border-orange-500/50 bg-[#090d16]/60'
          }`}
        >
          <FileSpreadsheet className="w-8 h-8 text-slate-500 group-hover:text-orange-400 mx-auto mb-2 transition" />
          <div className="text-sm font-semibold text-white">Click to upload or drag and drop</div>
          <div className="text-xs text-slate-500 font-mono mt-1">
            .CSV, .TSV or .JSON (Up to 50,000 URLs per batch)
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={handleDownloadTemplate}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold glow-orange-btn text-white transition cursor-pointer flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Sample Template</span>
          </button>
          <button
            onClick={simulateLoadData}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white border border-white/10 hover:bg-white/5 transition cursor-pointer"
          >
            Load Sample Batch Preview
          </button>
        </div>
      </div>

      {/* Batch Preview Table if rows exist */}
      {parsedRows.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Parsed Ingestion Batch Preview ({parsedRows.length} routes)</span>
            </h3>
            <button
              onClick={() => setParsedRows([])}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090d16] text-slate-400 uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Generated Alias</th>
                  <th className="py-2.5 px-3">Target Destination URL</th>
                  <th className="py-2.5 px-3">Assigned Campaign</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-mono text-orange-400 font-semibold">
                      {shortLabel(row.alias)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-xs max-w-xs truncate">
                      {row.dest}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{row.campaign}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Ready to Deploy
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={handleFinalImport}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white glow-orange-btn flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Provisioning SSL & DNS...</span>
                </>
              ) : (
                <>
                  <span>Deploy All {parsedRows.length} Links to Edge</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
