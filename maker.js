// 그림 만들기(주인 글쓰기 창에서) · 두 가지
//   소식: 카톡 대화 모양 · 한 줄에 말풍선 하나 ("할 말 | 작은 설명") · 색·프로필·첫 그림·그림 글자를 고를 수 있어요
//   쓰는 법: 설명서 모양 · 제목 · 한 줄 설명 · 단계마다 제목·설명·캡처 그림 · 팁 상자
//   그림은 html2canvas로 찍어요(처음 찍을 때 한 번만 받아요)
(() => {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hexRgb = h => { h = String(h).replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => '#' + hexRgb(a).map((x, i) => Math.round(x + (hexRgb(b)[i] - x) * t).toString(16).padStart(2, '0')).join(''); // a→b로 t만큼
  // 소식 색: 바탕만 고르면 나머지(내 말풍선·버튼·그림 글자색)는 바탕에서 뽑아요
  const NEWS = [
    { name: '보라', bg: '#c9d2e4', acc: '#7b61d9' }, { name: '민트', bg: '#d3e8dc', acc: '#3f9d6b' }, { name: '살구', bg: '#f1dccd', acc: '#d9774a' }, { name: '분홍', bg: '#efd5df', acc: '#d6588a' },
    { name: '하늘', bg: '#cfe0f1', acc: '#3d7fc4' }, { name: '노랑', bg: '#f1e6c2', acc: '#c9971a' }, { name: '라벤더', bg: '#ddd5f0', acc: '#8a5cf0' }, { name: '회색', bg: '#dcdde2', acc: '#5f6070' },
  ];
  const ACCS = ['#7b61d9', '#3f9d6b', '#d9774a', '#d6588a', '#3d7fc4', '#c9971a', '#8a5cf0', '#5f6070'];
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
  .gr { width:780px; padding:58px 30px 30px; background-image:repeating-linear-gradient(45deg, #ffffff66 0 12px, transparent 12px 24px); color:#3a3350; font-family:'Pretendard Variable','Pretendard','Malgun Gothic','Segoe UI Emoji',sans-serif; word-break:keep-all; letter-spacing:-.3px; line-height:normal; }
  .gr * { box-sizing:border-box; margin:0; padding:0; } .gr .cd { position:relative; background:#fffdf7; border:3px solid; border-radius:28px; padding:30px 36px 22px; }
  .gr .chef { position:absolute; right:30px; top:-46px; width:120px; } .gr .hat { position:absolute; left:32px; top:-14px; width:56px; height:44px; z-index:1; } .gr .hat b { position:absolute; top:0; width:26px; height:26px; border-radius:50%; background:#fff; box-shadow:0 0 0 2.5px var(--o); } .gr .hat b:nth-child(1) { left:0; top:6px; } .gr .hat b:nth-child(2) { left:15px; top:-4px; } .gr .hat b:nth-child(3) { left:30px; top:6px; } .gr .hat u { position:absolute; left:4px; top:18px; width:48px; height:22px; border-radius:4px 4px 8px 8px; background:#fff; box-shadow:0 0 0 2.5px var(--o); } /* 요리사 모자 */ .gr .chef img { position:relative; top:16px; width:120px; display:block; }
  .gr .kk { font-size:17px; font-weight:800; } .gr h1 { font-size:38px; font-weight:800; letter-spacing:-1.2px; line-height:1.25; margin:4px 0 6px; max-width:540px; } .gr .lead { font-size:19px; color:#8a8698; line-height:1.5; max-width:540px; }
  .gr .prep { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:16px 0 4px; } .gr .prep span { font-size:15px; font-weight:800; color:#8a8698; margin-right:2px; } .gr .prep i { font-style:normal; border-radius:99px; padding:5px 12px; font-size:16px; font-weight:700; }
  .gr .st { display:flex; gap:14px; align-items:flex-start; padding:14px 0; border-top:2px dotted; margin-top:8px; } .gr .st .e { font-size:30px; line-height:1.1; flex:none; } .gr .sb { flex:1; min-width:0; } .gr .sb b { display:block; font-size:21px; font-weight:800; line-height:1.4; } .gr .sb p { font-size:17px; color:#6b6880; margin-top:3px; line-height:1.55; white-space:pre-wrap; } .gr .ph { position:relative; flex:none; width:230px; background:#fff; padding:8px 8px 22px; border-radius:6px; box-shadow:0 6px 16px #4a42661f; margin:6px 4px 4px 0; } .gr .ph img { display:block; width:100%; border-radius:3px; } .gr .ph i { position:absolute; left:50%; top:-10px; width:70px; height:22px; margin-left:-35px; border-radius:4px; transform:rotate(-5deg); } /* 사진은 옆에 폴라로이드로(글은 왼쪽에 크게) */
  .gr .er { margin-top:10px; border-radius:16px; padding:12px 16px; background:#fff0f3; font-size:17px; line-height:1.6; } .gr .er b { font-weight:800; } .gr .er u { display:block; text-decoration:none; font-weight:800; color:#d0708c; }
  .gr .tips { margin-top:10px; border-radius:16px; padding:12px 16px; font-size:17px; line-height:1.7; color:#4a4860; } .gr .tips b { color:#3a3350; font-weight:800; margin:0 6px 0 4px; } .gr .ft { text-align:right; margin-top:12px; font-size:16px; font-weight:700; }
  .gm { width:780px; padding:26px; background-image:radial-gradient(#ffffff 2.2px, transparent 2.4px); background-size:26px 26px; color:#3a3350; font-family:'Pretendard Variable','Pretendard','Malgun Gothic','Segoe UI Emoji',sans-serif; word-break:keep-all; letter-spacing:-.3px; line-height:normal; }
  .gm * { box-sizing:border-box; margin:0; padding:0; } .gm .cd { position:relative; background:#fff; border-radius:34px; padding:48px 40px 24px; }
  .gm .tape { position:absolute; left:50%; top:10px; width:120px; height:32px; margin-left:-60px; border-radius:6px; transform:rotate(-4deg); } .gm .cat { position:absolute; right:34px; top:30px; width:110px; transform:rotate(8deg); }
  .gm .tg { display:inline-block; color:#fff; font-weight:800; font-size:17px; padding:6px 16px; border-radius:99px; } .gm h1 { font-size:40px; font-weight:800; letter-spacing:-1.2px; line-height:1.25; margin:14px 0 6px; max-width:540px; } .gm .lead { font-size:20px; color:#8a8698; line-height:1.5; max-width:540px; }
  .gm .steps { margin-top:24px; display:flex; flex-direction:column; gap:12px; } .gm .st { display:flex; gap:16px; align-items:flex-start; border:2px dashed; border-radius:22px; padding:18px 22px; }
  .gm .n { flex:none; width:40px; height:40px; border-radius:50%; color:#fff; font-size:20px; font-weight:800; display:flex; align-items:center; justify-content:center; } .gm .sb { flex:1; min-width:0; } .gm .sb b { display:block; font-size:23px; font-weight:800; line-height:1.4; } .gm .sb p { font-size:19px; color:#6b6880; margin-top:4px; line-height:1.55; white-space:pre-wrap; } .gm .sb img { display:block; width:100%; margin-top:14px; border-radius:14px; border:1px solid #ece8f6; }
  .gm .er { margin-top:14px; border-radius:18px; padding:16px 20px; background:#fff6dc; font-size:19px; line-height:1.7; color:#4a4860; } .gm .er b { color:#3a3350; font-weight:800; } .gm .er u { display:block; text-decoration:none; font-weight:800; }
  .gm .tips { margin-top:12px; border-radius:18px; padding:16px 20px; font-size:19px; line-height:1.7; color:#4a4860; } .gm .tips b { color:#3a3350; font-weight:800; margin:0 6px 0 4px; } .gm .ft { text-align:right; margin-top:14px; font-size:17px; font-weight:700; }
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
  /* 노션 카드: 흰 바탕 · 큰 제목 · ✓ 목록 · 아래 상자 */
  .nc { box-sizing:border-box; width:780px; padding:28px; color:#37352f; font-family:'Pretendard Variable','Pretendard','Malgun Gothic','Segoe UI Emoji',sans-serif; word-break:keep-all; letter-spacing:-.3px; line-height:normal; }
  .nc * { box-sizing:border-box; margin:0; padding:0; }
  .nc .pg { background:#fff; border-radius:28px; padding:46px 48px 34px; }
  .nc .ic { font-size:64px; line-height:1; }
  .nc h1 { font-size:42px; font-weight:800; letter-spacing:-1.2px; line-height:1.25; margin-top:18px; }
  .nc .meta { font-size:19px; color:#9b9a97; margin-top:10px; }
  .nc hr { border:0; border-top:2px solid #f1f1ef; margin:26px 0 8px; }
  .nc .it { display:flex; gap:16px; padding:16px 2px; border-bottom:1.5px solid #f6f6f4; }
  .nc .it:last-child { border-bottom:0; }
  .nc .ck { flex:none; width:32px; height:32px; border-radius:9px; color:#fff; font-size:20px; font-weight:800; display:flex; align-items:center; justify-content:center; margin-top:2px; }
  .nc .it b { display:block; font-size:24px; font-weight:700; line-height:1.4; }
  .nc .it span { display:block; font-size:19px; color:#8a8884; margin-top:4px; line-height:1.5; }
  .nc .tip { margin-top:22px; border-radius:16px; padding:18px 22px; font-size:20px; line-height:1.6; }
  .nc .ft { text-align:right; color:#b4b3af; font-size:16px; margin-top:18px; }
  /* 공지: 파스텔 포스터 · 고양이 말풍선 · 이모지 스티커 · 큰 제목 */
  .nt { box-sizing:border-box; position:relative; overflow:hidden; width:780px; min-height:410px; padding:46px 50px 96px; font-family:'Pretendard Variable','Pretendard','Malgun Gothic','Segoe UI Emoji',sans-serif; letter-spacing:-.5px; word-break:keep-all; }
  .nt * { box-sizing:border-box; margin:0; padding:0; }
  .nt > img { position:absolute; }
  .nt .sp { position:absolute; color:#fff; line-height:1; }
  .nt .em { position:absolute; right:196px; bottom:150px; width:96px; height:96px; border-radius:50%; background:#fff; font-size:52px; line-height:1; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 24px #4a426622; }
  .nt.fixed { padding-bottom:132px; } .nt.fixed .ft { bottom:74px; } .nt .fx { position:absolute; left:50px; bottom:30px; display:inline-flex; align-items:center; gap:6px; background:#ffffffcc; border-radius:99px; padding:4px 14px 4px 5px; font-size:15px; font-weight:800; color:#4fa877; white-space:nowrap; } .nt .fx img { width:24px; height:24px; } .nt .fx b { font-size:13px; font-weight:600; color:#8d88a3; margin-left:2px; } /* 수정 완료: 아래 조아메모리 줄 밑에 작게(폰에서 고양이와 안 겹치게) */
  .nt .tx { position:relative; max-width:440px; }
  .nt .tg { display:inline-block; background:#fff; font-weight:800; font-size:21px; padding:9px 20px; border-radius:99px; transform:rotate(-2deg); box-shadow:0 6px 16px #4a426614; }
  .nt h1 { font-size:58px; font-weight:800; letter-spacing:-2.2px; margin:26px 0 14px; color:#3a3350; line-height:1.16; }
  .nt p { font-size:23px; font-weight:500; color:#6f6886; line-height:1.6; white-space:pre-wrap; }
  .nt .ft { position:absolute; left:50px; bottom:38px; display:flex; align-items:center; gap:10px; font-size:18px; font-weight:700; }
  .lk { box-sizing:border-box; position:relative; overflow:hidden; width:780px; min-height:420px; font-family:'Pretendard Variable','Pretendard','Malgun Gothic','Segoe UI Emoji',sans-serif; color:#3a3350; line-height:1.3; }
  .lk * { box-sizing:border-box; margin:0; padding:0; } .lk > img, .lk > i, .lk > .em, .lk > .ft, .lk > .st, .lk > .cc { position:absolute; }
  .lk .tg { display:inline-block; color:#fff; font-weight:800; font-size:20px; padding:7px 18px; border-radius:99px; }
  .lk h1 { font-size:50px; font-weight:800; letter-spacing:-1.8px; margin:18px 0 10px; line-height:1.15; word-break:keep-all; }
  .lk p { font-size:22px; font-weight:500; color:#6f6886; line-height:1.55; white-space:pre-wrap; word-break:keep-all; }
  .lk .ft { font-size:18px; font-weight:700; }
  .lk .em { width:92px; height:92px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:46px; line-height:1; box-shadow:0 8px 20px #4a426618; }
  .lk .st { z-index:2; width:108px; height:108px; border-radius:50%; background:#fff; border:3px dashed #7cc79a; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:20px; font-weight:800; color:#4fa877; transform:rotate(-14deg); box-shadow:0 6px 14px #4a426614; } .lk .st b { font-size:13px; font-weight:600; color:#8d88a3; margin-top:2px; }
  .lk-memo { padding:74px 150px 62px 64px; background-image:radial-gradient(#ffffff 2.2px, transparent 2.4px); background-size:26px 26px; }
  .lk-memo .pad { position:relative; z-index:1; width:560px; min-height:290px; background:#fff; border-radius:34px; padding:38px 40px 34px; transform:rotate(-2deg); } .lk-memo .pad > * { max-width:440px; } .lk-memo .ft { position:static; margin-top:20px; }
  .lk-memo .tape { left:300px; top:52px; width:130px; height:38px; border-radius:6px; transform:rotate(-6deg); z-index:2; } .lk-memo .cat { right:40px; top:30px; width:210px; transform:rotate(12deg); z-index:2; } .lk-memo .em { right:140px; bottom:70px; transform:rotate(8deg); z-index:2; } .lk-memo .st { left:430px; top:30px; }
  .lk-bubble { height:420px; } .lk-bubble .bb { left:52px; top:24px; width:620px; height:420px; } .lk-bubble .bw { left:40px; top:12px; width:620px; height:420px; }
  .lk-bubble .pad { position:absolute; left:150px; top:132px; width:400px; text-align:center; } .lk-bubble h1 { font-size:44px; } .lk-bubble p { font-size:20px; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; }
  .lk-bubble .cat { right:30px; bottom:24px; width:140px; transform:rotate(10deg); } .lk-bubble .em { right:44px; top:40px; } .lk-bubble .ft { left:34px; bottom:26px; } .lk-bubble .st { right:40px; top:150px; }
  .lk-window { padding:46px 120px 70px 60px; background-image:linear-gradient(#ffffff66 1px, transparent 1px), linear-gradient(90deg, #ffffff66 1px, transparent 1px); background-size:30px 30px; }
  .lk-window .pad { position:relative; width:600px; min-height:300px; background:#fff; border-radius:20px; border:3px solid #3a3350; overflow:hidden; }
  .lk-window .bar { height:46px; border-bottom:3px solid #3a3350; display:flex; align-items:center; gap:8px; padding:0 16px; font-weight:800; font-size:17px; } .lk-window .bar i { width:15px; height:15px; border-radius:50%; border:2px solid #3a3350; background:#f2a7b8; } .lk-window .bar i + i { background:#f2cf7a; } .lk-window .bar i + i + i { background:#9fd5a8; } .lk-window .bar span { margin-left:8px; }
  .lk-window .in { padding:26px 34px 30px; } .lk-window .in > * { max-width:440px; } .lk-window .cat { right:26px; bottom:-20px; width:190px; transform:rotate(-8deg); } .lk-window .em { right:40px; top:40px; } .lk-window .ft { left:62px; bottom:24px; color:#3a3350aa !important; } .lk-window .st { right:22px; top:128px; }
  .lk-sign { padding:20px 140px 150px; background-image:linear-gradient(180deg, transparent, #ffffff); text-align:center; }
  .lk-sign .pad { position:relative; z-index:1; background:#fff; border:4px solid; border-radius:26px; padding:24px 30px 28px; box-shadow:0 10px 24px #4a42661a; transform:rotate(-1.5deg); } .lk-sign .pad > p { max-width:430px; margin:0 auto; }
  .lk-sign .cat { left:296px; bottom:-34px; width:190px; } .lk-sign .em { left:50px; bottom:110px; transform:rotate(-12deg); } .lk-sign .ft { right:30px; bottom:24px; } .lk-sign .st { right:40px; top:18px; }
  .lk-sticker { padding:52px 220px 64px 52px; }
  .lk-sticker .pad { position:relative; min-height:296px; border:10px solid #fff; border-radius:60px 60px 60px 18px; padding:34px 40px; box-shadow:0 12px 26px #4a42661c; transform:rotate(-3deg); }
  .lk-sticker .cc { right:40px; top:40px; width:170px; height:170px; border-radius:50%; background:#fff; display:grid; place-items:center; box-shadow:0 8px 18px #4a426618; transform:rotate(8deg); } .lk-sticker .cc img { width:130px; }
  .lk-sticker .em { right:96px; bottom:44px; border-radius:24px; transform:rotate(-10deg); } .lk-sticker .ft { right:34px; top:236px; padding:8px 16px; border-radius:99px; background:#fff; box-shadow:0 6px 14px #4a426614; transform:rotate(6deg); } .lk-sticker .st { left:440px; top:22px; }
  .nt .ft img { width:36px; height:36px; border-radius:11px; } .nt .ft i { font-style:normal; font-weight:500; opacity:.8; margin-left:4px; }
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
  .mkd .nord { justify-self:start; width:auto; margin-left:6px; padding:2px 10px; border-radius:99px; font-size:12px; background:#f1eefb; color:#6b5bd2; } .mkd .kmv { display:inline-flex; align-items:center; gap:6px; padding:4px 6px; border:1px dashed #cfc7ef; border-radius:99px; font-size:13px; } .mkd .kmv i { width:12px; height:12px; border-radius:50%; } .mkd .kmv button { padding:0 6px; background:none; color:#8d88a3; font-size:15px; }
  .mkd .fold { border:1px solid #ebe7f7; border-radius:14px; padding:8px 12px; } .mkd .fold summary { cursor:pointer; font-size:13.5px; font-weight:700; color:#8d88a3; list-style:none; } .mkd .fold summary::after { content:" ▾"; } .mkd .fold[open] summary::after { content:" ▴"; } .mkd .fold[open] summary { margin-bottom:8px; } .mkd .fold label + label { margin-top:10px; }
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
  .mkd .act { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; position:sticky; bottom:-24px; z-index:2; background:#fff; margin:0 -24px -24px; padding:12px 24px 20px; border-top:1px solid #ebe7f7; } /* 닫기·글에 넣기는 늘 창 아래에 보이게 */
  .mkd .pv { background:#f6f4fd; overflow:auto; padding:16px; }
  .mkd .side, .mkd .pv { max-height:calc(100dvh - 24px); } /* 칸이 길어도 창 안에서 내려가게(격자 줄은 내용만큼 커져서 창 밖으로 잘렸음) */
  .mkd .pv .scale { transform-origin:top left; }
  .mkd .hint { font-size:12.5px; color:#9b9a97; font-weight:400; line-height:1.5; }
  .mkd .pvh { display:none; }
  @media (max-width:760px) {
    .mkd { width:100vw; max-width:100vw; height:100dvh; max-height:100dvh; border-radius:0; }
    .mkd .wrap { grid-template-columns:minmax(0, 1fr); height:100dvh; max-height:100dvh; overflow:auto; }
    .mkd .side { overflow:visible; padding:18px 16px 0; } .mkd .side, .mkd .pv { max-height:none; overflow:visible; } /* 폰: 창 하나만 내려가게(미리보기 안에 따로 스크롤이 생기지 않게) */
    .mkd .pv { padding:12px 16px 90px; } .mkd .pvh { display:block; font-size:13.5px; font-weight:700; color:#9b9a97; margin:0 0 8px; }
    .mkd .act { position:fixed; left:0; right:0; bottom:0; z-index:2; margin:0; display:grid; grid-template-columns:1fr 1fr 1.3fr; background:#fffffff2; backdrop-filter:blur(8px); padding:10px 16px calc(10px + env(safe-area-inset-bottom)); border-top:1px solid #ebe7f7; }
    .mkd .act .btn { flex:1; text-align:center; white-space:nowrap; padding-left:8px; padding-right:8px; }
  }`;

  const now = () => { const d = new Date(), h = d.getHours(); return (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const later = t => { const m = t.match(/(\d+):(\d+)$/); if (!m) return t; let mm = +m[2] + 1, hh = +m[1]; if (mm > 59) { mm = 0; hh = hh % 12 + 1; } return t.replace(/\d+:\d+$/, hh + ':' + String(mm).padStart(2, '0')); };
  const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
  const pair = l => { const i = l.indexOf('|'); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; };
  const cardLine = l => { const [a, b] = pair(l), m = a.match(/^(\p{Extended_Pictographic}️?)\s*(.*)$/u); return m ? [m[1], m[2], b] : ['•', a, b]; };

  // 소식: 카톡 대화 모양
  function chatHtml(d) {
    const bg = d.bg, acc = d.acc, t1 = d.time || now(), avbg = mix(bg, '#ffffff', .6), me = mix(bg, '#ffffff', .55);
    const bubbles = lines(d.bubbles).map(pair), cards = lines(d.cards).map(cardLine);
    return `<div class="mk" style="background:${bg}">
      <div class="top"><span class="back">‹</span><h1>${esc(d.head || '조아메모리')}</h1>${d.sub ? `<small>${esc(d.sub)}</small>` : ''}</div>
      <div class="pill"><i>${esc(d.pill || '소식')}</i></div>
      <div class="row"><div class="av" style="background:${avbg}">${d.av ? esc(d.av) : '<img src="img/icon.png" alt="" style="width:100%;height:100%;border-radius:26px">'}</div><div><div class="who">${esc(d.head || '조아메모리')}</div>
        ${bubbles.map(([a, b], i) => `<div class="line${!i ? ' first' : ''}"><div class="b"><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ''}</div>${i === bubbles.length - 1 ? `<div class="t">${t1}</div>` : ''}</div>`).join('')}
      </div></div>
      ${d.me ? `<div class="me"><div class="t">${later(t1)}</div><div class="b" style="background:${me}">${esc(d.me)}</div></div>` : ''}
      ${cards.length ? `<div class="card">${cards.map(([e, a, b]) => `${e}<b>${esc(a)}</b>${esc(b)}`).join('<br>')}</div>` : ''}
      ${d.foot ? `<div class="foot"><i>${esc(d.foot)}</i></div>` : '<div class="nofoot"></div>'}
      <div class="bar"><div>조아메모리${d.ver ? ' ' + esc(d.ver) : ''}</div><u style="background:${acc};color:#fff;font-weight:700">↑</u></div></div>`;
  }
  // 쓰는 법: 카페 설명 그림 모양
  const STEP_COLS = ['#f2a7b8', '#f2cf7a', '#9fd5a8', '#9dbdf0', '#d7a6e8'];
  function guideMemoHtml(d) {
    const col = mix(d.acc, '#ffffff', .25), bg = mix(d.acc, '#ffffff', .86), steps = d.steps.filter(x => x.t || x.p || x.img), tips = lines(d.tips).map(cardLine), errs = lines(d.errs).map(l => l.split('|').map(x => x.trim()));
    return `<div class="gm" style="background-color:${bg}"><div class="cd" style="box-shadow:0 12px 0 ${col}44">
      <i class="tape" style="background:${col}88"></i><img class="cat" alt="" src="${catPng(col, d.gface || '윙크')}">
      <span class="tg" style="background:${col}">📖 쓰는 법</span><h1>${esc(d.title || '제목')}</h1>${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      <div class="steps">${steps.map((x, i) => `<div class="st" style="border-color:${col}66"><div class="n" style="background:${STEP_COLS[i % 5]}">${i + 1}</div><div class="sb">${x.t ? `<b>${esc(x.t)}</b>` : ''}${x.p ? `<p>${esc(x.p)}</p>` : ''}${x.img ? `<img src="${x.img}" alt="">` : ''}</div></div>`).join('')}</div>
      ${errs.map(([a, b, c]) => `<div class="er">⚠️ <b>${esc(a)}</b> ${esc(b || '')}${c ? `<u style="color:${mix(col, '#3a3350', .3)}">→ ${esc(c)}</u>` : ''}</div>`).join('')}
      ${tips.length ? `<div class="tips" style="background:${col}22">${tips.map(([e, a, b]) => `${e}<b>${esc(a)}</b>${esc(b)}`).join('<br>')}</div>` : ''}
      <div class="ft" style="color:${col}">♡ 조아메모리${d.ver ? ' ' + esc(d.ver) : ''}</div></div></div>`;
  }
  const RCP_EMO = ['🥄', '🥣', '🧁', '🍰', '🎂', '🍓'];
  function guideRecipeHtml(d) {
    const col = mix(d.acc, '#ffffff', .25), bg = mix(d.acc, '#ffffff', .86), steps = d.steps.filter(x => x.t || x.p || x.img), tips = lines(d.tips).map(cardLine), errs = lines(d.errs).map(l => l.split('|').map(x => x.trim())), prep = String(d.gprep || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean);
    return `<div class="gr" style="background-color:${bg}"><div class="cd" style="border-color:${col}">
      <div class="chef"><span class="hat" style="--o:${col}66"><b></b><b></b><b></b><u></u></span><img alt="" src="${catPng(col, d.gface || '행복')}"></div>
      <div class="kk" style="color:${mix(col, '#3a3350', .25)}">🍳 조아메모리 레시피</div><h1>${esc(d.title || '제목')}</h1>${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      ${prep.length ? `<div class="prep"><span>준비물</span>${prep.map(x => `<i style="background:${col}22">${esc(x)}</i>`).join('')}</div>` : ''}
      ${steps.map((x, i) => `<div class="st" style="border-color:${col}55"><span class="e">${RCP_EMO[i % RCP_EMO.length]}</span><div class="sb">${x.t ? `<b>${i + 1}. ${esc(x.t)}</b>` : ''}${x.p ? `<p>${esc(x.p)}</p>` : ''}</div>${x.img ? `<div class="ph" style="transform:rotate(${i % 2 ? 3 : -3}deg)"><i style="background:${col}88"></i><img src="${x.img}" alt=""></div>` : ''}</div>`).join('')}
      ${errs.map(([a, b, c]) => `<div class="er">🔥 <b>타면(${esc(a)})</b> ${esc(b || '')}${c ? `<u>→ ${esc(c)}</u>` : ''}</div>`).join('')}
      ${tips.length ? `<div class="tips" style="background:${col}22">${tips.map(([e, a, b]) => `${e}<b>${esc(a)}</b>${esc(b)}`).join('<br>')}</div>` : ''}
      <div class="ft" style="color:${col}">♡ 조아메모리${d.ver ? ' ' + esc(d.ver) : ''}</div></div></div>`;
  }
  function guideHtml(d) {
    if (d.glook === 'memo') return guideMemoHtml(d);
    if (d.glook === 'recipe') return guideRecipeHtml(d);
    const acc = d.acc, stepBg = mix(acc, '#ffffff', .93), tipBg = mix(acc, '#ffffff', .9), steps = d.steps.filter(x => x.t || x.p || x.img), tips = lines(d.tips).map(cardLine), errs = lines(d.errs).map(l => l.split('|').map(x => x.trim()));
    return `<div class="gd"><div class="cd">
      <h1>${esc(d.title || '제목')}</h1>${d.lead ? `<p class="lead">${esc(d.lead)}</p>` : ''}
      <div class="steps">${steps.map((x, i) => `<div class="st" style="background:${stepBg}"><div class="n" style="background:${acc}">${i + 1}</div><div class="sb">${x.t ? `<b>${esc(x.t)}</b>` : ''}${x.p ? `<p>${esc(x.p)}</p>` : ''}${x.img ? `<img src="${x.img}" alt="">` : ''}</div></div>`).join('')}</div>
      ${errs.length ? `<div class="eh"><span>오류에 뜨는 말</span><span>원인 → 고치는 법</span></div>${errs.map(([a, b, c]) => `<div class="er"><div class="tg">${a.split(/\s*·\s*/).filter(Boolean).map(x => `<i>${esc(x)}</i>`).join('')}</div><div class="rs">${esc(b)}${c ? `<u style="color:${acc}">→ ${esc(c)}</u>` : ''}</div></div>`).join('')}` : ''}
      ${tips.length ? `<div class="tips" style="background:${tipBg}">${tips.map(([e, a, b]) => `${e}<b>${esc(a)}</b>${esc(b)}`).join('<br>')}</div>` : ''}
      <div class="ft">조아메모리ෆ${d.ver ? ' ' + esc(d.ver) : ''}</div></div></div>`;
  }
  // 노션 카드 모양
  function cardHtml(d) {
    const acc = d.acc, items = lines(d.citems).map(pair), tips = lines(d.ctip);
    return `<div class="nc" style="background:${mix(acc, '#ffffff', .88)}"><div class="pg">
      ${d.cicon ? `<div class="ic">${esc(d.cicon)}</div>` : ''}<h1>${esc(d.ctitle || '제목')}</h1>${d.csub ? `<p class="meta">${esc(d.csub)}</p>` : ''}
      ${items.length ? '<hr>' + items.map(([a, b]) => `<div class="it"><div class="ck" style="background:${acc}">✓</div><div><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ''}</div></div>`).join('') : ''}
      ${tips.length ? `<div class="tip" style="background:${mix(acc, '#ffffff', .9)}">${tips.map(t => esc(t)).join('<br>')}</div>` : ''}
      <div class="ft">조아메모리ෆ${d.ver ? ' ' + esc(d.ver) : ''}</div></div></div>`;
  }
  const NOTICE = [['긴급 공지', '#e8707c', '#ffdfe3', '🚨'], ['점검 안내', '#e59a4c', '#ffe9cc', '🛠️'], ['업데이트 예고', '#8f7be6', '#e6dffd', '🎁'], ['해결 완료', '#4fb589', '#d6f2e3', '✨'], ['알림', '#5a9bdc', '#d8eafb', '💌'], ['알려진 오류', '#e072a4', '#fddfec', '🐞'], ['권장 사항', '#3a9fae', '#d4eef2', '💡']]; // 글자색 · 파스텔 바탕 · 기본 이모지(칸에서 바꾸거나 지울 수 있어요)
  const NT_ICON = { '긴급 공지': 'pink', '점검 안내': 'peach', '업데이트 예고': '', '해결 완료': 'mint', '알림': 'blue', '알려진 오류': 'pink' };
  const ntIcon = d => (c => c ? `img/icon-${c}.png` : 'img/icon.png')(d.nicon ?? NT_ICON[d.ntag] ?? 'sky');
  const ICONS = ['', 'sky', 'blue', 'mint', 'yellow', 'peach', 'pink']; // img/icon(-색).png
  const ntPal = d => { const p = NOTICE.find(x => x[0] === d.ntag); return d.ncol ? [d.ntag, d.ncol, mix(d.ncol, '#ffffff', .82), p ? p[3] : ''] : p || [d.ntag, d.acc, mix(d.acc, '#ffffff', .8), '']; }; // 종류마다 색 고양이(업데이트 예고는 원래 보라)
  const nowText = () => { const d = new Date(), h = d.getHours(); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]}) · ${h < 12 ? '오전' : '오후'} ${(h % 12) || 12}:${String(d.getMinutes()).padStart(2, '0')}`; };
  // 고양이 말풍선을 PNG로 그려 둬요(SVG 그림은 아이폰에서 그림으로 찍을 때 빠져서) · 색마다 한 번만
  const catCache = {};
  const CAT_PATH = 'M20 30 L25 9 L42 23 H58 L75 9 L80 30 Q91 36 91 51 Q91 76 63 78 H45 L27 93 L29 76 Q9 71 9 51 Q9 36 20 30 Z';
  const FACES = (() => { // 100×100 판 위에 흰 선·점으로
    const st = x => { x.strokeStyle = '#fff'; x.lineWidth = 3; x.lineCap = 'round'; x.stroke(); };
    const dot = (x, cx, cy, r = 4.2) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
    const arc = (x, cx, cy) => { x.beginPath(); x.moveTo(cx - 5, cy + 1); x.quadraticCurveTo(cx, cy - 5, cx + 5, cy + 1); st(x); };
    const bar = (x, cx, cy) => { x.beginPath(); x.moveTo(cx - 5, cy); x.lineTo(cx + 5, cy); st(x); };
    const smile = (x, big) => { x.beginPath(); x.moveTo(45, 55); x.quadraticCurveTo(50, big ? 63 : 60, 55, 55); st(x); };
    const heart = (x, cx, cy) => { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(cx, cy + 5); x.bezierCurveTo(cx - 8, cy - 1, cx - 4, cy - 7, cx, cy - 3); x.bezierCurveTo(cx + 4, cy - 7, cx + 8, cy - 1, cx, cy + 5); x.fill(); };
    const star = (x, cx, cy) => { x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 2 : 6, a = i * Math.PI / 4; x.lineTo(cx + r * Math.sin(a), cy - r * Math.cos(a)); } x.fill(); };
    const blob = (x, cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
    return { '기본': x => { dot(x, 38, 48); dot(x, 62, 48); smile(x); }, '윙크': x => { dot(x, 38, 48); arc(x, 62, 49); smile(x); }, '행복': x => { arc(x, 38, 49); arc(x, 62, 49); smile(x, true); },
      '하트눈': x => { heart(x, 38, 48); heart(x, 62, 48); smile(x); }, '반짝': x => { star(x, 38, 48); star(x, 62, 48); smile(x, true); }, '놀람': x => { dot(x, 38, 47, 5); dot(x, 62, 47, 5); blob(x, 50, 58, 3.4, 4.2, '#fff'); },
      '졸림': x => { bar(x, 38, 49); bar(x, 62, 49); blob(x, 50, 57, 2.4, 2.4, '#fff'); }, '메롱': x => { arc(x, 38, 49); dot(x, 62, 48); smile(x); blob(x, 52, 60, 3.6, 4.4, '#ff8fab'); },
      '울먹': x => { dot(x, 38, 48, 4.6); dot(x, 62, 48, 4.6); blob(x, 36, 56, 2, 3.2, '#bfe3ff'); x.beginPath(); x.moveTo(45, 58); x.quadraticCurveTo(50, 54, 55, 58); st(x); } };
  })();
  const catPng = (c, face = '기본') => catCache[c + face] || (catCache[c + face] = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 800; const x = cv.getContext('2d'); x.scale(8, 8);
    x.fillStyle = c; x.fill(new Path2D(CAT_PATH)); if (!face) return cv.toDataURL('image/png');
    x.fillStyle = '#ffb3c7'; for (const cx of [28, 72]) { x.beginPath(); x.ellipse(cx, 57, 5.5, 3.4, 0, 0, 7); x.fill(); }
    (FACES[face] || FACES['기본'])(x); return cv.toDataURL('image/png'); })());
  // 포스터 말고 다른 모양들(메모지·말풍선·창·팻말·스티커) · 알림판에선 화면에 바로 그리고, 그림 받기는 html2canvas로 찍어요
  const LOOKS = [['poster', '🖼️ 포스터'], ['memo', '📝 메모지'], ['bubble', '💬 말풍선'], ['window', '🪟 창'], ['sign', '🪧 팻말'], ['sticker', '🌟 스티커']];
  const NT_FACE = { '알려진 오류': '울먹', '긴급 공지': '놀람', '해결 완료': '반짝', '권장 사항': '윙크', '업데이트 예고': '행복', '점검 안내': '졸림', '알림': '기본' };
  const LOOK_FACE = { memo: '기본', bubble: '행복', window: '윙크', sign: '반짝', sticker: '기본' };
  const ntFace = d => d.nface || (d.nlook && d.nlook !== 'poster' ? NT_FACE[d.ntag] || LOOK_FACE[d.nlook] : '기본');
  const shortWhen = w => (m => m ? `${m[1]}월 ${m[2]}일` : '')(String(w || '').match(/(\d+)월 (\d+)일/));
  function lookHtml(d) { const [, col0, bg, emo] = ntPal(d), e = d.nemo == null ? emo : d.nemo, col = d.ncol || mix(col0, '#ffffff', .22), face = ntFace(d), L = d.nlook;
    const tg = `<span class="tg" style="background:${col}">${esc(d.ntag || '공지')}</span>`, h1 = `<h1>${esc(d.ntitle || '제목')}</h1>`, p = d.nsub ? `<p>${esc(d.nsub)}</p>` : '', when = shortWhen(d.nwhen);
    const ft = `<div class="ft" style="color:${col}">♡ 조아메모리${when ? ' · ' + when : ''}</div>`;
    const fx = d.fixed ? `<div class="st">고쳤어요!<b>${d.fixedVer ? esc(d.fixedVer) + ' · ' : ''}${esc((f => +f[1] + '.' + +f[2])(String(d.fixed).split('-')))}</b></div>` : '';
    const em = e ? `<span class="em">${esc(e)}</span>` : '', cat = `<img class="cat" alt="" src="${catPng(col, face)}">`;
    const body = {
      memo: `<i class="tape" style="background:${col}88"></i><div class="pad" style="box-shadow:0 14px 0 ${col}55,0 18px 40px #4a426618">${tg}${h1}${p}${ft}</div>${cat}${em}`,
      bubble: `<img class="bb" alt="" src="${catPng(mix(col, '#ffffff', .55), '')}"><img class="bw" alt="" src="${catPng('#ffffff', '')}"><div class="pad">${tg}${h1}${p}</div>${cat}${em}${ft}`,
      window: `<div class="pad" style="box-shadow:10px 10px 0 ${col}"><div class="bar" style="background:${col}55"><i></i><i></i><i></i><span>joamemory.txt</span></div><div class="in">${tg}${h1}${p}</div></div>${cat}${em}${ft}`,
      sign: `<div class="pad" style="border-color:${col}">${tg}${h1}${p}</div>${cat}${em}${ft}`,
      sticker: `<div class="pad" style="background:${mix(col, '#ffffff', .78)}">${tg}${h1}${p}</div><div class="cc">${cat}</div>${em}${ft}`,
    }[L];
    return `<div class="lk lk-${L}" style="background-color:${bg}">${body}${fx}</div>`; }
  function noticeHtml(d) { if (d.nlook && d.nlook !== 'poster' && LOOK_FACE[d.nlook]) return lookHtml(d); const [, col, bg, emo] = ntPal(d), e = d.nemo == null ? emo : d.nemo;
    const cat = (c, s) => `<img style="${s}" alt="" src="${catPng(c)}">`;
    const pals = ['#b7a6f2', '#f7b8cf', '#a9d3ee', '#f6d48a', '#a8dcc0'].filter(c => mix(c, col, .5) !== c), k = Math.max(0, NOTICE.findIndex(x => x[0] === d.ntag));
    return `<div class="nt${d.fixed ? ' fixed' : ''}" style="background:linear-gradient(140deg,${bg},${mix(bg, '#ffffff', .45)})">
      <span class="sp" style="left:392px;top:36px;font-size:30px">✦</span><span class="sp" style="left:560px;top:150px;font-size:20px">✦</span><span class="sp" style="left:330px;top:318px;font-size:22px">✦</span><span class="sp" style="left:716px;top:60px;font-size:16px">✦</span>
      ${cat(pals[k % pals.length], 'right:226px;top:40px;width:64px;transform:rotate(-12deg)') + cat(pals[(k + 2) % pals.length], 'right:34px;top:26px;width:86px;transform:rotate(10deg)')}
      <img style="right:22px;bottom:-34px;width:250px;transform:rotate(-7deg)" alt="" src="${catPng(mix(col, '#ffffff', .28), ntFace(d))}">
      ${e ? `<span class="em">${esc(e)}</span>` : ''}
      <div class="tx"><span class="tg" style="color:${col}">${esc(d.ntag || '공지')}</span>
      <h1>${esc(d.ntitle || '제목')}</h1>${d.nsub ? `<p>${esc(d.nsub)}</p>` : ''}</div>
      <div class="ft" style="color:${mix(col, '#4a4266', .45)}"><img src="${ntIcon(d)}" alt="">조아메모리${d.nwhen ? `<i>${esc(d.nwhen)}</i>` : ''}</div>${d.fixed ? `<span class="fx"><img src="${catPng('#8fd3b0')}" alt="">고쳤어요!<b>${d.fixedVer ? esc(d.fixedVer) + ' · ' : ''}${esc((f => +f[1] + '.' + +f[2])(String(d.fixed).split('-')))}</b></span>` : ''}</div>`; }
  // 공지 그림은 화면을 찍지 않고 캔버스에 바로 그려요(html2canvas는 흐림·그림자·SVG를 번지게 그려서) · 미리보기(noticeHtml)와 같은 자리·색
  async function noticeCanvas(d, S = 3) {
    const [, col, bg, emo] = ntPal(d), e = d.nemo == null ? emo : d.nemo;
    const pals = ['#b7a6f2', '#f7b8cf', '#a9d3ee', '#f6d48a', '#a8dcc0'].filter(c => mix(c, col, .5) !== c), k = Math.max(0, NOTICE.findIndex(x => x[0] === d.ntag));
    const W = 780, F = "'Pretendard Variable','Pretendard','Malgun Gothic',sans-serif", cv = document.createElement('canvas'), x = cv.getContext('2d');
    const font = (w, s) => { x.font = `${w} ${s}px ${F}`; };
    const wrap = (t, max) => { const out = []; for (const para of String(t).split('\n')) { let line = '';
      for (const w of para.split(/(\s+)/)) { const tryL = line + w; if (x.measureText(tryL.trimEnd()).width <= max || !line.trim()) { line = tryL; continue; } out.push(line.trimEnd()); line = w.trimStart(); }
      // 한 낱말이 칸보다 길면 글자로 나눠요
      while (x.measureText(line).width > max) { let n = line.length; while (n > 1 && x.measureText(line.slice(0, n)).width > max) n--; out.push(line.slice(0, n)); line = line.slice(n); }
      out.push(line.trimEnd()); } return out; };
    const TX = 50, TW = 440;
    font(800, 58); const tl = wrap(d.ntitle || '제목', TW); font(500, 23); const sl = d.nsub ? wrap(d.nsub, TW) : [];
    const H = Math.max(410, 46 + 39 + 26 + tl.length * 67 + 14 + sl.length * 37 + 96);
    cv.width = W * S; cv.height = H * S; x.scale(S, S); x.textBaseline = 'alphabetic';
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, bg); g.addColorStop(1, mix(bg, '#ffffff', .45)); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff'; for (const [l, t, s] of [[392, 36, 30], [560, 150, 20], [330, 318, 22], [716, 60, 16]]) { font(400, s); x.fillText('✦', l, t + s * .85); }
    const img = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
    const cat = async (c, cx, cy, w, deg, fc) => { const i = await img(catPng(c, fc)); if (!i) return; x.save(); x.translate(cx, cy); x.rotate(deg * Math.PI / 180); x.drawImage(i, -w / 2, -w / 2, w, w); x.restore(); };
    await cat(pals[k % pals.length], W - 226 - 32, 40 + 32, 64, -12); await cat(pals[(k + 2) % pals.length], W - 34 - 43, 26 + 43, 86, 10);
    await cat(mix(col, '#ffffff', .28), W - 22 - 125, H + 34 - 125, 250, -7, ntFace(d));
    if (e) { const cx = W - 196 - 48, cy = H - 150 - 48; x.save(); x.shadowColor = '#4a426622'; x.shadowBlur = 24; x.shadowOffsetY = 10; x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cy, 48, 0, 7); x.fill(); x.restore();
      font(400, 52); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, cx, cy + 2); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; }
    // 종류 알약(살짝 기울임)
    font(800, 21); const tag = d.ntag || '공지', tw = x.measureText(tag).width + 40; x.save(); x.translate(TX, 46); x.rotate(-2 * Math.PI / 180);
    x.save(); x.shadowColor = '#4a426614'; x.shadowBlur = 16; x.shadowOffsetY = 6; x.fillStyle = '#fff'; x.beginPath(); x.roundRect(0, 0, tw, 39, 19.5); x.fill(); x.restore();
    x.fillStyle = col; x.fillText(tag, 20, 27); x.restore();
    let y = 46 + 39 + 26; font(800, 58); x.fillStyle = '#3a3350'; for (const l of tl) { x.fillText(l, TX, y + 52); y += 67; }
    y += 14; font(500, 23); x.fillStyle = '#6f6886'; for (const l of sl) { x.fillText(l, TX, y + 26); y += 37; }
    // 아래: 아이콘 · 조아메모리 · 날짜
    const ic = await img(ntIcon(d)), fy = H - 38 - 36; if (ic) { x.save(); x.beginPath(); x.roundRect(TX, fy, 36, 36, 11); x.clip(); x.drawImage(ic, TX, fy, 36, 36); x.restore(); }
    x.fillStyle = mix(col, '#4a4266', .45); font(700, 18); x.fillText('조아메모리', TX + 46, fy + 24);
    if (d.nwhen) { const wx = TX + 46 + x.measureText('조아메모리').width + 14; font(500, 18); x.globalAlpha = .8; x.fillText(d.nwhen, wx, fy + 24); x.globalAlpha = 1; }
    return new Promise((ok, no) => cv.toBlob(b => b ? ok(b) : no(new Error('그림을 못 만들었어요')), 'image/png'));
  }
  const pageHtml = d => d.style === 'notice' ? noticeHtml(d) : d.style === 'card' ? cardHtml(d) : d.kind === 'guide' ? guideHtml(d) : chatHtml(d);

  let h2c = null; // html2canvas는 처음 그림을 찍을 때 한 번만 받아요
  const loadH2C = () => h2c || (h2c = new Promise((ok, no) => { if (window.html2canvas) return ok(window.html2canvas); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload = () => ok(window.html2canvas); s.onerror = () => { h2c = null; no(new Error('그림 도구를 못 받았어요 · 인터넷 연결을 확인해 주세요')); }; document.head.appendChild(s); }));
  async function shoot(d) {
    if (d.style === 'notice' && !(d.nlook && d.nlook !== 'poster')) { if (document.fonts) { await document.fonts.load("800 58px 'Pretendard Variable'", (d.ntitle || '') + (d.ntag || '')); await document.fonts.load("500 23px 'Pretendard Variable'", (d.nsub || '') + '조아메모리' + (d.nwhen || '')); await document.fonts.ready; } return noticeCanvas(d); }
    const H = await loadH2C(), box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:-10000px;top:0;'; box.innerHTML = pageHtml(d); document.body.appendChild(box);
    try { if (document.fonts) { await document.fonts.load("25px 'Jua'"); await document.fonts.load("25px 'Gowun Dodum'"); await document.fonts.load("800 25px 'Pretendard Variable'", box.textContent); await document.fonts.ready; }
      await Promise.all([...box.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
      const c = await H(box.firstElementChild, { scale: 3, backgroundColor: null, useCORS: true, logging: false });
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
      <label>색<div class="sw">${NEWS.map((t, i) => `<button type="button" data-preset="${i}" aria-pressed="${d.bg === t.bg}"><i style="background:${t.bg}"></i>${t.name}</button>`).join('')}<input type="color" class="cpick" data-k="bg" value="${d.bg}" title="바탕색 직접 고르기"></div></label>
      <div class="two"><label>위 제목<input data-k="head" value="${esc(d.head)}" placeholder="조아메모리"></label><label>제목 옆 작은 글씨 (안 써도 돼요)<input data-k="sub" value="${esc(d.sub)}" placeholder="업데이트"></label></div>
      <label>프로필 이모지 (비우면 조아메모리 아이콘)<input data-k="av" maxlength="4" value="${esc(d.av)}" placeholder="비워 두면 아이콘"></label>
      <div class="two"><label>날짜 줄<input data-k="pill" value="${esc(d.pill)}"></label><label>판 번호<input data-k="ver" value="${esc(d.ver)}" placeholder="5.8.48"></label></div>
      <label>말풍선 (한 줄에 하나 · 작은 설명은 | 뒤에)<textarea data-k="bubbles" placeholder="장기기억, 한 번에 지워 줄게. | 설정 › 편의 · 웹 모드&#10;굳은 문장, 더 꼼꼼히 찾을게. | 문장 꼴 · 버릇 말까지&#10;(이모지는 원하는 곳에 직접 넣어요)">${esc(d.bubbles)}</textarea><span class="hint">말하듯 짧게, 한 줄에 한 가지만 쓰면 예뻐요. 6~7줄이 알맞아요.</span></label>
      <label>내 말풍선 (오른쪽 · 안 써도 돼요)<input data-k="me" value="${esc(d.me)}"></label>
      <label>아래 상자 (한 줄에 하나 · 이모지 이름 | 내용)<textarea data-k="cards" style="min-height:80px" placeholder="🔧 그 밖에 | ETC용 모델 고르기&#10;🐛 고친 것 | 그 외 오류 수정">${esc(d.cards)}</textarea></label>
      <label>맨 아래 한마디 (안 써도 돼요)<input data-k="foot" value="${esc(d.foot)}" placeholder="* 지운 카드는 못 되돌려요 🥹"></label>`;
  // 쓰는 법 칸들
  const guideForm = d => `
      <label>모양<div class="sw"><button type="button" data-glook="" aria-pressed="${d.glook !== 'memo'}">📄 기본</button><button type="button" data-glook="memo" aria-pressed="${d.glook === 'memo'}">📝 메모지</button><button type="button" data-glook="recipe" aria-pressed="${d.glook === 'recipe'}">🍳 레시피</button></div></label>
      ${d.glook === 'recipe' ? `<label>준비물 (쉼표로 나눠요 · 안 써도 돼요)<input data-k="gprep" value="${esc(d.gprep || '')}" placeholder="🔑 구글 계정, 🧁 Firebase 프로젝트, ⏱️ 5분"></label>` : ''}
      ${d.glook === 'memo' || d.glook === 'recipe' ? `<label>고양이 얼굴<div class="sw">${Object.keys(FACES).map(f => `<button type="button" data-gface="${f}" aria-pressed="${(d.gface || (d.glook === 'recipe' ? '행복' : '윙크')) === f}" title="${f}" style="padding:3px"><img src="${catPng(mix(d.acc, '#ffffff', .25), f)}" alt="${f}" style="width:30px;height:30px;display:block"></button>`).join('')}</div></label>` : ''}
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

  const cardForm = d => `
      <label>색<div class="sw">${ACCS.map(c => `<button type="button" data-acc="${c}" aria-pressed="${d.acc === c}" style="padding:4px"><i style="background:${c};width:24px;height:24px"></i></button>`).join('')}<input type="color" class="cpick" data-k="acc" value="${d.acc}" title="색 직접 고르기"></div></label>
      <div class="two"><label>맨 위 이모지 (안 써도 돼요)<input data-k="cicon" maxlength="4" value="${esc(d.cicon)}"></label><label>판 번호 (안 써도 돼요)<input data-k="ver" value="${esc(d.ver)}" placeholder="5.8.48"></label></div>
      <label>제목<input data-k="ctitle" value="${esc(d.ctitle)}" placeholder="5.8.48 업데이트"></label>
      <label>제목 아래 작은 글씨 (안 써도 돼요)<input data-k="csub" value="${esc(d.csub)}" placeholder="11월 21일 · 조아메모리"></label>
      <label>목록 (한 줄에 하나 · 작은 설명은 | 뒤에)<textarea data-k="citems" placeholder="장기기억 한 번에 지우기 | 설정 › 편의 · 웹 모드&#10;굳은 문장 더 꼼꼼히 찾기&#10;테마 색 파스텔 추가">${esc(d.citems)}</textarea></label>
      <label>아래 상자 (안 써도 돼요)<textarea data-k="ctip" style="min-height:70px" placeholder="💡 새 모델이 안 보이면 모델 새로고침">${esc(d.ctip)}</textarea></label>`;
  const PASTEL = ['#f2a7b8', '#f0a6c9', '#f5b38a', '#f2cf7a', '#a9c7a0', '#9fd5a8', '#8fcfd8', '#9dbdf0', '#b8a6f0', '#d7a6e8'];
  const kindList = () => { const L = store.get() || {}, o = L.order || [], at = n => (o.indexOf(n) + 1) || 999;
    return [...NOTICE.map(([n, c]) => ({ n, c })), ...(L.kinds || []).filter(k => !NOTICE.some(x => x[0] === k.n)).map(k => ({ ...k, saved: true }))].sort((a, b) => at(a.n) - at(b.n)); }; // shortcut: 순서는 이 기기에만, 여러 기기면 사이트 설정으로
  const noticeForm = d => `
      <label>모양<div class="sw">${LOOKS.map(([k, n]) => `<button type="button" data-nlook="${k}" aria-pressed="${(d.nlook || 'poster') === k}">${n}</button>`).join('')}</div></label>
      <label>종류 <button type="button" class="nord" data-nord aria-pressed="${!!d.nord}">${d.nord ? '다 했어요' : '순서 바꾸기'}</button><div class="sw">${kindList().map(k => d.nord
        ? `<span class="kmv"><button type="button" data-mv="${esc(k.n)},-1" aria-label="앞으로">‹</button><i style="background:${esc(k.c)}"></i>${esc(k.n)}<button type="button" data-mv="${esc(k.n)},1" aria-label="뒤로">›</button>${k.saved ? `<button type="button" data-kdel="${esc(k.n)}" aria-label="지우기">×</button>` : ''}</span>`
        : k.saved ? `<button type="button" data-ntag="${esc(k.n)}" data-c="${esc(k.c)}" data-i="${esc(k.i ?? '')}" aria-pressed="${d.ntag === k.n && d.ncol === k.c}"><i style="background:${esc(k.c)}"></i>${esc(k.n)}</button>`
        : `<button type="button" data-ntag="${k.n}" aria-pressed="${d.ntag === k.n && !d.ncol}"><i style="background:${k.c}"></i>${k.n}</button>`).join('')}</div></label>
      <label>종류 이름 (직접 써도 돼요)<input data-k="ntag" value="${esc(d.ntag)}" maxlength="12"></label>
      <label>종류 색<div class="sw">${PASTEL.map(c => `<button type="button" data-ncol="${c}" aria-pressed="${d.ncol === c}" style="padding:4px"><i style="background:${c};width:24px;height:24px"></i></button>`).join('')}<input type="color" class="cpick" data-k="ncol" value="${ntPal(d)[1]}" title="색 직접 고르기"></div></label>
      <details class="fold"${d.nopen ? ' open' : ''}><summary>😺 고양이 얼굴 · 아래 아이콘</summary>
      <label>고양이 얼굴<div class="sw">${Object.keys(FACES).map(f => `<button type="button" data-nface="${f}" aria-pressed="${ntFace(d) === f}" title="${f}" style="padding:3px"><img src="${catPng(d.ncol || mix(ntPal(d)[1], '#ffffff', .22), f)}" alt="${f}" style="width:30px;height:30px;display:block"></button>`).join('')}</div></label>
      <label>아래 아이콘<div class="sw">${ICONS.map(c => `<button type="button" data-nicon="${c}" aria-pressed="${ntIcon(d).endsWith((c ? '-' + c : '/icon') + '.png')}" style="padding:3px"><img src="img/icon${c ? '-' + c : ''}.png" alt="" style="width:26px;height:26px;border-radius:8px;display:block"></button>`).join('')}</div></label></details>
      <label>날짜·시간 (안 써도 돼요)<input data-k="nwhen" value="${esc(d.nwhen)}"><button type="button" class="add" data-nnow style="padding:6px;margin-top:4px">지금 시각으로</button></label>
      <label>이모지 (바꾸거나 지워도 돼요)<input data-k="nemo" value="${esc(d.nemo == null ? (NOTICE.find(x => x[0] === d.ntag) || [])[3] || '' : d.nemo)}" maxlength="4"></label>
      <label>제목<input data-k="ntitle" value="${esc(d.ntitle)}" placeholder="꼭 확인해 주세요"></label>
      <label>설명 (안 써도 돼요)<textarea data-k="nsub" style="min-height:70px" placeholder="조아메모리 사용에 영향을 주는 중요한 소식이에요">${esc(d.nsub)}</textarea></label>`;
  const styleBar = (d, kind) => `<div class="sw" style="margin:-4px 0 4px"><button type="button" data-style="base" aria-pressed="${d.style === 'base'}" style="padding:5px 14px">${kind === 'guide' ? '설명서' : '카톡'} 모양</button><button type="button" data-style="card" aria-pressed="${d.style === 'card'}" style="padding:5px 14px">노션 카드</button><button type="button" data-style="notice" aria-pressed="${d.style === 'notice'}" style="padding:5px 14px">공지</button></div>`;
  // open({ version, date, kind }, done({ file, title, body, icon, tags }))
  function open(opt, done) {
    init(); const last = store.get() || {}, dt = String(opt.date || '').split('-').map(Number), kind = opt.kind === 'guide' ? 'guide' : 'news';
    const P = NEWS[((last.preset ?? NEWS.length - 1) + 1) % NEWS.length]; // 소식 색은 지난번 다음 색부터
    const d = { kind, ver: opt.version || '', time: now(),
      bg: P.bg, acc: P.acc, av: '', pill: dt[1] ? `${dt[1]}월 ${dt[2]}일 소식` : '소식', head: '조아메모리', sub: '업데이트', bubbles: '', me: '', cards: '', foot: '',
      title: '', lead: '', steps: [{ t: '', p: '', img: '' }, { t: '', p: '', img: '' }], tips: '', errs: '',
      style: ['card', 'notice'].includes(last.style) ? last.style : 'base', ntag: '긴급 공지', nwhen: nowText(), ntitle: '', nsub: '', cicon: '', ctitle: opt.version ? opt.version + ' 업데이트' : '', csub: dt[1] ? `${dt[1]}월 ${dt[2]}일 · 조아메모리` : '조아메모리', citems: '', ctip: '' };
    if (opt.spec) Object.assign(d, opt.spec); // 올린 그림 다시 고치기: 그때 칸 값 그대로
    const fin = res => done && done({ ...res, spec: (t => t.length < 20000 ? JSON.parse(t) : null)(JSON.stringify({ ...d, time: undefined })) }); // 칸 값도 같이 넘겨 글에 저장(나중에 다시 고치려고 · 그림 넣은 쓰는 법처럼 큰 건 빼요)
    if (kind === 'guide' || d.style === 'card') d.acc = last.gacc || ACCS[0];
    const dlg = document.createElement('dialog'); dlg.className = 'mkd'; document.body.appendChild(dlg);
    const paint = () => { dlg.innerHTML = `<div class="wrap"><div class="side" tabindex="-1"><h3>🎨 ${kind === 'guide' ? '쓰는 법' : '소식'} 그림 만들기</h3>${styleBar(d, kind)}${d.style === 'notice' ? noticeForm(d) : d.style === 'card' ? cardForm(d) : kind === 'guide' ? guideForm(d) : newsForm(d)}
      <div class="act"><button type="button" class="btn ghost" data-mk="close">닫기</button><button type="button" class="btn ghost" data-mk="save">그림 받기</button><button type="button" class="btn" data-mk="use">글에 넣기</button></div>
    </div><div class="pv"><p class="pvh">미리보기</p><div class="scale"></div></div></div>`; draw(); };
    const draw = () => { const pv = dlg.querySelector('.scale'); if (!pv) return; pv.innerHTML = pageHtml(d); const w = dlg.querySelector('.pv').clientWidth - 32, s = Math.min(1, w / 780); pv.style.transform = `scale(${s})`; pv.style.width = (780 * s) + 'px';
      const fit = () => { pv.style.height = (pv.firstElementChild.offsetHeight * s) + 'px'; }; fit(); pv.querySelectorAll('img').forEach(i => i.addEventListener('load', fit, { once: true })); };
    const repaint = () => { const y = dlg.querySelector('.side')?.scrollTop || 0, wy = dlg.querySelector('.wrap')?.scrollTop || 0; paint(); const sd = dlg.querySelector('.side'), wr = dlg.querySelector('.wrap'); if (sd) sd.scrollTop = y; if (wr) wr.scrollTop = wy; };
    dlg.addEventListener('input', e => { const t = e.target, k = t.dataset.k, sk = t.dataset.sk;
      if (k) { d[k] = t.value; if (k === 'bg') { d.acc = mix(t.value, '#000000', .45); dlg.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', 'false')); } if (k === 'ncol') dlg.querySelectorAll('[data-ntag]').forEach(b => b.setAttribute('aria-pressed', 'false')); if (k === 'acc') dlg.querySelectorAll('[data-acc]').forEach(b => b.setAttribute('aria-pressed', 'false')); draw(); }
      else if (sk) { d.steps[+t.dataset.i][sk] = t.value; draw(); } });
    dlg.addEventListener('change', e => { const t = e.target; if (!t.dataset.shot) return; const f = t.files && t.files[0]; if (!f) return; const i = +t.dataset.shot;
      const r = new FileReader(); r.onload = () => { d.steps[i].img = r.result; repaint(); }; r.readAsDataURL(f); }); // 단계 그림은 데이터로 넣어 둬요(그림으로 찍을 때 그대로 들어가게)
    const busy = on => dlg.querySelectorAll('[data-mk]').forEach(b => { b.disabled = on; });
    dlg.addEventListener('click', async e => {
      const g = s => e.target.closest(s);
      if (g('[data-ntag]')) { const b = g('[data-ntag]').dataset; d.ntag = b.ntag; d.ncol = b.c || ''; if (b.i == null) delete d.nicon; else d.nicon = b.i; return repaint(); }
      if (g('[data-nord]')) { e.preventDefault(); d.nord = !d.nord; return repaint(); }
      if (g('[data-mv]')) { e.preventDefault(); const [n, dir] = g('[data-mv]').dataset.mv.split(','), L = kindList().map(k => k.n), i = L.indexOf(n), j = i + Number(dir); if (j >= 0 && j < L.length) { [L[i], L[j]] = [L[j], L[i]]; last.order = L; store.set(last); } return repaint(); }
      if (g('[data-kdel]')) { e.preventDefault(); const n = g('[data-kdel]').dataset.kdel; last.kinds = (last.kinds || []).filter(k => k.n !== n); store.set(last); return repaint(); }
      if (g('[data-glook]')) { d.glook = g('[data-glook]').dataset.glook; return repaint(); }
      if (g('[data-gface]')) { d.gface = g('[data-gface]').dataset.gface; return repaint(); }
      if (g('[data-nlook]')) { d.nlook = g('[data-nlook]').dataset.nlook; return repaint(); }
      if (g('[data-nface]')) { d.nface = g('[data-nface]').dataset.nface; d.nopen = true; return repaint(); }
      if (g('[data-ncol]')) { d.ncol = g('[data-ncol]').dataset.ncol; return repaint(); }
      if (g('[data-nicon]')) { d.nicon = g('[data-nicon]').dataset.nicon; d.nopen = true; return repaint(); }
      if (g('[data-nnow]')) { d.nwhen = nowText(); return repaint(); }
      if (g('[data-style]')) { d.style = g('[data-style]').dataset.style; if (kind === 'news') d.acc = d.style === 'card' ? (last.gacc || ACCS[0]) : (NEWS.find(t => t.bg === d.bg) || NEWS[0]).acc; return repaint(); }
      if (g('[data-preset]')) { const t = NEWS[+g('[data-preset]').dataset.preset]; Object.assign(d, { bg: t.bg, acc: t.acc }); d.preset = +g('[data-preset]').dataset.preset; return repaint(); }
      if (g('[data-acc]')) { d.acc = g('[data-acc]').dataset.acc; return repaint(); }
      if (g('[data-addstep]')) { d.steps.push({ t: '', p: '', img: '' }); repaint(); return dlg.querySelector('.add')?.scrollIntoView({ block: 'center' }); }
      if (g('[data-delstep]')) { d.steps.splice(+g('[data-delstep]').dataset.delstep, 1); return repaint(); }
      if (g('[data-pickshot]')) return dlg.querySelector(`[data-shot="${g('[data-pickshot]').dataset.pickshot}"]`).click();
      if (g('[data-rmshot]')) { d.steps[+g('[data-rmshot]').dataset.rmshot].img = ''; return repaint(); }
      const mk = g('[data-mk]')?.dataset.mk; if (!mk) return; if (mk === 'close') return dlg.close();
      if (d.style === 'card' && !d.ctitle.trim()) return alert('제목을 써 주세요');
      if (d.style === 'notice' && !d.ntitle.trim()) return alert('제목을 써 주세요');
      if (d.style === 'base' && kind === 'news' && !lines(d.bubbles).length) return alert('말풍선을 한 줄 이상 써 주세요');
      if (d.style === 'base' && kind === 'guide' && (!d.title.trim() || !(d.steps.some(s => s.t || s.p || s.img) || lines(d.errs).length))) return alert('제목과, 단계나 오류 표를 하나 이상 써 주세요');
      busy(true); const btn = g('[data-mk]'), was = btn.textContent; btn.textContent = '만드는 중…';
      try { const blob = await shoot(d), name = (kind === 'guide' ? 'guide-' : 'update-') + (String(opt.date || '').replace(/-/g, '') || Date.now()) + '.png';
        if (d.style === 'notice' && d.ncol && d.ntag.trim()) last.kinds = [{ n: d.ntag.trim(), c: d.ncol, i: d.nicon }, ...(last.kinds || []).filter(k => k.n !== d.ntag.trim())].slice(0, 8); // shortcut: 이 기기에만·최근 8개, 여러 기기면 사이트 설정으로
        store.set(Object.assign(last, { style: d.style }, kind === 'guide' || d.style === 'card' ? { gacc: d.acc } : { preset: d.preset ?? NEWS.findIndex(t => t.bg === d.bg) }));
        if (mk === 'save') { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
        else { dlg.close(); const file = new File([blob], name, { type: 'image/png' });
          if (d.style === 'notice') fin({ file, title: d.ntitle.trim(), body: d.nsub.trim(), icon: '', tags: [] });
          else if (d.style === 'card') { const it = lines(d.citems).map(pair); fin({ file, title: d.ctitle.trim(), body: it.slice(0, 3).map(x => x[0]).join(' · '), icon: d.cicon || '', tags: d.ver ? [d.ver] : [] }); }
          else if (kind === 'guide') fin({ file, title: d.title.trim(), body: d.lead.trim(), icon: '📖', tags: [] });
          else { const b = lines(d.bubbles).map(pair); fin({ file, title: b[0][0].replace(/[.!~]+$/, ''), body: b.slice(0, 3).map(x => x[0]).join(' '), icon: d.av || '', tags: d.ver ? [d.ver] : [] }); } }
      } catch (err) { alert(err.message || '그림을 못 만들었어요'); } finally { btn.textContent = was; busy(false); }
    });
    dlg.addEventListener('close', () => dlg.remove());
    paint(); dlg.showModal(); draw(); setTimeout(draw, 300); // 글꼴이 늦게 오면 크기가 바뀌어서 한 번 더
    if (matchMedia('(pointer: fine)').matches) dlg.querySelector(d.style === 'notice' ? '[data-k="ntitle"]' : d.style === 'card' ? '[data-k="ctitle"]' : kind === 'guide' ? '[data-k="title"]' : '[data-k="bubbles"]')?.focus(); else dlg.querySelector('.side')?.focus(); // 폰에선 열자마자 자판이 올라오지 않게
  }
  window.JoaMaker = { open, init, chatHtml, guideHtml, cardHtml, noticeHtml, noticeCanvas, NEWS };
})();
