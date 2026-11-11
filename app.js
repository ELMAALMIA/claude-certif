(() => {
  "use strict";
  const KEY = "ccl_v1";
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- state ----------
  const blank = () => ({ track: "developer", theme: null, tracks: {} });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch { S = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const T = () => {
    const t = S.track;
    S.tracks[t] = S.tracks[t] || { answers: {}, exams: [], lessons: {}, labs: {}, activeExam: null, examDate: "" };
    return S.tracks[t];
  };
  const D = () => window.CERT_DATA[S.track];
  const qid = i => S.track[0] + i;

  // ---------- theme ----------
  const applyTheme = () => { if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme; };
  applyTheme();
  $("#themeBtn").onclick = () => {
    const dark = S.theme ? S.theme === "dark" : !matchMedia("(prefers-color-scheme: light)").matches;
    S.theme = dark ? "light" : "dark"; save(); applyTheme();
  };
  $("#trackSel").value = S.track;
  $("#trackSel").onchange = e => { S.track = e.target.value; save(); route(); };

  // ---------- helpers ----------
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const dom = id => D().domains.find(d => d.id === id);
  const same = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  const pct = (n, d) => d ? Math.round(n / d * 100) : 0;
  const scaled = p => Math.round(100 + 900 * p);
  const bar = (p, cls = "") => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`;
  const tone = p => p >= 80 ? "ok" : p >= 60 ? "warn" : "bad";

  function domainStats() {
    const d = D(), t = T(), out = {};
    d.domains.forEach(x => out[x.id] = { seen: 0, right: 0, total: 0 });
    d.questions.forEach((q, i) => {
      const o = out[q.d]; o.total++;
      const a = t.answers[qid(i)];
      if (a) { o.seen++; if (a.ok) o.right++; }
    });
    return out;
  }
  function readiness() {
    const st = domainStats(); let r = 0;
    D().domains.forEach(x => { const s = st[x.id]; const acc = s.seen ? s.right / s.seen : 0; const cov = s.total ? s.seen / s.total : 0; r += x.weight * acc * Math.min(1, cov * 1.5); });
    return Math.round(r / D().domains.reduce((a, x) => a + x.weight, 0) * 100);
  }

  // ---------- question renderer ----------
  function renderQ(q, opts) {
    const { picked = [], reveal = false, onPick, num, total, letters = true } = opts;
    const multi = q.a.length > 1;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="row">${num ? `<span class="tag">Q ${num}${total ? " / " + total : ""}</span>` : ""}
        <span class="tag acc">${esc(dom(q.d).name)}</span>${q.s ? `<span class="tag">Scenario: ${esc(q.s)}</span>` : ""}
        ${multi ? `<span class="tag">Select ${q.a.length}</span>` : ""}</div>
      <div class="q">${esc(q.q)}</div>
      <div class="opts">${q.o.map((o, i) => {
        let c = picked.includes(i) ? "sel" : "";
        if (reveal) c = q.a.includes(i) ? "right" : picked.includes(i) ? "wrong" : "";
        return `<div class="opt ${c}" data-i="${i}"><span class="k">${letters ? "ABCDEFG"[i] : ""}</span><span>${esc(o)}</span></div>`;
      }).join("")}</div>
      ${reveal ? `<div class="expl"><b>${same(picked, q.a) ? "✅ Correct." : "❌ Incorrect."}</b> Answer: ${q.a.map(i => "ABCDEFG"[i]).join(", ")}<br>${esc(q.e)}</div>` : ""}`;
    if (!reveal && onPick) wrap.querySelectorAll(".opt").forEach(el => el.onclick = () => {
      const i = +el.dataset.i; let p = picked.slice();
      if (multi) p = p.includes(i) ? p.filter(x => x !== i) : [...p, i]; else p = [i];
      onPick(p);
    });
    return wrap;
  }

  // ---------- views ----------
  function home() {
    const d = D(), t = T(), st = domainStats(), r = readiness();
    const answered = Object.keys(t.answers).filter(k => k[0] === S.track[0]).length;
    const right = Object.entries(t.answers).filter(([k, v]) => k[0] === S.track[0] && v.ok).length;
    const best = t.exams.length ? Math.max(...t.exams.map(e => e.scaled)) : null;
    const lessonsTotal = Object.values(d.lessons).reduce((a, l) => a + l.length, 0);
    const lessonsDone = Object.keys(t.lessons).length;
    const days = t.examDate ? Math.ceil((new Date(t.examDate) - new Date()) / 864e5) : null;
    const weakest = d.domains.map(x => ({ x, acc: st[x.id].seen ? st[x.id].right / st[x.id].seen : -1 }))
      .sort((a, b) => (a.acc - b.acc) || (b.x.weight - a.x.weight))[0];
    app.innerHTML = `
      <div class="hero">
        <div class="spread"><div>
          <span class="tag acc">${d.code}</span>
          <h1>${esc(d.name)}</h1>
          <p class="sub" style="margin:0">${d.exam.items} questions · ${d.exam.minutes} min · pass ${d.exam.pass}/1000 · ${d.exam.fee} · ${esc(d.exam.format)}</p>
        </div>
        <div class="row"><button onclick="location.hash='#/exam'">Start mock exam</button><button class="ghost" onclick="location.hash='#/practice'">Practice</button></div></div>
      </div>
      <div class="grid g4" style="margin-top:14px">
        <div class="card stat"><div class="n">${r}%</div><div class="l">Weighted readiness</div>${bar(r, tone(r))}</div>
        <div class="card stat"><div class="n">${answered}/${d.questions.length}</div><div class="l">Questions practised · ${pct(right, answered)}% correct</div>${bar(pct(answered, d.questions.length))}</div>
        <div class="card stat"><div class="n">${best ?? "—"}</div><div class="l">Best mock score (pass ${d.exam.pass})</div>${bar(best ? (best - 100) / 9 : 0, best >= d.exam.pass ? "ok" : "bad")}</div>
        <div class="card stat"><div class="n">${lessonsDone}/${lessonsTotal}</div><div class="l">Lessons completed</div>${bar(pct(lessonsDone, lessonsTotal))}</div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h3>Next best action</h3>
          ${answered < 10 ? `<p>Take a <b>10-question diagnostic</b> to find your weak domains.</p><button onclick="location.hash='#/practice?diag=1'">Run diagnostic</button>`
            : `<p>Your weakest area is <b>${esc(weakest.x.name)}</b> (${weakest.x.weight}% of the exam). Review the lesson, then drill it.</p>
               <div class="row"><button onclick="location.hash='#/learn/${weakest.x.id}'">Open lesson</button><button class="ghost" onclick="location.hash='#/practice?d=${weakest.x.id}'">Drill domain</button></div>`}
        </div>
        <div class="card"><h3>Exam date</h3>
          <div class="row"><input type="date" id="examDate" value="${t.examDate}" style="background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:6px;padding:6px">
          ${days !== null ? `<span class="tag acc">${days >= 0 ? days + " days left" : "date passed"}</span>` : ""}</div>
          <p class="muted" style="font-size:13px">Sets the pace of your <a href="#/plan">study plan</a>.</p></div>
      </div>
      <h2>Domain readiness</h2>
      <div class="card"><table><tr><th>Domain</th><th>Weight</th><th>Practised</th><th style="width:30%">Accuracy</th></tr>
        ${d.domains.map(x => { const s = st[x.id], a = pct(s.right, s.seen);
          return `<tr><td><a href="#/learn/${x.id}">${esc(x.name)}</a></td><td>${x.weight}%</td><td>${s.seen}/${s.total}</td><td>${s.seen ? a + "%" + bar(a, tone(a)) : '<span class="muted">not started</span>'}</td></tr>`; }).join("")}
      </table></div>`;
    $("#examDate").onchange = e => { t.examDate = e.target.value; save(); home(); };
  }

  function learn(domId) {
    const d = D(), t = T();
    if (!domId) {
      app.innerHTML = `<h1>Learn</h1><p class="sub">${d.code} curriculum, by domain and sorted by exam weight. Study the heaviest domains first.</p>
        <div class="grid g3">${d.domains.slice().sort((a, b) => b.weight - a.weight).map(x => {
          const ls = d.lessons[x.id] || []; const done = ls.filter((_, i) => t.lessons[x.id + i]).length;
          return `<div class="card click" onclick="location.hash='#/learn/${x.id}'"><div class="spread"><h3>${esc(x.name)}</h3><span class="tag acc">${x.weight}%</span></div>
            <div class="muted" style="font-size:13px">${x.subs.map(s => esc(s[0]) + (s[1] ? ` (${s[1]}%)` : "")).join(" · ")}</div>
            <div style="margin-top:10px;font-size:13px">${done}/${ls.length} lessons</div>${bar(pct(done, ls.length))}</div>`; }).join("")}</div>`;
      return;
    }
    const x = dom(domId); if (!x) return learn();
    const ls = d.lessons[domId] || [];
    app.innerHTML = `<a href="#/learn">← All domains</a><div class="spread" style="margin-top:8px"><h1>${esc(x.name)}</h1><span class="tag acc">${x.weight}% of exam</span></div>
      <p class="sub">Read each lesson, note the traps, then mark it done.</p>
      ${ls.map((l, i) => `<details class="card lesson" ${i === 0 ? "open" : ""}><summary><span>${t.lessons[domId + i] ? "✅" : "📘"} ${esc(l.title)}</span><span class="muted">▾</span></summary>
        <ul class="pts">${l.points.map(p => `<li>${p}</li>`).join("")}</ul>
        ${l.traps?.length ? `<div class="trap"><b>Exam traps</b><ul class="pts">${l.traps.map(p => `<li>${p}</li>`).join("")}</ul></div>` : ""}
        <div class="row" style="margin-top:12px"><button class="ghost" data-l="${i}">${t.lessons[domId + i] ? "Mark not done" : "Mark done"}</button></div></details>`).join("")}
      <div class="row"><button onclick="location.hash='#/practice?d=${domId}'">Practice this domain →</button></div>`;
    app.querySelectorAll("[data-l]").forEach(b => b.onclick = () => {
      const k = domId + b.dataset.l; if (t.lessons[k]) delete t.lessons[k]; else t.lessons[k] = Date.now(); save(); learn(domId);
    });
  }

  // practice
  let P = null;
  function practice(params) {
    const d = D(), t = T();
    if (!P || P.track !== S.track || params.get("fresh") || params.get("d") || params.get("diag")) {
      if (params.get("d") || params.get("diag") || params.get("mode")) return startPractice(params);
      if (!P || P.track !== S.track) P = null;
    }
    if (!P) {
      const st = domainStats();
      const wrongCount = d.questions.filter((q, i) => t.answers[qid(i)] && !t.answers[qid(i)].ok).length;
      const unseen = d.questions.filter((q, i) => !t.answers[qid(i)]).length;
      app.innerHTML = `<h1>Practice</h1><p class="sub">Untimed drills with instant explanations. Multi-response items state how many to select.</p>
        <div class="grid g3">
          <div class="card click" data-go="mode=diag"><h3>🎯 Diagnostic</h3><p class="muted">10 questions spread across domains.</p></div>
          <div class="card click" data-go="mode=unseen"><h3>🆕 Unseen questions</h3><p class="muted">${unseen} not yet attempted.</p></div>
          <div class="card click" data-go="mode=wrong"><h3>🔁 Review mistakes</h3><p class="muted">${wrongCount} answered incorrectly.</p></div>
          <div class="card click" data-go="mode=all"><h3>🎲 Random 20</h3><p class="muted">Shuffled across the whole bank.</p></div>
        </div>
        <h2>By domain</h2>
        <div class="grid g3">${d.domains.map(x => `<div class="card click" data-go="d=${x.id}"><div class="spread"><b>${esc(x.name)}</b><span class="tag">${st[x.id].total} Q</span></div>
          <div class="muted" style="font-size:13px">${st[x.id].seen} done · ${pct(st[x.id].right, st[x.id].seen)}% correct</div></div>`).join("")}</div>`;
      app.querySelectorAll("[data-go]").forEach(c => c.onclick = () => startPractice(new URLSearchParams(c.dataset.go)));
      return;
    }
    renderPractice();
  }
  function startPractice(params) {
    const d = D(), t = T();
    let idx = d.questions.map((_, i) => i);
    const mode = params.get("mode") || (params.get("diag") ? "diag" : null), dm = params.get("d");
    let title = "Random 20";
    if (dm) { idx = idx.filter(i => d.questions[i].d === dm); title = dom(dm).name; idx = shuffle(idx); }
    else if (mode === "diag") { title = "Diagnostic";
      const byDom = {}; idx.forEach(i => (byDom[d.questions[i].d] ||= []).push(i));
      idx = shuffle(d.domains.slice().sort((a, b) => b.weight - a.weight).flatMap(x => shuffle(byDom[x.id] || []).slice(0, 2)).slice(0, 10)); }
    else if (mode === "unseen") { title = "Unseen"; idx = shuffle(idx.filter(i => !t.answers[qid(i)])); }
    else if (mode === "wrong") { title = "Review mistakes"; idx = shuffle(idx.filter(i => t.answers[qid(i)] && !t.answers[qid(i)].ok)); }
    else idx = shuffle(idx).slice(0, 20);
    if (!idx.length) { app.innerHTML = `<h1>${esc(title)}</h1><div class="card">Nothing here yet. <a href="#/practice">Back</a></div>`; P = null; return; }
    P = { track: S.track, title, idx, pos: 0, picked: [], reveal: false, right: 0 };
    history.replaceState(null, "", "#/practice");
    renderPractice();
  }
  function renderPractice() {
    const d = D(), t = T(); const i = P.idx[P.pos], q = d.questions[i];
    if (P.pos >= P.idx.length) {
      app.innerHTML = `<h1>${esc(P.title)} — done</h1><div class="card"><div class="score-big">${P.right}/${P.idx.length}</div><p>${pct(P.right, P.idx.length)}% correct.</p>
        <div class="row"><button onclick="location.hash='#/home'">Dashboard</button><button class="ghost" id="again">Practice menu</button></div></div>`;
      $("#again").onclick = () => { P = null; practice(new URLSearchParams()); }; return;
    }
    app.innerHTML = `<div class="spread"><h1>${esc(P.title)}</h1><span class="muted">${P.pos + 1} / ${P.idx.length} · ${P.right} correct</span></div>${bar(pct(P.pos, P.idx.length))}<div class="card" id="qc" style="margin-top:14px"></div>
      <div class="row" style="margin-top:12px"><button id="act"></button><button class="ghost" id="quit">Exit</button></div>`;
    $("#qc").append(renderQ(q, { picked: P.picked, reveal: P.reveal, num: P.pos + 1, onPick: p => { P.picked = p; renderPractice(); } }));
    const act = $("#act");
    if (!P.reveal) { act.textContent = "Check answer"; act.disabled = P.picked.length !== q.a.length;
      act.onclick = () => { P.reveal = true; const ok = same(P.picked, q.a); if (ok) P.right++; t.answers[qid(i)] = { ok, ts: Date.now() }; save(); renderPractice(); };
    } else { act.textContent = P.pos + 1 < P.idx.length ? "Next question →" : "Finish"; act.onclick = () => { P.pos++; P.picked = []; P.reveal = false; renderPractice(); }; }
    $("#quit").onclick = () => { P = null; practice(new URLSearchParams()); };
  }

  // exam
  let timerH = null;
  function buildExam() {
    const d = D(), N = d.exam.items, byDom = {};
    d.questions.forEach((q, i) => (byDom[q.d] ||= []).push(i));
    Object.keys(byDom).forEach(k => byDom[k] = shuffle(byDom[k]));
    const pick = [];
    d.domains.forEach(x => { const n = Math.max(1, Math.round(N * x.weight / 100)); pick.push(...(byDom[x.id] || []).splice(0, n)); });
    const rest = shuffle(Object.values(byDom).flat());
    while (pick.length < N && rest.length) pick.push(rest.pop());
    return shuffle(pick.slice(0, N));
  }
  function exam() {
    const d = D(), t = T(); clearInterval(timerH);
    const ex = t.activeExam;
    if (!ex) {
      app.innerHTML = `<h1>Mock Exam</h1><p class="sub">Simulates the real ${d.code}: ${d.exam.items} items in ${d.exam.minutes} minutes, sampled by blueprint weight. No feedback until you submit.</p>
        <div class="grid g2"><div class="card"><h3>Rules</h3><ul class="pts"><li>Timer runs even if you close the tab; progress is saved.</li><li>Flag questions and revisit them from the navigator.</li><li>Multi-response items are all-or-nothing.</li><li>Score is shown on a 100–1000 scale; ${d.exam.pass} passes (approximation of scaled scoring).</li><li>Each attempt draws a new mix from a bank of ${d.questions.length} questions.</li></ul>
          <div class="row"><button id="go">Start ${d.exam.minutes}-minute exam</button><button class="ghost" id="quick">Quick 20-question mock (25 min)</button></div></div>
        <div class="card"><h3>History</h3>${t.exams.length ? `<table><tr><th>Date</th><th>Score</th><th>Result</th></tr>${t.exams.slice().reverse().map((e, k) => `<tr><td>${new Date(e.at).toLocaleString()}</td><td>${e.scaled}</td><td class="${e.scaled >= d.exam.pass ? "pass" : "fail"}">${e.scaled >= d.exam.pass ? "PASS" : "FAIL"}${e.quick ? " (quick)" : ""}</td></tr>`).join("")}</table>` : `<p class="muted">No attempts yet.</p>`}</div></div>`;
      const start = quick => { const qs = quick ? buildExam().slice(0, 20) : buildExam();
        t.activeExam = { qs, ans: {}, flags: {}, pos: 0, end: Date.now() + (quick ? 25 : d.exam.minutes) * 60000, quick }; save(); exam(); };
      $("#go").onclick = () => start(false); $("#quick").onclick = () => start(true);
      return;
    }
    const q = d.questions[ex.qs[ex.pos]], picked = ex.ans[ex.pos] || [];
    app.innerHTML = `<div class="exam-wrap"><div><div class="card" id="qc"></div>
        <div class="spread" style="margin-top:12px"><div class="row"><button class="ghost" id="prev" ${ex.pos ? "" : "disabled"}>← Prev</button><button class="ghost" id="flag">${ex.flags[ex.pos] ? "🚩 Unflag" : "⚑ Flag"}</button></div>
        <button id="next">${ex.pos + 1 < ex.qs.length ? "Next →" : "Review & submit"}</button></div></div>
      <aside class="card"><div class="muted" style="font-size:12px">TIME LEFT</div><div class="timer" id="tm"></div>
        <div class="muted" style="font-size:12px;margin:10px 0 6px">${Object.keys(ex.ans).length}/${ex.qs.length} answered · ${Object.values(ex.flags).filter(Boolean).length} flagged</div>
        <div class="navgrid">${ex.qs.map((_, k) => `<button data-k="${k}" class="${ex.ans[k]?.length ? "ans" : ""} ${ex.flags[k] ? "flag" : ""} ${k === ex.pos ? "cur" : ""}">${k + 1}</button>`).join("")}</div>
        <button style="width:100%;margin-top:14px" id="submit">Submit exam</button></aside></div>`;
    $("#qc").append(renderQ(q, { picked, num: ex.pos + 1, total: ex.qs.length, onPick: p => { ex.ans[ex.pos] = p; save(); exam(); } }));
    $("#prev").onclick = () => { ex.pos--; save(); exam(); };
    $("#next").onclick = () => { if (ex.pos + 1 < ex.qs.length) { ex.pos++; save(); exam(); } else confirmSubmit(); };
    $("#flag").onclick = () => { ex.flags[ex.pos] = !ex.flags[ex.pos]; save(); exam(); };
    $("#submit").onclick = confirmSubmit;
    app.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { ex.pos = +b.dataset.k; save(); exam(); });
    const tick = () => { const ms = ex.end - Date.now(); if (ms <= 0) { clearInterval(timerH); return submitExam(); }
      const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60; const el = $("#tm"); if (!el) return clearInterval(timerH);
      el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; el.classList.toggle("low", ms < 600000); };
    tick(); timerH = setInterval(tick, 1000);
    function confirmSubmit() {
      const un = ex.qs.length - Object.values(ex.ans).filter(a => a.length).length, fl = Object.values(ex.flags).filter(Boolean).length;
      if (confirm(`Submit exam?\n${un} unanswered, ${fl} flagged.`)) submitExam();
    }
  }
  function submitExam() {
    const d = D(), t = T(), ex = t.activeExam; if (!ex) return; clearInterval(timerH);
    const per = {}; let right = 0;
    const items = ex.qs.map((qi, k) => { const q = d.questions[qi], p = ex.ans[k] || [], ok = same(p, q.a);
      if (ok) right++; (per[q.d] ||= { r: 0, n: 0 }).n++; if (ok) per[q.d].r++;
      t.answers[qid(qi)] = { ok, ts: Date.now() }; return { qi, p, ok }; });
    const p = right / ex.qs.length, res = { at: Date.now(), right, n: ex.qs.length, scaled: scaled(p), per, items, quick: ex.quick };
    t.exams.push(res); t.exams = t.exams.slice(-20); t.activeExam = null; save();
    location.hash = "#/result/" + (t.exams.length - 1);
  }
  function result(k) {
    const d = D(), t = T(), r = t.exams[+k]; if (!r) return exam();
    const pass = r.scaled >= d.exam.pass;
    app.innerHTML = `<h1>Exam result</h1><div class="grid g2"><div class="card"><div class="score-big ${pass ? "pass" : "fail"}">${r.scaled}</div>
        <p><b class="${pass ? "pass" : "fail"}">${pass ? "PASS" : "FAIL"}</b> · ${r.right}/${r.n} correct (${pct(r.right, r.n)}%) · pass mark ${d.exam.pass}</p>
        <div class="row"><button onclick="location.hash='#/exam'">New attempt</button><button class="ghost" onclick="location.hash='#/practice?mode=wrong'">Drill mistakes</button></div></div>
      <div class="card"><h3>Score by domain</h3><table>${d.domains.filter(x => r.per[x.id]).map(x => { const s = r.per[x.id], a = pct(s.r, s.n);
        return `<tr><td>${esc(x.name)}</td><td>${s.r}/${s.n}</td><td style="width:35%">${a}%${bar(a, tone(a))}</td></tr>`; }).join("")}</table></div></div>
      <h2>Review answers</h2><div class="row" style="margin-bottom:10px"><label class="check"><input type="checkbox" id="onlyWrong" checked> Show only incorrect</label></div><div id="rev"></div>`;
    const draw = () => { const only = $("#onlyWrong").checked, rev = $("#rev"); rev.innerHTML = "";
      r.items.forEach((it, n) => { if (only && it.ok) return; const c = document.createElement("div"); c.className = "card"; c.style.marginBottom = "12px";
        c.append(renderQ(d.questions[it.qi], { picked: it.p, reveal: true, num: n + 1 })); rev.append(c); });
      if (!rev.children.length) rev.innerHTML = `<div class="card">No incorrect answers 🎉</div>`; };
    $("#onlyWrong").onchange = draw; draw();
  }

  function labs() {
    const d = D(), t = T();
    app.innerHTML = `<h1>Hands-on Labs</h1><p class="sub">Candidates repeatedly report that building things matters more than memorizing. Do these labs against the real API / Claude Code, tick the acceptance checks, then compare with the reference.</p>
      ${d.labs.map((l, i) => `<details class="card lesson"><summary><span>${t.labs[i] ? "✅" : "🧪"} ${esc(l.title)}</span><span class="row"><span class="tag acc">${esc(dom(l.domain).name)}</span><span class="tag">${l.time}</span></span></summary>
        <h3 style="margin-top:6px">Tasks</h3><ol class="pts">${l.tasks.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
        <h3>Acceptance checks</h3>${l.check.map((c, j) => `<label class="check"><input type="checkbox" data-c="${i}-${j}" ${t.labs[i + "-" + j] ? "checked" : ""}> ${esc(c)}</label>`).join("")}
        <details style="margin-top:10px"><summary class="muted" style="cursor:pointer">Show reference solution</summary>${/\n/.test(l.solution) ? `<pre>${esc(l.solution)}</pre>` : `<p>${esc(l.solution)}</p>`}</details></details>`).join("")}`;
    app.querySelectorAll("[data-c]").forEach(cb => cb.onchange = () => {
      const [i] = cb.dataset.c.split("-"); t.labs[cb.dataset.c] = cb.checked || undefined; if (!cb.checked) delete t.labs[cb.dataset.c];
      t.labs[i] = d.labs[i].check.every((_, j) => t.labs[i + "-" + j]) || undefined; if (!t.labs[i]) delete t.labs[i]; save(); labs();
      app.querySelectorAll("details.lesson")[i].open = true;
    });
  }

  function plan() {
    const d = D(), t = T();
    const days = t.examDate ? Math.max(7, Math.ceil((new Date(t.examDate) - new Date()) / 864e5)) : 42;
    const weeks = Math.max(2, Math.min(8, Math.round(days / 7)));
    const doms = d.domains.slice().sort((a, b) => b.weight - a.weight);
    const studyWeeks = Math.max(1, weeks - 1); const per = Array.from({ length: studyWeeks }, () => []);
    let load = Array(studyWeeks).fill(0);
    doms.forEach(x => { const w = load.indexOf(Math.min(...load)); per[w].push(x); load[w] += x.weight; });
    app.innerHTML = `<h1>Study Plan</h1><p class="sub">${weeks}-week plan ${t.examDate ? "to your exam date" : "(set an exam date on the dashboard to adjust)"}; time is allocated by blueprint weight, heaviest first.</p>
      <div class="grid g2">${per.map((ws, w) => `<div class="card"><h3>Week ${w + 1}</h3><ul class="pts">${ws.map(x => `<li><a href="#/learn/${x.id}">${esc(x.name)}</a> <span class="tag">${x.weight}%</span><br><span class="muted" style="font-size:13px">Read lessons → drill domain → do a related lab</span></li>`).join("")}</ul></div>`).join("")}
        <div class="card"><h3>Week ${weeks} — Exam simulation</h3><ul class="pts"><li>2–3 full timed mock exams; review every miss.</li><li>Re-drill domains under 75%.</li><li>Re-read all "Exam traps" boxes.</li><li>Target: consistently above ${d.exam.pass + 80} before booking.</li></ul></div></div>
      <h2>Daily routine (60–90 min)</h2><div class="card"><ol class="pts"><li>20 min: one lesson + official docs page on that topic.</li><li>20 min: 10–15 practice questions; read every explanation.</li><li>30 min: build — labs, or your own project using the API, tools, MCP and Claude Code.</li><li>5 min: review mistakes queue.</li></ol></div>`;
  }

  function resources() {
    const d = D();
    const R = [
      ["Official", [["Anthropic certifications announcement", "https://claude.com/blog"], ["Claude docs (API, tool use, caching, batches, Agent SDK)", "https://docs.claude.com"], ["Claude Code docs", "https://code.claude.com/docs"], ["MCP specification", "https://modelcontextprotocol.io"], ["Anthropic Academy free courses (Skilljar)", "https://anthropic.skilljar.com"], ["Anthropic cookbook (GitHub)", "https://github.com/anthropics/anthropic-cookbook"], ["Claude Partner Network (needed to register)", "https://claude.com/partners"]]],
      ["Community prep (unofficial)", [["claudecertificationguide.com — lessons, diagnostic, mocks", "https://claudecertificationguide.com"], ["open-exam-prep.com — free practice", "https://open-exam-prep.com/practice/anthropic-ccdv-f"], ["preporato/claude-certification-guide (GitHub)", "https://github.com/preporato/claude-certification-guide"], ["rohitg00/ai-engineering-from-scratch (GitHub)", "https://github.com/rohitg00/ai-engineering-from-scratch"], ["Tutorials Dojo CCAR-F study guide", "https://tutorialsdojo.com/ccar-f-claude-certified-architect-foundations-study-guide/"], ["Reddit candidate reviews (summary)", "https://claudearchitectcertification.com/blog/claude-certification-reddit-reviews-what-candidates-actually-say"]]]
    ];
    app.innerHTML = `<h1>Resources</h1><p class="sub">What candidates on Reddit and blogs keep saying, plus where to study.</p>
      <div class="card"><h3>What candidates report</h3><ul class="pts">
        <li><b>Hands-on beats memorizing.</b> Build something with the API, an MCP server, and Claude Code before sitting the exam.</li>
        <li><b>Study the official exam guide</b> (some read it twice) and the free Anthropic Academy courses: Building with the Claude API, Claude Code in Action, Intro to Agent Skills, Intro to MCP, MCP Advanced.</li>
        <li><b>Third-party practice is narrow</b> and often easier than the real exam; use it to find gaps, not as a predictor.</li>
        <li><b>API/SDK questions surprise people</b>: one Architect candidate said many questions felt like guesswork without API study.</li>
        <li><b>Prefer the simplest fix</b>: answers that solve the stated problem with the least machinery (e.g. better tool description vs a routing classifier) tend to be right.</li>
        <li><b>Common trap</b>: team MCP servers belong in project <code>.mcp.json</code>, not user config.</li>
        <li><b>Logistics</b>: ~2 hours, strictly proctored, no docs or Claude. Registration requires a Claude Partner Network organization (membership is free).</li></ul></div>
      ${d.scenarios ? `<h2>Architect scenario bank</h2><div class="card"><p class="muted">Each exam uses 4 scenarios. The guide lists 6; candidates report seeing others (e.g. a compliance agent), so practise the underlying judgment, not just these.</p><div class="row">${d.scenarios.map(s => `<span class="tag acc">${esc(s)}</span>`).join("")}</div></div>` : ""}
      ${R.map(([h, ls]) => `<h2>${h}</h2><div class="card"><ul class="pts">${ls.map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join("")}</ul></div>`).join("")}
      <h2>Your data</h2><div class="card row"><button class="ghost" id="exp">Export progress</button><button class="ghost" id="rst">Reset ${d.code} progress</button></div>`;
    $("#exp").onclick = () => { const b = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "claude-cert-lab-progress.json"; a.click(); };
    $("#rst").onclick = () => { if (confirm(`Erase all ${d.code} progress?`)) { delete S.tracks[S.track]; save(); resources(); } };
  }

  // ---------- router ----------
  function route() {
    clearInterval(timerH);
    $("#trackSel").value = S.track;
    const [path, qs] = location.hash.replace(/^#\/?/, "").split("?");
    const [r, arg] = path.split("/");
    const params = new URLSearchParams(qs || "");
    document.querySelectorAll("nav a").forEach(a => a.classList.toggle("on", a.dataset.r === (r === "result" ? "exam" : r || "home")));
    window.scrollTo(0, 0);
    ({ learn: () => learn(arg), practice: () => practice(params), exam, result: () => result(arg), labs, plan, resources }[r] || home)();
  }
  window.addEventListener("hashchange", route);
  route();
})();
