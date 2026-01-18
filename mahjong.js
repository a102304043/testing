export const tileTypes = [];
const suitLabels = ["萬", "筒", "索"];
const honorLabels = ["東", "南", "西", "北", "白", "發", "中"];

for (let suit = 0; suit < 3; suit += 1) {
  for (let num = 1; num <= 9; num += 1) {
    tileTypes.push({
      id: `${suit}${num}`,
      label: `${num}${suitLabels[suit]}`,
      isHonor: false,
      suit,
      number: num,
    });
  }
}

honorLabels.forEach((label, index) => {
  tileTypes.push({
    id: `h${index + 1}`,
    label,
    isHonor: true,
    suit: 3,
    number: index + 1,
  });
});

export const tileMap = new Map(tileTypes.map((tile) => [tile.id, tile]));

export const buildDeck = () => {
  const deck = [];
  tileTypes.forEach((tile) => {
    for (let i = 0; i < 4; i += 1) {
      deck.push(tile.id);
    }
  });
  return deck;
};

export const drawTiles = (count, rng = Math.random) => {
  const deck = buildDeck();
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
};

export const countsFromTiles = (tiles) => {
  const counts = Array(tileTypes.length).fill(0);
  tiles.forEach((tileId) => {
    const index = tileTypes.findIndex((tile) => tile.id === tileId);
    counts[index] += 1;
  });
  return counts;
};

export const isWinningHand = (counts, meldsNeeded) => {
  const memo = new Map();

  const canFormMelds = (currentCounts, remainingMelds) => {
    const key = `${currentCounts.join(",")}|${remainingMelds}`;
    if (memo.has(key)) {
      return memo.get(key);
    }
    if (remainingMelds === 0) {
      const result = currentCounts.every((count) => count === 0);
      memo.set(key, result);
      return result;
    }

    const firstIndex = currentCounts.findIndex((count) => count > 0);
    if (firstIndex === -1) {
      memo.set(key, false);
      return false;
    }

    let success = false;

    if (currentCounts[firstIndex] >= 3) {
      currentCounts[firstIndex] -= 3;
      success = canFormMelds(currentCounts, remainingMelds - 1);
      currentCounts[firstIndex] += 3;
    }

    if (!success) {
      const tile = tileTypes[firstIndex];
      const isSuit = !tile.isHonor;
      if (isSuit && tile.number <= 7) {
        const index1 = firstIndex + 1;
        const index2 = firstIndex + 2;
        if (
          currentCounts[index1] > 0 &&
          currentCounts[index2] > 0 &&
          tileTypes[index1].suit === tile.suit &&
          tileTypes[index2].suit === tile.suit
        ) {
          currentCounts[firstIndex] -= 1;
          currentCounts[index1] -= 1;
          currentCounts[index2] -= 1;
          success = canFormMelds(currentCounts, remainingMelds - 1);
          currentCounts[firstIndex] += 1;
          currentCounts[index1] += 1;
          currentCounts[index2] += 1;
        }
      }
    }

    memo.set(key, success);
    return success;
  };

  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] >= 2) {
      counts[i] -= 2;
      const success = canFormMelds(counts, meldsNeeded);
      counts[i] += 2;
      if (success) {
        return true;
      }
    }
  }

  return false;
};

export const calculateTenpaiWaits = (tiles, handSize) => {
  const waits = [];
  const counts = countsFromTiles(tiles);
  const totalNeeded = handSize + 1;
  const meldsNeeded = (totalNeeded - 2) / 3;

  tileTypes.forEach((tile, index) => {
    if (counts[index] >= 4) {
      return;
    }
    counts[index] += 1;
    if (isWinningHand(counts, meldsNeeded)) {
      waits.push(tile.label);
    }
    counts[index] -= 1;
  });

  return waits;
};

export const buildSafetyMap = (handTiles, opponentDiscards) => {
  const safetyMap = new Map();
  const allDiscards = opponentDiscards.flat();
  const discardCounts = new Map();
  allDiscards.forEach((tileId) => {
    discardCounts.set(tileId, (discardCounts.get(tileId) || 0) + 1);
  });

  handTiles.forEach((tileId) => {
    const isGenbutsu = allDiscards.includes(tileId);
    if (isGenbutsu) {
      safetyMap.set(tileId, {
        level: "safe",
        note: "現物：已有對手打出",
      });
      return;
    }

    const count = discardCounts.get(tileId) || 0;
    if (count >= 2) {
      safetyMap.set(tileId, {
        level: "medium",
        note: "至少兩張已明牌，較安全",
      });
      return;
    }

    safetyMap.set(tileId, {
      level: "risk",
      note: "資訊不足，風險較高",
    });
  });

  return safetyMap;
};
