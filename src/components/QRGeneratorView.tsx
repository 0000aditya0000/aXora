import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ShortRoute } from '../types';
import { scanUrl } from '../lib/links';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  Link2,
  Palette,
  Layers,
  Printer,
  Share2,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface QRGeneratorViewProps {
  routes: ShortRoute[];
  onNotification: (msg: string) => void;
  onCopyLink: (text: string) => void;
  onOpenCreateModal: () => void;
}

export const QRGeneratorView: React.FC<QRGeneratorViewProps> = ({
  routes,
  onNotification,
  onCopyLink,
  onOpenCreateModal,
}) => {
  const [targetUrl, setTargetUrl] = useState<string>(
    routes[0] ? scanUrl(routes[0]) : 'https://axora.to'
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'custom');
  const [colorTheme, setColorTheme] = useState<'orange' | 'cyan' | 'emerald' | 'mono' | 'light'>('orange');
  const [eccLevel, setEccLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [includeCenterLogo, setIncludeCenterLogo] = useState(true);
  const [logoText, setLogoText] = useState('aX');
  const [resolution, setResolution] = useState<number>(1024);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const colorThemes = {
    orange: { dark: '#f97316', light: '#0a0e17', label: 'Ember Orange' },
    cyan: { dark: '#06b6d4', light: '#0a0e17', label: 'Cyber Cyan' },
    emerald: { dark: '#10b981', light: '#0a0e17', label: 'Emerald Green' },
    mono: { dark: '#f8fafc', light: '#0a0e17', label: 'Neon White' },
    light: { dark: '#0a0e17', light: '#ffffff', label: 'Classic Paper' },
  };

  const currentTheme = colorThemes[colorTheme];

  // Generate QR Code on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(
      canvas,
      targetUrl || 'https://axora.to',
      {
        width: 480,
        margin: 2,
        errorCorrectionLevel: eccLevel,
        color: {
          dark: currentTheme.dark,
          light: currentTheme.light,
        },
      },
      (err) => {
        if (err) {
          console.error('QR generation error:', err);
          return;
        }

        // Draw central logo if enabled (safely works when ECC is Q or H)
        if (includeCenterLogo) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const center = 480 / 2;
          const logoRadius = 480 * 0.12;

          // Outer circular badge
          ctx.beginPath();
          ctx.arc(center, center, logoRadius + 4, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.light;
          ctx.fill();

          // Inner circular badge
          ctx.beginPath();
          ctx.arc(center, center, logoRadius, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.dark;
          ctx.fill();

          // Symbol/Letters inside
          ctx.fillStyle = currentTheme.light;
          ctx.font = `bold ${Math.round(logoRadius * 1.05)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(logoText || 'aX', center, center + 1);
        }
      }
    );
  }, [targetUrl, colorTheme, eccLevel, includeCenterLogo, logoText]);

  useEffect(() => {
    if (routes[0] && (targetUrl === 'https://axora.to' || targetUrl === '')) {
      setSelectedRouteId(routes[0].id);
      setTargetUrl(scanUrl(routes[0]));
    }
  }, [routes, targetUrl]);

  const handleSelectRoute = (route: ShortRoute) => {
    setSelectedRouteId(route.id);
    setTargetUrl(scanUrl(route));
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // High resolution render
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = resolution;
    offscreenCanvas.height = resolution;

    QRCode.toCanvas(
      offscreenCanvas,
      targetUrl || 'https://axora.to',
      {
        width: resolution,
        margin: 3,
        errorCorrectionLevel: eccLevel,
        color: {
          dark: currentTheme.dark,
          light: currentTheme.light,
        },
      },
      () => {
        if (includeCenterLogo) {
          const ctx = offscreenCanvas.getContext('2d');
          if (ctx) {
            const center = resolution / 2;
            const logoRadius = resolution * 0.12;

            ctx.beginPath();
            ctx.arc(center, center, logoRadius + 8, 0, Math.PI * 2);
            ctx.fillStyle = currentTheme.light;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(center, center, logoRadius, 0, Math.PI * 2);
            ctx.fillStyle = currentTheme.dark;
            ctx.fill();

            ctx.fillStyle = currentTheme.light;
            ctx.font = `bold ${Math.round(logoRadius * 1.05)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(logoText || 'aX', center, center + 2);
          }
        }

        const pngUrl = offscreenCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `axora-qr-${Date.now()}-${resolution}px.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onNotification(`Downloaded ${resolution}x${resolution} PNG QR code!`);
      }
    );
  };

  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(targetUrl || 'https://axora.to', {
        type: 'svg',
        errorCorrectionLevel: eccLevel,
        margin: 2,
        color: {
          dark: currentTheme.dark,
          light: currentTheme.light,
        },
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = `axora-qr-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(svgUrl);
      onNotification('Downloaded crisp vector SVG QR code!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        onNotification('QR Code copied to clipboard as image!');
      });
    } catch (e) {
      onCopyLink(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - aXora</title>
          <style>
            body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px; margin: 0; }
            img { max-width: 380px; height: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
            h2 { margin-bottom: 8px; color: #0f172a; }
            p { font-family: monospace; color: #64748b; font-size: 14px; margin-top: 12px; word-break: break-all; }
          </style>
        </head>
        <body>
          <h2>Scannable QR Code</h2>
          <img src="${dataUrl}" alt="QR Code" />
          <p>${targetUrl}</p>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase">
              QR CODE STUDIO
            </span>
            <span className="text-xs text-slate-400">High-Resolution Vector & Raster Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-orange-400" />
            <span>QR Code Generator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Instantly create high-resolution, custom-styled scannable QR codes for your shortlinks or any URL.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="glow-orange-btn px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Link2 className="w-4 h-4" />
          <span>+ Create New Shortlink</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Target URL Input Panel */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Target URL or Shortlink
              </label>
              <span className="text-[11px] text-slate-400">Type any link or select below</span>
            </div>

            <div className="flex items-center gap-2 bg-[#090d16] p-2.5 rounded-xl border border-white/10 focus-within:border-orange-500/50 transition">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  setSelectedRouteId('custom');
                }}
                placeholder="https://axora.to/your-code or https://example.com"
                className="w-full bg-transparent text-white font-mono text-sm outline-none placeholder-slate-500 px-2"
              />
              {targetUrl && (
                <button
                  type="button"
                  onClick={() => setTargetUrl('')}
                  className="text-xs font-mono text-slate-500 hover:text-white px-2 py-1 rounded bg-white/5"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick-Pick from Your Shortlinks */}
            {routes.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono text-slate-400 block">
                  Quick select from your active shortlinks:
                </span>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {routes.slice(0, 8).map((route) => {
                    const isSelected = selectedRouteId === route.id;
                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => handleSelectRoute(route)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition flex items-center gap-1.5 border cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 font-bold'
                            : 'bg-[#121624] text-slate-400 hover:text-white border-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="text-orange-400">/</span>
                        <span>{route.shortCode}</span>
                        {route.activeRoutingTarget === 'Fallback' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Fallback Active" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Color Themes & Styling Panel */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-400" />
              Design & Palette Customization
            </h2>

            {/* Theme buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {(Object.keys(colorThemes) as Array<keyof typeof colorThemes>).map((key) => {
                const item = colorThemes[key];
                const active = colorTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColorTheme(key)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      active
                        ? 'bg-orange-500/15 border-orange-500 text-white shadow-md'
                        : 'bg-[#121624] border-white/5 hover:border-white/20 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: item.dark }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: item.light }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Emblem / Logo Settings */}
            <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium flex items-center justify-between">
                  <span>Center Emblem Overlay</span>
                  <input
                    type="checkbox"
                    checked={includeCenterLogo}
                    onChange={(e) => setIncludeCenterLogo(e.target.checked)}
                    className="accent-orange-500 rounded cursor-pointer"
                  />
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Adds high-contrast center monogram protected by Level H error recovery.
                </p>
              </div>

              {includeCenterLogo && (
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">Emblem Monogram</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    className="w-full bg-[#090d16] px-3 py-2 rounded-xl border border-white/10 text-white font-mono text-xs focus:border-orange-500 outline-none"
                    placeholder="e.g. aX, QR, GO"
                  />
                </div>
              )}
            </div>

            {/* Advanced: Error Correction & Resolution */}
            <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Error Correction Level (ECC)
                </label>
                <select
                  value={eccLevel}
                  onChange={(e) => setEccLevel(e.target.value as any)}
                  className="w-full bg-[#090d16] px-3 py-2 rounded-xl border border-white/10 text-slate-200 text-xs outline-none cursor-pointer"
                >
                  <option value="H">Level H - 30% Redundancy (Best for Logos)</option>
                  <option value="Q">Level Q - 25% Redundancy</option>
                  <option value="M">Level M - 15% Redundancy</option>
                  <option value="L">Level L - 7% Redundancy</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Export Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(Number(e.target.value))}
                  className="w-full bg-[#090d16] px-3 py-2 rounded-xl border border-white/10 text-slate-200 text-xs outline-none cursor-pointer"
                >
                  <option value={512}>512 x 512 px (Digital / Web)</option>
                  <option value={1024}>1024 x 1024 px (HD / Social)</option>
                  <option value={2048}>2048 x 2048 px (Ultra Print Quality)</option>
                  <option value={4096}>4096 x 4096 px (Billboard / Packaging)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive QR Canvas & Downloads (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel p-6 rounded-2xl border border-orange-500/30 flex flex-col items-center justify-center shadow-2xl relative">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                100% Scannable
              </span>
            </div>

            {/* Canvas Box */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl flex items-center justify-center max-w-full ${
                colorTheme === 'light'
                  ? 'bg-white border-slate-300'
                  : 'bg-[#0a0e17] border-white/10'
              }`}
            >
              <canvas
                ref={canvasRef}
                style={{ width: '280px', height: '280px' }}
                className="rounded-lg max-w-full h-auto cursor-pointer"
                title="Click to copy image"
                onClick={handleCopyImage}
              />
            </div>

            {/* Scanned Destination Preview */}
            <div className="w-full mt-4 p-3 rounded-xl bg-black/50 border border-white/5 space-y-1 text-center font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Encoded Destination URL:
              </span>
              <span className="text-xs text-orange-300 font-bold truncate block px-2" title={targetUrl}>
                {targetUrl}
              </span>
            </div>

            {/* Action Buttons Grid */}
            <div className="w-full grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="glow-orange-btn py-2.5 px-3 rounded-xl text-white font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSVG}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-mono text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-orange-400" />
                <span>Vector (SVG)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Image'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print QR</span>
              </button>
            </div>
          </div>

          {/* Quick tips callout */}
          <div className="p-4 rounded-xl bg-[#121624] border border-white/5 text-xs text-slate-400 space-y-2 font-sans">
            <div className="font-semibold text-white flex items-center gap-1.5 font-mono">
              <Zap className="w-4 h-4 text-orange-400" />
              Pro Tip: Dynamic QR Codes with Auto-Failover
            </div>
            <p className="text-[11px] leading-relaxed">
              When you generate a QR code for an <strong>axora.to/...</strong> shortlink, you can change its destination URL anytime — or let the auto-failover engine automatically redirect scanners to your backup website if your primary server goes down — without reprinting the QR code!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
