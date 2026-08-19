/* ===== m6.js · 模块六 听力训练（扩充：听读配套） ===== */
(function(){
  window.EL = window.EL || {};
  var listen = EL.store.collection(EL.store.keys.listenItems);

  function render(container){
    var state = {tab:"grade"};
    function frame(){
      var html = '<div class="row" style="margin-bottom:6px">'
        + '<button class="btn sm '+(state.tab==="grade"?"":"ghost")+'" data-tab="grade">① 材料分级与出题</button>'
        + '<button class="btn sm '+(state.tab==="dict"?"":"ghost")+'" data-tab="dict">② 精听/听写脚本</button>'
        + '<span class="spacer"></span><span class="chip">已存材料 '+listen.all().length+'</span></div>';
      html += state.tab==="grade"? viewGrade() : viewDict();
      container.innerHTML = html; bind();
    }

    function viewGrade(){
      var sample = EL.engine.LISTEN_SAMPLES[0];
      return '<div class="card"><h3>① 听力材料分级与出题 <span class="tag">提示词 6.1</span></h3>'
        + '<div class="note">粘贴听力原文或主题文本，系统自动分级（基于词长/句长/稀有词），并据题型生成唯一可定位的题目 + 答案解析 + 难点标注。每题配 🔊 听原句音频，跟读文本即题目下方原文。</div>'
        + '<label class="fld">听力原文 / 主题文本</label><textarea id="gText" rows="7" placeholder="'+EL.engine.esc(sample)+'">'+EL.engine.esc(sample)+'</textarea>'
        + '<div class="grid grid-3">'
        + '<div><label class="fld">目标等级</label><select id="gLevel"><option>初级(A2)</option><option selected>中级(B1)</option><option>中高级(B2)</option><option>高级(C1)</option></select></div>'
        + '<div><label class="fld">题型</label><select id="gType"><option value="choice">选择题（挖空）</option><option value="fill">填空题（挖空）</option><option value="judge">判断题</option></select></div>'
        + '<div><label class="fld">题量</label><input type="number" id="gCount" value="4" min="1" max="12"></div></div>'
        + '<div class="row" style="margin-top:12px"><button class="btn" id="gGen">🎧 分级并出题</button>'
        + '<button class="btn ghost" id="gHear">🔊 听全文</button>'
        + '<button class="btn ghost" id="gSave">💾 存为材料</button></div>'
        + '<div id="gOut"></div></div>';
    }
    function genGrade(save){
      var text = EL.engine.$("#gText", container).value;
      if(!text.trim()){ EL.engine.toast("请填写文本","warn"); return; }
      var g = EL.engine.gradeText(text);
      var type = EL.engine.$("#gType", container).value;
      var count = +EL.engine.$("#gCount", container).value || 4;
      var qs = EL.engine.genListenQuestions(text, type, count);
      if(!qs.length){ EL.engine.$("#gOut", container).innerHTML='<div class="note warn">文本过短，无法出题，请补充内容。</div>'; return; }
      var html = '<hr class="sep"><div class="row"><span class="chip b">自动分级：'+g.level+'</span><span class="chip">难度分 '+g.score+'</span>'
        + '<span class="chip">词数 '+g.words+'</span><span class="chip">均词长 '+g.avgWord+'</span><span class="chip">均句长 '+g.avgSent+'</span></div>';
      html += '<div id="quizBox"></div>';
      EL.engine.$("#gOut", container).innerHTML = html;
      renderQuiz(qs, type);
      if(save){ listen.add({text:text, level:g.level, type:type, at:new Date().toISOString()}); EL.engine.toast("已保存材料","ok"); }
    }
    function renderQuiz(qs, type){
      var box = EL.engine.$("#quizBox", container);
      var html = '<div class="note" style="margin-top:10px">点 🔊 听原句，点击选项作答，答后显示答案与解析（答案唯一可定位）。</div>';
      qs.forEach(function(q){
        html += '<div class="quiz-q" data-a="'+EL.engine.esc(q.answer)+'">'
          + '<div class="row"><span class="qq-text">'+q.q+'. '+EL.engine.esc(q.stem)+'</span>'
          + '<span class="spacer"></span>'
          + '<button class="speak sm" data-spk="'+EL.engine.esc(q.sentence)+'" title="听原句">🔊</button></div>';
        if(type==="judge"){
          html += '<div class="quiz-opt" data-v="正确">正确</div><div class="quiz-opt" data-v="错误">错误</div>';
        } else if(type==="fill"){
          html += '<div class="quiz-opt">参考答案：<b>'+EL.engine.esc(q.answer)+'</b></div>';
        } else {
          q.choices.forEach(function(c){ html += '<div class="quiz-opt" data-v="'+EL.engine.esc(c)+'">'+EL.engine.esc(c)+'</div>'; });
        }
        html += '<div class="explain hidden note" style="margin-top:6px">解析：'+EL.engine.esc(q.explain)+'</div></div>';
      });
      box.innerHTML = html;
      EL.engine.$all("[data-spk]", box).forEach(function(b){ b.onclick=function(e){ e.stopPropagation(); EL.engine.speak(b.getAttribute("data-spk")); }; });
      EL.engine.$all(".quiz-opt", box).forEach(function(opt){
        if(opt.getAttribute("data-v")===null) return;
        opt.onclick = function(){
          if(opt.classList.contains("correct")||opt.classList.contains("wrong")) return;
          var qEl = opt.closest(".quiz-q"); var ans = qEl.getAttribute("data-a");
          var val = opt.getAttribute("data-v");
          if(val===ans){ opt.classList.add("correct"); opt.innerHTML += '<span class="mark">✓</span>'; }
          else { opt.classList.add("wrong"); opt.innerHTML += '<span class="mark">✗</span>';
            EL.engine.$all(".quiz-opt", qEl).forEach(function(o){ if(o.getAttribute("data-v")===ans) o.classList.add("correct"); });
          }
          EL.engine.$(".explain", qEl).classList.remove("hidden");
        };
      });
    }

    function viewDict(){
      var sample = EL.engine.LISTEN_SAMPLES[1];
      return '<div class="card"><h3>② 精听 / 听写训练脚本 <span class="tag">提示词 6.2</span></h3>'
        + '<div class="note">按句切分，标注连读/弱读/重读（真实发音规律），生成挖空听写稿与复述任务。每句配 🔊 听原音，跟读文本即下方句子。听写请配合真实语音材料。</div>'
        + '<label class="fld">材料文本</label><textarea id="dText" rows="6" placeholder="'+EL.engine.esc(sample)+'">'+EL.engine.esc(sample)+'</textarea>'
        + '<div class="grid grid-2"><div><label class="fld">水平</label><select id="dLevel"><option>初级</option><option selected>中级</option><option>高级</option></select></div>'
        + '<div><label class="fld">训练目标</label><select id="dGoal"><option>听写+复述</option><option>仅听写</option><option>仅复述</option></select></div></div>'
        + '<div class="row" style="margin-top:12px"><button class="btn" id="dGen">✍️ 生成精听脚本</button></div>'
        + '<div id="dOut"></div></div>';
    }
    function genDict(){
      var text = EL.engine.$("#dText", container).value;
      if(!text.trim()){ EL.engine.toast("请填写文本","warn"); return; }
      var goal = EL.engine.$("#dGoal", container).value;
      var script = EL.engine.dictationScript(text);
      var html = '<hr class="sep"><h4>逐句拆解（语音现象 · 点 🔊 听原句）</h4>';
      script.forEach(function(s, i){
        html += '<div class="list-item"><button class="speak" data-spk="'+EL.engine.esc(s.sentence)+'" title="听原句">🔊</button>'
          + '<div class="li-main"><div class="li-title">句 '+(i+1)+'</div>';
        html += '<div class="li-desc">'+s.marks.map(function(m){ return m.type==="标点"?EL.engine.esc(m.t):'<span class="tag" style="'+(m.type.indexOf("连读")>=0?"border-color:var(--accent);color:var(--accent)":m.type==="弱读"?"border-color:var(--line);color:var(--ink-2)":"color:var(--brand)")+'">'+EL.engine.esc(m.t)+'·'+m.type+'</span>'; }).join(" ")+'</div>'
          + '<div class="li-desc" style="margin-top:4px">'+EL.engine.esc(s.sentence)+'</div></div></div>';
      });
      if(goal!=="仅复述"){
        html += '<h4 style="margin-top:14px">挖空听写稿</h4><div class="codeblock">'+script.map(function(s){return EL.engine.esc(s.blanked);}).join("\n\n")+'</div>';
      }
      if(goal!=="仅听写"){
        html += '<h4 style="margin-top:14px">复述 / 总结任务</h4><div class="note">听完后，用 3 句话复述材料主旨：① 谁/什么事？② 关键细节？③ 你的理解？可对比原句自查遗漏。</div>';
      }
      html += '<div class="note warn" style="margin-top:10px">⚠ 连读/弱读/重读为基于词性与音系规则的启发式标注，实际以原音频为准；听写请配合真实语音材料。</div>';
      EL.engine.$("#dOut", container).innerHTML = html;
      EL.engine.$all("[data-spk]", container).forEach(function(b){ b.onclick=function(){ EL.engine.speak(b.getAttribute("data-spk")); }; });
    }

    function bind(){
      EL.engine.$all("[data-tab]", container).forEach(function(b){ b.onclick=function(){ state.tab=b.getAttribute("data-tab"); frame(); }; });
      var gGen = EL.engine.$("#gGen", container); if(gGen) gGen.onclick = function(){ genGrade(false); };
      var gHear = EL.engine.$("#gHear", container); if(gHear) gHear.onclick = function(){ EL.engine.speak(EL.engine.$("#gText", container).value); };
      var gSave = EL.engine.$("#gSave", container); if(gSave) gSave.onclick = function(){ genGrade(true); };
      var dGen = EL.engine.$("#dGen", container); if(dGen) dGen.onclick = genDict;
    }
    frame();
  }
  window.EL.m6 = { render:render };
})();
