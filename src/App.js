import { useState, useEffect, useMemo } from "react";

// =============================================
// ⚙️ 設定（変更してください）
// =============================================
const SUPABASE_URL = "https://ipabkpmtvxoglxtbnmqo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwYWJrcG10dnhvZ2x4dGJubXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjk0ODIsImV4cCI6MjA5MTgwNTQ4Mn0.nDpu12cYIErWjItlcfxbIGKUlWoxh3Yo3BGAvk86G_o";
const ADMIN_PASSWORD = "camel2027rakuda"; // ← 必ず変更してください

// =============================================
// Supabase REST ヘルパー
// =============================================
const sb = async (path, method = "GET", body = null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => null);
};

// =============================================
// 初期FAQデータ（Discordより要約・匿名化）
// =============================================
const SEED_FAQS = [
  { category: "先生・授業の口コミ", question: "スペイン語のマリア先生はどんな先生ですか？", answer: "声が大きく、指名して発言させることが多いですが、親切で話を聞いていれば問題ありません。期末はペーパーテストです。初回授業でスペイン語の愛称を決め、1年間それで呼ばれます。" },
  { category: "先生・授業の口コミ", question: "スペイン語の倉田先生・パウ先生のクラスはきついですか？", answer: "倉田先生は基礎クラスの中で最も厳しいと言われますが、単位は取れます。正解でも不正解でも怒ることがある点は覚悟を。パウ先生は難易度が高く、単位を落とす人が多数います。GPAを重視するなら要注意。1限パウが最難関で、2〜3限は前クラスの試験情報が回ってくる分、若干有利です。" },
  { category: "先生・授業の口コミ", question: "ドイツ語のイェンス先生（オストヴァルト）はどうですか？", answer: "先輩たちが口を揃えて「神」と評する人気の先生です。ブラックジョークが面白く、お菓子をくれることも。日本語が上手で説明もわかりやすく、授業はゲームや会話がメインで飽きません。宿題やミニテストを頑張ればA以上が見込めます。" },
  { category: "先生・授業の口コミ", question: "ドイツ語のトレッフェルト先生はどんな先生ですか？", answer: "フルネームが「トレッフェルト・ミョウジン・ラルフ・ヴィルヘルム」とかなり長いです。明るく気さくで授業も楽しいと評判。ただし成績はしっかりつける先生のため、出席・授業態度・テストをバランスよくこなす必要があります。コミュニケーションが苦手でも真面目に取り組めば評価してくれます。" },
  { category: "先生・授業の口コミ", question: "中国語の喬志航先生は怖いですか？", answer: "授業中の雰囲気は怖めですが、真面目に取り組めば単位は問題なく取れます。そこそこのテスト勉強と全出席でAも可能です。授業外で話しかけると笑顔を見せてくれます。マイルストーンの評価は低いですが、実際はそこまで心配しなくて大丈夫という声が多いです。" },
  { category: "先生・授業の口コミ", question: "中国語の加藤茂雄先生の授業はどんな感じですか？", answer: "声が小さめで、生徒を指名してワークの問題を板書させる形式です。テストは中間・期末の2回で、ワークの内容から出題されます。難易度は高くありませんが、ノー勉だと厳しいので事前の予習が安心です。" },
  { category: "先生・授業の口コミ", question: "英語のムラーセロン先生の授業内容は？", answer: "先生自体は明るく話しやすいです。Current Topicsでは2〜3週ごとに4〜5人グループでJapan Timesの記事を使った発表スライド（音声付き）を作成します。単位取得だけなら問題ありませんが、A+を狙うには出席・発表の質・他グループへのリアクションが重要です。" },
  { category: "先生・授業の口コミ", question: "情報学の服部先生はどんな先生ですか？", answer: "人柄が親切で、成績の付け方も悪い評判は聞かない先生です。毎回のリフレクションや出欠・グループワークが評価の中心で、特に大きなハードルはないでしょう。" },
  { category: "履修登録の基本", question: "1年春学期に履修できない科目はありますか？", answer: "専門科目IIB（発展科目）は1年春学期には履修できません。配当年次「1年以上」と書かれていても1年春には取れない罠科目があります。科目登録の手引きを必ず確認し、時間割を組む前にチェックしましょう。" },
  { category: "履修登録の基本", question: "春学期の単位上限は何単位ですか？", answer: "春学期の上限は24単位です。春クォーター・夏クォーター・夏期集中・通年科目の単位を合計した数が対象になります。" },
  { category: "履修登録の基本", question: "人気科目は1次登録で申請しないと取れませんか？", answer: "基本的に1次登録で申請することが重要です。人気科目に2次・3次の枠はほとんどありません。選外率の高い授業は科目登録の手引きp.44〜45にまとめられているので事前に確認しましょう。" },
  { category: "履修登録の基本", question: "秋学期はどのくらい単位を取ればよいですか？", answer: "秋チュートリアルEnglishがある人は特に注意が必要です。秋は必修の課題が重くなりがちで、モチベーションも下がりやすいため、可能であれば春に多めに取っておくのがおすすめです。春24・秋17〜18単位程度を目安にする先輩も多いです。" },
  { category: "履修登録の基本", question: "教職課程を取りたい場合、1年春から何を履修すればよいですか？", answer: "学部要項p.70〜81および科目登録の手引きp.65〜の教職ページを参照してください。1年春に取れる科目は限られますが、「社会学」「経済学」「宗教学」などは春から履修可能です。MyWasedaにログイン後、教育支援センターのガイダンス資料も合わせて確認すると整理しやすいです。" },
  { category: "履修登録の基本", question: "基盤科目と人間科学教養科目はどちらを先に取るべきですか？", answer: "どちらが先でも問題ありません。ゼミ指定になるか・今の自分の興味・授業の人気度（選外率）・時限の都合などを基準に選ぶと良いでしょう。2年までに取り切ることを意識しておくと後が楽です。" },
  { category: "時間割の組み方", question: "所沢キャンパスと東伏見キャンパスの授業を同じ日に組めますか？", answer: "1コマ空きコマを作れば同じ日に組めます（例：3限まで所沢→4限空き→5限東伏見）。バスの混雑によって移動時間が変わるため、余裕を持った設計をしましょう。" },
  { category: "時間割の組み方", question: "オンデマンド科目の管理のコツはありますか？", answer: "クォーター科目は期限管理が特に重要です。詰め込みすぎると視聴しきれなくなるため、週ごとの視聴ペースを決めておくのが安心です。プログラミング初級（Python）は後半で難易度が上がるため、早めに進めておくのをおすすめします。" },
  { category: "システム・ツールの使い方", question: "履修登録はどこから行いますか？", answer: "MyWasedaをいったんログアウトした状態で、早稲田大学のホームページからMyWasedaを開くと履修登録画面が表示されます。毎回手間なら、その履修登録専用ページをブックマークしておくと便利です。" },
  { category: "システム・ツールの使い方", question: "シラバスをうまく検索するコツはありますか？", answer: "キーワード欄より、曜日・時限・担当教員名・開講学部で絞り込む方が効率的です。GECの科目は開講学部を「グローバル」に設定して検索してください。オープン科目の一覧はPowerBIのリンク（わせコマなどに掲載）からも確認できます。" },
  { category: "システム・ツールの使い方", question: "チュートリアルEnglishのクラスはどこで確認できますか？", answer: "Tutorial Canvas（MyWaseda→授業→授業関連→Tutorial Canvas）で確認できます。春夏クォーターは春学期に、秋冬クォーターは秋学期にクラス発表があります。初週は休みのことが多いので焦らなくて大丈夫です。" },
  { category: "システム・ツールの使い方", question: "履修登録期間中にわせコマが重くなるのはなぜですか？", answer: "登録期間中はアクセスが集中しサーバーに負荷がかかるため、検索が遅くなります。その際は公式の早稲田シラバスを代わりに使いましょう。また早めに時間割を組んでおくとこの問題を回避できます。" },
  { category: "キャンパス・学生生活", question: "MacBookは512GBと1TBどちらがよいですか？", answer: "多くの先輩の意見では512GBで十分です。Googleドライブ・iCloudなどのクラウドと組み合わせれば、授業資料・課題・各種ソフトをインストールしてもほとんどの場合で余裕があります。購入先は生協・Apple Store・家電量販店など、ポイント還元や保険の有無を比較して選ぶとよいでしょう。" },
  { category: "キャンパス・学生生活", question: "生協には加入した方がいいですか？", answer: "所沢キャンパス生は加入を強くおすすめします。キャンパス周辺は飲食店がほぼなく、学食が実質ライフラインです。生協加入で学食が割引になるメリットが大きいです。保険などのオプションは必要性を感じてから検討すれば十分という声が多数。" },
  { category: "キャンパス・学生生活", question: "小手指から所沢キャンパスまでバスで何分かかりますか？", answer: "通常15〜20分ほどです。夕方や祝日など混雑時は30分かかることもあります。特に帰り（所沢キャンパス→小手指方向）が混みやすいので余裕を持って行動しましょう。" },
  { category: "キャンパス・学生生活", question: "LANGX（英語クラス分けテスト）を受けそびれたらどうなりますか？", answer: "最も下のクラスになる可能性が高いですが、デメリットはほぼありません。むしろ内容が簡単で成績も取りやすいという声もあります。チームで受ける授業なので、出席を続けてチームメンバーと仲良くなることが大切です。" },
  { category: "キャンパス・学生生活", question: "教科書はいつ買えばよいですか？", answer: "授業1週目に出席してから先生の指示を聞いて購入するのがおすすめです。シラバスに「必須」とあっても実際は不要な場合があります。ただしチュートリアルEnglishと第二外国語の教科書はほぼ確実に必要なため、早めに購入しておきましょう。" },
];

