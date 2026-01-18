const tileTypes = [];
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

const tileMap = new Map(tileTypes.map((tile) => [tile.id, tile]));

const tenpaiHandEl = document.getElementById("tenpai-hand");
const tenpaiResultEl = document.getElementById("tenpai-result");
const discardHandEl = document.getElementById("discard-hand");
const discardResultEl = document.getElementById("discard-result");

const handSizeSelect = document.getElementById("hand-size");
const discardHandSizeSelect = document.getElementById("discard-hand-size");

const tileSelect = document.getElementById("tile-select");
const opponentSelect = document.getElementById("opponent-select");
const addDiscardButton = document.getElementById("add-discard");
const resetDiscardsButton = document.getElementById("reset-discards");

const discardZones = [
  document.getElementById("discard-0"),
  document.getElementById("discard-1"),
  document.getElementById("discard-2"),
];

let tenpaiHand = [];
let discardHand = [];
let opponentDiscards = [[], [], []];

const buildDeck = () => {
  const deck = [];
  tileTypes.forEach((tile) => {
    for (let i = 0; i < 4; i += 1) {
      deck.push(tile.id);
    }
  });
  return deck;
};

const drawTiles = (count) => {
  const deck = buildDeck();
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
};

const renderTiles = (container, tiles, safetyMap = new Map()) => {
  container.innerHTML = "";
  tiles.forEach((tileId) => {
    const tile = tileMap.get(tileId);
    const tileEl = document.createElement("div");
    tileEl.className = "tile";
    const safety = safetyMap.get(tileId);
    if (safety) {
      tileEl.classList.add(`safety-${safety.level}`);
      tileEl.title = safety.note;
    }
    tileEl.textContent = tile.label;
    container.appendChild(tileEl);
  });
};

const countsFromTiles = (tiles) => {
  const counts = Array(tileTypes.length).fill(0);
  tiles.forEach((tileId) => {
    const index = tileTypes.findIndex((tile) => tile.id === tileId);
    counts[index] += 1;
  });
  return counts;
};

const isWinningHand = (counts, meldsNeeded) => {
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

const calculateTenpaiWaits = (tiles, handSize) => {
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

const renderTenpai = () => {
  const handSize = Number(handSizeSelect.value);
  tenpaiHand = drawTiles(handSize);
  renderTiles(tenpaiHandEl, tenpaiHand);
  const waits = calculateTenpaiWaits(tenpaiHand, handSize);
  if (waits.length === 0) {
    tenpaiResultEl.innerHTML = "目前沒有聽牌，試著分析哪些搭子可以改善。";
    return;
  }
  tenpaiResultEl.innerHTML = `可聽牌：${waits.join("、")}`;
};

const populateTileSelect = () => {
  tileSelect.innerHTML = "";
  tileTypes.forEach((tile) => {
    const option = document.createElement("option");
    option.value = tile.id;
    option.textContent = tile.label;
    tileSelect.appendChild(option);
  });
};

const renderDiscards = () => {
  opponentDiscards.forEach((discards, index) => {
    renderTiles(discardZones[index], discards);
  });
};

const buildSafetyMap = () => {
  const safetyMap = new Map();
  const allDiscards = opponentDiscards.flat();
  const discardCounts = new Map();
  allDiscards.forEach((tileId) => {
    discardCounts.set(tileId, (discardCounts.get(tileId) || 0) + 1);
  });

  discardHand.forEach((tileId) => {
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

const renderDiscardPractice = () => {
  const handSize = Number(discardHandSizeSelect.value);
  discardHand = drawTiles(handSize);
  renderTiles(discardHandEl, discardHand, buildSafetyMap());
  renderDiscards();
  updateDiscardSummary();
};

const updateDiscardSummary = () => {
  const safetyMap = buildSafetyMap();
  renderTiles(discardHandEl, discardHand, safetyMap);

  const summary = {
    safe: [],
    medium: [],
    risk: [],
  };

  discardHand.forEach((tileId) => {
    const tile = tileMap.get(tileId);
    const safety = safetyMap.get(tileId);
    summary[safety.level].push(tile.label);
  });

  discardResultEl.innerHTML = `
    <strong>安全等級提示</strong>
    <ul>
      <li>安全：${summary.safe.join("、") || "暫無"}</li>
      <li>較安全：${summary.medium.join("、") || "暫無"}</li>
      <li>風險高：${summary.risk.join("、") || "暫無"}</li>
    </ul>
    <div class="note">安全等級僅根據現物與明牌數量評估，可自行加入進階規則（如筋、壁）。</div>
  `;
};

const addDiscard = () => {
  const opponentIndex = Number(opponentSelect.value);
  const tileId = tileSelect.value;
  opponentDiscards[opponentIndex].push(tileId);
  renderDiscards();
  updateDiscardSummary();
};

const resetDiscards = () => {
  opponentDiscards = [[], [], []];
  renderDiscards();
  updateDiscardSummary();
};

populateTileSelect();
renderTenpai();
renderDiscardPractice();

handSizeSelect.addEventListener("change", renderTenpai);

const dealTenpaiButton = document.getElementById("deal-tenpai");
const dealDiscardButton = document.getElementById("deal-discard");

dealTenpaiButton.addEventListener("click", renderTenpai);

dealDiscardButton.addEventListener("click", renderDiscardPractice);

discardHandSizeSelect.addEventListener("change", renderDiscardPractice);

addDiscardButton.addEventListener("click", addDiscard);
resetDiscardsButton.addEventListener("click", resetDiscards);
