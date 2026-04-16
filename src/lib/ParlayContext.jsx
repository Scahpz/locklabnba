import React, { createContext, useContext, useState } from 'react';

const ParlayContext = createContext(null);

export function ParlayProvider({ children }) {
  const [legs, setLegs] = useState([]);

  // Add a player prop leg
  const addLeg = (prop, pick) => {
    const exists = legs.find(l => l.player_name === prop.player_name && l.prop_type === prop.prop_type && !l.is_game_bet);
    if (exists) {
      if (exists.pick === pick) {
        setLegs(prev => prev.filter(l => !(l.player_name === prop.player_name && l.prop_type === prop.prop_type && !l.is_game_bet)));
      } else {
        setLegs(prev => prev.map(l =>
          l.player_name === prop.player_name && l.prop_type === prop.prop_type && !l.is_game_bet
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
      is_game_bet: false,
    }]);
  };

  // Add a team moneyline or spread leg
  // leg_id is a unique key e.g. "gameId_away_ml"
  const addGameLeg = (leg) => {
    setLegs(prev => {
      const exists = prev.find(l => l.leg_id === leg.leg_id);
      if (exists) return prev.filter(l => l.leg_id !== leg.leg_id); // toggle off
      return [...prev, leg];
    });
  };

  const removeLeg = (player_name, prop_type) => {
    setLegs(prev => prev.filter(l => !(l.player_name === player_name && l.prop_type === prop_type)));
  };

  const removeGameLeg = (leg_id) => {
    setLegs(prev => prev.filter(l => l.leg_id !== leg_id));
  };

  const clearLegs = () => setLegs([]);

  const isSelected = (player_name, prop_type, pick) =>
    legs.some(l => l.player_name === player_name && l.prop_type === prop_type && l.pick === pick && !l.is_game_bet);

  const isGameLegSelected = (leg_id) => legs.some(l => l.leg_id === leg_id);

  return (
    <ParlayContext.Provider value={{ legs, addLeg, addGameLeg, removeLeg, removeGameLeg, clearLegs, isSelected, isGameLegSelected }}>
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlay() {
  return useContext(ParlayContext);
}