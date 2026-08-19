/* =========================================================================
 * 座位系统配置（座位模式 · 成人英语学习辅助系统）
 * - 100 个座位，每人一个专属链接（?seat=XX），数据按座位命名空间完全隔离。
 * - pwd 为本座位口令（静态方案下的「软钥匙」）：首开输口令完成本机绑定，之后免输；
 *   换设备/清缓存/隐身模式需重新输入。口令重置：把新口令告诉老师，更新后重新部署（链接不变）。
 * - 注意：静态方案中口令明文存在于本文件，任何人查看源码可见，属软性防护，
 *   无法做到真正的「一人一号」。请告知学生勿转发链接与口令。
 * ========================================================================= */
window.SEATS = [
  {
    "id": "01",
    "pwd": "HAEC"
  },
  {
    "id": "02",
    "pwd": "FXEE"
  },
  {
    "id": "03",
    "pwd": "VLSV"
  },
  {
    "id": "04",
    "pwd": "63KZ"
  },
  {
    "id": "05",
    "pwd": "ZCUD"
  },
  {
    "id": "06",
    "pwd": "22MS"
  },
  {
    "id": "07",
    "pwd": "YELJ"
  },
  {
    "id": "08",
    "pwd": "YC5W"
  },
  {
    "id": "09",
    "pwd": "EZV2"
  },
  {
    "id": "10",
    "pwd": "UT8G"
  },
  {
    "id": "11",
    "pwd": "FJV8"
  },
  {
    "id": "12",
    "pwd": "CSL7"
  },
  {
    "id": "13",
    "pwd": "B6CD"
  },
  {
    "id": "14",
    "pwd": "4B53"
  },
  {
    "id": "15",
    "pwd": "LQNC"
  },
  {
    "id": "16",
    "pwd": "6HTC"
  },
  {
    "id": "17",
    "pwd": "JGHC"
  },
  {
    "id": "18",
    "pwd": "KBDX"
  },
  {
    "id": "19",
    "pwd": "246Z"
  },
  {
    "id": "20",
    "pwd": "7THM"
  },
  {
    "id": "21",
    "pwd": "65HX"
  },
  {
    "id": "22",
    "pwd": "THJ3"
  },
  {
    "id": "23",
    "pwd": "JC57"
  },
  {
    "id": "24",
    "pwd": "GCDE"
  },
  {
    "id": "25",
    "pwd": "RSQX"
  },
  {
    "id": "26",
    "pwd": "M8H7"
  },
  {
    "id": "27",
    "pwd": "6N6H"
  },
  {
    "id": "28",
    "pwd": "HZYX"
  },
  {
    "id": "29",
    "pwd": "VRR9"
  },
  {
    "id": "30",
    "pwd": "9AF8"
  },
  {
    "id": "31",
    "pwd": "5M54"
  },
  {
    "id": "32",
    "pwd": "3Y3R"
  },
  {
    "id": "33",
    "pwd": "XFCD"
  },
  {
    "id": "34",
    "pwd": "UUXD"
  },
  {
    "id": "35",
    "pwd": "XE7M"
  },
  {
    "id": "36",
    "pwd": "8GZS"
  },
  {
    "id": "37",
    "pwd": "FS65"
  },
  {
    "id": "38",
    "pwd": "7BLQ"
  },
  {
    "id": "39",
    "pwd": "BGFP"
  },
  {
    "id": "40",
    "pwd": "9UQL"
  },
  {
    "id": "41",
    "pwd": "VC9N"
  },
  {
    "id": "42",
    "pwd": "HQF6"
  },
  {
    "id": "43",
    "pwd": "XRBZ"
  },
  {
    "id": "44",
    "pwd": "UVGP"
  },
  {
    "id": "45",
    "pwd": "NLNS"
  },
  {
    "id": "46",
    "pwd": "7E4U"
  },
  {
    "id": "47",
    "pwd": "DWEP"
  },
  {
    "id": "48",
    "pwd": "35QU"
  },
  {
    "id": "49",
    "pwd": "PESB"
  },
  {
    "id": "50",
    "pwd": "58RU"
  },
  {
    "id": "51",
    "pwd": "CC64"
  },
  {
    "id": "52",
    "pwd": "WNC7"
  },
  {
    "id": "53",
    "pwd": "SSCP"
  },
  {
    "id": "54",
    "pwd": "R5JW"
  },
  {
    "id": "55",
    "pwd": "Z93W"
  },
  {
    "id": "56",
    "pwd": "FSJW"
  },
  {
    "id": "57",
    "pwd": "QMX8"
  },
  {
    "id": "58",
    "pwd": "4RNM"
  },
  {
    "id": "59",
    "pwd": "LHYP"
  },
  {
    "id": "60",
    "pwd": "QDW7"
  },
  {
    "id": "61",
    "pwd": "NWWP"
  },
  {
    "id": "62",
    "pwd": "8QQV"
  },
  {
    "id": "63",
    "pwd": "6NH5"
  },
  {
    "id": "64",
    "pwd": "DW9V"
  },
  {
    "id": "65",
    "pwd": "ALZE"
  },
  {
    "id": "66",
    "pwd": "TAZR"
  },
  {
    "id": "67",
    "pwd": "SBEZ"
  },
  {
    "id": "68",
    "pwd": "X8ZV"
  },
  {
    "id": "69",
    "pwd": "RH76"
  },
  {
    "id": "70",
    "pwd": "4R9L"
  },
  {
    "id": "71",
    "pwd": "T5YA"
  },
  {
    "id": "72",
    "pwd": "UD9V"
  },
  {
    "id": "73",
    "pwd": "VVHB"
  },
  {
    "id": "74",
    "pwd": "ZBKB"
  },
  {
    "id": "75",
    "pwd": "53KG"
  },
  {
    "id": "76",
    "pwd": "M5V5"
  },
  {
    "id": "77",
    "pwd": "H33F"
  },
  {
    "id": "78",
    "pwd": "U8D3"
  },
  {
    "id": "79",
    "pwd": "NRSH"
  },
  {
    "id": "80",
    "pwd": "XTC7"
  },
  {
    "id": "81",
    "pwd": "6QZ5"
  },
  {
    "id": "82",
    "pwd": "C4AZ"
  },
  {
    "id": "83",
    "pwd": "RTQK"
  },
  {
    "id": "84",
    "pwd": "UEZN"
  },
  {
    "id": "85",
    "pwd": "GWYY"
  },
  {
    "id": "86",
    "pwd": "CU52"
  },
  {
    "id": "87",
    "pwd": "8EP8"
  },
  {
    "id": "88",
    "pwd": "J93S"
  },
  {
    "id": "89",
    "pwd": "J3DU"
  },
  {
    "id": "90",
    "pwd": "458P"
  },
  {
    "id": "91",
    "pwd": "L6FN"
  },
  {
    "id": "92",
    "pwd": "NQW9"
  },
  {
    "id": "93",
    "pwd": "WK7E"
  },
  {
    "id": "94",
    "pwd": "RC3N"
  },
  {
    "id": "95",
    "pwd": "3Q7D"
  },
  {
    "id": "96",
    "pwd": "7LQW"
  },
  {
    "id": "97",
    "pwd": "4M5W"
  },
  {
    "id": "98",
    "pwd": "NE4L"
  },
  {
    "id": "99",
    "pwd": "Y7BK"
  },
  {
    "id": "100",
    "pwd": "329Z"
  }
];

