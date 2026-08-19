/* ===== m9.js · 模块九 专业术语库（职场/金融/科技/学术/医疗/法律/正式生活用语） ===== */
(function(){
  window.EL = window.EL || {};
  var TERMS = EL.engine.PRO_TERMS;

  function render(container){
    var state = {q:"", cat:"全部"};
    function frame(){
      var cats = ["全部"].concat(TERMS.map(function(t){return t.cat;}).filter(function(v,i,a){return a.indexOf(v)===i;}));
      var total = TERMS.length;

      var html = '<div class="daily-head"><div class="tag">专业术语 · 示例 / 说明 / 边界情况</div>'
        + '<h2 style="margin:0;font-size:19px">🎓 专业术语库</h2></div>';
      html += '<div class="note">收录 '+total+' 条职场商务、金融财务、科技互联网、学术写作、医疗健康、法律合同与正式生活用语。每条含 <b>音标🔊</b>、<b>中文释义</b>、<b>示例句</b>、<b>详细说明</b> 与 <b>边界情况/易错点</b>，帮助你在真实场景准确使用，避免中式直译与搭配错误。</div>';

      html += '<div class="row" style="margin-bottom:10px">'
        + '<input type="text" id="q9" placeholder="搜索术语或中文（如 leverage / 对冲）" value="'+EL.engine.esc(state.q)+'" style="max-width:320px">'
        + '<button class="btn sm" id="q9go">搜索</button>'
        + '<span class="spacer"></span><span class="chip">'+total+' 条</span></div>';
      html += '<div class="catbar" id="cat9">';
      cats.forEach(function(c){ html += '<span class="cat'+(c===state.cat?" active":"")+'" data-cat="'+EL.engine.esc(c)+'">'+EL.engine.esc(c)+'</span>'; });
      html += '</div>';

      var shown = 0;
      cats.forEach(function(cat){
        if(state.cat!=="全部" && cat!==state.cat) return;
        var list = TERMS.filter(function(t){
          if(state.cat!=="全部" && t.cat!==state.cat) return false;
          if(!state.q) return true;
          var q = state.q.toLowerCase();
          return t.en.toLowerCase().indexOf(q)>=0 || t.zh.toLowerCase().indexOf(q)>=0 || (t.explain&&t.explain.toLowerCase().indexOf(q)>=0);
        });
        if(!list.length) return;
        shown++;
        html += '<div class="card"><div class="lc-head"><span class="lv lv-adv">'+EL.engine.esc(cat)+'</span>'
          + '<h3 style="margin:0;font-size:15px">'+EL.engine.esc(cat)+'</h3>'
          + '<span class="spacer"></span><button class="btn sm ghost" data-play-cat="'+EL.engine.esc(cat)+'">🔊 播放本类</button></div>';
        html += '<div class="term-list">';
        list.forEach(function(t){
          html += '<div class="term-card">'
            + '<div class="term-top"><div class="term-en">'+EL.engine.esc(t.en)+'</div>'
            + '<div class="term-phon">'+EL.engine.esc(t.phon)+'</div>'
            + '<button class="speak sm" data-spk="'+EL.engine.esc(t.en)+'" title="听发音">🔊</button></div>'
            + '<div class="term-zh">'+EL.engine.esc(t.zh)+'</div>'
            + '<div class="term-block"><span class="tb-label">示例</span>'
            + '<button class="speak sm" data-spk="'+EL.engine.esc(t.example)+'" title="听示例">🔊</button>'
            + '<span class="term-ex">'+EL.engine.esc(t.example)+'</span></div>'
            + '<div class="term-block"><span class="tb-label">说明</span><span class="term-ex">'+EL.engine.esc(t.explain)+'</span></div>'
            + '<div class="term-block term-edge"><span class="tb-label">⚠ 边界 / 易错</span><span class="term-ex">'+EL.engine.esc(t.edge)+'</span></div>'
            + '</div>';
        });
        html += '</div></div>';
      });
      if(!shown) html += '<div class="note">没有匹配的术语，换个关键词试试。</div>';

      container.innerHTML = html;
      bind();
    }

    function bind(){
      EL.engine.$all("[data-spk]", container).forEach(function(b){ b.onclick=function(){ EL.engine.speak(b.getAttribute("data-spk")); }; });
      EL.engine.$all("[data-cat]", container).forEach(function(b){
        b.onclick = function(){ state.cat = b.getAttribute("data-cat"); frame(); };
      });
      var q = EL.engine.$("#q9", container);
      if(q){
        EL.engine.$("#q9go", container).onclick = function(){ state.q = q.value.trim(); frame(); };
        q.addEventListener("keydown", function(e){ if(e.key==="Enter"){ state.q = q.value.trim(); frame(); } });
        q.addEventListener("input", function(){ state.q = q.value.trim(); });
      }
      EL.engine.$all("[data-play-cat]", container).forEach(function(b){
        b.onclick = function(){
          var cat = b.getAttribute("data-play-cat");
          var lines = TERMS.filter(function(t){return t.cat===cat;}).map(function(t){return t.example;});
          lines.forEach(function(s,i){ setTimeout(function(){ EL.engine.speak(s); }, i*2200); });
        };
      });
    }
    frame();
  }
  window.EL.m9 = { render:render };
})();
