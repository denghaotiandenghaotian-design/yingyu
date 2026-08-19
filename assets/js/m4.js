/* ===== m4.js · 模块四 背诵打卡材料库（整合零基础资料 + 打卡） ===== */
(function(){
  window.EL = window.EL || {};
  var items = EL.store.collection(EL.store.keys.reciteItems);
  var logs = EL.store.collection(EL.store.keys.reciteLogs);

  function enOnly(text){
    return (String(text||"").match(/[A-Za-z][A-Za-z\s',.!?\-]*/g)||[]).join(" ").trim();
  }
  function seedLib(){
    if(items.all().length) return;
    EL.engine.ZERO_BASIS.forEach(function(m){
      items.add({cat:m.cat, title:m.title, zh:m.zh, body:m.body,
        content:(m.title+"｜"+m.body), mastery:0, round:0, lastStudied:null, checks:[]});
    });
  }

  function render(container){
    seedLib();
    var state = {tab:"lib", cat:"全部"};

    function frame(){
      var cats = ["全部"].concat(Array.prototype.slice.call(new Set(items.all().map(function(it){return it.cat;}))));
      var html = '<div class="row" style="margin-bottom:6px">'
        + '<button class="btn sm '+(state.tab==="lib"?"":"ghost")+'" data-tab="lib">📚 资料库</button>'
        + '<button class="btn sm '+(state.tab==="task"?"":"ghost")+'" data-tab="task">① 今日背诵</button>'
        + '<button class="btn sm '+(state.tab==="check"?"":"ghost")+'" data-tab="check">② 效果检测</button>'
        + '<span class="spacer"></span><span class="chip">材料 '+items.all().length+'</span><span class="chip">打卡 '+logs.all().length+' 次</span></div>';
      html += state.tab==="lib"? viewLib(cats) : state.tab==="task"? viewTask() : viewCheck();
      container.innerHTML = html; bind();
    }

    /* 资料库：分类浏览 + 听读配套 + 打卡记录 */
    function viewLib(cats){
      var all = items.all().filter(function(it){ return state.cat==="全部" || it.cat===state.cat; });
      var h = '<div class="card"><h3>📚 零基础核心资料库 <span class="tag">提示词 4.x · 提炼整合</span></h3>';
      h += '<div class="note">内容提炼自成人零基础学英语的通用核心资料（问候/数字/购物/问路/餐饮/天气/自我介绍/应急等），已录入本地。每条配 🔊 听力音频与跟读文本，可一键打卡。你也能在「材料库」自行补充。</div>';
      h += '<div class="catbar">';
      cats.forEach(function(c){ h += '<span class="cat '+(c===state.cat?"active":"")+'" data-cat="'+EL.engine.esc(c)+'">'+EL.engine.esc(c)+'</span>'; });
      h += '</div>';
      if(!all.length) h += '<div class="note warn">该分类暂无材料。</div>';
      all.forEach(function(it){
        var checked = (it.checks||[]).length;
        h += '<div class="mat-card">'
          + '<button class="speak" data-spk="'+EL.engine.esc(enOnly(it.body))+'" title="听发音">🔊</button>'
          + '<div class="mat-main"><div class="mat-title">'+EL.engine.esc(it.title)+' <span class="muted tiny">· '+EL.engine.esc(it.cat)+'</span></div>'
          + '<div class="mat-zh">'+EL.engine.esc(it.zh)+'</div>'
          + '<div class="mat-body">'+EL.engine.esc(it.body)+'</div>'
          + '<div class="row" style="margin-top:8px">'
          + '<button class="btn sm '+(checked?'ghost':'accent')+'" data-check="'+it.id+'">'+(checked?'✅ 已打卡 '+checked+' 次':'✓ 打卡背诵')+'</button>'
          + '<span class="muted tiny">跟读上方英文，读熟即打卡</span></div></div></div>';
      });
      h += '</div>';
      return h;
    }
    function doCheck(id){
      var it = items.get(id); if(!it) return;
      var today = EL.engine.todayKey();
      var checks = it.checks || [];
      if(checks.indexOf(today)===-1){ checks.push(today); }
      items.update(id, {checks:checks, mastery:Math.min(5,(it.mastery||0)+1), lastStudied:new Date().toISOString(), round:(it.round||0)+1});
      logs.add({itemId:id, content:it.title, at:new Date().toISOString()});
      EL.engine.toast("已打卡，掌握度+1","ok");
      frame();
    }

    /* 今日背诵：间隔重复 */
    function viewTask(){
      var all = items.all();
      var due = all.filter(function(it){ return EL.engine.isDue(it.lastStudied, it.round||0); });
      var h = '<div class="card"><h3>① 今日背诵任务 <span class="tag">提示词 4.1 · 间隔重复</span></h3>';
      h += '<div class="note">按遗忘曲线安排复习：优先复习到期内容，再安排新学。点 🔊 听、大声跟读，记住后点「✓ 记住」。</div>';
      if(!due.length){ h += '<div class="note ok">暂无到期项，状态良好；可去「资料库」自行打卡学习。</div>'; return h+'</div>'; }
      h += '<div class="list-item" style="display:block">';
      due.forEach(function(it){
        h += '<div class="mat-card"><button class="speak" data-spk="'+EL.engine.esc(enOnly(it.body))+'" title="听发音">🔊</button>'
          + '<div class="mat-main"><div class="mat-title">'+EL.engine.esc(it.title)+'</div>'
          + '<div class="mat-body">'+EL.engine.esc(it.body)+'</div>'
          + '<div class="row" style="margin-top:8px"><button class="btn sm accent" data-master="'+it.id+'">✓ 记住</button>'
          + '<button class="btn sm ghost" data-fuzzy="'+it.id+'">？ 模糊</button></div></div></div>';
      });
      h += '</div></div>';
      return h;
    }
    function mark(id, ok){
      var it = items.get(id); if(!it) return;
      var today = new Date().toISOString();
      items.update(id, {mastery:Math.max(0,Math.min(5,(it.mastery||0)+(ok?1:-1))), lastStudied:today, round:(it.round||0)+(ok?1:0)});
      logs.add({itemId:id, content:it.title, ok:ok, at:today});
      EL.engine.toast(ok?"已记住，掌握度+1":"已标记模糊","ok");
      frame();
    }

    /* 效果检测 */
    function viewCheck(){
      var all = items.all();
      var h = '<div class="card"><h3>② 背诵效果检测 <span class="tag">提示词 4.2</span></h3>';
      h += '<div class="note">逐行比对原文与你的默写，标记遗漏/多余并给出强化建议。鼓励式反馈。</div>';
      h += '<div class="grid grid-2"><div><label class="fld">原文（每行一条英文）</label><textarea id="orig" rows="7" placeholder="Hi, how are you?\nI would like a cup of coffee."></textarea></div>'
        + '<div><label class="fld">你的默写</label><textarea id="mine" rows="7" placeholder="Hi how are you\nI would like a cup of coffee"></textarea></div></div>';
      if(all.length) h += '<div class="row" style="margin-top:10px"><button class="btn" id="useLib">用资料库内容检测</button></div>';
      h += '<div class="row" style="margin-top:10px"><button class="btn" id="runCheck">🔎 开始检测</button></div><div id="checkOut"></div></div>';
      return h;
    }
    function runCheck(){
      var orig = EL.engine.$("#orig", container).value;
      if(!orig.trim()){ EL.engine.toast("请填写原文","warn"); return; }
      var r = EL.engine.diffRecite(orig, EL.engine.$("#mine", container).value);
      var h = '<hr class="sep"><div class="stat" style="display:inline-block;min-width:140px"><div class="num">'+r.rate+'%</div><div class="lab">掌握率（'+r.correct+'/'+r.total+'）</div></div>';
      h += '<table class="tbl" style="margin-top:12px"><tr><th>行</th><th>状态</th><th>类型</th><th>原文</th><th>你的</th></tr>';
      r.results.forEach(function(x){
        var color = x.status==="对"?"g":x.status==="偏"?"w":"d";
        h += '<tr><td>'+x.idx+'</td><td><span class="chip '+color+'">'+x.status+'</span></td><td>'+EL.engine.esc(x.type||"")+'</td><td>'+EL.engine.esc(x.original)+'</td><td>'+EL.engine.esc(x.user)+'</td></tr>';
      });
      h += '</table>';
      var miss={}; r.results.forEach(function(x){ (x.miss||[]).forEach(function(w){ miss[w]=(miss[w]||0)+1; }); });
      var tips = Object.keys(miss);
      if(r.rate>=90) h += '<div class="note ok"><div class="nt-title">表现很棒！</div>准确率 '+r.rate+'%，继续保持间隔复习。</div>';
      else if(tips.length) h += '<div class="note warn"><div class="nt-title">强化建议</div>以下词多次出错，建议加入「资料库」重点复习：'+tips.slice(0,8).map(function(w){return EL.engine.esc(w);}).join("、")+'。</div>';
      else h += '<div class="note"><div class="nt-title">继续加油</div>掌握率 '+r.rate+'%，注意遗漏与多余内容。</div>';
      EL.engine.$("#checkOut", container).innerHTML = h;
    }

    function bind(){
      EL.engine.$all("[data-tab]", container).forEach(function(b){ b.onclick=function(){ state.tab=b.getAttribute("data-tab"); frame(); }; });
      EL.engine.$all("[data-cat]", container).forEach(function(b){ b.onclick=function(){ state.cat=b.getAttribute("data-cat"); frame(); }; });
      EL.engine.$all("[data-spk]", container).forEach(function(b){ b.onclick=function(){ EL.engine.speak(b.getAttribute("data-spk")); }; });
      EL.engine.$all("[data-check]", container).forEach(function(b){ b.onclick=function(){ doCheck(b.getAttribute("data-check")); }; });
      EL.engine.$all("[data-master]", container).forEach(function(b){ b.onclick=function(){ mark(b.getAttribute("data-master"), true); }; });
      EL.engine.$all("[data-fuzzy]", container).forEach(function(b){ b.onclick=function(){ mark(b.getAttribute("data-fuzzy"), false); }; });
      var ul = EL.engine.$("#useLib", container); if(ul) ul.onclick=function(){ EL.engine.$("#orig", container).value=items.all().map(function(it){return enOnly(it.body);}).join("\n"); EL.engine.$("#mine", container).value=""; EL.engine.toast("已载入资料库英文，请在右侧填默写","ok"); };
      var rc = EL.engine.$("#runCheck", container); if(rc) rc.onclick=runCheck;
    }

    frame();
  }
  window.EL.m4 = { render:render };
})();
