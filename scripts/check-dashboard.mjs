#!/usr/bin/env node
// Independent regressions for recorded state, history coverage and document boundaries.
// Also runs when imported by check-progress-view.mjs; no browser or model calls.
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,realpathSync,rmSync,utimesSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createDashboard,parseWork,DASH_LIMITS} from '../bin/progress/dashboard.mjs';
import {createSource,parseLog} from '../bin/progress/projection.mjs';
import {startProgress} from '../bin/progress/server.mjs';

const testRoot=mkdtempSync(path.join(tmpdir(),'ahk-dashboard-'));
const failures=[];let fileClock=Date.now();
const handoff=`# Orchard handoff
## Active Objective
Current step: Review the planting plan.
## Next Priorities
- Obtain the owner's response.
## Risks / Blockers
- Approval remains outstanding.
`;
const workHeader='## Work Items\n| ID | Title | Status | Parent | Summary | Source |\n|---|---|---|---|---|---|\n';
const workText=workHeader+'| plan | Planting plan | active | — | Awaiting independent review | — |\n';
const projectIndex='# Project index\n## Project\nName: Orchard project\nGoal: Make the planting plan usable.\n';
const archiveIndex=(rows=[])=>'# Archive index\n## Batches\n| Date range | Path |\n|---|---|\n'+rows.map(([range,file])=>`| ${range} | ${file} |`).join('\n')+'\n';
const event=(id,summary='Saved record',date='2026-10-02')=>`## ${date} — Event ${id}\nEvent ID: ${id}\nSummary: ${summary}\n`;
function project(name,files={}){
 const root=path.join(testRoot,name);mkdirSync(root,{recursive:true});
 const write=(file,text)=>{const target=path.join(root,file);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,text);const stamp=new Date(++fileClock);utimesSync(target,stamp,stamp);};
 const defaults={'dev/SESSION_HANDOFF.md':handoff+workText,'dev/PROJECT_INDEX.md':projectIndex,'dev/SESSION_LOG.md':'# Session log\n'};
 for(const [file,text]of Object.entries({...defaults,...files}))write(file,text);
 const source=createSource(root);source.refresh({immediate:true});const dashboard=createDashboard(root,source);dashboard.refresh();
 return{root,write,source,dashboard};
}
async function check(name,run){try{await run();console.log('ok: dashboard '+name);}catch(error){failures.push({name,error});console.error('FAIL: dashboard '+name+' — '+error.message);}}
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');

