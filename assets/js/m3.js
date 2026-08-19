/* ===== m3.js · 模块三 自然拼读（基础 + 进阶 + 进阶练习） ===== */
(function(){
  window.EL = window.EL || {};
  var LESSONS = EL.engine.PHONICS;
  var PRACTICE = EL.engine.PHONICS_PRACTICE;

  function lessonCard(les){
    var html = '<div class="phonics-lesson"><div class="lc-head"><span class="lv lv-'+(les.level==="进阶"?"adv":"basic")+'">'+les.level+'</span>'
      + '<h3 style="margin:0;font-size:15px">'+EL.engine.esc(les.title)+'</h3></div>';
    html += '<div class="note" style="margin:8px 0 12px">'+EL.engine.esc(les.note)+'</div>';
    html += '<div class="word-grid">';
    les.items.forEach(function(it){
      html += '<div class="sound-card">'
        + '<div class="sound-big">'+EL.engine.esc(it.label)+'</div>'
        + '<div class="sound-ipa">'+EL.engine.esc(it.ipa)+'</div>'
        + '<button class="speak" style="margin:8px auto 6px" data-spk="'+EL.engine.esc(it.word)+'" title="听发音">🔊</button>'
        + '<div class="sound-word">'+EL.engine.esc(it.word)+' · '+EL.engine.esc(it.zh)+'</div>'
        + (it.tip?'<div class="sound-tip">💡 '+EL.engine.esc(it.tip)+'</div>':'')
        + '</div>';
    });
    html += '</div>';
    html += '<div class="row" style="margin-top:10px"><button class="btn sm ghost" data-play-lesson="'+les.id+'">🔊 播放本节全部</button></div>';
    html += '</div>';
    return html;
  }

  function render(container){
    function frame(){
      var html = '<div class="daily-head"><div class="tag">提示词 3.x · 自然拼读</div>'
        + '<h2 style="margin:0;font-size:19px">🔤 自然拼读 · 从入门到进阶</h2></div>';
      html += '<div class="note">Phonics 帮你「见词能读、听音能写」。先打基础（短元音 / CVC / 字母组合），再练进阶（魔法 e / R 控制 / 双元音 / 连缀 / 软硬音 / 不发音字母），每节课点 🔊 听标准发音、跟读文本即卡片上的单词。底部「进阶练习」用解码、最小对立对与拼读句子巩固。</div>';

      html += '<h3 class="sec">基础规则</h3>';
      LESSONS.filter(function(l){return l.level!=="进阶";}).forEach(function(l){ html += lessonCard(l); });

      html += '<h3 class="sec">进阶规则（更复杂的拼读）</h3>';
      LESSONS.filter(function(l){return l.level==="进阶";}).forEach(function(l){ html += lessonCard(l); });

      /* ---- 进阶练习 ---- */
      html += '<div class="card" style="margin-top:18px"><h3>🏋️ 进阶练习</h3>';

      // 1) 拼读解码器
      html += '<h4>① 拼读解码器：选一个词，看它怎么「拆音拼读」</h4>';
      html += '<div class="grid grid-3" style="align-items:end">'
        + '<div><label class="fld">要解码的词</label><select id="decSel">'
        + PRACTICE.decode.map(function(d){return '<option value="'+EL.engine.esc(d.word)+'">'+EL.engine.esc(d.word)+'</option>';}).join("")
        + '</select></div>'
        + '<div><button class="btn sm" id="decSpk">🔊 听这个词</button></div></div>';
      html += '<div id="decOut" class="decode-box" style="margin-top:10px"></div>';

      // 2) 最小对立对
      html += '<h4 style="margin-top:16px">② 最小对立对（Minimal Pairs）：听辨易混音</h4>';
      html += '<div class="note" style="margin-top:0">点两个 🔊 分别听，对照提示区分；勾选「已掌握」记录你已分清的对子。</div>';
      html += '<div class="pair-list">';
      PRACTICE.minPairs.forEach(function(p, i){
        html += '<div class="pair-row" data-pair="'+i+'">'
          + '<div class="pair-words"><button class="speak sm" data-spk="'+EL.engine.esc(p.a)+'">🔊</button><b>'+EL.engine.esc(p.a)+'</b>'
          + '<span class="vs">vs</span><button class="speak sm" data-spk="'+EL.engine.esc(p.b)+'">🔊</button><b>'+EL.engine.esc(p.b)+'</b></div>'
          + '<div class="pair-tip">'+EL.engine.esc(p.tip)+'</div>'
          + '<label class="pair-done"><input type="checkbox" data-paircheck="'+i+'"> 已掌握</label></div>';
      });
      html += '</div>';

      // 3) 拼读句子
      html += '<h4 style="margin-top:16px">③ 拼读句子：连读成句，朗读 + 听原音</h4>';
      html += '<div class="row" style="margin:8px 0 6px"><button class="btn sm ghost" id="playSent">🔊 播放全部句子</button></div>';
      html += '<div class="sent-list">';
      PRACTICE.sentences.forEach(function(s){
        html += '<div class="sent-row"><button class="speak sm" data-spk="'+EL.engine.esc(s)+'" title="听原句">🔊</button>'
          + '<span class="sent-en">'+EL.engine.esc(s)+'</span></div>';
      });
      html += '</div>';

      html += '</div>'; // practice card

      container.innerHTML = html;
      bind();
    }

    function bind(){
      EL.engine.$all("[data-spk]", container).forEach(function(b){
        b.onclick = function(){ EL.engine.speak(b.getAttribute("data-spk")); };
      });
      EL.engine.$all("[data-play-lesson]", container).forEach(function(b){
        b.onclick = function(){
          var id = b.getAttribute("data-play-lesson");
          var les = LESSONS.filter(function(l){return l.id===id;})[0];
          if(!les) return;
          les.items.forEach(function(it,i){ setTimeout(function(){ EL.engine.speak(it.word); }, i*900); });
        };
      });
      var sel = EL.engine.$("#decSel", container);
      if(sel){
        var renderDecode = function(){
          var w = sel.value;
          var d = PRACTICE.decode.filter(function(x){return x.word===w;})[0];
          var box = EL.engine.$("#decOut", container);
          if(!d){ box.textContent = ""; return; }
          box.innerHTML = '<div class="dec-word">'+EL.engine.esc(d.word)+'</div>'
            + '<div class="dec-maps">'+d.map.map(function(m){return '<span class="dec-chip">'+EL.engine.esc(m)+'</span>';}).join('<span class="dec-plus">+</span>')+'</div>'
            + '<div class="dec-note">💡 '+EL.engine.esc(d.note)+'</div>';
        };
        sel.onchange = renderDecode;
        renderDecode();
        EL.engine.$("#decSpk", container).onclick = function(){ EL.engine.speak(sel.value); };
      }
      var ps = EL.engine.$("#playSent", container);
      if(ps) ps.onclick = function(){
        PRACTICE.sentences.forEach(function(s,i){ setTimeout(function(){ EL.engine.speak(s); }, i*2200); });
      };
    }

    frame();
  }
  window.EL.m3 = { render:render };
})();
