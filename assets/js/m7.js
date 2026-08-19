/* ===== m7.js · 模块七 900句玩转英语（实用口语短句 + 情景对话） ===== */
(function(){
  window.EL = window.EL || {};
  var BANK = EL.engine.SENTENCE_BANK;

  function render(container){
    var state = {q:"", cat:"全部"};
    function frame(){
      var total = BANK.reduce(function(n,c){return n + c.items.length + (c.dialog?c.dialog.length:0);}, 0);
      var cats = ["全部"].concat(BANK.map(function(c){return c.cat;}));

      var html = '<div class="daily-head"><div class="tag">实用口语 · 900句玩转英语</div>'
        + '<h2 style="margin:0;font-size:19px">💬 900句玩转英语</h2></div>';
      html += '<div class="note">收录 '+BANK.length+' 类、'+total+' 条实用口语短句与情景对话，覆盖问候、购物、餐厅、问路、职场、旅行、应急等真实场景。每条配 🔊 听力音频与跟读文本，支持分类与搜索。</div>';

      html += '<div class="row" style="margin-bottom:10px">'
        + '<input type="text" id="q7" placeholder="搜索英文或中文（如 谢谢 / restaurant）" value="'+EL.engine.esc(state.q)+'" style="max-width:320px">'
        + '<button class="btn sm" id="q7go">搜索</button>'
        + '<span class="spacer"></span><span class="chip">'+total+' 句</span></div>';
      html += '<div class="catbar" id="cat7">';
      cats.forEach(function(c){ html += '<span class="cat'+(c===state.cat?" active":"")+'" data-cat="'+EL.engine.esc(c)+'">'+EL.engine.esc(c)+'</span>'; });
      html += '</div>';

      var shown = 0;
      BANK.forEach(function(cat){
        if(state.cat!=="全部" && cat.cat!==state.cat) return;
        var items = cat.items.filter(function(s){
          if(!state.q) return true;
          var q = state.q.toLowerCase();
          return s.en.toLowerCase().indexOf(q)>=0 || s.zh.toLowerCase().indexOf(q)>=0;
        });
        var dlg = (cat.dialog||[]).filter(function(d){
          if(!state.q) return false;
          var q = state.q.toLowerCase();
          return d.en.toLowerCase().indexOf(q)>=0 || d.zh.toLowerCase().indexOf(q)>=0;
        });
        if(!items.length && !dlg.length) return;
        shown++;
        html += '<div class="card"><div class="lc-head"><span class="lv lv-basic">情景</span><h3 style="margin:0;font-size:15px">'+EL.engine.esc(cat.cat)+'</h3>'
          + '<span class="spacer"></span><button class="btn sm ghost" data-play-cat="'+EL.engine.esc(cat.cat)+'">🔊 播放本类</button></div>';
        html += '<div class="sent-list">';
        items.forEach(function(s){
          html += '<div class="sent-row">'
            + '<button class="speak sm" data-spk="'+EL.engine.esc(s.en)+'" title="听发音">🔊</button>'
            + '<div class="sent-main"><div class="sent-en">'+EL.engine.esc(s.en)+'</div><div class="sent-zh">'+EL.engine.esc(s.zh)+'</div>'
            + (s.tip?'<div class="sent-tip">💡 '+EL.engine.esc(s.tip)+'</div>':'')+'</div></div>';
        });
        html += '</div>';
        if(cat.dialog){
          var dlgShow = dlg.length? dlg : (state.q? [] : cat.dialog);
          if(dlgShow.length){
            html += '<details class="dialog-box"><summary>🗨️ 情景对话（'+(cat.dialog?cat.dialog.length:0)+' 句）</summary><div class="chat">';
            cat.dialog.forEach(function(d){
              var who = d.sp==="A"?"partner":"me";
              html += '<div class="bubble '+who+'"><div class="who">'+EL.engine.esc(d.sp)+'</div>'+EL.engine.esc(d.en)
                + '<button class="speak sm" style="margin-top:6px" data-spk="'+EL.engine.esc(d.en)+'">🔊</button>'
                + '<div class="bubble-zh">'+EL.engine.esc(d.zh)+'</div></div>';
            });
            html += '</div></details>';
          }
        }
        html += '</div>';
      });
      if(!shown) html += '<div class="note">没有匹配的句子，换个关键词试试。</div>';

      container.innerHTML = html;
      bind();
    }

    function bind(){
      EL.engine.$all("[data-spk]", container).forEach(function(b){ b.onclick=function(){ EL.engine.speak(b.getAttribute("data-spk")); }; });
      EL.engine.$all("[data-cat]", container).forEach(function(b){
        b.onclick = function(){ state.cat = b.getAttribute("data-cat"); frame(); };
      });
      var q = EL.engine.$("#q7", container);
      if(q){
        EL.engine.$("#q7go", container).onclick = function(){ state.q = q.value.trim(); frame(); };
        q.addEventListener("keydown", function(e){ if(e.key==="Enter"){ state.q = q.value.trim(); frame(); } });
        // 实时过滤
        q.addEventListener("input", function(){ state.q = q.value.trim(); });
      }
      EL.engine.$all("[data-play-cat]", container).forEach(function(b){
        b.onclick = function(){
          var cat = b.getAttribute("data-play-cat");
          var c = BANK.filter(function(x){return x.cat===cat;})[0]; if(!c) return;
          var lines = c.items.map(function(s){return s.en;});
          if(c.dialog) c.dialog.forEach(function(d){ lines.push(d.en); });
          lines.forEach(function(s,i){ setTimeout(function(){ EL.engine.speak(s); }, i*1500); });
        };
      });
    }
    frame();
  }
  window.EL.m7 = { render:render };
})();
