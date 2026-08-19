/* ===== m1.js · 模块一 每日一练（原考点库改造） ===== */
(function(){
  window.EL = window.EL || {};

  function render(container){
    var key = EL.engine.todayKey();
    var set = EL.engine.dailySet(key);
    var done = !!EL.store.get("daily_done_"+key);

    function frame(){
      var html = '<div class="daily-head">'
        + '<div><div class="tag">提示词 1.1 · 每日一练</div></div>'
        + '<h2 style="margin:0;font-size:19px">🌟 每日一练 · '+key+'</h2>'
        + '<span class="spacer"></span>'
        + '<span class="chip">10 个生词 · 3 个句型</span></div>';

      if(done){
        html += '<div class="done-banner">✅ 今天的 10 词 + 3 句型已完成打卡！明天会换新内容。点 🔊 可随时回听。</div>';
      } else {
        html += '<div class="note">每天 10 个生动实用的口语词 + 3 个高频句型，配 🔊 听力音频与跟读文本。点「🔊」听发音，大声跟读 2 遍效果最佳。</div>';
      }

      // 生词区
      html += '<h3 style="margin-top:18px">📝 今日生词（点 🔊 听发音，跟读文本即下方英文）</h3>';
      html += '<div class="word-grid">';
      set.words.forEach(function(w){
        html += '<div class="word-card">'
          + '<div class="word-top"><span class="wf">'+EL.engine.esc(w.en)+'</span>'
          + '<span class="wphon">'+EL.engine.esc(w.phon)+'</span>'
          + '<span class="spacer"></span>'
          + '<button class="speak" data-spk="'+EL.engine.esc(w.en)+'" title="听发音">🔊</button></div>'
          + '<div class="wzh">'+EL.engine.esc(w.zh)+'</div>'
          + '<div class="wex"><b>'+EL.engine.esc(w.ex)+'</b></div>'
          + '<div class="wex muted">'+EL.engine.esc(w.exzh)+'</div>'
          + '<div class="wscn">🎯 场景：'+EL.engine.esc(w.scn)+'</div>'
          + '</div>';
      });
      html += '</div>';

      // 句型区
      html += '<h3 style="margin-top:20px">💡 今日句型（替换横线处即可套用）</h3>';
      set.patterns.forEach(function(p){
        html += '<div class="pattern-card">'
          + '<div class="word-top"><span class="pat-en">'+EL.engine.esc(p.en)+'</span>'
          + '<span class="spacer"></span>'
          + '<button class="speak" data-spk="'+EL.engine.esc(p.ex)+'" title="听例句发音">🔊</button></div>'
          + '<div class="pat-zh">'+EL.engine.esc(p.zh)+'</div>'
          + '<div class="pat-ex"><b>'+EL.engine.esc(p.ex)+'</b> — '+EL.engine.esc(p.exzh)+'</div>'
          + '<div class="wscn">🎯 场景：'+EL.engine.esc(p.scn)+'</div>'
          + '</div>';
      });

      html += '<div class="row" style="margin-top:18px">';
      if(!done){
        html += '<button class="btn accent" id="markDone">✅ 标记今日已完成</button>';
      }
      html += '<button class="btn ghost" id="replayAll">🔊 播放全部生词</button>'
        + '<span class="muted tiny">提示：浏览器内置发音，无需联网音频文件；如无声请检查设备音量或浏览器语音设置。</span></div>';

      container.innerHTML = html;
      bind();
    }

    function bind(){
      EL.engine.$all("[data-spk]", container).forEach(function(b){
        b.onclick = function(){ EL.engine.speak(b.getAttribute("data-spk")); };
      });
      var md = EL.engine.$("#markDone", container);
      if(md) md.onclick = function(){
        EL.store.set("daily_done_"+key, true);
        EL.engine.toast("已打卡！明天见新内容 🌟","ok");
        frame();
      };
      var ra = EL.engine.$("#replayAll", container);
      if(ra) ra.onclick = function(){
        set.words.forEach(function(w,i){ setTimeout(function(){ EL.engine.speak(w.en); }, i*900); });
      };
    }

    frame();
  }
  window.EL.m1 = { render:render };
})();
