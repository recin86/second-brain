import { useState } from 'react';

export const useCardExpansion = () => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const isExpanded = (cardId: string) => expandedCards.has(cardId);

  return {
    expandedCards,
    toggleCardExpansion,
    isExpanded
  };
};