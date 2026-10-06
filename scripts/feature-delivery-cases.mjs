import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {
 FEATURE_DELIVERY_ACCEPTANCE_SCOPE,FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST,
 NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES,NATIVE_UPDATE_OBSERVABLE_RESULT_EVIDENCE_ROLES,
 REQUIRED_OBSERVABLE_OPERATIONS,affectedDeliveryFeatures,observableOperationReviewSubjectDigest,
 validateFeatureDelivery
} from './feature-delivery.mjs';
import {commands} from '../bin/commands.mjs';
import {selectDeliveryEvidence} from '../bin/installed-file-contract.mjs';

// Validator fixtures only: they never become agent-semantic acceptance.
export function checkFeatureDeliveryEvidence({root,evidencePath,evidenceSha256,fixtureRoot}){
 const work=mkdtempSync(path.join(fixtureRoot??tmpdir(),'ack-feature-delivery-'));
 const digest=value=>createHash('sha256').update(value).digest('hex');
 const write=(name,value)=>{const file=path.join(work,name);const bytes=typeof value==='string'?value:JSON.stringify(value);writeFileSync(file,bytes);return {path:file,sha256:digest(bytes)};};
 const sha='a'.repeat(64),base='b'.repeat(40),baseVersion='0.4.0',candidateVersion=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version;
 const ref={path:evidencePath,sha256:evidenceSha256};
 const observed={status:'passed',observation:'Observed through the named deterministic route',evidence:[ref]};
 const stage={...observed,tarballSha256:sha};
 const baselineArtifact=write('baseline.tgz','published baseline bytes');
 const entries=commands.map(command=>command.name);
 const resultEvidence=(name,roles=NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES)=>Object.fromEntries(roles.map(role=>[role,write(`${name}-${role}.txt`,`${name}/${role}`)]));
 const operationCase=(operation,requiredCase)=>{
  const {id,scenario,outcome}=requiredCase;
  const test={
   id,scenario,status:'passed',observation:`${operation.id} ${id} independently reviewed observation`,kind:'observable-deterministic-operation',outcome,
   input:`${operation.id} ${id} input`,expected:`${operation.id} ${id} expected`,actual:`${operation.id} ${id} observed`,readback:`${operation.id} ${id} readback`,
   evidence:[ref],observableResult:resultEvidence(`${operation.id}-${id}`,operation.id==='controlled-update'&&id==='normal'?NATIVE_UPDATE_OBSERVABLE_RESULT_EVIDENCE_ROLES:NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES),
   writerProvenance:{role:'workspace-writer',provenanceId:`writer-${operation.id}-${id}`}
  };
  if(operation.id==='controlled-update'){
   test.execution=id==='normal'
    ? {transport:'npx-registry',command:'npx --registry http://127.0.0.1:4010 @adamchanadam/agent-handoff-kit update',registryInheritance:'npx-invocation'}
    : {transport:'cli-boundary',command:'agent-handoff-kit update'};
   if(id==='normal')test.update={registryMode:'controlled',registryVersion:candidateVersion,cliVersion:candidateVersion,fromVersion:baseVersion,toVersion:candidateVersion};
  }
  test.independentReview={verdict:'accepted',reviewer:{role:'independent-readonly-reviewer',provenanceId:`reviewer-${operation.id}-${id}`},subjectDigest:observableOperationReviewSubjectDigest(test),evidence:[ref]};
  return test;
 };
 const operations=REQUIRED_OBSERVABLE_OPERATIONS.map(operation=>({
  id:operation.id,entry:operation.entry,status:'passed',kind:'observable-deterministic-operation',tarballSha256:sha,evidence:[ref],
  cases:operation.cases.map(requiredCase=>operationCase(operation,requiredCase))
 }));
 const generatedStatic={
  kind:'generated-static-contract',selectedEntries:entries,
  hosts:Object.fromEntries(['claude','gemini','codex','antigravity'].map(host=>[host,{...observed,kind:'generated-adapter-menu',entries}]))
 };
 const classifications=entries.map(entry=>({entry,structuralCoverage:'passed',agentSemantics:'unverified',hostAutoDiscovery:'unverified',shortcutDispatch:'unverified'}));
 const installerStages={package:stage,freshInstall:{...stage,command:'init'},upgrade:{...stage,command:'upgrade',baselineVersion:baseVersion,baselineTarballSha256:baselineArtifact.sha256},entry:{...stage,entry:'installed package lifecycle'}};
 const data={
  schemaVersion:1,acceptanceScope:FEATURE_DELIVERY_ACCEPTANCE_SCOPE,acceptanceScopeDigest:FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST,
  tarballSha256:sha,baseCommit:base,baseVersion,baselineArtifact,
  features:[
   {id:'installer',...installerStages},
   {id:'shortcuts',package:stage,freshInstall:{...stage,command:'init'},upgrade:{...stage,command:'upgrade',baselineVersion:baseVersion,baselineTarballSha256:baselineArtifact.sha256},entry:{...stage,entry:'generated static contract plus deterministic operations',generatedStatic,classifications,observableOperations:operations}}
  ]
 };
 const options={root,changedFiles:['bin/commands.mjs'],tarballSha256:sha,baseCommit:base,candidateVersion};
 const validate=value=>validateFeatureDelivery(value,options);
 validate(data);

 assert.deepEqual(selectDeliveryEvidence(['bin/commands.mjs']).nativeEntries,entries);
 assert.deepEqual(selectDeliveryEvidence(['README.md']).nativeEntries,[]);
 assert.throws(()=>affectedDeliveryFeatures(['bin/unmapped-formal-feature.mjs']));
 for(const entry of entries){
  const missing=structuredClone(data);missing.features[1].entry.classifications=missing.features[1].entry.classifications.filter(item=>item.entry!==entry);assert.throws(()=>validate(missing));
 }
 for(const mutate of [
  value=>value.features[1].entry.generatedStatic.kind='native-dispatch',
  value=>value.features[1].entry.generatedStatic.hosts.codex.kind='native-menu',
  value=>value.features[1].entry.generatedStatic.hosts.codex.entries=entries.slice(1),
  value=>value.features[1].entry.classifications.push(structuredClone(value.features[1].entry.classifications[0])),
  value=>value.features[1].entry.classifications[0].agentSemantics='passed',
  value=>value.features[1].entry.observableOperations=value.features[1].entry.observableOperations.filter(operation=>operation.id!=='controlled-update'),
  value=>value.features[1].entry.observableOperations.find(operation=>operation.id==='doctor').status='unverified',
  value=>value.acceptanceScope.unverifiedAgentSemantics=[],
  value=>value.acceptanceScopeDigest='0'.repeat(64)
 ]){const bad=structuredClone(data);mutate(bad);assert.throws(()=>validate(bad));}

 const rebindReview=test=>{test.independentReview.subjectDigest=observableOperationReviewSubjectDigest(test);};
 const update=value=>value.features[1].entry.observableOperations.find(operation=>operation.id==='controlled-update');
 const updateNormal=value=>update(value).cases.find(test=>test.id==='normal');
 for(const mutate of [
  value=>{const test=updateNormal(value);test.execution={transport:'node',command:'node bin/agent-handoff-kit.mjs update',registryInheritance:'project-npmrc'};rebindReview(test);},
  value=>{const test=update(value).cases.find(test=>test.id==='no-op');test.outcome='matched';rebindReview(test);},
  value=>{const test=update(value).cases.find(test=>test.id==='official-refusal');test.status='unverified';rebindReview(test);},
  value=>{const test=updateNormal(value);delete test.observableResult.transaction;rebindReview(test);},
  value=>{const test=updateNormal(value);test.update.registryVersion=baseVersion;rebindReview(test);},
  value=>{const test=updateNormal(value);test.tarballSha256='f'.repeat(64);rebindReview(test);}
 ]){const bad=structuredClone(data);mutate(bad);assert.throws(()=>validate(bad));}

 const first=value=>value.features[1].entry.observableOperations.find(operation=>operation.id==='doctor').cases[0];
 for(const mutate of [
  value=>{const test=first(value);test.independentReview.reviewer.provenanceId=test.writerProvenance.provenanceId;rebindReview(test);},
  value=>{const test=first(value);test.scenario='boundary';rebindReview(test);},
  value=>first(value).independentReview.subjectDigest='0'.repeat(64)
 ]){const bad=structuredClone(data);mutate(bad);assert.throws(()=>validate(bad));}

 // Lifecycle stages have no reusable entry dependency contract. A supplied
 // reuse or executed artifact must fail rather than be silently ignored.
 const freshInstall=value=>value.features[1].entry.observableOperations.find(operation=>operation.id==='fresh-install').cases[0];
 for(const mutate of [
  value=>{const test=freshInstall(value);test.reuse={};rebindReview(test);},
  value=>{const test=freshInstall(value);test.executedArtifact=baselineArtifact;rebindReview(test);}
 ]){const bad=structuredClone(data);mutate(bad);assert.throws(()=>validate(bad));}

 // A bounded handoff continuation and close mirror readback are real matched
 // observations; refusal or broken-state boundaries remain expected stops.
 const operationCaseById=(value,operationId,caseId)=>value.features[1].entry.observableOperations.find(operation=>operation.id===operationId).cases.find(test=>test.id===caseId);
 for(const mutate of [
  value=>{const test=operationCaseById(value,'handoff-read','truncation');test.outcome='expected-stop';rebindReview(test);},
  value=>{const test=operationCaseById(value,'close-status','mirror-readback');test.outcome='expected-stop';rebindReview(test);},
  value=>{const test=operationCaseById(value,'handoff-read','hash');test.outcome='matched';rebindReview(test);},
  value=>{const test=operationCaseById(value,'doctor','broken');test.outcome='matched';rebindReview(test);}
 ]){const bad=structuredClone(data);mutate(bad);assert.throws(()=>validate(bad));}
 for(const requiredOperation of REQUIRED_OBSERVABLE_OPERATIONS)for(const requiredCase of requiredOperation.cases){
  const bad=structuredClone(data);const test=operationCaseById(bad,requiredOperation.id,requiredCase.id);
  test.outcome=requiredCase.outcome==='matched'?'expected-stop':'matched';rebindReview(test);assert.throws(()=>validate(bad));
 }

 // Reuse may retain a historical deterministic result only if every declared
 // dependency still matches. A shared command mutation must invalidate it.
 const historical=write('historical.tgz','old package');
 const sourceFiles=[
  {path:'bin/commands.mjs',sha256:'c'.repeat(64)},{path:'runtime-core/AGENTS.core.md',sha256:'d'.repeat(64)},
  {path:'bin/agent-handoff-kit.mjs',sha256:'e'.repeat(64)},{path:'bin/official-origin-catalog.mjs',sha256:'f'.repeat(64)},
  {path:'bin/migration-baselines/catalog.json',sha256:'1'.repeat(64)},{path:'bin/upgrade-inventory.mjs',sha256:'2'.repeat(64)},
  {path:'bin/user-rules-router.mjs',sha256:'3'.repeat(64)},{path:'bin/handoff-read.mjs',sha256:'4'.repeat(64)},
  {path:'bin/prompt-mirror-core.mjs',sha256:'5'.repeat(64)},{path:'bin/progress/launch.mjs',sha256:'6'.repeat(64)},
  {path:'packs/onboarding.md',sha256:'7'.repeat(64)},{path:'package.json',sha256:'8'.repeat(64)},
  {path:'bin/installed-file-contract.mjs',sha256:'9'.repeat(64)}
 ];
 const reused=structuredClone(data);const reusedCase=first(reused);const historicalObservable=structuredClone(reusedCase.observableResult);
 const sourceReview=write('historical-review.json',{candidateTarball:historical,cases:[{id:'historic-doctor',scenario:'normal',status:'passed',outcome:'matched',observableResult:historicalObservable}]});
 const comparison=write('historical-comparison.json',{source:{tarballSha256:historical.sha256,files:sourceFiles},candidate:{tarballSha256:sha,files:sourceFiles},reusableCases:[{host:'deterministic-cli',entry:'handoff-kit-check',id:reusedCase.id,scenario:reusedCase.scenario}]});
 reusedCase.executedArtifact=historical;reusedCase.reuse={sourceReview,sourceCase:{id:'historic-doctor',scenario:'normal'},comparison};
 reusedCase.independentReview.subjectDigest=observableOperationReviewSubjectDigest(reusedCase);
 validate(reused);
 const changedDependency=structuredClone(reused);const changedComparison=write('changed-comparison.json',{source:{tarballSha256:historical.sha256,files:sourceFiles},candidate:{tarballSha256:sha,files:sourceFiles.map(file=>file.path==='bin/commands.mjs'?{...file,sha256:'0'.repeat(64)}:file)},reusableCases:[{host:'deterministic-cli',entry:'handoff-kit-check',id:reusedCase.id,scenario:reusedCase.scenario}]});
 first(changedDependency).reuse.comparison=changedComparison;first(changedDependency).independentReview.subjectDigest=observableOperationReviewSubjectDigest(first(changedDependency));assert.throws(()=>validate(changedDependency));

 if(!fixtureRoot)rmSync(work,{recursive:true,force:true});
 console.log('ok: formal evidence separates exact generated static coverage, independently reviewed deterministic operations, and explicitly unverified agent semantics; selector, refusal/no-op boundaries, review binding and dependency reuse counterexamples all fail closed');
 return data;
}
