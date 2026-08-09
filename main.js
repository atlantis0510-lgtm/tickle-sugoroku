// --- グローバル変数 ---
let board = [];
let boardSize = 40;
let currentPosition = 0;

// タブ切り替え
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-buttons button').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
}

// 共通サイコロ関数
function rollDice1to6() { return Math.floor(Math.random() * 6) + 1; }

// --- 初期化とCSV自動読み込み ---
window.onload = async () => {
  try {
    // GitHub環境にある masu.csv を自動で取得する
    // ※キャッシュ対策のためタイムスタンプを付与して常に最新を取得
    const response = await fetch('masu.csv?' + new Date().getTime());
    if (response.ok) {
      const text = await response.text();
      parseCSVText(text);
      console.log("masu.csv を自動読み込みしました");
    } else {
      console.warn("masu.csv が見つかりませんでした。デフォルト盤面を生成します。");
      generateDefaultBoard();
    }
  } catch (error) {
    console.error("CSV読み込みエラー:", error);
    generateDefaultBoard();
  }
};

function parseCSVText(csvText) {
  const lines = csvText.trim().split('\n');
  let newBoard = [];
  
  lines.forEach(line => {
    if(!line) return;
    const parts = line.split(',');
    if(parts.length >= 2) {
      const num = parseInt(parts[0].replace(/"/g, '').trim());
      const type = parts[1].replace(/"/g, '').trim();
      
      // numが正しく数値に変換できた行だけ追加（ヘッダー行などは弾かれる）
      if(!isNaN(num)) newBoard.push({ num: num, type: type });
    }
  });

  if (newBoard.length > 0) {
    board = newBoard;
    boardSize = board.length - 1;
    resetPlayGame(); // play.js の初期化関数を呼ぶ
  } else {
    generateDefaultBoard();
  }
}

function generateDefaultBoard() {
  board = [];
  for(let i = 0; i <= 40; i++) {
    let type = '通常';
    if(i === 0) type = 'スタート';
    else if(i === 40) type = 'ゴール';
    else if(i % 10 === 0) type = '赤塗';
    else if(i % 7 === 0) type = '指示5';
    else if(i % 5 === 0) type = '赤';
    else if(i % 4 === 0) type = '指示1';
    else if(i % 3 === 0) type = '青';
    board.push({ num: i, type: type });
  }
  boardSize = board.length - 1;
  resetPlayGame();
}

function renderBoard() {
  const scrollContainer = document.getElementById('boardScroll');
  scrollContainer.innerHTML = '';
  board.forEach((space, index) => {
    const el = document.createElement('div');
    el.className = `space type-${space.type} ${index === currentPosition ? 'active' : ''}`;
    el.id = `space-${index}`;
    el.innerHTML = `<div class="num">${space.num}</div><div class="type">${space.type}</div>`;
    scrollContainer.appendChild(el);
  });
  
  setTimeout(() => {
    const activeEl = document.getElementById(`space-${currentPosition}`);
    if(activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, 100);
}