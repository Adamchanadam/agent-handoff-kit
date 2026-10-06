// Candidate delivery evidence, consumed by the existing full gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deliveredFeatureContracts,dependencyRootMatches,selectDeliveryEvidence,shortcutEntryDependencyRoots} from '../bin/installed-file-contract.mjs';
import {runChecked} from './qa-runner-core.mjs';
export const DELIVERY_STAGES=Object.freeze(['package','freshInstall','upgrade','entry']);
const hash=x=>createHash('sha256').update(x).digest('hex');
// Formal full has three deliberately separate evidence categories. Generated
// files prove the exact static catalogue, deterministic CLI operations prove
// only their recorded I/O, and no record can promote unavailable agent/host
// semantics to PASS.
export const FEATURE_DELIVERY_ACCEPTANCE_SCOPE=Object.freeze({
 generatedStaticContract:'Exact generated adapter/menu inventory for every supported host.',
 observableDeterministicOperations:'Only the named deterministic CLI operations with independently reviewed input/result/readback evidence.',
 unverifiedAgentSemantics:Object.freeze(['agent semantic interpretation','host auto-discovery','shortcut-body dispatch'])
});
export const FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST=hash(JSON.stringify(FEATURE_DELIVERY_ACCEPTANCE_SCOPE));
const deterministicOperationCase=(id,scenario,outcome)=>Object.freeze({id,scenario,outcome});
export const REQUIRED_OBSERVABLE_OPERATIONS=Object.freeze([
 Object.freeze({id:'package',entry:null,cases:Object.freeze([deterministicOperationCase('normal','normal','matched')])}),
 Object.freeze({id:'fresh-install',entry:null,cases:Object.freeze([deterministicOperationCase('normal','normal','matched')])}),
 Object.freeze({id:'upgrade',entry:null,cases:Object.freeze([deterministicOperationCase('normal','normal','matched')])}),
 Object.freeze({id:'handoff-read',entry:'handoff-kit-start',cases:Object.freeze([
  deterministicOperationCase('normal','normal','matched'),deterministicOperationCase('truncation','boundary','matched'),
  deterministicOperationCase('hash','boundary','expected-stop'),deterministicOperationCase('lock','boundary','expected-stop')
 ])}),
 Object.freeze({id:'close-status',entry:'handoff-kit-close',cases:Object.freeze([
  deterministicOperationCase('normal','normal','matched'),deterministicOperationCase('incomplete','boundary','expected-stop'),
  deterministicOperationCase('mirror-readback','boundary','matched')
 ])}),
 Object.freeze({id:'progress-launcher',entry:'handoff-kit-progress',cases:Object.freeze([
  deterministicOperationCase('normal-readback','normal','matched'),deterministicOperationCase('rejected','boundary','expected-stop')
 ])}),
 Object.freeze({id:'doctor',entry:'handoff-kit-check',cases:Object.freeze([
  deterministicOperationCase('normal','normal','matched'),deterministicOperationCase('broken','boundary','expected-stop'),
  deterministicOperationCase('lock','boundary','expected-stop')
 ])}),
 Object.freeze({id:'controlled-update',entry:'handoff-kit-update',cases:Object.freeze([
  deterministicOperationCase('normal','normal','matched'),deterministicOperationCase('official-refusal','boundary','expected-stop'),
  deterministicOperationCase('no-op','boundary','expected-stop'),deterministicOperationCase('version-boundary','boundary','expected-stop'),
  deterministicOperationCase('tarball-boundary','boundary','expected-stop'),deterministicOperationCase('registry-boundary','boundary','expected-stop')
 ])})
]);
export const NATIVE_UPDATE_METADATA_KEYS=Object.freeze(['cliVersion','fromVersion','registryMode','registryVersion','toVersion']);
export const NATIVE_INVOCATION_CASE_SCENARIOS=Object.freeze(['normal','boundary']);
export const NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES=Object.freeze(['input','result']);
export const NATIVE_UPDATE_OBSERVABLE_RESULT_EVIDENCE_ROLES=Object.freeze([...NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES,'state','transaction']);
const stableNativeCaseId=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validateEvidenceReferences(item,label,{root}){
 assert(Array.isArray(item?.evidence)&&item.evidence.length,`${label}: evidence required`);
 for(const ref of item.evidence){
  assert(typeof ref.path==='string'&&ref.path&&/^[a-f0-9]{64}$/.test(ref.sha256),`${label}: invalid evidence reference`);
  const absolute=path.resolve(root,ref.path);
  assert(fs.statSync(absolute).isFile(),`${label}: missing evidence file`);
  assert.equal(hash(fs.readFileSync(absolute)),ref.sha256,`${label}: stale evidence bytes`);
 }
}
function readEvidenceReference(ref,label,{root}){
 validateEvidenceReferences({evidence:[ref]},label,{root});
 const absolute=path.resolve(root,ref.path);
 try{return JSON.parse(fs.readFileSync(absolute,'utf8'));}
 catch(error){throw Error(`${label}: invalid JSON evidence: ${error.message}`);}
}
function exactReference(ref,label,{root}){
 validateEvidenceReferences({evidence:[ref]},label,{root});
 return ref;
}
function comparisonFiles(value,label){
 assert(Array.isArray(value)&&value.length,`${label}: structural dependency inventory required`);
 const files=new Map();
 for(const file of value){
  assert(typeof file?.path==='string'&&file.path&&/^[a-f0-9]{64}$/.test(file.sha256),`${label}: invalid shipped-file identity`);
  assert(!files.has(file.path),`${label}: duplicate shipped-file identity: ${file.path}`);
  files.set(file.path,file.sha256);
 }
 return files;
}
function sourceReviewCase(review,selector,label){
 assert(selector&&typeof selector==='object'&&!Array.isArray(selector),`${label}: source case selector required`);
 assert(typeof selector.id==='string'&&stableNativeCaseId.test(selector.id),`${label}: source case id required`);
 if(Object.hasOwn(selector,'scenario'))assert(NATIVE_INVOCATION_CASE_SCENARIOS.includes(selector.scenario),`${label}: source case scenario invalid`);
 const cases=Array.isArray(review.cases)?review.cases:[review];
 const selected=cases.filter(item=>item?.id===selector.id&&(!Object.hasOwn(selector,'scenario')||item.scenario===selector.scenario));
 assert.equal(selected.length,1,`${label}: source case selector must resolve exactly once`);
 assert.equal(selected[0].status,'passed',`${label}: failed, blocked or unrun source case cannot be reused`);
 return selected[0];
}
function sourceReviewTarballSha256(review,label){
 const candidate=review.candidateTarball??review.candidate;
 const digest=candidate?.sha256??candidate?.tarballSha256;
 assert(typeof digest==='string'&&/^[a-f0-9]{64}$/.test(digest),`${label}: source review candidate artifact required`);
 return digest;
}
function observableResultEvidenceReference(observableResult,role,label,{requiredRoles=NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES}={}){
 assert(observableResult&&typeof observableResult==='object'&&!Array.isArray(observableResult),`${label}: observable-result evidence required`);
 const keys=Object.keys(observableResult);
 assert(requiredRoles.every(key=>keys.includes(key))&&keys.every(key=>NATIVE_UPDATE_OBSERVABLE_RESULT_EVIDENCE_ROLES.includes(key)),`${label}: observable-result evidence is incomplete or has unsupported fields`);
 const ref=observableResult[role];
 assert(typeof ref?.path==='string'&&ref.path&&/^[a-f0-9]{64}$/.test(ref.sha256),`${label}: invalid observable-result ${role} evidence`);
 return {path:ref.path,sha256:ref.sha256};
}
function canonicalEvidenceFileIdentity(ref,{root}){
 const canonical=fs.realpathSync(path.resolve(root,ref.path));
 return process.platform==='win32'?canonical.toLocaleLowerCase('en-US'):canonical;
}
function validateObservableResultEvidence(test,label,{root,requiredRoles=NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES}={}){
 const observableResult=test?.observableResult;
 for(const role of requiredRoles)observableResultEvidenceReference(observableResult,role,label,{requiredRoles});
 const roles=Object.keys(observableResult??{});
 const references=roles.map(role=>observableResultEvidenceReference(observableResult,role,label,{requiredRoles}));
 for(const [index,role] of roles.entries())validateEvidenceReferences({evidence:[references[index]]},`${label}/observableResult/${role}`,{root});
 const independentlyReadable=new Set(references.map(ref=>`${canonicalEvidenceFileIdentity(ref,{root})}\u0000${ref.sha256}`));
 assert.equal(independentlyReadable.size,references.length,`${label}: observable input/result and any required state/transaction must be separately readable evidence`);
 return observableResult;
}
function validateCaseReuse(test,{root,label,host,entry,dependencyRoots,tarballSha256}){
 if(!Object.hasOwn(test,'reuse'))return;
 assert(test.reuse&&typeof test.reuse==='object'&&!Array.isArray(test.reuse),`${label}: reuse must be an object`);
 assert.deepEqual(Object.keys(test.reuse).sort(),['comparison','sourceCase','sourceReview'],`${label}: unsupported reuse fields`);
 const artifact=exactReference(test.executedArtifact,`${label}/executed artifact`,{root});
 assert.notEqual(artifact.sha256,tarballSha256,`${label}: reuse cannot relabel current execution as historical`);
 const review=readEvidenceReference(test.reuse.sourceReview,`${label}/source review`,{root});
 const original=sourceReviewCase(review,test.reuse.sourceCase,`${label}/source review`);
 assert.equal(sourceReviewTarballSha256(review,`${label}/source review`),artifact.sha256,`${label}: source review does not bind the executed artifact`);
 if(typeof original.scenario==='string')assert.equal(original.scenario,test.scenario,`${label}: source review scenario does not match reused case`);
 if(typeof original.outcome==='string')assert.equal(original.outcome,test.outcome,`${label}: source review outcome does not match reused case`);
 assert.deepEqual(Object.keys(test.observableResult).sort(),Object.keys(original.observableResult??{}).sort(),`${label}: source review observable-result shape does not match reused execution`);
 for(const role of Object.keys(test.observableResult))assert.deepEqual(test.observableResult[role],observableResultEvidenceReference(original.observableResult,role,`${label}/source review`,{requiredRoles:Object.keys(test.observableResult)}),`${label}: source review ${role} does not match reused observable result`);
 const comparison=readEvidenceReference(test.reuse.comparison,`${label}/comparison`,{root});
 assert(comparison&&typeof comparison==='object'&&!Array.isArray(comparison),`${label}: comparison required`);
 assert.equal(comparison.source?.tarballSha256,artifact.sha256,`${label}: comparison source artifact mismatch`);
 assert.equal(comparison.candidate?.tarballSha256,tarballSha256,`${label}: comparison candidate artifact mismatch`);
 const sourceFiles=comparisonFiles(comparison.source?.files,`${label}/comparison source`);
 const candidateFiles=comparisonFiles(comparison.candidate?.files,`${label}/comparison candidate`);
 for(const dependency of dependencyRoots){
  const sourcePaths=[...sourceFiles.keys()].filter(file=>dependencyRootMatches(file,dependency));
  const candidatePaths=[...candidateFiles.keys()].filter(file=>dependencyRootMatches(file,dependency));
  assert(sourcePaths.length&&candidatePaths.length,`${label}: comparison omits behavior dependency: ${dependency}`);
  assert.deepEqual(candidatePaths.sort(),sourcePaths.sort(),`${label}: behavior dependency membership changed and requires fresh execution: ${dependency}`);
  for(const source of sourcePaths)assert.equal(sourceFiles.get(source),candidateFiles.get(source),`${label}: changed behavior dependency requires fresh execution: ${source}`);
 }
 assert(Array.isArray(comparison.reusableCases),`${label}: comparison reusable case list required`);
 const matches=comparison.reusableCases.filter(item=>item?.host===host&&item.entry===entry&&item.id===test.id&&item.scenario===test.scenario);
 assert.equal(matches.length,1,`${label}: comparison does not accept this exact case`);
}
export function observableOperationReviewSubjectDigest(operation){
 const subject=structuredClone(operation);delete subject.independentReview;
 return hash(JSON.stringify(subject));
}
function validateObservableOperationReview(operation,label,{root}){
 const review=operation.independentReview;
 assert(review&&typeof review==='object'&&!Array.isArray(review),`${label}: independently reviewed observable operation required`);
 assert.equal(review.verdict,'accepted',`${label}: observable operation review is not accepted`);
 assert(operation.writerProvenance&&typeof operation.writerProvenance==='object'&&!Array.isArray(operation.writerProvenance),`${label}: operation writer provenance required`);
 assert.equal(operation.writerProvenance.role,'workspace-writer',`${label}: operation writer role is invalid`);
 assert(typeof operation.writerProvenance.provenanceId==='string'&&operation.writerProvenance.provenanceId,`${label}: operation writer provenanceId required`);
 assert.equal(review.reviewer?.role,'independent-readonly-reviewer',`${label}: observable operation reviewer must be independent-readonly-reviewer`);
 assert(typeof review.reviewer?.provenanceId==='string'&&review.reviewer.provenanceId,`${label}: observable operation reviewer provenanceId required`);
 assert.notEqual(review.reviewer.provenanceId,operation.writerProvenance.provenanceId,`${label}: executor/self-authored observable result cannot pass as independent evidence`);
 assert.equal(review.subjectDigest,observableOperationReviewSubjectDigest(operation),`${label}: observable operation review does not bind this exact record`);
 validateEvidenceReferences(review,`${label}/independentReview`,{root});
}
function validateObservableOperation(operation,required,{root,tarballSha256,baseVersion,candidateVersion}){
 const label=`shortcuts/observableOperations/${required.id}`;
 assert(operation&&typeof operation==='object'&&!Array.isArray(operation),`${label}: required operation is missing`);
 assert.equal(operation.id,required.id,`${label}: operation id drifted`);
 assert.equal(operation.entry,required.entry,`${label}: operation entry drifted`);
 assert.equal(operation.status,'passed',`${label}: deterministic operation is not passed`);
 assert.equal(operation.kind,'observable-deterministic-operation',`${label}: operation must not claim agent semantics`);
 assert.equal(operation.tarballSha256,tarballSha256,`${label}: candidate identity mismatch`);
 if(!required.entry)assert(!Object.hasOwn(operation,'reuse')&&!Object.hasOwn(operation,'executedArtifact'),`${label}: lifecycle operation reuse is unsupported`);
 assert(Array.isArray(operation.cases),`${label}: operation cases required`);
 assert.deepEqual(operation.cases.map(item=>item?.id).sort(),required.cases.map(item=>item.id).sort(),`${label}: operation cases are incomplete, duplicated or downgraded`);
 for(const test of operation.cases){
  const caseLabel=`${label}/${test.id}`;
  const requiredCase=required.cases.find(item=>item.id===test.id);
  assert(requiredCase,`${caseLabel}: operation case is not permitted`);
  assert(['normal','boundary'].includes(test.scenario),`${caseLabel}: scenario required`);
  assert.equal(test.status,'passed',`${caseLabel}: actual deterministic operation did not pass`);
  assert.equal(test.kind,'observable-deterministic-operation',`${caseLabel}: file/static evidence cannot replace actual operation`);
  assert(['matched','expected-stop'].includes(test.outcome),`${caseLabel}: operation outcome required`);
  assert.equal(test.scenario,requiredCase.scenario,`${caseLabel}: operation scenario is not permitted for this case`);
  assert.equal(test.outcome,requiredCase.outcome,`${caseLabel}: operation outcome is not permitted for this case`);
  if(Object.hasOwn(test,'tarballSha256'))assert.equal(test.tarballSha256,tarballSha256,`${caseLabel}: operation case tarball identity mismatch`);
  if(!required.entry)assert(!Object.hasOwn(test,'reuse')&&!Object.hasOwn(test,'executedArtifact'),`${caseLabel}: lifecycle operation reuse is unsupported`);
  for(const field of ['input','expected','actual','readback'])assert(typeof test[field]==='string'&&test[field].trim(),`${caseLabel}: ${field} required`);
  validateEvidenceReferences(test,caseLabel,{root});
  validateObservableResultEvidence(test,caseLabel,{root,requiredRoles:test.id==='normal'&&required.id==='controlled-update'?NATIVE_UPDATE_OBSERVABLE_RESULT_EVIDENCE_ROLES:NATIVE_OBSERVABLE_RESULT_EVIDENCE_ROLES});
  validateObservableOperationReview(test,caseLabel,{root});
  if(required.entry)validateCaseReuse(test,{root,label:caseLabel,host:'deterministic-cli',entry:required.entry,dependencyRoots:shortcutEntryDependencyRoots(required.entry),tarballSha256});
  if(required.id==='controlled-update'){
   assert(test.execution&&typeof test.execution==='object'&&!Array.isArray(test.execution),`${caseLabel}: update execution metadata required`);
   if(test.id==='normal'){
    assert.equal(test.execution.transport,'npx-registry',`${caseLabel}: controlled update must use npx --registry`);
    assert(typeof test.execution.command==='string'&&/\bnpx\s+--registry\s+\S+/.test(test.execution.command),`${caseLabel}: direct Node or .npmrc-only update is not controlled-registry evidence`);
    assert.equal(test.execution.registryInheritance,'npx-invocation',`${caseLabel}: update registry inheritance must be observed at npx invocation`);
    validateNativeUpdateNormal({...test,kind:'observable-result'},{root,label:caseLabel,candidateVersion,baseVersion,tarballSha256,registryMode:'controlled',requireOwnTarball:Object.hasOwn(test,'tarballSha256')});
   }
  }
 }
}
function validateShortcutEntry(item,contract,selected,{root,tarballSha256,baseVersion,candidateVersion}){
 const label='shortcuts/entry';
 assert(item.generatedStatic&&typeof item.generatedStatic==='object'&&!Array.isArray(item.generatedStatic),`${label}: generated static contract required`);
 const staticContract=item.generatedStatic;
 assert.equal(staticContract.kind,'generated-static-contract',`${label}: generated menu/adapters must not claim native dispatch`);
 assert.deepEqual(staticContract.selectedEntries,[...selected.nativeEntries],`${label}: selector structural coverage drifted`);
 assert.deepEqual(Object.keys(staticContract.hosts??{}).sort(),[...contract.hosts].sort(),`${label}: generated host coverage incomplete`);
 const catalog=[...contract.nativeInvocationEntries].sort();
 for(const host of contract.hosts){
  const record=staticContract.hosts[host];
  assert(record&&typeof record==='object'&&!Array.isArray(record),`${label}/${host}: generated adapter/menu record required`);
  assert.deepEqual(Object.keys(record).sort(),['entries','evidence','kind','observation','status'],`${label}/${host}: generated coverage cannot claim invocation or dispatch`);
  assert.equal(record.status,'passed',`${label}/${host}: generated adapter/menu is not checked`);
  assert.equal(record.kind,'generated-adapter-menu',`${label}/${host}: menu cannot claim native dispatch`);
  assert.deepEqual([...record.entries].sort(),catalog,`${label}/${host}: generated catalog is incomplete`);
  validateEvidenceReferences(record,`${label}/${host}`,{root});
 }
 assert(Array.isArray(item.classifications),`${label}: entry classifications required`);
 assert.deepEqual(item.classifications.map(record=>record?.entry).sort(),[...selected.nativeEntries].sort(),`${label}: classifications must cover each selected entry exactly once`);
 const deterministicEntries=new Set(REQUIRED_OBSERVABLE_OPERATIONS.map(operation=>operation.entry));
 for(const classification of item.classifications){
  assert.deepEqual(Object.keys(classification).sort(),['agentSemantics','entry','hostAutoDiscovery','shortcutDispatch','structuralCoverage'],`${label}/${classification.entry}: unsupported classification fields`);
  assert.equal(classification.structuralCoverage,'passed',`${label}/${classification.entry}: selected structural coverage is not passed`);
  assert.equal(classification.agentSemantics,'unverified',`${label}/${classification.entry}: agent semantics must remain unverified without independent output`);
  assert.equal(classification.hostAutoDiscovery,'unverified',`${label}/${classification.entry}: host auto-discovery must remain unverified`);
  assert.equal(classification.shortcutDispatch,'unverified',`${label}/${classification.entry}: shortcut dispatch must remain unverified`);
  assert(deterministicEntries.has(classification.entry)||classification.entry==='handoff-kit-align'||classification.entry==='handoff-kit-onboard'||classification.entry==='handoff-kit-remember'||classification.entry==='handoff-kit-help',`${label}: unknown classified entry`);
 }
 assert(Array.isArray(item.observableOperations),`${label}: deterministic operations required`);
 assert.deepEqual(item.observableOperations.map(operation=>operation?.id).sort(),REQUIRED_OBSERVABLE_OPERATIONS.map(operation=>operation.id).sort(),`${label}: mandatory deterministic operations cannot be omitted or replaced by agent claims`);
 for(const required of REQUIRED_OBSERVABLE_OPERATIONS)validateObservableOperation(item.observableOperations.find(operation=>operation.id===required.id),required,{root,tarballSha256,baseVersion,candidateVersion});
}
// Both full and postpublish use this exact structural check. It binds observable
// results, not unavailable platform telemetry about host discovery or dispatch.
export function validateNativeUpdateNormal(test,{root,label,candidateVersion,baseVersion,tarballSha256,registryMode,requireOwnTarball=false}){
 assert(test&&typeof test==='object'&&!Array.isArray(test),`${label}: native update case required`);
 assert.equal(test.status,'passed',`${label}: native update did not pass`);
 assert(typeof test.observation==='string'&&test.observation.trim(),`${label}: native update observation required`);
 validateEvidenceReferences(test,label,{root});
 assert.equal(test.scenario,'normal',`${label}: native update must be a normal case`);
 assert.equal(test.kind,'observable-result',`${label}: native update must carry an observable result`);
 assert.equal(test.outcome,'matched',`${label}: refused or incomplete update is not normal acceptance`);
 for(const field of ['input','expected','actual','readback'])assert(typeof test[field]==='string'&&test[field].trim(),`${label}: ${field} required`);
 validateObservableResultEvidence(test,label,{root,requiredRoles:NATIVE_UPDATE_OBSERVABLE_RESULT_EVIDENCE_ROLES});
 const update=test.update;
 assert(update&&typeof update==='object'&&!Array.isArray(update),`${label}: update metadata required`);
 assert.deepEqual(Object.keys(update).sort(),[...NATIVE_UPDATE_METADATA_KEYS].sort(),`${label}: update metadata is incomplete or has unsupported fields`);
 assert.equal(update.registryMode,registryMode,`${label}: registry mode mismatch`);
 assert.equal(update.registryVersion,candidateVersion,`${label}: registry version does not select the accepted candidate`);
 assert.equal(update.cliVersion,candidateVersion,`${label}: executed CLI version does not match the accepted candidate`);
 assert.equal(update.fromVersion,baseVersion,`${label}: update did not start from the accepted published baseline`);
 assert.equal(update.toVersion,candidateVersion,`${label}: update did not reach the accepted candidate`);
 const observedTarball=requireOwnTarball?test.tarballSha256:tarballSha256;
  assert.equal(observedTarball,tarballSha256,`${label}: native update artifact identity mismatch`);
}
// This receipt binds an independently judged observable result to its exact
// structural record. It does not prove platform telemetry or the declared
// reviewer's cryptographic identity.
export function nativeUpdateReviewSubjectDigest(test){
 const subject=structuredClone(test);delete subject.nativeReview;
 return hash(JSON.stringify(subject));
}
export function validateNativeUpdateReview(test,{root,label,roleIsolation}){
 const review=test?.nativeReview;
 assert(review&&typeof review==='object'&&!Array.isArray(review),`${label}: independent native review receipt required`);
 assert.equal(review.verdict,'accepted',`${label}: native review is not accepted`);
 assert.equal(review.provenanceBoundary,roleIsolation.provenanceBoundary,`${label}: native review provenance boundary is missing or drifted`);
 assert(test.writerProvenance&&typeof test.writerProvenance==='object'&&!Array.isArray(test.writerProvenance),`${label}: native update writer provenance required`);
 assert.equal(test.writerProvenance.role,roleIsolation.writerRole,`${label}: native update writer role is invalid`);
 assert(typeof test.writerProvenance.provenanceId==='string'&&test.writerProvenance.provenanceId,`${label}: native update writer provenanceId required`);
 assert.equal(review.reviewer?.role,roleIsolation.reviewerRole,`${label}: native review reviewer must be independent-readonly-reviewer`);
 assert(typeof review.reviewer?.provenanceId==='string'&&review.reviewer.provenanceId,`${label}: native review reviewer provenanceId required`);
 assert.notEqual(review.reviewer.provenanceId,test.writerProvenance.provenanceId,`${label}: writer self-review cannot satisfy native review`);
 assert(typeof review.subjectDigest==='string'&&/^[a-f0-9]{64}$/.test(review.subjectDigest),`${label}: native review subjectDigest required`);
 assert.equal(review.subjectDigest,nativeUpdateReviewSubjectDigest(test),`${label}: native review does not bind this exact update observation`);
 validateEvidenceReferences(review,`${label}/nativeReview`,{root});
}
export async function resolveFeatureDeliveryBase(root,candidateVersion,{head='HEAD'}={}){
 assert(/^\d+\.\d+\.\d+$/.test(candidateVersion),'Candidate baseline requires a stable version');
 const compare=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;};
 const git=async(args,label)=>(await runChecked('git',args,label,{cwd:root})).stdout.trim();
 const candidateCommit=await git(['rev-parse',head+'^{commit}'],'delivery candidate identity');
 const tags=await git(['tag','--merged',candidateCommit],'delivery baseline tags');
 const previous=tags.split(/\r?\n/).filter(t=>/^v\d+\.\d+\.\d+$/.test(t)&&compare(t.slice(1),candidateVersion)<0).sort((a,b)=>compare(b.slice(1),a.slice(1)))[0];
 assert(previous,'Candidate has no preceding stable release tag');
 const baseCommit=await git(['rev-parse',previous+'^{commit}'],'delivery baseline identity');
 const changedFiles=(await git(['diff','--name-only',baseCommit,candidateCommit],'affected delivery sources')).split(/\r?\n/).filter(Boolean);
 return {baseVersion:previous.slice(1),baseCommit,changedFiles};
}
export function affectedDeliveryFeatures(changedFiles){
 return selectDeliveryEvidence(changedFiles).featureIds;
}
export function validateFeatureDelivery(delivery,{changedFiles,tarballSha256,baseCommit,root,baselineNpm,candidateVersion}){
 assert(delivery?.schemaVersion===1,'Missing featureDelivery evidence');
 assert.deepEqual(delivery.acceptanceScope,FEATURE_DELIVERY_ACCEPTANCE_SCOPE,'Feature evidence acceptance scope drifted');
 assert.equal(delivery.acceptanceScopeDigest,FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST,'Feature evidence acceptance scope digest drifted');
 assert.equal(delivery.tarballSha256,tarballSha256,'Feature evidence package identity mismatch');
 assert.equal(delivery.baseCommit,baseCommit,'Feature evidence baseline mismatch');
 assert(Array.isArray(delivery.features),'Missing affected features');
 let baselineHash;
 if(delivery.features.some(f=>f.upgrade?.status==='passed')){
  const artifact=delivery.baselineArtifact;
  assert(typeof artifact?.path==='string'&&/^[a-f0-9]{64}$/.test(artifact.sha256),'Actual baseline tarball is required');
  const bytes=fs.readFileSync(path.resolve(root,artifact.path));baselineHash=hash(bytes);
  assert.equal(baselineHash,artifact.sha256,'Baseline artifact bytes do not match');
  if(baselineNpm){
   assert.equal('sha512-'+createHash('sha512').update(bytes).digest('base64'),baselineNpm.integrity,'Baseline is not the published npm artifact');
   assert.equal(createHash('sha1').update(bytes).digest('hex'),baselineNpm.shasum,'Baseline npm shasum mismatch');
  }
 }
 const selected=selectDeliveryEvidence(changedFiles),expected=selected.featureIds;
 assert.deepEqual(delivery.features.map(x=>x.id).sort(),expected,'Affected feature evidence missing, duplicated or stale');
 const references=(item,label)=>validateEvidenceReferences(item,label,{root});
 function passed(item,label){
  assert.equal(item?.status,'passed',`${label}: delivery is not passed`);
  assert(typeof item.observation==='string'&&item.observation.trim(),`${label}: missing observed result`);
  references(item,label);
 }
 for(const feature of delivery.features){
  const contract=deliveredFeatureContracts.find(c=>c.id===feature.id);
  for(const stage of DELIVERY_STAGES){
   const item=feature[stage],label=feature.id+'/'+stage;
   if(item?.status==='not_applicable'){
    // A shipped feature always has a package; supported hosts are never N/A.
    assert(contract.notApplicableStages?.includes(stage),`${label}: required route cannot be N/A`);
    assert(typeof item.reason==='string'&&item.reason.trim(),`${label}: N/A requires a reason`);
    references(item,label);continue;
   }
   passed(item,label);
   assert.equal(item.tarballSha256,tarballSha256,`${label}: must bind actual candidate package`);
   if(stage==='freshInstall')assert.equal(item.command,'init',`${label}: normal init required`);
   if(stage==='upgrade'){
    assert.equal(item.command,'upgrade',`${label}: normal upgrade required`);
    assert.equal(item.baselineVersion,delivery.baseVersion,`${label}: published baseline required`);
    assert.equal(item.baselineTarballSha256,baselineHash,`${label}: actual old package identity required`);
   }
   if(stage==='entry'){
    assert(typeof item.entry==='string'&&item.entry.trim(),`${label}: use entry required`);
    if(contract.hosts)validateShortcutEntry(item,contract,selected,{root,tarballSha256,baseVersion:delivery.baseVersion,candidateVersion});
   }
  }
 }
 return expected;
}
