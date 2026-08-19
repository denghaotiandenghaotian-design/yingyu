/* ===== m10.js · 模块十 阶梯情景对话（每轮 3-5 回合，由易到难 + 难回合语法 mini-check） ===== */
(function(){
  window.EL = window.EL || {};
  var DIALOGUES = EL.engine.DIALOGUES;
  var prog = EL.store.collection(EL.store.keys.dialogueProgress);

  // 难度层级 → 徽标文案 / 样式类
  var LV = {
    1:{txt:"L1 易", cls:"lv-1"},
    2:{txt:"L2 中", cls:"lv-2"},
    3:{txt:"L3 难", cls:"lv-3"}
  };

  // 练习模式：strict=严格闯关（L2/L3 难回合前须先过语法 mini-check）；free=自由陪练（跳过语法关）
  // 座位模式：经 EL.store 读写，自动带座位命名空间，座位间互不影响
  var MODE_KEY = "dlg_mode";
  var mode = EL.store.get(MODE_KEY, "strict");
  function setMode(m){ mode = m; EL.store.set(MODE_KEY, m); }

  // 进入即随机：开启后，每次进入任意情景都先在该情景内部自动洗牌一次（仍仅限本情景）
  var AUTO_KEY = "dlg_autoshuffle";
  var autoShuffle = EL.store.get(AUTO_KEY) === "1";
  function setAuto(b){ autoShuffle = b; EL.store.set(AUTO_KEY, b ? "1" : "0"); }

  function render(container){
    var state = { name:null, idx:0, revealed:[], mine:[], passed:[], order:null };

    function frame(){
      container.innerHTML = state.name ? viewPractice() : viewPicker();
      bind();
    }

    /* ---------- 情景选择 ---------- */
    function viewPicker(){
      var html = '<div class="daily-head"><div class="tag">提示词 10 · 阶梯对话 · 由易到难</div>'
        + '<h2 style="margin:0;font-size:19px">💬 阶梯情景对话</h2></div>';
      html += '<div class="note">每个情景都是一段<b>结构化的阶梯对话</b>：先选情景，再按回合逐步练习——'
        + '第 1 回合最简单（单词/短句），越往后越接近真实复杂表达（复合句、从句、委婉语气），<b>难度由 L1 易 → L2 中 → L3 难 递进</b>，每轮 3–5 个回合。'
        + '提供两种模式：<b>🎯 严格闯关</b>下，进入 <b>L2/L3 难回合前</b>会先弹一个<b>语法 mini-check</b>（语序/填空/改错），答对才解锁回复；<b>💬 自由陪练</b>则跳过语法关、纯对话陪练。'
        + '每一回合都配 🔊 听力音频与「参考回答 + 说明」，练完即记录。练习中可点 <b>🔀 重排回合</b> 在本情景内部随机打乱顺序（不影响其他情景/全局），也能随时 <b>↺ 恢复由易到难</b>；开启顶部 <b>🔀 进入即随机</b> 后，每次进入情景会自动先洗牌一次。⚠ 文本层陪练，真实发音需结合录音。</div>';
      // 模式切换
      html += '<div class="seg"><span class="seg-label">练习模式</span>'
        + '<button class="seg-btn'+(mode==="strict"?" active":"")+'" data-mode="strict">🎯 严格闯关</button>'
        + '<button class="seg-btn'+(mode==="free"?" active":"")+'" data-mode="free">💬 自由陪练</button>'
        + '<span class="seg-hint">'+(mode==="strict"?"L2/L3 难回合前需先过语法关":"跳过语法关，纯对话陪练")+'</span></div>';
      // 进入即随机 开关
      html += '<div class="seg"><span class="seg-label">进入即随机</span>'
        + '<button class="seg-btn'+(autoShuffle?" active":"")+'" data-auto="1">🔀 开</button>'
        + '<button class="seg-btn'+(!autoShuffle?" active":"")+'" data-auto="0">关</button>'
        + '<span class="seg-hint">'+(autoShuffle?"每次进入情景自动洗牌一次（仅本情景内部）":"进入即按由易到难原顺序")+'</span></div>';
      html += '<div class="grid grid-3" style="margin-top:8px">';
      DIALOGUES.forEach(function(d){
        var lvArr = d.turns.map(function(t){return t.lv;});
        var span = lvArr[0] + "→" + lvArr[lvArr.length-1];
        var checks = d.turns.filter(function(t){return t.quiz;}).length;
        html += '<div class="dlg-card" data-name="'+EL.engine.esc(d.name)+'">'
          + '<div class="dlg-ico">💬</div>'
          + '<div class="dlg-title">'+EL.engine.esc(d.name)+'</div>'
          + '<div class="dlg-ctx">'+EL.engine.esc(d.ctx)+'</div>'
          + '<div class="row"><span class="chip">'+d.turns.length+' 回合</span>'
          + '<span class="chip w">难度 '+span+'</span>'
          + (checks?'<span class="chip quiz">'+checks+' 语法关</span>':'')+'</div>'
          + '<button class="btn sm" style="margin-top:10px" data-go="'+EL.engine.esc(d.name)+'">▶ 开始练习</button></div>';
      });
      html += '</div>';
      html += '<div class="note" style="margin-top:14px">已累计完成 <b>'+prog.all().length+'</b> 段阶梯对话。</div>';
      return html;
    }

    /* ---------- 逐步练习 ---------- */
    function viewPractice(){
      var d = DIALOGUES.filter(function(x){return x.name===state.name;})[0];
      var list = state.order || d.turns;
      var total = list.length;
      var done = state.idx >= total;
      if(done) return viewDone(d, list);
      var t = list[state.idx];
      var lv = LV[t.lv] || LV[1];
      var needQuiz = mode==="strict" && !!(t.quiz) && !state.passed[state.idx];

      var html = '<div class="row" style="margin-bottom:6px">'
        + '<button class="btn sm ghost" id="backList">← 返回情景</button>'
        + '<button class="btn sm rf" id="reshuffle" title="在本情景内部随机打乱回合顺序（不影响其他情景与全局）">🔀 重排回合</button>'
        + (state.order?'<button class="btn sm ghost" id="resort" title="恢复本情景由易到难原顺序">↺ 恢复</button>':'')
        + '<span class="spacer"></span>'
        + '<span class="chip">'+EL.engine.esc(d.name)+'</span>'
        + (state.order?'<span class="chip rf">🔀 已随机</span>':'')
        + '<span class="chip">回合 '+(state.idx+1)+' / '+total+'</span></div>';

      // 进度条
      html += '<div class="bar" style="height:7px;margin:10px 0 14px"><i style="width:'+Math.round((state.idx/total)*100)+'%;background:var(--brand)"></i></div>';

      html += '<div class="card"><div class="lc-head"><span class="lv '+lv.cls+'">'+lv.txt+'</span>'
        + '<h3 style="margin:0;font-size:15px">第 '+(state.idx+1)+' 回合 · 对方说</h3>'
        + '<span class="spacer"></span>'
        + '<button class="speak" data-spk="'+EL.engine.esc(t.partner)+'" title="听对方说">🔊</button></div>';
      html += '<div class="bubble partner" style="max-width:100%;align-self:stretch"><div class="who">陪练</div>'+EL.engine.esc(t.partner)
        + '<div class="bubble-zh">'+EL.engine.esc(t.zh)+'</div></div>';

      // 难回合前：语法 mini-check（未通过时锁定回复）
      if(needQuiz){
        html += renderQuiz(t.quiz);
        html += '<div class="quiz-lock">🔒 先通过上面的语法 mini-check，再解锁你的回复输入框。</div>';
        html += '<label class="fld" style="opacity:.5">你的回复（用英语，回车发送）</label>'
          + '<div class="chat-input"><input type="text" id="uinput" placeholder="完成语法关后解锁…" disabled>'
          + '<button class="btn" id="send" disabled>发送</button></div>';
        html += '<div class="row" style="margin-top:10px">'
          + '<button class="btn ghost sm" id="reveal" disabled>💡 看参考回答</button>'
          + '<span class="spacer"></span>'
          + '<button class="btn accent" id="next" disabled>'+(state.idx+1<total?'下一回合 ▶':'完成对话 ✓')+'</button></div>';
        html += '<div id="refArea" class="hidden"></div>';
        html += '</div>';
        return html;
      }

      // 学习者输入
      html += '<label class="fld">你的回复（用英语，回车发送）</label>'
        + '<div class="chat-input"><input type="text" id="uinput" placeholder="试着用英语回复对方…">'
        + '<button class="btn" id="send">发送</button></div>';
      html += '<div class="row" style="margin-top:10px">'
        + '<button class="btn ghost sm" id="reveal">💡 看参考回答</button>'
        + '<span class="spacer"></span>'
        + '<button class="btn accent" id="next">'+(state.idx+1<total?'下一回合 ▶':'完成对话 ✓')+'</button></div>';
      // 参考区（默认隐藏）
      html += '<div id="refArea" class="hidden"></div>';
      html += '</div>';
      return html;
    }

    function renderQuiz(q){
      var typeTxt = q.type==="fill" ? "填空" : "改错";
      var html = '<div class="quiz-card"><div class="lc-head"><span class="tag quiz">📝 语法 mini-check</span>'
        + '<span class="muted tiny">'+typeTxt+'</span>'
        + '<button class="speak sm" data-spk="'+EL.engine.esc(q.q.replace(/___/g," blank "))+'" title="听题干">🔊</button></div>';
      html += '<div class="quiz-q">'+EL.engine.esc(q.q).replace(/___/g,'<span class="blank">＿＿</span>')+'</div>';
      html += '<div class="quiz-opts" id="quizOpts">';
      q.opts.forEach(function(o,i){
        html += '<button class="quiz-opt" data-qi="'+i+'">'+EL.engine.esc(o)+'</button>';
      });
      html += '</div>';
      html += '<div class="quiz-explain hidden" id="quizExplain"></div>';
      html += '</div>';
      return html;
    }

    function viewDone(d, list){
      var total = list.length;
      var html = '<div class="done-banner">🎉 完成《'+EL.engine.esc(d.name)+'》· 共 '+total+' 回合'
        + (state.order?'（按<b>随机顺序</b>练习，难度标签仍随各回合保留）':'，难度 L1 易 → L3 难 由易到难走完')+'！</div>';
      html += '<div class="card"><h3>对话回顾</h3><div class="dlg-recap">';
      list.forEach(function(t,i){
        var lv = LV[t.lv] || LV[1];
        html += '<div class="dlg-turn"><div class="row"><span class="lv '+lv.cls+'">'+lv.txt+'</span>'
          + '<span class="muted tiny">第 '+(i+1)+' 回合</span>'
          + (t.quiz?'<span class="chip quiz" style="margin-left:6px">✦ 已过关语法检查</span>':'')+'</div>'
          + '<div class="bubble partner" style="max-width:100%;align-self:stretch"><div class="who">陪练</div>'+EL.engine.esc(t.partner)
          + '<div class="bubble-zh">'+EL.engine.esc(t.zh)+'</div></div>'
          + '<div class="dlg-model"><b>参考：</b>'+EL.engine.esc(t.model)
          + '<button class="speak sm" data-spk="'+EL.engine.esc(t.model)+'" title="听参考">🔊</button></div>'
          + '<div class="dlg-tip">💡 '+EL.engine.esc(t.tip)+'</div></div>';
      });
      html += '</div></div>';
      html += '<div class="row" style="margin-top:6px">'
        + '<button class="btn" id="again">🔄 再练一次</button>'
        + (state.order?'<button class="btn ghost sm" id="resort">↺ 恢复由易到难</button>':'')
        + '<button class="btn ghost" id="backList2">← 返回情景列表</button></div>';
      return html;
    }

    function bind(){
      // 模式切换
      EL.engine.$all("[data-mode]", container).forEach(function(b){
        b.onclick = function(){ setMode(b.getAttribute("data-mode")); frame(); };
      });
      // 进入即随机 开关
      EL.engine.$all("[data-auto]", container).forEach(function(b){
        b.onclick = function(){ setAuto(b.getAttribute("data-auto")==="1"); frame(); };
      });
      // 情景卡
      EL.engine.$all("[data-go]", container).forEach(function(b){
        b.onclick = function(){ startDialogue(b.getAttribute("data-go")); };
      });
      EL.engine.$all(".dlg-card", container).forEach(function(c){
        c.addEventListener("click", function(e){
          if(e.target.closest("[data-go]")) return;
          startDialogue(c.getAttribute("data-name"));
        });
      });
      // 返回
      var bl = EL.engine.$("#backList", container); if(bl) bl.onclick = function(){ resetState(); frame(); };
      var bl2 = EL.engine.$("#backList2", container); if(bl2) bl2.onclick = function(){ resetState(); frame(); };
      var ag = EL.engine.$("#again", container); if(ag) ag.onclick = function(){ state.idx=0; state.revealed=[]; state.mine=[]; state.passed=[]; frame(); };
      var rf = EL.engine.$("#reshuffle", container); if(rf) rf.onclick = function(){ reshuffle(); };
      var rs = EL.engine.$("#resort", container); if(rs) rs.onclick = function(){ resort(); };

      // 语法 mini-check 选项
      var opts = EL.engine.$all(".quiz-opt", container);
      if(opts.length){
        var t = curTurn();
        opts.forEach(function(b){
          b.onclick = function(){
            var qi = parseInt(b.getAttribute("data-qi"),10);
            if(qi === t.quiz.answer){
              state.passed[state.idx] = true;
              EL.engine.toast("✓ 语法关通过，回复已解锁", "ok");
              frame();
            } else {
              b.classList.add("wrong");
              b.disabled = true;
              var ex = EL.engine.$("#quizExplain", container);
              ex.classList.remove("hidden");
              ex.innerHTML = '✗ 不对，再看一遍：'+EL.engine.esc(t.quiz.explain)+' <b>正确答案：'+EL.engine.esc(t.quiz.opts[t.quiz.answer])+'</b>';
            }
          };
        });
      }

      // 练习交互（仅当语法关已通过 / 本回合无 quiz）
      var send = EL.engine.$("#send", container);
      if(send && !send.disabled){
        send.onclick = doSend;
        var inp = EL.engine.$("#uinput", container);
        inp.addEventListener("keydown", function(e){ if(e.key==="Enter") doSend(); });
      }
      var rv = EL.engine.$("#reveal", container);
      if(rv && !rv.disabled) rv.onclick = function(){
        var t2 = curTurn();
        state.revealed[state.idx] = true;
        var area = EL.engine.$("#refArea", container);
        area.classList.remove("hidden");
        area.innerHTML = '<div class="dlg-ref"><div class="lc-head"><span class="tag">参考回答</span>'
          + '<span class="spacer"></span><button class="speak sm" data-spk="'+EL.engine.esc(t2.model)+'" title="听参考">🔊</button></div>'
          + '<div class="dlg-model">'+EL.engine.esc(t2.model)+'</div>'
          + '<div class="dlg-tip">💡 '+EL.engine.esc(t2.tip)+'</div></div>';
        EL.engine.$all("[data-spk]", area).forEach(function(b){ b.onclick=function(){ EL.engine.speak(b.getAttribute("data-spk")); }; });
        rv.classList.add("hidden");
      };
      var nx = EL.engine.$("#next", container);
      if(nx && !nx.disabled) nx.onclick = function(){
        if(state.idx+1 < curTotal()){ state.idx++; frame(); }
        else { // 完成
          state.idx = curTotal(); // 触发 done 视图
          prog.add({scenario:state.name, turns:curTotal(), at:new Date().toISOString()});
          if(EL.app && EL.app.updateMeta) EL.app.updateMeta();
          frame();
        }
      };
      // 通用发音
      EL.engine.$all("[data-spk]", container).forEach(function(b){
        if(b.id==="reveal"||b.closest("#refArea")) return;
        b.onclick = function(){ EL.engine.speak(b.getAttribute("data-spk")); };
      });
    }

    function resetState(){ state.name=null; state.idx=0; state.revealed=[]; state.mine=[]; state.passed=[]; state.order=null; }
    function startDialogue(name){
      state.name = name; state.idx = 0; state.revealed = []; state.mine = []; state.passed = []; state.order = null;
      // 进入即随机：仅在本情景内部洗牌一次，全局与其他情景不受影响
      if(autoShuffle){ var d0 = DIALOGUES.filter(function(x){return x.name===name;})[0]; state.order = shuffleFisherYates(d0.turns); }
      frame();
      // 开场自动朗读（读当前顺序的首回合；重排后读重排后的首回合）
      var d = DIALOGUES.filter(function(x){return x.name===name;})[0];
      var first = (state.order || d.turns)[0];
      setTimeout(function(){ EL.engine.speak(first.partner); }, 300);
    }
    function curTurn(){ var d = DIALOGUES.filter(function(x){return x.name===state.name;})[0]; return (state.order||d.turns)[state.idx]; }
    function curTotal(){ var d = DIALOGUES.filter(function(x){return x.name===state.name;})[0]; return (state.order||d.turns).length; }

    /* ---------- 情景内随机重排回合 ---------- */
    // 触发：练习视图内点击「🔀 重排回合」按钮。
    // 范围：仅作用于当前情景（state.name）内部的回合顺序；复制 d.turns 到 state.order，绝不改动 DIALOGUES 全局数据，也不影响其他情景。
    // 算法：Fisher-Yates 均匀洗牌（原地操作副本），保证每个回合恰好出现一次、覆盖全部回合、无重复无丢失。
    // 恢复：重排后 idx/已通过/已揭示/我的回复 均清空，从首回合按新顺序执行；返回情景列表或重新进入情景会清掉 order（恢复由易到难）；
    //       「再练一次」保留当前 order（重练同一随机序列）；「↺ 恢复由易到难」清空 order 回到原顺序。
    //       进入即随机 开关（autoShuffle）：开启后 startDialogue 在进入情景时自动对该情景洗牌一次，关闭则保持原顺序；始终仅作用于本情景。
    function shuffleFisherYates(arr){
      var a = arr.slice();
      for(var i=a.length-1;i>0;i--){
        var j = Math.floor(Math.random()*(i+1));
        var tmp = a[i]; a[i]=a[j]; a[j]=tmp;
      }
      return a;
    }
    function reshuffle(){
      var d = DIALOGUES.filter(function(x){return x.name===state.name;})[0];
      state.order = shuffleFisherYates(d.turns);
      state.idx = 0; state.revealed = []; state.mine = []; state.passed = [];
      EL.engine.toast("🔀 已在本情景内随机重排回合顺序（不影响其他情景 / 全局）", "info");
      frame();
    }
    function resort(){
      state.order = null;
      state.idx = 0; state.revealed = []; state.mine = []; state.passed = [];
      EL.engine.toast("↺ 已恢复本情景由易到难原顺序", "info");
      frame();
    }
    function doSend(){
      var inp = EL.engine.$("#uinput", container);
      var txt = inp.value.trim(); if(!txt) return;
      state.mine[state.idx] = txt;
      inp.value = "";
      EL.engine.toast("已记录你的回复，点「看参考回答」对照", "info");
    }

    frame();
  }
  window.EL.m10 = { render:render };
})();
