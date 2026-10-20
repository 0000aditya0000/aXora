import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { scanUrl } from '../lib/links';
import { Download, QrCode, Copy, Check, Sparkles, RefreshCw, Palette } from 'lucide-react';

interface QRCodeDisplayProps {
  slug?: string;
  url?: string;
  domain?: string;
  onNotification?: (msg: string) => void;
  size?: number;
  showCustomizer?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  slug,
  url,
  onNotification,
  size = 220,
  showCustomizer = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'orange' | 'cyan' | 'emerald' | 'light' | 'mono'>('orange');
  const [includeLogo, setIncludeLogo] = useState(true);

  const fullUrl = url || (slug ? scanUrl(slug) : 'https://axora.to');

  // Color schemes
  const colorSchemes = {
    orange: { dark: '#f97316', light: '#0a0e17', ring: '#ea580c' },
    cyan: { dark: '#06b6d4', light: '#0a0e17', ring: '#0891b2' },
    emerald: { dark: '#10b981', light: '#0a0e17', ring: '#059669' },
    light: { dark: '#090d16', light: '#ffffff', ring: '#e2e8f0' },
    mono: { dark: '#f8fafc', light: '#0a0e17', ring: '#334155' },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentColors = colorSchemes[theme];

    // High error correction 'H' allows overlaying central logo without losing scanability
    QRCode.toCanvas(
      canvas,
      fullUrl,
      {
        width: size * 2, // render at 2x for retina sharpness
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: currentColors.dark,
          light: currentColors.light,
        },
      },
      (err) => {
        if (err) {
          console.error('Error generating QR code', err);
          return;
        }

        // Draw central logo emblem if enabled
        if (includeLogo) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const center = (size * 2) / 2;
          const logoRadius = (size * 2) * 0.12;

          // Outer circle background
          ctx.beginPath();
          ctx.arc(center, center, logoRadius + 4, 0, Math.PI * 2);
          ctx.fillStyle = currentColors.light;
          ctx.fill();

          // Inner emblem
          ctx.beginPath();
          ctx.arc(center, center, logoRadius, 0, Math.PI * 2);
          ctx.fillStyle = currentColors.dark;
          ctx.fill();

          // Symbol inside emblem
          ctx.fillStyle = currentColors.light;
          ctx.font = `bold ${Math.round(logoRadius * 1.1)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('aX', center, center + 1);
        }
      }
    );
  }, [fullUrl, size, theme, includeLogo]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `axora-qr-${slug || 'code'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    onNotification?.(`Downloaded high-res scannable QR Code for ${fullUrl}`);
  };

  const downloadSVG = async () => {
    try {
      const currentColors = colorSchemes[theme];
      const svgString = await QRCode.toString(fullUrl, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
          dark: currentColors.dark,
          light: currentColors.light,
        },
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `axora-qr-${slug || 'code'}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
      onNotification?.(`Downloaded vector SVG QR Code for ${fullUrl}`);
    } catch (e) {
      console.error(e);
    }
  };

  const copyImageToClipboard = async () => {
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
        onNotification?.('QR Code copied to clipboard as image!');
      });
    } catch (err) {
      // Fallback: copy URL
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onNotification?.(`Copied link URL: ${fullUrl}`);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* QR Canvas Preview Container */}
      <div
        className={`relative p-4 rounded-2xl border transition-all duration-300 shadow-xl flex items-center justify-center ${
          theme === 'light'
            ? 'bg-white border-slate-300'
            : 'bg-[#0a0e17] border-white/10'
        }`}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="rounded-lg max-w-full h-auto cursor-pointer"
          title="Click to copy QR Code"
          onClick={copyImageToClipboard}
        />
      </div>

      {/* URL label below */}
      <div className="w-full text-center mt-3 font-mono text-xs text-slate-300 truncate max-w-xs" title={fullUrl}>
        {fullUrl}
      </div>

      {/* Optional Theme Quick Switcher */}
      {showCustomizer && (
        <div className="w-full mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-orange-400" />
              Theme Style
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
                className="rounded accent-orange-500 cursor-pointer"
              />
              <span>Center Emblem</span>
            </label>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => setTheme('orange')}
              className={`p-1.5 rounded-lg text-[10px] font-mono transition border ${
                theme === 'orange'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 font-bold'
                  : 'bg-black/40 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              Orange
            </button>
            <button
              type="button"
              onClick={() => setTheme('cyan')}
              className={`p-1.5 rounded-lg text-[10px] font-mono transition border ${
                theme === 'cyan'
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-bold'
                  : 'bg-black/40 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              Cyan
            </button>
            <button
              type="button"
              onClick={() => setTheme('emerald')}
              className={`p-1.5 rounded-lg text-[10px] font-mono transition border ${
                theme === 'emerald'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'bg-black/40 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              Emerald
            </button>
            <button
              type="button"
              onClick={() => setTheme('mono')}
              className={`p-1.5 rounded-lg text-[10px] font-mono transition border ${
                theme === 'mono'
                  ? 'bg-slate-700/40 text-white border-slate-500 font-bold'
                  : 'bg-black/40 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg text-[10px] font-mono transition border ${
                theme === 'light'
                  ? 'bg-white text-slate-900 border-white font-bold'
                  : 'bg-black/40 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              Light
            </button>
          </div>
        </div>
      )}

      {/* Meta Specs */}
      <div className="flex items-center justify-between w-full mt-3 text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400">
          <QrCode className="w-3.5 h-3.5" />
          Scannable ECC 'H' (30%)
        </span>
        <button
          type="button"
          onClick={copyImageToClipboard}
          className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Download Action Buttons */}
      <div className="grid grid-cols-2 gap-2 w-full mt-3">
        <button
          type="button"
          onClick={downloadPNG}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition text-xs font-semibold cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>PNG (Raster)</span>
        </button>
        <button
          type="button"
          onClick={downloadSVG}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/20 transition text-xs font-semibold cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-orange-400" />
          <span>SVG (Vector)</span>
        </button>
      </div>
    </div>
  );
};
