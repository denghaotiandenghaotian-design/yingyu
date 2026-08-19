/* ===== m5.js · 模块五 口语练习（扩充：听读配套） ===== */
(function(){
  window.EL = window.EL || {};
  var sessions = EL.store.collection(EL.store.keys.oralSessions);
  var evals = EL.store.collection(EL.store.keys.oralEvals);

  var SCEN = {
    "餐厅点餐":{
      open:"Welcome! What can I get for you today?",
      turns:["Great choice. Anything to drink?","Sure, and would you like that for here or to go?","Got it. That'll be 12 dollars, please.","Here you are. Enjoy your meal!","Thanks for coming! See you next time."],
      idioms:["I'll have...（我要…）","Could I get...?（能给我…吗）","to go / for here（外带/堂食）"],
      vocab:["order 点餐","menu 菜单","recommend 推荐","bill 账单"]
    },
    "求职面试":{
      open:"Hi, thanks for coming. Could you tell me a bit about yourself?",
      turns:["Nice. Why are you interested in this position?","Good. What are your strengths?","I see. Where do you see yourself in five years?","Great, do you have any questions for us?","Thanks, we'll be in touch soon."],
      idioms:["I'm good at...（我擅长…）","I'm responsible for...（我负责…）","team player（团队合作者）"],
      vocab:["strength 优势","experience 经验","responsibility 职责","career 职业"]
    },
    "旅行问路":{
      open:"Hi there! Need any help finding your way?",
      turns:["Sure! Go straight and turn left at the corner.","It's about a 5-minute walk from here.","You can also take the subway, line 2.","No problem, just ask if you get lost.","Have a great trip!"],
      idioms:["Excuse me, where is...?（请问…在哪）","How do I get to...?（怎么去…）","Is it far?（远吗）"],
      vocab:["crossing 路口","opposite 对面","direction 方向","nearby 附近"]
    },
    "商务会议":{
      open:"Morning everyone, let's start with the project update.",
      turns:["Thanks. What's the status on the deliverables?","Good point. Any risks we should flag?","Agreed. Shall we set the next milestone?","Let's assign owners for each action.","Great, I'll send the summary after the call."],
      idioms:["Let's circle back to...（回头再谈…）","On the same page（意见一致）","Action item（待办事项）"],
      vocab:["milestone 里程碑","deliverable 交付物","deadline 截止","stakeholder 相关方"]
    },
    "日常闲聊":{
      open:"Hey! Long time no see. How have you been?",
      turns:["That's nice! What have you been up to?","Cool. Any plans for the weekend?","Haha, sounds fun.","Definitely, we should hang out soon.","Take care, talk later!"],
      idioms:["How's it going?（最近怎样）","Not bad（还不错）","Catch up（叙旧）"],
      vocab:["recently 最近","busy 忙","relax 放松","weekend 周末"]
    },
    "医院看病":{
      open:"Hello, what seems to be the problem today?",
      turns:["I see. How long have you had this?","Do you have a fever?","OK, I'll prescribe some medicine.","Take it twice a day after meals.","Rest well and drink more water."],
      idioms:["I don't feel well.（我不舒服）","since yesterday（从昨天起）","prescribe medicine（开药）"],
      vocab:["fever 发烧","cough 咳嗽","prescription 处方","symptom 症状"]
    },
    "酒店入住":{
      open:"Good evening! Do you have a reservation with us?",
      turns:["Sure, may I see your passport, please?","Your room is on the 8th floor.","Here is your key card.","Breakfast is served from 7 to 10.","Enjoy your stay!"],
      idioms:["I have a reservation.（我订了房）","for two nights（住两晚）","key card（房卡）"],
      vocab:["reservation 预订","passport 护照","luggage 行李","lobby 大堂"]
    },
    "咖啡店点单":{
      open:"Hi! What can I get started for you?",
      turns:["Sure, what size would you like?","Hot or iced?","Anything else with that?","That'll be 28 yuan.","Your name for the cup?"],
      idioms:["I'll have a latte.（我要拿铁）","for here or to go（堂食/外带）","not too sweet（不太甜）"],
      vocab:["latte 拿铁","iced 冰的","medium 中杯","receipt 收据"]
    }
  };

  function render(container){
    var state = {tab:"talk"};
    function frame(){
      var html = '<div class="row" style="margin-bottom:6px">'
        + '<button class="btn sm '+(state.tab==="talk"?"":"ghost")+'" data-tab="talk">① 情景对话陪练</button>'
        + '<button class="btn sm '+(state.tab==="eval"?"":"ghost")+'" data-tab="eval">② 口语评测与纠音</button>'
        + '<span class="spacer"></span><span class="chip">陪练 '+sessions.all().length+' 次</span></div>';
      html += state.tab==="talk"? viewTalk() : viewEval();
      container.innerHTML = html; bind();
    }

    function viewTalk(){
      var opts = Object.keys(SCEN).map(function(s){return '<option>'+s+'</option>';}).join("");
      return '<div class="card"><h3>① 情景对话陪练 <span class="tag">提示词 5.1 · i+1</span></h3>'
        + '<div class="note">选择情景进入角色对话；陪练按你的水平控难度、记录错误，结束统一点评。每条陪练语都配 🔊 听力音频与跟读文本，点「🔊 重听」可回放。⚠ 真实发音需录音，本模块仅做文本层识别。</div>'
        + '<div class="grid grid-3">'
        + '<div><label class="fld">情景</label><select id="sc">'+opts+'</select></div>'
        + '<div><label class="fld">学习者水平</label><select id="lv"><option>初级</option><option selected>中级</option><option>高级</option></select></div>'
        + '<div><label class="fld">目标</label><select id="goal"><option>流利</option><option>准确</option></select></div></div>'
        + '<div class="row" style="margin-top:12px"><button class="btn" id="startTalk">▶ 开始对话</button></div>'
        + '<div id="talkOut"></div></div>';
    }
    var S = {active:false, sc:null, ti:0, errors:[], ipa:[], messages:[]};
    function startTalk(){
      var name = EL.engine.$("#sc", container).value;
      S = {active:true, sc:SCEN[name], name:name, ti:0, errors:[], ipa:[], messages:[]};
      var box = EL.engine.$("#talkOut", container);
      box.innerHTML = '<hr class="sep"><div class="chat" id="chat"></div>'
        + '<div class="chat-input"><input type="text" id="uinput" placeholder="用英语回复对方…（回车发送）"><button class="btn" id="send">发送</button></div>'
        + '<div class="row" style="margin-top:10px"><button class="btn warn" id="endTalk">⏹ 结束并点评</button>'
        + '<button class="btn ghost" id="replayOpen">🔊 重听开场</button>'
        + '<span class="muted tiny">录音纠音需麦克风，当前为文本陪练</span></div>';
      pushPartner(S.sc.open);
      setTimeout(function(){ EL.engine.speak(S.sc.open); }, 300);
      EL.engine.$("#send", box).onclick = sendMsg;
      EL.engine.$("#uinput", box).addEventListener("keydown", function(e){ if(e.key==="Enter") sendMsg(); });
      EL.engine.$("#endTalk", box).onclick = endTalk;
      EL.engine.$("#replayOpen", box).onclick = function(){ EL.engine.speak(S.sc.open); };
    }
    function pushPartner(text){
      S.messages.push({who:"陪练", text:text});
      var chat = EL.engine.$("#chat", container);
      var b = document.createElement("div"); b.className = "bubble partner";
      b.innerHTML = '<div class="who">陪练</div>'+EL.engine.esc(text)
        + '<button class="speak sm" style="margin-top:6px" data-spk="'+EL.engine.esc(text)+'">🔊 重听</button>';
      chat.appendChild(b); chat.scrollTop = chat.scrollHeight;
      var spk = b.querySelector("[data-spk]"); if(spk) spk.onclick = function(){ EL.engine.speak(text); };
    }
    function pushMe(text){
      var chat = EL.engine.$("#chat", container);
      var b = document.createElement("div"); b.className = "bubble me";
      b.innerHTML = '<div class="who">我</div>'+EL.engine.esc(text);
      chat.appendChild(b); chat.scrollTop = chat.scrollHeight;
    }
    function sendMsg(){
      var inp = EL.engine.$("#uinput", container); var txt = inp.value.trim(); if(!txt) return;
      pushMe(txt); inp.value = "";
      var an = EL.engine.analyzeOral(txt);
      an.errors.forEach(function(e){ if(!S.errors.some(function(x){return x.fix===e.fix;})) S.errors.push(e); });
      an.ipaHits.forEach(function(h){ if(!S.ipa.some(function(x){return x.word===h.word;})) S.ipa.push(h); });
      var reply = S.sc.turns[S.ti % S.sc.turns.length]; S.ti++;
      setTimeout(function(){ pushPartner(reply); EL.engine.speak(reply); }, 350);
    }
    function endTalk(){
      S.active = false;
      var html = '<hr class="sep"><h4>对话总评</h4>';
      html += '<div class="note"><div class="nt-title">错误清单（文本层识别）</div>'+(S.errors.length? S.errors.map(function(e){return '• '+EL.engine.esc(e.fix)+' —— '+EL.engine.esc(e.why);}).join("<br>") : "未识别到明显语法/搭配错误，表达较规范。")+'</div>';
      html += '<div class="note ok"><div class="nt-title">地道表达参考</div>'+S.sc.idioms.map(function(x){return EL.engine.esc(x);}).join(" ｜ ")+'</div>';
      html += '<div class="note"><div class="nt-title">发音提示（需录音验证）</div>'+(S.ipa.length? S.ipa.map(function(h){return '<b>'+h.word+'</b> '+h.ipa;}).join("<br>") : "文本中未命中易错发音词；建议用麦克风朗读本情景常用词以校验发音。")+'</div>';
      html += '<div class="note warn">⚠ 本陪练为本地脚本，不能真实理解语义与听到发音；如需真实口语评测请结合录音。已记录本次陪练。</div>';
      EL.engine.$("#talkOut", container).innerHTML = html;
      sessions.add({scenario:S.name, turns:S.ti, errors:S.errors.length, at:new Date().toISOString()});
    }

    function viewEval(){
      return '<div class="card"><h3>② 口语评测与纠音 <span class="tag">提示词 5.2 · 五维</span></h3>'
        + '<div class="note">粘贴口语文本/转写，按五维（流利度/准确度/词汇/语法/语音/表达丰富度）评分并给出 IPA 级纠音建议，可 🔊 听原音对照。语音维度需录音，此处仅基于文本提示。</div>'
        + '<label class="fld">口语文本 / 转写</label><textarea id="eText" rows="7" placeholder="I think learning English is very important because it can help us to know the world better."></textarea>'
        + '<div class="grid grid-2"><div><label class="fld">口音标准</label><select id="eAcc"><option>通用/中性</option><option>英式 RP</option><option>美式 General American</option></select></div>'
        + '<div><label class="fld">评分维度</label><select id="eDim"><option>全部五维+丰富度</option><option>仅 准确度+语法</option></select></div></div>'
        + '<div class="row" style="margin-top:12px"><button class="btn" id="runEval">🎯 评测并纠音</button>'
        + '<button class="btn ghost" id="evalHear">🔊 听原音</button></div>'
        + '<div id="evalOut"></div></div>';
    }
    function runEval(){
      var txt = EL.engine.$("#eText", container).value;
      if(!txt.trim()){ EL.engine.toast("请填写口语文本","warn"); return; }
      var r = EL.engine.analyzeOral(txt);
      var dims = r.dims;
      var html = '<hr class="sep"><h4>五维评分</h4>';
      Object.keys(dims).forEach(function(k){
        var v = Math.round(dims[k]); var color = v>=75?"var(--accent)":v>=50?"var(--brand)":"var(--warn)";
        html += '<div class="dim"><div class="dim-top"><span>'+k+'</span><span>'+v+'</span></div><div class="bar"><i style="width:'+v+'%;background:'+color+'"></i></div></div>';
      });
      html += '<div class="note warn"><div class="nt-title">高频错误</div>'+(r.errors.length? r.errors.map(function(e){return '• '+EL.engine.esc(e.fix)+'（'+EL.engine.esc(e.why)+'）';}).join("<br>") : "未识别到明显错误。")+'</div>';
      html += '<div class="note"><div class="nt-title">纠音建议（IPA）</div>'+(r.ipaHits.length? r.ipaHits.map(function(h){return '<b>'+h.word+'</b> '+h.ipa;}).join("<br>") : "文本中未命中易错发音词。")+'</div>';
      html += '<div class="note"><div class="nt-title">示范表达</div>'+EL.engine.esc(sampleRewrite(txt))+'</div>';
      html += '<div class="note danger">⚠ 语音维度需真实录音才能判定；本评测为文本启发式，评分仅供参考，不贬损学习者。</div>';
      EL.engine.$("#evalOut", container).innerHTML = html;
      evals.add({text:txt.slice(0,120), score:Math.round((dims.准确度+dims.语法+dims.词汇)/3), at:new Date().toISOString()});
    }
    function sampleRewrite(txt){
      var r = EL.engine.analyzeOral(txt);
      if(!r.errors.length) return "表达已较规范，可尝试加入连接词（however / therefore）提升连贯度。";
      return "建议修正：" + r.errors[0].fix + "。完整转写请在真实对话中结合上下文优化。";
    }

    function bind(){
      EL.engine.$all("[data-tab]", container).forEach(function(b){ b.onclick=function(){ state.tab=b.getAttribute("data-tab"); frame(); }; });
      var st = EL.engine.$("#startTalk", container); if(st) st.onclick = startTalk;
      var re = EL.engine.$("#runEval", container); if(re) re.onclick = runEval;
      var eh = EL.engine.$("#evalHear", container); if(eh) eh.onclick = function(){ EL.engine.speak(EL.engine.$("#eText", container).value); };
    }
    frame();
  }
  window.EL.m5 = { render:render, SCEN:SCEN };
})();
