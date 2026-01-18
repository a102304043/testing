import {
  tileMap,
  tileTypes,
  drawTiles,
  calculateTenpaiWaits,
  buildSafetyMap,
} from "./mahjong.js";

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

const renderDiscardPractice = () => {
  const handSize = Number(discardHandSizeSelect.value);
  discardHand = drawTiles(handSize);
  renderTiles(discardHandEl, discardHand, buildSafetyMap(discardHand, opponentDiscards));
  renderDiscards();
  updateDiscardSummary();
};

const updateDiscardSummary = () => {
  const safetyMap = buildSafetyMap(discardHand, opponentDiscards);
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
