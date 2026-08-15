import React, { useState, useMemo } from 'react';
import type { ShotZone } from '../../types/cricket';
import { X, Search, CheckCircle2, Layers } from 'lucide-react';

interface ShotZoneModalProps {
  runs: number;
  onSelectZone: (zone: ShotZone) => void;
  onClose: () => void;
}

interface GroundPlacement {
  id: string;
  name: string;
  cx: number; // dot x %
  cy: number; // dot y %
  bx: number; // badge x %
  by: number; // badge y %
  side: 'off' | 'leg' | 'straight';
  category: 'close' | 'infield' | 'outfield';
  isMain?: boolean; // 8 core zones
  isKey?: boolean;  // 16 key positions
}

const ALL_PLACEMENTS: GroundPlacement[] = [
  // ── TOP / BEHIND WICKET ──
  { id: 'deep-bw-fine-leg', name: 'Deep b/w fine leg', cx: 58, cy: 7, bx: 49, by: 7, side: 'leg', category: 'outfield' },
  { id: 'third-man', name: 'Third man', cx: 21, cy: 15, bx: 28, by: 15, side: 'off', category: 'outfield', isMain: true, isKey: true },
  { id: 'fine-leg', name: 'Fine leg', cx: 59, cy: 16, bx: 66, by: 16, side: 'leg', category: 'outfield', isMain: true, isKey: true },
  { id: 'long-leg', name: 'Long leg', cx: 72, cy: 20, bx: 80, by: 20, side: 'leg', category: 'outfield' },
  
  // ── SLIPS & CATCHING ──
  { id: 'third-slip', name: 'Third slip', cx: 34, cy: 25, bx: 16, by: 21, side: 'off', category: 'close' },
  { id: 'second-slip', name: 'Second slip', cx: 39, cy: 25, bx: 27, by: 21, side: 'off', category: 'close' },
  { id: 'first-slip', name: 'First slip', cx: 44, cy: 25, bx: 38, by: 21, side: 'off', category: 'close', isKey: true },
  { id: 'wicketkeeper', name: 'Wicketkeeper', cx: 50, cy: 25, bx: 50, by: 21, side: 'straight', category: 'close', isKey: true },
  { id: 'leg-slip', name: 'Leg slip', cx: 56, cy: 25, bx: 62, by: 21, side: 'leg', category: 'close' },

  // ── UPPER OFF SIDE ──
  { id: 'gully', name: 'Gully', cx: 31, cy: 32, bx: 37, by: 32, side: 'off', category: 'close', isKey: true },
  { id: 'backward-point', name: 'Backward point', cx: 20, cy: 31, bx: 19, by: 31, side: 'off', category: 'infield' },
  { id: 'point', name: 'Point', cx: 20, cy: 37, bx: 15, by: 37, side: 'off', category: 'infield', isMain: true, isKey: true },
  { id: 'silly-point', name: 'Silly point', cx: 39, cy: 38, bx: 32, by: 38, side: 'off', category: 'close' },
  { id: 'cover-point', name: 'Cover point', cx: 8, cy: 45, bx: 17, by: 45, side: 'off', category: 'infield' },

  // ── UPPER LEG SIDE ──
  { id: 'short-leg', name: 'Short leg', cx: 59, cy: 37, bx: 68, by: 37, side: 'leg', category: 'close' },
  { id: 'square-leg', name: 'Square leg', cx: 78, cy: 37, bx: 86, by: 37, side: 'leg', category: 'infield', isMain: true, isKey: true },
  { id: 'forward-short-leg', name: 'Forward short leg', cx: 59, cy: 42, bx: 70, by: 42, side: 'leg', category: 'close' },
  { id: 'deep-square-leg', name: 'Deep square leg', cx: 90, cy: 47, bx: 88, by: 47, side: 'leg', category: 'outfield', isKey: true },

  // ── MID OFF SIDE ──
  { id: 'sweeper', name: 'Sweeper', cx: 4, cy: 51, bx: 11, by: 51, side: 'off', category: 'outfield' },
  { id: 'silly-mid-off', name: 'Silly mid-off', cx: 42, cy: 47, bx: 34, by: 47, side: 'off', category: 'close' },
  { id: 'cover', name: 'Cover', cx: 15, cy: 56, bx: 20, by: 56, side: 'off', category: 'infield', isMain: true, isKey: true },
  { id: 'extra-cover', name: 'Extra cover', cx: 27, cy: 59, bx: 36, by: 59, side: 'off', category: 'infield', isKey: true },
  { id: 'deep-cover', name: 'Deep cover', cx: 9, cy: 61, bx: 17, by: 61, side: 'off', category: 'outfield', isKey: true },

  // ── MID LEG SIDE ──
  { id: 'silly-mid-on', name: 'Silly mid-on', cx: 56, cy: 48, bx: 65, by: 48, side: 'leg', category: 'close' },
  { id: 'mid-wicket', name: 'Mid-wicket', cx: 75, cy: 55, bx: 83, by: 55, side: 'leg', category: 'infield', isMain: true, isKey: true },
  { id: 'deep-mid-wicket', name: 'Deep mid-wicket', cx: 92, cy: 63, bx: 82, by: 63, side: 'leg', category: 'outfield', isKey: true },

  // ── LOWER OFF SIDE ──
  { id: 'deep-extra-cover', name: 'Deep extra cover', cx: 8, cy: 68, bx: 19, by: 68, side: 'off', category: 'outfield' },
  { id: 'wide-mid-off', name: 'Wide mid-off', cx: 36, cy: 71, bx: 30, by: 73, side: 'off', category: 'infield' },
  { id: 'mid-off', name: 'Mid-off', cx: 32, cy: 80, bx: 26, by: 80, side: 'off', category: 'infield', isKey: true },
  { id: 'long-off', name: 'Long-off', cx: 28, cy: 88, bx: 35, by: 88, side: 'off', category: 'outfield', isMain: true, isKey: true },

  // ── LOWER LEG SIDE & STRAIGHT ──
  { id: 'wide-mid-on', name: 'Wide mid-on', cx: 63, cy: 69, bx: 72, by: 69, side: 'leg', category: 'infield' },
  { id: 'bowler', name: 'Bowler', cx: 50, cy: 70, bx: 50, by: 73, side: 'straight', category: 'close' },
  { id: 'mid-on', name: 'Mid-on', cx: 62, cy: 79, bx: 68, by: 79, side: 'leg', category: 'infield', isKey: true },
  { id: 'long-on', name: 'Long-on', cx: 69, cy: 88, bx: 63, by: 88, side: 'leg', category: 'outfield', isMain: true, isKey: true },
  { id: 'straight-hit', name: 'Straight hit', cx: 50, cy: 89, bx: 50, by: 92, side: 'straight', category: 'outfield' },
];

