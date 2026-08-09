// --- シミュレーション（一括結果表示）専用ロジック ---

function runSimulation() {
  let simTime = 3600;
  let simPos = 0;
  let out = "--- シミュレーション開始 ---\n初期制限時間: 60分00秒\n\n";
  let turn = 1;

  while(simTime > 0 && simPos < boardSize) {
    let needReEval = false;
    let d = rollDice1to6();
    simPos += d;
    if(simPos > boardSize) simPos = boardSize;

    out += `[ターン${turn}] 🎲出目:${d} -> 【${simPos}マス目】へ移動\n`;
    
    // イベント処理と再判定ループ
    let eventResult = simHandleEvent(board[simPos].type, simTime, simPos);
    out += eventResult.logs.join("\n") + "\n";
    simTime = eventResult.newTime;
    simPos = eventResult.newPos;
    needReEval = eventResult.needReEval;

    while(needReEval && simTime > 0) {
      out += `  -> 戻った先【${simPos}マス目】のイベント発動\n`;
      let res2 = simHandleEvent(board[simPos].type, simTime, simPos);
      out += res2.logs.map(l => "    " + l).join("\n") + "\n";
      simTime = res2.newTime;
      simPos = res2.newPos;
      needReEval = res2.needReEval;
    }

    let m = Math.max(0, Math.floor(simTime / 60));
    let s = Math.max(0, simTime % 60);
    out += `  (全体残り時間: ${m}分${s}秒)\n\n`;

    if(board[simPos].type === 'ゴール') break;
    turn++;
  }

  if(simTime <= 0) {
    out += "=============================\n【ゲームオーバー】制限時間オーバー\n=============================\n";
  } else {
    out += "=============================\n【クリア】制限時間内にゴール到達！\n=============================\n";
  }
  document.getElementById('simOutput').value = out;
}

// シミュレーション用のイベント計算関数
function simHandleEvent(type, time, pos) {
  let logs = [];
  let res = { newTime: time, newPos: pos, needReEval: false };

  if(['通常', '赤', '青', '紫', '赤塗', 'スタート', ''].includes(type)) {
    logs.push(`  【${type}】何事もなく無事に通過。`);
  }
  else if(type === '指示1') {
    let sum = 0; for(let i=0; i<5; i++) sum += rollDice1to6();
    let pen = sum * 60;
    res.newTime -= pen;
    logs.push(`  【指示1】サイコロ5回合計${sum} × 60秒 ＝ ${pen}秒 消費。`);
  }
  else if(type === '指示2') {
    let chooseRest = Math.random() < 0.5;
    if(chooseRest) {
      res.newTime -= (23 * 60);
      logs.push(`  【指示2】休憩を選択。ペナルティ20分+休憩3分 ＝ 合計23分 消費。`);
    } else {
      res.newTime -= (3 * 60);
      logs.push(`  【指示2】くすぐられるのを選択。3分 消費。`);
    }
  }
  else if(type === '指示3') {
    let r = rollDice1to6();
    if(r === 1 || r === 6) {
      res.newTime -= (5 * 60);
      logs.push(`  【指示3】出目【${r}】。休憩を引き当てた！5分 消費。`);
    } else {
      res.newTime -= 150;
      logs.push(`  【指示3】出目【${r}】。150秒 消費し、6マス戻る！`);
      res.newPos = Math.max(0, pos - 6);
      res.needReEval = true; 
    }
  }
  else if(type === '指示4') {
    let r = rollDice1to6();
    let pen = r * 120;
    res.newTime -= pen;
    logs.push(`  【指示4】出目【${r}】。${pen}秒 消費。`);
  }
  else if(type === '指示5') {
    let r = rollDice1to6();
    let pen = r * 1200; // r * 20分
    res.newTime -= pen;
    logs.push(`  【指示5】出目【${r}】。${pen/60}分 消費。`);
  }
  else if(type === 'ゴール') {
    // ログなし
  } else {
    logs.push(`  【${type}】未定義のマスです。`);
  }
  return { logs, ...res };
}