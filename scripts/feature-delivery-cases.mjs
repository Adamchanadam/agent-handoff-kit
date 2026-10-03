import assert from 'node:assert/strict';
import {affectedDeliveryFeatures,validateFeatureDelivery} from './feature-delivery.mjs';
export function checkFeatureDeliveryEvidence({root,evidencePath,evidenceSha256}){
 const sha='a'.repeat(64),base='b'.repeat(40),ref={path:evidencePath,sha256:evidenceSha256};
 const observed={status:'passed',observation:'Observed through the named entry',evidence:[ref]};
 const stage={...observed,tarballSha256:sha};
 const data={schemaVersion:1,tarballSha256:sha,baseCommit:base,baseVersion:'0.4.0',baselineArtifact:ref,features:[{id:'shortcuts',package:stage,freshInstall:{...stage,command:'init'},upgrade:{...stage,command:'upgrade',baselineVersion:'0.4.0',baselineTarballSha256:evidenceSha256},entry:{...stage,entry:'help in native tools',hosts:Object.fromEntries(['claude','gemini','codex','antigravity'].map(h=>[h,{menu:{...observed,kind:'native-menu'},invocation:{...observed,kind:'native-invocation',entries:['handoff-kit-progress']}}]))}}]};
 const options={root,changedFiles:['bin/commands.mjs'],tarballSha256:sha,baseCommit:base};
 const validate=d=>validateFeatureDelivery(d,options);
 validate(data);
 const representative=structuredClone(data);
 for(const host of ['claude','gemini','antigravity'])representative.features[0].entry.hosts[host]={menu:{status:'unverified'},invocation:{status:'unverified'},reason:'Native acceptance scope is Codex; other hosts are not claimed tested',evidence:[ref]};
 validate(representative);
 for(const mutate of [d=>delete d.features[0].entry.hosts.codex,d=>d.features[0].entry.hosts.codex=structuredClone(d.features[0].entry.hosts.claude),d=>delete d.features[0].entry.hosts.claude.reason,d=>delete d.features[0].entry.hosts.claude.evidence,d=>d.features[0].entry.hosts.codex.menu.kind='file-exists']){
  const bad=structuredClone(representative);mutate(bad);assert.throws(()=>validate(bad));
 }
 for(const mutate of [d=>d.features[0].entry.hosts.codex.invocation.entries=['handoff-kit-help'],d=>delete d.features[0].entry.hosts.codex.invocation.entries,d=>d.features[0].entry.hosts.codex.invocation.entries='handoff-kit-help only; handoff-kit-progress NOT tested',d=>delete d.features[0].package,d=>delete d.features[0].upgrade,d=>d.features=[],d=>d.tarballSha256='d'.repeat(64),d=>d.features[0].entry.hosts.codex.menu.kind='file-exists',d=>d.features[0].entry.hosts.claude.invocation.status='blocked',d=>delete d.features[0].entry.hosts.gemini,d=>d.features[0].freshInstall={status:'not_applicable'},d=>d.features[0].upgrade.command='commands',d=>d.features[0].package.evidence=[{...ref,sha256:'0'.repeat(64)}],d=>d.features[0].upgrade.baselineTarballSha256='c'.repeat(64),d=>d.baselineArtifact.sha256='c'.repeat(64)]){
  const bad=structuredClone(data);mutate(bad);assert.throws(()=>validate(bad));
 }
 assert.throws(()=>affectedDeliveryFeatures(['bin/new-unmapped-feature.mjs']));
 assert.deepEqual(affectedDeliveryFeatures(['README.md']),[]);
 const justified=structuredClone(data);justified.features[0].upgrade={status:'not_applicable',reason:'Not exercised',evidence:[ref]};assert.throws(()=>validate(justified));
 console.log('ok: feature delivery gate rejects missing/stale/package-only/native-unverified evidence and unmapped shipped features');
 return data;
}
