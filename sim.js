function runSimulation() {
  let simTime = 3600;
  let simPos = 0;
  let out = "--- シミュレーション開始 ---\n初期制限時間: 60分00秒\n\n";
  let turn = 1;
  let simGameOver = false;

  while(simTime > 0 && simPos < boardSize && !simGameOver) {
    let needReEval = false;
    let d = rollDice1to6();
    simPos += d;
    if(simPos > boardSize) simPos = boardSize;

    out += `[ターン${turn}] 🎲出目:${d} -> 【${simPos}マス目】へ移動\n`;
    
    let eventResult = simHandleEvent(board[simPos], simTime, simPos);
    out += eventResult.logs.join("\n") + "\n";
    simTime = eventResult.newTime;
    simPos = eventResult.newPos;
    needReEval = eventResult.needReEval;
    if(eventResult.gameOver) simGameOver = true;

    while(needReEval && simTime > 0 && !simGameOver) {
      out += `  -> 戻った先【${simPos}マス目】のイベント発動\n`;
      let res2 = simHandleEvent(board[simPos], simTime, simPos);
      out += res2.logs.map(l => "    " + l).join("\n") + "\n";
      simTime = res2.newTime;
      simPos = res2.newPos;
      needReEval = res2.needReEval;
      if(res2.gameOver) simGameOver = true;
    }

    let m = Math.max(0, Math.floor(simTime / 60));
    let s = Math.max(0, simTime % 60);
    out += `  (全体残り時間: ${m}分${s}秒)\n\n`;

    if(board[simPos].type === 'ゴール' || simGameOver) break;
    turn++;
  }

  if(simTime <= 0 || simGameOver) {
    out += "=============================\n【ゲームオーバー】\n=============================\n";
  } else {
    out += "=============================\n【クリア】制限時間内にゴール到達！\n=============================\n";
  }
  document.getElementById('simOutput').value = out;
}

function simHandleEvent(space, time, pos) {
  let logs = [];
  let res = { newTime: time, newPos: pos, needReEval: false, gameOver: false };
  let type = space.type;
  let val = space.value;
  let text = space.text;

  if (type === '通常' || type === 'スタート' || type === '') {
    logs.push(`  【${type}】 ${text}`);
  }
  else if (type === '赤') {
    if(val === '∞') {
      res.newTime = 0;
      res.gameOver = true;
      logs.push(`  【赤マス】 ${text} -> ゲームオーバー`);
    } else {
      let sec = parseInt(val) || 0;
      // シミュレーションではサブタイマーの分、メインタイマー（現実の時間）は進まないものとする
      logs.push(`  【赤マス】 ${text}（${sec}秒消費）`);
    }
  }
  else if (type === '青') {
    let sec = parseInt(val) || 0;
    logs.push(`  【青マス】 ${text}（${sec}秒休憩）`);
  }
  else if (type === '紫') {
    let steps = parseInt(val) || 0;
    logs.push(`  【紫マス】 ${text} -> ${steps}マス戻る`);
    res.newPos = Math.max(0, pos - steps);
    res.needReEval = true;
  }
  else if (type === '赤塗') {
    let d = rollDice1to6();
    let sec = d * 60;
    logs.push(`  【赤塗マス】 ${text} -> 🎲出目:${d} (${sec}秒消費)`);
  }
  else if (type === '指示') {
    if (text.includes("サイコロを５回振り")) {
      let sum = 0; for(let i=0; i<5; i++) sum += rollDice1to6();
      let sec = sum * 60;
      logs.push(`  【指示マス(1)】 サイコロ5回合計:${sum} -> ${sec}秒消費`);
    }
    else if (text.includes("休憩するか、3分間くすぐられるか選べる")) {
      let chooseRest = Math.random() < 0.5;
      if(chooseRest) {
        res.newTime -= (20 * 60); // 全体時間から20分引かれる
        logs.push(`  【指示マス(2)】 休憩を選択（全体時間-20分）`);
      } else {
        logs.push(`  【指示マス(2)】 くすぐりを選択（3分消費）`);
      }
    }
    else if (text.includes("出目１,6：5分間休憩")) {
      let d = rollDice1to6();
      if(d === 1 || d === 6) {
        logs.push(`  【指示マス(3)】 🎲出目:${d} -> 5分間休憩`);
      } else {
        logs.push(`  【指示マス(3)】 🎲出目:${d} -> 150秒消費し、6マス戻る`);
        res.newPos = Math.max(0, pos - 6);
        res.needReEval = true;
      }
    }
    else if (text.includes("動いたり声を出してはいけない")) {
      let d = rollDice1to6();
      let sec = d * 60;
      logs.push(`  【指示マス(4)】 🎲出目:${d} -> ${sec}秒消費`);
    }
    else if (text.includes("自由に拘束され")) {
      let d = rollDice1to6();
      let sec = d * 600; // 10分
      logs.push(`  【指示マス(5)】 🎲出目:${d} -> ${sec/60}分消費`);
    }
    else {
      logs.push(`  【指示マス】 ${text}`);
    }
  }
  else if (type === 'ゴール') {
    logs.push(`  【ゴール】 ゴール到達！`);
  }
  
  return { logs, ...res };
}