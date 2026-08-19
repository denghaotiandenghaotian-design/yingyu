/* ===== m8.js · 模块八 单词与句子总库（统一归纳 + 一键 PDF/打印） ===== */
(function(){
  window.EL = window.EL || {};

  function render(container){
    var bank = EL.engine.buildWordBank();
    var sources = ["全部"].concat(Array.from(new Set(bank.map(function(b){return b.source;}))));
    var state = {q:"", src:"全部"};

    function filtered(){
      var q = state.q.toLowerCase();
      return bank.filter(function(b){
        if(state.src!=="全部" && b.source!==state.src) return false;
        if(!q) return true;
        return b.text.toLowerCase().indexOf(q)>=0 || b.zh.toLowerCase().indexOf(q)>=0;
      });
    }

    function frame(){
      var rows = filtered();
      var html = '<div class="daily-head"><div class="tag">统一词库 · 可复用</div>'
        + '<h2 style="margin:0;font-size:19px">📒 单词与句子总库</h2></div>';
      html += '<div class="note">本库自动归纳全部模块涉及的单词与句子（每日一练 / 自然拼读 / 背诵材料库 / 900句 / 口语 / 听力 / 专业术语 / 阶梯对话），每条附中文释义与来源，结构清晰、数据可复用。支持搜索、按来源筛选，并可一键生成 PDF 或打印。</div>';

      html += '<div class="bank-toolbar">'
        + '<input type="text" id="q8" placeholder="搜索英文或中文释义" value="'+EL.engine.esc(state.q)+'" style="max-width:300px">'
        + '<button class="btn sm" id="q8go">搜索</button>'
        + '<span class="spacer"></span>'
        + '<button class="btn accent" id="pdfBtn">🖨️ 生成 PDF / 打印</button></div>';

      html += '<div class="catbar" id="src8">';
      sources.forEach(function(s){
        var cnt = s==="全部"? bank.length : bank.filter(function(b){return b.source===s;}).length;
        html += '<span class="cat'+(s===state.src?" active":"")+'" data-src="'+EL.engine.esc(s)+'">'+EL.engine.esc(s)+' · '+cnt+'</span>';
      });
      html += '</div>';

      if(!rows.length){ html += '<div class="note">没有匹配的内容，换个关键词或来源试试。</div>'; }
      else {
        var grouped = {};
        rows.forEach(function(r){ (grouped[r.source]=grouped[r.source]||[]).push(r); });
        Object.keys(grouped).forEach(function(src){
          html += '<div class="card"><div class="lc-head"><span class="lv lv-basic">'+EL.engine.esc(src)+'</span>'
            + '<h3 style="margin:0;font-size:15px">'+EL.engine.esc(src)+'（'+grouped[src].length+' 条）</h3>'
            + '<span class="spacer"></span><button class="btn sm ghost" data-play-src="'+EL.engine.esc(src)+'">🔊 朗读本组</button></div>';
          html += '<table class="tbl"><tr><th>英文 / 句子</th><th>中文释义</th><th>类型</th><th>🔊</th></tr>';
          grouped[src].forEach(function(r){
            html += '<tr><td>'+EL.engine.esc(r.text)+'</td><td>'+EL.engine.esc(r.zh)+'</td><td>'+EL.engine.esc(r.type)+'</td>'
              + '<td><button class="speak sm" data-spk="'+EL.engine.esc(r.text)+'">🔊</button></td></tr>';
          });
          html += '</table></div>';
        });
      }

      container.innerHTML = html;
      bind();
    }

    function bind(){
      EL.engine.$all("[data-spk]", container).forEach(function(b){ b.onclick=function(){ EL.engine.speak(b.getAttribute("data-spk")); }; });
      EL.engine.$all("[data-src]", container).forEach(function(b){
        b.onclick = function(){ state.src = b.getAttribute("data-src"); frame(); };
      });
      var q = EL.engine.$("#q8", container);
      if(q){
        EL.engine.$("#q8go", container).onclick = function(){ state.q = q.value.trim(); frame(); };
        q.addEventListener("keydown", function(e){ if(e.key==="Enter"){ state.q = q.value.trim(); frame(); } });
      }
      EL.engine.$all("[data-play-src]", container).forEach(function(b){
        b.onclick = function(){
          var src = b.getAttribute("data-play-src");
          var lines = bank.filter(function(x){return x.source===src;}).map(function(x){return x.text;});
          lines.forEach(function(s,i){ setTimeout(function(){ EL.engine.speak(s); }, i*1400); });
        };
      });
      var pdf = EL.engine.$("#pdfBtn", container);
      if(pdf) pdf.onclick = function(){ doPrint(filtered()); };
    }

    function doPrint(rows){
      var grouped = {};
      rows.forEach(function(r){ (grouped[r.source]=grouped[r.source]||[]).push(r); });
      var html = '<div class="pb-h1">成人英语 · 单词与句子总库</div>'
        + '<div class="pb-sub">生成时间：'+new Date().toLocaleString()+' ｜ 共 '+rows.length+' 条 ｜ 来源：'
        + (Object.keys(grouped).join("、")||"—")+'</div>';
      Object.keys(grouped).forEach(function(src){
        html += '<div class="pb-group"><h2>'+EL.engine.esc(src)+'（'+grouped[src].length+'）</h2>'
          + '<table><tr><th>英文 / 句子</th><th>中文释义</th><th>类型</th></tr>';
        grouped[src].forEach(function(r){
          html += '<tr><td>'+EL.engine.esc(r.text)+'</td><td>'+EL.engine.esc(r.zh)+'</td><td>'+EL.engine.esc(r.type)+'</td></tr>';
        });
        html += '</table></div>';
      });
      html += '<div class="pb-foot">本表由「成人英语学习辅助系统」一键生成 · 仅供学习使用</div>';
      var pa = document.getElementById("printArea");
      if(!pa){ EL.engine.toast("打印区缺失","warn"); return; }
      pa.innerHTML = html;
      document.body.classList.add("printing");
      window.print();
    }

    // afterprint 仅清理一次（避免重复绑定）
    if(!window.__bankAfterPrint){
      window.__bankAfterPrint = true;
      window.addEventListener("afterprint", function(){
        var pa = document.getElementById("printArea");
        if(pa) pa.innerHTML = "";
        document.body.classList.remove("printing");
      });
    }

    frame();
  }
  window.EL.m8 = { render:render };
})();
