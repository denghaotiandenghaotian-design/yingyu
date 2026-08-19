/* ===== engine.js · 共享算法与业务引擎（纯前端实现各提示词逻辑） ===== */
(function(){
  window.EL = window.EL || {};

  /* ---- 基础工具 ---- */
  function uid(prefix){
    return (prefix||"id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }
  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function $(sel,root){ return (root||document).querySelector(sel); }
  function $all(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  /* ---- 提示气泡 ---- */
  function toast(msg, type){
    type = type||"info";
    var wrap = document.getElementById("toastWrap");
    if(!wrap) return;
    var t = document.createElement("div");
    t.className = "toast toast-"+type;
    var color = type==="ok"?"var(--accent)":type==="warn"?"var(--warn)":type==="danger"?"var(--danger)":"var(--brand)";
    t.style.cssText = "background:var(--panel);border:1px solid var(--line);border-left:4px solid "+color+
      ";border-radius:10px;padding:11px 16px;margin-bottom:9px;box-shadow:var(--shadow);font-size:13px;max-width:340px;"+
      "animation:toastIn .25s ease;";
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function(){ t.style.opacity="0"; t.style.transform="translateX(20px)"; t.style.transition=".3s"; }, 2600);
    setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 2950);
  }

  /* ---- 艾宾浩斯遗忘曲线 ---- */
  var EB_INTERVALS = [1,2,4,7,15,30]; // 学习后第 N 天复习
  function reviewScheduleDates(startDate){
    return EB_INTERVALS.map(function(d){ var dt=new Date(startDate); dt.setDate(dt.getDate()+d); return dt; });
  }
  // 判断某材料今天是否应复习（基于上次学习日期与轮次）
  function isDue(lastStudiedISO, round){
    if(!lastStudiedISO) return true;
    var interval = EB_INTERVALS[Math.min(round||0, EB_INTERVALS.length-1)];
    var due = new Date(lastStudiedISO); due.setDate(due.getDate()+interval);
    return new Date() >= due;
  }

  /* ---- 雷达图（SVG，无第三方依赖） ---- */
  function radarSVG(datasets, opts){
    opts = opts||{};
    var size = opts.size||320, cx=size/2, cy=size/2, R=size/2-46;
    var axes = datasets[0].data.map(function(d){ return d.label; });
    var n = axes.length;
    function pt(i, r){
      var ang = -Math.PI/2 + i*(2*Math.PI/n);
      return [cx + r*Math.cos(ang), cy + r*Math.sin(ang)];
    }
    var svg = '<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'">';
    // 网格
    for(var g=1; g<=4; g++){
      var rr = R*g/4, pts=[];
      for(var i=0;i<n;i++){ var p=pt(i,rr); pts.push(p[0].toFixed(1)+","+p[1].toFixed(1)); }
      svg += '<polygon class="grid" points="'+pts.join(" ")+'"/>';
    }
    // 轴线 + 标签
    for(var j=0;j<n;j++){
      var e=pt(j,R); svg += '<line class="axis" x1="'+cx+'" y1="'+cy+'" x2="'+e[0].toFixed(1)+'" y2="'+e[1].toFixed(1)+'"/>';
      var lp=pt(j,R+22);
      var anchor = (Math.abs(lp[0]-cx)<6)?"middle":(lp[0]>cx?"start":"end");
      svg += '<text class="lab" x="'+lp[0].toFixed(1)+'" y="'+(lp[1]+4).toFixed(1)+'" text-anchor="'+anchor+'">'+esc(axes[j])+'</text>';
    }
    // 数据多边形
    datasets.forEach(function(ds){
      var pts=[];
      ds.data.forEach(function(d,k){ var p=pt(k, R*(Math.max(0,Math.min(100,d.value))/100)); pts.push(p[0].toFixed(1)+","+p[1].toFixed(1)); });
      svg += '<polygon class="area'+(ds.target?" target":"")+'" points="'+pts.join(" ")+'"/>';
      ds.data.forEach(function(d,k){ var p=pt(k, R*(Math.max(0,Math.min(100,d.value))/100)); svg += '<circle class="pt" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="2.6"/>'; });
    });
    svg += '</svg>';
    return svg;
  }

  /* ---- Mermaid mindmap 文本生成 ---- */
  function mermaidMindmap(root, children){
    var lines = ["mindmap", "  root(("+root+"))"];
    function walk(items, depth){
      items.forEach(function(it){
        var pad = new Array(depth+2).join("  ");
        var label = String(it.label||it.name||"").replace(/[()]/g,"");
        lines.push(pad + "(" + label + ")");
        if(it.children && it.children.length) walk(it.children, depth+1);
      });
    }
    walk(children||[], 0);
    return lines.join("\n");
  }

  /* ---- 通用英语词表（用于稀有度判断） ---- */
  var COMMON = ("the a an and or but if because so although though while when where which who whom whose "+
    "to of in on for with at by from as is are was were am be been being do does did have has had "+
    "i you he she it we they me him her us them my your his our their this that these those "+
    "not no yes can will would could should may might must go get make take see look find know think "+
    "come want need like love help use work play time day year people world home school book good bad "+
    "big small new old first last many much more most very some any all each other another one two three "+
    "what who how why there here out up down over under into about after before between through during "+
    "man woman child water food house car city place thing way word name part line end start stop open "+
    "close write read speak talk tell ask answer learn teach study show give receive buy sell live eat "+
    "drink sleep walk run sit stand leave arrive happy sad angry afraid free ready able different same "+
    "right left high low long short hot cold light dark hard easy early late now then today tomorrow").split(/\s+/);

  /* ---- 文本难度分级 ---- */
  function gradeText(text){
    var clean = String(text||"").replace(/[^A-Za-z\s'.]/g," ");
    var words = clean.toLowerCase().match(/[a-z']+/g) || [];
    var sentences = splitSentences(text);
    if(words.length===0) return {level:"—",score:0,words:0};
    var avgWord = words.reduce(function(a,w){return a+w.length;},0)/words.length;
    var avgSent = words.length/Math.max(1,sentences.length);
    var rare = words.filter(function(w){return w.length>=7 && COMMON.indexOf(w)===-1;}).length;
    var rareRatio = rare/words.length;
    var score = Math.min(100, Math.round(avgWord*9 + avgSent*2.2 + rareRatio*180));
    var level = score<32?"初级(A2)":score<52?"中级(B1)":score<70?"中高级(B2)":score<85?"高级(C1)":"学术(C2)";
    return {level:level, score:score, words:words.length, avgWord:+avgWord.toFixed(1), avgSent:+avgSent.toFixed(1), rareRatio:+rareRatio.toFixed(2)};
  }

  /* ---- 句子切分 ---- */
  function splitSentences(text){
    return String(text||"").split(/(?<=[.!?。！？])\s+|(?<=[.!?。！？])/).map(function(s){return s.trim();}).filter(function(s){return s.length>0;});
  }

  /* ---- 背诵 diff 比对 ---- */
  function diffRecite(original, input){
    var oLines = String(original||"").split(/\n/).map(function(s){return s.trim();}).filter(function(s){return s;});
    var iLines = String(input||"").split(/\n/).map(function(s){return s.trim();}).filter(function(s){return s;});
    var results = [];
    var total = Math.max(oLines.length, iLines.length);
    var correctCount = 0;
    for(var i=0;i<total;i++){
      var o = oLines[i]||"", u = iLines[i]||"";
      if(!u){ results.push({idx:i+1, status:"缺", original:o, user:"", type:"遗漏"}); continue; }
      if(!o){ results.push({idx:i+1, status:"多", original:"", user:u, type:"多余"}); continue; }
      var ow = o.toLowerCase().match(/[a-z']+/g)||[], uw = u.toLowerCase().match(/[a-z']+/g)||[];
      var match=0, miss=[];
      ow.forEach(function(w,k){ if(uw[k]===w) match++; else miss.push(w); });
      var ratio = ow.length? match/ow.length : 0;
      var status = ratio>=0.95?"对":ratio>=0.5?"偏":"错";
      if(status==="对") correctCount++;
      var type = (uw.length>ow.length)?"多余词":(miss.length&&uw.length<ow.length)?"遗漏词":"拼写";
      results.push({idx:i+1, status:status, original:o, user:u, type:type, miss:miss, ratio:ratio});
    }
    var rate = total? Math.round(correctCount/total*100) : 0;
    return {results:results, rate:rate, correct:correctCount, total:total};
  }

  /* ---- 口语常见错误库（含 IPA 纠音建议） ---- */
  var ORAL_RULES = [
    {re:/\bhe\s+(go|do|have|want|like|need|make|take)\b/i, fix:"he goes/does/has...（第三人称单数加 -s）", ipa:"", why:"主谓一致：第三人称单数动词需加 -s/-es"},
    {re:/\bshe\s+(go|do|have|want|like|need|make|take)\b/i, fix:"she goes...（第三人称单数加 -s）", ipa:"", why:"主谓一致：第三人称单数动词需加 -s/-es"},
    {re:/\bI\s+is\b/i, fix:"I am", ipa:"/aɪ æm/", why:"be 动词第一人称用 am"},
    {re:/\bhe\s+don't\b/i, fix:"he doesn't", ipa:"/ˈdʌznt/", why:"第三人称否定用 doesn't"},
    {re:/\balthough\b.+\bbut\b/i, fix:"although 与 but 不连用，去掉 but", ipa:"", why:"中英负迁移：英文从句只用其一"},
    {re:/\bbecause\b.+\bso\b/i, fix:"because 与 so 不连用，去掉 so", ipa:"", why:"中英负迁移：英文从句只用其一"},
    {re:/\bmore\s+better\b/i, fix:"better（比较级不叠加 more）", ipa:"/ˈbetə/", why:"better 本身是比较级"},
    {re:/\bcan\s+able\s+to\b/i, fix:"can 或 be able to（不叠加）", ipa:"", why:"情态动词不与 able to 叠加"},
    {re:/\bopen\s+the\s+light\b/i, fix:"turn on the light", ipa:"", why:"开灯用 turn on，open 用于开门/开窗"},
    {re:/\ban\s+advice\b/i, fix:"a piece of advice（advice 不可数）", ipa:"/ədˈvaɪs/", why:"advice 是不可数名词"},
    {re:/\bmuch\s+friend/i, fix:"many friends（可数复数用 many）", ipa:"", why:"friend 可数，用 many"},
    {re:/\byesterday\s+.+\bgo\b/i, fix:"yesterday 后用 went（一般过去时）", ipa:"/went/", why:"过去时间状语搭配过去式"},
    {re:/\bvery\s+much\s+like\b/i, fix:"like ... very much（副词位置）", ipa:"", why:"very much 修饰 like 应后置"},
    {re:/\bmake\s+a\s+progress\b/i, fix:"make progress（progress 不可数）", ipa:"/prəˈɡres/", why:"progress 不可数"},
    {re:/\bin\s+the\s+morning\s+of\b/i, fix:"on the morning of（具体某日早晨用 on）", ipa:"", why:"具体日期搭配 on"}
  ];
  var IPA_DICT = {
    "think":"/θɪŋk/（/θ/ 舌尖轻咬下齿，气流从齿间出）", "three":"/θriː/（/θ/ 清齿擦音）",
    "this":"/ðɪs/（/ð/ 浊齿擦音）", "that":"/ðæt/（/ð/ 浊齿擦音）",
    "world":"/wɜːld/（词尾 l 与 d 之间勿加元音）", "work":"/wɜːk/（/ɜː/ 卷舌中央元音）",
    "mother":"/ˈmʌðə/（/ʌ/ 非 /a/；/ð/ 浊齿音）", "father":"/ˈfɑːðə/（美式 /ɑː/ 张口较大）",
    "busy":"/ˈbɪzi/（u 发 /ɪ/ 非 /aɪ/）", "want":"/wɒnt/（英式 /ɒ/ 非 /ʌ/）",
    "food":"/fuːd/（长音 /uː/）", "good":"/ɡʊd/（短音 /ʊ/）",
    "very":"/ˈveri/（v 上齿咬下唇）", "water":"/ˈwɔːtə/（t 在元音间常浊化为 /ɾ/）",
    "better":"/ˈbetə/（t 浊化为 /ɾ/）", "thirty":"/ˈθɜːti/（/θ/ + /ɜː/）",
    "usually":"/ˈjuːʒuəli/（s 发 /ʒ/）", "measure":"/ˈmeʒə/（s 发 /ʒ/）"
  };
  function analyzeOral(text){
    var errors = [];
    ORAL_RULES.forEach(function(r){
      if(r.re.test(text)) errors.push({fix:r.fix, why:r.why, ipa:r.ipa});
    });
    // 去重
    var seen={}; errors = errors.filter(function(e){ var k=e.fix; if(seen[k])return false; seen[k]=1; return true; });
    var ipaHits = [];
    Object.keys(IPA_DICT).forEach(function(w){
      var re = new RegExp("\\b"+w+"\\b","i");
      if(re.test(text)) ipaHits.push({word:w, ipa:IPA_DICT[w]});
    });
    // 五维启发式评分（0-100）
    var words = (text.toLowerCase().match(/[a-z']+/g)||[]);
    var sents = splitSentences(text);
    var wordCount = words.length;
    var sentCount = sents.length;
    var avgLen = wordCount/Math.max(1,sentCount);
    var longWords = words.filter(function(w){return w.length>=6;}).length;
    var vocabScore = Math.min(100, 40 + longWords*6 + Math.min(40, wordCount));
    var fluency = Math.min(100, 30 + Math.min(50, wordCount*2) + Math.min(20, sentCount*8));
    var accuracy = Math.max(20, 100 - errors.length*16);
    var grammar = Math.max(20, 100 - errors.length*14 - (avgLen<4?15:0));
    var variety = Math.min(100, 35 + longWords*7 + (new Set(words).size/Math.max(1,wordCount))*60);
    var pronunciation = ipaHits.length? Math.max(35, 100 - ipaHits.length*8) : 70; // 标注：发音需录音
    return {
      errors:errors, ipaHits:ipaHits,
      dims:{流利度:fluency, 准确度:accuracy, 词汇:vocabScore, 语法:grammar, 语音:pronunciation, 表达丰富度:variety}
    };
  }

  /* ---- 听力：从句提取选择题 ---- */
  function genListenQuestions(text, type, count){
    var sents = splitSentences(text).filter(function(s){ return (s.match(/[A-Za-z]/g)||[]).length>3; });
    if(!sents.length) return [];
    count = Math.min(count||5, sents.length);
    var chosen = sents.slice(0, count);
    var allWords = (text.toLowerCase().match(/[a-z']+/g)||[]).filter(function(w){return w.length>=3 && COMMON.indexOf(w)===-1;});
    var opts = [];
    return chosen.map(function(s, i){
      var words = s.match(/[A-Za-z']+/g)||[];
      // 选一个内容词挖空
      var candidates = words.map(function(w,k){return {w:w,k:k};}).filter(function(o){return o.w.length>=4 && COMMON.indexOf(o.w.toLowerCase())===-1;});
      if(!candidates.length) candidates = words.map(function(w,k){return {w:w,k:k};}).filter(function(o){return o.k>0;});
      var pick = candidates[Math.floor(Math.random()*candidates.length)] || {w:words[1]||"__", k:1};
      var answer = pick.w;
      var distract = allWords.filter(function(w){return w!==answer.toLowerCase() && w.length>=answer.length-2;}).slice(0,8);
      var choices = [answer];
      var di=0;
      while(choices.length<3 && di<distract.length){ if(choices.indexOf(distract[di])===-1) choices.push(distract[di]); di++; }
      while(choices.length<3) choices.push("option_"+(choices.length+1));
      // 打乱
      choices = choices.slice().sort(function(){return Math.random()-0.5;});
      var cloze = s.replace(new RegExp("\\b"+answer.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b"), "______");
      if(type==="fill"){
        return {q:i+1, stem:cloze, answer:answer, sentence:s, explain:"原句关键信息词为 "+answer+"。"};
      } else if(type==="judge"){
        var tf = Math.random()>0.5;
        return {q:i+1, stem:"判断：\""+cloze.replace("______", answer)+"\" 与原文一致。", answer:tf?"正确":"错误",
                explain:"原句为："+s, sentence:s};
      }
      return {q:i+1, stem:cloze, choices:choices, answer:answer, sentence:s, explain:"原句："+s};
    });
  }

  /* ---- 听力：逐句精听拆解（连读/弱读/重读 简化标注） ---- */
  var WEAK = ("the a an and or but to of in on for with as that is are was were has have had can will would "+
    "do does did could should may might must be been being").split(/\s+/);
  function dictationScript(text){
    var sents = splitSentences(text).filter(function(s){return s.trim().length>0;});
    return sents.map(function(s){
      var toks = s.match(/[A-Za-z']+|[.,!?]/g)||[];
      var marks=[];
      for(var i=0;i<toks.length;i++){
        var w = toks[i].toLowerCase();
        if(/[.,!?]/.test(toks[i])){ marks.push({t:toks[i],type:"标点"}); continue; }
        var type="内容词";
        if(WEAK.indexOf(w)!==-1) type="弱读";
        // 连读：前词以辅音结尾、后词以元音开头
        if(i<toks.length-1){
          var nxt=toks[i+1];
          var endC=/[bcdfgklmnpqrstvz]$/i.test(toks[i]) && /[A-Za-z]/.test(toks[i]);
          var startV=/^[aeiou]/i.test(nxt);
          if(endC && startV) type = (type==="弱读"?"弱读+":"")+"连读";
        }
        marks.push({t:toks[i], type:type});
      }
      // 挖空稿：每隔一个内容词挖空
      var blanked = s;
      var ci=0;
      marks.forEach(function(m){
        if(m.type!=="标点" && m.type!=="弱读" && ci%2===1){
          blanked = blanked.replace(new RegExp("\\b"+m.t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b"), "____");
        }
        if(m.type!=="标点") ci++;
      });
      return {sentence:s, marks:marks, blanked:blanked};
    });
  }

  /* =================== 新增：发音(TTS) / 每日一练 / 自然拼读 / 零基础资料库 =================== */

  /* ---- 发音：浏览器内置 TTS（无音频文件，纯前端；不支持时静默降级） ---- */
  function speak(text, lang){
    lang = lang || "en-US";
    try{
      if(!("speechSynthesis" in window)) return false;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text||""));
      u.lang = lang; u.rate = 0.95; u.pitch = 1;
      window.speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  }
  function todayKey(d){
    d = d || new Date();
    return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
  }

  /* ---- 每日一练：生动口语化生词库（成人零基础也能用，避免枯燥） ---- */
  var DAILY_WORDS = [
    {en:"hang out", phon:"/hæŋ aʊt/", zh:"闲逛、聚在一起", ex:"Let's hang out this weekend.", exzh:"周末一起出来玩吧。", scn:"朋友约你周末放松"},
    {en:"catch up", phon:"/kætʃ ʌp/", zh:"叙旧、补上近况", ex:"We need to catch up soon.", exzh:"我们得找时间聊聊近况。", scn:"久未联系想约聊"},
    {en:"comfort food", phon:"/ˈkʌmfət fuːd/", zh:"治愈系食物", ex:"Noodles are my comfort food.", exzh:"面条是我的治愈食物。", scn:"情绪低落时想吃的那口"},
    {en:"small talk", phon:"/smɔːl tɔːk/", zh:"寒暄、闲聊", ex:"He is good at small talk.", exzh:"他很会寒暄。", scn:"社交破冰用"},
    {en:"rain check", phon:"/reɪn tʃek/", zh:"改天（委婉拒绝）", ex:"Can I take a rain check?", exzh:"能改天吗？", scn:"想改期又不失礼"},
    {en:"piece of cake", phon:"/piːs əv keɪk/", zh:"小菜一碟", ex:"The test was a piece of cake.", exzh:"考试太简单了。", scn:"形容超容易"},
    {en:"hit the sack", phon:"/hɪt ðə sæk/", zh:"去睡觉", ex:"I'm gonna hit the sack.", exzh:"我要去睡了。", scn:"口语说睡觉"},
    {en:"grab a bite", phon:"/ɡræb ə baɪt/", zh:"随便吃点", ex:"Let's grab a bite.", exzh:"随便吃点吧。", scn:"非正式约饭"},
    {en:"chill", phon:"/tʃɪl/", zh:"放松、宅着", ex:"Just chill at home.", exzh:"就在家放松。", scn:"周末躺平"},
    {en:"cram", phon:"/kræm/", zh:"突击（复习）", ex:"I crammed for the exam.", exzh:"我考前突击了一下。", scn:"临时抱佛脚"},
    {en:"run late", phon:"/rʌn leɪt/", zh:"要迟到了", ex:"Sorry, I'm running late.", exzh:"抱歉我要迟到了。", scn:"通勤迟到"},
    {en:"touch base", phon:"/tʌtʃ beɪs/", zh:"碰头、同步", ex:"Let's touch base tomorrow.", exzh:"明天碰个头吧。", scn:"工作跟进"},
    {en:"on the same page", phon:"/seɪm peɪdʒ/", zh:"意见一致", ex:"Glad we're on the same page.", exzh:"很高兴我们想法一致。", scn:"达成共识"},
    {en:"wing it", phon:"/wɪŋ ɪt/", zh:"临场发挥", ex:"I'll just wing it.", exzh:"我就临场发挥吧。", scn:"没准备就上"},
    {en:"spill the tea", phon:"/spɪl ðə tiː/", zh:"爆料、说八卦", ex:"Come on, spill the tea!", exzh:"快说快说，爆个料！", scn:"朋友催你讲内幕"},
    {en:"low key", phon:"/loʊ kiː/", zh:"低调地", ex:"I'm low key excited.", exzh:"我暗暗有点小激动。", scn:"不想太张扬的开心"},
    {en:"vibe", phon:"/vaɪb/", zh:"氛围、感觉", ex:"I love the vibe here.", exzh:"我喜欢这里的氛围。", scn:"形容地方感觉好"},
    {en:"keep in touch", phon:"/kiːp ɪn tʌtʃ/", zh:"保持联系", ex:"Let's keep in touch.", exzh:"咱们保持联系。", scn:"分别时客套"},
    {en:"save face", phon:"/seɪv feɪs/", zh:"保全面子", ex:"He did it to save face.", exzh:"他那么做是为了保全面子。", scn:"中式语境也常用"},
    {en:"bite the bullet", phon:"/baɪt ðə ˈbʊlɪt/", zh:"硬着头皮上", ex:"I bit the bullet and called.", exzh:"我硬着头皮打了电话。", scn:"不愿做但必须做"},
    {en:"beat the traffic", phon:"/biːt ðə ˈtræfɪk/", zh:"避开拥堵", ex:"Leave early to beat the traffic.", exzh:"早点走避开拥堵。", scn:"通勤技巧"},
    {en:"treat yourself", phon:"/triːt jɔːself/", zh:"犒劳自己", ex:"Treat yourself today.", exzh:"今天犒劳下自己。", scn:"自我奖励"},
    {en:"no sweat", phon:"/noʊ swet/", zh:"没问题、小意思", ex:"No sweat, I'll help.", exzh:"小意思，我来帮你。", scn:"爽快答应"},
    {en:"call it a day", phon:"/kɔːl ɪt ə deɪ/", zh:"收工、到此为止", ex:"Let's call it a day.", exzh:"今天就到这吧。", scn:"下班收工"},
    {en:"brush up", phon:"/brʌʃ ʌp/", zh:"温习、捡回", ex:"I need to brush up my English.", exzh:"我得温习下英语。", scn:"生疏了再捡"},
    {en:"cut to the chase", phon:"/kʌt tə ðə tʃeɪs/", zh:"直入主题", ex:"Let's cut to the chase.", exzh:"咱们直说重点。", scn:"会议高效"},
    {en:"break the ice", phon:"/breɪk ðə aɪs/", zh:"破冰", ex:"A joke can break the ice.", exzh:"一个笑话能破冰。", scn:"破尴尬"},
    {en:"on me", phon:"/ɒn miː/", zh:"我请客", ex:"Drinks are on me.", exzh:"饮料我请。", scn:"买单"},
    {en:"fingers crossed", phon:"/ˈfɪŋɡəz krɒst/", zh:"祈愿好运", ex:"Fingers crossed for the exam!", exzh:"考试加油，保佑过！", scn:"鼓励他人"},
    {en:"my treat", phon:"/maɪ triːt/", zh:"我请", ex:"It's my treat this time.", exzh:"这次我请。", scn:"抢着买单"},
    {en:"break a leg", phon:"/breɪk ə leɡ/", zh:"祝好运（演出前）", ex:"Break a leg tonight!", exzh:"今晚加油，祝好运！", scn:"朋友上台/面试前打气"},
    {en:"hit the road", phon:"/hɪt ðə roʊd/", zh:"出发、上路", ex:"It's time to hit the road.", exzh:"该出发了。", scn:"准备离开"},
    {en:"under the weather", phon:"/ˈʌndər ðə ˈweðər/", zh:"身体不舒服", ex:"I'm feeling under the weather.", exzh:"我有点不舒服。", scn:"委婉说自己病了"},
    {en:"the ball is in your court", phon:"/ˈkɔːrt/", zh:"该你做决定了", ex:"The ball is in your court now.", exzh:"现在看你决定了。", scn:"谈判/协商把球踢回"},
    {en:"cost an arm and a leg", phon:"/kɔːst ən ɑːrm ən ə leɡ/", zh:"贵得离谱", ex:"It cost an arm and a leg.", exzh:"贵死了。", scn:"吐槽价格高"},
    {en:"once in a blue moon", phon:"/wʌns ɪn ə bluː muːn/", zh:"千载难逢", ex:"We eat out once in a blue moon.", exzh:"我们很少下馆子。", scn:"形容极罕见"},
    {en:"speak of the devil", phon:"/spiːk əv ðə ˈdevəl/", zh:"说曹操曹操到", ex:"Speak of the devil, here he is!", exzh:"说曹操曹操到！", scn:"刚提到的人出现"},
    {en:"let the cat out of the bag", phon:"/lɛt ðə kæt aʊt əv ðə bæɡ/", zh:"泄露秘密", ex:"He let the cat out of the bag.", exzh:"他不小心说漏了嘴。", scn:"意外泄密"},
    {en:"hit the nail on the head", phon:"/hɪt ðə neɪl ɒn ðə hɛd/", zh:"一语中的", ex:"You hit the nail on the head.", exzh:"你说到点子上了。", scn:"赞同精准到位"},
    {en:"burn the midnight oil", phon:"/bɜːrn ðə ˈmɪdnaɪt ɔɪl/", zh:"挑灯夜战", ex:"She burned the midnight oil.", exzh:"她熬夜赶工。", scn:"加班/赶作业"},
    {en:"get out of hand", phon:"/ɡɛt aʊt əv hænd/", zh:"失控", ex:"The argument got out of hand.", exzh:"争论失控了。", scn:"局面变糟"},
    {en:"on the ball", phon:"/ɒn ðə bɔːl/", zh:"机灵、在状态", ex:"He's really on the ball.", exzh:"他脑子很灵光。", scn:"夸人靠谱"},
    {en:"food for thought", phon:"/fuːd fər θɔːt/", zh:"值得思考的事", ex:"That's food for thought.", exzh:"这值得琢磨。", scn:"引发思考"},
    {en:"a blessing in disguise", phon:"/ə ˈblɛsɪŋ ɪn dɪsˈɡaɪz/", zh:"因祸得福", ex:"Losing that job was a blessing in disguise.", exzh:"丢那份工作反而是福。", scn:"坏事变好事"},
    {en:"cut corners", phon:"/kʌt ˈkɔːrnərz/", zh:"偷工减料", ex:"Don't cut corners on safety.", exzh:"安全上别偷工减料。", scn:"图省事降质量"},
    {en:"the best of both worlds", phon:"/ðə bɛst əv boʊθ wɜːrldz/", zh:"两全其美", ex:"You get the best of both worlds.", exzh:"你两全其美了。", scn:"兼顾两者"},
    {en:"call it a night", phon:"/kɔːl ɪt ə naɪt/", zh:"今晚到此为止", ex:"Let's call it a night.", exzh:"今晚收工吧。", scn:"夜晚收工"},
    {en:"throw in the towel", phon:"/θroʊ ɪn ðə ˈtaʊəl/", zh:"认输、放弃", ex:"He threw in the towel.", exzh:"他认输了。", scn:"放弃努力"},
    {en:"go the extra mile", phon:"/ɡoʊ ðə ˈɛkstrə maɪl/", zh:"多努力一点", ex:"She always goes the extra mile.", exzh:"她总是格外尽力。", scn:"超出预期"},
    {en:"in the nick of time", phon:"/ɪn ðə nɪk əv taɪm/", zh:"千钧一发", ex:"We arrived in the nick of time.", exzh:"我们刚好赶上。", scn:"险些错过"},
    {en:"back to the drawing board", phon:"/bæk tə ðə ˈdrɔːɪŋ bɔːrd/", zh:"推倒重来", ex:"Back to the drawing board.", exzh:"重头来过吧。", scn:"计划失败"},
    {en:"barking up the wrong tree", phon:"/ˈbɑːrkɪŋ ʌp ðə rɔːŋ triː/", zh:"找错对象/方向", ex:"You're barking up the wrong tree.", exzh:"你找错人了。", scn:"误解方向"},
    {en:"when pigs fly", phon:"/wɛn pɪɡz flaɪ/", zh:"绝不可能", ex:"That'll happen when pigs fly.", exzh:"那绝不可能。", scn:"强烈否定"},
    {en:"kill two birds with one stone", phon:"/kɪl tuː bɜːrdz wɪð wʌn stoʊn/", zh:"一石二鸟", ex:"I killed two birds with one stone.", exzh:"我一举两得。", scn:"高效完成两件事"},
    {en:"the early bird catches the worm", phon:"/ˈɜːrli bɜːrd ˈkætʃɪz ðə wɜːrm/", zh:"早起的鸟儿有虫吃", ex:"The early bird catches the worm.", exzh:"早行动有优势。", scn:"劝人趁早"},
    {en:"add fuel to the fire", phon:"/æd ˈfjuːəl tə ðə ˈfaɪər/", zh:"火上浇油", ex:"Don't add fuel to the fire.", exzh:"别再火上浇油了。", scn:"激化矛盾"},
    {en:"miss the boat", phon:"/mɪs ðə boʊt/", zh:"错失良机", ex:"Don't miss the boat.", exzh:"别错过机会。", scn:"提醒抓紧"},
    {en:"play it by ear", phon:"/pleɪ ɪt baɪ ɪr/", zh:"随机应变", ex:"Let's play it by ear.", exzh:"咱们看情况办。", scn:"无计划应对"},
    {en:"break new ground", phon:"/breɪk njuː ɡraʊnd/", zh:"开拓新领域", ex:"The team broke new ground.", exzh:"团队开拓了新领域。", scn:"创新突破"},
    {en:"a far cry from", phon:"/ə fɑːr kraɪ frəm/", zh:"与…大相径庭", ex:"This is a far cry from last year.", exzh:"这和去年大不相同。", scn:"对比落差"},
    {en:"the tip of the iceberg", phon:"/ðə tɪp əv ðə ˈaɪsbɜːrɡ/", zh:"冰山一角", ex:"That's just the tip of the iceberg.", exzh:"那只是冰山一角。", scn:"问题只是表象"},
    {en:"get the hang of it", phon:"/ɡɛt ðə hæŋ əv ɪt/", zh:"摸清门道", ex:"I'm getting the hang of it.", exzh:"我慢慢找到感觉了。", scn:"开始上手"},
    {en:"on the fence", phon:"/ɒn ðə fɛns/", zh:"犹豫不决", ex:"I'm still on the fence.", exzh:"我还在犹豫。", scn:"未做决定"}
  ];
  var DAILY_PATTERNS = [
    {en:"Would you like to ___ ?", zh:"你想……吗？", ex:"Would you like to grab a bite?", exzh:"想随便吃点吗？", scn:"发出邀请"},
    {en:"I'm really into ___ing.", zh:"我特别喜欢……", ex:"I'm really into hiking.", exzh:"我特别喜欢徒步。", scn:"表达喜好"},
    {en:"Could you ___ for me?", zh:"能帮我……吗？", ex:"Could you take a photo?", exzh:"能帮我拍张照吗？", scn:"委婉求助"},
    {en:"How about ___?", zh:"……怎么样？", ex:"How about a coffee?", exzh:"喝杯咖啡怎么样？", scn:"提出建议"},
    {en:"I was wondering if ___ .", zh:"我在想是否……", ex:"I was wondering if you're free.", exzh:"我在想你是否有空。", scn:"非常委婉"},
    {en:"Let's ___ together sometime.", zh:"改天一起……", ex:"Let's hang out together sometime.", exzh:"改天一起聚聚。", scn:"约朋友"},
    {en:"To be honest, ___ .", zh:"说实话，……", ex:"To be honest, I'm a bit tired.", exzh:"说实话我有点累。", scn:"真诚表达"},
    {en:"I'm kind of ___ .", zh:"我有点……", ex:"I'm kind of busy now.", exzh:"我现在有点忙。", scn:"说明状态"},
    {en:"No worries, ___ .", zh:"别担心，……", ex:"No worries, take your time.", exzh:"别担心，慢慢来。", scn:"安抚对方"},
    {en:"What do you think of ___ ?", zh:"你觉得……如何？", ex:"What do you think of this cafe?", exzh:"你觉得这家咖啡馆如何？", scn:"征求意见"},
    {en:"I'd rather ___ .", zh:"我宁愿……", ex:"I'd rather stay in tonight.", exzh:"今晚我宁愿宅着。", scn:"表达偏好"},
    {en:"Fingers crossed for ___ !", zh:"为……祈愿！", ex:"Fingers crossed for your interview!", exzh:"祝你面试顺利！", scn:"鼓励打气"},
    {en:"I'm looking forward to ___ .", zh:"我期待……", ex:"I'm looking forward to the trip.", exzh:"我期待这趟旅行。", scn:"表达期待"},
    {en:"It's worth ___ing.", zh:"……值得做", ex:"It's worth visiting.", exzh:"值得一去。", scn:"推荐"},
    {en:"I'm used to ___ing.", zh:"我习惯……", ex:"I'm used to waking early.", exzh:"我习惯早起。", scn:"说习惯"},
    {en:"Make sure (that) ___ .", zh:"确保……", ex:"Make sure you lock the door.", exzh:"记得锁门。", scn:"提醒"},
    {en:"I can't help ___ing.", zh:"忍不住……", ex:"I can't help laughing.", exzh:"我忍不住笑。", scn:"情不自禁"},
    {en:"There's no doubt that ___ .", zh:"毫无疑问……", ex:"There's no doubt he'll come.", exzh:"他肯定会来。", scn:"肯定"},
    {en:"As far as I know, ___ .", zh:"据我所知……", ex:"As far as I know, it's closed.", exzh:"据我所知关门了。", scn:"谨慎表述"},
    {en:"The thing is, ___ .", zh:"问题是……", ex:"The thing is, I'm broke.", exzh:"问题是我没钱了。", scn:"说明难点"},
    {en:"I'm not a big fan of ___ .", zh:"我不太喜欢……", ex:"I'm not a big fan of spicy food.", exzh:"我不太吃辣。", scn:"表达不喜欢"},
    {en:"Why don't we ___ ?", zh:"我们为什么不……？", ex:"Why don't we take a taxi?", exzh:"我们打车吧？", scn:"提议"},
    {en:"It's up to you.", zh:"你决定。", ex:"It's up to you.", exzh:"你说了算。", scn:"把决定权交给对方"},
    {en:"Believe it or not, ___ .", zh:"信不信由你……", ex:"Believe it or not, I met him.", exzh:"信不信，我碰到他了。", scn:"引出意外"},
    {en:"I'll keep that in mind.", zh:"我记下了。", ex:"I'll keep that in mind.", exzh:"我记住了。", scn:"回应建议"},
    {en:"If I were you, I would ___ .", zh:"如果我是你，会……", ex:"If I were you, I'd apologize.", exzh:"如果我是你，会道歉。", scn:"给建议（虚拟语气）"},
    {en:"I'm afraid ___ .", zh:"恐怕……", ex:"I'm afraid I can't make it.", exzh:"恐怕我来不了。", scn:"委婉拒绝"}
  ];
  function dailySet(key){
    key = key || todayKey();
    var seed = 0; for(var i=0;i<key.length;i++){ seed = (seed*31 + key.charCodeAt(i))>>>0; }
    function pick(arr, n, offset){
      var out=[], idx=(seed + (offset||0)) % arr.length;
      for(var i=0;i<n;i++){ out.push(arr[(idx+i)%arr.length]); }
      return out;
    }
    return { date:key, words:pick(DAILY_WORDS,10,0), patterns:pick(DAILY_PATTERNS,3,7) };
  }

  /* ---- 自然拼读：成人 phonics（基础 + 进阶，快速打基础） ---- */
  var PHONICS = [
    {id:"vowels", level:"基础", title:"① 短元音 a / e / i / o / u", note:"英语 5 个短元音是拼读地基，先听清、再跟读。短元音「短促、嘴型固定」，不要拖长。",
     items:[
       {label:"a /æ/", ipa:"/æ/", word:"apple", zh:"苹果", tip:"美式 /æ/ 张口较大，别读成 /e/。"},
       {label:"e /e/", ipa:"/e/", word:"egg", zh:"鸡蛋", tip:"介于 /æ/ 与 /ɪ/ 之间，嘴半开。"},
       {label:"i /ɪ/", ipa:"/ɪ/", word:"ink", zh:"墨水", tip:"不同于字母名 /aɪ/（如 ice）。"},
       {label:"o /ɒ/", ipa:"/ɒ/", word:"octopus", zh:"章鱼", tip:"英式短音；美式常发 /ɑ/（如 hot）。"},
       {label:"u /ʌ/", ipa:"/ʌ/", word:"umbrella", zh:"雨伞", tip:"中原元音，轻松放松，别用力。"}
     ]},
    {id:"cvc", level:"基础", title:"② CVC 拼读：辅音+元音+辅音", note:"把「辅音音 + 短元音 + 辅音音」拼起来，连读成词。先拆后拼：b-a / ba，再 +t = bat。",
     items:[
       {label:"b-a-t", ipa:"/bæt/", word:"bat", zh:"球棒"},
       {label:"p-e-n", ipa:"/pen/", word:"pen", zh:"钢笔"},
       {label:"p-i-g", ipa:"/pɪɡ/", word:"pig", zh:"猪"},
       {label:"d-o-g", ipa:"/dɒɡ/", word:"dog", zh:"狗", tip:"词尾 g 发 /ɡ/，别加元音读成 /ɡə/。"},
       {label:"s-u-n", ipa:"/sʌn/", word:"sun", zh:"太阳"},
       {label:"c-u-p", ipa:"/kʌp/", word:"cup", zh:"杯子", tip:"c 在 u 前发硬音 /k/。"}
     ]},
    {id:"digraph", level:"基础", title:"③ 常见辅音连缀 sh / ch / th / wh / ph", note:"两个字母发一个音，别拆开发。th 有清（/θ/ 吐气咬舌）浊（/ð/ 声带振动）之分。",
     items:[
       {label:"sh", ipa:"/ʃ/", word:"ship", zh:"船"},
       {label:"ch", ipa:"/tʃ/", word:"chair", zh:"椅子"},
       {label:"th(清)", ipa:"/θ/", word:"think", zh:"想", tip:"舌尖轻咬下齿，气流从齿间出，不振动声带。"},
       {label:"th(浊)", ipa:"/ð/", word:"this", zh:"这个", tip:"与 think 同口型，但声带振动。"},
       {label:"wh", ipa:"/w/", word:"whale", zh:"鲸", tip:"在 o 前读 /h/：who /huː/、whole /hoʊl/。"},
       {label:"ph", ipa:"/f/", word:"photo", zh:"照片", tip:"希腊来源词，ph 永远发 /f/。"}
     ]},
    {id:"vowelteam", level:"基础", title:"④ 常见元音组合 ai / ee / oa / oo / ou", note:"两个元音字母常发一个长音或特定音。注意 oo 有长/短两读、ea 有 /iː/ 与 /e/ 两读。",
     items:[
       {label:"ai", ipa:"/eɪ/", word:"rain", zh:"雨"},
       {label:"ee", ipa:"/iː/", word:"tree", zh:"树", tip:"ee 几乎总是长音 /iː/，最稳定。"},
       {label:"oa", ipa:"/əʊ/", word:"boat", zh:"船"},
       {label:"oo(长)", ipa:"/uː/", word:"moon", zh:"月亮"},
       {label:"oo(短)", ipa:"/ʊ/", word:"book", zh:"书", tip:"oo 在 k 前常短读（book/look/cook）。"},
       {label:"ou", ipa:"/aʊ/", word:"house", zh:"房子", tip:"ou 在 touch/young 中却发 /ʌ/，是例外。"}
     ]},
    {id:"magice", level:"进阶", title:"⑤ 长元音 · 魔法 e（Magic E）", note:"词尾不发音的 e 让前面的元音发「字母本音」（长音）。口诀：辅音-元音-辅音-e，中间元音叫得长。",
     items:[
       {label:"a_e /ā/", ipa:"/eɪ/", word:"cake", zh:"蛋糕"},
       {label:"i_e /ī/", ipa:"/aɪ/", word:"bike", zh:"自行车"},
       {label:"o_e /ō/", ipa:"/əʊ/", word:"bone", zh:"骨头"},
       {label:"u_e /ū/", ipa:"/juː/", word:"cube", zh:"立方体", tip:"u_e 在 c/g 后常读 /uː/（如 rule）。"},
       {label:"e_e /ē/", ipa:"/iː/", word:"these", zh:"这些"}
     ]},
    {id:"vteam2", level:"进阶", title:"⑥ 元音组合（长音）ee / ea / ai / ay / oa / ow", note:"两个元音相邻常发长音，但 ea 是「两面派」：meat 发 /iː/，head 却发 /e/，需要积累词感。",
     items:[
       {label:"ee", ipa:"/iː/", word:"green", zh:"绿色"},
       {label:"ea", ipa:"/iː/", word:"meat", zh:"肉", tip:"ea 也可发 /e/（head, bread, weather），看词判断。"},
       {label:"ai", ipa:"/eɪ/", word:"rain", zh:"雨"},
       {label:"ay", ipa:"/eɪ/", word:"play", zh:"玩", tip:"ay 多在词尾（play/day），ai 多在词中（rain）。"},
       {label:"oa", ipa:"/əʊ/", word:"boat", zh:"船"},
       {label:"ow(长)", ipa:"/əʊ/", word:"snow", zh:"雪", tip:"ow 在 snow/show 发 /əʊ/，在 cow/how 却发 /aʊ/。"}
     ]},
    {id:"rcontrol", level:"进阶", title:"⑦ R 控制元音 ar / er / ir / or / ur", note:"元音后接 r 被「卷舌化」，不再发原元音（美式 r 明显，英式 r 不发音）。记忆：r 把元音「拽」卷了。",
     items:[
       {label:"ar", ipa:"/ɑːr/", word:"car", zh:"汽车", tip:"英式 car 读 /kɑː/（r 不发音）。"},
       {label:"er", ipa:"/ɜːr/", word:"her", zh:"她的"},
       {label:"ir", ipa:"/ɜːr/", word:"bird", zh:"鸟"},
       {label:"or", ipa:"/ɔːr/", word:"fork", zh:"叉子"},
       {label:"ur", ipa:"/ɜːr/", word:"nurse", zh:"护士", tip:"er/ir/ur 三种写法都发 /ɜːr/，是同一音。"}
     ]},
    {id:"diph", level:"进阶", title:"⑧ 双元音 ow / oy / ou / oi / au / aw", note:"两个元音滑在一起，从一个音滑向另一个音，嘴型要动（不能停在中途）。ou/oi 与 ow/oy 发音相同，只是拼写位置不同。",
     items:[
       {label:"ow", ipa:"/aʊ/", word:"cow", zh:"奶牛", tip:"ow 词中词尾都可用（cow/now）；ou 多在词中（house）。"},
       {label:"oy", ipa:"/ɔɪ/", word:"boy", zh:"男孩", tip:"oy 只在词尾（boy/toy）；oi 在词中（coin/voice）。"},
       {label:"ou", ipa:"/aʊ/", word:"house", zh:"房子"},
       {label:"oi", ipa:"/ɔɪ/", word:"coin", zh:"硬币"},
       {label:"au", ipa:"/ɔː/", word:"author", zh:"作者", tip:"au 常发 /ɔː/（美）或 /ɔː/；在 laugh 中 au 发 /ɑː/。"},
       {label:"aw", ipa:"/ɔː/", word:"saw", zh:"看见(过去式)", tip:"aw 几乎总发 /ɔː/，比 au 更规律。"}
     ]},
    {id:"blend", level:"进阶", title:"⑨ 辅音连缀 Blends bl / cl / fl / br / cr / dr / st / sp", note:"两个/三个辅音相邻，各自发音但快速连读，中间不插元音（中文习惯易加 /ə/，要克制）。",
     items:[
       {label:"bl", ipa:"/bl/", word:"blue", zh:"蓝色"},
       {label:"cl", ipa:"/kl/", word:"clap", zh:"拍手"},
       {label:"fl", ipa:"/fl/", word:"flag", zh:"旗帜"},
       {label:"br", ipa:"/br/", word:"brown", zh:"棕色"},
       {label:"st", ipa:"/st/", word:"star", zh:"星星", tip:"s 在词首清辅音前常浊化为 /z/ 的兄弟音，但 star 仍清读。"},
       {label:"sp", ipa:"/sp/", word:"spot", zh:"斑点", tip:"s+p/t/k 在词首，p/t/k 要送气但 s 抢先，整体清脆。"}
     ]},
    {id:"endcluster", level:"进阶", title:"⑩ 词尾辅音组合 -nk / -ng / -nt / -mp / -st", note:"词尾多个辅音拼读，每个音都要发出来，注意鼻音 /ŋ/（舌头顶上颚，不张嘴）。",
     items:[
       {label:"-nk", ipa:"/ŋk/", word:"pink", zh:"粉色"},
       {label:"-ng", ipa:"/ŋ/", word:"ring", zh:"戒指", tip:"-ng 是鼻音 /ŋ/，不要读成 n+ɡ（singer 无ɡ音）。"},
       {label:"-nt", ipa:"/nt/", word:"ant", zh:"蚂蚁"},
       {label:"-mp", ipa:"/mp/", word:"camp", zh:"营地"},
       {label:"-st", ipa:"/st/", word:"fast", zh:"快", tip:"-st 词尾清辅音丛，t 不吐气成 /d/。"}
     ]},
    {id:"soft", level:"进阶", title:"⑪ 软 c / 软 g（c→/s/、g→/dʒ/）", note:"c、g 在 e / i / y 前发软音；否则发硬音 /k/、/ɡ/。口诀：e/i/y 把 c、g 变软。",
     items:[
       {label:"c(软)", ipa:"/s/", word:"city", zh:"城市", tip:"c 在 a/o/u 前发硬音 /k/（cat/cold/cup）。"},
       {label:"c(硬)", ipa:"/k/", word:"cat", zh:"猫"},
       {label:"g(软)", ipa:"/dʒ/", word:"gem", zh:"宝石", tip:"g 在 a/o/u 前发硬音 /ɡ/（go/gum）。"},
       {label:"g(硬)", ipa:"/ɡ/", word:"go", zh:"去"}
     ]},
    {id:"silent", level:"进阶", title:"⑫ 不发音字母 kn / wr / mb / gh", note:"有些字母「只写不读」，见词能读但不必读出每个字母。这些多是历史拼写残留。",
     items:[
       {label:"kn", ipa:"/n/", word:"knife", zh:"刀"},
       {label:"wr", ipa:"/r/", word:"write", zh:"写", tip:"w 在 wr 中不发音（wrong/wrist 同理）。"},
       {label:"mb", ipa:"/m/", word:"lamb", zh:"羔羊", tip:"b 在 mb 词尾不发音（comb/climb 同理）。"},
       {label:"gh", ipa:"/f/", word:"laugh", zh:"笑", tip:"gh 也可完全不发音（through/though）或发 /ɡ/（ghost），最不规则。"}
     ]},
    {id:"suffix", level:"进阶", title:"⑬ 词尾拼写与发音变化 -s / -es / -ies / -ed / -ing", note:"加后缀时，拼写与发音都有规律也有例外。掌握它能正确读出绝大多数派生词。",
     items:[
       {label:"-s / -es", ipa:"/s/ /z/ /ɪz/", word:"cats/dogs/boxes", zh:"复数·三单", tip:"清辅音后 /s/，浊/元音后 /z/，咝音(s,x,ch,sh)后 /ɪz/。"},
       {label:"-ies", ipa:"/iz/", word:"babies", zh:"辅音+y变ies", tip:"辅音+y 变 ies 读 /iz/；元音+y 不变（boys, days）。"},
       {label:"-ed(清)", ipa:"/t/", word:"walked", zh:"过去式", tip:"清辅音后 /t/（looked/liked）。"},
       {label:"-ed(浊)", ipa:"/d/", word:"played", zh:"过去式", tip:"浊/元音后 /d/（rained/called）。"},
       {label:"-ed(t/d后)", ipa:"/ɪd/", word:"wanted", zh:"过去式", tip:"词尾是 t 或 d 时，加 /ɪd/（needed/started）。"},
       {label:"-ing", ipa:"/ɪŋ/", word:"running", zh:"进行时", tip:"双写尾辅音（run→running）防元音变长；ng 读 /ŋ/ 不读 /ŋɡ/。"}
     ]},
    {id:"stress", level:"进阶", title:"⑭ 音节与重音 Syllables & Stress", note:"多音节词的重音位置决定听感。多数两音节「名词前重、动词后重」，同形词因此异读（如 record）。",
     items:[
       {label:"名词前重", ipa:"ˈREcord", word:"record", zh:"唱片/记录(名)", tip:"名词多落第一音节：ˈREcord。"},
       {label:"动词后重", ipa:"reˈCORD", word:"record", zh:"录制(动)", tip:"动词多落第二音节：reˈCORD。形同音异。"},
       {label:"复合名词", ipa:"ˈBLACKbird", word:"blackbird", zh:"黑鸟", tip:"复合名词前重；black bird 两词分读则各自重。"},
       {label:"-tion后缀", ipa:"naˈTION", word:"nation", zh:"国家", tip:"-tion/-sion 等后缀前的音节必重读。"},
       {label:"三音节", ipa:"ˈFAmily", word:"family", zh:"家庭", tip:"常见三音节词重音多在第一音节。"}
     ]}
  ];

  /* ---- 自然拼读进阶练习数据（解码 / 最小对立对 / 拼读句子） ---- */
  var PHONICS_PRACTICE = {
    decode:[
      {word:"stamp", map:["s","t","a","m","p"], note:"st 连缀 + 短元音 a + mp 词尾"},
      {word:"street", map:["s","t","r","ee","t"], note:"str 连缀 + 长元音 ee + t"},
      {word:"shine", map:["sh","i","_e"], note:"sh 连缀 + 魔法 e（i 发长音 /aɪ/）"},
      {word:"clock", map:["c","l","o","ck"], note:"cl 连缀 + 短元音 o + ck"},
      {word:"train", map:["t","r","ai","n"], note:"tr 连缀 + 长元音 ai + n"},
      {word:"plant", map:["pl","a","n","t"], note:"pl 连缀 + 短元音 a + nt"},
      {word:"phrase", map:["ph","r","a","se"], note:"ph(/f/) + r + a + se"},
      {word:"thumb", map:["th","u","m","b"], note:"th + 短元音 u + mb(不发音)"},
      {word:"splash", map:["s","pl","a","sh"], note:"spl 三连缀 + 短元音 a + sh"},
      {word:"spring", map:["s","pr","i","ng"], note:"spr 连缀 + 短元音 i + ng(鼻音)"},
      {word:"blend", map:["bl","e","nd"], note:"bl 连缀 + 短元音 e + nd 词尾"},
      {word:"fresh", map:["fr","e","sh"], note:"fr 连缀 + 短元音 e + sh"},
      {word:"strange", map:["str","a","ng","e"], note:"str 连缀 + 短元音 a + ng + 魔法 e"},
      {word:"crisp", map:["cr","i","sp"], note:"cr 连缀 + 短元音 i + sp 词尾"}
    ],
    minPairs:[
      {a:"ship", b:"sheep", tip:"/ɪ/ 短 vs /iː/ 长：ship 船 / sheep 羊"},
      {a:"cat", b:"cut", tip:"/æ/ 张大嘴 vs /ʌ/ 放松"},
      {a:"bad", b:"bed", tip:"/æ/ vs /e/"},
      {a:"live", b:"leave", tip:"/ɪ/ 短 vs /iː/ 长：live 住 / leave 离开"},
      {a:"cot", b:"caught", tip:"/ɒ/ vs /ɔː/(卷舌)"},
      {a:"thin", b:"thing", tip:"/n/ vs /ŋ/(鼻音)"},
      {a:"rice", b:"rise", tip:"/s/ vs /z/：米饭 / 升起"},
      {a:"bet", b:"bat", tip:"/e/ vs /æ/"},
      {a:"cap", b:"cup", tip:"/æ/ vs /ʌ/：帽子 / 杯子"},
      {a:"pin", b:"pen", tip:"/ɪ/ vs /e/：针 / 钢笔"},
      {a:"full", b:"fool", tip:"/ʊ/ 短 vs /uː/ 长：满的 / 傻的"},
      {a:"walk", b:"work", tip:"/ɔː/ vs /ɜː/(卷舌 r)"},
      {a:"leaf", b:"leave", tip:"名词 leaf 叶 / 动词 leave 离开，元音同长音"},
      {a:"heat", b:"hit", tip:"/iː/ 长 vs /ɪ/ 短：热 / 打中"}
    ],
    sentences:[
      "The black cat sat on a red mat.",
      "We like to ride our bikes in the sun.",
      "She made a cake and ate it by the lake.",
      "A small frog jumped from the green leaf.",
      "Bring the brown bread and three fresh eggs.",
      "The brave knight brought bright light to the night.",
      "Spring brings fresh plants and pleasant scents.",
      "Clean the clock and check the chalk on the desk.",
      "A wise whale swam past the white wave at night.",
      "Please play the piano and paint a plain plane."
    ]
  };

  /* ---- 背诵打卡材料库：提炼的成人零基础核心资料（可继续补充） ---- */
  var ZERO_BASIS = [
    {cat:"日常问候", title:"见面与告别", zh:"最常用寒暄", body:"Hi / Hello（你好）· Good morning / afternoon / evening（早/下/晚好）· How are you? — I'm fine, thanks. And you?（最近好吗？— 挺好，谢谢。你呢？）· Nice to meet you.（很高兴认识你）· See you / Bye（再见）· Take care.（保重）· So long.（回头见，较随意）"},
    {cat:"日常问候", title:"礼貌用语", zh:"处处用得上的客气话", body:"Please（请）· Thank you / Thanks（谢谢）· You're welcome（不客气）· Sorry / Excuse me（抱歉/打扰一下）· May I...?（我可以……吗？）· Pardon?（请再说一遍）· It's very kind of you.（你太好了）"},
    {cat:"数字时间", title:"数字 0–100", zh:"点餐、问价、约时间都用", body:"0 zero · 1 one · 10 ten · 11 eleven · 12 twelve（无规律要背）· 13–19 以 -teen 结尾（thirteen/fourteen…）· 20 twenty · 21 twenty-one（连字符）· 50 fifty · 100 one hundred。百位+and+十位：one hundred and five（105）。"},
    {cat:"数字时间", title:"时间与日期", zh:"约时间与看懂时刻", body:"What time is it?（几点了？）· It's 3 pm / 15:00（下午三点，12小时制加 am/pm）· Monday–Sunday（周一到周日）· today / tomorrow / yesterday（今天/明天/昨天）· January–December（1–12月）· What's the date today?（今天几号？）"},
    {cat:"购物消费", title:"逛店与买单", zh:"买东西全流程", body:"How much is this?（这个多少钱？）· I'll take it.（我要这个）· Do you have a discount?（有折扣吗？）· Where is the fitting room?（试衣间在哪？）· It's too expensive.（太贵了）· Can I have a smaller size?（有更小码吗？）"},
    {cat:"购物消费", title:"支付方式", zh:"付款常用语", body:"Cash or card?（现金还是刷卡？）· I'll pay by card / Alipay / WeChat.（我刷卡/支付宝/微信）· Can I get a receipt?（能开发票/收据吗？）· Keep the change.（不用找了）· Is tax included?（含税吗？）"},
    {cat:"问路出行", title:"问路与指路", zh:"出门不迷路", body:"Where is the station?（车站在哪？）· Go straight.（直走）· Turn left / right.（左/右转）· It's next to the bank.（在银行旁边）· How far is it?（有多远？）· Is it within walking distance?（走路能到吗？）"},
    {cat:"问路出行", title:"交通出行", zh:"搭车与购票", body:"I'd like a ticket to...（我要一张去…的票）· Where should I transfer?（在哪换乘？）· Is this seat taken?（这座位有人吗？）· The train is delayed / canceled.（火车晚点/取消了）· Which platform?（几号站台？）"},
    {cat:"餐饮美食", title:"点餐", zh:"餐厅用语", body:"A table for two, please.（两位）· Can I see the menu?（看下菜单）· I'm allergic to...（我对…过敏）· The bill, please.（买单）· It's delicious.（很好吃）· Could we have the check?（能结账吗？较正式）"},
    {cat:"餐饮美食", title:"咖啡与外卖", zh:"轻食场景", body:"A latte, please.（一杯拿铁）· For here or to go?（堂食还是外带？）· Not too sweet.（不要太甜）· Delivery, please.（请外送）· Extra hot / no ice.（烫一点/去冰）"},
    {cat:"天气季节", title:"聊天气", zh:"万能开场白", body:"It's sunny / rainy / windy / cloudy / snowy.（晴/雨/有风/阴/雪）· What's the weather like?（天气怎样？）· It's getting cold / warm.（变冷/变暖）· Spring / Summer / Autumn / Winter（春夏秋冬）· The forecast says...（预报说…）"},
    {cat:"自我介绍", title:"认识新朋友", zh:"三句说清自己", body:"My name is...（我叫…）· I'm from...（我来自…）· I work as a...（我是做…的）· I like...（我喜欢…）· Nice to meet you.（幸会）· I'm a beginner in English.（我英语刚入门）"},
    {cat:"自我介绍", title:"工作与家庭", zh:"自然展开话题", body:"What do you do?（你做什么工作？）· I have a big / small family.（我有个大/小家庭）· This is my son / daughter.（这是我儿子/女儿）· Where are you from?（你哪儿人？）· How long have you been here?（你在这多久了？）"},
    {cat:"应急求助", title:"遇到困难", zh:"安全第一", body:"Help!（救命）· Call the police / doctor.（叫警察/医生）· I lost my phone / wallet.（我手机/钱包丢了）· Where is the hospital?（医院在哪？）· I don't feel well.（我不舒服）· I need help, please.（我需要帮助）"},
    {cat:"应急求助", title:"电话与沟通", zh:"说不清时这样说", body:"Could you repeat that?（能重复一遍吗？）· Please speak slowly.（请说慢点）· I don't understand.（我不懂）· Do you speak Chinese?（你会中文吗？）· Can you write it down?（能写下来吗？）"},
    {cat:"金钱与银行", title:"换钱与取现", zh:"出行财务必备", body:"Where can I exchange money?（哪能换钱？）· I'd like to withdraw cash.（我想取现）· What's the exchange rate?（汇率多少？）· Is there an ATM nearby?（附近有取款机吗？）· I need to change a 100-dollar bill.（我得破开一张百元钞）"},
    {cat:"健康就医", title:"挂号与症状", zh:"身体不舒服这样说", body:"I need to see a doctor.（我得看医生）· I have a fever / cough / headache.（我发烧/咳嗽/头疼）· Where's the pharmacy?（药店在哪？）· Do I need an appointment?（要预约吗？）· How often should I take this medicine?（这药多久吃一次？）"},
    {cat:"邮件与办公", title:"发邮件与会议", zh:"职场基础沟通", body:"I'll send you an email.（我发邮件给你）· Please find the attachment.（见附件）· Let's set up a meeting.（我们约个会）· Could you cc me?（抄送我一份）· Sorry for the late reply.（抱歉回复晚了）· I'm on a call now.（我正在通话）"},
    {cat:"住宿与居家", title:"住店与家务", zh:"安顿与日常", body:"I'd like to check in / out.（我要入住/退房）· The Wi-Fi isn't working.（WiFi 连不上）· Could you clean the room?（能打扫房间吗？）· I need an extra blanket.（我多加条被子）· The light is broken.（灯坏了）"}
  ];

  /* ---- 900句玩转英语：实用口语短句 + 情景对话（每条附中文释义） ---- */
  var SENTENCE_BANK = [
    {cat:"日常问候与寒暄", items:[
      {en:"Hi, how are you doing?", zh:"嗨，最近怎么样？"},
      {en:"I'm doing great, thanks.", zh:"我挺好的，谢谢。"},
      {en:"Long time no see!", zh:"好久不见！"},
      {en:"What's up?", zh:"怎么了？/ 最近忙啥？"},
      {en:"Not much, just busy.", zh:"没什么，就是有点忙。"},
      {en:"Good to see you again.", zh:"很高兴又见到你。"},
      {en:"Have a nice day!", zh:"祝你今天愉快！"},
      {en:"Take care!", zh:"保重！"},
      {en:"See you later.", zh:"回头见。"},
      {en:"How's everything going?", zh:"一切都还顺利吗？"},
      {en:"How have you been?", zh:"你最近过得好吗？", tip:"been 用现在完成时，问『一直以来』的状态。"},
      {en:"Same as usual.", zh:"老样子。"},
      {en:"Can't complain.", zh:"没什么好抱怨的（挺好）。"},
      {en:"It's been a while.", zh:"有一阵子了（好久）。"}
    ], dialog:[
      {sp:"A", en:"Hey Sarah, long time no see!", zh:"嘿 Sarah，好久不见！"},
      {sp:"B", en:"Hi! Yeah, how have you been?", zh:"嗨！是啊，你最近好吗？"},
      {sp:"A", en:"Pretty good, just busy with work.", zh:"挺好的，就是工作有点忙。"},
      {sp:"B", en:"Same here. Let's catch up soon.", zh:"我也是。咱们改天聊聊。"}
    ]},
    {cat:"自我介绍与交友", items:[
      {en:"My name is Lin. Just call me Lin.", zh:"我叫林，叫我林就行。"},
      {en:"I'm from Shanghai.", zh:"我来自上海。"},
      {en:"I work in IT.", zh:"我做 IT 相关的工作。"},
      {en:"I'm into photography.", zh:"我热爱摄影。"},
      {en:"What do you do for fun?", zh:"你平时喜欢做什么？"},
      {en:"Nice to meet you.", zh:"幸会。"},
      {en:"Where are you from?", zh:"你来自哪里？"},
      {en:"I've lived here for three years.", zh:"我在这儿住了三年了。"},
      {en:"Let's exchange contacts.", zh:"咱们交换下联系方式吧。"},
      {en:"We should hang out sometime.", zh:"我们改天聚聚。"},
      {en:"I'm a beginner in English.", zh:"我英语刚入门。", tip:"beginner 名词/形容词同形，前用 a。"},
      {en:"I enjoy cooking in my free time.", zh:"空闲时我喜欢做饭。"},
      {en:"What brings you here?", zh:"什么风把你吹来了？（为何来这）"},
      {en:"I'd love to keep in touch.", zh:"我希望保持联系。"}
    ]},
    {cat:"购物与砍价", items:[
      {en:"How much is this?", zh:"这个多少钱？"},
      {en:"Can I get a discount?", zh:"能便宜点吗？"},
      {en:"That's a bit too expensive.", zh:"有点太贵了。"},
      {en:"Do you have this in blue?", zh:"这个有蓝色的吗？"},
      {en:"I'll take two.", zh:"我要两个。"},
      {en:"Is this on sale?", zh:"这个在打折吗？"},
      {en:"Where's the checkout?", zh:"结账处在哪？"},
      {en:"Can I try it on?", zh:"我能试穿吗？"},
      {en:"Keep the change.", zh:"不用找了。"},
      {en:"Could you wrap it as a gift?", zh:"能包装成礼物吗？"},
      {en:"Do you have a larger size?", zh:"有更大码吗？", tip:"size 用 larger/smaller，不用 more big。"},
      {en:"Is this returnable?", zh:"这个能退吗？"},
      {en:"I'm just browsing, thanks.", zh:"我就随便看看，谢谢。"},
      {en:"That's a steal!", zh:"太划算了！（像白捡）"}
    ]},
    {cat:"餐厅与咖啡", items:[
      {en:"A table for two, please.", zh:"两位，谢谢。"},
      {en:"Could I see the menu?", zh:"能看一下菜单吗？"},
      {en:"What do you recommend?", zh:"你有什么推荐？"},
      {en:"I'm allergic to peanuts.", zh:"我对花生过敏。"},
      {en:"The bill, please.", zh:"买单。"},
      {en:"It's delicious!", zh:"很好吃！"},
      {en:"I'll have a latte, please.", zh:"我要一杯拿铁。"},
      {en:"For here or to go?", zh:"堂食还是外带？"},
      {en:"Not too sweet, thanks.", zh:"不要太甜，谢谢。"},
      {en:"Could we get some water?", zh:"能给我们点水吗？"},
      {en:"Could I have the check, please?", zh:"能结账吗？", tip:"check 在美式也指账单（= bill）。"},
      {en:"Make it to go, please.", zh:"打包带走。"},
      {en:"The food is amazing.", zh:"这食物太棒了。"},
      {en:"I'm full, thank you.", zh:"我吃饱了，谢谢。"}
    ], dialog:[
      {sp:"A", en:"A table for two, please.", zh:"两位，谢谢。"},
      {sp:"B", en:"Sure, follow me. Here's the menu.", zh:"好的，跟我来。这是菜单。"},
      {sp:"A", en:"What do you recommend?", zh:"你有什么推荐？"},
      {sp:"B", en:"The steak is popular today.", zh:"今天的牛排很受欢迎。"},
      {sp:"A", en:"Great, I'll have that. The bill later.", zh:"好，我要那个，稍后买单。"}
    ]},
    {cat:"问路与交通", items:[
      {en:"Excuse me, where is the subway?", zh:"请问地铁站在哪？"},
      {en:"How do I get to the museum?", zh:"怎么去博物馆？"},
      {en:"Go straight and turn left.", zh:"直走然后左转。"},
      {en:"Is it far from here?", zh:"离这儿远吗？"},
      {en:"How long does it take?", zh:"要花多长时间？"},
      {en:"Where should I transfer?", zh:"我该在哪换乘？"},
      {en:"A ticket to the airport, please.", zh:"一张去机场的票。"},
      {en:"Does this bus go downtown?", zh:"这趟公交去市中心吗？"},
      {en:"The next stop is ours.", zh:"下一站是我们下。"},
      {en:"Can you show me on the map?", zh:"能在地图上指给我看吗？"},
      {en:"Which exit should I take?", zh:"我从哪个出口出？", tip:"exit 名词『出口』，动词『退出』同形。"},
      {en:"Is there a shortcut?", zh:"有近道吗？"},
      {en:"I got lost, can you help?", zh:"我迷路了，能帮忙吗？"},
      {en:"It's on the left / right.", zh:"在左边/右边。"}
    ], dialog:[
      {sp:"A", en:"Excuse me, how do I get to the museum?", zh:"请问怎么去博物馆？"},
      {sp:"B", en:"Go straight, then turn left at the corner.", zh:"直走，然后在拐角左转。"},
      {sp:"A", en:"Is it far from here?", zh:"离这儿远吗？"},
      {sp:"B", en:"About a five-minute walk. You'll see it.", zh:"走路大概五分钟，你就能看到。"}
    ]},
    {cat:"电话与沟通", items:[
      {en:"Hello, may I speak to Tom?", zh:"你好，能找一下汤姆吗？"},
      {en:"He's not available right now.", zh:"他现在不方便接电话。"},
      {en:"Can I take a message?", zh:"要我捎个口信吗？"},
      {en:"Please call me back.", zh:"请给我回电话。"},
      {en:"Could you repeat that?", zh:"能重复一遍吗？"},
      {en:"Sorry, I didn't catch that.", zh:"抱歉，我没听清。"},
      {en:"Let's talk later.", zh:"我们晚点再说。"},
      {en:"I'll text you the details.", zh:"我把细节发短信给你。"},
      {en:"What's your number?", zh:"你的号码是多少？"},
      {en:"Speak slowly, please.", zh:"请说慢一点。"},
      {en:"You're breaking up.", zh:"你声音断断续续。（信号差）", tip:"break up 此处指通话中断，非『分手』。"},
      {en:"Let me call you back.", zh:"我打回给你。"},
      {en:"Hold on a second.", zh:"稍等一下。"},
      {en:"Wrong number, sorry.", zh:"打错了，抱歉。"}
    ]},
    {cat:"工作与职场", items:[
      {en:"Let's start the meeting.", zh:"我们开始开会吧。"},
      {en:"What's the deadline?", zh:"截止日期是什么时候？"},
      {en:"I'll send the report today.", zh:"我今天把报告发过去。"},
      {en:"Good job on the project!", zh:"这个项目做得好！"},
      {en:"Can you help me with this?", zh:"能帮我弄下这个吗？"},
      {en:"Let's schedule a call.", zh:"我们约个电话会议吧。"},
      {en:"I'm behind on my tasks.", zh:"我的任务有点滞后了。"},
      {en:"Could you clarify this point?", zh:"能解释下这点吗？"},
      {en:"We're on the same page.", zh:"我们想法一致。"},
      {en:"Let's follow up next week.", zh:"我们下周跟进。"},
      {en:"I'll loop you in the email.", zh:"我把你加进邮件抄送。"},
      {en:"Sorry for the delay.", zh:"抱歉耽误了。"},
      {en:"Let's touch base tomorrow.", zh:"明天碰个头。"},
      {en:"I'll take it from here.", zh:"接下来交给我吧。"}
    ]},
    {cat:"天气与季节", items:[
      {en:"It's a beautiful day.", zh:"今天天气真好。"},
      {en:"It's pouring outside.", zh:"外面下着大雨。"},
      {en:"I hope it stops raining.", zh:"希望雨停。"},
      {en:"It's freezing today.", zh:"今天冷死了。"},
      {en:"The forecast says snow.", zh:"天气预报说有雪。"},
      {en:"Spring is my favorite season.", zh:"春天是我最喜欢的季节。"},
      {en:"How's the weather there?", zh:"你那边天气怎样？"},
      {en:"Don't forget your umbrella.", zh:"别忘了带伞。"},
      {en:"The wind is so strong.", zh:"风好大。"},
      {en:"Perfect weather for a walk.", zh:"这种天气散步最合适。"},
      {en:"It's humid today.", zh:"今天很闷湿。"},
      {en:"The sky is clearing up.", zh:"天放晴了。"},
      {en:"It's supposed to rain later.", zh:"据说明后会儿要下雨。"},
      {en:"I love the autumn breeze.", zh:"我喜欢秋日的微风。"}
    ]},
    {cat:"旅行与住宿", items:[
      {en:"I'd like to check in, please.", zh:"我要办理入住。"},
      {en:"Do you have a reservation?", zh:"您有预订吗？"},
      {en:"What time is breakfast?", zh:"早餐几点开始？"},
      {en:"Where's the elevator?", zh:"电梯在哪？"},
      {en:"Can I get an extra towel?", zh:"能多给我一条毛巾吗？"},
      {en:"Is breakfast included?", zh:"含早餐吗？"},
      {en:"How do I get to the beach?", zh:"怎么去海滩？"},
      {en:"I'd like to extend my stay.", zh:"我想续住。"},
      {en:"Where can I store my luggage?", zh:"行李能寄存在哪？"},
      {en:"The view is amazing!", zh:"风景太棒了！"},
      {en:"Is Wi-Fi free here?", zh:"这 WiFi 免费吗？"},
      {en:"Could I get a late checkout?", zh:"能延迟退房吗？"},
      {en:"Where's the nearest metro?", zh:"最近地铁在哪？"},
      {en:"I'd like a window seat.", zh:"我想要靠窗位。"}
    ]},
    {cat:"情感与社交", items:[
      {en:"I'm so happy for you!", zh:"我真为你高兴！"},
      {en:"That sounds terrible.", zh:"听起来好糟。"},
      {en:"I'm really sorry to hear that.", zh:"听到这个我很难过。"},
      {en:"You can do it!", zh:"你一定行！"},
      {en:"No worries, it happens.", zh:"别担心，常有的事。"},
      {en:"I totally agree.", zh:"我完全同意。"},
      {en:"That means a lot to me.", zh:"这对我意义重大。"},
      {en:"Let's celebrate!", zh:"我们庆祝一下吧！"},
      {en:"I'm a little nervous.", zh:"我有点紧张。"},
      {en:"Thanks for being there.", zh:"谢谢你一直都在。"},
      {en:"I'm so proud of you.", zh:"我真为你骄傲。"},
      {en:"Don't be too hard on yourself.", zh:"别对自己太苛刻。"},
      {en:"I feel you.", zh:"我懂你（感同身受）。", tip:"口语省略 feel for you，表共情。"},
      {en:"We'll get through this.", zh:"我们会熬过去的。"}
    ]},
    {cat:"家庭与健康", items:[
      {en:"How's your family?", zh:"你家人们都好吗？"},
      {en:"I have a headache.", zh:"我头疼。"},
      {en:"I need to see a doctor.", zh:"我得看医生。"},
      {en:"Take your medicine on time.", zh:"按时吃药。"},
      {en:"Get well soon.", zh:"祝你早日康复。"},
      {en:"We're having a family dinner.", zh:"我们要吃家庭聚餐。"},
      {en:"My daughter loves painting.", zh:"我女儿喜欢画画。"},
      {en:"Don't stay up too late.", zh:"别熬夜太晚。"},
      {en:"Did you eat well?", zh:"你吃得好吗？"},
      {en:"Rest is important.", zh:"休息很重要。"},
      {en:"I caught a cold.", zh:"我感冒了。", tip:"catch a cold 用 catch，不用 have。"},
      {en:"Drink plenty of water.", zh:"多喝水。"},
      {en:"An apple a day keeps the doctor away.", zh:"一天一苹果，医生远离我。"},
      {en:"Mental health matters.", zh:"心理健康也很重要。"}
    ]},
    {cat:"应急与求助", items:[
      {en:"Help! Call the police!", zh:"救命！叫警察！"},
      {en:"I lost my wallet.", zh:"我钱包丢了。"},
      {en:"Where is the hospital?", zh:"医院在哪？"},
      {en:"I don't feel safe here.", zh:"我在这里感觉不安全。"},
      {en:"Can you help me, please?", zh:"能帮帮我吗？"},
      {en:"I missed my train.", zh:"我错过火车了。"},
      {en:"My phone is dead.", zh:"我手机没电了。"},
      {en:"Is there a pharmacy nearby?", zh:"附近有药店吗？"},
      {en:"I need to find a restroom.", zh:"我得找厕所。"},
      {en:"Please speak Chinese.", zh:"请说中文。"},
      {en:"I've been robbed!", zh:"我遭抢了！", tip:"rob 人/地用 rob；steal 物用 steal。"},
      {en:"Where's the nearest exit?", zh:"最近出口在哪？"},
      {en:"I need an ambulance.", zh:"我需要救护车。"},
      {en:"Keep calm and call 110.", zh:"保持冷静并拨打 110。"}
    ]},
    {cat:"委婉拒绝与请求", items:[
      {en:"I'd love to, but I'm tied up.", zh:"我很想去，但我抽不开身。"},
      {en:"Maybe another time?", zh:"改天好吗？"},
      {en:"I'm not sure I can commit to that.", zh:"我不确定能否答应。"},
      {en:"Could I bother you for a favor?", zh:"能麻烦你帮个忙吗？", tip:"bother 此处是客气说法，非『打扰』贬义。"},
      {en:"I hate to say no, but...", zh:"我不想拒绝，但是……"},
      {en:"Let me check my schedule.", zh:"我看一下日程。"},
      {en:"I'll have to pass on this one.", zh:"这个我就先不参加了。"},
      {en:"Do you mind if I...?", zh:"你介意我……吗？"},
      {en:"I'm afraid I can't make it.", zh:"恐怕我来不了。", tip:"I'm afraid 表『恐怕』，非『害怕』。"},
      {en:"Thanks for thinking of me.", zh:"谢谢你想到我。"}
    ]},
    {cat:"意见与建议进阶", items:[
      {en:"In my opinion, we should wait.", zh:"依我看，我们该等等。"},
      {en:"Have you considered...?", zh:"你考虑过……吗？"},
      {en:"I see your point, but...", zh:"我明白你的意思，不过……"},
      {en:"That makes sense to me.", zh:"我觉得有道理。"},
      {en:"Why not give it a try?", zh:"何不试一下？"},
      {en:"I'd suggest starting small.", zh:"我建议从小处着手。"},
      {en:"There's room for improvement.", zh:"还有提升空间。（委婉说不够好）"},
      {en:"Let's hear both sides.", zh:"我们听听双方意见。"},
      {en:"I'm torn between the two.", zh:"我两者间犹豫不决。", tip:"torn 原意『被撕开』，表纠结。"},
      {en:"That's worth considering.", zh:"那值得考虑。"}
    ]},
    {cat:"面试与求职", items:[
      {en:"Could you tell me about the role?", zh:"能介绍下这个岗位吗？"},
      {en:"I'm a quick learner.", zh:"我学东西很快。"},
      {en:"My strength is problem-solving.", zh:"我的优势是解决问题。"},
      {en:"I work well under pressure.", zh:"我抗压能力不错。"},
      {en:"Where do you see yourself in five years?", zh:"五年后你想成为什么？"},
      {en:"What are your salary expectations?", zh:"你的薪资期望是多少？"},
      {en:"I'm a good team player.", zh:"我善于团队合作。"},
      {en:"I'm eager to learn and grow.", zh:"我渴望学习成长。"},
      {en:"Thank you for your time.", zh:"感谢您的时间。"},
      {en:"When can I expect feedback?", zh:"大概什么时候有反馈？", tip:"feedback 不可数，不说 a feedback。"}
    ]},
    {cat:"网络与科技", items:[
      {en:"The Wi-Fi is laggy.", zh:"WiFi 卡顿。"},
      {en:"Can you share the link?", zh:"能发我链接吗？"},
      {en:"I'll screenshot it.", zh:"我截个图。"},
      {en:"Restart the router, maybe?", zh:"要不重启下路由器？"},
      {en:"The app crashed again.", zh:"这 App 又崩了。"},
      {en:"Did you back it up?", zh:"你备份了吗？", tip:"back up 动词分开写；名词 backup 连写。"},
      {en:"Turn on bluetooth, please.", zh:"请开下蓝牙。"},
      {en:"The battery is dying.", zh:"电量快没了。"},
      {en:"Let me google it.", zh:"我搜一下。"},
      {en:"Update to the latest version.", zh:"更新到最新版本。"}
    ]},
    {cat:"健身与运动", items:[
      {en:"Let's hit the gym.", zh:"我们去健身吧。"},
      {en:"I go for a run every morning.", zh:"我每天早晨跑步。"},
      {en:"Warm up before you stretch.", zh:"拉伸前先热身。"},
      {en:"Stay hydrated.", zh:"多喝水保持水分。"},
      {en:"Let's do some yoga.", zh:"我们练下瑜伽。"},
      {en:"I pulled a muscle.", zh:"我拉伤肌肉了。", tip:"pull a muscle 固定搭配，非 draw。"},
      {en:"Count to three and lift.", zh:"数到三再举。"},
      {en:"Let's cool down now.", zh:"我们做下放松。"},
      {en:"I feel sore all over.", zh:"我浑身酸痛。"},
      {en:"Consistency is key.", zh:"坚持是关键。"}
    ]}
  ];

  /* ---- 听力样段（供听力训练默认文本，也被统一词库聚合） ---- */
  var LISTEN_SAMPLES = [
    "The course starts on the fifteenth of March and lasts for six weeks. Students should complete the online quiz before each Friday. The library opens at nine in the morning from Monday to Saturday. If you have any questions, please contact the student center by email.",
    "When I was a child, I wanted to become a teacher. My mother told me that education was the most important thing in life. Now I work at a school and I love my job very much.",
    "Hello. My name is Anna. I am a student. I like apples and bananas. I go to school every day. My favorite color is blue. We have a small dog at home. His name is Max.",
    "Our team will launch the new product next Monday. Please prepare the slides and send them to the manager before Friday. We can discuss the feedback during the weekly meeting. Let me know if you need help.",
    "Welcome to the city. The train station is on your left. You can buy a day ticket at the counter. The museum opens at nine and closes at five. The restaurant next to it serves good local food.",
    "Climate change affects weather patterns around the world. Scientists agree that we must reduce emissions. Many countries are investing in clean energy. Small daily habits, like saving water, also make a difference."
  ];

  /* ---- 专业术语库：职场/金融/科技/学术/医疗/法律/正式生活用语（含示例·说明·边界情况） ---- */
  var PRO_TERMS = [
    {cat:"职场商务", en:"stakeholder", phon:"/ˈsteɪkhoʊldər/", zh:"利益相关方", example:"We should update all stakeholders.", explain:"指受决策或项目影响的各方（股东、客户、员工、监管方等），不单是『股东』。", edge:"易误写为 stake holder（分开写）；作名词，无动词用法。"},
    {cat:"职场商务", en:"deliverable", phon:"/dɪˈlɪvərəbəl/", zh:"交付物", example:"The first deliverable is due Friday.", explain:"项目中须按时交付的具体成果（文档、原型、报告等）。", edge:"作名词；不要当动词用（不说 deliverable it）。"},
    {cat:"职场商务", en:"leverage", phon:"/ˈlevərɪdʒ/", zh:"利用、杠杆", example:"We can leverage our data.", explain:"原意『杠杆』，商务口语中常作动词，意为『充分利用（资源/优势）』。", edge:"偏口语化商务英语，正式学术写作慎用，改用 utilize。"},
    {cat:"职场商务", en:"bandwidth", phon:"/ˈbændwɪdθ/", zh:"精力、带宽", example:"I don't have the bandwidth now.", explain:"原指网络带宽，职场引申为『时间/精力上限』。", edge:"比喻用法，正式会议或文书中避免，改用 capacity / availability。"},
    {cat:"职场商务", en:"circle back", phon:"/ˈsɜːrkəl bæk/", zh:"回头再议", example:"Let's circle back next week.", explain:"美式职场行话，指稍后重新讨论某话题。", edge:"略显套路化，正式场合用 revisit / follow up 更稳妥。"},
    {cat:"金融财务", en:"inflation", phon:"/ɪnˈfleɪʃən/", zh:"通货膨胀", example:"Inflation rose to three percent.", explain:"整体物价水平持续上涨、货币购买力下降的现象。", edge:"反义词 deflation（通货紧缩）；注意拼写带 -tion。"},
    {cat:"金融财务", en:"liquidity", phon:"/lɪˈkwɪdəti/", zh:"流动性", example:"The firm lacks short-term liquidity.", explain:"资产变现的难易与速度，越高越容易换成现金。", edge:"≠ 液体（liquid）；常作不可数名词。"},
    {cat:"金融财务", en:"portfolio", phon:"/pɔːrtˈfoʊlioʊ/", zh:"投资组合；作品集", example:"Diversify your investment portfolio.", explain:"投资标的总和，或设计师/简历中的作品集合。", edge:"重音在 fo；复数 portfolios。"},
    {cat:"金融财务", en:"hedge", phon:"/hedʒ/", zh:"对冲、避险", example:"We hedge against currency risk.", explain:"通过反向操作降低潜在损失的策略。", edge:"可作动词（hedge）与名词（a hedge）。"},
    {cat:"科技互联网", en:"algorithm", phon:"/ˈælɡərɪðəm/", zh:"算法", example:"The recommendation algorithm changed.", explain:"解决某类问题的明确步骤集合，是程序的核心逻辑。", edge:"重音在第一音节 al-；复数 algorithms。"},
    {cat:"科技互联网", en:"cache", phon:"/kæʃ/", zh:"缓存", example:"Clear the browser cache.", explain:"高速临时存储层，加速重复读取。", edge:"读 /kæʃ/，不读 /keɪʃ/；名词动词同形。"},
    {cat:"科技互联网", en:"open source", phon:"/ˈoʊpən sɔːrs/", zh:"开源", example:"This is open source software.", explain:"源代码公开、可自由查看与修改的软件模式。", edge:"两词；相对词 proprietary（闭源）。"},
    {cat:"科技互联网", en:"deploy", phon:"/dɪˈplɔɪ/", zh:"部署、上线", example:"We deploy every Friday.", explain:"把代码/服务发布到生产环境。", edge:"原意『派遣』；名词 deployment。"},
    {cat:"科技互联网", en:"scalable", phon:"/ˈskeɪləbəl/", zh:"可扩展的", example:"Build a scalable system.", explain:"能随用户量或数据量增长而不崩的架构特性。", edge:"≠ scale（名词『规模』）；后缀 -able 表『可…』。"},
    {cat:"学术写作", en:"hypothesis", phon:"/haɪˈpɑːθəsɪs/", zh:"假设", example:"Our hypothesis predicts a positive effect.", explain:"待通过实验/数据验证的命题。", edge:"复数 hypotheses（改 -is 为 -es）；形容词 hypothetical。"},
    {cat:"学术写作", en:"methodology", phon:"/ˌmeθəˈdɑːlədʒi/", zh:"方法论", example:"The methodology is clearly described.", explain:"研究采用的方法体系与依据。", edge:"重音在 o（me-tho-DOL-o-gy）；区别于 method（单一方法）。"},
    {cat:"学术写作", en:"peer review", phon:"/pɪr rɪˈvjuː/", zh:"同行评审", example:"The paper passed peer review.", explain:"由同领域专家互审质量与严谨性的流程。", edge:"两词；peer 指『同辈/同行』，非『同龄人』特指。"},
    {cat:"学术写作", en:"correlation", phon:"/ˌkɔːrəˈleɪʃən/", zh:"相关性", example:"There is a strong correlation.", explain:"两变量同时变化的统计关系。", edge:"≠ causation（因果）；相关不代表因果，是最常见误读。"},
    {cat:"学术写作", en:"abstract", phon:"/ˈæbstrækt/", zh:"摘要；抽象的", example:"Read the abstract first.", explain:"论文开篇对全文的浓缩概括；作形容词指『抽象的』。", edge:"名词/形容词同形异义；动词抽象化读 /əbˈstrækt/。"},
    {cat:"医疗健康", en:"prescription", phon:"/prɪˈskrɪpʃən/", zh:"处方", example:"Take this prescription to the pharmacy.", explain:"医生开具、药师配发的用药单。", edge:"重音在 scrip；动词 prescribe，名词 prescriber（开处方者）。"},
    {cat:"医疗健康", en:"symptom", phon:"/ˈsɪmptəm/", zh:"症状", example:"What are your symptoms?", explain:"疾病在外表现出的迹象（咳嗽、发热等）。", edge:"≠ syndrome（综合征，一组症状的集合）。"},
    {cat:"医疗健康", en:"chronic", phon:"/ˈkrɑːnɪk/", zh:"慢性的", example:"He has a chronic condition.", explain:"长期持续、难一朝治愈的状态。", edge:"反义 acute（急性的）；勿拼成 cronical。"},
    {cat:"医疗健康", en:"allergic", phon:"/əˈlɜːrdʒɪk/", zh:"过敏的", example:"I'm allergic to nuts.", explain:"免疫系统对特定物质过度反应。", edge:"后接 to，不接 with；名词 allergy。"},
    {cat:"法律合同", en:"liability", phon:"/ˌlaɪəˈbɪləti/", zh:"责任；负债", example:"limited liability company", explain:"法律上须承担的义务，或财报中的债务项。", edge:"≠ ability（能力）；复数 liabilities。"},
    {cat:"法律合同", en:"breach", phon:"/briːtʃ/", zh:"违约；违反", example:"breach of contract", explain:"违背合同条款或义务。", edge:"名词、动词同形；常见搭配 breach of contract / breach of duty。"},
    {cat:"法律合同", en:"jurisdiction", phon:"/ˌdʒʊrɪsˈdɪkʃən/", zh:"管辖权", example:"It's outside our jurisdiction.", explain:"司法或管理可行使权力的范围。", edge:"长词，重音在 dic；形容词 jurisdictional。"},
    {cat:"法律合同", en:"terminate", phon:"/ˈtɜːrmɪneɪt/", zh:"终止", example:"terminate the agreement", explain:"提前或按期结束合同/关系。", edge:"≠ terminal（终端/末端的）；名词 termination。"},
    {cat:"生活正式", en:"approximately", phon:"/əˈprɑːksɪmətli/", zh:"大约、近似", example:"Arrive approximately at eight.", explain:"正式语体的『大概』，比 about 更书面。", edge:"口语直接用 about / around 即可。"},
    {cat:"生活正式", en:"prior to", phon:"/ˈpraɪər tuː/", zh:"在……之前", example:"Prior to the meeting, read the file.", explain:"正式书面『在…前』，等于 before 但更正式。", edge:"后接名词/动名词，不接完整句子；勿与 previous 混淆。"},
    {cat:"生活正式", en:"in the event of", phon:"/ɪn ðə ɪˈvent əv/", zh:"倘若、万一", example:"In the event of fire, exit calmly.", explain:"正式『如果…发生』，用于规章/预案。", edge:"书面/公告常用；口语用 if / when。"},
    {cat:"生活正式", en:"commence", phon:"/kəˈmens/", zh:"开始", example:"The ceremony will commence at noon.", explain:"正式『开始』，等于 begin / start 的书面体。", edge:"名词 commencement（毕业典礼/开端）；口语少用以免显生硬。"}
  ];

  /* ---- 文本 → 思维导图层级（按换行 / ">" 嵌套） ---- */
  function parseHierarchy(text){
    var lines = String(text||"").split(/\n/).map(function(l){return l.trim();}).filter(function(l){return l;});
    var root = "知识主题";
    var nodes = [];
    if(lines[0] && !/^[>\-\*]/.test(lines[0]) && lines[0].length<20){ root = lines.shift(); }
    lines.forEach(function(line){
      // 支持 "A > B > C" 或 "A - B" 嵌套
      var parts = line.split(/\s*>\s*|\s*-\s*/).map(function(p){return p.trim();}).filter(function(p){return p;});
      if(parts.length===1){ nodes.push({label:parts[0], children:[]}); }
      else {
        var cur = nodes;
        parts.forEach(function(p, i){
          if(i===parts.length-1){ cur.push({label:p, children:[]}); }
          else {
            var found = cur.filter(function(n){return n.label===p;})[0];
            if(!found){ found={label:p, children:[]}; cur.push(found); }
            cur = found.children;
          }
        });
      }
    });
    return {root:root, children:nodes};
  }

  /* ---- 统一词库：聚合全部模块的单词与句子（每条含中文释义） ---- */
  function buildWordBank(){
    var out = [];
    DAILY_WORDS.forEach(function(w){ out.push({text:w.en, zh:w.zh, type:"生词", source:"每日一练"}); });
    DAILY_PATTERNS.forEach(function(p){ out.push({text:p.en, zh:p.zh, type:"句型", source:"每日一练"}); });
    PHONICS.forEach(function(les){ les.items.forEach(function(it){ out.push({text:it.word, zh:it.zh, type:"拼读词", source:"自然拼读"}); }); });
    ZERO_BASIS.forEach(function(z){
      z.body.split("·").forEach(function(chunk){
        var m = chunk.match(/^(.*?)（(.*?)）/);
        if(m) out.push({text:m[1].trim(), zh:m[2].trim(), type:"核心短语", source:"背诵打卡材料库"});
      });
    });
    SENTENCE_BANK.forEach(function(cat){
      cat.items.forEach(function(s){ out.push({text:s.en, zh:s.zh, type:"口语句", source:"900句玩转英语"}); });
      if(cat.dialog){ cat.dialog.forEach(function(d){ out.push({text:d.en, zh:d.zh, type:"对话句", source:"900句玩转英语"}); }); }
    });
    if(EL.m5 && EL.m5.SCEN){
      Object.keys(EL.m5.SCEN).forEach(function(name){
        var sc = EL.m5.SCEN[name];
        out.push({text:sc.open, zh:"（情景开场）", type:"情景句", source:"口语练习"});
        sc.turns.forEach(function(t){ out.push({text:t, zh:"（陪练语句）", type:"情景句", source:"口语练习"}); });
      });
    }
    LISTEN_SAMPLES.forEach(function(t){
      splitSentences(t).forEach(function(s){ out.push({text:s, zh:"（听力样段）", type:"听力句", source:"听力训练"}); });
    });
    if(typeof PRO_TERMS !== "undefined"){
      PRO_TERMS.forEach(function(t){
        out.push({text:t.en, zh:t.zh, type:"专业术语", source:"专业术语库"});
      });
    }
    if(typeof DIALOGUES !== "undefined"){
      DIALOGUES.forEach(function(d){
        d.turns.forEach(function(t){
          out.push({text:t.partner, zh:t.zh, type:"对话·对方", source:"阶梯对话"});
          out.push({text:t.model, zh:"（参考回答）", type:"对话·参考", source:"阶梯对话"});
        });
      });
    }
    return out;
  }

  /* ---- 阶梯情景对话（模块十）：每轮 3-5 回合，难度 L1易→L2中→L3难 由易到难 ---- */
  var DIALOGUES = [
    {
      name:"咖啡店点单",
      ctx:"你在咖啡店柜台点一杯外带饮品，逐步把需求说清楚。",
      turns:[
        {lv:1, partner:"Hi! What can I get for you?", zh:"你好！想点什么？", model:"I'd like a medium latte, please.", tip:"用 I'd like... 比 I want... 更礼貌自然，点单首选句型。"},
        {lv:1, partner:"Hot or iced?", zh:"热的还是冰的？", model:"Iced, please.", tip:"温度直接答 iced / hot 即可，无需完整句。"},
        {lv:2, partner:"Anything else with that?", zh:"还要加点别的吗？", model:"Could I also get a blueberry muffin?", tip:"加单用 Could I get...? 比 Give me... 更客气。",
         quiz:{type:"fill", q:"补全更礼貌的加单句：___ I also get a blueberry muffin?", opts:["Could","Give","Want"], answer:0, explain:"加单用 Could I get...? 比 Give me... 更客气、自然，是服务场景的礼貌首选。"} },
        {lv:2, partner:"That'll be 28 yuan. Cash or card?", zh:"一共 28 元，现金还是刷卡？", model:"Card, please.", tip:"付款方式说 cash / card，please 收尾更得体。",
         quiz:{type:"correct", q:"哪句付款回答最得体？", opts:["Card, please.","Give me card.","I take card now."], answer:0, explain:"付款说 card / cash 并以 please 收尾，简洁得体；Give me / I take 显得生硬。"} },
        {lv:3, partner:"Your name for the cup?", zh:"杯子上写什么名字？", model:"Please write 'Tom', and make it not too sweet.", tip:"用 and 连接两个请求，构成复合句，信息一次说清。",
         quiz:{type:"fill", q:"用连词把两个请求一次说清：Please write 'Tom', ___ make it not too sweet.", opts:["and","but","so"], answer:0, explain:"and 连接并列请求，构成复合句，信息一次说清；but 表转折、so 表结果，均不符。"} }
      ]
    },
    {
      name:"餐厅预订",
      ctx:"你打电话/到店为两人预订晚餐，并说明偏好。",
      turns:[
        {lv:1, partner:"Good evening! Do you have a reservation?", zh:"晚上好！您有预订吗？", model:"Yes, a table for two under 'Wang'.", tip:"under + 姓氏 表示'以某姓名预订'。"},
        {lv:1, partner:"Great. What time, please?", zh:"好的，请问几点？", model:"At seven thirty, please.", tip:"时间直接说 At + 时刻，thirty 表半点。"},
        {lv:2, partner:"Window seat or inside?", zh:"靠窗还是室内？", model:"A window seat, if possible.", tip:"if possible 礼貌表达'如果可以的话'。",
         quiz:{type:"fill", q:"补全礼貌表达'如果可以'：A window seat, ___ ___.", opts:["if possible","if can","if okay"], answer:0, explain:"if possible 是'如果可以的话'最自然的省略说法，比 if can 规范、比 if okay 正式。"} },
        {lv:3, partner:"Any special requests for the dinner?", zh:"用餐有什么特殊要求吗？", model:"We'd like a quiet table, since it's a birthday dinner.", tip:"since 引导原因从句，说明预订背景。",
         quiz:{type:"fill", q:"补全原因从句连词：We'd like a quiet table, ___ it's a birthday dinner.", opts:["since","and","but"], answer:0, explain:"since 引导原因从句，说明预订背景；and/but 不表因果。"} }
      ]
    },
    {
      name:"酒店入住",
      ctx:"你到前台办理入住，逐步完成身份验证、问设施、求助。",
      turns:[
        {lv:1, partner:"Good evening! May I see your passport?", zh:"晚上好！可以看下护照吗？", model:"Sure, here you are.", tip:"here you are 是递东西时的万能口语。"},
        {lv:1, partner:"Your room is on the 8th floor.", zh:"您的房间在 8 楼。", model:"Thank you. Where's the elevator?", tip:"Where's...? 询问位置，elevator 电梯。"},
        {lv:2, partner:"Breakfast is served from 7 to 10.", zh:"早餐 7 点到 10 点供应。", model:"Got it. Is it on the same floor?", tip:"Got it 表'明白了'；on the same floor 同层。",
         quiz:{type:"fill", q:"补全'在同一层'：Is it ___ ___ ___ floor?", opts:["on the same","in same","at same"], answer:0, explain:"on the same floor 表示'在同一层'，介词用 on。"} },
        {lv:2, partner:"Do you need help with your luggage?", zh:"需要帮您拿行李吗？", model:"Yes, please. It's a bit heavy.", tip:"a bit + 形容词 表'有点…'，比 very 更克制。",
         quiz:{type:"correct", q:"哪句'有点重'最自然？", opts:["It's a bit heavy.","It's very heavy a little.","It heavy bit."], answer:0, explain:"a bit + 形容词 表'有点…'，比 very 克制、比中式语序自然。"} },
        {lv:3, partner:"Anything else I can help with?", zh:"还有其他能帮您的吗？", model:"Could you tell me how to connect to the wifi?", tip:"how to + 动词 问操作方式，how to connect 怎么连。",
         quiz:{type:"fill", q:"补全问操作方式：Could you tell me ___ ___ ___ to the wifi?", opts:["how to connect","how connect","what connect"], answer:0, explain:"how to + 动词 问'怎么做'，how to connect 怎么连；what 不搭配。"} }
      ]
    },
    {
      name:"问路",
      ctx:"你在不熟悉的地方向路人问去车站/地铁的路。",
      turns:[
        {lv:1, partner:"Hi! Need any help finding your way?", zh:"你好！需要帮忙指路吗？", model:"Yes, how do I get to the station?", tip:"How do I get to...? 怎么去… 是问路核心句。"},
        {lv:1, partner:"Go straight and turn left at the corner.", zh:"直走，到路口左转。", model:"Left at the corner?", tip:"用升调重复 Left at the corner? 确认方向，避免走错。"},
        {lv:2, partner:"It's about a 5-minute walk from here.", zh:"从这儿步行大约 5 分钟。", model:"Is it near the bank?", tip:"near + 地点 表'在…附近'，用地标锚定位置。",
         quiz:{type:"fill", q:"补全'在银行附近'：Is it ___ ___ ___?", opts:["near the bank","near bank","next bank"], answer:0, explain:"near + 地点 表'在…附近'，加 the 更自然；next 表'紧邻'语义偏。"} },
        {lv:3, partner:"You can also take the subway, line 2.", zh:"您也可以坐地铁 2 号线。", model:"Which exit should I take for the museum?", tip:"Which exit 问'哪个出口'，for 表目的地。",
         quiz:{type:"fill", q:"补全'哪个出口'：___ ___ should I take for the museum?", opts:["Which exit","What exit","Where exit"], answer:0, explain:"Which exit 问'哪个出口'，for 表目的地；What/Where 不搭配 exit。"} }
      ]
    },
    {
      name:"求职面试",
      ctx:"你参加一场英文面试，从自我介绍到反问面试官。",
      turns:[
        {lv:1, partner:"Hi, thanks for coming. Could you tell me about yourself?", zh:"你好，谢谢过来。能介绍下自己吗？", model:"I'm a marketing graduate with two years of experience.", tip:"with + 经历 一句带出资历，简洁有力。"},
        {lv:2, partner:"Why are you interested in this position?", zh:"为什么对这个职位感兴趣？", model:"Because it matches my skills in data analysis.", tip:"Because 直接说明原因，match 表'匹配'。",
         quiz:{type:"fill", q:"补全原因句：___ it matches my skills in data analysis.", opts:["Because","But","So"], answer:0, explain:"Because 直接说明原因；But 转折、So 结果，均不符。"} },
        {lv:2, partner:"What are your strengths?", zh:"你的优势是什么？", model:"I'm organized and good at teamwork.", tip:"be good at + 名词/动名词，teamwork 团队合作。",
         quiz:{type:"correct", q:"哪句语法正确？", opts:["I'm good at teamwork.","I'm good in teamwork.","I good at teamwork."], answer:0, explain:"be good at + 名词/动名词，teamwork 团队合作；in 不搭配、缺 be 动词均错。"} },
        {lv:3, partner:"Where do you see yourself in five years?", zh:"五年后你希望在哪里？", model:"I hope to lead a small team and grow with the company.", tip:"hope to + 动词 表达职业期望，grow with 共同成长。",
         quiz:{type:"fill", q:"补全职业期望：I ___ ___ lead a small team.", opts:["hope to","hope for","hope at"], answer:0, explain:"hope to + 动词 表达职业期望；hope for + 名词，不接动词原形。"} },
        {lv:3, partner:"Do you have any questions for us?", zh:"你有什么问题要问我们吗？", model:"Yes, what does the typical career path look like?", tip:"What does ... look like? 问'…是什么样的'，显深度。",
         quiz:{type:"fill", q:"补全'是什么样的'：what ___ the typical career path ___ ___?", opts:["does / look / like","is / look / like","do / looks / like"], answer:0, explain:"What does ... look like? 问'…是什么样的'，显深度；主语 path 单数用 does。"} }
      ]
    },
    {
      name:"看病就医",
      ctx:"你用英语向医生描述症状、病史并询问用药。",
      turns:[
        {lv:1, partner:"Hello, what seems to be the problem?", zh:"您好，哪里不舒服？", model:"I have a headache and a slight fever.", tip:"have + 症状 描述病情，slight 轻微。"},
        {lv:1, partner:"How long have you had this?", zh:"这样多久了？", model:"Since yesterday morning.", tip:"since + 时间点 表'从…起'，yesterday morning 昨天早上。"},
        {lv:2, partner:"Do you have any allergies?", zh:"有药物过敏吗？", model:"No, I don't have any.", tip:"any 用于否定/疑问句，allergies 过敏。",
         quiz:{type:"correct", q:"哪句'没有任何过敏'正确？", opts:["I don't have any.","I no have any.","I don't have some."], answer:0, explain:"any 用于否定/疑问句；some 不用于否定句，I no have 为中式语序。"} },
        {lv:3, partner:"I'll prescribe some medicine for you.", zh:"我给您开点药。", model:"How often should I take it?", tip:"How often 问频率，take 此处指'服药'。",
         quiz:{type:"fill", q:"补全问服药频率：___ ___ should I take it?", opts:["How often","How many","How much"], answer:0, explain:"How often 问频率，take 此处指'服药'；How many/much 问数量。"} }
      ]
    },
    {
      name:"商务会议",
      ctx:"你在一场项目周会上做汇报、提示风险并认领行动项。",
      turns:[
        {lv:1, partner:"Morning everyone! Let's start with the update.", zh:"大家早上好！开始汇报吧。", model:"Sure, I'll go first.", tip:"I'll go first 表'我先说'，主动不抢。"},
        {lv:2, partner:"What's the status on the deliverables?", zh:"交付物进展如何？", model:"We're on track to finish by Friday.", tip:"on track 表'按计划进行'，by + 时间 截止前。",
         quiz:{type:"fill", q:"补全'按计划进行'：We're ___ ___ to finish by Friday.", opts:["on track","on way","in track"], answer:0, explain:"on track 表'按计划进行'，by + 时间 表截止前；in track 搭配错。"} },
        {lv:2, partner:"Any risks we should flag?", zh:"有什么风险要提请注意吗？", model:"The supplier may be delayed.", tip:"may + 动词 表'可能'，flag 此处指'标记/提示'。",
         quiz:{type:"fill", q:"补全'可能延迟'：The supplier ___ ___ delayed.", opts:["may be","maybe","might to"], answer:0, explain:"may + 动词 表'可能'；maybe 是副词（'或许'），不接 be；might 后不接 to。"} },
        {lv:3, partner:"Shall we set the next milestone?", zh:"要定下个里程碑吗？", model:"Yes, let's aim for the 15th.", tip:"let's + 动词 提建议，aim for 目标定在。",
         quiz:{type:"fill", q:"补全建议句：Yes, ___ ___ for the 15th.", opts:["let's aim","let aim","lets aim"], answer:0, explain:"let's + 动词 提建议，aim for 目标定在；lets 缺缩写符、let 后缺's 均错。"} },
        {lv:3, partner:"Who will own this action item?", zh:"这项行动由谁负责？", model:"I'll take it and report back next Monday.", tip:"take + 任务 表'认领/负责'，report back 回报。",
         quiz:{type:"fill", q:"补全'认领任务'：I'll ___ ___ and report back next Monday.", opts:["take it","take this","takes it"], answer:0, explain:"take + 任务 表'认领/负责'；takes 与 I'll 重复谓语、this 指代弱。"} }
      ]
    },
    {
      name:"日常闲聊",
      ctx:"你和老朋友偶遇寒暄，从问候到聊近况与周末计划。",
      turns:[
        {lv:1, partner:"Hey! Long time no see. How have you been?", zh:"嘿！好久不见，最近好吗？", model:"I'm good, thanks! And you?", tip:"And you? 反问对方，寒暄标配。"},
        {lv:2, partner:"What have you been up to lately?", zh:"最近在忙些什么？", model:"Just working on a new project at the office.", tip:"be up to 表'在忙…'，lately 最近。",
         quiz:{type:"correct", q:"哪句'最近在忙…'正确？", opts:["I'm working on a new project.","I working on a project.","I'm work on project."], answer:0, explain:"be up to / be working on 表'在忙…'；缺 be 动词、work 原型误用均错。"} },
        {lv:3, partner:"Any plans for the weekend?", zh:"周末有什么计划吗？", model:"I might visit my grandparents if the weather's nice.", tip:"if 引导条件从句，might 表'可能'，语气更软。",
         quiz:{type:"fill", q:"补全条件从句：I might visit them ___ the weather's nice.", opts:["if","and","but"], answer:0, explain:"if 引导条件从句，might 表'可能'，语气更软；and/but 不表条件。"} }
      ]
    }
  ];

  window.EL.uid = uid; // 供 store.js 及各模块顶层调用
  window.EL.engine = {
    uid:uid, esc:esc, $:$, $all:$all, toast:toast,
    EB_INTERVALS:EB_INTERVALS, reviewScheduleDates:reviewScheduleDates, isDue:isDue,
    radarSVG:radarSVG, mermaidMindmap:mermaidMindmap, gradeText:gradeText,
    splitSentences:splitSentences, diffRecite:diffRecite, analyzeOral:analyzeOral,
    genListenQuestions:genListenQuestions, dictationScript:dictationScript, parseHierarchy:parseHierarchy,
    COMMON:COMMON,
    speak:speak, todayKey:todayKey, dailySet:dailySet,
    DAILY_WORDS:DAILY_WORDS, DAILY_PATTERNS:DAILY_PATTERNS, PHONICS:PHONICS, ZERO_BASIS:ZERO_BASIS,
    PHONICS_PRACTICE:PHONICS_PRACTICE, SENTENCE_BANK:SENTENCE_BANK, LISTEN_SAMPLES:LISTEN_SAMPLES,
    PRO_TERMS:PRO_TERMS, buildWordBank:buildWordBank,
    DIALOGUES:DIALOGUES
  };

  /* 注入 toast 动画 */
  var st = document.createElement("style");
  st.textContent = "@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}";
  document.head.appendChild(st);
})();
