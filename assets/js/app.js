/* ===== app.js · 引导与路由 ===== */
(function(){
  window.EL = window.EL || {};

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    // 注入种子数据（首次）
    if(EL.seed) EL.seed();

    // 主题
    var savedTheme = localStorage.getItem("el_theme");
    if(savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

    var view = document.getElementById("view");
    var topTitle = document.getElementById("topTitle");
    var topMeta = document.getElementById("topMeta");

    var MODULES = {
      home:{title:"总览", render:renderHome},
      m1:{title:"每日一练", render:function(c){ EL.m1.render(c); }},
      m2:{title:"复习计划生成", render:function(c){ EL.m2.render(c); }},
      m3:{title:"自然拼读", render:function(c){ EL.m3.render(c); }},
      m4:{title:"背诵打卡材料库", render:function(c){ EL.m4.render(c); }},
      m5:{title:"口语练习", render:function(c){ EL.m5.render(c); }},
      m6:{title:"听力训练", render:function(c){ EL.m6.render(c); }},
      m7:{title:"900句玩转英语", render:function(c){ EL.m7.render(c); }},
      m8:{title:"单词与句子总库", render:function(c){ EL.m8.render(c); }},
      m9:{title:"专业术语库", render:function(c){ EL.m9.render(c); }},
      m10:{title:"阶梯情景对话", render:function(c){ EL.m10.render(c); }}
    };

    function go(viewName){
      var m = MODULES[viewName] || MODULES.home;
      topTitle.textContent = m.title;
      EL.app.current = viewName;
      view.scrollTop = 0;
      if(viewName==="home") m.render(view);
      else m.render(view);
      updateMeta();
      // 高亮导航
      EL.engine.$all(".nav-item").forEach(function(b){ b.classList.toggle("active", b.getAttribute("data-view")===viewName); });
      document.getElementById("sidebar").classList.remove("open");
    }

    function updateMeta(){
      var mats = EL.store.collection(EL.store.keys.reciteItems).all().length;
      var plans = EL.store.collection(EL.store.keys.plans).all().length;
      var oral = EL.store.collection(EL.store.keys.oralSessions).all().length;
      var dlg = EL.store.collection(EL.store.keys.dialogueProgress).all().length;
      topMeta.textContent = "资料 "+mats+" · 计划 "+plans+" · 口语 "+oral+" · 对话 "+dlg+" 段";
    }

    // 导航绑定
    EL.engine.$all(".nav-item").forEach(function(b){
      b.addEventListener("click", function(){ go(b.getAttribute("data-view")); });
    });
    document.getElementById("menuBtn").addEventListener("click", function(){
      document.getElementById("sidebar").classList.toggle("open");
    });
    document.getElementById("themeToggle").addEventListener("click", function(){
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur==="dark"?"light":"dark";
      if(next==="light") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("el_theme", next);
    });
    document.getElementById("resetAll").addEventListener("click", function(){
      if(confirm("确认清空全部本地学习数据？此操作不可恢复。")){
        EL.store.clearAll();
        if(EL.seed) EL.seed();
        EL.engine.toast("已清空并重置为示例数据","ok");
        go("home");
      }
    });

    EL.app = { go:go, current:"home", updateMeta:updateMeta };
    go("home");
  }

  /* 首页插画（SVG，颜色经 CSS 类取变量以自动适配浅/深主题） */
  function homeIllust(){
    return '<svg class="ill-svg" viewBox="0 0 320 240" role="img" aria-label="学习旅程插画">'
      + '<defs><linearGradient id="illGrad" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0" class="ill-gs1"/><stop offset="1" class="ill-gs2"/>'
      + '</linearGradient></defs>'
      /* 柔和底影 */
      + '<ellipse class="ill-shadow" cx="160" cy="212" rx="118" ry="16"/>'
      /* 阶梯（3 级，从书本通向气泡） */
      + '<rect class="ill-soft" x="72" y="182" width="66" height="18" rx="9" opacity=".55"/>'
      + '<rect class="ill-brand" x="88" y="162" width="66" height="18" rx="9" opacity=".75"/>'
      + '<rect x="104" y="142" width="66" height="18" rx="9" fill="url(#illGrad)"/>'
      /* 书本 */
      + '<g class="ill-book">'
      + '<rect class="ill-paper" x="118" y="86" width="62" height="52" rx="10"/>'
      + '<path class="ill-line" d="M149 94v36"/>'
      + '<rect class="ill-soft" x="124" y="100" width="19" height="4" rx="2"/>'
      + '<rect class="ill-soft" x="124" y="110" width="19" height="4" rx="2"/>'
      + '<rect class="ill-soft" x="124" y="120" width="19" height="4" rx="2"/>'
      + '<rect class="ill-accent" x="156" y="100" width="18" height="4" rx="2" opacity=".85"/>'
      + '<rect class="ill-accent" x="156" y="110" width="18" height="4" rx="2" opacity=".85"/>'
      /* 琥珀书签 */
      + '<rect class="ill-accent" x="176" y="78" width="10" height="26" rx="4"/>'
      + '</g>'
      /* 耳机 */
      + '<g class="ill-phone">'
      + '<path class="ill-ring" d="M236 132a14 14 0 1 1 28 0"/>'
      + '<rect class="ill-soft" x="222" y="130" width="10" height="30" rx="5"/>'
      + '<rect class="ill-soft" x="268" y="130" width="10" height="30" rx="5"/>'
      + '<path class="ill-band" d="M232 158c6 10 50 10 56 0"/>'
      + '</g>'
      /* 对话气泡 */
      + '<g class="ill-bubble">'
      + '<path class="ill-bub" d="M188 34c26 0 44 12 44 28s-18 28-44 28c-4 0-8-.4-12-1.2l-14 8 2.6-13.2C151.4 78.6 144 71.4 144 62c0-16 18-28 44-28z"/>'
      + '<text class="ill-bub-text" x="188" y="71" text-anchor="middle" font-family="inherit" font-size="17" font-weight="800">Hi!</text>'
      + '</g>'
      /* 星星（琥珀点缀，浮动动画） */
      + '<path class="ill-star s1" d="M60 60l4.2 9.3 10.2 1.2-7.5 7 1.9 10.1L60 82.6l-8.8 5 1.9-10.1-7.5-7 10.2-1.2z"/>'
      + '<path class="ill-star s2" d="M268 90l3 6.6 7.3.9-5.4 5 1.4 7.2-6.3-3.6-6.3 3.6 1.4-7.2-5.4-5 7.3-.9z" opacity=".85"/>'
      + '</svg>';
  }

  /* 学习路径步骤卡 */
  function pathStep(no, ico, title, desc){
    return '<div class="path-step"><div class="step-no">'+no+'</div>'
      + '<div class="step-ico">'+ico+'</div>'
      + '<div class="step-title">'+title+'</div>'
      + '<div class="step-desc">'+desc+'</div></div>';
  }

  /* 首页总览 */
  function renderHome(container){
    var cards = [
      {ico:"🌟", title:"每日一练", desc:"每天10生词+3句型，🔊听读配套", tags:["生动实用","听读配套"], v:"m1"},
      {ico:"🗓️", title:"复习计划生成", desc:"诊断/艾宾浩斯计划/动态调整", tags:["2.1 诊断","2.2 计划","2.3 调整"], v:"m2"},
      {ico:"🔤", title:"自然拼读", desc:"短元音/CVC/字母组合入门", tags:["字母音","跟读"], v:"m3"},
      {ico:"📚", title:"背诵打卡材料库", desc:"零基础核心资料·打卡记录", tags:["提炼整合","打卡"], v:"m4"},
      {ico:"🎤", title:"口语练习", desc:"情景陪练/五维评测纠音", tags:["5.1 陪练","5.2 评测"], v:"m5"},
      {ico:"🎧", title:"听力训练", desc:"分级出题/精听听写·听读配套", tags:["6.1 出题","6.2 听写"], v:"m6"},
      {ico:"💬", title:"900句玩转英语", desc:"12类实用口语+情景对话", tags:["短句","听读配套"], v:"m7"},
      {ico:"📒", title:"单词与句子总库", desc:"全模块归纳·一键PDF", tags:["统一词库","打印"], v:"m8"},
      {ico:"🎓", title:"专业术语库", desc:"职场/金融/科技/学术…含说明与边界", tags:["术语","示例","边界"], v:"m9"},
      {ico:"💬", title:"阶梯情景对话", desc:"每轮3-5回合·L1易→L3难由易到难", tags:["阶梯","陪练","由易到难"], v:"m10"}
    ];

    /* ===== 第一部分 · 图示区域（带文字说明） ===== */
    // ① Hero 主视觉：文案 + 学习旅程插画
    var html = '<div class="hero hero-land">'
      + '<div class="hero-copy">'
      + '<div class="hero-eyebrow"><span class="chip accent">✨ 0 → 1 轻松入门</span><span class="chip">🔒 本地离线</span><span class="chip b">🧩 开箱即用</span></div>'
      + '<h1>成人英语学习辅助系统</h1>'
      + '<p>整合 10 大模块业务逻辑：拼读打底、每日一练、背诵打卡、口语听力、情景对话，由易到难一路进阶。纯前端运行、数据本地保存，打开就能学。</p>'
      + '<div class="hero-cta"><button class="btn" id="heroEnter">🚀 开始学习</button></div>'
      + '</div>'
      + '<div class="hero-ill">' + homeIllust() + '</div>'
      + '</div>';

    // ② 学习路径图（带文字说明的图示）
    html += '<div class="card path-card"><h3>🧭 学习路径 <span class="tiny muted">跟着这四步，从零到开口</span></h3>'
      + '<div class="path-grid">'
      + pathStep(1,"🔤","自然拼读","字母音 & CVC 拼读，先学会「读得出来」")
      + '<div class="path-arrow">→</div>'
      + pathStep(2,"🌟","每日一练","每天 10 生词 + 3 句型，听读配套")
      + '<div class="path-arrow">→</div>'
      + pathStep(3,"🎤","口语听力","情景陪练 + 分级听写，输入输出闭环")
      + '<div class="path-arrow">→</div>'
      + pathStep(4,"💬","情景对话","阶梯 L1→L3，每轮 3–5 回合，开口实战")
      + '</div></div>';

    // ③ 十大模块一览（图标 + 文字说明）
    html += '<h3 class="home-sec">📦 十大模块一览</h3><div class="modcards">';
    cards.forEach(function(c){
      html += '<div class="modcard" data-go="'+c.v+'"><div class="mc-ico">'+c.ico+'</div><div class="mc-title">'+c.title+'</div>'
        + '<div class="mc-desc">'+c.desc+'</div><div class="mc-tags">'+c.tags.map(function(t){return '<span class="chip">'+t+'</span>';}).join("")+'</div></div>';
    });
    html += '</div>';

    /* ===== 第二部分 · 简要使用说明 ===== */
    html += '<div class="card howto-card"><h3>📖 使用说明</h3><ul class="howto">'
      + '<li><b>即开即用</b>：所有数据保存在浏览器本地，无需登录、不上传服务器；分享链接即可使用。</li>'
      + '<li><b>从哪开始</b>：点击页面底部「进入学习」，或从左侧导航 / 上方模块卡进入任意模块。</li>'
      + '<li><b>发音说明</b>：口语 / 听力中标注「需录音」的环节为文本层识别，朗读发音由系统 TTS 提供。</li>'
      + '<li><b>小技巧</b>：右上角可切换浅色 / 深色主题；「清空数据」可随时恢复示例内容。</li>'
      + '</ul></div>';

    /* ===== 页面最底部 · 进入按钮 + 支持作者 ===== */
    html += '<div class="home-enter">'
      + '<div class="enter-card">'
      + '<div class="enter-kicker">READY?</div>'
      + '<div class="enter-title">准备好了吗？</div>'
      + '<div class="enter-sub">每天 15 分钟，比昨天多会一句</div>'
      + '<button class="btn enter-btn" id="enterBtn"><span class="enter-ico">🚀</span> 进入学习 <span class="enter-arrow">→</span></button>'
      + '</div>'
      + '<div class="card hero-qr hero-qr-mini" id="qrCard">'
      + '<div class="hero-qr-head"><span class="chip accent">☕ 支持作者</span></div>'
      + '<div class="hero-qr-body">'
      + '<img src="assets/images/qr-pay.png" alt="微信支付二维码" class="hero-qr-img">'
      + '<div class="hero-qr-note"><b>觉得好用？扫码赞赏一杯咖啡</b>'
      + '<br><span class="muted small">您的支持会持续带来更多学习模块与内容更新。</span></div>'
      + '</div></div>'
      + '</div>';

    container.innerHTML = html;

    // 绑定：两个「进入学习」按钮 → 每日一练（自然起点）；模块卡 → 对应模块
    var heroBtn = container.querySelector("#heroEnter");
    if(heroBtn) heroBtn.addEventListener("click", function(){ EL.app.go("m1"); });
    var enterBtn = container.querySelector("#enterBtn");
    if(enterBtn) enterBtn.addEventListener("click", function(){ EL.app.go("m1"); });
    EL.engine.$all(".modcard", container).forEach(function(b){
      b.addEventListener("click", function(){ EL.app.go(b.getAttribute("data-go")); });
    });
  }
})();