// 座位模式说明（门禁可见）
window.SEAT_HELP = [
  '✅ 座位模式说明（已上线 100 个座位）',
  '· 每人一个专属链接，数据按座位完全隔离（各自独立的 localStorage 命名空间，互不串档）。',
  '· 首次打开链接：输入本座位口令完成设备绑定 → 进入系统；之后本机免输口令。',
  '· 换设备打开：需再次输入口令；口令是真正的钥匙。',
  '· 防共用为软性防护：清缓存 / 换浏览器 / 隐身模式可绕过，请告知学生勿转发链接与口令。',
  '· 真正 100% 一人一号需后端账号体系，当前静态方案无法做到。',
  '· 口令重置：如需收回或更换某座位口令，把新口令告诉老师，更新后重新部署（链接不变）。'
].join('\n');

/* ===== 座位解析（必须在 store.js 之前加载） ===== */
window.EL = window.EL || {};
(function(){
  var params = new URLSearchParams(location.search);
  var raw = (params.get("seat") || "").trim().toUpperCase();
  var seat = null;
  (window.SEATS || []).forEach(function(s){ if(s.id === raw) seat = s; });
  var boundKey = "el_seat" + (seat ? seat.id : "") + "_bound";
  function isBound(){ try{ return localStorage.getItem(boundKey) === "1"; }catch(e){ return false; } }
  function bind(){ try{ localStorage.setItem(boundKey, "1"); }catch(e){} }
  window.EL.seat = seat ? {
    id: seat.id, pwd: seat.pwd, ns: "seat" + seat.id + "_", bound: isBound(), isBound: isBound, bind: bind
  } : { id: null, pwd: null, ns: "", bound: false, isBound: function(){ return false; }, bind: function(){} };
})();
