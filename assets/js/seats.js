/* =========================================================================
 * 座位系统配置（座位模式 · 成人英语学习辅助系统）
 * - 100 个座位，每人一个专属链接（?seat=XX），数据按座位命名空间完全隔离。
 * - pwds 为本座位口令列表（任一口令均可通过门禁）：
 *   前 50 座为【新旧双口令】——新口令与历史口令同时有效（学生旧口令长期可用）；
 *   51-100 座为单口令。口令重置：把新口令告诉老师，更新后重新部署（链接不变）。
 * - 注意：静态方案中口令明文存在于本文件，任何人查看源码可见，属软性防护，
 *   无法做到真正的「一人一号」。请告知学生勿转发链接与口令。
 * ========================================================================= */
window.SEATS = [
  {
    "id": "01",
    "pwds": [
      "K3DJ",
      "HAEC"
    ]
  },
  {
    "id": "02",
    "pwds": [
      "PRDV",
      "FXEE"
    ]
  },
  {
    "id": "03",
    "pwds": [
      "JHTR",
      "VLSV"
    ]
  },
  {
    "id": "04",
    "pwds": [
      "8PEQ",
      "63KZ"
    ]
  },
  {
    "id": "05",
    "pwds": [
      "HXXL",
      "ZCUD"
    ]
  },
  {
    "id": "06",
    "pwds": [
      "KMD4",
      "22MS"
    ]
  },
  {
    "id": "07",
    "pwds": [
      "ELN7",
      "YELJ"
    ]
  },
  {
    "id": "08",
    "pwds": [
      "CXBS",
      "YC5W"
    ]
  },
  {
    "id": "09",
    "pwds": [
      "BWGQ",
      "EZV2"
    ]
  },
  {
    "id": "10",
    "pwds": [
      "BLS9",
      "UT8G"
    ]
  },
  {
    "id": "11",
    "pwds": [
      "WJTQ",
      "FJV8"
    ]
  },
  {
    "id": "12",
    "pwds": [
      "75RW",
      "CSL7"
    ]
  },
  {
    "id": "13",
    "pwds": [
      "NSNE",
      "B6CD"
    ]
  },
  {
    "id": "14",
    "pwds": [
      "Q4HC",
      "4B53"
    ]
  },
  {
    "id": "15",
    "pwds": [
      "5GZZ",
      "LQNC"
    ]
  },
  {
    "id": "16",
    "pwds": [
      "5FSC",
      "6HTC"
    ]
  },
  {
    "id": "17",
    "pwds": [
      "7C59",
      "JGHC"
    ]
  },
  {
    "id": "18",
    "pwds": [
      "38HL",
      "KBDX"
    ]
  },
  {
    "id": "19",
    "pwds": [
      "55JF",
      "246Z"
    ]
  },
  {
    "id": "20",
    "pwds": [
      "G7R2",
      "7THM"
    ]
  },
  {
    "id": "21",
    "pwds": [
      "TYNJ",
      "65HX"
    ]
  },
  {
    "id": "22",
    "pwds": [
      "CV5C",
      "THJ3"
    ]
  },
  {
    "id": "23",
    "pwds": [
      "NF9L",
      "JC57"
    ]
  },
  {
    "id": "24",
    "pwds": [
      "V84Y",
      "GCDE"
    ]
  },
  {
    "id": "25",
    "pwds": [
      "HLH6",
      "RSQX"
    ]
  },
  {
    "id": "26",
    "pwds": [
      "4BW7",
      "M8H7"
    ]
  },
  {
    "id": "27",
    "pwds": [
      "AKTR",
      "6N6H"
    ]
  },
  {
    "id": "28",
    "pwds": [
      "CNFT",
      "HZYX"
    ]
  },
  {
    "id": "29",
    "pwds": [
      "9KXW",
      "VRR9"
    ]
  },
  {
    "id": "30",
    "pwds": [
      "FZNG",
      "9AF8"
    ]
  },
  {
    "id": "31",
    "pwds": [
      "48KN",
      "5M54"
    ]
  },
  {
    "id": "32",
    "pwds": [
      "Q5CM",
      "3Y3R"
    ]
  },
  {
    "id": "33",
    "pwds": [
      "UZH7",
      "XFCD"
    ]
  },
  {
    "id": "34",
    "pwds": [
      "SAFA"
    ]
  },
  {
    "id": "35",
    "pwds": [
      "V4J5",
      "XE7M"
    ]
  },
  {
    "id": "36",
    "pwds": [
      "JY65",
      "8GZS"
    ]
  },
  {
    "id": "37",
    "pwds": [
      "3YSL",
      "FS65"
    ]
  },
  {
    "id": "38",
    "pwds": [
      "F6UR",
      "7BLQ"
    ]
  },
  {
    "id": "39",
    "pwds": [
      "5R7N",
      "BGFP"
    ]
  },
  {
    "id": "40",
    "pwds": [
      "RJ95",
      "9UQL"
    ]
  },
  {
    "id": "41",
    "pwds": [
      "S5QQ",
      "VC9N"
    ]
  },
  {
    "id": "42",
    "pwds": [
      "AANR",
      "HQF6"
    ]
  },
  {
    "id": "43",
    "pwds": [
      "MTBU",
      "XRBZ"
    ]
  },
  {
    "id": "44",
    "pwds": [
      "ESC2",
      "UVGP"
    ]
  },
  {
    "id": "45",
    "pwds": [
      "FSWB",
      "NLNS"
    ]
  },
  {
    "id": "46",
    "pwds": [
      "9P5Z",
      "7E4U"
    ]
  },
  {
    "id": "47",
    "pwds": [
      "V2YN",
      "DWEP"
    ]
  },
  {
    "id": "48",
    "pwds": [
      "LTPN",
      "35QU"
    ]
  },
  {
    "id": "49",
    "pwds": [
      "GQ7P",
      "PESB"
    ]
  },
  {
    "id": "50",
    "pwds": [
      "FB7U",
      "58RU"
    ]
  },
  {
    "id": "51",
    "pwds": [
      "CC64"
    ]
  },
  {
    "id": "52",
    "pwds": [
      "WNC7"
    ]
  },
  {
    "id": "53",
    "pwds": [
      "SSCP"
    ]
  },
  {
    "id": "54",
    "pwds": [
      "R5JW"
    ]
  },
  {
    "id": "55",
    "pwds": [
      "Z93W"
    ]
  },
  {
    "id": "56",
    "pwds": [
      "FSJW"
    ]
  },
  {
    "id": "57",
    "pwds": [
      "QMX8"
    ]
  },
  {
    "id": "58",
    "pwds": [
      "4RNM"
    ]
  },
  {
    "id": "59",
    "pwds": [
      "LHYP"
    ]
  },
  {
    "id": "60",
    "pwds": [
      "QDW7"
    ]
  },
  {
    "id": "61",
    "pwds": [
      "NWWP"
    ]
  },
  {
    "id": "62",
    "pwds": [
      "8QQV"
    ]
  },
  {
    "id": "63",
    "pwds": [
      "6NH5"
    ]
  },
  {
    "id": "64",
    "pwds": [
      "DW9V"
    ]
  },
  {
    "id": "65",
    "pwds": [
      "ALZE"
    ]
  },
  {
    "id": "66",
    "pwds": [
      "TAZR"
    ]
  },
  {
    "id": "67",
    "pwds": [
      "SBEZ"
    ]
  },
  {
    "id": "68",
    "pwds": [
      "X8ZV"
    ]
  },
  {
    "id": "69",
    "pwds": [
      "RH76"
    ]
  },
  {
    "id": "70",
    "pwds": [
      "4R9L"
    ]
  },
  {
    "id": "71",
    "pwds": [
      "T5YA"
    ]
  },
  {
    "id": "72",
    "pwds": [
      "UD9V"
    ]
  },
  {
    "id": "73",
    "pwds": [
      "VVHB"
    ]
  },
  {
    "id": "74",
    "pwds": [
      "ZBKB"
    ]
  },
  {
    "id": "75",
    "pwds": [
      "53KG"
    ]
  },
  {
    "id": "76",
    "pwds": [
      "M5V5"
    ]
  },
  {
    "id": "77",
    "pwds": [
      "H33F"
    ]
  },
  {
    "id": "78",
    "pwds": [
      "U8D3"
    ]
  },
  {
    "id": "79",
    "pwds": [
      "NRSH"
    ]
  },
  {
    "id": "80",
    "pwds": [
      "XTC7"
    ]
  },
  {
    "id": "81",
    "pwds": [
      "6QZ5"
    ]
  },
  {
    "id": "82",
    "pwds": [
      "C4AZ"
    ]
  },
  {
    "id": "83",
    "pwds": [
      "RTQK"
    ]
  },
  {
    "id": "84",
    "pwds": [
      "UEZN"
    ]
  },
  {
    "id": "85",
    "pwds": [
      "GWYY"
    ]
  },
  {
    "id": "86",
    "pwds": [
      "CU52"
    ]
  },
  {
    "id": "87",
    "pwds": [
      "8EP8"
    ]
  },
  {
    "id": "88",
    "pwds": [
      "J93S"
    ]
  },
  {
    "id": "89",
    "pwds": [
      "J3DU"
    ]
  },
  {
    "id": "90",
    "pwds": [
      "458P"
    ]
  },
  {
    "id": "91",
    "pwds": [
      "L6FN"
    ]
  },
  {
    "id": "92",
    "pwds": [
      "NQW9"
    ]
  },
  {
    "id": "93",
    "pwds": [
      "WK7E"
    ]
  },
  {
    "id": "94",
    "pwds": [
      "RC3N"
    ]
  },
  {
    "id": "95",
    "pwds": [
      "3Q7D"
    ]
  },
  {
    "id": "96",
    "pwds": [
      "7LQW"
    ]
  },
  {
    "id": "97",
    "pwds": [
      "4M5W"
    ]
  },
  {
    "id": "98",
    "pwds": [
      "NE4L"
    ]
  },
  {
    "id": "99",
    "pwds": [
      "Y7BK"
    ]
  },
  {
    "id": "100",
    "pwds": [
      "329Z"
    ]
  }
];

// 座位模式说明（门禁可见）
window.SEAT_HELP = [
  '✅ 座位模式说明（已上线 100 个座位）',
  '· 每人一个专属链接，数据按座位完全隔离（各自独立的 localStorage 命名空间，互不串档）。',
  '· 首次打开链接：输入本座位口令完成设备绑定 → 进入系统；之后本机免输口令。',
  '· 换设备打开：需再次输入口令；口令是真正的钥匙。',
  '· 前 50 座支持新旧两套口令，任一口令均可进入（旧口令长期有效）。',
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
    id: seat.id, pwd: (seat.pwds && seat.pwds[0]) || seat.pwd, pwds: seat.pwds || [seat.pwd],
    ns: "seat" + seat.id + "_", bound: isBound(), isBound: isBound, bind: bind
  } : { id: null, pwd: null, pwds: [], ns: "", bound: false, isBound: function(){ return false; }, bind: function(){} };
})();
