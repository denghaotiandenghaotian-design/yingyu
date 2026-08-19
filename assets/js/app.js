/* ===== app.js · 引导与路由 ===== */
(function(){
  window.EL = window.EL || {};

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    // 主题（座位模式：经 EL.store 读写，按座位隔离）
    var savedTheme = EL.store.get("theme");
    if(savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

    // ===== 座位门禁：未绑定（或无座位参数）先过门禁 =====
    if(!EL.seat.bound){
      renderGate();
      return;
    }
    bootApp();
  }

  function bootApp(){
    // 注入种子数据（首次，按座位命名空间）
    if(EL.seed) EL.seed();

    var view = document.getElementById("view");
    var topTitle = document.getElementById("topTitle");
    var topMeta = document.getElementById("topMeta");

    // 座位徽标
    var badge = document.getElementById("seatBadge");
    if(badge && EL.seat.id){ badge.textContent = "🪑 座位 " + EL.seat.id; badge.style.display = ""; }

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
      EL.store.set("theme", next);
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

  /* ===== 座位门禁：未绑定 / 无座位参数 / 无效座位 ===== */
  function renderGate(){
    var view = document.getElementById("view");
    var topTitle = document.getElementById("topTitle");
    var topMeta = document.getElementById("topMeta");
    topTitle.textContent = "座位入口";
    topMeta.textContent = "座位模式已开启 · 100 个座位";

    var raw = "";
    try{ raw = (new URLSearchParams(location.search).get("seat") || "").trim().toUpperCase(); }catch(e){}
    var invalid = raw !== "" && !EL.seat.id; // URL 有座位号但不在配置中
    var id = EL.seat.id;
    var esc = function(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };

    var html = '<div class="gate-wrap"><div class="card gate-card">'
      + '<div class="gate-logo">🪑</div>'
      + '<div class="gate-head">' + (invalid ? "⚠️ 座位无效" : (id ? "座位 " + id : "座位入口")) + '</div>'
      + '<div class="gate-sub">' + (invalid
          ? '链接中的座位号「' + esc(raw) + '」不存在，本系统仅有 01–100 号座位。'
          : (id
              ? '首次打开本座位，输入口令完成设备绑定。<br>之后本机免输口令；口令是真正的钥匙，请勿转发。'
              : '请使用老师发放的专属链接，<br>或手动输入座位号（01–100）与口令。'))
      + '</div>'
      + '<div class="gate-form">'
      + (id ? '' : '<div class="gate-field"><label>座位号</label><input type="text" id="gateNo" placeholder="如 03 或 100" maxlength="3" autocomplete="off"></div>')
      + '<div class="gate-field"><label>座位口令</label><input type="password" id="gatePwd" placeholder="请输入本座位口令" autocomplete="off"></div>'
      + '<div class="gate-actions">'
      + '<button class="btn" id="gateEnter">🔓 进入系统</button>'
      + (id ? '<button class="btn ghost" id="gateReset">↺ 换座位</button>' : '')
      + '</div>'
      + '<div class="gate-err" id="gateErr"></div>'
      + '</div>'
      + '<details class="gate-help"><summary>座位模式说明（点击展开）</summary>'
      + '<div class="gate-help-body">' + (window.SEAT_HELP || "").split("\n").map(function(l){ return '<div class="gh-line">' + esc(l) + '</div>'; }).join("") + '</div>'
      + '</details>'
      + '</div></div>';

    view.innerHTML = html;

    function doEnter(){
      var no = id || (document.getElementById("gateNo") ? document.getElementById("gateNo").value.trim().toUpperCase() : "");
      var pwd = document.getElementById("gatePwd").value.trim().toUpperCase();
      var seatObj = null;
      (window.SEATS || []).forEach(function(s){ if(s.id === no) seatObj = s; });
      if(!seatObj){ document.getElementById("gateErr").textContent = "座位号无效（应为 01–100）。"; return; }
      if(pwd !== seatObj.pwd){ document.getElementById("gateErr").textContent = "口令错误，请核对后重试。"; return; }
      // 绑定并进入（更新 EL.seat，后续 store 读写自动切换命名空间）
      window.EL.seat = { id: seatObj.id, pwd: seatObj.pwd, ns: "seat" + seatObj.id + "_", bound: true, isBound: function(){ return true; }, bind: function(){} };
      try{ localStorage.setItem("el_seat" + seatObj.id + "_bound", "1"); }catch(e){}
      var badge = document.getElementById("seatBadge");
      if(badge){ badge.textContent = "🪑 座位 " + seatObj.id; badge.style.display = ""; }
      if(EL.engine && EL.engine.toast) EL.engine.toast("座位 " + seatObj.id + " 绑定成功，欢迎回来！","ok");
      bootApp();
    }

    document.getElementById("gateEnter").addEventListener("click", doEnter);
    var gp = document.getElementById("gatePwd");
    gp.addEventListener("keydown", function(e){ if(e.key === "Enter") doEnter(); });
    if(!id){
      var gn = document.getElementById("gateNo");
      gn.addEventListener("keydown", function(e){ if(e.key === "Enter") doEnter(); });
      setTimeout(function(){ gn.focus(); }, 30);
    } else {
      setTimeout(function(){ gp.focus(); }, 30);
    }
    var gr = document.getElementById("gateReset");
    if(gr) gr.addEventListener("click", function(){ location.search = ""; });
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

    /* ===== 页面最顶部 · 资源赞助（蓝色按钮 + 支付动图，点击展开） ===== */
    var html = '<div class="sponsor sponsor-top" id="qrCard">'
      + '<button type="button" class="sponsor-toggle" id="qrToggle" aria-expanded="false">'
      + '<svg class="sp-pay" viewBox="0 0 24 24" aria-hidden="true">'
      + '<path class="pay-star" d="M12 1.6l1.35 3.05 3.3.5-2.4 2.4.58 3.3L12 9.4l-2.83 1.45.58-3.3-2.4-2.4 3.3-.5z" fill="#fff"/>'
      + '<circle class="pay-coin" cx="12" cy="15.4" r="6.6" fill="var(--accent)"/>'
      + '<circle class="pay-ring" cx="12" cy="15.4" r="4.5" fill="none" stroke="#fff" stroke-width="1.1" opacity=".85"/>'
      + '<text x="12" y="18.6" text-anchor="middle" font-size="7" font-weight="800" fill="#1f1300">¥</text>'
      + '</svg>'
      + '<span class="sp-txt">资源赞助 · 点击支持作者</span><span class="sp-arrow">▾</span>'
      + '</button>'
      + '<div class="sponsor-body" id="qrBody">'
      + '<p class="sponsor-note">由于模型 Token 调用成本较高，为了维持服务稳定运行，现开启自愿赞助通道。如果您觉得本应用对您有帮助，欢迎扫码支持服务器及 Token 费用。金额不限，您的支持是我持续维护的动力！</p>'
      + '<img src="assets/images/qr-pay.png" alt="微信支付二维码" class="sponsor-qr">'
      + '<div class="sponsor-tip">☕ 扫码赞赏一杯咖啡 · 金额不限，心意最重</div>'
      + '</div>'
      + '</div>';

    /* ===== 第一部分 · 图示区域（带文字说明） ===== */
    // ① Hero 主视觉：文案 + 学习旅程插画
    html += '<div class="hero hero-land">'
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
      + '<li><b>发音说明</b>：朗读发音由系统 TTS 提供。手机上如无声，请检查<b>音量与静音键</b>；微信内浏览器不支持朗读，请用系统浏览器打开。</li>'
      + '<li><b>小技巧</b>：右上角可切换浅色 / 深色主题；「清空数据」可随时恢复示例内容。</li>'
      + '</ul></div>';

    /* ===== 页面最底部 · 进入按钮 ===== */
    html += '<div class="home-enter">'
      + '<div class="enter-card">'
      + '<div class="enter-kicker">READY?</div>'
      + '<div class="enter-title">准备好了吗？</div>'
      + '<div class="enter-sub">每天 15 分钟，比昨天多会一句</div>'
      + '<button class="btn enter-btn" id="enterBtn"><span class="enter-ico">🚀</span> 进入学习 <span class="enter-arrow">→</span></button>'
      + '</div>'
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
    // 赞助区：点击展开 / 收起（默认收起，低调不突兀）
    var qrToggle = container.querySelector("#qrToggle");
    if(qrToggle) qrToggle.addEventListener("click", function(){
      var open = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", String(!open));
      container.querySelector("#qrCard").classList.toggle("open", !open);
    });
  }
})();