export const ShotZoneModal: React.FC<ShotZoneModalProps> = ({ runs, onSelectZone, onClose }) => {
  const [viewMode, setViewMode] = useState<'main' | 'key' | 'all'>('main');
  const [sideFilter, setSideFilter] = useState<'all' | 'off' | 'leg'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isSix = runs === 6;
  const accentColor = isSix ? '#f59e0b' : '#10b981';

  // Filter placements cleanly so the diagram is never congested!
  const filteredPlacements = useMemo(() => {
    let list = ALL_PLACEMENTS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(p => p.name.toLowerCase().includes(q));
    }

    if (viewMode === 'main') {
      list = list.filter(p => p.isMain);
    } else if (viewMode === 'key') {
      list = list.filter(p => p.isKey);
    }

    if (sideFilter !== 'all') {
      list = list.filter(p => p.side === sideFilter || p.side === 'straight');
    }

    return list;
  }, [searchQuery, viewMode, sideFilter]);

  const handleSelect = (name: string, id: string) => {
    setSelectedId(id);
    setTimeout(() => {
      onSelectZone(name);
      onClose();
    }, 280);
  };

  const activePlacement = ALL_PLACEMENTS.find(p => p.id === (hoveredId || selectedId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/92 backdrop-blur-xl animate-fade-in">
      <div
        className="bg-slate-900 border-2 rounded-3xl max-w-lg w-full p-3 sm:p-5 shadow-2xl relative max-h-[96vh] flex flex-col overflow-hidden"
        style={{ borderColor: `${accentColor}50` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black"
              style={{ background: `${accentColor}20`, border: `2px solid ${accentColor}60`, color: accentColor }}
            >
              {runs}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {isSix ? '🚀 MAXIMUM SIX - GROUND ZONE' : `⚡ ${runs} RUN${runs > 1 ? 'S' : ''} - GROUND ZONE`}
              </h3>
              <p className="text-[11px] font-bold text-slate-300">
                Tap ground location or select position below
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle Bar (Un-congested Default View) */}
        <div className="flex items-center justify-between gap-1.5 mb-2 flex-shrink-0">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full">
            <button
              type="button"
              onClick={() => { setViewMode('main'); setSearchQuery(''); }}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-black transition flex items-center justify-center space-x-1 ${
                viewMode === 'main' && !searchQuery
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Main (8)</span>
            </button>

            <button
              type="button"
              onClick={() => { setViewMode('key'); setSearchQuery(''); }}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-black transition flex items-center justify-center space-x-1 ${
                viewMode === 'key' && !searchQuery
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Key (16)</span>
            </button>

            <button
              type="button"
              onClick={() => { setViewMode('all'); setSearchQuery(''); }}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-black transition flex items-center justify-center space-x-1 ${
                viewMode === 'all' && !searchQuery
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All 35</span>
            </button>
          </div>
        </div>

        {/* Quick Search & Side Filters */}
        <div className="flex items-center space-x-2 mb-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter position (e.g. Cover, Point, Slip)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-[11px] outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSideFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${sideFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSideFilter('off')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${sideFilter === 'off' ? 'bg-cyan-500 text-slate-950' : 'text-cyan-400'}`}
            >
              OFF
            </button>
            <button
              type="button"
              onClick={() => setSideFilter('leg')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${sideFilter === 'leg' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'}`}
            >
              LEG
            </button>
          </div>
        </div>

        {/* Ground Diagram Container */}
        <div className="relative w-full aspect-square max-w-[380px] mx-auto rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-[#4bb56d] flex-shrink-0">
          <svg viewBox="0 0 500 500" className="w-full h-full select-none">
            <defs>
              <linearGradient id="yellowPitch" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f3cc41" />
                <stop offset="50%" stopColor="#eed04e" />
                <stop offset="100%" stopColor="#f3cc41" />
              </linearGradient>
            </defs>

            {/* Outfield Grass Base */}
            <circle cx="250" cy="250" r="242" fill="#59b772" stroke="#ffffff" strokeWidth="6" />

            {/* 30-Yard Circle */}
            <circle
              cx="250"
              cy="250"
              r="145"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="7 5"
              opacity="0.85"
            />

            {/* Pitch */}
            <rect
              x="235"
              y="160"
              width="30"
              height="180"
              rx="4"
              fill="url(#yellowPitch)"
              stroke="#d4ac0d"
              strokeWidth="1.5"
            />

            {/* Crease Lines */}
            <line x1="230" y1="180" x2="270" y2="180" stroke="#78350f" strokeWidth="2" />
            <line x1="230" y1="320" x2="270" y2="320" stroke="#78350f" strokeWidth="2" />

            {/* Stumps */}
            <line x1="242" y1="178" x2="258" y2="178" stroke="#78350f" strokeWidth="3" />
            <line x1="242" y1="322" x2="258" y2="322" stroke="#78350f" strokeWidth="3" />

            {/* Batsman Silhouette Icon at Batting End (y=185) */}
            <circle cx="250" cy="185" r="4.5" fill="#0f172a" />
            <line x1="250" y1="189.5" x2="250" y2="198" stroke="#0f172a" strokeWidth="2.5" />
            <rect x="252" y="180" width="3" height="12" fill="#d97706" rx="0.5" transform="rotate(-20 252 180)" />

            {/* Trajectory Shot Line (Originating from Batsman End y=185) */}
            {selectedId && (() => {
              const sel = ALL_PLACEMENTS.find(p => p.id === selectedId);
              if (!sel) return null;
              return (
                <g>
                  <line
                    x1="250"
                    y1="185"
                    x2={(sel.cx / 100) * 500}
                    y2={(sel.cy / 100) * 500}
                    stroke={accentColor}
                    strokeWidth="4"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={(sel.cx / 100) * 500}
                    cy={(sel.cy / 100) * 500}
                    r="8"
                    fill={accentColor}
                  />
                </g>
              );
            })()}

            {/* Connecting Pin Lines & Dots */}
            {filteredPlacements.map((p) => {
              const dotX = (p.cx / 100) * 500;
              const dotY = (p.cy / 100) * 500;
              const badgeX = (p.bx / 100) * 500;
              const badgeY = (p.by / 100) * 500;

              return (
                <g key={`pin-${p.id}`}>
                  <line
                    x1={dotX}
                    y1={dotY}
                    x2={badgeX}
                    y2={badgeY}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                  <circle
                    cx={dotX}
                    cy={dotY}
                    r="4.5"
                    fill="#ffffff"
                    stroke="#2e2b44"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>

          {/* Clean, Non-Congested Interactive Badges */}
          {filteredPlacements.map((p) => {
            const isHov = hoveredId === p.id;
            const isSel = selectedId === p.id;

            let btnBg = '#3b3654';
            let btnColor = '#ffffff';
            let btnBorder = '#58517c';
            let btnTransform = 'translate(-50%, -50%) scale(1)';
            let btnZIndex = 10;
            let btnShadow = '0 4px 6px -1px rgba(0,0,0,0.4)';

            if (isSel) {
              btnBg = isSix ? '#f59e0b' : '#10b981';
              btnColor = '#0f172a';
              btnBorder = '#ffffff';
              btnTransform = 'translate(-50%, -50%) scale(1.15)';
              btnZIndex = 40;
              btnShadow = `0 0 16px ${btnBg}`;
            } else if (isHov) {
              btnBg = '#0284c7';
              btnColor = '#ffffff';
              btnBorder = '#ffffff';
              btnTransform = 'translate(-50%, -50%) scale(1.08)';
              btnZIndex = 30;
              btnShadow = '0 0 12px rgba(2,132,199,0.9)';
            }

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.name, p.id)}
                onTouchStart={() => setHoveredId(p.id)}
                onTouchEnd={() => setHoveredId(null)}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: 'absolute',
                  left: `${p.bx}%`,
                  top: `${p.by}%`,
                  transform: btnTransform,
                  backgroundColor: btnBg,
                  borderColor: btnBorder,
                  zIndex: btnZIndex,
                  boxShadow: btnShadow,
                }}
                className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black transition-all duration-150 whitespace-nowrap cursor-pointer border active:scale-95"
              >
                <span style={{ color: btnColor, fontWeight: 900 }}>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Position Info Footer */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5 flex items-center justify-between text-xs flex-shrink-0 mt-2">
          {activePlacement ? (
            <div className="flex items-center space-x-2 w-full justify-between">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" style={{ color: accentColor }} />
                <span className="font-extrabold text-white text-xs sm:text-sm">{activePlacement.name}</span>
              </div>
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase"
                style={{
                  backgroundColor: activePlacement.side === 'off' ? 'rgba(56, 189, 248, 0.2)' : activePlacement.side === 'leg' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: activePlacement.side === 'off' ? '#38bdf8' : activePlacement.side === 'leg' ? '#fbbf24' : '#34d399',
                }}
              >
                {activePlacement.side} side
              </span>
            </div>
          ) : (
            <span className="text-slate-300 font-bold mx-auto text-[11px]">
              Tap any badge on ground or search to record shot
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

export default ShotZoneModal;