try{
 await check('legacy pending and risks remain available without inventing classified work',()=>{
  const text=handoff.replace("- Obtain the owner's response.",Array.from({length:6},(_,i)=>'- Pending '+(i+1)).join('\n')).replace('- Approval remains outstanding.',Array.from({length:3},(_,i)=>'- Risk '+(i+1)).join('\n'));
  const p=project('legacy-outstanding',{'dev/SESSION_HANDOFF.md':text});
  assert.deepEqual(p.dashboard.snapshot().work,{items:[],recorded:false});
  const saved=p.source.snapshot();assert.equal(saved.sections.pending.total,6);assert.equal(saved.sections.risks.total,3);
  assert.deepEqual(saved.sections.pending.items.map(x=>x.text),['Pending 1','Pending 2','Pending 3']);
  assert.equal(saved.sections.risks.items.length,2);assert.equal(saved.project.current.text,'Review the planting plan.');
 });
 await check('home and history share plain, list, bold, translated and multiline event semantics',()=>{
  const text='# Session log\n'+[
   '## 2026-10-02 — Plain record\nEvent ID: plain\nWork: plan\nTitle zh-Hant: 純文字紀錄\nSummary: First line\n  Continued explanation\nSummary zh-Hant: 中文摘要\nPending: Remaining review\n',
   '## 2025-10-02 — List record\n- **Event ID:** list\n- **Work:** plan\n- **Summary:** Listed summary\n  Continuation\n- **QC:** Not accepted yet\n',
   '## 2024-10-02 — Prose record\nEvent ID: —\nSummary: TBD\nA saved prose explanation.\n',
   '## 2023-10-02 — Another prose record\nEvent ID: -\nDone: A separate result\n',
   '## 2026-02-31 — Invalid calendar date\nSummary: Must not appear\n'
  ].join('\n');
  const p=project('shared-events',{'dev/SESSION_LOG.md':text});const home=parseLog(text).entries,history=p.dashboard.history().items;
  assert.equal(home.length,4);assert.equal(history.length,4);
  for(const r of home){const h=history.find(e=>e.id===r.id);assert.ok(h);assert.deepEqual(r.fields,h.fields);assert.equal(r.summary?.text||'',h.summary);assert.equal(r.titleZh,h.titleZh);assert.equal(r.summaryZh,h.summaryZh);assert.equal(r.work,h.work);assert.deepEqual(r.source,h.source);}
  assert.equal(home[0].summary.text,'First line\nContinued explanation');assert.equal(home[0].titleZh,'純文字紀錄');assert.equal(home[0].summaryZh,'中文摘要');
  assert.equal(home[1].summary.text,'Listed summary\nContinuation');assert.equal(home[2].summary.text,'A saved prose explanation.');
  assert.equal(home[2].fields['event id'],undefined);assert.equal(home[3].fields['event id'],undefined);assert.notEqual(home[2].id,home[3].id);
  assert.ok(home.every(x=>!x.summary?.text.includes('Event ID:')));
 });
 await check('project version uses the shared Stack reader and never falls back to a tool version',()=>{
  const stack=v=>'\n## Stack\n| Item | Value | Notes |\n|---|---|---|\n| Agent Handoff Kit template version | '+v+' | Installed |\n';
  const p=project('project-version',{'dev/PROJECT_INDEX.md':projectIndex+stack('1.2.3')});
  assert.equal(p.dashboard.snapshot().projectKitVersion,'1.2.3');
  const revision=p.dashboard.snapshot().revision;
  p.write('dev/PROJECT_INDEX.md',projectIndex+stack('1.2.4'));assert.equal(p.dashboard.refresh(),true);
  assert.equal(p.dashboard.snapshot().projectKitVersion,'1.2.4');assert.ok(p.dashboard.snapshot().revision>revision);
  for(const text of [projectIndex,projectIndex+stack('1.2.4-beta'),projectIndex+stack('1.2.4')+stack('1.2.4'),projectIndex+'\n```md\n'+stack('9.9.9')+'```\n']){
   p.write('dev/PROJECT_INDEX.md',text);p.dashboard.refresh();assert.equal(p.dashboard.snapshot().projectKitVersion,null);
  }
  p.write('dev/PROJECT_INDEX.md','# Partial index\n');p.dashboard.refresh();assert.equal(p.dashboard.snapshot().projectKitVersion,null);assert.equal(p.dashboard.snapshot().profile.name,'Orchard project');
 });
 await check('explicit states, parent relationships and malformed work rejection',()=>{
  const parsed=parseWork(handoff+workText+'| review | Soil review | review | plan | Awaiting assessment | docs/result.md |\n');
  assert.equal(parsed.items[1].status,'review');assert.equal(parsed.items[1].parent,'plan');
  assert.deepEqual(parseWork(handoff),{items:[],recorded:false});
  for(const invalid of [handoff+'## Work Items\n',handoff+workText+'\n'+workText,handoff+workText.replace('| active |','| complete-ish |'),handoff+workText.replace('| — | Awaiting','| missing | Awaiting')])assert.throws(()=>parseWork(invalid));
  assert.throws(()=>parseWork(handoff+workHeader+'| a | A | active | b | A | — |\n| b | B | waiting | a | B | — |\n'),/cycle/);
 });
 await check('partial handoff retains the same accepted work across source and dashboard',()=>{
  const p=project('handoff');const before=p.dashboard.snapshot().work;
  p.write('dev/SESSION_HANDOFF.md','# Half-written handoff\n## Work Items\n');
  assert.equal(p.source.refresh(),false);p.dashboard.refresh();assert.deepEqual(p.dashboard.snapshot().work,before);
  p.source.refresh();p.dashboard.refresh();assert.ok(p.source.snapshot().errors.handoff);assert.deepEqual(p.dashboard.snapshot().work,before);
  p.write('dev/SESSION_HANDOFF.md',handoff+workText.replace('| active |','| review |'));p.source.refresh({immediate:true});p.dashboard.refresh();
  assert.equal(p.dashboard.snapshot().work.items[0].status,'review');assert.equal(p.dashboard.snapshot().errors.work,undefined);
 });
 await check('a partially rewritten project index does not silently erase its valid identity',()=>{
  const p=project('index-partial');const before=p.dashboard.snapshot().profile;
  p.write('dev/PROJECT_INDEX.md','# Project index\n');p.dashboard.refresh();
  assert.ok(p.dashboard.snapshot().errors.index||JSON.stringify(p.dashboard.snapshot().profile)===JSON.stringify(before),'must retain the valid profile or disclose an invalid index');
 });
 await check('missing archive table reports incomplete coverage',()=>{
  const p=project('archive-invalid',{'dev/SESSION_LOG_archive/INDEX.md':'# Archive index\nPartial write\n','dev/SESSION_LOG_archive/archive_001.md':event('archived')});
  const result=p.dashboard.history();assert.equal(result.complete,false);assert.ok(result.warnings.includes('archive_index'));
 });
 await check('invalid archive date ranges cannot silently exclude real records',()=>{
  for(const [name,range]of [['reversed','2026-10-03 to 2026-09-30'],['calendar','2026-02-31 to 2026-02-31']]){
   const p=project('range-'+name,{'dev/SESSION_LOG_archive/INDEX.md':archiveIndex([[range,'archive_001.md']]),'dev/SESSION_LOG_archive/archive_001.md':event('inside')});
   const result=p.dashboard.history({from:'2026-10-02',to:'2026-10-02'});
   assert.ok(result.items.some(x=>x.title==='Event inside')||(!result.complete&&result.warnings.length>0),'invalid manifest range must not produce a complete empty result');
  }
 });
 await check('HTML comments and fenced examples never create history events',()=>{
  const text='# Session log\n<!--\n'+event('comment-example')+'-->\n```markdown\n'+event('fenced-example')+'```\n'+event('real');
  const p=project('hidden-examples',{'dev/SESSION_LOG.md':text});
  assert.equal(parseLog(text).entries.length,1);const result=p.dashboard.history();assert.deepEqual(result.items.map(x=>x.title),['Event real']);
 });
 await check('unclosed marked entries and oversized records disclose incomplete coverage',()=>{
  const p=project('incomplete',{'dev/SESSION_LOG.md':'<!-- ack:log-entry:start -->\n'+event('unfinished')});
  const result=p.dashboard.history();assert.equal(result.items.length,0);assert.equal(result.complete,false);assert.ok(result.warnings.includes('incomplete_entry'));
  p.write('dev/SESSION_LOG.md',event('too-large','x'.repeat(DASH_LIMITS.entryBytes+1))+'\n'+event('valid'));
  const large=p.dashboard.history();assert.equal(large.complete,false);assert.ok(large.warnings.length>0);assert.ok(large.items.some(x=>x.title==='Event valid'));
 });
 await check('moved events deduplicate and conflicting explicit Event IDs stay unverified',()=>{
  const same=event('stable');const p=project('move',{'dev/SESSION_LOG.md':same,'dev/SESSION_LOG_archive/INDEX.md':archiveIndex([['2026-10-02 to 2026-10-02','archive_001.md']]),'dev/SESSION_LOG_archive/archive_001.md':same});
  const result=p.dashboard.history();assert.equal(result.items.length,1);assert.equal(result.complete,true);
  p.write('dev/SESSION_LOG_archive/archive_001.md',event('stable','A conflicting account'));
  const conflict=p.dashboard.history();assert.equal(conflict.items.length,1);assert.equal(conflict.complete,false);assert.ok(conflict.warnings.includes('event_conflict'));
 });
 await check('legacy agent or session IDs preserve distinct events and exact moved copies deduplicate',()=>{
  const template=readFileSync(new URL('../runtime-core/SESSION_LOG.md',import.meta.url),'utf8');assert.match(template,/<agent_or_session_id>/,'the existing ID field identifies an agent or session, not an event');
  const legacy=(date,title,summary)=>`## ${date} — ${title}\n- **ID:** shared-session\n- **Summary:** ${summary}\n`;
  const first=legacy('2026-10-02','Design reviewed','Review findings recorded');
  const second=legacy('2026-10-02','Implementation adjusted','Changed the implementation');
  const third=legacy('2026-10-01','Earlier planning','Agreed the scope');
  const p=project('legacy-session-id',{'dev/SESSION_LOG.md':first+'\n'+second,'dev/SESSION_LOG_archive/INDEX.md':archiveIndex([['2026-10-01 to 2026-10-02','archive_001.md']]),'dev/SESSION_LOG_archive/archive_001.md':first+'\n'+third});
  const result=p.dashboard.history();assert.equal(result.complete,true);assert.deepEqual(result.warnings,[]);
  assert.deepEqual(result.items.map(x=>x.title),['Design reviewed','Implementation adjusted','Earlier planning']);
  assert.equal(new Set(result.items.map(x=>x.id)).size,3);assert.ok(result.items.every(x=>x.fields.id==='shared-session'),'legacy source metadata must retain its original meaning');
 });
 await check('archive-only edits emit a dashboard history revision',()=>{
  const p=project('archive-update',{'dev/SESSION_LOG_archive/INDEX.md':archiveIndex([['2026-10-02 to 2026-10-02','archive_001.md']]),'dev/SESSION_LOG_archive/archive_001.md':event('before')});
  p.dashboard.history();const before=p.dashboard.snapshot().historyRevision;
  p.write('dev/SESSION_LOG_archive/archive_001.md',event('after'));assert.equal(p.source.refresh(),false);assert.equal(p.dashboard.refresh(),true);assert.ok(p.dashboard.snapshot().historyRevision>before);
 });
 await check('cursor rejects changed completed files and changed archive manifests',()=>{
  for(const target of ['dev/SESSION_LOG.md','dev/SESSION_LOG_archive/INDEX.md']){
   const p=project('cursor-'+(target.includes('archive')?'manifest':'log'),{'dev/SESSION_LOG.md':Array.from({length:21},(_,i)=>event('e'+i)).join('\n'),'dev/SESSION_LOG_archive/INDEX.md':archiveIndex()});
   const first=p.dashboard.history();assert.equal(first.items.length,20);assert.ok(first.next);
   p.write(target,target.includes('archive')?archiveIndex([['2026-10-02 to 2026-10-02','archive_new.md']]):event('replacement'));
   assert.throws(()=>p.dashboard.history({cursor:first.next}),/history_changed/);
  }
 });
 await check('history queries remain bounded across large UTF-8 logs and many files',()=>{
  const p=project('bounded',{'dev/SESSION_LOG.md':Array.from({length:350},(_,i)=>event('old'+i,'字'.repeat(350),'2026-01-01')).join('\n')});
  let result=p.dashboard.history({from:'2026-09-01'});assert.equal(result.bytesRead,DASH_LIMITS.historyBytes);assert.ok(result.next);assert.equal(result.complete,false);
  for(let pages=0;result.next;pages++){assert.ok(pages<10);result=p.dashboard.history({from:'2026-09-01',cursor:result.next});assert.ok(result.bytesRead<=DASH_LIMITS.historyBytes);}
  assert.equal(result.complete,true);
  const rows=Array.from({length:6},(_,i)=>['2026-01-01 to 2026-01-01',`archive_${i}.md`]);p.write('dev/SESSION_LOG.md','# Session log\n');p.write('dev/SESSION_LOG_archive/INDEX.md',archiveIndex(rows));
  for(let i=0;i<6;i++)p.write(`dev/SESSION_LOG_archive/archive_${i}.md`,event('archive'+i,'Saved','2026-01-01'));
  result=p.dashboard.history();assert.equal(result.filesChecked,DASH_LIMITS.historyFiles);assert.ok(result.next);assert.equal(result.totalFiles,7);
 });
 await check('invalid dates, unknown documents and unsafe paths are rejected',()=>{
  const p=project('paths',{'dev/PROJECT_INDEX.md':projectIndex+'## Directory Map\n| Path | Role |\n|---|---|\n| ../outside.md | Outside |\n| .git/config | Git |\n| docs/credentials.txt | Credential |\n| docs/visible.md | Visible |\n','docs/visible.md':'<script>example()</script>'});
  assert.deepEqual(p.dashboard.snapshot().documents.filter(x=>x.role==='document').map(x=>x.file),['docs/visible.md']);assert.throws(()=>p.dashboard.document('../outside.md'));
  for(const query of [{from:'2026-02-31'},{from:'2026-10-02',to:'2026-10-01'},{search:'x'.repeat(101)}])assert.throws(()=>p.dashboard.history(query));
  p.write('dev/governance_migrations/.upgrade.lock','test');assert.throws(()=>p.dashboard.document('handoff'),/upgrade/);assert.throws(()=>p.dashboard.history(),/upgrade/);
 });
 await check('known credential patterns are redacted in titles as well as body text',()=>{
  const synthetic='ghp_'+'A'.repeat(40);const p=project('redaction',{'dev/SESSION_LOG.md':`## 2026-10-02 — ${synthetic}\nSummary: ${synthetic}\n`});
  const result=p.dashboard.history();assert.equal(result.items.length,1);assert.ok(!JSON.stringify(result).includes(synthetic));assert.match(result.items[0].title,/REDACTED/);
 });
 await check('document and history HTTP endpoints enforce origin, lock and read-only boundaries',async()=>{
  const p=project('http',{'dev/SESSION_LOG.md':event('api')});const before=hash(path.join(p.root,'dev/SESSION_HANDOFF.md'));const app=await startProgress({root:p.root,openBrowser:false,idleMs:1000});
  try{
   const get=p=>fetch(app.url+p);assert.equal((await get('/api/history')).status,200);assert.equal((await get('/api/document?id=handoff')).status,200);
   assert.equal((await fetch(app.url+'/api/document?id=handoff',{headers:{Origin:'https://example.invalid'}})).status,403);
   assert.equal((await fetch(app.url+'/api/history',{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
   assert.equal((await fetch(app.url+'/api/document?id=handoff',{method:'POST'})).status,405);assert.equal((await get('/api/document?id=../outside.md')).status,400);
   assert.equal(hash(path.join(p.root,'dev/SESSION_HANDOFF.md')),before);
   p.write('dev/governance_migrations/.upgrade.lock','test');assert.equal((await get('/api/document?id=handoff')).status,400);assert.equal((await get('/api/history')).status,400);
  }finally{await app.close();}
 });
}finally{
 const resolved=realpathSync(testRoot);if(path.dirname(resolved)!==realpathSync(tmpdir())||!path.basename(resolved).startsWith('ahk-dashboard-'))throw Error('Refuse cleanup outside owned temporary fixture');rmSync(resolved,{recursive:true,force:true});
}
if(failures.length)throw new AggregateError(failures.map(x=>x.error),failures.map(x=>x.name).join('; '));
console.log('Agent Handoff Kit dashboard checks passed.');
