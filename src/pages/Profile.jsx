import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { User, Star, Trophy, Layers, CheckCircle2, XCircle, Clock, Trash2, Pencil, Check, Search, X, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLivePlayers } from '@/lib/useLivePlayers';
import { mockPlayers } from '@/lib/mockData';
import TeamLogo from '@/components/common/TeamLogo';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-chart-4 bg-chart-4/10 border-chart-4/20' },
  won: { label: 'Won', icon: CheckCircle2, color: 'text-primary bg-primary/10 border-primary/20' },
  lost: { label: 'Lost', icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20' },
};

function ParlayCard({ parlay, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = React.useState(false);
  const cfg = statusConfig[parlay.status] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className={cn(
      "rounded-xl border bg-card p-4 transition-all",
      parlay.status === 'won' ? "border-primary/20" : parlay.status === 'lost' ? "border-destructive/20" : "border-border"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground text-sm">{parlay.name || `${parlay.legs?.length}-Leg Parlay`}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{parlay.game_date} · {parlay.legs?.length} legs · ${parlay.wager} wager</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] flex items-center gap-1", cfg.color)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </Badge>
          <button onClick={() => onDelete(parlay.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {parlay.legs?.slice(0, expanded ? undefined : 3).map((leg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <TeamLogo team={leg.team} className="w-5 h-5" />
            <span className="font-medium text-foreground">{leg.player_name}</span>
            <span className={cn("font-bold", leg.pick === 'over' ? 'text-primary' : 'text-foreground')}>
              {leg.pick?.toUpperCase()}
            </span>
            <span>{leg.line} {leg.prop_type?.toUpperCase()}</span>
          </div>
        ))}
        {parlay.legs?.length > 3 && !expanded && (
          <button onClick={() => setExpanded(true)} className="text-[10px] text-primary hover:text-primary/80 transition-colors pl-7 font-medium">
            +{parlay.legs.length - 3} more legs
          </button>
        )}
        {expanded && parlay.legs?.length > 3 && (
          <button onClick={() => setExpanded(false)} className="text-[10px] text-primary hover:text-primary/80 transition-colors pl-7 font-medium">
            Show less
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Odds:</span>
          <span className="font-bold text-foreground">{parlay.combined_odds}</span>
          <span className="text-muted-foreground ml-2">Payout:</span>
          <span className="font-bold text-primary">${parlay.potential_payout?.toFixed(2)}</span>
        </div>
        {parlay.status === 'pending' && (
          <div className="flex gap-1.5">
            <button
              onClick={() => onStatusChange(parlay.id, 'won')}
              className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md transition-all font-medium"
            >
              Mark Won
            </button>
            <button
              onClick={() => onStatusChange(parlay.id, 'lost')}
              className="text-[10px] bg-destructive/10 hover:bg-destructive/20 text-destructive px-2 py-1 rounded-md transition-all font-medium"
            >
              Mark Lost
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const { logout } = useAuth();
  const { players } = useLivePlayers();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [parlays, setParlays] = useState([]);
  const [loadingParlays, setLoadingParlays] = useState(true);
  const [user, setUser] = useState(null);
  const [preferredName, setPreferredName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      setUser(me);
      const savedFavs = me?.favorite_players || [];
      setFavorites(savedFavs);
      const savedName = me?.preferred_name || '';
      setPreferredName(savedName);
      setNameInput(savedName);
    }
    load();
  }, []);

  useEffect(() => {
    loadParlays();
  }, []);

  async function loadParlays() {
    setLoadingParlays(true);
    const data = await base44.entities.SavedParlay.list('-created_date');
    setParlays(data);
    setLoadingParlays(false);
  }

  const savePreferredName = async () => {
    await base44.auth.updateMe({ preferred_name: nameInput.trim() });
    setPreferredName(nameInput.trim());
    setEditingName(false);
    toast.success('Name updated!');
  };

  const toggleFavorite = async (name) => {
    const next = favorites.includes(name)
      ? favorites.filter(n => n !== name)
      : [...favorites, name];
    setFavorites(next);
    await base44.auth.updateMe({ favorite_players: next });
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.SavedParlay.update(id, { status });
    setParlays(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast.success(`Parlay marked as ${status}!`);
  };

  const handleDelete = async (id) => {
    await base44.entities.SavedParlay.delete(id);
    setParlays(prev => prev.filter(p => p.id !== id));
    toast.success('Parlay deleted');
  };

  // Compute stats from real data
  const settled = parlays.filter(p => p.status !== 'pending');
  const wins = parlays.filter(p => p.status === 'won').length;
  const losses = parlays.filter(p => p.status === 'lost').length;
  const totalPicks = settled.length;
  const winRate = totalPicks > 0 ? ((wins / totalPicks) * 100).toFixed(1) : '0.0';

  // ROI: sum of (payout - wager) for wins, minus wager for losses, divided by total wagered
  const totalWagered = settled.reduce((acc, p) => acc + (p.wager || 0), 0);
  const totalReturn = parlays.filter(p => p.status === 'won').reduce((acc, p) => acc + (p.potential_payout || 0), 0)
    - parlays.filter(p => p.status === 'lost').reduce((acc, p) => acc + (p.wager || 0), 0);
  const roi = totalWagered > 0 ? ((totalReturn / totalWagered) * 100).toFixed(1) : '0.0';

  // Best win streak
  const sortedSettled = [...parlays].filter(p => p.status !== 'pending').sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  let bestStreak = 0, curStreak = 0;
  sortedSettled.forEach(p => {
    if (p.status === 'won') { curStreak++; bestStreak = Math.max(bestStreak, curStreak); }
    else curStreak = 0;
  });

  const pending = parlays.filter(p => p.status === 'pending');
  const settled2 = parlays.filter(p => p.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
         <div className="flex items-center justify-between mb-4">
           <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
             <User className="w-7 h-7 text-muted-foreground" />
             My Profile
           </h1>
           <button
             onClick={logout}
             className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-all"
           >
             <LogOut className="w-4 h-4" />
             Log Out
           </button>
         </div>
         {user && (
         <div className="flex items-center gap-2 mt-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && savePreferredName()}
                placeholder="Enter preferred name"
                className="h-7 text-sm bg-secondary border-border w-48"
                autoFocus
              />
              <button onClick={savePreferredName} className="text-primary hover:text-primary/80 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setEditingName(false); setNameInput(preferredName); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {preferredName || user.full_name || user.email}
              </p>
              <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-primary transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
      </div>

      {/* Performance Stats */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-chart-4" /> Parlay Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalPicks}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Settled</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className={cn("text-2xl font-bold", parseFloat(winRate) >= 50 ? 'text-primary' : 'text-destructive')}>{winRate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Win Rate</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className={cn("text-2xl font-bold", parseFloat(roi) >= 0 ? 'text-primary' : 'text-destructive')}>
              {parseFloat(roi) >= 0 ? '+' : ''}{roi}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">ROI</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-chart-4">{bestStreak}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Best Streak</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Wins</span>
            <span className="text-sm font-bold text-primary">{wins}</span>
          </div>
          <div className="flex items-center justify-between bg-destructive/5 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Losses</span>
            <span className="text-sm font-bold text-destructive">{losses}</span>
          </div>
        </div>
      </div>

      {/* Pending Parlays */}
      {pending.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-chart-4" /> Pending Parlays ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map(p => (
              <ParlayCard key={p.id} parlay={p} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Settled History */}
      {settled2.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" /> History
          </h3>
          <div className="space-y-3">
            {settled2.map(p => (
              <ParlayCard key={p.id} parlay={p} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {!loadingParlays && parlays.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No parlays submitted yet. Build one in the Parlay Builder!</p>
        </div>
      )}

      {/* Favorite Players */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-chart-4" /> Favorite Players
        </h3>

        {/* Search to add favorites */}
        <div className="relative mb-4" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search players to favorite…"
            value={playerSearch}
            onChange={e => { setPlayerSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            className="pl-9 pr-8 bg-secondary border-border"
          />
          {playerSearch && (
            <button onClick={() => { setPlayerSearch(''); setShowDropdown(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showDropdown && playerSearch.trim() && (() => {
            const q = playerSearch.toLowerCase();
            const results = mockPlayers.filter(p => p.player_name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)).slice(0, 8);
            return results.length > 0 ? (
              <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                {results.map(p => {
                  const isFav = favorites.includes(p.player_name);
                  return (
                    <button
                      key={p.id}
                      onClick={() => { toggleFavorite(p.player_name); setPlayerSearch(''); setShowDropdown(false); }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <TeamLogo team={p.team} className="w-7 h-7" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.player_name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.team} · {p.position}</p>
                        </div>
                      </div>
                      <Star className={cn("w-4 h-4 flex-shrink-0", isFav ? "text-chart-4 fill-chart-4" : "text-muted-foreground")} />
                    </button>
                  );
                })}
              </div>
            ) : null;
          })()}
        </div>

        {/* Pinned favorites list */}
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Search for players above to add favorites.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favorites.map(name => {
              const player = mockPlayers.find(p => p.player_name === name);
              return (
                <div key={name} className="flex items-center justify-between rounded-lg border border-chart-4/30 bg-chart-4/5 p-3 transition-all">
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => navigate(`/trends?player=${encodeURIComponent(name)}`)}
                  >
                    {player && <TeamLogo team={player.team} className="w-10 h-10 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate">{name}</p>
                      {player && <p className="text-xs text-muted-foreground">{player.team} · {player.position}</p>}
                    </div>
                  </div>
                  <button onClick={() => toggleFavorite(name)} className="ml-2 flex-shrink-0">
                    <Star className="w-5 h-5 text-chart-4 fill-chart-4 hover:opacity-60 transition-opacity" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}