import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {affectedDeliveryFeatures,NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES,NATIVE_UPDATE_OBSERVABLE_RESULT_EVIDENCE_ROLES,validateFeatureDelivery} from './feature-delivery.mjs';
import {commands} from '../bin/commands.mjs';
import {deliveredFeatureContracts,selectDeliveryEvidence} from '../bin/installed-file-contract.mjs';
export function checkFeatureDeliveryEvidence({root,evidencePath,evidenceSha256,fixtureRoot}){
 const sha='a'.repeat(64),base='b'.repeat(40),ref={path:evidencePath,sha256:evidenceSha256};
 const reuseRoot=mkdtempSync(path.join(fixtureRoot??tmpdir(),'ack-feature-delivery-reuse-'));
 const digest=value=>createHash('sha256').update(value).digest('hex');
 const writeReuse=(name,value)=>{const file=path.join(reuseRoot,name),bytes=typeof value==='string'?value:JSON.stringify(value);writeFileSync(file,bytes);return {path:file,sha256:digest(bytes)};};
 const baseVersion='0.4.0',candidateVersion=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version;
 const observed={status:'passed',observation:'Observed through the named entry',evidence:[ref]};
 const stage={...observed,tarballSha256:sha};
 const entries=commands.map(c=>c.name);
 const observableResult=Object.fromEntries(NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES.map(role=>[role,writeReuse(`observable-${role}.txt`,`${role} evidence`)]));
 const sameFileAlias=ref=>({...ref,path:`${path.dirname(ref.path)}${path.sep}..${path.sep}${path.basename(path.dirname(ref.path))}${path.sep}${path.basename(ref.path)}`});
 // These are validator fixtures, not native acceptance evidence.
  const results=entries.map(entry=>{
   const cases=['normal','boundary'].map(scenario=>({...observed,id:`${entry}-${scenario}`,scenario,kind:'observable-result',outcome:scenario==='normal'?'matched':'expected-stop',input:'$'+entry,expected:'Contract result',actual:'Observed contract result',readback:'Verified output and project state',observableResult:structuredClone(observableResult)}));
  if(entry==='handoff-kit-update'){
   cases[0].observableResult={...cases[0].observableResult,state:writeReuse('update-state.txt','installed version and doctor readback'),transaction:writeReuse('update-transaction.txt','controlled-registry upgrade transaction')};
   cases[0].update={registryMode:'controlled',registryVersion:candidateVersion,cliVersion:candidateVersion,fromVersion:baseVersion,toVersion:candidateVersion};
  }
  return {entry,kind:'observable-result',tarballSha256:sha,installRoute:entry==='handoff-kit-update'?'upgrade':'freshInstall',cases};
 });
 const installerStages={package:stage,freshInstall:{...stage,command:'init'},upgrade:{...stage,command:'upgrade',baselineVersion:baseVersion,baselineTarballSha256:evidenceSha256},entry:{...stage,entry:'current package install and upgrade routes'}};
 const data={schemaVersion:1,tarballSha256:sha,baseCommit:base,baseVersion,baselineArtifact:ref,features:[{id:'shortcuts',package:stage,freshInstall:{...stage,command:'init'},upgrade:{...stage,command:'upgrade',baselineVersion:baseVersion,baselineTarballSha256:evidenceSha256},entry:{...stage,entry:'each command in native tools',hosts:Object.fromEntries(['claude','gemini','codex','antigravity'].map(h=>[h,{menu:{...observed,kind:'native-menu',entries},invocation:{...observed,kind:'observable-result',entries,results}}]))}},{id:'installer',...installerStages}]};
 const options={root,changedFiles:['bin/commands.mjs'],tarballSha256:sha,baseCommit:base,candidateVersion};
 const validate=d=>validateFeatureDelivery(d,options);
 validate(data);
 const representative=structuredClone(data);
 for(const host of ['claude','gemini','antigravity'])representative.features[0].entry.hosts[host]={menu:{status:'unverified'},invocation:{status:'unverified'},reason:'Native acceptance scope is Codex; other hosts are not claimed tested',evidence:[ref]};
 validate(representative);
 for(const mutate of [d=>delete d.features[0].entry.hosts.codex,d=>d.features[0].entry.hosts.codex=structuredClone(d.features[0].entry.hosts.claude),d=>delete d.features[0].entry.hosts.claude.reason,d=>delete d.features[0].entry.hosts.claude.evidence,d=>d.features[0].entry.hosts.codex.menu.kind='file-exists']){
  const bad=structuredClone(representative);mutate(bad);assert.throws(()=>validate(bad));
 }
 for(const mutate of [d=>d.features[0].entry.hosts.codex.invocation.entries=['handoff-kit-help'],d=>delete d.features[0].entry.hosts.codex.invocation.entries,d=>d.features[0].entry.hosts.codex.invocation.entries='handoff-kit-help only; handoff-kit-progress NOT tested',d=>delete d.features[0].package,d=>delete d.features[0].upgrade,d=>d.features=[],d=>d.tarballSha256='d'.repeat(64),d=>d.features[0].entry.hosts.codex.menu.kind='file-exists',d=>d.features[0].entry.hosts.codex.invocation.kind='native-invocation',d=>d.features[0].entry.hosts.claude.invocation.status='blocked',d=>delete d.features[0].entry.hosts.gemini,d=>d.features[0].freshInstall={status:'not_applicable'},d=>d.features[0].upgrade.command='commands',d=>d.features[0].package.evidence=[{...ref,sha256:'0'.repeat(64)}],d=>d.features[0].upgrade.baselineTarballSha256='c'.repeat(64),d=>d.baselineArtifact.sha256='c'.repeat(64)]){
  const bad=structuredClone(data);mutate(bad);assert.throws(()=>validate(bad));
 }
 assert.throws(()=>affectedDeliveryFeatures(['bin/new-unmapped-feature.mjs']));
 assert.deepEqual(affectedDeliveryFeatures(['README.md']),[]);
 assert.deepEqual(affectedDeliveryFeatures(['packs/closeout.md']),['installer','shortcuts','task-packs']);
 assert.deepEqual(affectedDeliveryFeatures(['runtime-core/AGENTS.core.md']),['continuity','installer','shortcuts']);
 assert.deepEqual(affectedDeliveryFeatures(['bin/agent-handoff-kit.mjs']),['installer','shortcuts']);
 assert.deepEqual(affectedDeliveryFeatures(['package.json']),['installer']);
 assert.deepEqual(affectedDeliveryFeatures(['bin/commands.mjs']),['installer','shortcuts']);
 assert.deepEqual(affectedDeliveryFeatures(['bin/progress/launch.mjs']),['dashboard','installer','shortcuts']);
 assert.deepEqual(selectDeliveryEvidence(['README.md']).nativeEntries,[]);
 assert.deepEqual(selectDeliveryEvidence(['packs/closeout.md']).nativeEntries,['handoff-kit-close','handoff-kit-remember']);
 assert.deepEqual(selectDeliveryEvidence(['packs/safety.md']).nativeEntries,['handoff-kit-close','handoff-kit-remember']);
 assert.deepEqual(selectDeliveryEvidence(['packs/onboarding.md']).nativeEntries,['handoff-kit-start','handoff-kit-onboard','handoff-kit-remember']);
 assert.deepEqual(selectDeliveryEvidence(['bin/progress/launch.mjs']).nativeEntries,['handoff-kit-progress']);
 assert.deepEqual(selectDeliveryEvidence(['bin/commands.mjs']).nativeEntries,entries);
 assert.deepEqual(selectDeliveryEvidence(['runtime-core/AGENTS.core.md']).nativeEntries,entries);
 assert.deepEqual(selectDeliveryEvidence(['bin/installed-file-contract.mjs']).nativeEntries,entries);
 const shortcutsOnly=structuredClone(data);shortcutsOnly.features=shortcutsOnly.features.filter(feature=>feature.id==='shortcuts');
 assert.throws(()=>validateFeatureDelivery(shortcutsOnly,{...options,changedFiles:['package.json']}));
 assert.throws(()=>validateFeatureDelivery(shortcutsOnly,{...options,changedFiles:['bin/commands.mjs']}));
 validateFeatureDelivery({...data,features:[]},{...options,changedFiles:['README.md']});
 for(const entry of entries){
  const missing=structuredClone(representative);missing.features[0].entry.hosts.codex.invocation.results=results.filter(r=>r.entry!==entry);assert.throws(()=>validate(missing));
 }
 const packScoped=structuredClone(representative);packScoped.features.push({id:'task-packs',...installerStages});
 for(const [changedFile,expectedEntries] of [
  ['packs/closeout.md',['handoff-kit-close','handoff-kit-remember']],
  ['packs/safety.md',['handoff-kit-close','handoff-kit-remember']],
  ['packs/onboarding.md',['handoff-kit-start','handoff-kit-onboard','handoff-kit-remember']]
 ]){
  const scoped=structuredClone(packScoped),host=scoped.features[0].entry.hosts.codex;
  host.invocation.entries=expectedEntries;host.invocation.results=results.filter(record=>expectedEntries.includes(record.entry));
  validateFeatureDelivery(scoped,{...options,changedFiles:[changedFile]});
  for(const entry of expectedEntries){
   const missing=structuredClone(scoped);missing.features[0].entry.hosts.codex.invocation.results=missing.features[0].entry.hosts.codex.invocation.results.filter(record=>record.entry!==entry);assert.throws(()=>validateFeatureDelivery(missing,{...options,changedFiles:[changedFile]}));
  }
  const extra=entries.find(entry=>!expectedEntries.includes(entry)),overbroad=structuredClone(scoped);
  overbroad.features[0].entry.hosts.codex.invocation.entries.push(extra);overbroad.features[0].entry.hosts.codex.invocation.results.push(results.find(record=>record.entry===extra));assert.throws(()=>validateFeatureDelivery(overbroad,{...options,changedFiles:[changedFile]}));
 }
 const progressOnly=structuredClone(representative);progressOnly.features.push({id:'dashboard',...installerStages});
 const progressHost=progressOnly.features[0].entry.hosts.codex;progressHost.invocation.entries=['handoff-kit-progress'];progressHost.invocation.results=results.filter(record=>record.entry==='handoff-kit-progress');
 validateFeatureDelivery(progressOnly,{...options,changedFiles:['bin/progress/launch.mjs']});
  // Native menu, command-generator inventory, and both normal/boundary cases are all required.
  for(const mutate of [h=>h.menu.entries=[],h=>h.menu.entries.push(entries[0]),h=>h.invocation.entries=['handoff-kit-progress','handoff-kit-progress'],h=>h.invocation.entries.push('unknown-command'),h=>delete h.invocation.results,h=>h.invocation.results.push(h.invocation.results[0]),h=>h.invocation.results[0].tarballSha256='0'.repeat(64),h=>h.invocation.results[0].installRoute='source',h=>h.invocation.results[0].cases.pop(),h=>delete h.invocation.results[0].cases[0].id,h=>h.invocation.results[0].cases[1].id=h.invocation.results[0].cases[0].id,h=>h.invocation.results[0].cases[0].scenario='unsupported',h=>h.invocation.results[0].cases[0].scenario='boundary',h=>h.invocation.results[0].cases[0].status='blocked',h=>h.invocation.results[0].cases[0].outcome='expected-stop',h=>h.invocation.results[0].cases[0].kind='native-invocation',h=>delete h.invocation.results[0].cases[0].readback,h=>delete h.invocation.results[0].cases[0].input,h=>h.invocation.results[0].cases[0].evidence=[],h=>h.invocation.results[0].cases[0].evidence=[{...ref,sha256:'0'.repeat(64)}]]){
  const bad=structuredClone(representative);mutate(bad.features[0].entry.hosts.codex);assert.throws(()=>validate(bad));
  }
  const multipleApplicable=structuredClone(representative);const updateRecord=multipleApplicable.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-update');updateRecord.cases.push({...structuredClone(updateRecord.cases[1]),id:'update-boundary-future-official-registry'});validate(multipleApplicable);
 const updateNormal=d=>d.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-update').cases.find(test=>test.scenario==='normal');
 for(const mutate of [d=>delete updateNormal(d).update,d=>updateNormal(d).update.registryMode='official-live',d=>updateNormal(d).update.registryVersion=baseVersion,d=>updateNormal(d).update.cliVersion=baseVersion,d=>updateNormal(d).update.fromVersion=candidateVersion,d=>updateNormal(d).update.toVersion=baseVersion,d=>updateNormal(d).outcome='expected-stop',d=>delete updateNormal(d).observableResult.transaction,d=>{const observable=updateNormal(d).observableResult;for(const role of NATIVE_UPDATE_OBSERVABLE_RESULT_EVIDENCE_ROLES)observable[role]=sameFileAlias(observable.input);},d=>d.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-update').installRoute='freshInstall']){
  const bad=structuredClone(representative);mutate(bad);assert.throws(()=>validate(bad));
 }
 const justified=structuredClone(data);justified.features[0].upgrade={status:'not_applicable',reason:'Not exercised',evidence:[ref]};assert.throws(()=>validate(justified));
 for(const mutate of [c=>delete c.observableResult,...NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES.flatMap(role=>[c=>delete c.observableResult[role],c=>c.observableResult[role]={...ref,sha256:'0'.repeat(64)}]),c=>c.observableResult.result=sameFileAlias(c.observableResult.input),c=>{
  const first=c.observableResult.input;for(const role of NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES)c.observableResult[role]=first;
 }]){
  const bad=structuredClone(representative);mutate(bad.features[0].entry.hosts.codex.invocation.results[0].cases[0]);assert.throws(()=>validate(bad));
 }
 const oldArtifact=writeReuse('historical.tgz','historical package bytes');
 // A reusable shortcut case structurally compares every declared behavior
 // dependency. Artifact-wide inventory completeness remains independent review.
 const sourceFiles=[
  {path:'bin/commands.mjs',sha256:'c'.repeat(64)},
  {path:'package.json',sha256:'d'.repeat(64)},
  {path:'runtime-core/AGENTS.core.md',sha256:'e'.repeat(64)},
  {path:'packs/closeout.md',sha256:'f'.repeat(64)},
  {path:'packs/agent-governance.md',sha256:'1'.repeat(64)},
  {path:'packs/onboarding.md',sha256:'2'.repeat(64)},
  {path:'bin/progress/launch.mjs',sha256:'3'.repeat(64)},
  {path:'bin/progress/open.mjs',sha256:'d'.repeat(64)},
  {path:'bin/agent-handoff-kit.mjs',sha256:'4'.repeat(64)},
  {path:'bin/installed-file-contract.mjs',sha256:'5'.repeat(64)},
  {path:'bin/official-origin-catalog.mjs',sha256:'6'.repeat(64)},
  {path:'bin/migration-baselines/official-origin-catalog.json',sha256:'7'.repeat(64)},
  {path:'bin/upgrade-inventory.mjs',sha256:'8'.repeat(64)},
  {path:'bin/user-rules-router.mjs',sha256:'9'.repeat(64)},
  {path:'bin/handoff-read.mjs',sha256:'a'.repeat(64)},
  {path:'bin/prompt-mirror-core.mjs',sha256:'b'.repeat(64)},
  {path:'packs/safety.md',sha256:'c'.repeat(64)}
 ];
 const reusable=(entry,id,scenario='normal',candidateFiles=sourceFiles)=>({
  source:{tarballSha256:oldArtifact.sha256,files:sourceFiles},
  candidate:{tarballSha256:sha,files:candidateFiles},
  reusableCases:[{host:'codex',entry,id,scenario}]
 });
 const sourceReviewValue=(id,observable)=>({candidateTarball:oldArtifact,cases:[{id,scenario:'normal',status:'passed',outcome:'matched',observableResult:observable}]});
 const sourceObservable=structuredClone(observableResult);
 const sourceReview=writeReuse('source-review.json',sourceReviewValue('historical-check-normal',sourceObservable));
 const comparison=writeReuse('comparison.json',reusable('handoff-kit-check','handoff-kit-check-normal'));
 const mixed=structuredClone(representative);
 const checkNormal=mixed.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-check').cases.find(test=>test.scenario==='normal');
 checkNormal.executedArtifact=oldArtifact;
 checkNormal.reuse={sourceReview,sourceCase:{id:'historical-check-normal',scenario:'normal'},comparison};
 validate(mixed);
 // Documentation itself does not invalidate byte-identical behavior dependencies.
 const docsOnly=structuredClone(mixed);docsOnly.features=[];
 validateFeatureDelivery(docsOnly,{...options,changedFiles:['README.md']});
 const staleSource=structuredClone(mixed);writeFileSync(sourceReview.path,'changed source review bytes');assert.throws(()=>validate(staleSource));
 writeFileSync(sourceReview.path,JSON.stringify(sourceReviewValue('historical-check-normal',sourceObservable)));
 const changedEntryComparison=writeReuse('changed-entry-comparison.json',{...reusable('handoff-kit-check','handoff-kit-check-normal'),candidate:{tarballSha256:sha,files:sourceFiles.map(file=>file.path==='bin/commands.mjs'?{...file,sha256:'0'.repeat(64)}:file)}});
 const changedEntry=structuredClone(mixed);changedEntry.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-check').cases.find(test=>test.scenario==='normal').reuse.comparison=changedEntryComparison;assert.throws(()=>validate(changedEntry));
 const withShortcutReuse=(entry,name,candidateFiles=sourceFiles)=>{
  const stale=structuredClone(mixed);
  const test=stale.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry===entry).cases.find(item=>item.scenario==='normal');
  test.executedArtifact=oldArtifact;
  test.reuse={sourceReview,sourceCase:{id:'historical-check-normal',scenario:'normal'},comparison:writeReuse(name,reusable(entry,test.id,'normal',candidateFiles))};
  return stale;
 };
 const staleShortcut=(entry,path,name)=>withShortcutReuse(entry,name,sourceFiles.map(file=>file.path===path?{...file,sha256:'0'.repeat(64)}:file));
 assert.throws(()=>validate(staleShortcut('handoff-kit-close','packs/closeout.md','changed-closeout-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-close','bin/agent-handoff-kit.mjs','changed-closeout-cli-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-close','bin/prompt-mirror-core.mjs','changed-closeout-mirror-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-close','packs/safety.md','changed-closeout-safety-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-start','runtime-core/AGENTS.core.md','changed-core-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-start','packs/onboarding.md','changed-start-onboarding-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-start','bin/handoff-read.mjs','changed-start-handoff-read-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-start','bin/agent-handoff-kit.mjs','changed-start-cli-dispatch-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-progress','bin/progress/launch.mjs','changed-progress-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-progress','package.json','changed-progress-version-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-check','bin/agent-handoff-kit.mjs','changed-installer-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-check','bin/prompt-mirror-core.mjs','changed-check-mirror-comparison.json')));
 // Package/version data cannot relabel check or update execution as current.
 assert.throws(()=>validate(staleShortcut('handoff-kit-check','package.json','version-metadata-check-comparison.json')));
 assert.throws(()=>validate(staleShortcut('handoff-kit-update','package.json','version-metadata-update-comparison.json')));
 // A version-only package change does not reopen unrelated native journeys.
 const versionOnly=structuredClone(data);versionOnly.features=versionOnly.features.filter(feature=>feature.id==='installer');
 validateFeatureDelivery(versionOnly,{...options,changedFiles:['package.json']});
 assert.throws(()=>validateFeatureDelivery(withShortcutReuse('handoff-kit-help','version-only-help-comparison.json',sourceFiles.map(file=>file.path==='package.json'?{...file,sha256:'0'.repeat(64)}:file)),{...options,changedFiles:['package.json']}));
 assert.throws(()=>validate(withShortcutReuse('handoff-kit-check','omitted-check-mirror-comparison.json',sourceFiles.filter(file=>file.path!=='bin/prompt-mirror-core.mjs'))));
 assert.throws(()=>validate(withShortcutReuse('handoff-kit-progress','omitted-progress-inventory-member-comparison.json',sourceFiles.filter(file=>file.path!=='bin/progress/open.mjs'))));
 const failedReview=writeReuse('failed-review.json',{candidateTarball:oldArtifact,cases:[{id:'historical-check-normal',scenario:'normal',status:'failed',outcome:'mismatched',observableResult:sourceObservable}]});
 const failedReuse=structuredClone(mixed);failedReuse.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-check').cases.find(test=>test.scenario==='normal').reuse.sourceReview=failedReview;assert.throws(()=>validate(failedReuse));
 const unrunReview=writeReuse('unrun-review.json',{candidateTarball:oldArtifact,cases:[{id:'historical-check-normal',scenario:'normal',status:'unrun',observableResult:sourceObservable}]});
 const unrunReuse=structuredClone(mixed);unrunReuse.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-check').cases.find(test=>test.scenario==='normal').reuse.sourceReview=unrunReview;assert.throws(()=>validate(unrunReuse));
 const mismatchedReview=writeReuse('mismatched-review.json',{candidateTarball:{...oldArtifact,sha256:'f'.repeat(64)},cases:[{id:'historical-check-normal',scenario:'normal',status:'passed',outcome:'matched',observableResult:sourceObservable}]});
 const mismatchedReuse=structuredClone(mixed);mismatchedReuse.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-check').cases.find(test=>test.scenario==='normal').reuse.sourceReview=mismatchedReview;assert.throws(()=>validate(mismatchedReuse));
 const crossedObservableReview=writeReuse('crossed-observable-review.json',sourceReviewValue('historical-check-normal',{...sourceObservable,result:writeReuse('other-result.txt','different result bytes')}));
 const crossedObservable=structuredClone(mixed);crossedObservable.features[0].entry.hosts.codex.invocation.results.find(record=>record.entry==='handoff-kit-check').cases.find(test=>test.scenario==='normal').reuse.sourceReview=crossedObservableReview;assert.throws(()=>validate(crossedObservable));
 const sourceUpdateObservable=structuredClone(updateNormal(data).observableResult);
 const sourceUpdateReview=writeReuse('source-update-review.json',sourceReviewValue('historical-update-normal',sourceUpdateObservable));
 const updateReuse=structuredClone(mixed);const updateCase=updateNormal(updateReuse);updateCase.executedArtifact=oldArtifact;updateCase.reuse={sourceReview:sourceUpdateReview,sourceCase:{id:'historical-update-normal',scenario:'normal'},comparison:writeReuse('update-comparison.json',reusable('handoff-kit-update',updateCase.id))};validate(updateReuse);
 // Even equally duplicated evidence must not validate against a broken catalog.
 const catalog=deliveredFeatureContracts.find(c=>c.id==='shortcuts').nativeInvocationEntries;
 const saved=[...catalog];
 try{
  catalog[1]=catalog[0];const bad=structuredClone(data);
  for(const h of Object.values(bad.features[0].entry.hosts)){h.menu.entries=[...catalog];h.invocation.entries=[...catalog];h.invocation.results[1]=structuredClone(h.invocation.results[0]);}
  assert.throws(()=>validate(bad));
 }finally{catalog.splice(0,catalog.length,...saved);}
 if(!fixtureRoot)rmSync(reuseRoot,{recursive:true,force:true});
 console.log('ok: formal full selects only diff-affected observable shortcut results while every generated host catalog remains checked; selected entries require exact normal/boundary results with separately readable input/result evidence, while update also requires state/transaction evidence; historical reuse still rejects stale/failed/unrun/mismatched source, crossed observable result and changed behavior dependencies');
 return data;
}
