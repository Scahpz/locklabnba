import { NBA_API } from '../lib/config';
const LOCAL_USER_KEY = 'locklab_user';

const defaultUser = {
  full_name: 'NBA Fan',
  preferred_name: '',
  favorite_players: [],
  email: 'local@locklab.app',
};

function getLocalUser() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USER_KEY)) || defaultUser;
  } catch {
    return defaultUser;
  }
}

function saveLocalUser(data) {
  const updated = { ...getLocalUser(), ...data };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
  return updated;
}

async function apiRequest(path, options = {}) {
  const res = await fetch(`${NBA_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const base44 = {
  auth: {
    me: async () => getLocalUser(),

    updateMe: async (data) => saveLocalUser(data),

    logout: () => {
      // no-op — local app has no session to clear
    },

    redirectToLogin: () => {
      // no-op — no login required
    },
  },

  functions: {
    invoke: async (funcName, params = {}) => {
      if (funcName === 'fetchLivePropsFromOdds') {
        const data = await apiRequest('/api/live-props');
        return { data };
      }
      if (funcName === 'getPlayerStats') {
        const data = await apiRequest('/api/player-stats', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        return { data };
      }
      throw new Error(`Unknown function: ${funcName}`);
    },
  },

  integrations: {
    Core: {
      // Rule-based verdict analysis — no LLM key needed
      InvokeLLM: async ({ prompt }) => {
        try {
          const jsonMatch = prompt.match(/\[[\s\S]*\]/);
          if (!jsonMatch) return { verdicts: [] };
          const props = JSON.parse(jsonMatch[0]);

          const verdicts = props.map((p) => {
            const avg = p.avg_last_5 ?? p.avg_last_10 ?? p.line;
            const hitRate = p.hit_rate_last_10 ?? 50;

            let verdict, confidence, reason;

            if (avg > p.line * 1.08 && hitRate >= 60) {
              verdict = 'OVER';
              confidence = Math.min(92, 55 + (hitRate - 50) + Math.round((avg - p.line) * 2));
              reason = `Avg ${avg?.toFixed(1)} vs ${p.line} line — ${hitRate}% hit rate`;
            } else if (avg < p.line * 0.92 && hitRate <= 40) {
              verdict = 'UNDER';
              confidence = Math.min(92, 55 + (50 - hitRate) + Math.round((p.line - avg) * 2));
              reason = `Only ${avg?.toFixed(1)} avg vs ${p.line} line — ${hitRate}% hit rate`;
            } else {
              verdict = 'UNSAFE';
              confidence = 42;
              reason = `Too close to call — line is near season average`;
            }

            return { id: p.id, verdict, ai_confidence: confidence, reason };
          });

          return { verdicts };
        } catch {
          return { verdicts: [] };
        }
      },
    },
  },

  entities: {
    SavedParlay: {
      list: async () => apiRequest('/api/parlays'),

      create: async (data) =>
        apiRequest('/api/parlays', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: async (id, data) =>
        apiRequest(`/api/parlays/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),

      delete: async (id) =>
        apiRequest(`/api/parlays/${id}`, { method: 'DELETE' }),
    },
  },
};
