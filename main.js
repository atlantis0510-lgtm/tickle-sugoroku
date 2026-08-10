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
    if(parts.length >= 2) {
      const num = parseInt(parts[0].replace(/"/g, '').trim());
      // 大文字小文字変換を外し、日本語をそのまま読み込む
      const type = parts[1].replace(/"/g, '').trim();
      const value = parts.length >= 3 ? parts[2].replace(/"/g, '').trim() : "0";
      const text = parts.length >= 4 ? parts[3].replace(/"/g, '').trim() : type;
      
      if(!isNaN(num)) {
        // 万が一英語が混ざっていた場合のみ変換。基本はCSVの日本語をそのまま採用
        let jpType = type;
        if(type === 'start') jpType = 'スタート';
        else if(type === 'goal') jpType = 'ゴール';
        else if(type === 'red') jpType = '赤';
        else if(type === 'blue') jpType = '青';
        else if(type === 'purple') jpType = '紫';
        else if(type === 'red_fill') jpType = '赤塗';
        else if(type === 'instruction') jpType = '指示';
        else if(type === 'normal') jpType = '通常';

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
    
    // CSSクラス用に、「指示1」等の場合は「指示」として扱う（色が崩れないようにする）
    let cssType = space.type;
    if (cssType.startsWith('指示')) cssType = '指示';

    el.className = `space type-${cssType} ${index === currentPosition ? 'active' : ''}`;
    el.id = `space-${index}`;
    
    let displayText = space.text;
    if (displayText.length > 10) displayText = displayText.substring(0, 10) + '...';

    el.innerHTML = `<div class="num">${space.num}</div><div class="type" style="font-size:0.8em;">${displayText}</div>`;
    scrollContainer.appendChild(el);
  });
  
  setTimeout(() => {
    const activeEl = document.getElementById(`space-${currentPosition}`);
    if(activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, 100);
}