// 실행: node test.js — 저장 파일 꼴 · 한글 base64 · 글 순서 · 요일 · 글자 막기를 확인해요
const assert = require('assert');
const { esc, linkify, textB64, dataFile, dayParts, sortPosts } = require('./app.js');

// 저장한 파일을 브라우저가 읽으면 같은 자료가 나와야 해요
const posts = [{ id: 'a', title: '한글 "따옴표" </script>', body: '줄\n바꿈', tags: ['업데이트'] }];
const win = {}; new Function('window', dataFile('POSTS', posts, 123))(win);
assert.deepStrictEqual(win.JOA_POSTS, posts); assert.strictEqual(win.JOA_POSTS_AT, 123);

// GitHub에 보내는 base64를 풀면 원래 한글이 그대로여야 해요
const src = dataFile('FAQ', [{ q: '다른 기기에서 열었더니 기억이 없어요 💜' }], 1);
assert.strictEqual(Buffer.from(textB64(src), 'base64').toString('utf8'), src);

// 고정 글이 먼저, 그다음 새 날짜부터
assert.deepStrictEqual(sortPosts([{ id: '1', date: '2026-11-19' }, { id: '2', date: '2026-11-21' }, { id: '3', date: '2026-01-01', pin: true }]).map(p => p.id), ['3', '2', '1']);

assert.deepStrictEqual(dayParts('2026-11-21'), { y: 2026, m: 11, d: 21, w: '토' });
assert.strictEqual(esc('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
assert.ok(linkify('보기 https://example.com/a?b=1&c=2 <b>').includes('<a href="https://example.com/a?b=1&amp;c=2"') && !linkify('<b>').includes('<b>'));
console.log('ok');
