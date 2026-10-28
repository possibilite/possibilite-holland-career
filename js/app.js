/* 霍兰德测评 · 主逻辑
   流程：欢迎 → 第一部分(理想职业) → 打乱的是否题(分页) → 第五部分能力自评 → 结果与报告
   计分：各型 = (第二+三+四部分“是”计数) + 第五A评分 + 第五B评分
*/
(function () {
  "use strict";
  var D = window.HOLLAND_DATA;
  var REP = window.HOLLAND_REPORT;
  var app = document.getElementById("app");
  var STORE_KEY = "holland_sds_state_v1";
  var PER_PAGE = 6; // 每页题数（温和不拥挤）

  // ---------- 状态 ----------
  var state = load() || {
    started: false,
    ideals: ["", "", ""],
    order: shuffle(D.yesno.map(function (_, i) { return i; })), // 打乱后的题序
    answers: {},        // {questionIndex: 'yes'|'no'}
    p5A: {},            // {type: 1..7}
    p5B: {},
    step: 0             // 当前页索引（见 buildSteps）
  };

  // ---------- 工具 ----------
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } }
  function reset() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} location.reload(); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];}); }

  // ---------- 步骤定义 ----------
  // 0: welcome | 1: ideals | 2..(2+nQPages-1): 是否题 | 然后 part5A | part5B | results
  var nQPages = Math.ceil(D.yesno.length / PER_PAGE);
  function buildSteps() {
    var steps = ["welcome", "ideals"];
    for (var i = 0; i < nQPages; i++) steps.push("q:" + i);
    steps.push("p5:A");
    steps.push("p5:B");
    steps.push("results");
    return steps;
  }
  var STEPS = buildSteps();

  // ---------- 进度 ----------
  function updateProgress() {
    var wrap = document.getElementById("progressWrap");
    if (state.step <= 0 || STEPS[state.step] === "results") { wrap.hidden = true; return; }
    wrap.hidden = false;
    var pct = Math.round((state.step / (STEPS.length - 1)) * 100);
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressLabel").textContent = pct + "%";
  }

  // ---------- 导航 ----------
  function go(step) {
    state.step = step;
    save();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- 渲染分发 ----------
  function render() {
    var s = STEPS[state.step];
    if (s === "welcome") renderWelcome();
    else if (s === "ideals") renderIdeals();
    else if (s.indexOf("q:") === 0) renderQuestions(parseInt(s.split(":")[1], 10));
    else if (s === "p5:A") renderRating("A");
    else if (s === "p5:B") renderRating("B");
    else if (s === "results") renderResults();
    updateProgress();
  }

  // ---------- 页面：欢迎 ----------
  function renderWelcome() {
    var hasProgress = Object.keys(state.answers).length > 0 || state.started;
    app.innerHTML =
      '<div class="card welcome center">' +
        '<span class="hero-emoji">🌿</span>' +
        '<h1>认识自己，是温柔的开始</h1>' +
        '<p class="lead">这是一份基于霍兰德（Holland）职业兴趣理论的小测评。' +
        '没有对错，也没有时间限制——慢慢来，凭第一感觉回答就好。' +
        '完成后，它会陪你看看：你天然向往什么，擅长什么，适合往哪里走。</p>' +
        '<div class="pills"><span>约 8–12 分钟</span><span>共 6 个部分</span><span>结果可保存为 PDF</span></div>' +
        '<div class="btn-row" style="justify-content:center">' +
          '<button class="btn btn-primary btn-lg" id="startBtn">' + (hasProgress ? "继续上次" : "开始测评") + '</button>' +
          (hasProgress ? '<button class="btn btn-ghost" id="restartBtn">重新开始</button>' : "") +
        '</div>' +
      '</div>';
    document.getElementById("startBtn").onclick = function () {
      state.started = true;
      go(hasProgress && state.step > 1 ? state.step : 1);
    };
    var rb = document.getElementById("restartBtn");
    if (rb) rb.onclick = reset;
  }

  // ---------- 页面：第一部分 理想职业 ----------
  function renderIdeals() {
    app.innerHTML =
      '<div class="card">' +
        '<span class="q-section-tag">第一部分 · 你心目中的理想方向</span>' +
        '<h2>如果不设限，你最想做的是什么？</h2>' +
        '<p class="muted">写下你最想从事的 3 种职业，或最想读的 3 个专业。' +
        '可以很具体，也可以很朦胧——没想好也没关系，可以留空，最后我们再一起对照。</p>' +
        [0, 1, 2].map(function (i) {
          return '<div class="ideal-field"><label>第 ' + (i + 1) + ' 个</label>' +
            '<input class="text-input" data-i="' + i + '" placeholder="例如：心理咨询师 / 产品经理 / 还在探索…" value="' + esc(state.ideals[i] || "") + '"></div>';
        }).join("") +
        '<div class="btn-row split">' +
          '<button class="btn btn-ghost" id="backBtn">上一步</button>' +
          '<button class="btn btn-primary" id="nextBtn">下一步</button>' +
        '</div>' +
      '</div>';
    app.querySelectorAll(".text-input").forEach(function (inp) {
      inp.oninput = function () { state.ideals[+inp.dataset.i] = inp.value; save(); };
    });
    document.getElementById("backBtn").onclick = function () { go(state.step - 1); };
    document.getElementById("nextBtn").onclick = function () { go(state.step + 1); };
  }

  // ---------- 页面：是否题（打乱+分页） ----------
  function renderQuestions(pageIdx) {
    var start = pageIdx * PER_PAGE;
    var slice = state.order.slice(start, start + PER_PAGE);
    var rows = slice.map(function (qi, k) {
      var q = D.yesno[qi];
      var ans = state.answers[qi];
      return '<div class="q-item">' +
        '<div class="q-text"><span class="q-num">' + (start + k + 1) + '.</span>' + esc(q.text) + '</div>' +
        '<div class="yn-row" data-qi="' + qi + '">' +
          '<button class="yn-btn yes' + (ans === "yes" ? " active" : "") + '" data-v="yes"><span class="dot"></span>是的，喜欢 / 能做</button>' +
          '<button class="yn-btn no' + (ans === "no" ? " active" : "") + '" data-v="no"><span class="dot"></span>不太是</button>' +
        '</div></div>';
    }).join("");

    app.innerHTML =
      '<div class="card">' +
        '<span class="q-section-tag">凭感觉作答 · 第 ' + (pageIdx + 1) + ' / ' + nQPages + ' 页</span>' +
        '<h2>下面这些，是你的菜吗？</h2>' +
        '<p class="muted">喜欢、或大概能做到，就选「是的」；不太感兴趣或做不来，就选「不太是」。</p>' +
        rows +
        '<div class="hint-line" id="hint"></div>' +
        '<div class="btn-row split">' +
          '<button class="btn btn-ghost" id="backBtn">上一步</button>' +
          '<button class="btn btn-primary" id="nextBtn">下一步</button>' +
        '</div>' +
      '</div>';

    app.querySelectorAll(".yn-row").forEach(function (row) {
      var qi = +row.dataset.qi;
      row.querySelectorAll(".yn-btn").forEach(function (b) {
        b.onclick = function () {
          state.answers[qi] = b.dataset.v;
          row.querySelectorAll(".yn-btn").forEach(function (x) { x.classList.remove("active"); });
          b.classList.add("active");
          save();
          document.getElementById("hint").textContent = "";
        };
      });
    });
    document.getElementById("backBtn").onclick = function () { go(state.step - 1); };
    document.getElementById("nextBtn").onclick = function () {
      var unanswered = slice.filter(function (qi) { return !state.answers[qi]; });
      if (unanswered.length) {
        document.getElementById("hint").textContent = "还有 " + unanswered.length + " 题没作答，慢慢来，先把这页填完吧 🌱";
        return;
      }
      go(state.step + 1);
    };
  }

  // ---------- 页面：第五部分 能力自评 ----------
  function renderRating(which) {
    var labels = which === "A" ? D.part5.A : D.part5.B;
    var store = which === "A" ? state.p5A : state.p5B;
    var order = D.part5.order;
    var title = which === "A" ? "你的能力，自己怎么看？" : "再看看这些技能呢？";
    var sub = which === "A"
      ? "和同龄人比一比，给自己每一项能力打个分。数字越大代表越强。无所谓谦虚——尽量别全打一样的分哦。"
      : "同样地，凭你的真实感觉打分。这是最后一部分啦。";

    var items = order.map(function (t, i) {
      var cur = store[t];
      var btns = "";
      for (var v = 1; v <= 7; v++) {
        btns += '<button data-v="' + v + '" class="' + (cur === v ? "active" : "") + '">' + v + '</button>';
      }
      return '<div class="rate-item">' +
        '<div class="rate-label"><span class="q-num">' + D.typeNames[t] + '</span> · ' + esc(labels[i]) + '</div>' +
        '<div class="scale" data-t="' + t + '">' + btns + '</div>' +
        '<div class="scale-ends"><span>1 · 较弱</span><span>较强 · 7</span></div>' +
      '</div>';
    }).join("");

    app.innerHTML =
      '<div class="card">' +
        '<span class="q-section-tag">第五部分 · 能力自评（' + which + '）</span>' +
        '<h2>' + title + '</h2>' +
        '<p class="muted">' + sub + '</p>' +
        items +
        '<div class="hint-line" id="hint"></div>' +
        '<div class="btn-row split">' +
          '<button class="btn btn-ghost" id="backBtn">上一步</button>' +
          '<button class="btn btn-primary" id="nextBtn">' + (which === "B" ? "看看我的结果" : "下一步") + '</button>' +
        '</div>' +
      '</div>';

    app.querySelectorAll(".scale").forEach(function (sc) {
      var t = sc.dataset.t;
      sc.querySelectorAll("button").forEach(function (b) {
        b.onclick = function () {
          store[t] = +b.dataset.v;
          sc.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
          b.classList.add("active");
          save();
          document.getElementById("hint").textContent = "";
        };
      });
    });
    document.getElementById("backBtn").onclick = function () { go(state.step - 1); };
    document.getElementById("nextBtn").onclick = function () {
      var missing = order.filter(function (t) { return !store[t]; });
      if (missing.length) {
        document.getElementById("hint").textContent = "还有 " + missing.length + " 项没评分呢，给自己一个分数吧 🌷";
        return;
      }
      go(state.step + 1);
    };
  }

  // ---------- 计分 ----------
  function computeScores() {
    var order = D.order;
    var perPart = {}; order.forEach(function (t) { perPart[t] = { 2: 0, 3: 0, 4: 0 }; });
    Object.keys(state.answers).forEach(function (qi) {
      if (state.answers[qi] === "yes") {
        var q = D.yesno[+qi];
        perPart[q.type][q.part]++;
      }
    });
    var totals = {};
    order.forEach(function (t) {
      totals[t] = perPart[t][2] + perPart[t][3] + perPart[t][4] +
        (state.p5A[t] || 0) + (state.p5B[t] || 0);
    });
    var ranked = order.slice().sort(function (a, b) { return totals[b] - totals[a]; });
    return { perPart: perPart, totals: totals, ranked: ranked, top3: ranked.slice(0, 3) };
  }

  // ---------- 页面：结果 + 报告 ----------
  function renderResults() {
    var sc = computeScores();
    var TD = REP.types;
    var max = Math.max.apply(null, D.order.map(function (t) { return sc.totals[t]; })) || 1;

    var badges = sc.top3.map(function (t) {
      return '<div class="c"><span class="L">' + t + '</span><span class="n">' + TD[t].name + '</span></div>';
    }).join("");

    var bars = D.order.slice().sort(function (a, b) { return sc.totals[b] - sc.totals[a]; }).map(function (t) {
      var w = Math.round((sc.totals[t] / max) * 100);
      return '<div class="bar-row"><div class="lab"><b>' + t + '</b>' + TD[t].name + '</div>' +
        '<div class="bar-track"><div class="bar-val" data-w="' + w + '"></div></div>' +
        '<div class="num">' + sc.totals[t] + '</div></div>';
    }).join("");

    var idealList = state.ideals.filter(function (x) { return x && x.trim(); });
    var idealHtml = idealList.length
      ? '<div class="ideal-recall">还记得一开始你写下的理想方向吗：<b>' + idealList.map(esc).join("、") +
        '</b>。把它们和下面的结果对照一下——它们之间呼应得越多，说明你越了解自己；如果差距挺大，也许正是值得探索的新可能。</div>'
      : '';

    var reportBlocks = sc.top3.map(function (t, idx) {
      var d = TD[t];
      return '<div class="report-block">' +
        '<div class="rt"><span class="em">' + d.emoji + '</span><h3>' + (idx === 0 ? "主导 · " : (idx === 1 ? "次要 · " : "第三 · ")) + d.letter + " " + d.name + '</h3></div>' +
        '<p class="tagline">' + d.tagline + '</p>' +
        '<p>' + d.summary + '</p>' +
        '<h4>你的优势</h4><div class="chip-row">' + d.strengths.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join("") + '</div>' +
        '<h4>适合你的方向</h4><div class="chip-row">' + d.careers.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join("") + '</div>' +
        '<h4>适合的环境</h4><p class="muted">' + d.environments + '</p>' +
        '<h4>需要留意 / 尽量规避</h4><div class="avoid-box">' + d.avoid + '</div>' +
      '</div>';
    }).join("");

    app.innerHTML =
      '<div class="card">' +
        '<div class="center">' +
          '<span class="q-section-tag">你的霍兰德代码</span>' +
          '<h1>' + sc.top3.join("") + '</h1>' +
          '<div class="code-badge">' + badges + '</div>' +
        '</div>' +
        '<p class="lead">' + REP.comboIntro(sc.top3, TD) + '</p>' +
        '<h2 style="margin-top:30px">六型得分一览</h2>' +
        '<div class="bars">' + bars + '</div>' +
        idealHtml +
        '<h2 style="margin-top:30px">为你写的解读</h2>' +
        reportBlocks +
        '<div class="report-block no-print" style="background:var(--sage-tint);border-color:var(--sage-soft)">' +
          '<h4 style="margin-top:0">保存这份结果</h4>' +
          '<p class="muted" style="margin:0 0 14px">点下面的按钮即可保存为 PDF（在打印窗口里选择「另存为 PDF」），方便随时回看或分享。</p>' +
          '<div class="btn-row" style="margin:0">' +
            '<button class="btn btn-primary" id="pdfBtn">下载 / 打印 PDF</button>' +
            '<button class="btn btn-ghost" id="redoBtn">重新测一次</button>' +
          '</div>' +
          '<div class="email-box">' +
            '<input class="text-input" id="emailInput" placeholder="想把报告发到邮箱？输入邮箱地址…" type="email">' +
            '<button class="btn btn-ghost" id="emailBtn" disabled>发送到邮箱（即将上线）</button>' +
          '</div>' +
          '<p class="tiny">邮件发送需要后端 / 邮件服务支持，已在代码中预留接口（见 sendReportByEmail）。当前版本可先用 PDF 保存。</p>' +
        '</div>' +
      '</div>';

    // 动画填充进度条
    requestAnimationFrame(function () {
      app.querySelectorAll(".bar-val").forEach(function (el) { el.style.width = el.dataset.w + "%"; });
    });
    document.getElementById("pdfBtn").onclick = function () { window.print(); };
    document.getElementById("redoBtn").onclick = reset;
    document.getElementById("emailBtn").onclick = function () {
      sendReportByEmail(document.getElementById("emailInput").value, sc);
    };
  }

  // ---------- 邮件发送接口（预留） ----------
  // 接入方式见 README：可用 EmailJS（纯前端）或自建后端 /api/send-report。
  function sendReportByEmail(email, scores) {
    alert("邮件功能尚未接入。\n\n要启用，请在 js/app.js 的 sendReportByEmail() 中接入 EmailJS 或你的后端接口，详见 README。");
    /* 示例（EmailJS）：
       emailjs.send("service_id","template_id",{
         to_email: email,
         code: scores.top3.join(""),
         report_html: document.querySelector(".card").innerHTML
       });
    */
  }

  // 启动
  render();
})();
