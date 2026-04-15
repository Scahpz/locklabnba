import React, { createContext, useContext, useState } from 'react';

const ParlayContext = createContext(null);

export function ParlayProvider({ children }) {
  const [legs, setLegs] = useState([]);

  const addLeg = (prop, pick) => {
    const exists = legs.find(l => l.player_name === prop.player_name && l.prop_type === prop.prop_type);
    if (exists) {
      // Toggle off if same pick, update if different pick
      if (exists.pick === pick) {
        setLegs(prev => prev.filter(l => !(l.player_name === prop.player_name && l.prop_type === prop.prop_type)));
      } else {
        setLegs(prev => prev.map(l =>
          l.player_name === prop.player_name && l.prop_type === prop.prop_type
            ? { ...l, pick, odds: pick === 'over' ? prop.over_odds : prop.under_odds }
            : l
        ));
      }
      return;
    }
    setLegs(prev => [...prev, {
      player_name: prop.player_name,
      team: prop.team,
      opponent: prop.opponent,
      prop_type: prop.prop_type,
      line: prop.line,
      pick,
      odds: pick === 'over' ? prop.over_odds : prop.under_odds,
    }]);
  };

  const removeLeg = (player_name, prop_type) => {
    setLegs(prev => prev.filter(l => !(l.player_name === player_name && l.prop_type === prop_type)));
  };

  const clearLegs = () => setLegs([]);

  const isSelected = (player_name, prop_type, pick) =>
    legs.some(l => l.player_name === player_name && l.prop_type === prop_type && l.pick === pick);

  return (
    <ParlayContext.Provider value={{ legs, addLeg, removeLeg, clearLegs, isSelected }}>
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlay() {
  return useContext(ParlayContext);
}