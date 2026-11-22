(() => {
  'use strict';
  // ── 화면과 상관없는 도우미 (test.js가 이 부분만 불러 확인해요) ──
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const linkify = s => esc(s).replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const textB64 = t => b64(new TextEncoder().encode(t));
  const dataFile = (name, value, at) => `window.JOA_${name}_AT = ${at};\nwindow.JOA_${name} = ${JSON.stringify(value, null, 2)};\n`;
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const dayParts = d => { const [y, m, dd] = String(d).split('-').map(Number); return { y, m, d: dd, w: WD[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()] }; };
  const sortPosts = l => [...l].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
  const today = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); };
  if (typeof module !== 'undefined') { module.exports = { esc, linkify, textB64, dataFile, dayParts, sortPosts }; return; }

  // ── 자료 ──
  const FILES = { SITE: 'data/site.js', POSTS: 'data/posts.js', FAQ: 'data/faq.js' };
  const LS = { tok: 'joa_tok', repo: 'joa_repo' };
  const store = { get: k => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) {} } };
  const tok = () => store.get(LS.tok), repo = () => store.get(LS.repo), owner = () => !!tok();
  const data = {};
  for (const n of Object.keys(FILES)) { // 주인은 방금 저장한 것을 바로 봐요(사이트에 반영되기까지 1분쯤 걸려서)
    data[n] = window['JOA_' + n];
    if (owner()) try { const c = JSON.parse(store.get('joa_c_' + n) || 'null'); if (c && c.at > (window['JOA_' + n + '_AT'] || 0)) data[n] = c.v; else if (c) store.set('joa_c_' + n, null); } catch (_) {}
  }
  if (!data.SITE || !Array.isArray(data.SITE.menus)) { document.getElementById('main').innerHTML = '<p class="empty">사이트 자료(data/site.js)를 읽지 못했어요.</p>'; return; }
  data.POSTS = Array.isArray(data.POSTS) ? data.POSTS : []; data.FAQ = Array.isArray(data.FAQ) ? data.FAQ : [];

  // ── GitHub에 저장 (주인만) ──
  async function gh(path, opt = {}) {
    const r = await fetch('https://api.github.com/repos/' + repo() + path, { method: opt.method || 'GET', body: opt.body, headers: { Authorization: 'Bearer ' + tok(), Accept: 'application/vnd.github+json', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } });
    if (r.status === 404 && opt.ok404) return null;
    if (!r.ok) throw new Error(r.status === 401 ? '토큰이 맞지 않아요' : r.status === 403 ? '이 토큰으로는 쓸 수 없어요(권한 확인)' : r.status === 404 ? '저장소를 못 찾았어요' : r.status === 409 || r.status === 422 ? '방금 다른 저장과 겹쳤어요 · 다시 눌러 주세요' : 'GitHub 오류 ' + r.status);
    return r.json();
  }
  async function putFile(path, contentB64, message) {
    const url = '/contents/' + path.split('/').map(encodeURIComponent).join('/'), cur = await gh(url, { ok404: true });
    await gh(url, { method: 'PUT', body: JSON.stringify({ message, content: contentB64, ...(cur && cur.sha ? { sha: cur.sha } : {}) }) });
  }
  async function saveData(name, value, message) {
    const at = Date.now();
    await putFile(FILES[name], textB64(dataFile(name, value, at)), message);
    data[name] = value; store.set('joa_c_' + name, JSON.stringify({ at, v: value }));
  }
  const fresh = {}; // 방금 올린 그림: 사이트에 반영되기 전까지 이 화면에서는 고른 파일을 그대로 보여 줘요
  async function uploadImage(file) {
    if (file.size > 8 * 1024 * 1024) throw new Error(file.name + ' · 그림 한 장은 8MB까지예요');
    const ext = (file.name.match(/\.(png|jpe?g|gif|webp)$/i) || [, 'png'])[1].toLowerCase();
    const kind = (file.name.match(/^(update|guide)-/) || [])[1]; // 그림 만들기로 만든 건 이름 끝에 표시를 남겨요(목록 미리보기를 말풍선 쪽으로 자르려고)
    const path = 'img/' + today().replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 8) + (kind ? '-' + kind : '') + '.' + ext;
    await putFile(path, b64(new Uint8Array(await file.arrayBuffer())), '그림 올림');
    fresh[path] = URL.createObjectURL(file); return path;
  }

  // ── 화면 ──
  const $ = id => document.getElementById(id), main = $('main'), dlg = $('dlg');
  const st = { shown: 10, edit: null, files: [], faqQ: '', faqCat: '', faqEdit: null, busy: false };
  let route = location.hash; // 지금 화면('#faq', '#p-글번호' 같은 꼴 · 주소창에는 안 보여요)
  const site = () => data.SITE, hash = () => { try { return decodeURIComponent(route.slice(1)); } catch (_) { return route.slice(1); } };
  const curPost = () => hash().startsWith('p-') ? data.POSTS.find(p => p.id === hash().slice(2)) : null; // #p-글번호 = 글 한 편 보기
  const curMenu = () => { const p = curPost(), h = p ? p.menu : hash(); return site().menus.find(m => m.id === h) || site().menus[0]; };
  const postUrl = p => '#p-' + encodeURIComponent(p.id);
  function toast(t) { document.querySelectorAll('.toast').forEach(x => x.remove()); const e = document.createElement('div'); e.className = 'toast'; e.setAttribute('role', 'status'); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 3500); }
  async function work(fn, done) { if (st.busy) return; st.busy = true; render(); try { await fn(); if (done) toast(done); } catch (e) { toast(e.message || '실패했어요'); } finally { st.busy = false; render(); } }

  function renderChrome() {
    const s = site(), m = curMenu();
    document.title = (s.small ? s.small + ' ' : '') + s.title;
    $('barName').textContent = (s.small ? s.small + ' ' : '') + s.title; $('barMenu').textContent = m.name; $('footName').textContent = (s.small ? s.small + ' ' : '') + s.title;
    $('barVer').textContent = (st.ver || s.version) ? '지금 판 ' + (st.ver || s.version) : ''; $('barGet').href = s.installUrl || '#'; $('barGet').hidden = !s.installUrl;
    $('hSmall').textContent = s.small || ''; $('hTitle').textContent = s.title; $('hBubble').textContent = s.bubble || ''; $('hBubble').hidden = !s.bubble; $('hLead').textContent = s.lead || '';
    // 메뉴는 바뀌었을 때만 새로 그려요(누를 때마다 다시 그리면 메뉴가 깜빡여요) · 평소엔 '지금 메뉴' 표시만 옮겨요
    const key = JSON.stringify(s.menus.map(x => [x.id, x.icon, x.name])), tabs = $('tabs');
    if (tabs.dataset.key !== key) { tabs.dataset.key = key; tabs.innerHTML = s.menus.map(x => `<a href="#${encodeURIComponent(x.id)}" data-id="${esc(x.id)}"><u>${esc(x.icon)}</u>${esc(x.name)}</a>`).join(''); }
    tabs.querySelectorAll('a').forEach(a => { if (a.dataset.id === m.id) { if (!a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page'); } else a.removeAttribute('aria-current'); });
    $('ownSet').hidden = !owner(); $('ownBtn').textContent = owner() ? '주인 나가기' : '주인 로그인';
  }
  const dis = () => st.busy ? ' disabled' : '';

  function postForm(m) {
    const p = st.edit, feeds = site().menus.filter(x => x.kind === 'feed' || x.kind === 'cards' || x.kind === 'stream'), noTitle = (site().menus.find(x => x.id === (p.menu || m.id)) || m).kind === 'stream';
    return `<form class="form" data-form="post">
      <div class="row"><input class="ic" name="icon" maxlength="4" value="${esc(p.icon || '')}" aria-label="제목 앞 이모지" title="제목 앞에 붙는 이모지 · 안 써도 돼요" placeholder="이모지">
        <input class="grow" name="title"${noTitle ? '' : ' required'} value="${esc(p.title || '')}" placeholder="${noTitle ? '제목 (안 써도 돼요)' : '제목'}"></div>
      <textarea name="body" placeholder="${noTitle ? '무슨 일이 있었나요? · > 로 시작하면 인용으로 크게 보여요' : '내용'}">${esc(p.body || '')}</textarea>
      <div class="row"><select class="sel" name="menu" aria-label="메뉴">${feeds.map(x => `<option value="${esc(x.id)}"${x.id === (p.menu || m.id) ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
        <input class="dt" type="date" name="date" required value="${esc(p.date || today())}" aria-label="날짜">
        <input class="grow" name="tags" value="${esc((p.tags || []).join(', '))}" placeholder="꼬리표 (쉼표로 나눠요)"></div>
      <div class="pv">${st.files.map((f, i) => `<span><img src="${esc(typeof f === 'string' ? (fresh[f] || f) : f.url)}" alt=""><button type="button" data-act="rmfile" data-arg="${i}" aria-label="그림 빼기">✕</button></span>`).join('')}</div>
      <div class="act"><label class="note"><input type="file" accept="image/*" multiple data-pick hidden><button type="button" class="btn ghost" data-act="pick">🖼️ 그림 고르기</button><span class="tip"> 끌어다 놓거나 붙여 넣어도 돼요</span></label>
        <button type="button" class="btn ghost" data-act="maker"${dis()}>🎨 그림 만들기</button><button type="button" class="btn ghost" data-act="cancel"${dis()}>닫기</button><button class="btn"${dis()}>${st.busy ? '올리는 중…' : p.id ? '고친 대로 올리기' : '올리기'}</button></div>
    </form>`;
  }
  function renderFeed(m) {
    const list = sortPosts(data.POSTS.filter(p => p.menu === m.id)); let h = '<div class="tl">', yr = null;
    if (owner()) h += `<div class="it new"><div class="day"></div><button class="dot" data-act="write" aria-label="새 글 쓰기">+</button>${st.edit ? postForm(m) : `<button data-act="write">새 글 쓰기</button>`}</div>`;
    if (!list.length) h += `<p class="empty">아직 올라온 글이 없어요.</p>`;
    list.slice(0, st.shown).forEach((p, i) => {
      const d = dayParts(p.date), imgs = p.images || [];
      if (!p.pin && yr !== null && d.y !== yr) h += `<div class="year"><span>${d.y}년</span></div>`;
      if (!p.pin) yr = d.y;
      const same = i > 0 && list[i - 1].date === p.date && !!list[i - 1].pin === !!p.pin; // 바로 앞 글과 같은 날이면 날짜를 다시 안 써요
      h += `<article class="it${i === 0 ? ' now' : ''}${same ? ' same' : ''}"><div class="day">${same ? '' : `<b>${d.d}</b><span>${d.m}월 · ${d.w}요일</span>`}</div><div class="dot"></div><div class="post">
        <h2><a href="${postUrl(p)}">${p.icon ? `<u>${esc(p.icon)}</u>` : ''}${esc(p.title)}</a>${p.pin ? '<span class="pin">고정</span>' : ''}</h2>
        ${p.body ? `<p class="clip">${linkify(p.body)}</p>` : ''}
        ${(p.tags || []).length ? `<div class="tags">${p.tags.map((t, k) => `<i class="t${k % 5}">${esc(t)}</i>`).join('')}</div>` : ''}
        ${imgs.length ? `<div class="shots${imgs.length > 1 ? ' many' : ''}">${imgs.map(s => `<a href="${postUrl(p)}"><img${/-(update|guide)\.png$/.test(s) ? ' class="chat"' : ''} src="${esc(fresh[s] || s)}" alt="${esc(p.title)}" loading="lazy" draggable="false"></a>`).join('')}</div>` : ''}
        ${owner() ? `<div class="tools"><button data-act="edit" data-arg="${esc(p.id)}">고치기</button><button data-act="pin" data-arg="${esc(p.id)}">${p.pin ? '고정 풀기' : '맨 위에 고정'}</button><button data-act="del" data-arg="${esc(p.id)}">지우기</button></div>` : ''}
      </div></article>`;
    });
    h += '</div>';
    if (list.length > st.shown) h += `<button class="more" data-act="more">지난 글 더 보기</button>`;
    main.innerHTML = h;
  }
  // 피드: 제목 없이 짧은 글·그림 · 언제 썼는지는 '3시간 전'처럼 · 글이 '>'로 시작하면 인용 카드 · 그림 1장은 크게, 2장은 나란히, 3장부터는 격자
  // 하트: 이 기기에서 누른 글만 기억해요(기기마다 한 번 · 다른 사람 수는 안 세요)
  const likes = () => { try { return new Set(JSON.parse(localStorage.getItem('joa_like') || '[]')); } catch (_) { return new Set(); } };
  const ago = d => { const t = Date.parse(d + 'T12:00:00+09:00'), n = Math.round((Date.now() - t) / 864e5); return n <= 0 ? '오늘' : n === 1 ? '어제' : n < 7 ? n + '일 전' : String(d).slice(5).replace('-', '월 ').replace(/^0/, '') + '일'; };
  function renderStream(m) {
    const list = sortPosts(data.POSTS.filter(p => p.menu === m.id)), s = site(); let h = `<div class="sf${m.plain ? ' plain' : ''}">`;
    if (owner() && !st.edit) h += `<div class="sf-opt"><button data-act="sfplain" data-arg="${esc(m.id)}"${dis()}>${m.plain ? '🎨 색 카드로' : '⬜ 색 없이'}</button></div>`; // 글만 쓴 글을 색 카드로 보일지(주인만 · 메뉴마다)
    if (owner()) h += st.edit ? postForm(m) : `<button class="sf-new" data-act="write"><img src="img/icon.png" alt=""><span>무슨 일이 있었나요?</span></button>`;
    if (!list.length) h += '<p class="empty">아직 올라온 글이 없어요.</p>';
    list.slice(0, st.shown).forEach((p, pi) => { const imgs = p.images || [], body = String(p.body || ''), quote = /^\s*>/.test(body);
      h += `<article class="sf-it${p.pin ? ' pin' : ''}">${(() => { const dd = dayParts(p.date), same = pi > 0 && list[pi - 1].date === p.date; return `<div class="sf-day">${same ? '' : `<b>${dd.d}</b><span>${dd.m}월 · ${dd.w}</span>`}</div>`; })()}<div class="sf-bub"><div class="sf-nm${pi > 0 && list[pi - 1].date === p.date ? ' same' : ''}"><img src="img/icon.png" alt=""><b>${esc(s.title || '조아메모리')}</b><span>${p.pin ? '📌 ' : ''}${p.at ? new Date(p.at).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : ago(p.date)}</span><button class="sf-like" data-act="like" data-arg="${esc(p.id)}" aria-pressed="${likes().has(p.id)}" aria-label="좋아요">${likes().has(p.id) ? '♥' : '♡'}</button></div><div class="sf-cd">${p.fixed ? `<span class="sf-fix"><img src="img/icon.png" alt="">수정 완료<b>${esc(String(p.fixed).slice(5).replace('-', '.'))}</b></span>` : ''}
        ${imgs.length ? `<div class="sf-img n${Math.min(imgs.length, 3)}">${imgs.map(x => `<a href="${postUrl(p)}"><img src="${esc(fresh[x] || x)}" alt="" loading="lazy" draggable="false"></a>`).join('')}</div>` : ''}
        ${quote ? `<blockquote>${linkify(body.replace(/^\s*>\s?/gm, ''))}</blockquote>` : ''}
        ${p.title || (body && !quote) ? (() => { const only = !imgs.length, ls = body.split('\n'), head = !p.title && only && ls.length > 1 && ls[0].trim().length <= 40 ? ls.shift() : '', rest = head ? ls.join('\n').replace(/^\n+/, '') : body; // 글만 쓴 글: 첫 줄이 짧으면 머리말로
          return `<div class="sf-tx${only ? ' only c' + (pi % 5) : ''}">${p.title || head ? `<h3>${p.icon ? esc(p.icon) + ' ' : ''}${esc(p.title || head)}</h3>` : ''}${rest && !quote ? `<p>${linkify(rest)}</p>` : ''}</div>`; })() : ''}
        ${(p.tags || []).length ? `<div class="sf-tg">${p.tags.map((t, k) => `<i class="t${k % 5}">${esc(t)}</i>`).join('')}</div>` : ''}
        ${owner() ? `<div class="sf-ft"><span class="sf-own"><button data-act="fixed" data-arg="${esc(p.id)}">${p.fixed ? '수정 완료 풀기' : '✅ 수정 완료'}</button><button data-act="edit" data-arg="${esc(p.id)}">고치기</button><button data-act="pin" data-arg="${esc(p.id)}">${p.pin ? '고정 풀기' : '고정'}</button><button data-act="del" data-arg="${esc(p.id)}">지우기</button></span></div>` : ''}
      </div></div></article>`; });
    h += '</div>'; if (list.length > st.shown) h += '<button class="more" data-act="more">지난 글 더 보기</button>';
    main.innerHTML = h;
  }
  const faqPick = () => { const q = st.faqQ.trim().toLowerCase(); return data.FAQ.filter(f => (!st.faqCat || f.cat === st.faqCat) && (!q || (f.q + ' ' + f.a).toLowerCase().includes(q))).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0)); }; // 고정한 질문이 맨 위
  // 카드 게시판(만든 것): 날짜 없이 카드로 · 글 안 첫 주소는 [열기] 버튼이 돼요
  function renderCards(m) {
    const list = sortPosts(data.POSTS.filter(p => p.menu === m.id)); let h = '';
    if (owner()) h += `<div class="cwrite">${st.edit ? postForm(m) : '<button class="btn ghost" data-act="write">+ 새 카드 쓰기</button>'}</div>`;
    const C = ['#ece6ff', '#ffe3ec', '#dff1e7', '#dcebfa', '#fff0c9', '#ffe6d6', '#e8e4f7', '#d8f1f0'];
    const url = p => (String(p.body || '').match(/https?:\/\/\S+/) || [])[0], note = p => { const u = url(p); return (u ? String(p.body).replace(u, '') : String(p.body || '')).trim(); };
    const tools = p => owner() ? `<div class="tools"><button data-act="edit" data-arg="${esc(p.id)}">고치기</button><button data-act="pin" data-arg="${esc(p.id)}">${p.pin ? '고정 풀기' : '고정'}</button><button data-act="del" data-arg="${esc(p.id)}">지우기</button></div>` : '';
    const pins = list.filter(p => p.pin), rest = list.filter(p => !p.pin);
    h += pins.map(p => `<a class="hero2" href="${esc(url(p) || '#')}" target="_blank" rel="noopener"><u>${esc(p.icon || '🔗')}</u><div><b>${esc(p.title)}</b>${note(p) ? `<span>${esc(note(p))}</span>` : ''}</div><i>열기</i></a>${tools(p)}`).join('');
    h += '<div class="apps">' + rest.map((p, i) => `<div class="appi"><a href="${esc(url(p) || '#')}" target="_blank" rel="noopener"><u style="background:${C[i % C.length]}">${esc(p.icon || '🔗')}</u><b>${esc(p.title)}</b>${note(p) ? `<span>${esc(note(p))}</span>` : ''}</a>${tools(p)}</div>`).join('') + '</div>';
    if (!list.length) h += '<p class="empty">아직 올라온 글이 없어요.</p>';
    main.innerHTML = h;
  }
  function renderFaq() {
    const cats = site().faqCats || [];
    const list = faqPick();
    const form = f => `<form class="form" data-form="faq" style="margin-bottom:18px"><input name="q" required value="${esc(f.q || '')}" placeholder="질문"><textarea name="a" required placeholder="답">${esc(f.a || '')}</textarea>
      <div class="act"><select class="sel" name="cat" aria-label="갈래" style="margin-right:auto">${cats.map(c => `<option${c === f.cat ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <button type="button" class="btn ghost" data-act="faqcancel"${dis()}>닫기</button><button class="btn"${dis()}>${st.busy ? '올리는 중…' : '올리기'}</button></div></form>`;
    main.innerHTML = `<div class="faq">
      ${owner() ? (st.faqEdit ? form(st.faqEdit) : `<p style="margin-bottom:14px"><button class="btn ghost" data-act="faqnew">+ 질문 추가</button></p>`) : ''}
      <input class="find" type="search" data-find value="${esc(st.faqQ)}" placeholder="궁금한 걸 적어 보세요" aria-label="질문 찾기">
      <div class="chips">${['', ...cats].map(c => `<button data-act="faqcat" data-arg="${esc(c)}" aria-pressed="${st.faqCat === c}">${esc(c || '전체')}</button>`).join('')}</div>
      <div class="qs" id="qs">${faqList(list)}</div></div>`;
  }
  const faqList = list => list.length ? list.map(f => `<details${f.pin ? ' class="pinned"' : ''}><summary><u>${f.pin ? '📌' : 'Q'}</u><b>${esc(f.q)}</b>${f.cat ? `<em class="t${Math.max(0, (site().faqCats || []).indexOf(f.cat)) % 5}">${esc(f.cat)}</em>` : ''}</summary><div class="a"><img src="img/icon-yellow.png" alt=""><div>${linkify(f.a)}${owner() ? `<div class="tools"><button data-act="faqedit" data-arg="${esc(f.id)}">고치기</button><button data-act="faqpin" data-arg="${esc(f.id)}">${f.pin ? '고정 풀기' : '맨 위에 고정'}</button><button data-act="faqdel" data-arg="${esc(f.id)}">지우기</button></div>` : ''}</div></div></details>`).join('') : '<p class="empty">맞는 질문이 없어요. 다른 말로 찾아보세요.</p>';
  function renderPage(m) {
    if (owner() && st.pageEdit === m.id) { main.innerHTML = `<form class="form info-edit" data-form="page"><div class="row"><input class="ic" name="icon" maxlength="4" value="${esc(m.icon)}" aria-label="이모지"><input class="grow" name="name" required value="${esc(m.name)}" aria-label="메뉴 이름"></div>
      <label>안내 글</label><textarea name="text" placeholder="안내 글">${esc(m.text || '')}</textarea>
      <div class="row"><input class="grow" name="linkName" value="${esc(m.linkName || '')}" placeholder="버튼 이름 (예: 카페 글로 가기)"><input class="grow" name="linkUrl" value="${esc(m.linkUrl || '')}" placeholder="버튼 주소 (https://…) · 비우면 버튼 없음"></div>
      <div class="act"><button type="button" class="btn ghost" data-act="pagecancel"${dis()}>닫기</button><button class="btn"${dis()}>${st.busy ? '저장하는 중…' : '저장'}</button></div></form>`; return; }
    main.innerHTML = `<div class="info"><u>${esc(m.icon)}</u><p>${linkify(m.text || '')}</p>${m.linkUrl ? `<a class="btn" href="${esc(m.linkUrl)}" target="_blank" rel="noopener">${esc(m.linkName || '바로 가기')}</a>` : ''}${owner() ? `<div class="tools" style="justify-content:center"><button data-act="pageedit" data-arg="${esc(m.id)}">고치기</button></div>` : ''}</div>`;
  }
  // 글 한 편: 목록에서 제목이나 그림을 누르면 여기로 와요 · 그림은 잘리지 않고 통째로 보여요
  function renderPost(p, m) {
    const d = dayParts(p.date);
    main.innerHTML = `<article class="one"><a class="back" href="#${encodeURIComponent(m.id)}">‹ ${esc(m.name)}</a>
      <div class="when">${d.y}년 ${d.m}월 ${d.d}일 ${d.w}요일</div>
      <h2>${p.icon ? `<u>${esc(p.icon)}</u>` : ''}${esc(p.title)}</h2>
      ${(p.tags || []).length ? `<div class="tags">${p.tags.map((t, k) => `<i class="t${k % 5}">${esc(t)}</i>`).join('')}</div>` : ''}
      ${p.body ? `<p>${linkify(p.body)}</p>` : ''}
      ${(p.images || []).map(s => `<button type="button" class="full" data-act="zoom" data-arg="${esc(fresh[s] || s)}" aria-label="크게 보기"><img src="${esc(fresh[s] || s)}" alt="${esc(p.title)}" draggable="false"></button>`).join('')}
      ${owner() ? `<div class="tools"><button data-act="edit" data-arg="${esc(p.id)}">고치기</button><button data-act="pin" data-arg="${esc(p.id)}">${p.pin ? '고정 풀기' : '맨 위에 고정'}</button><button data-act="del" data-arg="${esc(p.id)}">지우기</button></div>` : ''}
    </article>`;
  }
  function render() { renderChrome(); const m = curMenu(), p = curPost(); p && !st.edit ? renderPost(p, m) : m.kind === 'faq' ? renderFaq() : m.kind === 'page' ? renderPage(m) : m.kind === 'cards' ? renderCards(m) : m.kind === 'stream' ? renderStream(m) : renderFeed(m); }

  // ── 주인: 로그인 · 설정 ──
  function loginDialog() {
    dlg.innerHTML = `<h3>주인 로그인</h3><p>글을 올리면 GitHub 저장소에 저장돼요. 토큰은 이 기기에만 남아요.</p>
      <form class="form" data-form="login"><input name="repo" required value="${esc(repo())}" placeholder="저장소 (예: 아이디/저장소이름)" autocomplete="off">
      <input name="tok" type="password" required placeholder="GitHub 토큰" autocomplete="off">
      <div class="act"><button type="button" class="btn ghost" data-act="close">닫기</button><button class="btn">들어가기</button></div></form>`;
    dlg.showModal();
  }
  const MENU_KIND = { feed: '글', stream: '피드', cards: '카드', page: '안내', faq: '질문' };
  function settingsDialog() {
    const s = site(), f = (n, l, v) => `<label>${l}<input name="${n}" value="${esc(v || '')}"></label>`;
    dlg.innerHTML = `<h3>설정</h3><p>바꾼 뒤 저장하면 1분쯤 뒤 모두에게 보여요.</p><form class="form" data-form="site">
      ${f('small', '작은 윗말', s.small)}${f('title', '이름', s.title)}${f('bubble', '말풍선', s.bubble)}${f('lead', '한 줄 소개', s.lead)}${f('version', '지금 판', s.version)}${f('installUrl', '설치 주소', s.installUrl)}
      ${f('faqCats', '질문 갈래 (쉼표로 나눠요)', (s.faqCats || []).join(', '))}
      <label>메뉴 (이모지 · 이름 · 종류 · 순서)</label>
      ${s.menus.map((m, i) => `<div class="mrow"><input name="mi${i}" value="${esc(m.icon)}" maxlength="4" aria-label="이모지"><input name="mn${i}" value="${esc(m.name)}" required aria-label="메뉴 이름"><em class="mk2">${MENU_KIND[m.kind] || ''}</em><button type="button" class="mb" data-act="menumv" data-arg="${i},-1"${i ? '' : ' disabled'} aria-label="위로">↑</button><button type="button" class="mb" data-act="menumv" data-arg="${i},1"${i < s.menus.length - 1 ? '' : ' disabled'} aria-label="아래로">↓</button><button type="button" class="mb" data-act="menudel" data-arg="${i}" aria-label="빼기">✕</button></div>
        ${m.kind === 'page' ? `<textarea name="mt${i}" placeholder="안내 글">${esc(m.text || '')}</textarea><div class="row"><input class="grow" name="ml${i}" value="${esc(m.linkName || '')}" placeholder="버튼 이름"><input class="grow" name="mu${i}" value="${esc(m.linkUrl || '')}" placeholder="버튼 주소"></div>` : ''}`).join('')}
      <div class="madd"><span>+ 메뉴 추가</span>${[['feed', '📮 글'], ['stream', '🗒️ 피드'], ['cards', '🧰 카드'], ['page', '📄 안내'], ...(s.menus.some(m => m.kind === 'faq') ? [] : [['faq', '💬 질문']])].map(([k, n]) => `<button type="button" data-act="menuadd" data-arg="${k}">${n}</button>`).join('')}</div>
      <p class="hint">글: 날짜 순 게시판 · 카드: 링크 카드 · 안내: 글 한 장과 버튼 · 질문: 자주 묻는 것</p>
      <div class="act"><button type="button" class="btn ghost" data-act="close">닫기</button><button class="btn">저장</button></div></form>`;
    if (!dlg.open) dlg.showModal();
  }
  const readSite = form => { const g = n => (form.elements[n]?.value || '').trim(), s = JSON.parse(JSON.stringify(site()));
    for (const k of ['small', 'title', 'bubble', 'lead', 'version', 'installUrl']) s[k] = g(k);
    s.faqCats = g('faqCats').split(',').map(x => x.trim()).filter(Boolean);
    s.menus.forEach((m, i) => { m.icon = g('mi' + i); m.name = g('mn' + i) || m.name; if (m.kind === 'page') { m.text = form.elements['mt' + i].value; m.linkName = g('ml' + i); m.linkUrl = g('mu' + i); } });
    return s; };

  // ── 누르기 ──
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const act = b.dataset.act, arg = b.dataset.arg;
    const post = () => data.POSTS.find(p => p.id === arg), q = () => data.FAQ.find(f => f.id === arg);
    switch (act) {
      case 'more': st.shown += 10; return render();
      case 'write': st.edit = st.edit ? null : {}; st.files = []; return render();
      case 'cancel': st.edit = null; st.files = []; return render();
      case 'zoom': return zoomOpen(arg);
      case 'like': { const l = likes(); l.has(arg) ? l.delete(arg) : l.add(arg); try { localStorage.setItem('joa_like', JSON.stringify([...l])); } catch (_) {} const b = e.target.closest('[data-act="like"]'); if (!b) return render(); b.setAttribute('aria-pressed', l.has(arg)); b.textContent = l.has(arg) ? '♥' : '♡'; return; } // 그 하트만 바꿔요(화면을 다시 그리면 그림이 깜빡여요)
      case 'sfplain': { const s = JSON.parse(JSON.stringify(site())), mm = s.menus.find(x => x.id === arg); if (!mm) return; mm.plain = !mm.plain; return work(async () => { await saveData('SITE', s, '피드 색 바꿈: ' + mm.name); }, mm.plain ? '색 없이 보여요' : '색 카드로 보여요'); }
      case 'pageedit': st.pageEdit = arg; return render();
      case 'pagecancel': st.pageEdit = null; return render();
      case 'emo': { const f = main.querySelector('[data-form="post"]'); if (f) { f.icon.value = arg; f.querySelectorAll('[data-act="emo"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.arg === arg && !!arg)); } return; } // 이모지 고르기: 누르면 왼쪽 칸에 들어가요
      case 'maker': { if (!window.JoaMaker) return toast('그림 만들기를 못 불러왔어요 · 새로고침해 주세요'); keepForm(); // 만든 그림을 글에 붙이고, 비어 있는 제목·내용·이모지·꼬리표는 채워 줘요
        return window.JoaMaker.open({ version: st.ver || site().version, date: st.edit.date || today(), kind: st.edit.menu === 'guide' ? 'guide' : 'news' }, r => { if (!st.edit) return; st.files.push({ file: r.file, url: URL.createObjectURL(r.file) });
          const e = st.edit; if ((site().menus.find(x => x.id === e.menu) || {}).kind === 'stream') { render(); return toast('그림을 붙였어요 · 올리기를 누르면 같이 올라가요'); } if (!e.title) e.title = r.title; if (!e.body) e.body = r.body; if (!e.icon) e.icon = r.icon; e.tags = [...new Set([...(r.tags || []), ...(e.tags || [])])]; render(); toast('그림을 붙였어요 · 올리기를 누르면 같이 올라가요'); }); }
      case 'edit': st.edit = { ...post() }; st.files = [...(st.edit.images || [])]; if (hash().startsWith('p-')) go('#' + encodeURIComponent(st.edit.menu)); render(); return main.querySelector('.new, .cwrite')?.scrollIntoView({ block: 'center' });
      case 'pick': return b.parentElement.querySelector('[data-pick]').click();
      case 'rmfile': st.files.splice(Number(arg), 1); return keepForm();
      case 'fixed': return work(async () => { const l = data.POSTS.map(p => p.id === arg ? (p.fixed ? (({ fixed, ...q }) => q)(p) : { ...p, fixed: today() }) : p); await saveData('POSTS', l, '수정 완료 표시'); }, '저장했어요'); // 알려진 오류를 고치면 카드에 '수정 완료 · 날짜'
      case 'pin': return work(async () => { const l = data.POSTS.map(p => p.id === arg ? { ...p, pin: !p.pin } : p); await saveData('POSTS', l, '고정 바꿈'); }, '저장했어요');
      case 'del': { if (!confirm('"' + post().title + '" 글을 지울까요?')) return; const back = '#' + encodeURIComponent(post().menu); return work(async () => { await saveData('POSTS', data.POSTS.filter(p => p.id !== arg), '글 지움'); if (hash().startsWith('p-')) go(back); }, '지웠어요'); }
      case 'faqcat': st.faqCat = arg; return render();
      case 'faqnew': st.faqEdit = {}; return render();
      case 'faqcancel': st.faqEdit = null; return render();
      case 'faqedit': st.faqEdit = { ...q() }; render(); return main.querySelector('form')?.scrollIntoView({ block: 'center' });
      case 'faqpin': return work(async () => { await saveData('FAQ', data.FAQ.map(f => f.id === arg ? { ...f, pin: !f.pin } : f), '질문 고정 바꿈'); }, '저장했어요');
      case 'faqdel': if (!confirm('"' + q().q + '" 질문을 지울까요?')) return; return work(async () => { await saveData('FAQ', data.FAQ.filter(f => f.id !== arg), '질문 지움'); }, '지웠어요');
      case 'close': return dlg.close();
      case 'menuadd': { const s = readSite(dlg.querySelector('form')), k = arg || 'feed', base = { feed: ['📌', '새 메뉴'], stream: ['🗒️', '피드'], cards: ['🧰', '새 카드 메뉴'], page: ['📄', '새 안내'], faq: ['💬', '자주 묻는 것'] }[k] || ['📌', '새 메뉴'];
        if (k === 'faq' && s.menus.some(m => m.kind === 'faq')) return toast('질문 메뉴는 하나만 있어요');
        s.menus.push({ id: 'm' + Date.now().toString(36), icon: base[0], name: base[1], kind: k, ...(k === 'page' ? { text: '', linkName: '', linkUrl: '' } : {}) }); data.SITE = s; settingsDialog(); return dlg.querySelector('.madd')?.scrollIntoView({ block: 'center' }); } // 저장을 눌러야 올라가요
      case 'menumv': { const s = readSite(dlg.querySelector('form')), [i, d] = arg.split(',').map(Number), j = i + d; if (j < 0 || j >= s.menus.length) return; [s.menus[i], s.menus[j]] = [s.menus[j], s.menus[i]]; data.SITE = s; return settingsDialog(); }
      case 'menudel': { const s = readSite(dlg.querySelector('form')), m = s.menus[Number(arg)];
        if (data.POSTS.some(p => p.menu === m.id)) return toast('이 메뉴에 글이 있어요 · 글을 먼저 옮기거나 지워 주세요');
        if (!s.menus.some((x, i) => i !== Number(arg) && (x.kind === 'feed' || x.kind === 'cards' || x.kind === 'stream'))) return toast('글이나 카드 메뉴는 하나는 있어야 해요');
        if (m.kind === 'faq' && !confirm('질문 메뉴를 뺄까요? 질문들은 지워지지 않고, 다시 추가하면 그대로 나와요.')) return;
        if (m.kind === 'page' && (m.text || m.linkUrl) && !confirm('"' + m.name + '" 안내를 뺄까요? 안내 글도 같이 없어져요.')) return;
        s.menus.splice(Number(arg), 1); data.SITE = s; return settingsDialog(); }
    }
  });
  $('ownBtn').addEventListener('click', () => { if (!owner()) return loginDialog(); if (!confirm('이 기기에서 주인 로그인을 풀까요?')) return; store.set(LS.tok, null); for (const n of Object.keys(FILES)) store.set('joa_c_' + n, null); st.edit = st.faqEdit = null; render(); });
  $('ownSet').addEventListener('click', settingsDialog);
  // 그림을 고르거나 빼도 쓰던 글이 날아가지 않게: 글 칸 값을 st.edit에 옮겨 두고 다시 그려요
  function keepForm() { const f = main.querySelector('[data-form="post"]'); if (f) Object.assign(st.edit, { icon: f.icon.value, title: f.title.value, body: f.body.value, menu: f.menu.value, date: f.date.value, tags: f.tags.value.split(',').map(x => x.trim()).filter(Boolean) }); render(); }
  const addFiles = list => { const l = [...list].filter(f => f.type.startsWith('image/')); if (!l.length || !st.edit) return false; for (const f of l) st.files.push({ file: f, url: URL.createObjectURL(f) }); keepForm(); return true; };
  document.addEventListener('change', e => { if (e.target.matches('[data-pick]')) addFiles(e.target.files); });
  document.addEventListener('paste', e => { if (addFiles(e.clipboardData?.files || [])) e.preventDefault(); }); // 글 쓰는 중에 Ctrl+V로 그림 붙여넣기
  document.addEventListener('dragover', e => { if (!st.edit) return; e.preventDefault(); main.querySelector('[data-form="post"]')?.classList.add('drag'); });
  document.addEventListener('dragleave', () => main.querySelector('.form.drag')?.classList.remove('drag'));
  document.addEventListener('drop', e => { if (!st.edit) return; e.preventDefault(); addFiles(e.dataTransfer?.files || []); });
  document.addEventListener('input', e => { if (!e.target.matches('[data-find]')) return; st.faqQ = e.target.value; $('qs').innerHTML = faqList(faqPick()); }); // 목록만 다시 그려요(찾기 칸을 다시 그리면 치던 글이 끊겨요)
  document.addEventListener('submit', e => {
    const f = e.target, kind = f.dataset.form; if (!kind) return; e.preventDefault();
    const v = n => (f.elements[n]?.value || '').trim();
    if (kind === 'login') return (async () => { const old = [repo(), tok()]; store.set(LS.repo, v('repo').replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '')); store.set(LS.tok, v('tok'));
      try { const r = await gh(''); if (!r.permissions || !r.permissions.push) throw new Error('이 토큰으로는 쓸 수 없어요(Contents 쓰기 권한이 필요해요)'); dlg.close(); toast('주인으로 들어왔어요'); render(); }
      catch (err) { store.set(LS.repo, old[0] || null); store.set(LS.tok, old[1] || null); toast(err.message); } })();
    if (kind === 'page') { const s = JSON.parse(JSON.stringify(site())), m = s.menus.find(x => x.id === st.pageEdit); if (!m) return;
      Object.assign(m, { icon: v('icon'), name: v('name') || m.name, text: f.elements.text.value.trim(), linkName: v('linkName'), linkUrl: v('linkUrl') });
      if (m.linkUrl && !/^https?:\/\//.test(m.linkUrl)) return toast('버튼 주소는 https:// 로 시작해야 해요');
      return work(async () => { await saveData('SITE', s, '안내 고침: ' + m.name); st.pageEdit = null; }, '저장했어요 · 1분쯤 뒤 모두에게 보여요'); }
    if (kind === 'site') { const s = readSite(f); if (!s.title) return toast('이름을 적어 주세요'); return work(async () => { await saveData('SITE', s, '설정 바꿈'); dlg.close(); }, '저장했어요 · 1분쯤 뒤 모두에게 보여요'); }
    if (kind === 'faq') { const item = { id: st.faqEdit.id || 'f' + Date.now().toString(36), q: v('q'), a: f.elements.a.value.trim(), cat: v('cat'), pin: !!st.faqEdit.pin };
      return work(async () => { const l = st.faqEdit.id ? data.FAQ.map(x => x.id === item.id ? item : x) : [item, ...data.FAQ]; await saveData('FAQ', l, '질문 올림'); st.faqEdit = null; }, '올렸어요 · 1분쯤 뒤 모두에게 보여요'); }
    if (kind === 'post') { keepForm(); const p = st.edit; if (!p.title && !String(p.body || '').trim() && !st.files.length) return toast('글이나 그림 중 하나는 넣어 주세요');
      return work(async () => { const images = []; for (const x of st.files) images.push(typeof x === 'string' ? x : await uploadImage(x.file)); st.files = images; // 중간에 실패해도 이미 올린 그림은 다시 안 올려요
        const item = { id: p.id || 'p' + Date.now().toString(36), menu: p.menu, date: p.date, icon: p.icon, title: p.title, body: p.body, tags: p.tags, images, pin: !!p.pin, ...(p.fixed ? { fixed: p.fixed } : {}), at: p.at || Date.now() }; // at: 올린 시각(피드에 '오후 11:30'처럼) · 고쳐도 처음 시각 그대로
        await saveData('POSTS', p.id ? data.POSTS.map(x => x.id === item.id ? item : x) : [item, ...data.POSTS], '글 올림: ' + (item.title || String(item.body || '').slice(0, 30))); st.edit = null; st.files = []; go('#' + encodeURIComponent(item.menu)); }, '올렸어요 · 1분쯤 뒤 모두에게 보여요'); }
  });
  // 지금 판: 설정에 적은 번호 대신 실제 스크립트의 @version을 보여 줘요(머리 부분만 받고 끊어요 · 못 읽으면 설정의 번호 그대로)
  async function liveVersion() { const u = site().installUrl; if (!u || !window.ReadableStream) return;
    try { const r = await fetch(u, { cache: 'no-store' }), rd = r.body.getReader(), dec = new TextDecoder(); let t = '';
      while (t.length < 4000) { const { done, value } = await rd.read(); if (done) break; t += dec.decode(value, { stream: true }); }
      rd.cancel().catch(() => {}); const m = t.match(/@version\s+([\w.\-]+)/); if (m) { st.ver = m[1]; renderChrome(); } } catch (_) {} }
  liveVersion();
  // 그림 크게 보기: 화면 가득 · 두 번 누르면 두 배로 · ✕나 바깥·Esc로 닫기
  function zoomOpen(src) { const z = document.createElement('div'); z.className = 'zoom'; z.innerHTML = '<button type="button" class="zx" aria-label="닫기">✕</button><div class="zi"><img alt="" draggable="false"></div>'; z.querySelector('img').src = src; document.body.appendChild(z); document.documentElement.style.overflow = 'hidden';
    const close = () => { z.remove(); document.documentElement.style.overflow = ''; removeEventListener('keydown', esc1); }, esc1 = e => { if (e.key === 'Escape') close(); }; addEventListener('keydown', esc1);
    z.addEventListener('click', e => { if (e.target === z || e.target.closest('.zx')) close(); });
    z.querySelector('img').addEventListener('dblclick', e => { z.classList.toggle('big'); e.preventDefault(); });
    z.addEventListener('contextmenu', e => e.preventDefault()); }
  // 그림 주소를 쉽게 못 가져가게: 글 그림에서는 오른쪽 누르기·길게 누르기 메뉴와 끌기를 막아요(개발자 도구까지 막지는 못해요)
  document.addEventListener('contextmenu', e => { if (e.target.matches('main img')) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.matches('main img')) e.preventDefault(); });
  const up = $('up'); addEventListener('scroll', () => { up.hidden = scrollY < 500; }, { passive: true }); up.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  // 화면마다 보던 자리를 기억해요: 글을 열었다가 뒤로 가면 누르기 전 자리로 돌아가요
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  // 주소창은 늘 깨끗하게(joah.vercel.app): 화면 이동은 주소에 #를 붙이지 않고 브라우저 기록에만 남겨요 · 뒤로 가기는 그대로 돼요
  //   예전 #주소(#faq 등)로 들어와도 그 화면으로 열고 주소창에선 지워요
  history.replaceState({ r: route }, '', location.pathname + location.search);
  const seen = {}; let curH = route, curY = 0;
  addEventListener('scroll', () => { curY = scrollY; }, { passive: true });
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); go(a.getAttribute('href')); }, true);
  addEventListener('popstate', e => onRoute(e.state && typeof e.state.r === 'string' ? e.state.r : ''));
  function go(r) { if (r === route) return; history.pushState({ r }, '', location.pathname + location.search); onRoute(r); }
  function onRoute(r) { route = r; seen[curH] = { y: curY, shown: st.shown }; curH = r; st.pageEdit = null;
    const back = seen[curH]; st.shown = back ? back.shown : 10; st.edit = st.faqEdit = null; st.files = []; render();
    const top = $('tabs').getBoundingClientRect().top + scrollY - 64;
    const jump = y => scrollTo({ top: y, behavior: 'instant' }); // 부드럽게 굴러가지 않고 그 자리에 바로
    if (back) jump(back.y); else if (hash().startsWith('p-') || scrollY > top) jump(top); // 처음 여는 글·메뉴는 메뉴 자리부터
  }
  render();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => document.documentElement.classList.remove('wait'));
})();
