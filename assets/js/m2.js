/* ===== m2.js · 模块二 复习计划生成 ===== */
(function(){
  window.EL = window.EL || {};
  var EXAM_TYPES = ["考研英语","四六级","雅思","学位英语"];
  var SKILLS = ["词汇","语法","听力","口语","写作","阅读"];
  var TARGET = {考研英语:72,四六级:70,雅思:75,学位英语:65};

  function defaultDiag(){
    return {vocab:3500, skills:{词汇:3,语法:3,听力:3,口语:3,写作:3,阅读:3}, exam:"考研英语", target:72, dailyMin:60};
  }

  function render(container){
    var state = {tab:"diag"};
    var plans = EL.store.collection(EL.store.keys.plans);
    function frame(){
      var html = '<div class="row" style="margin-bottom:6px">'
        + '<button class="btn sm '+(state.tab==="diag"?"":"ghost")+'" data-tab="diag">① 水平诊断</button>'
        + '<button class="btn sm '+(state.tab==="plan"?"":"ghost")+'" data-tab="plan">② 计划生成</button>'
        + '<button class="btn sm '+(state.tab==="adj"?"":"ghost")+'" data-tab="adj">③ 动态调整</button>'
        + '<span class="spacer"></span><span class="chip">已存计划 '+plans.all().length+'</span></div>';
      if(state.tab==="diag") html += viewDiag();
      else if(state.tab==="plan") html += viewPlan();
      else html += viewAdj();
      container.innerHTML = html; bind();
    }

    /* 2.1 诊断 */
    function viewDiag(){
      var d = defaultDiag();
      var sliders = SKILLS.map(function(s){
        return '<div style="margin:6px 0"><label class="tiny">'+s+' 自评</label><div class="row">'
          + [1,2,3,4,5].map(function(v){return '<label class="chip"><input type="radio" name="sk_'+s+'" value="'+v+'" '+(v===d.skills[s]?"checked":"")+' style="width:auto;margin-right:3px">'+v+'</label>';}).join("")
          + '</div></div>';
      }).join("");
      return '<div class="card"><h3>① 学习者水平诊断 <span class="tag">提示词 2.1</span></h3>'
        + '<div class="note">判断保守、信息不足处标注「待确认」；本模块不做医疗/心理建议。基于自评推断水平与薄弱项。</div>'
        + '<div class="grid grid-2">'
        + '<div><label class="fld">词汇量（词）</label><input type="number" id="dVocab" value="'+d.vocab+'" min="500" max="20000" step="500">'
        + '<label class="fld">目标考试</label><select id="dExam">'+EXAM_TYPES.map(function(e){return '<option '+(e===d.exam?"selected":"")+'>'+e+'</option>';}).join("")+'</select>'
        + '<label class="fld">每日可用时长（分钟）</label><input type="number" id="dMin" value="'+d.dailyMin+'" min="10" max="600"></div>'
        + '<div><label class="fld">六项能力自评（1 弱 → 5 强）</label>'+sliders+'</div></div>'
        + '<div class="row" style="margin-top:14px"><button class="btn" id="dRun">📊 生成诊断报告</button></div>'
        + '<div id="dOut"></div></div>';
    }

    function runDiag(){
      var vocab=+EL.engine.$("#dVocab", container).value||3500;
      var exam=EL.engine.$("#dExam", container).value;
      var dailyMin=+EL.engine.$("#dMin", container).value||60;
      var skills={}; SKILLS.forEach(function(s){ var el=EL.engine.$('input[name="sk_'+s+'"]:checked', container); skills[s]=el?+el.value:3; });
      // 当前分值映射
      var cur={};
      cur["词汇"]=Math.max(20,Math.min(98, Math.round(vocab/100))); // 3500->35... 修正
      cur["词汇"]=Math.max(25,Math.min(98, Math.round(vocab/120))); // 3500->29-> 用更平滑
      cur["词汇"]=Math.max(25,Math.min(98, Math.round(20+vocab/130))); // 2000->35,3500->47,5000->58,7000->74,10000->97
      SKILLS.slice(1).forEach(function(s){ cur[s]=skills[s]*20; });
      var target=+TARGET[exam];
      var radarCur = SKILLS.map(function(s){return {label:s,value:cur[s]};});
      var radarTgt = SKILLS.map(function(s){return {label:s,value:target};});
      // 强弱项
      var sorted = SKILLS.map(function(s){return {s:s, gap:target-cur[s]};}).sort(function(a,b){return b.gap-a.gap;});
      var weak = sorted.filter(function(x){return x.gap>0;}).slice(0,3);
      var strong = sorted.filter(function(x){return x.gap<=5;}).map(function(x){return x.s;});
      var level = vocab<2000?"基础(A1-A2)":vocab<3500?"初级(A2)":vocab<5000?"中级(B1)":vocab<7000?"中高级(B2)":"高级(C1+)";
      var pending = skills["词汇"]<=1||dailyMin<20 ? ' <span class="chip w">待确认：自评信息偏少，结论仅供参考</span>' : "";
      var html = '<hr class="sep"><div class="grid grid-2"><div><div class="radar-wrap radar">'+EL.engine.radarSVG([{data:radarCur},{data:radarTgt,target:true}])+'</div>'
        + '<div class="tiny muted" style="text-align:center">蓝=当前 绿虚线=目标('+target+')</div></div>'
        + '<div><h4 style="margin-top:0">诊断结论</h4>'
        + '<div class="note ok"><div class="nt-title">大致水平：'+level+'</div>词汇量约 '+vocab+' 词；目标 '+exam+'（单项建议 '+target+' 分）。'+pending+'</div>'
        + '<div class="note warn"><div class="nt-title">薄弱项优先补强</div>'+weak.map(function(x){return x.s+'（缺口 '+x.gap+' 分）';}).join("、")+'</div>'
        + (strong.length?'<div class="note"><div class="nt-title">相对优势</div>'+strong.join("、")+'</div>':'')
        + '<div class="note">每日可用 '+dailyMin+' 分钟，建议以薄弱项为主分配任务。</div></div></div>'
        + '<div class="row" style="margin-top:10px"><button class="btn accent" id="dToPlan">下一步：生成计划 →</button></div>';
      EL.engine.$("#dOut", container).innerHTML=html;
      EL.engine.$("#dToPlan", container).onclick=function(){
        EL.store.set("diag", {vocab:vocab, exam:exam, dailyMin:dailyMin, skills:skills, level:level, target:target, cur:cur, weak:weak.map(function(x){return x.s;})});
        state.tab="plan"; frame();
      };
    }

    /* 2.2 计划生成 */
    function viewPlan(){
      var diag = EL.store.get("diag");
      if(!diag){ return '<div class="card"><div class="note warn">请先在「① 水平诊断」生成诊断结论，再生成计划。</div><button class="btn" id="toDiag">去诊断</button></div>'; }
      var today = new Date();
      var defDate = new Date(today); defDate.setDate(defDate.getDate()+90);
      var iso = defDate.toISOString().slice(0,10);
      return '<div class="card"><h3>② 复习计划生成 <span class="tag">提示词 2.2 · 艾宾浩斯</span></h3>'
        + '<div class="note">基于艾宾浩斯遗忘曲线（间隔 '+EL.engine.EB_INTERVALS.join("/")+' 天）倒推考试日期，分 基础/强化/冲刺 三阶段安排复习节点。</div>'
        + '<div class="grid grid-2">'
        + '<div><label class="fld">考试日期</label><input type="date" id="pDate" value="'+iso+'"></div>'
        + '<div><label class="fld">每日学习时段</label><select id="pSlot"><option>早晨 06:30-07:30</option><option>午间 12:30-13:10</option><option>晚间 20:00-21:30</option><option>碎片 通勤/午休</option></select></div></div>'
        + '<div class="note">诊断快照：'+diag.level+' ｜ 目标 '+diag.exam+' ｜ 每日 '+diag.dailyMin+' 分 ｜ 薄弱项：'+(diag.weak||[]).join("、")+'</div>'
        + '<div class="row"><button class="btn" id="pGen">🗓️ 生成个性化计划</button></div>'
        + '<div id="pOut"></div></div>';
    }

    function genPlan(){
      var diag = EL.store.get("diag");
      var examDate = EL.engine.$("#pDate", container).value;
      if(!examDate){ EL.engine.toast("请选择考试日期","warn"); return; }
      var slot = EL.engine.$("#pSlot", container).value;
      var today = new Date(); today.setHours(0,0,0,0);
      var ed = new Date(examDate); var days = Math.round((ed-today)/86400000);
      if(days<3){ EL.engine.toast("距考试不足 3 天，请重选日期","warn"); return; }
      // 阶段划分
      var p1,p2,p3;
      if(days>120){ p1=Math.round(days*0.4);p2=Math.round(days*0.4);p3=days-p1-p2; }
      else if(days>45){ p1=Math.round(days*0.35);p2=Math.round(days*0.45);p3=days-p1-p2; }
      else { p1=Math.round(days*0.25);p2=Math.round(days*0.4);p3=days-p1-p2; }
      p1=Math.max(7,p1);p3=Math.max(7,p3);
      var phases=[
        {name:"基础阶段",days:p1,focus:"词汇积累 + 语法体系搭建",color:"var(--brand)"},
        {name:"强化阶段",days:p2,focus:"专项突破 + 真题训练（重点补薄弱项）",color:"var(--accent)"},
        {name:"冲刺阶段",days:p3,focus:"模考 + 查漏 + 作文/口语模板固化",color:"var(--warn)"}
      ];
      // 周计划
      var weeks=[]; var cursor=new Date(today); var wi=0;
      while(cursor<=ed){
        var weekEnd=new Date(cursor); weekEnd.setDate(weekEnd.getDate()+6);
        if(weekEnd>ed) weekEnd=new Date(ed);
        var dayFromStart=Math.round((cursor-today)/86400000);
        var phase = dayFromStart<p1?phases[0]:(dayFromStart<p1+p2?phases[1]:phases[2]);
        var tasks=[];
        if(phase.name==="基础阶段"){
          tasks.push("新学词汇 "+Math.max(15,Math.round(diag.vocab/200))+" 词（"+ (diag.weak.indexOf("词汇")>=0?"重点":"常规") +"）");
          tasks.push("语法点 2 个（"+ (diag.weak.indexOf("语法")>=0?"薄弱项优先":"体系化") +"）");
        } else if(phase.name==="强化阶段"){
          tasks.push("真题/专项 1 套，错题归因");
          tasks.push("薄弱项 "+(diag.weak[0]||"阅读")+" 强化训练 30 分钟");
        } else {
          tasks.push("全真模考 1 套（限时）");
          tasks.push("作文/口语模板背诵 + 查漏");
        }
        // 复习节点（每周日 + 艾宾浩斯提示）
        var review = (cursor.getDay()===0) || (dayFromStart===p1-1) || (dayFromStart===p1+p2-1);
        if(review) tasks.push("★ 复习节点：按遗忘曲线回看本周新学内容");
        weeks.push({label:"第"+(wi+1)+"周", start:new Date(cursor), end:new Date(weekEnd), phase:phase.name, tasks:tasks, review:review});
        cursor.setDate(cursor.getDate()+7);
        if(cursor>today && weeks.length>200) break;
        wi++;
      }
      var plan={id:EL.engine.uid("plan"), diagnosis:diag, examDate:examDate, slot:slot, phases:phases, weeks:weeks, createdAt:Date.now()};
      plans.add(plan); EL.store.set("activePlan", plan.id);
      renderPlanOut(plan);
    }

    function renderPlanOut(plan){
      var totalTasks = plan.weeks.reduce(function(a,w){return a+w.tasks.length;},0);
      var reviewWeeks = plan.weeks.filter(function(w){return w.review;}).length;
      var html='<hr class="sep"><h4>阶段总览</h4><table class="tbl"><tr><th>阶段</th><th>天数</th><th>核心任务</th></tr>';
      plan.phases.forEach(function(p){ html+='<tr><td>'+p.name+'</td><td>'+p.days+' 天</td><td>'+p.focus+'</td></tr>'; });
      html+='</table><div class="row" style="margin-top:10px"><div class="stat"><div class="num">'+plan.weeks.length+'</div><div class="lab">周计划</div></div>'
        + '<div class="stat"><div class="num">'+reviewWeeks+'</div><div class="lab">复习节点周</div></div>'
        + '<div class="stat"><div class="num">'+totalTasks+'</div><div class="lab">任务总数</div></div>'
        + '<div class="stat"><div class="num">'+plan.examDate.slice(5)+'</div><div class="lab">考试日期</div></div></div>';
      html+='<h4 style="margin-top:16px">每周计划（含复习节点标注）</h4><div class="week">';
      plan.weeks.forEach(function(w){
        html+='<div class="day'+(w.review?" review":"")+'"><div class="dow">'+w.label+'</div>';
        w.tasks.forEach(function(t){ if(t.indexOf("★")===0) html+='<div class="rflag">'+t+'</div>'; else html+='<div class="dtask">· '+t+'</div>'; });
        html+='</div>';
      });
      html+='</div><div class="note ok" style="margin-top:12px">计划已保存。可在「③ 动态调整」按完成率/正确率回灌数据，自动重排。</div>';
      EL.engine.$("#pOut", container).innerHTML=html;
    }

    /* 2.3 动态调整 */
    function viewAdj(){
      var plans = EL.store.collection(EL.store.keys.plans);
      var list = plans.all();
      if(!list.length) return '<div class="card"><div class="note warn">暂无已生成计划。请先到「② 计划生成」生成计划。</div></div>';
      var active = EL.store.get("activePlan") || list[0].id;
      var opts = list.map(function(p){return '<option value="'+p.id+'" '+(p.id===active?"selected":"")+'>'+p.examDate+' 计划（'+p.weeks.length+'周）</option>';}).join("");
      return '<div class="card"><h3>③ 复习计划动态调整 <span class="tag">提示词 2.3</span></h3>'
        + '<div class="note">按实际完成率/正确率回灌，识别落后或超前并自动重排；重大调整需你确认，不删必考核心。</div>'
        + '<div class="grid grid-2"><div><label class="fld">选择计划</label><select id="aPlan">'+opts+'</select></div>'
        + '<div><label class="fld">学习者反馈（可选）</label><input type="text" id="aFb" placeholder="如：语法太难、时间不够"></div></div>'
        + '<div class="grid grid-2" style="margin-top:10px">'
        + '<div><label class="fld">原计划完成率 %</label><input type="number" id="aComp" value="70" min="0" max="150"></div>'
        + '<div><label class="fld">平均正确率（0-10）</label><input type="number" id="aAcc" value="6" min="0" max="10" step="0.5"></div></div>'
        + '<div class="row" style="margin-top:12px"><button class="btn" id="aRun">🔁 分析并调整</button></div>'
        + '<div id="aOut"></div></div>';
    }

    function runAdj(){
      var id=EL.engine.$("#aPlan", container).value;
      var plan = plans.get(id); if(!plan) return;
      var comp=+EL.engine.$("#aComp", container).value||70;
      var acc=+EL.engine.$("#aAcc", container).value||6;
      var fb=EL.engine.$("#aFb", container).value.trim();
      var behind = (comp<80 || acc<6);
      var ahead = (comp>110 && acc>8.5);
      var status = behind?"落后":ahead?"超前":"正常";
      // 调整策略
      var newWeeks = plan.weeks.map(function(w){
        var nw={phase:w.phase, tasks:w.tasks.slice(), review:w.review};
        if(behind){ nw.tasks = nw.tasks.filter(function(t){return t.indexOf("模考")===-1;}); nw.tasks.push("追加 20 分钟巩固/复习（降速保质量）"); nw.review=true; }
        else if(ahead){ nw.tasks.push("提速：新增挑战任务（拓展阅读/口语输出）"); nw.tasks = nw.tasks.filter(function(t){return t.indexOf("巩固")===-1;}); }
        return nw;
      });
      var reason = behind
        ? "完成率 "+comp+"% / 正确率 "+acc+" 低于阈值，判定落后：减少新内容、增加复习比重，确保必考核心不丢。"
        : ahead ? "完成率 "+comp+"% / 正确率 "+acc+" 高于预期，判定超前：提前进入更高强度，增加挑战任务。"
        : "数据在合理区间，维持原计划节奏。";
      if(behind && fb.indexOf("时间")>=0) reason += " 反馈提及时间不足，已进一步下调每日新学量。";
      var html='<hr class="sep"><div class="note '+(behind?"warn":ahead?"ok":"")+'"><div class="nt-title">调整结论：'+status+'</div>'+reason+'</div>';
      if(behind) html+='<div class="note danger">⚠ 重大调整：已增加复习比重并压缩新学。如确认应用请点下方按钮（必考核心已保留）。</div>';
      html+='<div class="grid grid-2"><div><h4>调整前（片段）</h4>'+weekSnippet(plan.weeks.slice(0,3))+'</div>'
        + '<div><h4>调整后（片段）</h4>'+weekSnippet(newWeeks.slice(0,3))+'</div></div>';
      if(behind) html+='<div class="row" style="margin-top:10px"><button class="btn danger" id="aApply">✓ 确认应用调整</button></div>';
      EL.engine.$("#aOut", container).innerHTML=html;
      if(behind){ EL.engine.$("#aApply", container).onclick=function(){
        var p=plans.get(id); p.weeks=newWeeks; p.adjustedAt=Date.now(); plans.update(id,p);
        EL.store.set("activePlan", id); EL.engine.toast("计划已应用调整","ok");
        state.tab="plan"; frame();
      }; }
    }
    function weekSnippet(arr){
      return '<div class="note" style="white-space:normal">'+arr.map(function(w){return '<b>'+w.label+'</b>：'+w.tasks.join("；");}).join('<br>')+'</div>';
    }

    function bind(){
      EL.engine.$all("[data-tab]", container).forEach(function(b){ b.onclick=function(){ state.tab=b.getAttribute("data-tab"); frame(); }; });
      var toDiag=EL.engine.$("#toDiag", container); if(toDiag) toDiag.onclick=function(){ state.tab="diag"; frame(); };
      var dRun=EL.engine.$("#dRun", container); if(dRun) dRun.onclick=runDiag;
      var pGen=EL.engine.$("#pGen", container); if(pGen) pGen.onclick=genPlan;
      var aRun=EL.engine.$("#aRun", container); if(aRun) aRun.onclick=runAdj;
    }
    frame();
  }
  window.EL.m2 = { render:render, _gotoDiag:function(){ /* 占位，诊断页由 app 重置 */ } };
})();
