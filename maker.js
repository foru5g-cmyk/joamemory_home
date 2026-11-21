// 그림 만들기(주인 글쓰기 창에서) · 두 가지
//   소식: 카톡 대화 모양 · 한 줄에 말풍선 하나 ("할 말 | 작은 설명") · 색·프로필·첫 그림·그림 글자를 고를 수 있어요
//   쓰는 법: 설명서 모양 · 제목 · 한 줄 설명 · 단계마다 제목·설명·캡처 그림 · 팁 상자
//   그림은 html2canvas로 찍어요(처음 찍을 때 한 번만 받아요)
(() => {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hexRgb = h => { h = String(h).replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => '#' + hexRgb(a).map((x, i) => Math.round(x + (hexRgb(b)[i] - x) * t).toString(16).padStart(2, '0')).join(''); // a→b로 t만큼
  const ARTS = {
    heart: ['하트', [' x   x ', 'xxxxxxx', 'xxxxxxx', ' xxxxx ', '  xxx  ', '   x   ']],
    kiss: ['큰 하트', [' x   x ', 'xxx xxx', 'xxxxxxx', ' xxxxx ', '  xxx  ', '   x   ']],
    star: ['별', ['   x   ', '  xxx  ', 'xxxxxxx', ' xxxxx ', ' xx xx ', 'x     x']],
    smile: ['웃음', [' xxxxx ', 'x     x', 'x x x x', 'x     x', 'x xxx x', ' xxxxx ']],
    bolt: ['번개', ['   xxx ', '  xxx  ', ' xxxxx ', '   xx  ', '  xx   ', ' x     ']],
    cat: ['고양이', ['x     x', 'xx   xx', 'xxxxxxx', 'x xxx x', 'xxxxxxx', ' xxxxx ']],
    flower: ['꽃', ['  x x  ', ' xxxxx ', 'xx x xx', ' xxxxx ', '  x x  ', '   x   ']],
  };
  // 소식 색: 바탕만 고르면 나머지(내 말풍선·버튼·그림 글자색)는 바탕에서 뽑아요
  const NEWS = [
    { name: '보라', bg: '#c9d2e4', av: '🐯', art: 'heart', ch: '앙', acc: '#7b61d9' },
    { name: '민트', bg: '#d3e8dc', av: '🐣', art: 'star', ch: '뿅', acc: '#3f9d6b' },
    { name: '살구', bg: '#f1dccd', av: '🐱', art: 'smile', ch: '냥', acc: '#d9774a' },
    { name: '분홍', bg: '#efd5df', av: '🐰', art: 'kiss', ch: '쪽', acc: '#d6588a' },
    { name: '하늘', bg: '#cfe0f1', av: '🐻', art: 'bolt', ch: '슝', acc: '#3d7fc4' },
    { name: '노랑', bg: '#f1e6c2', av: '🐥', art: 'flower', ch: '삐', acc: '#c9971a' },
    { name: '라벤더', bg: '#ddd5f0', av: '🦄', art: 'star', ch: '반', acc: '#8a5cf0' },
    { name: '회색', bg: '#dcdde2', av: '🐨', art: 'cat', ch: '냐', acc: '#5f6070' },
  ];
  const AVS = ['🐯', '🐣', '🐱', '🐰', '🐻', '🐥', '🦄', '🐨', '🐶', '🦊', '🐼', '🐸', '🐹', '💜'];
  const ACCS = ['#7b61d9', '#3f9d6b', '#d9774a', '#d6588a', '#3d7fc4', '#c9971a', '#8a5cf0', '#5f6070'];
  const PHRASES = ['huh', 'Go on with what you were doing.', 'Alright.', 'Go ahead.', 'Come on.', 'Hear that?', 'yeah?', '…흥미롭네.'];
  const CSS = `
  .mk { width:780px; color:#17151f; font-family:'Gowun Dodum','Malgun Gothic','Segoe UI Emoji',sans-serif; word-break:keep-all; letter-spacing:0; line-height:normal; }
  .mk * { box-sizing:border-box; margin:0; padding:0; }
  .mk .top { display:flex; align-items:center; gap:16px; padding:34px 30px 22px; }
  .mk .top .back, .mk .top .em { font-size:36px; }
  .mk .top h1 { font-size:32px; font-weight:700; letter-spacing:-.5px; margin:0; line-height:1.2; }
  .mk .top small { font-size:24px; color:#5a5f70; margin-left:6px; display:inline; }
  .mk .pill { text-align:center; margin:14px 0 26px; }
  .mk .pill i, .mk .foot i { font-style:normal; display:inline-block; background:#9ba6ba; color:#fff; border-radius:99px; padding:9px 26px 10px; font-size:24px; }
  .mk .row { display:flex; gap:16px; padding:0 24px; align-items:flex-start; }
  .mk .av { width:76px; height:76px; border-radius:26px; display:flex; align-items:center; justify-content:center; font-size:44px; flex:none; }
  .mk .who { font-size:25px; color:#3d4152; margin:4px 0 8px 2px; }
  .mk .line { display:flex; align-items:flex-end; gap:14px; margin-bottom:10px; }
  .mk .b { background:#fff; border-radius:26px; padding:17px 24px 19px; max-width:560px; }
  .mk .first .b { border-top-left-radius:8px; }
  .mk .b b { display:block; font-weight:400; font-size:28px; line-height:1.35; }
  .mk .b span { display:block; font-size:22px; color:#807b8c; margin-top:3px; }
  .mk .t { font-size:20px; color:#4a5670; padding-bottom:6px; flex:none; }
  .mk .art { padding:18px 22px 16px; }
  .mk .art p { font-family:'Jua','Malgun Gothic',sans-serif; font-size:25px; }
  .mk .art p span { display:block; height:30px; color:inherit; font-size:inherit; margin:0; }
  .mk .art p i { display:inline-block; width:28px; text-align:center; font-style:normal; }
  .mk .me { display:flex; justify-content:flex-end; align-items:flex-end; gap:14px; padding:14px 24px 0; }
  .mk .me .b { border-radius:26px 26px 8px 26px; font-size:28px; }
  .mk .card { margin:34px 32px 0; background:#f2f3f9; border-radius:26px; padding:24px 30px 26px; font-size:25px; line-height:1.75; color:#4a4860; }
  .mk .card b { color:#17151f; margin:0 6px 0 4px; }
  .mk .foot { text-align:center; margin:22px 0 30px; } .mk .foot i { font-size:23px; }
  .mk .nofoot { height:30px; }
  .mk .bar { background:#fff; padding:20px 24px 26px; display:flex; gap:16px; align-items:center; }
  .mk .bar div { flex:1; background:#eff0f4; border-radius:99px; padding:15px 28px; font-size:25px; color:#8b8a97; }
  .mk .bar u { text-decoration:none; width:80px; height:62px; border-radius:99px; display:flex; align-items:center; justify-content:center; font-size:30px; }
  /* 쓰는 법: 카페 설명 그림과 같은 결(연보라 바탕 · 흰 카드 · 굵은 제목 · 번호 단계 · 팁 상자) */
  .gd { width:780px; padding:22px; background:#ecebf6; color:#1f1b2e; font-family:'Pretendard Variable','Pretendard','Malgun Gothic','Segoe UI Emoji',sans-serif; word-break:keep-all; letter-spacing:-.3px; line-height:normal; }
  .gd * { box-sizing:border-box; margin:0; padding:0; }
  .gd .cd { background:#fff; border-radius:34px; padding:42px 42px 26px; }
  .gd h1 { font-size:40px; font-weight:800; letter-spacing:-1.2px; line-height:1.25; }
  .gd .lead { font-size:20px; color:#8a8698; margin-top:8px; line-height:1.5; }
  .gd .steps { margin-top:26px; display:flex; flex-direction:column; gap:14px; }
  .gd .st { display:flex; gap:16px; border-radius:22px; padding:22px 24px; }
  .gd .n { flex:none; width:34px; height:34px; border-radius:50%; color:#fff; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; margin-top:1px; }
  .gd .sb { flex:1; min-width:0; }
  .gd .sb b { display:block; font-size:23px; font-weight:800; line-height:1.4; }
  .gd .sb p { font-size:19px; color:#6b6880; margin-top:5px; line-height:1.6; white-space:pre-wrap; }
  .gd .sb img { display:block; width:100%; margin-top:14px; border-radius:14px; border:1px solid #e6e2f2; }
  .gd .eh { display:flex; gap:18px; margin:24px 0 8px; padding:0 18px; font-size:16px; font-weight:700; color:#8a8698; } .gd .eh span:first-child { width:170px; flex:none; }
  .gd .er { display:flex; gap:18px; align-items:center; border:1.5px solid #ebe7f7; border-radius:18px; padding:16px 18px; margin-top:10px; }
  .gd .er .tg { width:170px; flex:none; display:flex; flex-direction:column; align-items:flex-start; gap:6px; }
  .gd .er .tg i { font-style:normal; font-family:ui-monospace,Consolas,monospace; font-size:15px; font-weight:700; color:#c2336b; background:#fde4ee; border-radius:8px; padding:3px 9px; }
  .gd .er .rs { flex:1; min-width:0; font-size:19px; line-height:1.55; }
  .gd .er .rs u { text-decoration:none; display:block; font-weight:800; }
  .gd .tips { margin-top:20px; border-radius:18px; padding:18px 24px; font-size:19px; line-height:1.75; color:#4a4860; }
  .gd .tips b { color:#1f1b2e; font-weight:800; margin:0 6px 0 4px; }
  .gd .ft { text-align:right; margin-top:16px; color:#9e99b3; font-size:17px; }
  /* 만들기 창 */
  .mkd { border:0; border-radius:22px; padding:0; width:min(1080px, calc(100vw - 24px)); max-height:calc(100dvh - 24px); margin:auto; box-shadow:0 20px 60px #0003; overflow:hidden; }
  .mkd::backdrop { background:#0006; }
  .mkd .wrap { display:grid; grid-template-columns:1fr 410px; max-height:calc(100dvh - 24px); }
  .mkd .side { padding:24px; overflow:auto; display:grid; gap:12px; align-content:start; outline:none; }
  .mkd h3 { font-size:21px; font-weight:800; letter-spacing:-.5px; }
  .mkd label { display:grid; gap:5px; font-size:13.5px; color:#9b9a97; font-weight:600; }
  .mkd input, .mkd textarea { background:#fff; color:#37352f; border:1px solid #ebe7f7; border-radius:10px; padding:9px 12px; font-size:15px; font-weight:400; width:100%; }
  .mkd textarea { min-height:120px; resize:vertical; line-height:1.55; }
  .mkd .two { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .mkd .sw { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .mkd .sw button { display:flex; align-items:center; gap:6px; border:1px solid #ebe7f7; border-radius:99px; padding:5px 12px 5px 6px; font-size:14px; background:#fff; color:#37352f; }
  .mkd .sw button i { width:22px; height:22px; border-radius:50%; display:inline-grid; place-items:center; font-style:normal; font-size:13px; }
  .mkd .sw button[aria-pressed="true"], .mkd .em button[aria-pressed="true"] { border-color:#7c63de; box-shadow:0 0 0 2px #7c63de inset; }
  .mkd .em { display:flex; gap:5px; flex-wrap:wrap; }
  .mkd .em button { width:36px; height:36px; border-radius:10px; border:1px solid #ebe7f7; background:#fff; font-size:19px; line-height:1; padding:0; }
  .mkd .cpick { width:42px; height:32px; padding:2px; border-radius:8px; cursor:pointer; }
  .mkd .chips { display:flex; gap:6px; flex-wrap:wrap; }
  .mkd .chips button { font-size:12.5px; border-radius:99px; padding:3px 10px; background:#f1eefb; color:#5d5875; border:0; }
  .mkd .stp { border:1px solid #ebe7f7; border-radius:14px; padding:12px; display:grid; gap:8px; background:#fcfbff; }
  .mkd .stp .sh { display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700; color:#7c63de; }
  .mkd .stp .sh button { margin-left:auto; border:0; background:none; color:#9b9a97; font-size:13px; }
  .mkd .stp textarea { min-height:60px; }
  .mkd .stp .shot { display:flex; align-items:center; gap:8px; font-size:13px; color:#9b9a97; font-weight:400; }
  .mkd .stp .shot img { width:56px; height:40px; object-fit:cover; border-radius:6px; border:1px solid #ebe7f7; }
  .mkd .stp .shot button { border:1px solid #ebe7f7; background:#fff; border-radius:99px; padding:4px 12px; font-size:13px; color:#37352f; }
  .mkd .add { border:1px dashed #cbbcf7; background:#fff; color:#7c63de; border-radius:12px; padding:10px; font-size:14px; font-weight:700; }
  .mkd .act { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; padding-top:4px; }
  .mkd .pv { background:#f6f4fd; overflow:auto; padding:16px; }
  .mkd .pv .scale { transform-origin:top left; }
  .mkd .hint { font-size:12.5px; color:#9b9a97; font-weight:400; line-height:1.5; }
  .mkd .pvh { display:none; }
  @media (max-width:760px) {
    .mkd { width:100vw; max-width:100vw; height:100dvh; max-height:100dvh; border-radius:0; }
    .mkd .wrap { grid-template-columns:1fr; height:100dvh; max-height:100dvh; overflow:auto; }
    .mkd .side { overflow:visible; padding:18px 16px 0; }
    .mkd .pv { padding:12px 16px 90px; } .mkd .pvh { display:block; font-size:13.5px; font-weight:700; color:#9b9a97; margin:0 0 8px; }
    .mkd .act { position:fixed; left:0; right:0; bottom:0; z-index:2; background:#fffffff2; backdrop-filter:blur(8px); padding:10px 16px calc(10px + env(safe-area-inset-bottom)); border-top:1px solid #ebe7f7; }
    .mkd .act .btn { flex:1; text-align:center; }
  }`;

  const now = () => { const d = new Date(), h = d.getHours(); return (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const later = t => { const m = t.match(/(\d+):(\d+)$/); if (!m) return t; let mm = +m[2] + 1, hh = +m[1]; if (mm > 59) { mm = 0; hh = hh % 12 + 1; } return t.replace(/\d+:\d+$/, hh + ':' + String(mm).padStart(2, '0')); };
  const art = (k, ch, col) => '<p style="color:' + col + '">' + (ARTS[k] || ARTS.heart)[1].map(r => '<span>' + [...r].map(c => '<i>' + (c === 'x' ? esc(ch) : '') + '</i>').join('') + '</span>').join('') + '</p>';
  const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
  const pair = l => { const i = l.indexOf('|'); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; };
  const cardLine = l => { const [a, b] = pair(l), m = a.match(/^(\p{Extended_Pictographic}️?)\s*(.*)$/u); return m ? [m[1], m[2], b] : ['•', a, b]; };

  // 소식: 카톡 대화 모양
  function chatHtml(d) {
    const bg = d.bg, acc = d.acc, t1 = d.time || now(), avbg = mix(bg, '#ffffff', .6), me = mix(bg, '#ffffff', .55);
    const bubbles = lines(d.bubbles).map(pair), cards = lines(d.cards).map(cardLine);
    return `<div class="mk" style="background:${bg}">
      <div class="top"><span class="back">‹</span><span class="em">💜</span><h1>조아메모리</h1><small>업데이트</small></div>
      <div class="pill"><i>${esc(d.pill || '소식')}</i></div>
      <div class="row"><div class="av" style="background:${avbg}">${esc(d.av)}</div><div><div class="who">조아메모리</div>
        ${d.ch ? `<div class="line first"><div class="b art">${art(d.art, d.ch, acc)}</div>${bubbles.length ? '' : `<div class="t">${t1}</div>`}</div>` : ''}
        ${bubbles.map(([a, b], i) => `<div class="line${!d.ch && !i ? ' first' : ''}"><div class="b"><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ''}</div>${i === bubbles.length - 1 ? `<div class="t">${t1}</div>` : ''}</div>`).join('')}
      </div></div>
      ${d.me ? `<div class="me"><div class="t">${later(t1)}</div><div class="b" style="background:${me}">${esc(d.me)}</div></div>` : ''}
      ${cards.length ? `<div class="card">${cards.map(([e, a, b]) => `${e}<b>${esc(a)}</b>${esc(b)}`).join('<br>')}</div>` : ''}
      ${d.foot ? `<div class="foot"><i>${esc(d.foot)}</i></div>` : '<div class="nofoot"></div>'}
      <div class="bar"><div>💌 조아메모리${d.ver ? ' ' + esc(d.ver) : ''}</div><u style="background:${acc}">💜</u></div></div>`;
  }
  // 쓰는 법: 카페 설명 그림 모양
  function guideHtml(d) {
    const acc = d.acc, stepBg = mix(acc, '#ffffff', .93), tipBg = mix(acc, '#ffffff', .9), steps = d.steps.filter(x => x.t || x.p || x.img), tips = lines(d.tips).map(cardLine), errs = lines(d.errs).map(l => l.split('|').map(x => x.trim()));
    return `<div class="gd"><div class="cd">
      <h1>${esc(d.title || '제목')}</h1><p class="lead">조아메모리${d.lead ? ' · ' + esc(d.lead) : ' 쓰는 법'}</p>
      <div class="steps">${steps.map((x, i) => `<div class="st" style="background:${stepBg}"><div class="n" style="background:${acc}">${i + 1}</div><div class="sb">${x.t ? `<b>${esc(x.t)}</b>` : ''}${x.p ? `<p>${esc(x.p)}</p>` : ''}${x.img ? `<img src="${x.img}" alt="">` : ''}</div></div>`).join('')}</div>
      ${errs.length ? `<div class="eh"><span>오류에 뜨는 말</span><span>원인 → 고치는 법</span></div>${errs.map(([a, b, c]) => `<div class="er"><div class="tg">${a.split(/s*·s*/).filter(Boolean).map(x => `<i>${esc(x)}</i>`).join('')}</div><div class="rs">${esc(b)}${c ? `<u style="color:${acc}">→ ${esc(c)}</u>` : ''}</div></div>`).join('')}` : ''}
      ${tips.length ? `<div class="tips" style="background:${tipBg}">${tips.map(([e, a, b]) => `${e}<b>${esc(a)}</b>${esc(b)}`).join('<br>')}</div>` : ''}
      <div class="ft">조아메모리ෆ${d.ver ? ' ' + esc(d.ver) : ''}</div></div></div>`;
  }
  const pageHtml = d => d.kind === 'guide' ? guideHtml(d) : chatHtml(d);

  let h2c = null; // html2canvas는 처음 그림을 찍을 때 한 번만 받아요
  const loadH2C = () => h2c || (h2c = new Promise((ok, no) => { if (window.html2canvas) return ok(window.html2canvas); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload = () => ok(window.html2canvas); s.onerror = () => { h2c = null; no(new Error('그림 도구를 못 받았어요 · 인터넷 연결을 확인해 주세요')); }; document.head.appendChild(s); }));
  async function shoot(d) {
    const H = await loadH2C(), box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:-10000px;top:0;'; box.innerHTML = pageHtml(d); document.body.appendChild(box);
    try { if (document.fonts) { await document.fonts.load("25px 'Jua'"); await document.fonts.load("25px 'Gowun Dodum'"); await document.fonts.load("800 25px 'Pretendard Variable'", box.textContent); await document.fonts.ready; }
      await Promise.all([...box.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
      const c = await H(box.firstElementChild, { scale: 1, backgroundColor: null, useCORS: true, logging: false });
      return await new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error('그림을 못 만들었어요')), 'image/png'));
    } finally { box.remove(); }
  }

  let inited = false;
  function init() { if (inited) return; inited = true;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const f = document.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap'; document.head.appendChild(f); }
  const store = { get: () => { try { return JSON.parse(localStorage.getItem('joa_mk') || 'null'); } catch (_) { return null; } }, set: v => { try { localStorage.setItem('joa_mk', JSON.stringify(v)); } catch (_) {} } };

  // 소식 칸들
  const newsForm = d => `
      <label>색<div class="sw">${NEWS.map((t, i) => `<button type="button" data-preset="${i}" aria-pressed="${d.bg === t.bg}"><i style="background:${t.bg}">${t.av}</i>${t.name}</button>`).join('')}<input type="color" class="cpick" data-k="bg" value="${d.bg}" title="바탕색 직접 고르기"></div></label>
      <label>프로필<div class="em">${AVS.map(a => `<button type="button" data-av="${a}" aria-pressed="${d.av === a}">${a}</button>`).join('')}</div></label>
      <div class="two"><label>첫 그림 모양<div class="sw">${Object.entries(ARTS).map(([k, [n]]) => `<button type="button" data-art="${k}" aria-pressed="${d.art === k}" style="padding:5px 11px">${n}</button>`).join('')}</div></label>
        <label>그림 글자 (비우면 그림 없음)<input data-k="ch" maxlength="2" value="${esc(d.ch)}"></label></div>
      <div class="two"><label>날짜 줄<input data-k="pill" value="${esc(d.pill)}"></label><label>판 번호<input data-k="ver" value="${esc(d.ver)}" placeholder="5.8.48"></label></div>
      <label>말풍선 (한 줄에 하나 · 작은 설명은 | 뒤에)<textarea data-k="bubbles" placeholder="장기기억, 한 번에 지워 줄게. | 설정 › 편의 · 웹 모드&#10;굳은 문장, 더 꼼꼼히 찾을게. | 문장 꼴 · 버릇 말까지">${esc(d.bubbles)}</textarea><span class="hint">말하듯 짧게, 한 줄에 한 가지만 쓰면 예뻐요. 6~7줄이 알맞아요.</span></label>
      <label>내 말풍선<input data-k="me" value="${esc(d.me)}"><div class="chips">${PHRASES.map(p => `<button type="button" data-ph="${esc(p)}">${esc(p)}</button>`).join('')}</div></label>
      <label>아래 상자 (한 줄에 하나 · 이모지 이름 | 내용)<textarea data-k="cards" style="min-height:80px" placeholder="🔧 그 밖에 | ETC용 모델 고르기&#10;🐛 고친 것 | 그 외 오류 수정">${esc(d.cards)}</textarea></label>
      <label>맨 아래 한마디 (안 써도 돼요)<input data-k="foot" value="${esc(d.foot)}" placeholder="* 지운 카드는 못 되돌려요 🥹"></label>`;
  // 쓰는 법 칸들
  const guideForm = d => `
      <label>색<div class="sw">${ACCS.map(c => `<button type="button" data-acc="${c}" aria-pressed="${d.acc === c}" style="padding:4px"><i style="background:${c};width:24px;height:24px"></i></button>`).join('')}<input type="color" class="cpick" data-k="acc" value="${d.acc}" title="색 직접 고르기"></div></label>
      <label>제목<input data-k="title" value="${esc(d.title)}" placeholder="ChatGPT 구독으로 정리하기 🤖 (끝에 이모지를 붙여도 예뻐요)"></label>
      <label>한 줄 설명 (안 써도 돼요)<input data-k="lead" value="${esc(d.lead)}" placeholder="키 없이 ChatGPT 계정으로 정리할 수 있어요"></label>
      <label>단계</label>
      <div class="steps-ed">${d.steps.map((s, i) => `<div class="stp"><div class="sh">${i + 1}단계${d.steps.length > 1 ? `<button type="button" data-delstep="${i}">빼기</button>` : ''}</div>
        <input data-sk="t" data-i="${i}" value="${esc(s.t)}" placeholder="할 일 (예: 설정 › 정리 › AI에서 ChatGPT 고르기)">
        <textarea data-sk="p" data-i="${i}" placeholder="설명 (안 써도 돼요)">${esc(s.p)}</textarea>
        <div class="shot">${s.img ? `<img src="${s.img}" alt="">` : '캡처 그림 (안 넣어도 돼요)'}<input type="file" accept="image/*" data-shot="${i}" hidden><button type="button" data-pickshot="${i}">${s.img ? '바꾸기' : '그림 넣기'}</button>${s.img ? `<button type="button" data-rmshot="${i}">빼기</button>` : ''}</div></div>`).join('')}</div>
      <button type="button" class="add" data-addstep>+ 단계 추가</button>
      <label>오류 표 (안 써도 돼요 · 한 줄에 하나 · 오류 말 | 원인 | 고치는 법)<textarea data-k="errs" style="min-height:80px" placeholder="404 · not found | 프로젝트 이름을 넣음 | 프로젝트 ID(영어·숫자)로 바꾸기&#10;429 · 한도 | 짧은 시간에 너무 많이 부름 | 몇 분 뒤 다시">${esc(d.errs)}</textarea><span class="hint">오류 말에 · 를 넣으면 꼬리표가 두 개로 나뉘어요</span></label>
      <label>팁 상자 (한 줄에 하나 · 이모지 이름 | 내용)<textarea data-k="tips" style="min-height:80px" placeholder="💡 팁 | 새 모델이 안 보이면 모델 새로고침&#10;⚠️ 주의 | 토큰은 남에게 보내지 마세요">${esc(d.tips)}</textarea></label>
      <label>판 번호 (안 써도 돼요)<input data-k="ver" value="${esc(d.ver)}" placeholder="5.8.48"></label>`;

  // open({ version, date, kind }, done({ file, title, body, icon, tags }))
  function open(opt, done) {
    init(); const last = store.get() || {}, dt = String(opt.date || '').split('-').map(Number), kind = opt.kind === 'guide' ? 'guide' : 'news';
    const P = NEWS[((last.preset ?? NEWS.length - 1) + 1) % NEWS.length]; // 소식 색은 지난번 다음 색부터
    const d = { kind, ver: opt.version || '', time: now(),
      bg: P.bg, acc: P.acc, av: P.av, art: P.art, ch: P.ch, pill: dt[1] ? `${dt[1]}월 ${dt[2]}일 소식` : '소식', bubbles: '', me: 'huh', cards: '', foot: '',
      title: '', lead: '', steps: [{ t: '', p: '', img: '' }, { t: '', p: '', img: '' }], tips: '', errs: '' };
    if (kind === 'guide') d.acc = last.gacc || ACCS[0];
    const dlg = document.createElement('dialog'); dlg.className = 'mkd'; document.body.appendChild(dlg);
    const paint = () => { dlg.innerHTML = `<div class="wrap"><div class="side" tabindex="-1"><h3>🎨 ${kind === 'guide' ? '쓰는 법' : '소식'} 그림 만들기</h3>${kind === 'guide' ? guideForm(d) : newsForm(d)}
      <div class="act"><button type="button" class="btn ghost" data-mk="close">닫기</button><button type="button" class="btn ghost" data-mk="save">그림 받기</button><button type="button" class="btn" data-mk="use">글에 넣기</button></div>
    </div><div class="pv"><p class="pvh">미리보기</p><div class="scale"></div></div></div>`; draw(); };
    const draw = () => { const pv = dlg.querySelector('.scale'); if (!pv) return; pv.innerHTML = pageHtml(d); const w = dlg.querySelector('.pv').clientWidth - 32, s = Math.min(1, w / 780); pv.style.transform = `scale(${s})`; pv.style.width = (780 * s) + 'px';
      const fit = () => { pv.style.height = (pv.firstElementChild.offsetHeight * s) + 'px'; }; fit(); pv.querySelectorAll('img').forEach(i => i.addEventListener('load', fit, { once: true })); };
    const repaint = () => { const y = dlg.querySelector('.side')?.scrollTop || 0, wy = dlg.querySelector('.wrap')?.scrollTop || 0; paint(); const sd = dlg.querySelector('.side'), wr = dlg.querySelector('.wrap'); if (sd) sd.scrollTop = y; if (wr) wr.scrollTop = wy; };
    dlg.addEventListener('input', e => { const t = e.target, k = t.dataset.k, sk = t.dataset.sk;
      if (k) { d[k] = t.value; if (k === 'bg') { d.acc = mix(t.value, '#000000', .45); dlg.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', 'false')); } if (k === 'acc') dlg.querySelectorAll('[data-acc]').forEach(b => b.setAttribute('aria-pressed', 'false')); draw(); }
      else if (sk) { d.steps[+t.dataset.i][sk] = t.value; draw(); } });
    dlg.addEventListener('change', e => { const t = e.target; if (!t.dataset.shot) return; const f = t.files && t.files[0]; if (!f) return; const i = +t.dataset.shot;
      const r = new FileReader(); r.onload = () => { d.steps[i].img = r.result; repaint(); }; r.readAsDataURL(f); }); // 단계 그림은 데이터로 넣어 둬요(그림으로 찍을 때 그대로 들어가게)
    const busy = on => dlg.querySelectorAll('[data-mk]').forEach(b => { b.disabled = on; });
    dlg.addEventListener('click', async e => {
      const g = s => e.target.closest(s);
      if (g('[data-preset]')) { const t = NEWS[+g('[data-preset]').dataset.preset]; Object.assign(d, { bg: t.bg, acc: t.acc, av: t.av, art: t.art, ch: t.ch }); d.preset = +g('[data-preset]').dataset.preset; return repaint(); }
      if (g('[data-av]')) { d.av = g('[data-av]').dataset.av; return repaint(); }
      if (g('[data-art]')) { d.art = g('[data-art]').dataset.art; return repaint(); }
      if (g('[data-acc]')) { d.acc = g('[data-acc]').dataset.acc; return repaint(); }
      if (g('[data-ph]')) { d.me = g('[data-ph]').dataset.ph; return repaint(); }
      if (g('[data-addstep]')) { d.steps.push({ t: '', p: '', img: '' }); repaint(); return dlg.querySelector('.add')?.scrollIntoView({ block: 'center' }); }
      if (g('[data-delstep]')) { d.steps.splice(+g('[data-delstep]').dataset.delstep, 1); return repaint(); }
      if (g('[data-pickshot]')) return dlg.querySelector(`[data-shot="${g('[data-pickshot]').dataset.pickshot}"]`).click();
      if (g('[data-rmshot]')) { d.steps[+g('[data-rmshot]').dataset.rmshot].img = ''; return repaint(); }
      const mk = g('[data-mk]')?.dataset.mk; if (!mk) return; if (mk === 'close') return dlg.close();
      if (kind === 'news' && !lines(d.bubbles).length) return alert('말풍선을 한 줄 이상 써 주세요');
      if (kind === 'guide' && (!d.title.trim() || !(d.steps.some(s => s.t || s.p || s.img) || lines(d.errs).length))) return alert('제목과, 단계나 오류 표를 하나 이상 써 주세요');
      busy(true); const btn = g('[data-mk]'), was = btn.textContent; btn.textContent = '만드는 중…';
      try { const blob = await shoot(d), name = (kind === 'guide' ? 'guide-' : 'update-') + (String(opt.date || '').replace(/-/g, '') || Date.now()) + '.png';
        store.set(Object.assign(last, kind === 'guide' ? { gacc: d.acc } : { preset: d.preset ?? NEWS.findIndex(t => t.bg === d.bg) }));
        if (mk === 'save') { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
        else { dlg.close(); const file = new File([blob], name, { type: 'image/png' });
          if (kind === 'guide') done && done({ file, title: d.title.trim(), body: d.lead.trim(), icon: '📖', tags: [] });
          else { const b = lines(d.bubbles).map(pair); done && done({ file, title: b[0][0].replace(/[.!~]+$/, ''), body: b.slice(0, 3).map(x => x[0]).join(' '), icon: d.av, tags: d.ver ? [d.ver] : [] }); } }
      } catch (err) { alert(err.message || '그림을 못 만들었어요'); } finally { btn.textContent = was; busy(false); }
    });
    dlg.addEventListener('close', () => dlg.remove());
    paint(); dlg.showModal(); draw(); setTimeout(draw, 300); // 글꼴이 늦게 오면 크기가 바뀌어서 한 번 더
    if (matchMedia('(pointer: fine)').matches) dlg.querySelector(kind === 'guide' ? '[data-k="title"]' : '[data-k="bubbles"]')?.focus(); else dlg.querySelector('.side')?.focus(); // 폰에선 열자마자 자판이 올라오지 않게
  }
  window.JoaMaker = { open, chatHtml, guideHtml, NEWS };
})();
