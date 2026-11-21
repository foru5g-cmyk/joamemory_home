// 소식 그림 만들기(주인 글쓰기 창에서): 카톡 모양 업데이트 그림을 만들어 글에 붙여요
//   한 줄에 말풍선 하나 · "할 말 | 작은 설명" · 그림은 html2canvas로 찍어요(열 때 한 번만 받아요)
(() => {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ARTS = {
    heart: [' x   x ', 'xxxxxxx', 'xxxxxxx', ' xxxxx ', '  xxx  ', '   x   '],
    star: ['   x   ', '  xxx  ', 'xxxxxxx', ' xxxxx ', ' xx xx ', 'x     x'],
    smile: [' xxxxx ', 'x     x', 'x x x x', 'x     x', 'x xxx x', ' xxxxx '],
    kiss: [' x   x ', 'xxx xxx', 'xxxxxxx', ' xxxxx ', '  xxx  ', '   x   '],
    bolt: ['   xxx ', '  xxx  ', ' xxxxx ', '   xx  ', '  xx   ', ' x     '],
  };
  const THEMES = [
    { name: '보라', bg: '#c9d2e4', av: '🐯', avbg: '#f3dfe6', me: '#e4defb', btn: '#7b61d9', art: 'heart', ch: '앙', col: '#8a5cf0' },
    { name: '민트', bg: '#d3e8dc', av: '🐣', avbg: '#fff3c4', me: '#dff3e6', btn: '#3f9d6b', art: 'star', ch: '뿅', col: '#3f9d6b' },
    { name: '살구', bg: '#f1dccd', av: '🐱', avbg: '#fde9df', me: '#fbe6da', btn: '#d9774a', art: 'smile', ch: '냥', col: '#d9774a' },
    { name: '분홍', bg: '#efd5df', av: '🐰', avbg: '#fde4ec', me: '#fbe2ea', btn: '#d6588a', art: 'kiss', ch: '쪽', col: '#d6588a' },
    { name: '하늘', bg: '#cfe0f1', av: '🐻', avbg: '#f3e6d8', me: '#e0ecf9', btn: '#3d7fc4', art: 'bolt', ch: '슝', col: '#e3a21a' },
  ];
  const PHRASES = ['huh', 'Go on with what you were doing.', 'Alright.', 'Go ahead.', 'Come on.', 'Hear that?', 'yeah?', '…흥미롭네.'];
  const CSS = `
  .mk { width:780px; background:var(--bg); color:#17151f; font-family:'Gowun Dodum','Malgun Gothic','Segoe UI Emoji',sans-serif; word-break:keep-all; letter-spacing:0; line-height:normal; }
  .mk * { box-sizing:border-box; margin:0; padding:0; }
  .mk .top { display:flex; align-items:center; gap:16px; padding:34px 30px 22px; }
  .mk .top .back, .mk .top .em { font-size:36px; }
  .mk .top h1 { font-size:32px; font-weight:700; letter-spacing:-.5px; margin:0; line-height:1.2; }
  .mk .top small { font-size:24px; color:#5a5f70; margin-left:6px; display:inline; }
  .mk .pill { text-align:center; margin:14px 0 26px; }
  .mk .pill i, .mk .foot i { font-style:normal; display:inline-block; background:#9ba6ba; color:#fff; border-radius:99px; padding:9px 26px 10px; font-size:24px; }
  .mk .row { display:flex; gap:16px; padding:0 24px; align-items:flex-start; }
  .mk .av { width:76px; height:76px; border-radius:26px; background:var(--avbg); display:flex; align-items:center; justify-content:center; font-size:44px; flex:none; }
  .mk .who { font-size:25px; color:#3d4152; margin:4px 0 8px 2px; }
  .mk .line { display:flex; align-items:flex-end; gap:14px; margin-bottom:10px; }
  .mk .b { background:#fff; border-radius:26px; padding:17px 24px 19px; max-width:560px; }
  .mk .first .b { border-top-left-radius:8px; }
  .mk .b b { display:block; font-weight:400; font-size:28px; line-height:1.35; }
  .mk .b span { display:block; font-size:22px; color:#807b8c; margin-top:3px; }
  .mk .t { font-size:20px; color:#4a5670; padding-bottom:6px; flex:none; }
  .mk .art { padding:18px 22px 16px; }
  .mk .art p { font-family:'Jua','Malgun Gothic',sans-serif; font-size:25px; color:var(--col); }
  .mk .art p span { display:block; height:30px; color:inherit; font-size:inherit; margin:0; } /* 말풍선 작은 설명(.b span) 색이 그림 글자에 묻지 않게 */
  .mk .art p i { display:inline-block; width:28px; text-align:center; font-style:normal; }
  .mk .me { display:flex; justify-content:flex-end; align-items:flex-end; gap:14px; padding:14px 24px 0; }
  .mk .me .b { background:var(--me); border-radius:26px 26px 8px 26px; font-size:28px; }
  .mk .card { margin:34px 32px 0; background:#f2f3f9; border-radius:26px; padding:24px 30px 26px; font-size:25px; line-height:1.75; color:#4a4860; }
  .mk .card b { color:#17151f; margin:0 6px 0 4px; }
  .mk .foot { text-align:center; margin:22px 0 30px; } .mk .foot i { font-size:23px; }
  .mk .nofoot { height:30px; }
  .mk .bar { background:#fff; padding:20px 24px 26px; display:flex; gap:16px; align-items:center; }
  .mk .bar div { flex:1; background:#eff0f4; border-radius:99px; padding:15px 28px; font-size:25px; color:#8b8a97; }
  .mk .bar u { text-decoration:none; width:80px; height:62px; border-radius:99px; background:var(--btn); display:flex; align-items:center; justify-content:center; font-size:30px; }
  /* 만들기 창 */
  .mkd { border:0; border-radius:22px; padding:0; width:min(1080px, calc(100vw - 24px)); max-height:calc(100dvh - 24px); margin:auto; box-shadow:0 20px 60px #0003; overflow:hidden; }
  .mkd::backdrop { background:#0006; }
  .mkd .wrap { display:grid; grid-template-columns:1fr 410px; max-height:calc(100dvh - 24px); }
  .mkd .side { padding:24px; overflow:auto; display:grid; gap:12px; align-content:start; }
  .mkd h3 { font-size:21px; font-weight:800; letter-spacing:-.5px; }
  .mkd label { display:grid; gap:5px; font-size:13.5px; color:var(--sub, #9b9a97); font-weight:600; }
  .mkd input, .mkd textarea { background:#fff; color:#37352f; border:1px solid #ebe7f7; border-radius:10px; padding:9px 12px; font-size:15px; font-weight:400; width:100%; }
  .mkd textarea { min-height:150px; resize:vertical; line-height:1.55; }
  .mkd .two { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .mkd .sw { display:flex; gap:8px; flex-wrap:wrap; }
  .mkd .sw button { display:flex; align-items:center; gap:6px; border:1px solid #ebe7f7; border-radius:99px; padding:5px 12px 5px 6px; font-size:14px; background:#fff; color:#37352f; }
  .mkd .sw button i { width:22px; height:22px; border-radius:50%; display:inline-grid; place-items:center; font-style:normal; font-size:13px; }
  .mkd .sw button[aria-pressed="true"] { border-color:#7c63de; box-shadow:0 0 0 2px #7c63de inset; }
  .mkd .chips { display:flex; gap:6px; flex-wrap:wrap; }
  .mkd .chips button { font-size:12.5px; border-radius:99px; padding:3px 10px; background:#f1eefb; color:#5d5875; border:0; }
  .mkd .act { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; padding-top:4px; }
  .mkd .pv { background:#f6f4fd; overflow:auto; padding:16px; }
  .mkd .pv .scale { transform-origin:top left; }
  .mkd .hint { font-size:12.5px; color:#9b9a97; font-weight:400; line-height:1.5; }
  .mkd .pvh { display:none; }
  @media (max-width:760px) {
    .mkd { width:100vw; max-width:100vw; height:100dvh; max-height:100dvh; border-radius:0; }
    .mkd .wrap { grid-template-columns:1fr; height:100dvh; max-height:100dvh; overflow:auto; }
    .mkd .side { overflow:visible; padding:18px 16px 0; outline:none; }
    .mkd .two { grid-template-columns:1fr 1fr; }
    .mkd .pv { padding:12px 16px 90px; } .mkd .pvh { display:block; font-size:13.5px; font-weight:700; color:#9b9a97; margin:0 0 8px; }
    .mkd .act { position:fixed; left:0; right:0; bottom:0; z-index:2; background:#fffffff2; backdrop-filter:blur(8px); padding:10px 16px calc(10px + env(safe-area-inset-bottom)); border-top:1px solid #ebe7f7; }
    .mkd .act .btn { flex:1; text-align:center; }
  }`;

  const now = () => { const d = new Date(), h = d.getHours(); return (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const later = t => { const m = t.match(/(\d+):(\d+)$/); if (!m) return t; let mm = +m[2] + 1, hh = +m[1]; if (mm > 59) { mm = 0; hh = hh % 12 + 1; } return t.replace(/\d+:\d+$/, hh + ':' + String(mm).padStart(2, '0')); };
  const art = (k, ch, col) => '<p style="color:' + col + '">' + ARTS[k].map(r => '<span>' + [...r].map(c => '<i>' + (c === 'x' ? ch : '') + '</i>').join('') + '</span>').join('') + '</p>';
  const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
  const pair = l => { const i = l.indexOf('|'); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; };
  const cardLine = l => { const [a, b] = pair(l), m = a.match(/^(\p{Extended_Pictographic}️?)\s*(.*)$/u); return m ? [m[1], m[2], b] : ['•', a, b]; };

  function chatHtml(d) {
    const T = THEMES[d.theme] || THEMES[0], t1 = d.time || now();
    const NUM = '①②③④⑤⑥⑦⑧⑨⑩', guide = d.kind === 'guide';
    const bubbles = lines(d.bubbles).map(pair).map(([a, b], i) => [guide && i < 10 ? NUM[i] + ' ' + a : a, b]), cards = lines(d.cards).map(cardLine);
    return `<div class="mk" style="background:${T.bg}">
      <div class="top"><span class="back">‹</span><span class="em">💜</span><h1>조아메모리</h1><small>${guide ? '쓰는 법' : '업데이트'}</small></div>
      <div class="pill"><i>${esc(d.pill || '소식')}</i></div>
      <div class="row"><div class="av" style="background:${T.avbg}">${T.av}</div><div><div class="who">조아메모리</div>
        <div class="line first"><div class="b art">${art(T.art, T.ch, T.col)}</div>${bubbles.length ? '' : `<div class="t">${t1}</div>`}</div>
        ${bubbles.map(([a, b], i) => `<div class="line"><div class="b"><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ''}</div>${i === bubbles.length - 1 ? `<div class="t">${t1}</div>` : ''}</div>`).join('')}
      </div></div>
      ${d.me ? `<div class="me"><div class="t">${later(t1)}</div><div class="b" style="background:${T.me}">${esc(d.me)}</div></div>` : ''}
      ${cards.length ? `<div class="card">${cards.map(([e, a, b]) => `${e}<b>${esc(a)}</b>${esc(b)}`).join('<br>')}</div>` : ''}
      ${d.foot ? `<div class="foot"><i>${esc(d.foot)}</i></div>` : '<div class="nofoot"></div>'}
      <div class="bar"><div>💌 조아메모리${d.ver ? ' ' + esc(d.ver) : ''}</div><u style="background:${T.btn}">💜</u></div></div>`;
  }

  let h2c = null; // html2canvas는 처음 그림을 찍을 때 한 번만 받아요
  const loadH2C = () => h2c || (h2c = new Promise((ok, no) => { if (window.html2canvas) return ok(window.html2canvas); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload = () => ok(window.html2canvas); s.onerror = () => { h2c = null; no(new Error('그림 도구를 못 받았어요 · 인터넷 연결을 확인해 주세요')); }; document.head.appendChild(s); }));
  async function shoot(d) {
    const H = await loadH2C(), box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:-10000px;top:0;'; box.innerHTML = chatHtml(d); document.body.appendChild(box);
    try { if (document.fonts) { await document.fonts.load("25px 'Jua'"); await document.fonts.load("25px 'Gowun Dodum'"); await document.fonts.ready; }
      const c = await H(box.firstElementChild, { scale: 1, backgroundColor: null, useCORS: true, logging: false });
      return await new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error('그림을 못 만들었어요')), 'image/png'));
    } finally { box.remove(); }
  }

  let inited = false;
  function init() { if (inited) return; inited = true;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const f = document.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap'; document.head.appendChild(f); }
  const store = { get: () => { try { return JSON.parse(localStorage.getItem('joa_mk') || 'null'); } catch (_) { return null; } }, set: v => { try { localStorage.setItem('joa_mk', JSON.stringify(v)); } catch (_) {} } };

  // open({ version, date }, done({ file, title, body, icon, tags }))
  function open(opt, done) {
    init(); const last = store.get() || {}, dt = String(opt.date || '').split('-').map(Number);
    const kind = opt.kind === 'guide' ? 'guide' : 'news', pillOf = k => k === 'guide' ? '쓰는 법' : (dt[1] ? `${dt[1]}월 ${dt[2]}일 소식` : '소식');
    const d = { kind, theme: ((last.theme ?? 4) + 1) % THEMES.length, pill: pillOf(kind), ver: opt.version || '', bubbles: '', cards: '', foot: '', me: kind === 'guide' ? 'Alright.' : 'huh', time: now() };
    const dlg = document.createElement('dialog'); dlg.className = 'mkd'; document.body.appendChild(dlg);
    dlg.innerHTML = `<div class="wrap"><div class="side" tabindex="-1">
      <h3>🎨 그림 만들기</h3>
      <label>종류<div class="sw">${[['news', '📮 소식'], ['guide', '📖 쓰는 법']].map(([k, n]) => `<button type="button" data-kind="${k}" aria-pressed="${d.kind === k}">${n}</button>`).join('')}</div></label>
      <label>색<div class="sw">${THEMES.map((t, i) => `<button type="button" data-th="${i}" aria-pressed="${i === d.theme}"><i style="background:${t.bg}">${t.av}</i>${t.name}</button>`).join('')}</div></label>
      <div class="two"><label>날짜 줄<input data-k="pill" value="${esc(d.pill)}"></label><label>판 번호<input data-k="ver" value="${esc(d.ver)}" placeholder="5.8.48"></label></div>
      <label><span data-blab>${d.kind === 'guide' ? '순서 (한 줄에 한 단계 · ①②③이 저절로 붙어요 · 작은 설명은 | 뒤에)' : '말풍선 (한 줄에 하나 · 작은 설명은 | 뒤에)'}</span><textarea data-k="bubbles" placeholder="장기기억, 한 번에 지워 줄게. | 설정 › 편의 · 웹 모드&#10;굳은 문장, 더 꼼꼼히 찾을게. | 문장 꼴 · 버릇 말까지"></textarea><span class="hint">말하듯 짧게, 한 줄에 한 가지만 쓰면 예뻐요. 6~7줄이 알맞아요.</span></label>
      <label>내 말풍선<input data-k="me" value="${esc(d.me)}"><div class="chips">${PHRASES.map(p => `<button type="button" data-ph="${esc(p)}">${esc(p)}</button>`).join('')}</div></label>
      <label>아래 상자 (한 줄에 하나 · 이모지 이름 | 내용)<textarea data-k="cards" style="min-height:90px" placeholder="🔧 그 밖에 | ETC용 모델 고르기&#10;🐛 고친 것 | 그 외 오류 수정"></textarea></label>
      <label>맨 아래 한마디 (안 써도 돼요)<input data-k="foot" placeholder="* 지운 카드는 못 되돌려요 🥹"></label>
      <div class="act"><button type="button" class="btn ghost" data-mk="close">닫기</button><button type="button" class="btn ghost" data-mk="save">그림 받기</button><button type="button" class="btn" data-mk="use">글에 넣기</button></div>
    </div><div class="pv"><p class="pvh">미리보기</p><div class="scale"></div></div></div>`;
    const pv = dlg.querySelector('.scale'), side = dlg.querySelector('.side');
    const draw = () => { pv.innerHTML = chatHtml(d); const w = dlg.querySelector('.pv').clientWidth - 32, s = Math.min(1, w / 780); pv.style.transform = `scale(${s})`; pv.style.height = (pv.firstElementChild.offsetHeight * s) + 'px'; pv.style.width = (780 * s) + 'px'; };
    side.addEventListener('input', e => { const k = e.target.dataset.k; if (k) { d[k] = e.target.value; draw(); } });
    const busy = on => dlg.querySelectorAll('[data-mk]').forEach(b => { b.disabled = on; });
    side.addEventListener('click', async e => {
      const th = e.target.closest('[data-th]'), ph = e.target.closest('[data-ph]'), kd = e.target.closest('[data-kind]'), mk = e.target.closest('[data-mk]')?.dataset.mk;
      if (kd) { const k = kd.dataset.kind, pi = side.querySelector('[data-k="pill"]'); if (pi.value === pillOf(d.kind)) pi.value = d.pill = pillOf(k); d.kind = k; side.querySelectorAll('[data-kind]').forEach(b => b.setAttribute('aria-pressed', b === kd)); side.querySelector('[data-blab]').textContent = k === 'guide' ? '순서 (한 줄에 한 단계 · ①②③이 저절로 붙어요 · 작은 설명은 | 뒤에)' : '말풍선 (한 줄에 하나 · 작은 설명은 | 뒤에)'; return draw(); }
      if (th) { d.theme = +th.dataset.th; side.querySelectorAll('[data-th]').forEach(b => b.setAttribute('aria-pressed', b === th)); return draw(); }
      if (ph) { d.me = ph.dataset.ph; side.querySelector('[data-k="me"]').value = d.me; return draw(); }
      if (mk === 'close') return dlg.close();
      if (!mk) return;
      if (!lines(d.bubbles).length) return alert('말풍선을 한 줄 이상 써 주세요');
      busy(true); const btn = e.target.closest('[data-mk]'), was = btn.textContent; btn.textContent = '만드는 중…';
      try { const blob = await shoot(d), name = (d.kind === 'guide' ? 'guide-' : 'update-') + (String(opt.date || '').replace(/-/g, '') || Date.now()) + '.png';
        store.set({ theme: d.theme });
        if (mk === 'save') { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
        else { const b = lines(d.bubbles).map(pair); dlg.close(); done && done({ file: new File([blob], name, { type: 'image/png' }), title: b[0][0].replace(/[.!~]+$/, ''), body: b.slice(0, 3).map(x => x[0]).join(' '), icon: THEMES[d.theme].av, tags: d.ver ? [d.ver] : [] }); }
      } catch (err) { alert(err.message || '그림을 못 만들었어요'); } finally { btn.textContent = was; busy(false); }
    });
    dlg.addEventListener('close', () => dlg.remove());
    dlg.showModal(); draw(); setTimeout(draw, 300);
    if (matchMedia('(pointer: fine)').matches) side.querySelector('[data-k="bubbles"]').focus(); else dlg.querySelector('.side').focus(); // 폰에선 열자마자 자판이 올라오지 않게 // 글꼴이 늦게 오면 크기가 바뀌어서 한 번 더
  }
  window.JoaMaker = { open, chatHtml, THEMES };
})();
