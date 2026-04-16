import React, { useState } from 'react';
import { Key, ExternalLink, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { setStoredApiKey } from '@/lib/liveData';

export default function ApiKeyPrompt({ onKeySet }) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!key.trim()) return;
    setStoredApiKey(key.trim());
    setSaved(true);
    setTimeout(() => onKeySet(), 500);
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Connect Live Odds Data</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Enter your free API key from{' '}
        <a href="https://the-odds-api.com/#get-access" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
          the-odds-api.com <ExternalLink className="w-3 h-3" />
        </a>
        {' '}to get real DraftKings/FanDuel player props. Free tier includes 500 requests/month.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Paste your API key here…"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="bg-secondary border-border flex-1"
        />
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-bold px-4 py-2 rounded-lg transition-all"
        >
          {saved ? <Check className="w-4 h-4" /> : 'Connect'}
        </button>
      </div>
    </div>
  );
}