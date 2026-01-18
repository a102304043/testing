import {
  tileMap,
  tileTypes,
  tileIndexMap,
  drawTiles,
  calculateTenpaiWaits,
  buildSafetyMap,
} from "./mahjong.js";

const TENPAI_HAND_SIZE = 16;

const tenpaiHandEl = document.getElementById("tenpai-hand");
const tenpaiResultEl = document.getElementById("tenpai-result");
const tenpaiOptionsEl = document.getElementById("tenpai-options");
const tenpaiCheckButton = document.getElementById("tenpai-check");
const tenpaiResetButton = document.getElementById("tenpai-reset");
const tenpaiFeedbackEl = document.getElementById("tenpai-feedback");

const discardHandEl = document.getElementById("discard-hand");
const discardResultEl = document.getElementById("discard-result");

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
let tenpaiWaits = [];
let tenpaiSelections = new Set();
let discardHand = [];
let opponentDiscards = [[], [], []];

const sortTiles = (tiles) =>
  [...tiles].sort((a, b) => tileIndexMap.get(a) - tileIndexMap.get(b));

const createTileElement = (tileId, safetyMap = new Map()) => {
  const tile = tileMap.get(tileId);
  const tileEl = document.createElement("div");
  tileEl.className = "tile";
  const safety = safetyMap.get(tileId);
  if (safety) {
    tileEl.classList.add(`safety-${safety.level}`);
    tileEl.title = safety.note;
  }
  const img = document.createElement("img");
  img.src = `assets/tiles/${tile.image}`;
  img.alt = tile.label;
  tileEl.appendChild(img);
  return tileEl;
};

const renderTiles = (container, tiles, safetyMap = new Map()) => {
  container.innerHTML = "";
  sortTiles(tiles).forEach((tileId) => {
    container.appendChild(createTileElement(tileId, safetyMap));
  });
};

const renderTenpaiOptions = () => {
  tenpaiOptionsEl.innerHTML = "";
  tenpaiSelections = new Set();
  tileTypes.forEach((tile) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile-option";
    button.dataset.tileId = tile.id;
    const img = document.createElement("img");
    img.src = `assets/tiles/${tile.image}`;
    img.alt = tile.label;
    button.appendChild(img);
    button.addEventListener("click", () => {
      if (tenpaiSelections.has(tile.id)) {
        tenpaiSelections.delete(tile.id);
        button.classList.remove("selected");
      } else {
        tenpaiSelections.add(tile.id);
        button.classList.add("selected");
      }
    });
    tenpaiOptionsEl.appendChild(button);
  });
};

const renderTenpai = () => {
  tenpaiHand = drawTiles(TENPAI_HAND_SIZE);
  tenpaiWaits = calculateTenpaiWaits(tenpaiHand, TENPAI_HAND_SIZE);
  renderTiles(tenpaiHandEl, tenpaiHand);
  renderTenpaiOptions();
  tenpaiResultEl.textContent = "請點選可胡牌的牌張，完成後按「提交答案」。";
  tenpaiFeedbackEl.textContent = "";
};

const checkTenpaiAnswer = () => {
  const selected = [...tenpaiSelections].map((id) => tileMap.get(id).label);
  const selectedSet = new Set(selected);
  const waitSet = new Set(tenpaiWaits);
  const allCorrect =
    selectedSet.size === waitSet.size &&
    [...selectedSet].every((tile) => waitSet.has(tile));

  if (tenpaiWaits.length === 0) {
    tenpaiFeedbackEl.textContent =
      "這題沒有聽牌（沒有可胡牌）。";
    return;
  }

  if (allCorrect) {
    tenpaiFeedbackEl.textContent = `答對了！可胡牌：${tenpaiWaits.join("、")}`;
    return;
  }

  tenpaiFeedbackEl.textContent = `正確答案：${tenpaiWaits.join("、")}`;
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

tenpaiCheckButton.addEventListener("click", checkTenpaiAnswer);
tenpaiResetButton.addEventListener("click", renderTenpai);

const dealDiscardButton = document.getElementById("deal-discard");

dealDiscardButton.addEventListener("click", renderDiscardPractice);

discardHandSizeSelect.addEventListener("change", renderDiscardPractice);

addDiscardButton.addEventListener("click", addDiscard);
resetDiscardsButton.addEventListener("click", resetDiscards);
