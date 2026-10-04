// index.html の文面エンジン(CM)を読み込み、全組合せ・禁止語・金額・名前を検算する。
// 実行: node source/run-checks.js
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = html.match(/<script>\r?\n(var CM[\s\S]*?)\r?\n\(function/)[1];
const CM = new Function(js + '\nreturn CM;')();
const BAD = /規約|法律|賠償|ご了承|発生|当然|規定|必ず|ご理解/;
let n = 0, fail = 0;
const bad = (m) => { fail++; console.log('NG', m); };
for (const sc of CM.SCENES) for (const r of sc.reasons) for (const m of ['line', 'mail', 'dm']) for (const alt of ['propose', 'later', 'none'])
  for (const fee of (sc.fee ? ['skip', 'waive', 'ask'] : ['skip'])) for (const full of [0, 1]) {
    const o = CM.build({ scene: sc.id, reason: r.id, medium: m, alt, fee, feeAmt: '12000', refund: !!full,
      dt: full ? '10月12日（日）14:00' : '', name: full ? '山田' : '', shop: full ? 'ヘアサロン ひなた' : '',
      altText: full ? '10月19日（日）14:00' : '' });
    n++;
    if (BAD.test(o.subject + o.body)) bad('禁止語 ' + [sc.id, r.id, m, alt, fee]);
    if (full && alt !== 'none' && o.placeholders.length) bad('入力済みなのに〔〕が残る ' + [sc.id, r.id, m, alt, fee, o.placeholders]);
    if (!full && !o.placeholders.length) bad('空欄なのに警告なし ' + [sc.id, m]);
    if (m === 'mail' && !o.subject) bad('メールに件名なし ' + sc.id);
    if (m !== 'mail' && o.subject) bad('メール以外に件名 ' + sc.id);
    if (/様様|さん様|御中様/.test(o.body)) bad('敬称の二重');
  }
const amt = { '1.5万円': '', '3千円': '', '0': '', '３，０００円': '3,000円', '12000': '12,000円', 'abc': '', '': '' };
for (const k in amt) if (CM.fmtAmount(k) !== amt[k]) bad('金額 ' + k + ' => ' + CM.fmtAmount(k));
const nm = CM.build({ scene: 'own', reason: 'none', medium: 'line', name: '山田様', dt: 'x', shop: 's', alt: 'none' }).body;
if (!nm.startsWith('山田様\n')) bad('名前の様');
console.log('組合せ ' + n + ' 通り、失敗 ' + fail + ' 件');
process.exit(fail ? 1 : 0);
