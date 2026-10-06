// Candidate delivery evidence, consumed by the existing full gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deliveredFeatureContracts,dependencyRootMatches,selectDeliveryEvidence,shortcutEntryDependencyRoots} from '../bin/installed-file-contract.mjs';
import {runChecked} from './qa-runner-core.mjs';
export const DELIVERY_STAGES=Object.freeze(['package','freshInstall','upgrade','entry']);
const hash=x=>createHash('sha256').update(x).digest('hex');
export const NATIVE_UPDATE_METADATA_KEYS=Object.freeze(['cliVersion','fromVersion','registryMode','registryVersion','toVersion']);
export const NATIVE_INVOCATION_CASE_SCENARIOS=Object.freeze(['normal','boundary']);
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
function sourceReviewRawReference(source,role,label){
 const raw=source.raw??source.rawEvidence;
 assert(raw,`${label}: source raw evidence required`);
 let ref;
 if(Array.isArray(raw)){
  const file={prompt:'prompt.txt',context:'context.json',trace:'trace.jsonl'}[role];
  const matches=raw.filter(item=>typeof item?.path==='string'&&item.path.replace(/\\/g,'/').endsWith('/'+file));
  assert.equal(matches.length,1,`${label}: source ${role} evidence must resolve exactly once`);
  ref=matches[0];
 }else ref=raw[role];
 assert(typeof ref?.path==='string'&&ref.path&&/^[a-f0-9]{64}$/.test(ref.sha256),`${label}: invalid source ${role} evidence`);
 return {path:ref.path,sha256:ref.sha256};
}
function validateCaseReuse(test,{root,label,host,entry,dependencyRoots,tarballSha256}){
 if(!Object.hasOwn(test,'reuse'))return;
 assert(test.reuse&&typeof test.reuse==='object'&&!Array.isArray(test.reuse),`${label}: reuse must be an object`);
 assert.deepEqual(Object.keys(test.reuse).sort(),['comparison','sourceCase','sourceReview'],`${label}: unsupported reuse fields`);
 const artifact=exactReference(test.execution?.artifact,`${label}/execution artifact`,{root});
 assert.notEqual(artifact.sha256,tarballSha256,`${label}: reuse cannot relabel current execution as historical`);
 const review=readEvidenceReference(test.reuse.sourceReview,`${label}/source review`,{root});
 const original=sourceReviewCase(review,test.reuse.sourceCase,`${label}/source review`);
 assert.equal(sourceReviewTarballSha256(review,`${label}/source review`),artifact.sha256,`${label}: source review does not bind the executed artifact`);
 if(typeof original.scenario==='string')assert.equal(original.scenario,test.scenario,`${label}: source review scenario does not match reused case`);
 if(typeof original.outcome==='string')assert.equal(original.outcome,test.outcome,`${label}: source review outcome does not match reused case`);
 for(const role of ['prompt','context','trace'])assert.deepEqual(test.execution[role],sourceReviewRawReference(original,role,`${label}/source review`),`${label}: source review ${role} does not match reused execution`);
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
// Both full and postpublish use this exact structural check. It deliberately
// binds inspectable raw artifacts, not a claim that the actor was uncoached.
export function validateNativeUpdateNormal(test,{root,label,candidateVersion,baseVersion,tarballSha256,registryMode,requireOwnTarball=false}){
 assert(test&&typeof test==='object'&&!Array.isArray(test),`${label}: native update case required`);
 assert.equal(test.status,'passed',`${label}: native update did not pass`);
 assert(typeof test.observation==='string'&&test.observation.trim(),`${label}: native update observation required`);
 validateEvidenceReferences(test,label,{root});
 assert.equal(test.scenario,'normal',`${label}: native update must be a normal case`);
 assert.equal(test.kind,'native-invocation',`${label}: native update must be an actual invocation`);
 assert.equal(test.outcome,'matched',`${label}: refused or incomplete update is not normal acceptance`);
 for(const field of ['input','expected','actual','readback'])assert(typeof test[field]==='string'&&test[field].trim(),`${label}: ${field} required`);
 assert.equal(test.execution?.mode,'fresh-session',`${label}: native update must retain the original fresh-session execution`);
 for(const role of ['prompt','context','trace']){
  assert(test.execution?.[role],`${label}: raw ${role} evidence required`);
  validateEvidenceReferences({evidence:[test.execution[role]]},`${label}/${role}`,{root});
 }
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
// This receipt binds an independently judged native observation to its exact
// structural record. It intentionally does not interpret prompt/context/trace
// text or claim cryptographic identity for the declared reviewer.
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
    if(contract.hosts){
     assert.deepEqual(Object.keys(item.hosts??{}).sort(),[...contract.hosts].sort(),`${label}: native hosts incomplete`);
     const requiredHosts=contract.nativeAcceptanceHosts??contract.hosts;
     assert(requiredHosts.length&&requiredHosts.every(h=>contract.hosts.includes(h)),`${label}: invalid native acceptance scope`);
     for(const host of contract.hosts){
      const result=item.hosts[host];
      if(!requiredHosts.includes(host)&&result?.menu?.status==='unverified'&&result?.invocation?.status==='unverified'){
       assert(typeof result.reason==='string'&&result.reason.trim(),`${label}/${host}: unverified scope requires a reason`);
       references(result,`${label}/${host}/scope`);
       continue;
      }
      passed(result?.menu,`${label}/${host}/menu`);
      passed(item.hosts[host]?.invocation,`${label}/${host}/invocation`);
      assert.equal(item.hosts[host].menu.kind,'native-menu',`${label}: file/metadata checks are not native menu acceptance`);
      assert.equal(item.hosts[host].invocation.kind,'native-invocation',`${label}: file checks are not native invocation`);
      const catalogEntries=[...contract.nativeInvocationEntries].sort(),nativeEntries=[...selected.nativeEntries].sort();
      assert(catalogEntries.length&&catalogEntries.every(e=>typeof e==='string'&&/^handoff-kit-[a-z0-9-]+$/.test(e))&&new Set(catalogEntries).size===catalogEntries.length,`${label}: invalid or duplicate catalog commands`);
      assert(nativeEntries.length&&nativeEntries.every(entry=>catalogEntries.includes(entry)),`${label}: invalid selected native command scope`);
      assert(Array.isArray(result.menu.entries),`${label}/${host}/menu: command inventory required`);
      assert.deepEqual([...result.menu.entries].sort(),catalogEntries,`${label}/${host}/menu: generated catalog is incomplete`);
      assert(Array.isArray(result.invocation.entries),`${label}/${host}/invocation: command inventory required`);
      assert.deepEqual([...result.invocation.entries].sort(),nativeEntries,`${label}/${host}/invocation: native diff scope is incomplete or overbroad`);
      const records=result.invocation.results;
      assert(Array.isArray(records),`${label}/${host}: individual invocation results required`);
      assert.deepEqual(records.map(r=>r.entry).sort(),nativeEntries,`${label}/${host}: individual command coverage incomplete or overbroad`);
      for(const record of records){
       const commandLabel=`${label}/${host}/${record.entry}`;
       assert.equal(record.kind,'native-invocation',`${commandLabel}: actual native invocation required`);
       assert.equal(record.tarballSha256,tarballSha256,`${commandLabel}: candidate identity mismatch`);
       assert(['freshInstall','upgrade'].includes(record.installRoute),`${commandLabel}: installed candidate route required`);
        assert(Array.isArray(record.cases)&&record.cases.length,`${commandLabel}: normal and boundary cases required`);
        const caseIds=new Set(),scenarios=new Set();
        for(const test of record.cases){
         assert(typeof test.id==='string'&&stableNativeCaseId.test(test.id),`${commandLabel}: stable case id required`);
         assert(!caseIds.has(test.id),`${commandLabel}: duplicate case id: ${test.id}`);caseIds.add(test.id);
         assert(NATIVE_INVOCATION_CASE_SCENARIOS.includes(test.scenario),`${commandLabel}/${test.id}: unsupported scenario`);scenarios.add(test.scenario);
         const caseLabel=`${commandLabel}/${test.id}`;
        passed(test,caseLabel);
        for(const field of ['input','expected','actual','readback'])assert(typeof test[field]==='string'&&test[field].trim(),`${caseLabel}: ${field} required`);
        assert.equal(test.kind,'native-invocation',`${caseLabel}: file checks cannot replace command execution`);
        // This binds inspectable provenance; it cannot prove an actor was not coached.
        // The existing independent reviewer must inspect the raw prompt/context/trace.
        assert.equal(test.execution?.mode,'fresh-session',`${caseLabel}: guided or inherited-context execution is not clean user-journey acceptance`);
        for(const role of ['prompt','context','trace']){
         assert(test.execution[role],`${caseLabel}: raw ${role} evidence required`);
         references({evidence:[test.execution[role]]},`${caseLabel}/${role}`);
        }
        assert(['matched','expected-stop'].includes(test.outcome),`${caseLabel}: execution outcome required`);
        if(test.scenario==='normal')assert.equal(test.outcome,'matched',`${caseLabel}: blocked execution is not normal acceptance`);
        const dependencyRoots=feature.id==='shortcuts'?shortcutEntryDependencyRoots(record.entry):contract.sources;
        validateCaseReuse(test,{root,label:caseLabel,host,entry:record.entry,dependencyRoots,tarballSha256});
         if(record.entry==='handoff-kit-update'&&test.scenario==='normal'){
         assert.equal(record.installRoute,'upgrade',`${caseLabel}: update normal must be an old-to-candidate upgrade transaction`);
         validateNativeUpdateNormal(test,{root,label:caseLabel,candidateVersion,baseVersion:delivery.baseVersion,tarballSha256,registryMode:'controlled'});
         }
        }
        assert(scenarios.has('normal')&&scenarios.has('boundary'),`${commandLabel}: normal and boundary coverage incomplete`);
      }
     }
    }
   }
  }
 }
 return expected;
}
