import React, { useState, useRef } from 'react';
import type { Player, PlayerRole, BattingStyle, BowlingStyle } from '../../types/cricket';
import { X, UserPlus, Check, Image as ImageIcon, Globe, Hash, User, Upload } from 'lucide-react';

interface PlayerModalProps {
  playerToEdit?: Player | null;
  onSave: (playerData: Omit<Player, 'id' | 'stats'>) => void;
  onUpdate?: (player: Player) => void;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: 'av-1', label: 'Pro Star 1', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-2', label: 'Pro Star 2', url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-3', label: 'Pro Star 3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-4', label: 'Pro Star 4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-5', label: 'Pro Star 5', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-6', label: 'Pro Star 6', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
];

export const PlayerModal: React.FC<PlayerModalProps> = ({
  playerToEdit,
  onSave,
  onUpdate,
  onClose,
}) => {
  const [name, setName] = useState(playerToEdit?.name || '');
  const [role, setRole] = useState<PlayerRole>(playerToEdit?.role || 'Batsman');
  const [battingStyle, setBattingStyle] = useState<BattingStyle>(playerToEdit?.battingStyle || 'Right-hand');
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle>(playerToEdit?.bowlingStyle || 'Right-arm Fast');
  const [country, setCountry] = useState(playerToEdit?.country || 'India');
  const [jerseyNumber, setJerseyNumber] = useState<string>(playerToEdit?.jerseyNumber ? playerToEdit.jerseyNumber.toString() : '18');
  const [age, setAge] = useState<string>(playerToEdit?.age ? playerToEdit.age.toString() : '25');
  const [avatarUrl, setAvatarUrl] = useState(playerToEdit?.avatarUrl || PRESET_AVATARS[0].url);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setAvatarUrl(compressedBase64);
          }
        };
        if (typeof event.target?.result === 'string') {
          img.src = event.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      role,
      battingStyle,
      bowlingStyle,
      country: country.trim() || undefined,
      jerseyNumber: jerseyNumber ? Number(jerseyNumber) : undefined,
      age: age ? Number(age) : undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    };

    if (playerToEdit && onUpdate) {
      onUpdate({
        ...playerToEdit,
        ...payload,
      });
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {playerToEdit ? 'Edit Player Profile' : 'Add New Player Profile'}
            </h2>
            <p className="text-xs text-slate-400">Configure photo avatar, role, country & jersey specs</p>
          </div>
        </div>

        {/* Live Profile Card Preview Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center space-x-4 shadow-inner">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar Preview"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <User className="w-8 h-8" />
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-lg text-emerald-400 font-mono tracking-wide drop-shadow">
                {name || 'Player Name'}
              </h3>
              {jerseyNumber && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                  #{jerseyNumber}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                {role}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {country ? `${country} • ` : ''}{battingStyle}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          
          {/* Avatar Photo Source: Device Upload & Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Profile Photo Avatar</span>
              </label>

              {/* Upload from Device Action */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Device</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDeviceFileUpload}
                className="hidden"
              />
            </div>
            
            {/* Presets */}
            <div className="grid grid-cols-6 gap-2 mb-2">
              {PRESET_AVATARS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setAvatarUrl(av.url)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition transform active:scale-95 ${
                    avatarUrl === av.url ? 'border-emerald-400 ring-2 ring-emerald-500/30 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or enter image URL..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-extrabold text-slate-200 mb-1">
              Player Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Virat Kohli"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 text-sky-300 placeholder-slate-500 outline-none transition font-black text-base shadow-inner"
            />
          </div>

          {/* Country & Jersey Number & Age */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-extrabold text-slate-200 mb-1 flex items-center space-x-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Country</span>
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-emerald-400 text-white placeholder-slate-400 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1 flex items-center space-x-1">
                <Hash className="w-3 h-3 text-amber-400" />
                <span>Jersey #</span>
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="18"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-amber-400 text-white placeholder-slate-400 text-xs outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1">Age</label>
              <input
                type="number"
                min="14"
                max="60"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-emerald-400 text-white placeholder-slate-400 text-xs outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* Primary Role */}
          <div>
            <label className="block text-xs font-extrabold text-slate-200 mb-1">
              Primary Playing Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as PlayerRole)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-emerald-400 text-white font-extrabold outline-none transition"
            >
              <option value="Batsman" className="bg-slate-900 text-white font-bold">Batsman</option>
              <option value="Bowler" className="bg-slate-900 text-white font-bold">Bowler</option>
              <option value="All-Rounder" className="bg-slate-900 text-white font-bold">All-Rounder</option>
              <option value="Wicket-Keeper" className="bg-slate-900 text-white font-bold">Wicket-Keeper</option>
            </select>
          </div>

          {/* Batting & Bowling Styles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1">
                Batting Style
              </label>
              <select
                value={battingStyle}
                onChange={(e) => setBattingStyle(e.target.value as BattingStyle)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-emerald-400 text-white font-extrabold outline-none transition"
              >
                <option value="Right-hand" className="bg-slate-900 text-white font-bold">Right-hand</option>
                <option value="Left-hand" className="bg-slate-900 text-white font-bold">Left-hand</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1">
                Bowling Style
              </label>
              <select
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value as BowlingStyle)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-emerald-400 text-white font-extrabold outline-none transition"
              >
                <option value="Right-arm Fast" className="bg-slate-900 text-white font-bold">Right-arm Fast</option>
                <option value="Right-arm Medium" className="bg-slate-900 text-white font-bold">Right-arm Medium</option>
                <option value="Left-arm Fast" className="bg-slate-900 text-white font-bold">Left-arm Fast</option>
                <option value="Left-arm Spin" className="bg-slate-900 text-white font-bold">Left-arm Spin</option>
                <option value="Leg-spin" className="bg-slate-900 text-white font-bold">Leg-spin</option>
                <option value="Off-spin" className="bg-slate-900 text-white font-bold">Off-spin</option>
                <option value="None" className="bg-slate-900 text-white font-bold">None</option>
              </select>
            </div>
          </div>

          {/* Form Submit Buttons */}
          <div className="pt-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{playerToEdit ? 'Save Changes' : 'Create Profile'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
export default PlayerModal;
