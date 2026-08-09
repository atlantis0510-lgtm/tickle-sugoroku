// --- グローバル変数 ---
let board = [];
let boardSize = 40;
let currentPosition = 0;

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-buttons button').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
}

function rollDice1to6() { return Math.floor(Math.random() * 6) + 1; }

window.onload = async () => {
  try {
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
    // 4列（id, type, value, text）あることを想定
    if(parts.length >= 2) {
      const num = parseInt(parts[0].replace(/"/g, '').trim());
      const type = parts[1].replace(/"/g, '').trim();
      const value = parts.length >= 3 ? parts[2].replace(/"/g, '').trim() : "0";
      const text = parts.length >= 4 ? parts[3].replace(/"/g, '').trim() : type;
      
      if(!isNaN(num)) {
        // masu.csvの英語表記を日本語のクラス名/内部判定用に変換
        let jpType = type;
        if(type === 'start') jpType = 'スタート';
        if(type === 'goal') jpType = 'ゴール';
        if(type === 'red') jpType = '赤';
        if(type === 'blue') jpType = '青';
        if(type === 'purple') jpType = '紫';
        if(type === 'red_fill') jpType = '赤塗';
        if(type === 'instruction') jpType = '指示'; // 今回はテキストで判別するため「指示」に統一
        if(type === 'normal') jpType = '通常';

        newBoard.push({ num: num, type: jpType, value: value, text: text });
      }
    }
  });

  if (newBoard.length > 0) {
    board = newBoard;
    boardSize = board.length - 1;
    resetPlayGame();
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
    board.push({ num: i, type: type, value: "0", text: type });
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
    // マスのテキストを表示（長すぎる場合はCSSで調整が必要かも）
    let displayText = space.type === '指示' ? '指示マス' : space.text;
    if (displayText.length > 10) displayText = displayText.substring(0, 10) + '...'; // 長い場合は省略

    el.innerHTML = `<div class="num">${space.num}</div><div class="type" style="font-size:0.8em;">${displayText}</div>`;
    scrollContainer.appendChild(el);
  });
  
  setTimeout(() => {
    const activeEl = document.getElementById(`space-${currentPosition}`);
    if(activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, 100);
}