import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import type { ThemeMode } from '../../context/CricketContext';
import { Trophy, Plus, RotateCw, Activity, Users, FileText, BarChart3, History, Palette, Medal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import MatchSetupModal from '../match/MatchSetupModal';

interface NavItem {
  id: 'scoring' | 'players' | 'scorecard' | 'analytics' | 'history' | 'series';
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export const Navbar: React.FC = () => {
  const { activeMatch, activeTab, setActiveTab, theme, setTheme } = useCricket();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const navItems: NavItem[] = [
    { id: 'scoring', label: 'Live Scoring', icon: Activity, badge: activeMatch?.status === 'live' ? 'LIVE' : undefined },
    { id: 'series', label: 'Series & Tournaments', icon: Medal },
    { id: 'players', label: 'Players Roster', icon: Users },
    { id: 'scorecard', label: 'Scorecard', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'Match History', icon: History },
  ];

  const themes: { id: ThemeMode; label: string; color: string }[] = [
    { id: 'testcricket', label: '🔴 Test Match Whites', color: 'bg-white border-red-500 text-red-600' },
    { id: 'county', label: '🌾 County Cream & Gold', color: 'bg-amber-50 border-amber-500 text-amber-700' },
    { id: 'lords', label: '🌿 Lord’s Pavilion Green', color: 'bg-emerald-50 border-emerald-600 text-emerald-800' },
    { id: 'oceaniablue', label: '🌊 Oceania ODI Navy', color: 'bg-sky-950 border-sky-500 text-sky-300' },
    { id: 'daylight', label: '☀️ Daylight Mode', color: 'bg-slate-100 border-slate-400 text-slate-900' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo / Title */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('scoring')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <Trophy className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                  CricPulse Live
                </h1>
                <p className="text-xs text-slate-400 font-medium">Pro Scorekeeper & Player Analytics</p>
              </div>
            </div>

            {/* Quick Actions & Theme Picker */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Theme Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeMenu(prev => !prev)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center space-x-1.5 border border-slate-700/80"
                  title="Change Theme Background Color"
                >
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline font-semibold capitalize">{theme}</span>
                </button>

                {showThemeMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block py-1">
                      Theme Backgrounds
                    </span>
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          theme === t.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border ${t.color}`} />
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowSetupModal(true)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Match</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                title="Refresh page to sync latest saved database data"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center space-x-1.5 border border-slate-700/80 active:scale-95"
              >
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline font-semibold">Refresh Page</span>
              </button>

            </div>
          </div>
        </div>

        {/* Tab Navigation Menu (Desktop & Tablet Header bar) */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto no-scrollbar hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 flex space-x-2 sm:space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 py-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Tab Bar (< 640px) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg sm:hidden pb-safe">
        <div className="flex items-center justify-around py-1 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={`mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition relative min-w-[54px] ${
                  isActive
                    ? 'text-emerald-400 font-bold bg-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                  {item.id === 'scoring' ? 'Scoring' : item.id === 'series' ? 'Series' : item.id === 'players' ? 'Players' : item.id === 'scorecard' ? 'Scorecard' : item.id === 'analytics' ? 'Analytics' : 'History'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {showSetupModal && (
        <MatchSetupModal onClose={() => setShowSetupModal(false)} />
      )}
    </>
  );
};
export default Navbar;
