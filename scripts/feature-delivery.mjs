// Candidate delivery evidence, consumed by the existing full gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deliveredFeatureContracts} from '../bin/installed-file-contract.mjs';
export const DELIVERY_STAGES=Object.freeze(['package','freshInstall','upgrade','entry']);
const hash=x=>createHash('sha256').update(x).digest('hex');
export function affectedDeliveryFeatures(changedFiles){
 const ids=new Set();
 for(const file of changedFiles){
  if(!/^(bin\/|runtime-core\/|packs\/|package\.json$)/.test(file))continue;
  const owners=deliveredFeatureContracts.filter(c=>c.sources.some(s=>s.endsWith('/')?file.startsWith(s):file===s));
  assert(owners.length,`Unmapped shipped feature source: ${file}`);
  for(const owner of owners)ids.add(owner.id);
 }
 return [...ids].sort();
}
export function validateFeatureDelivery(delivery,{changedFiles,tarballSha256,baseCommit,root,baselineNpm}){
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
 const expected=affectedDeliveryFeatures(changedFiles);
 assert.deepEqual(delivery.features.map(x=>x.id).sort(),expected,'Affected feature evidence missing, duplicated or stale');
 function references(item,label){
  assert(Array.isArray(item.evidence)&&item.evidence.length,`${label}: evidence required`);
  for(const ref of item.evidence){
   assert(typeof ref.path==='string'&&ref.path&&/^[a-f0-9]{64}$/.test(ref.sha256),`${label}: invalid evidence reference`);
   const absolute=path.resolve(root,ref.path);
   assert(fs.statSync(absolute).isFile(),`${label}: missing evidence file`);
   assert.equal(hash(fs.readFileSync(absolute)),ref.sha256,`${label}: stale evidence bytes`);
  }
 }
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
      for(const entry of contract.nativeInvocationEntries??[])assert(Array.isArray(result.invocation.entries)&&result.invocation.entries.every(x=>typeof x==='string')&&result.invocation.entries.includes(entry),`${label}/${host}: missing invocation of ${entry}`);
     }
    }
   }
  }
 }
 return expected;
}
