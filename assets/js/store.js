/* ===== store.js · 数据层（localStorage 持久化，纯前端无后端） =====
   座位模式：所有键自动加座位命名空间前缀（EL.seat.ns），座位间数据完全隔离。 */
(function(){
  window.EL = window.EL || {};
  var NS = "el_"; // 本地存储键前缀

  /* 当前命名空间：seat{id}_el_（座位模式）；无座位时保持 el_ */
  function ns(){
    return (window.EL && EL.seat && EL.seat.ns) ? (EL.seat.ns + NS) : NS;
  }

  function get(key, fallback){
    try{
      var raw = localStorage.getItem(ns() + key);
      if(raw === null || raw === undefined) return (fallback !== undefined ? fallback : null);
      return JSON.parse(raw);
    }catch(e){ return (fallback !== undefined ? fallback : null); }
  }
  function set(key, val){
    try{ localStorage.setItem(ns() + key, JSON.stringify(val)); return true; }
    catch(e){ console.error("存储失败", e); return false; }
  }
  function remove(key){ localStorage.removeItem(ns() + key); }
  function clearAll(){
    var p = ns();
    Object.keys(localStorage).forEach(function(k){ if(k.indexOf(p)===0) localStorage.removeItem(k); });
  }

  /* 通用集合：对某个 key 下的数组做增删改查 */
  function collection(key){
    return {
      all: function(){ return get(key, []); },
      save: function(arr){ set(key, arr); },
      add: function(item){
        var arr = get(key, []);
        item.id = item.id || EL.uid(key);
        item.createdAt = item.createdAt || Date.now();
        arr.unshift(item); set(key, arr); return item;
      },
      update: function(id, patch){
        var arr = get(key, []);
        for(var i=0;i<arr.length;i++){ if(arr[i].id===id){ Object.assign(arr[i], patch); break; } }
        set(key, arr); return arr;
      },
      remove: function(id){
        var arr = get(key, []).filter(function(x){ return x.id !== id; }); set(key, arr); return arr;
      },
      get: function(id){
        return get(key, []).filter(function(x){ return x.id === id; })[0] || null;
      }
    };
  }

  window.EL.store = {
    get:get, set:set, remove:remove, clearAll:clearAll, collection:collection,
    // 各模块集合键名
    keys:{
      points:"points", plans:"plans", mindmaps:"mindmaps",
      reciteItems:"recite_items", reciteLogs:"recite_logs",
      oralSessions:"oral_sessions", oralEvals:"oral_evals",
      listenItems:"listen_items", dialogueProgress:"dialogue_progress"
    }
  };

  /* 种子：预置零基础核心资料库（供「背诵打卡材料库」模块），可一键清空 */
  function seed(){
    if(get("seeded_lib_v1")) return;
    var col = collection(EL.store.keys.reciteItems);
    if(EL.engine && EL.engine.ZERO_BASIS && !col.all().length){
      EL.engine.ZERO_BASIS.forEach(function(m){
        col.add({cat:m.cat, title:m.title, zh:m.zh, body:m.body,
          content:(m.title+"｜"+m.body), mastery:0, round:0, lastStudied:null, checks:[]});
      });
    }
    set("seeded_lib_v1", true);
  }
  window.EL.seed = seed;
})();
