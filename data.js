// 化石あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、大阪府教育委員会の中学1年理科プリント・群馬県立自然史博物館のワークシート・大阪府教育センターの標本紹介・沖縄県立博物館・美術館のワークシート（下の SRC。2026-11-17 に読んだ）で確かめたことだけ。
// 1問は、説明を読んで、示準化石（三葉虫・フズリナ・アンモナイト・恐竜・ビカリア）を選ぶ。正解したら2段目「どの時代？」を選ぶ。
// 示相化石（サンゴなど）は今日のまめ知識で扱う。岩石は「岩石なかま分け」で扱う。
// 選び肢は、ほかの4つから選ぶ（やさしいは2つ、ふつう・むずかしいは3つ）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    osk: ["大阪府教育委員会 中学1年理科 補充プリント（解答）「地層の重なりと過去の様子」", "https://www.pref.osaka.lg.jp/documents/25642/tisou_hoju_kai_01.pdf"],
    gunma: ["群馬県立自然史博物館 ワークシート「大地の成り立ちと変化：化石編」", "https://www.gmnh.pref.gunma.jp/wp-content/uploads/worksheet_04.pdf"],
    oskc: ["大阪府教育センター「古生物関係標本の紹介 その１」", "https://www.osaka-c.ed.jp/kate/rika2/osaka&science/2005-t1-1.pdf"],
    okimu: ["沖縄県立博物館・美術館 ワークシート「化石は語る」", "https://okimu.jp/userfiles/files/page/museum/education/worksheet/003/Q3.pdf"],
  };

  // 答えになる5つ
  const CLASSES = ["三葉虫", "フズリナ", "アンモナイト", "恐竜", "ビカリア"];

  // 2段目「どの時代？」の3つ
  const GROUPS = {
    kosei: { name: "古生代", sub: "三葉虫やフズリナが栄えた" },
    chusei: { name: "中生代", sub: "アンモナイトや恐竜が栄えた" },
    shinsei: { name: "新生代", sub: "ビカリアやナウマンゾウの時代" },
  };
  // どんな生き物のなかま（「なぜ」に出す。群馬県立自然史博物館・大阪府教育センター）
  const CATS = { setsusoku: "節足動物のなかま", gensei: "原生動物のなかま", ikatako: "イカやタコのなかま", kyoryu: "中生代を代表する生き物", kisui: "海水と淡水のまじる所を好んだ" };
  // 答えごとの決まり。2段目・なかま・決め手はこの表で決まる（qa/run.mjs が別に持った表でも確かめる）
  const RULE = {
    "三葉虫": { grp: "kosei", cat: "setsusoku", key: "三葉虫は古生代の示準化石です。昆虫やエビ、カニと同じ節足動物のなかまです。" },
    "フズリナ": { grp: "kosei", cat: "gensei", key: "フズリナ（ボウスイチュウ）は古生代の示準化石です。石炭紀に現れ、ペルム紀の終わりに絶滅しました。" },
    "アンモナイト": { grp: "chusei", cat: "ikatako", key: "アンモナイトは中生代の示準化石です。イカやタコのなかまと考えられています。" },
    "恐竜": { grp: "chusei", cat: "kyoryu", key: "恐竜は中生代を代表する示準化石です。中生代に大はんえいしました。" },
    "ビカリア": { grp: "shinsei", cat: "kisui", key: "ビカリアは新生代の示準化石です。海水と淡水のまじる所を好んだと考えられています。" },
  };

  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  const MEDIA = ["理科室で", "理科の授業で", "実験ノートで", "家で", "テスト勉強で"];
  // 問いの前につく言い方（どれでも答えは同じ）
  const PRE = ["理科の授業で。", "プリントの問題。", "教科書のまとめ。", "テスト勉強で。", "ノートより。"];

  // どれかを当てる問題。ans：答え、sit：言い方。選び肢は、ほかの4つから（やさしいは2つ、ふつう・むずかしいは3つ）
  function which(ans, sit) {
    const near = CLASSES.filter((c) => c !== ans);
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), mi = ri(R, 0, MEDIA.length - 1);
      const n = lv === 0 ? 2 : 3, ds = pickN(R, near, n);
      const q = sit[si] + "　どの化石？";
      return { type: "act", media: MEDIA[mi], q, opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${mi}` };
    };
  }
  // 1つの種類を作る。grp・cat・key は答えの決まり RULE から。clue は手がかりの文（PRE と組む）
  function K(id, lv, ans, name, src, look, why, clue) {
    const r = RULE[ans];
    return { id, lv, grp: r.grp, cat: r.cat, ans, name, src, look, key: r.key, why, make: which(ans, clue.flatMap((c) => PRE.map((p) => p + c))) };
  }

  const KINDS = [
    // ---- やさしい ----
    K("t_setsusoku", 0, "三葉虫", "節足動物の化石", ["gunma", "osk"], "昆虫やエビ、カニのなかまです。",
      "三葉虫は、昆虫やエビ、カニなどがふくまれる節足動物のなかまで、古生代の示準化石です（群馬県立自然史博物館・大阪府のプリント）。",
      ["昆虫やエビ、カニと同じ節足動物のなかまで、古生代の地層から見つかる化石。"]),
    K("f_bousui", 0, "フズリナ", "ボウスイチュウ", ["oskc"], "古生代の小さな生き物です。",
      "フズリナはボウスイチュウともよばれ、石炭紀の初めごろに現れて、ペルム紀の終わりに絶滅しました（大阪府教育センター）。",
      ["ボウスイチュウともよばれ、古生代の地層から見つかる小さな生き物の化石。"]),
    K("a_ikatako", 0, "アンモナイト", "イカやタコのなかま", ["gunma", "osk"], "中生代の海の生き物です。",
      "アンモナイトは、イカやタコのなかまと考えられていて、中生代の示準化石です（群馬県立自然史博物館・大阪府のプリント）。",
      ["イカやタコのなかまと考えられていて、中生代の地層から見つかる化石。"]),
    K("k_tyranno", 0, "恐竜", "ティランノサウルス", ["gunma"], "中生代を代表する生き物です。",
      "恐竜は中生代を代表する示準化石です。ティランノサウルスは白亜紀の恐竜です（群馬県立自然史博物館）。",
      ["中生代を代表する示準化石で、ティランノサウルスもこのなかま。"]),
    K("b_okayama", 0, "ビカリア", "新生代の化石", ["gunma", "osk"], "新生代の示準化石はどれか。",
      "ビカリアは新生代の示準化石です（大阪府のプリント）。岡山県の新第三紀の地層からも見つかっています（群馬県立自然史博物館）。",
      ["新生代の示準化石で、岡山県の新第三紀の地層からも見つかる化石。"]),
    // ---- ふつう ----
    K("t_ordovice", 1, "三葉虫", "オルドビス紀", ["gunma"], "古生代の節足動物です。",
      "群馬県立自然史博物館の標本の三葉虫は、古生代・オルドビス紀のロシア産です。三葉虫は節足動物のなかまです。",
      ["古生代のオルドビス紀の地層から見つかった、節足動物の化石。"]),
    K("f_sekitan", 1, "フズリナ", "石炭紀からペルム紀", ["oskc"], "古生代の中だけで栄えたものです。",
      "フズリナは、石炭紀初期の終わりごろに出現してペルム紀末に絶滅しました（大阪府教育センター）。",
      ["石炭紀の初めのころに現れ、ペルム紀の終わりに絶滅した化石。"]),
    K("a_hakua", 1, "アンモナイト", "とくに中生代に栄えた", ["oskc"], "古生代から白亜紀まで生きていました。",
      "広い意味のアンモナイト類は古生代中期に出現し白亜紀末に絶滅しました。特に中生代に栄え、重要な示準化石です（大阪府教育センター）。",
      ["古生代の中ごろに現れ、白亜紀の終わりに絶滅し、とくに中生代に栄えた化石。"]),
    K("k_ha", 1, "恐竜", "歯の形で食べ物がわかる", ["gunma"], "中生代を代表する生き物です。",
      "群馬県立自然史博物館のワークシートでは、恐竜の歯の形から、植物食か肉食かを考えます。恐竜は中生代を代表する示準化石です。",
      ["中生代を代表する示準化石で、歯の形から植物食か肉食かを考えられる生き物。"]),
    K("b_kisui", 1, "ビカリア", "汽水の湿地を好んだ", ["oskc"], "海水と淡水がまじる所です。",
      "ビカリアは、熱帯のマングローブ湿地のような汽水の混じる環境を好んだと思われます（大阪府教育センター）。",
      ["熱帯のマングローブ湿地のような、海水と淡水のまじる所を好んだと考えられる化石。"]),
    // ---- むずかしい ----
    K("t_asaphus", 2, "三葉虫", "アサフス", ["gunma"], "節足動物の化石です。",
      "群馬県立自然史博物館のワークシートでは、アサフス・コワレゥスキーという三葉虫の化石（古生代・オルドビス紀、ロシア産）を見ます。",
      ["アサフス・コワレゥスキーという種類がある、古生代の節足動物の化石。"]),
    K("f_gensei", 2, "フズリナ", "原生動物", ["oskc"], "単細胞のなかまです。",
      "大阪府教育センターの標本紹介では、フズリナは原生動物の標本として、愛媛県の石炭紀の地層のものが紹介されています。",
      ["原生動物のなかまで、愛媛県の石炭紀の地層からも見つかっている化石。"]),
    K("a_hokkaido", 2, "アンモナイト", "キャリコケラス", ["gunma"], "イカやタコのなかまです。",
      "群馬県立自然史博物館のワークシートでは、キャリコケラス・オリエンターレというアンモナイト（中生代・白亜紀、北海道産）を見ます。",
      ["北海道の白亜紀の地層から見つかる、キャリコケラス・オリエンターレがなかまの化石。"]),
    K("k_camara", 2, "恐竜", "カマラサウルス", ["gunma"], "中生代を代表する生き物です。",
      "群馬県立自然史博物館のワークシートでは、カマラサウルス（ジュラ紀、アメリカ産）の歯から、植物食か肉食かを考えます。",
      ["アメリカのジュラ紀の地層から見つかった、カマラサウルスがなかまの生き物。"]),
    K("b_jiso", 2, "ビカリア", "示準化石で示相化石", ["oskc"], "新第三紀の化石です。",
      "ビカリアは、示準化石であるとともに示相化石としても重視されます。日本での産出はほとんどが新第三紀中新世です（大阪府教育センター）。",
      ["示準化石であるとともに、示相化石としても重視される、新第三紀の化石。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1問を作る。tag は「種類|種」（例 "t_setsusoku|2026-11-18:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null; // 継承した constructor などは知らない種類として扱う（CodeRabbit 2026-11-17）
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, cat: k.cat, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const KSA = { KINDS, BY, GROUPS, CATS, RULE, LV, SRC, CLASSES, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = KSA; else root.KSA = KSA;
})(typeof self !== "undefined" ? self : this);