const CAT_COLOR = {
  "先生・授業の口コミ": { bg: "#fdf0e8", text: "#8a3a00", border: "#f5a96e" },
  "履修登録の基本":     { bg: "#e8f3fd", text: "#0a4a8a", border: "#6eaff5" },
  "時間割の組み方":     { bg: "#eaf6ea", text: "#1a6a2a", border: "#6ed48a" },
  "システム・ツールの使い方": { bg: "#f3e8fd", text: "#5a0a8a", border: "#b06ef5" },
  "キャンパス・学生生活": { bg: "#fdf5e8", text: "#7a5a00", border: "#f5d06e" },
};

const Badge = ({ cat }) => {
  const c = CAT_COLOR[cat] || { bg: "#f0f0f0", text: "#555", border: "#ccc" };
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "20px",
      whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{cat}</span>
  );
};

const FAQItem = ({ item, isOpen, onToggle }) => (
  <div style={{ borderBottom: "1px solid #e5e0d8", background: isOpen ? "#faf8f5" : "transparent" }}>
    <button onClick={onToggle} style={{ width: "100%", textAlign: "left", padding: "20px 24px",
      background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "14px" }}>
      <span style={{ flexShrink: 0, width: "26px", height: "26px",
        background: isOpen ? "#1a3a6a" : "#ddd8d0", color: isOpen ? "#fff" : "#666",
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 800, fontFamily: "Georgia, serif", transition: "all 0.2s", marginTop: "2px" }}>Q</span>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: "6px" }}><Badge cat={item.category} /></div>
        <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#1a1510", lineHeight: 1.6,
          fontFamily: "'Noto Serif JP', serif" }}>{item.question}</p>
      </div>
      <span style={{ flexShrink: 0, fontSize: "18px", color: "#999",
        transform: isOpen ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.2s", marginTop: "4px" }}>+</span>
    </button>
    <div style={{ maxHeight: isOpen ? "600px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
      <div style={{ padding: "0 24px 20px 64px", display: "flex", gap: "14px" }}>
        <span style={{ flexShrink: 0, width: "26px", height: "26px", background: "#c9973a", color: "#fff",
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: 800, fontFamily: "Georgia, serif" }}>A</span>
        <p style={{ margin: 0, fontSize: "14px", color: "#3a3228", lineHeight: 1.9,
          fontFamily: "'Noto Sans JP', sans-serif", whiteSpace: "pre-wrap" }}>{item.answer}</p>
      </div>
    </div>
  </div>
);

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  border: "1.5px solid #ddd", borderRadius: "6px", fontSize: "14px",
  fontFamily: "'Noto Sans JP', sans-serif", outline: "none", background: "#faf8f5",
};

const EditForm = ({ item, onSave, onCancel }) => {
  const [form, setForm] = useState(item || { category: Object.keys(CAT_COLOR)[0], question: "", answer: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e0d8cc", borderRadius: "10px", padding: "20px" }}>
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>カテゴリ</label>
        <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inputStyle }}>
          {Object.keys(CAT_COLOR).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>質問</label>
        <input value={form.question} onChange={e => set("question", e.target.value)}
          placeholder="質問を入力..." style={inputStyle} />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "12px", fontWeight: 700, color: "#666", display: "block", marginBottom: "4px" }}>回答</label>
        <textarea value={form.answer} onChange={e => set("answer", e.target.value)}
          placeholder="回答を入力..." rows={5}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => onSave(form)} style={{ padding: "8px 20px", background: "#1a3a6a", color: "#fff",
          border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>保存</button>
        <button onClick={onCancel} style={{ padding: "8px 20px", background: "#f0ece6", color: "#555",
          border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>キャンセル</button>
      </div>
    </div>
  );
};

export default function FAQSite() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("すべて");
  const [openId, setOpenId] = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await sb("/faqs?select=*&order=id");
      if (!data || data.length === 0) {
        await sb("/faqs", "POST", SEED_FAQS);
        const fresh = await sb("/faqs?select=*&order=id");
        setFaqs(fresh || []);
      } else {
        setFaqs(data);
      }
    } catch (e) {
      setError("データの読み込みに失敗しました: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categories = ["すべて", ...Object.keys(CAT_COLOR).filter(c => faqs.some(f => f.category === c))];
  const filtered = useMemo(() => faqs.filter(f => {
    const matchCat = activeCat === "すべて" || f.category === activeCat;
    const q = search.toLowerCase();
    const matchSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchCat && matchSearch;
  }), [faqs, search, activeCat]);

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setIsAdmin(true); setShowPwModal(false); setPwInput(""); setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const handleSave = async (form) => {
    try {
      if (editingId === "new") {
        await sb("/faqs", "POST", [{ ...form }]);
      } else {
        await sb(`/faqs?id=eq.${editingId}`, "PATCH", { ...form });
      }
      setEditingId(null);
      await load();
    } catch (e) { alert("保存に失敗しました: " + e.message); }
  };

  const handleDelete = async (id) => {
    try {
      await sb(`/faqs?id=eq.${id}`, "DELETE");
      setDeleteConfirm(null);
      await load();
    } catch (e) { alert("削除に失敗しました: " + e.message); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f0ea", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: "#12253d", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)" }} />
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "46px 24px 38px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "22px" }}>🐫</span>
                <span style={{ color: "#c9973a", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em" }}>ZURUZURU RAKUDA</span>
              </div>
              <h1 style={{ margin: "0 0 10px", color: "#fff", fontSize: "clamp(24px,5vw,34px)",
                fontFamily: "'Noto Serif JP', serif", fontWeight: 700, lineHeight: 1.3 }}>新入生FAQ</h1>
              <p style={{ margin: 0, color: "#8aa8c8", fontSize: "13px", lineHeight: 1.8 }}>
                先輩たちの知恵をまとめました。授業・履修・学生生活の疑問はここで解決！
              </p>
            </div>
            <button onClick={() => isAdmin ? setIsAdmin(false) : setShowPwModal(true)}
              title={isAdmin ? "管理者モードを終了" : "管理者でログイン"}
              style={{ background: isAdmin ? "#c9973a" : "rgba(255,255,255,0.08)",
                border: isAdmin ? "none" : "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px", padding: "8px 14px", cursor: "pointer",
                color: "#fff", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>
              {isAdmin ? "✏️ 編集中" : "🔒"}
            </button>
          </div>
        </div>
      </header>

      {/* 管理者バナー */}
      {isAdmin && (
        <div style={{ background: "#c9973a", padding: "10px 24px", textAlign: "center",
          fontSize: "13px", color: "#fff", fontWeight: 700 }}>
          管理者モード — Q&Aの追加・編集・削除ができます
          <button onClick={() => setEditingId("new")} style={{ marginLeft: "16px", padding: "4px 14px",
            background: "#fff", color: "#8a5a00", border: "none", borderRadius: "4px",
            fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>＋ 新規追加</button>
        </div>
      )}

      {/* 検索 */}
      <div style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "14px 24px" }}>
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "15px" }}>🔍</span>
            <input type="text" placeholder="キーワードで検索… 例：マリア先生、履修登録、MacBook"
              value={search} onChange={e => { setSearch(e.target.value); setOpenId(null); }}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 36px 10px 40px",
                border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "14px",
                fontFamily: "'Noto Sans JP', sans-serif", background: "#faf8f5", outline: "none" }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%",
                transform: "translateY(-50%)", background: "#bbb", border: "none", borderRadius: "50%",
                width: "17px", height: "17px", cursor: "pointer", fontSize: "10px", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => { setActiveCat(cat); setOpenId(null); }}
                style={{ padding: "5px 13px", borderRadius: "20px", fontSize: "12px",
                  fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600, cursor: "pointer",
                  border: "1.5px solid", borderColor: activeCat === cat ? "#1a3a6a" : "#ddd",
                  background: activeCat === cat ? "#1a3a6a" : "#faf8f5",
                  color: activeCat === cat ? "#fff" : "#666" }}>{cat}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 本体 */}
      <main style={{ maxWidth: "800px", margin: "28px auto", padding: "0 24px 60px" }}>
        {isAdmin && editingId === "new" && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#1a3a6a" }}>＋ 新しいQ&Aを追加</p>
            <EditForm item={null} onSave={handleSave} onCancel={() => setEditingId(null)} />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>読み込み中…</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#c0392b", background: "#fff", borderRadius: "10px" }}>⚠️ {error}</div>
        ) : (
          <>
            <div style={{ marginBottom: "14px", color: "#999", fontSize: "13px" }}>{filtered.length}件が見つかりました</div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "12px", color: "#999" }}>
                <div style={{ fontSize: "36px", marginBottom: "14px" }}>🔎</div>
                <p style={{ margin: 0 }}>「{search}」に一致する質問は見つかりませんでした。</p>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden",
                boxShadow: "0 2px 14px rgba(0,0,0,0.06)", border: "1px solid #e5e0d8" }}>
                {filtered.map(item => (
                  <div key={item.id}>
                    {isAdmin && editingId === item.id ? (
                      <div style={{ padding: "16px" }}>
                        <EditForm item={item} onSave={handleSave} onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <>
                        <FAQItem item={item} isOpen={openId === item.id}
                          onToggle={() => setOpenId(p => p === item.id ? null : item.id)} />
                        {isAdmin && (
                          <div style={{ padding: "0 24px 12px 64px", display: "flex", gap: "8px" }}>
                            <button onClick={() => setEditingId(item.id)} style={{ padding: "4px 12px",
                              background: "#e8f0f8", color: "#1a3a6a", border: "none", borderRadius: "4px",
                              fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>✏️ 編集</button>
                            <button onClick={() => setDeleteConfirm(item.id)} style={{ padding: "4px 12px",
                              background: "#fde8e8", color: "#8a1a1a", border: "none", borderRadius: "4px",
                              fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>🗑️ 削除</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: "40px", padding: "24px 28px",
          background: "linear-gradient(135deg, #12253d 0%, #1a3a6a 100%)",
          borderRadius: "12px", color: "#fff", display: "flex",
          alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "14px", fontFamily: "'Noto Serif JP', serif" }}>
              解決しない場合はDiscordで質問を
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#8aa8c8" }}>ずるずるらくだサーバーの質問チャンネルへどうぞ</p>
          </div>
          <span style={{ fontSize: "24px" }}>🐫</span>
        </div>
      </main>

      {/* パスワードモーダル */}
      {showPwModal && (
        <div onClick={() => { setShowPwModal(false); setPwError(false); setPwInput(""); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "14px", padding: "32px", width: "300px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 6px", fontFamily: "'Noto Serif JP', serif", color: "#12253d" }}>管理者ログイン</h3>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#888" }}>パスワードを入力してください</p>
            <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="パスワード"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px",
                border: `1.5px solid ${pwError ? "#e53" : "#ddd"}`, borderRadius: "6px",
                fontSize: "14px", marginBottom: "8px", outline: "none" }} />
            {pwError && <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#e53" }}>パスワードが違います</p>}
            <button onClick={handleLogin} style={{ width: "100%", padding: "10px", background: "#1a3a6a",
              color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              ログイン
            </button>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "14px", padding: "28px", width: "280px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 10px", color: "#8a1a1a" }}>本当に削除しますか？</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#666" }}>この操作は取り消せません。</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: "9px",
                background: "#c0392b", color: "#fff", border: "none", borderRadius: "6px",
                fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>削除する</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "9px",
                background: "#f0ece6", color: "#555", border: "none", borderRadius: "6px",
                fontSize: "13px", cursor: "pointer" }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
