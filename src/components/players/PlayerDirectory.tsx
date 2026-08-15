import React, { useState, useMemo } from 'react';
import { useCricket } from '../../context/CricketContext';
import type { Player } from '../../types/cricket';
import PlayerCard from './PlayerCard';
import PlayerModal from './PlayerModal';
import PlayerProfileModal from './PlayerProfileModal';
import { Search, Plus, Users, Filter } from 'lucide-react';

export const PlayerDirectory: React.FC = () => {
  const { players, addPlayer, updatePlayer, deletePlayer } = useCricket();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);

  const roles = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'All' || p.role === selectedRole;
      return matchesName && matchesRole;
    });
  }, [players, searchTerm, selectedRole]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Player Directory & Roster</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage your team squad, view aggregated career stats, or recruit new players.
          </p>
        </div>

        <button
          onClick={() => { setEditingPlayer(null); setShowAddModal(true); }}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Player</span>
        </button>
      </div>

      {/* Search & Role Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by player name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block mr-1" />
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedRole === role
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onSelect={(p) => setViewingPlayer(p)}
              onEdit={(p) => { setEditingPlayer(p); setShowAddModal(true); }}
              onDelete={(id) => deletePlayer(id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No Players Found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria or add a new player.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <PlayerModal
          playerToEdit={editingPlayer}
          onSave={addPlayer}
          onUpdate={updatePlayer}
          onClose={() => { setShowAddModal(false); setEditingPlayer(null); }}
        />
      )}

      {/* Career Profile Modal */}
      {viewingPlayer && (
        <PlayerProfileModal
          player={viewingPlayer}
          onEdit={(p) => { setEditingPlayer(p); setShowAddModal(true); }}
          onClose={() => setViewingPlayer(null)}
        />
      )}

    </div>
  );
};
export default PlayerDirectory;
