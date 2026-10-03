import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {commandFiles,planCommands,installCommands} from '../bin/commands.mjs';
import {createHash} from 'node:crypto';

// Called by the existing install-lock smoke gate; no separate optional QA route.
export function checkInstallFeatures({root,fresh,cli,snapshot,sameSnapshot}) {
 const files=commandFiles(),first=files[0].file,last=files.at(-1).file;
 const read=(p,f)=>fs.readFileSync(path.join(p,f),'utf8');
 const put=(p,f,t)=>{fs.mkdirSync(path.dirname(path.join(p,f)),{recursive:true});fs.writeFileSync(path.join(p,f),t);};
 const ready=p=>{for(const f of files)assert.equal(read(p,f.file),f.text,f.file);};
 const init=p=>cli(['init','--yes','--root',p],'feature init');
 const upgrade=(p,options={})=>cli(['upgrade','--yes','--root',p],'feature upgrade',options);
 const missing=path.join(fresh('absent-parent'),'not-created');
 cli(['init','--dry-run','--root',missing],'missing root preview');assert(!fs.existsSync(missing));
 const cancel=spawnSync(process.execPath,['bin/agent-handoff-kit.mjs','init','--root',missing],{cwd:root,input:'n\n',encoding:'utf8',windowsHide:true});
 assert.equal(cancel.status,0,cancel.stderr);assert(!fs.existsSync(missing));
 const project=fresh('features');init(project);ready(project);
 const all=snapshot(project);upgrade(project);assert(sameSnapshot(all,snapshot(project)));
 // Published installations have the same skills, but no Codex UI metadata yet.
 const menus=files.filter(f=>f.file.endsWith('/agents/openai.yaml'));
 for(const f of menus)fs.unlinkSync(path.join(project,f.file));
 const oldLayout=snapshot(project);upgrade(project);ready(project);
 for(const [file,hash]of oldLayout)assert.equal(snapshot(project).get(file),hash,'menu upgrade changed '+file);
 assert(!fs.existsSync(path.join(project,'dev/governance_migrations')),'menu-only upgrade must remain create-only');
 fs.unlinkSync(path.join(project,first));const incomplete=snapshot(project);
 cli(['doctor','--root',project],'doctor missing shortcut',{expectFailure:true});assert(sameSnapshot(incomplete,snapshot(project)));
 upgrade(project);ready(project);
 for(const f of files)fs.unlinkSync(path.join(project,f.file));upgrade(project);ready(project);
 assert(!fs.existsSync(path.join(project,'dev/governance_migrations')),'create-only repair must not create a transaction');
 put(project,last,'user shortcut\n');const conflict=snapshot(project);
 for(const command of ['init','upgrade']){cli([command,'--yes','--root',project],'shortcut conflict',{expectFailure:true});assert(sameSnapshot(conflict,snapshot(project)));}
 cli(['doctor','--root',project],'doctor shortcut drift',{expectFailure:true});assert(sameSnapshot(conflict,snapshot(project)));
 put(project,last,files.at(-1).text);
 // Core and generated entries share rollback, with no deletion of unrelated work.
 put(project,'dev/PROJECT_INDEX.md',read(project,'dev/PROJECT_INDEX.md').replace(/(Agent Handoff Kit template version \| )\d+\.\d+\.\d+/, '$10.3.65'));
 put(project,'private-work.txt','preserve me\n');fs.unlinkSync(path.join(project,first));
 const indexBefore=read(project,'dev/PROJECT_INDEX.md');
 upgrade(project,{expectFailure:true,env:{AGENT_HANDOFF_KIT_QA_FAIL_AFTER_COMMIT_TARGET:first}});
 assert.equal(read(project,'dev/PROJECT_INDEX.md'),indexBefore);assert(!fs.existsSync(path.join(project,first)));assert.equal(read(project,'private-work.txt'),'preserve me\n');
 upgrade(project);ready(project);
 // Legacy committed transactions lacked the new contract marker; recovery may
 // defer only this added check, then the current install plan must supply it.
 for(const legacy of [true,false]){
   const p=fresh(legacy?'legacy-recovery':'new-recovery');init(p);
   put(p,'dev/PROJECT_INDEX.md',read(p,'dev/PROJECT_INDEX.md').replace(/(Agent Handoff Kit template version \| )\d+\.\d+\.\d+/, '$10.3.65'));
   upgrade(p,{expectFailure:true,env:{AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_JOURNAL_COMMIT:'1'}});
   const lockRel='dev/governance_migrations/.upgrade.lock',lock=JSON.parse(read(p,lockRel));
   const journal=JSON.parse(read(p,lock.journal));assert.equal(journal.shortcutInstallContract,1);
   if(legacy){delete journal.shortcutInstallContract;put(p,lock.journal,JSON.stringify(journal));}
   for(const f of files)fs.unlinkSync(path.join(p,f.file));
   const prior=snapshot(p);
   // A valid pending recovery inside a selected global home must remain untouched.
   upgrade(p,{expectFailure:true,env:{HOME:p,USERPROFILE:p}});assert(sameSnapshot(prior,snapshot(p)));
   upgrade(p,{expectFailure:!legacy});
   if(legacy){ready(p);assert(!fs.existsSync(path.join(p,lockRel)));}
   else {assert(fs.existsSync(path.join(p,lockRel)));assert(sameSnapshot(prior,snapshot(p)));}
 }
 // Exact old official bytes may update; user bytes and stale plans never may.
 const published=JSON.parse(fs.readFileSync(path.join(root,'test-fixtures/commands/official-v0.4.0.json')));
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'bin/migration-baselines/official-origin-catalog.json')));
 assert.equal(published.tarballSha256,catalog.generatedShortcuts['0.4.0'].npm.tarballSha256);
 for(const f of published.files)assert.equal(createHash('sha256').update(f.text).digest('hex'),catalog.generatedShortcuts['0.4.0'].files[f.file]);
 const official=fresh('old-official');init(official);
 const restoreOld=()=>{for(const f of published.files)put(official,f.file,f.text);};
 restoreOld();const legacyFiles=snapshot(official);
 assert.deepEqual(planCommands(official).filter(f=>f.action==='merge').map(f=>f.file).sort(),published.files.filter(old=>files.some(now=>now.file===old.file&&now.text!==old.text)).map(f=>f.file).sort());
 assert.equal(installCommands({root:official,yes:true}).status,'upgrade-required');assert(sameSnapshot(legacyFiles,snapshot(official)));
 cli(['upgrade','--dry-run','--root',official],'official preview');assert(sameSnapshot(legacyFiles,snapshot(official)));
 upgrade(official);ready(official);const current=snapshot(official);upgrade(official);assert(sameSnapshot(current,snapshot(official)));
 const firstOld=published.files[0];restoreOld();put(official,firstOld.file,firstOld.text+'user custom rule\n');
 const custom=snapshot(official);upgrade(official,{expectFailure:true});assert(sameSnapshot(custom,snapshot(official)));
 restoreOld();put(official,'private-work.txt','user work');
 upgrade(official,{expectFailure:true,env:{AGENT_HANDOFF_KIT_QA_FAIL_AFTER_COMMIT_TARGET:firstOld.file}});
 for(const f of published.files)assert.equal(read(official,f.file),f.text);assert.equal(read(official,'private-work.txt'),'user work');
 upgrade(official);ready(official);
 restoreOld();upgrade(official,{expectFailure:true,env:{AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE:'1'}});upgrade(official);ready(official);
 restoreOld();const changed=firstOld.text+'concurrent user change\n';
 upgrade(official,{expectFailure:true,env:{AGENT_HANDOFF_KIT_QA_MUTATE_BEFORE_LOCK_REVALIDATION:firstOld.file,AGENT_HANDOFF_KIT_QA_MUTATE_BEFORE_LOCK_REVALIDATION_BASE64:Buffer.from(changed).toString('base64')}});
 assert.equal(read(official,firstOld.file),changed);for(const f of published.files.slice(1))assert.equal(read(official,f.file),f.text);
 // update reuses upgrade, checks registry first, and never silently downgrades.
 const updating=fresh('update-entry');init(updating);
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
 const invokeUpdate=(options={})=>cli(['update','--root',updating],'update entry',{...options,env:{AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST:version,...options.env}});
 const latest=snapshot(updating);invokeUpdate();assert(sameSnapshot(latest,snapshot(updating)));
 invokeUpdate({expectFailure:true,env:{AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST:'not-a-version'}});assert(sameSnapshot(latest,snapshot(updating)));
 invokeUpdate({expectFailure:true,env:{AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST:'99.0.0'}});assert(sameSnapshot(latest,snapshot(updating)));
 invokeUpdate({expectFailure:true,env:{AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST:'0.0.1'}});assert(sameSnapshot(latest,snapshot(updating)));
 invokeUpdate({expectFailure:true,env:{AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST:'',AGENT_HANDOFF_KIT_UPDATE_REGISTRY_URL:'http://127.0.0.1:1',AGENT_HANDOFF_KIT_UPDATE_TIMEOUT_MS:'100'}});assert(sameSnapshot(latest,snapshot(updating)));
 put(updating,'dev/PROJECT_INDEX.md',read(updating,'dev/PROJECT_INDEX.md').replace(/(Agent Handoff Kit template version \| )\d+\.\d+\.\d+/,'$10.3.65'));
 for(const f of published.files)put(updating,f.file,f.text);
 invokeUpdate();ready(updating);assert(read(updating,'dev/PROJECT_INDEX.md').includes('| '+version+' |'));
 console.log('ok: exact official shortcut upgrade, custom conflict, repeat, rollback/recovery, concurrent change and latest/newer/offline/update boundaries');
 // Native adapters and the Dashboard are package-delivered from the same CLI.
 for(const rel of ['bin/progress/open.mjs','bin/progress/server.mjs','bin/progress/index.html'])assert(fs.existsSync(path.join(root,rel)),rel);
 console.log('ok: integrated features, absent-root/cancel, same-version repair, read-only conflicts/doctor, shared rollback, legacy/new recovery and global recovery refusal');
}
