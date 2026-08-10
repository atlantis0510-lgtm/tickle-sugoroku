let mainTimeLeft = 3600;
let mainTimerInterval = null;
let isMainRunning = false;
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

function processSpace(pos) {
  let space = board[pos];
  let type = space.type;
  let val = space.value;
  let text = space.text;
  
  if (type === '通常' || type === 'スタート' || type === '') {
    log(`【${type}】 ${text}`);
    gameState = 'IDLE';
  }
  else if (type === '赤') {
    if (val === '∞') {
      log(`【赤マス】 ${text}（ゲームオーバー）`);
      triggerGameOver();
    } else {
      let sec = parseInt(val) || 0;
      log(`【赤マス】 ${text}`);
      startSubTimer(sec, `${sec}秒間くすぐりタイム`);
    }
  }
  else if (type === '青') {
    let sec = parseInt(val) || 0;
    log(`【青マス】 ${text}`);
    startSubTimer(sec, `${sec}秒間休憩`);
  }
  else if (type === '紫') {
    let steps = parseInt(val) || 0;
    log(`【紫マス】 ${text}`);
    gameState = 'EVENT_WAIT';
    currentEvent = { type: '紫', steps: steps };
    renderActionPanel();
    setTimeout(() => {
      log(`${steps}マス戻ります。`);
      movePlayer(-steps);
    }, 2000);
  }
  else if (type === '赤塗') {
    gameState = 'EVENT_WAIT';
    currentEvent = { type: '赤塗', text: text };
    log(`【赤塗マス】 ${text}。サイコロを振ってください。`);
  }
  else if (type.startsWith('指示')) {
    // textの内容ではなく、マスの種類（指示1〜5）で直接判定する
    gameState = 'EVENT_WAIT';
    if (type === '指示1') {
      currentEvent = { type: '指示1', rollsLeft: 5, sum: 0 };
    } else if (type === '指示2') {
      currentEvent = { type: '指示2' };
    } else if (type === '指示3') {
      currentEvent = { type: '指示3' };
    } else if (type === '指示4') {
      currentEvent = { type: '指示4' };
    } else if (type === '指示5') {
      currentEvent = { type: '指示5' };
    } else {
      // 想定外の指示が入っていた場合の保険
      currentEvent = { type: '指示1', rollsLeft: 5, sum: 0 }; 
    }
    log(`【${type}】 ${text}`);
  }
  else if (type === 'ゴール') {
    log(`<strong>🎉【ゴール】クリアおめでとうございます！！</strong>`);
    stopMainTimer();
    gameState = 'IDLE';
  }
  renderActionPanel();
}

function handleEventAction(actionType, value) {
  if (currentEvent.type === '赤塗') {
    let d = rollDice1to6();
    let sec = d * 60;
    log(`🎲 出目【${d}】。${sec}秒間くすぐられます。`);
    startSubTimer(sec, "赤塗: くすぐりタイム");
  }
  else if (currentEvent.type === '指示1') {
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
      addMainTime(-1200);
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
    let sec = d * 60;
    log(`指示4: 🎲 出目【${d}】。声出し＆動作禁止で ${sec}秒くすぐられます。`);
    startSubTimer(sec, "拘束くすぐりタイム");
  }
  else if (currentEvent.type === '指示5') {
    let d = rollDice1to6();
    let sec = d * 600;
    log(`指示5: 🎲 出目【${d}】。拘束＆声出し禁止で ${sec}秒くすぐられます。`);
    startSubTimer(sec, "厳重拘束くすぐりタイム");
  }
  renderActionPanel();
}

function startSubTimer(seconds, message, onComplete = null) {
  gameState = 'SUB_TIMER';
  subTimeLeft = seconds;
  currentEvent.timerMessage = message;
  currentEvent.onComplete = onComplete;
  
  clearInterval(subTimerInterval);
  subTimerInterval = setInterval(() => {
    subTimeLeft--;
    renderActionPanel();
    if (subTimeLeft <= 0) finishSubTimer();
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
    currentEvent = {}; 
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

function renderActionPanel() {
  const panel = document.getElementById('actionPanel');
  panel.innerHTML = '';

  if (gameState === 'IDLE') {
    panel.innerHTML = `<button class="dice-btn" onclick="rollMoveDice()">🎲 サイコロを振って進む</button>`;
  } 
  else if (gameState === 'EVENT_WAIT') {
    if (currentEvent.type === '紫') {
       panel.innerHTML = `<p><strong>紫マス処理中...</strong></p>`;
    }
    else if (currentEvent.type === '赤塗') {
      panel.innerHTML = `
        <p><strong>赤塗マス</strong>: 出目×60秒くすぐられます</p>
        <button class="action-btn" onclick="handleEventAction()">🎲 サイコロを振る</button>
      `;
    }
    else if (currentEvent.type === '指示1') {
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
        <p><strong>指示判定</strong></p>
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