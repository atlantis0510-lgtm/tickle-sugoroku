// --- プレイタブ用状態管理 ---
let mainTimeLeft = 3600;
let mainTimerInterval = null;
let isMainRunning = false;

// gameState: 'IDLE' (移動待機), 'EVENT_WAIT' (指示マスでの入力待機), 'SUB_TIMER' (くすぐりタイマー作動中)
let gameState = 'IDLE'; 
let currentEvent = {}; 
let subTimeLeft = 0;
let subTimerInterval = null;

function resetPlayGame() {
  currentPosition = 0;
  mainTimeLeft = 3600;
  stopMainTimer();
  clearSubTimer();
  gameState = 'IDLE';
  document.getElementById('gameOverMsg').style.display = 'none';
  document.getElementById('logArea').innerHTML = '';
  log("🏁 ゲームリセット。サイコロを振ってスタート！");
  renderBoard();
  updateMainTimerDisplay();
  renderActionPanel();
}

// --- メインタイマー (全体制限時間) ---
function startMainTimer() {
  if(isMainRunning || mainTimeLeft <= 0) return;
  isMainRunning = true;
  mainTimerInterval = setInterval(() => {
    mainTimeLeft--;
    updateMainTimerDisplay();
    if(mainTimeLeft <= 0) triggerGameOver();
  }, 1000);
}
function stopMainTimer() {
  isMainRunning = false;
  clearInterval(mainTimerInterval);
}
function addMainTime(seconds) {
  mainTimeLeft = Math.max(0, mainTimeLeft + seconds);
  updateMainTimerDisplay();
  if(mainTimeLeft <= 0) triggerGameOver();
}
function updateMainTimerDisplay() {
  let m = Math.floor(mainTimeLeft / 60);
  let s = mainTimeLeft % 60;
  document.getElementById('timerDisplay').innerText = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function triggerGameOver() {
  mainTimeLeft = 0;
  stopMainTimer();
  updateMainTimerDisplay();
  document.getElementById('gameOverMsg').style.display = 'block';
  log("💀 制限時間オーバー！好きなだけくすぐられます。");
}

function log(message) {
  const logArea = document.getElementById('logArea');
  const item = document.createElement('div');
  item.className = 'log-item';
  const timeStr = document.getElementById('timerDisplay').innerText;
  item.innerHTML = `<strong>[全体 ${timeStr}]</strong> ${message}`;
  logArea.prepend(item);
}

// --- ゲーム進行 (手動) ---
function rollMoveDice() {
  if(mainTimeLeft <= 0) { alert("時間切れです！"); return; }
  if(!isMainRunning) { alert("メインタイマーをスタートしてください！"); return; }
  
  let d = rollDice1to6();
  log(`🎲 サイコロ【${d}】が出た！`);
  movePlayer(d);
}

function movePlayer(steps) {
  currentPosition += steps;
  if(currentPosition < 0) currentPosition = 0;
  if(currentPosition > boardSize) currentPosition = boardSize;
  renderBoard();
  
  setTimeout(() => { processSpace(currentPosition); }, 500);
}

// マスに止まった時の処理（手動対応）
function processSpace(pos) {
  let type = board[pos].type;
  
  if (['通常', '赤', '青', '紫', '赤塗', 'スタート', ''].includes(type)) {
    log(`【${type}】マス。特に指示はありません。`);
    gameState = 'IDLE';
  }
  else if (type === '指示1') {
    gameState = 'EVENT_WAIT';
    currentEvent = { type: '指示1', rollsLeft: 5, sum: 0 };
    log("【指示1】サイコロを5回振り、出目の合計×60秒くすぐられます。");
  }
  else if (type === '指示2') {
    gameState = 'EVENT_WAIT';
    currentEvent = { type: '指示2' };
    log("【指示2】3分休憩(全体時間-20分)か、3分くすぐられるか選んでください。");
  }
  else if (type === '指示3') {
    gameState = 'EVENT_WAIT';
    currentEvent = { type: '指示3' };
    log("【指示3】サイコロを1回振ります。1か6なら5分休憩、それ以外なら150秒くすぐられた後6マス戻ります。");
  }
  else if (type === '指示4') {
    gameState = 'EVENT_WAIT';
    currentEvent = { type: '指示4' };
    log("【指示4】サイコロを振ります。(出目×120秒)くすぐられます。");
  }
  else if (type === '指示5') {
    gameState = 'EVENT_WAIT';
    currentEvent = { type: '指示5' };
    log("【指示5】サイコロを振ります。(出目×20分)くすぐられます。");
  }
  else if (type === 'ゴール') {
    log(`<strong>🎉【ゴール】クリアおめでとうございます！！</strong>`);
    stopMainTimer();
    gameState = 'IDLE';
  }
  renderActionPanel();
}

// --- 手動イベントの各種ボタンアクション ---
function handleEventAction(actionType, value) {
  if (currentEvent.type === '指示1') {
    let d = rollDice1to6();
    currentEvent.sum += d;
    currentEvent.rollsLeft--;
    log(`指示1: 🎲 ${6 - currentEvent.rollsLeft}回目は【${d}】`);
    if (currentEvent.rollsLeft <= 0) {
      let sec = currentEvent.sum * 60;
      log(`指示1完了: 合計${currentEvent.sum} × 60秒 = ${sec}秒`);
      startSubTimer(sec, "くすぐりタイム");
    }
  }
  else if (currentEvent.type === '指示2') {
    if (value === 'rest') {
      log("指示2: 休憩を選択。全体時間から20分引かれ、3分間の休憩に入ります。");
      addMainTime(-1200); // 20分マイナス
      startSubTimer(180, "休憩タイム (くすぐりなし)");
    } else {
      log("指示2: くすぐりを選択。3分間くすぐられます。");
      startSubTimer(180, "くすぐりタイム");
    }
  }
  else if (currentEvent.type === '指示3') {
    let d = rollDice1to6();
    log(`指示3: 🎲 出目は【${d}】`);
    if (d === 1 || d === 6) {
      log("休憩を引き当てました！5分間休みです。");
      startSubTimer(300, "休憩タイム");
    } else {
      log("150秒くすぐられた後、6マス戻ります！");
      startSubTimer(150, "くすぐりタイム", () => {
        log("ペナルティ終了。6マス戻ります。");
        movePlayer(-6);
      });
    }
  }
  else if (currentEvent.type === '指示4') {
    let d = rollDice1to6();
    let sec = d * 120;
    log(`指示4: 🎲 出目【${d}】。声出し＆動作禁止で ${sec}秒くすぐられます。`);
    startSubTimer(sec, "拘束くすぐりタイム");
  }
  else if (currentEvent.type === '指示5') {
    let d = rollDice1to6();
    let sec = d * 1200; // 20分
    log(`指示5: 🎲 出目【${d}】。拘束＆声出し禁止で ${sec}秒くすぐられます。`);
    startSubTimer(sec, "厳重拘束くすぐりタイム");
  }
  renderActionPanel();
}

// --- サブタイマー処理 (制限時間とは別に動くタイマー) ---
function startSubTimer(seconds, message, onComplete = null) {
  gameState = 'SUB_TIMER';
  subTimeLeft = seconds;
  currentEvent.timerMessage = message;
  currentEvent.onComplete = onComplete;
  
  clearInterval(subTimerInterval);
  subTimerInterval = setInterval(() => {
    subTimeLeft--;
    renderActionPanel(); // 毎秒UI更新
    if (subTimeLeft <= 0) {
      finishSubTimer();
    }
  }, 1000);
  renderActionPanel();
}

function skipSubTimer() {
  log("⏭ サブタイマーをスキップしました。");
  finishSubTimer();
}

function finishSubTimer() {
  clearInterval(subTimerInterval);
  gameState = 'IDLE';
  if (currentEvent.onComplete) {
    let cb = currentEvent.onComplete;
    currentEvent = {}; // リセット
    cb();
  } else {
    currentEvent = {};
  }
  renderActionPanel();
}
function clearSubTimer() {
  clearInterval(subTimerInterval);
  subTimeLeft = 0;
}

// --- アクションパネルの描画 ---
function renderActionPanel() {
  const panel = document.getElementById('actionPanel');
  panel.innerHTML = '';

  if (gameState === 'IDLE') {
    panel.innerHTML = `<button class="dice-btn" onclick="rollMoveDice()">🎲 サイコロを振って進む</button>`;
  } 
  else if (gameState === 'EVENT_WAIT') {
    if (currentEvent.type === '指示1') {
      panel.innerHTML = `
        <p><strong>指示1進行中</strong> (残り ${currentEvent.rollsLeft} 回)</p>
        <button class="action-btn" onclick="handleEventAction()">🎲 サイコロを振る</button>
      `;
    } else if (currentEvent.type === '指示2') {
      panel.innerHTML = `
        <p><strong>指示2</strong> 選択してください</p>
        <button class="action-btn" onclick="handleEventAction('choose', 'rest')">☕ 3分休憩 (全体時間-20分)</button>
        <button class="action-btn" onclick="handleEventAction('choose', 'tickle')">👐 3分くすぐられる</button>
      `;
    } else if (['指示3', '指示4', '指示5'].includes(currentEvent.type)) {
      panel.innerHTML = `
        <p><strong>${currentEvent.type}</strong></p>
        <button class="action-btn" onclick="handleEventAction()">🎲 判定用サイコロを振る</button>
      `;
    }
  } 
  else if (gameState === 'SUB_TIMER') {
    let m = Math.floor(subTimeLeft / 60);
    let s = subTimeLeft % 60;
    let timeStr = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    panel.innerHTML = `
      <p>${currentEvent.timerMessage}</p>
      <div class="sub-timer-text">${timeStr}</div>
      <button class="action-btn" onclick="skipSubTimer()">⏭ スキップ (タイマー終了)</button>
    `;
  }
}