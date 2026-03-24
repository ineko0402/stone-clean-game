import { createCanvas } from "./core/canvas.js";
import { setupPointer } from "./core/input.js";

import { createLayer } from "./domain/layer.js";
import { calculateProgress } from "./domain/progress.js";
import { createStore } from "./domain/store.js";

import { erase } from "./features/erase/erase.js";
import { render } from "./features/render/render.js";

import { generateBase } from "./generator/base.js";
import { generateGem } from "./generator/gem.js";
import { generateDirt } from "./generator/dirt.js";

import { updateProgressText } from "./ui/ui.js";

const width = 400;
const height = 400;

// --- Canvas取得（HTML側を使う）
const viewCanvas = document.getElementById("viewCanvas");
const viewContext = viewCanvas.getContext("2d");
viewCanvas.width = width;
viewCanvas.height = height;

// --- UI取得
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");

// --- レイヤー
const base = createCanvas(width, height);
const gem = createCanvas(width, height);
const dirt = createCanvas(width, height);

generateBase(base.context, width, height);
generateGem(gem.context, width, height);
generateDirt(dirt.context, width, height);

const layers = [
  createLayer(base.context),
  createLayer(gem.context),
  createLayer(dirt.context),
];

// --- store
const store = createStore({
  progress: 0,
  isClear: false,
  brushSize: 15,
});

// --- UI更新（イベント駆動）
store.subscribe((state) => {
  // 数値
  updateProgressText(progressText, state.progress);

  // バー
  progressBar.style.width = state.progress + "%";

  // クリア演出
  if (state.isClear) {
    showClearOnce();
  }
});

// --- クリア演出（1回だけ）
let isShown = false;

function showClearOnce() {
  if (isShown) return;

  const el = document.createElement("div");
  el.textContent = "CLEAR!";
  el.style.position = "absolute";
  el.style.top = "50%";
  el.style.left = "50%";
  el.style.transform = "translate(-50%, -50%)";
  el.style.fontSize = "40px";
  el.style.color = "gold";

  document.body.appendChild(el);

  isShown = true;
}

// --- 入力
setupPointer(viewCanvas, (position) => {
  const state = store.getState();
  erase(dirt.context, position, state.brushSize);
});

// --- ループ
function loop() {
  render(viewContext, layers, width, height);

  const progress = calculateProgress(dirt.context, width, height);
  const percent = Math.floor(progress * 100);

  store.setState({
    progress: percent,
    isClear: percent >= 80,
  });

  requestAnimationFrame(loop);
}

loop();
