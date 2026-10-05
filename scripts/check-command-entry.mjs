#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {commands,commandFiles,bodyFor,installCommands,progressFiles} from '../bin/commands.mjs';
import {openProgress,probeProgress} from '../bin/progress/open.mjs';
import {startProgress,progressIdentity} from '../bin/progress/server.mjs';
const run=promisify(execFile),source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cli=path.join(source,'bin/agent-handoff-kit.mjs'),version=JSON.parse(fs.readFileSync(path.join(source,'package.json'))).version;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ahk-command-')),ownedPids=new Set(),servers=[];
const options={windowsHide:true,timeout:60000,env:{...process.env,AGENT_HANDOFF_KIT_SKIP_UPDATE_CHECK:'1'}};
function project(name){const p=path.join(temp,name);fs.mkdirSync(path.join(p,'dev'),{recursive:true});fs.writeFileSync(path.join(p,'AGENTS.md'),'# Isolated Kit command test\n');fs.copyFileSync(path.join(source,'runtime-core/SESSION_HANDOFF.md'),path.join(p,'dev/SESSION_HANDOFF.md'));return p;}
function snapshot(root){const out={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name),key=path.relative(root,p);if(e.isSymbolicLink())out[key]={link:fs.readlinkSync(p)};else if(e.isDirectory()){out[key+path.sep]=null;walk(p);}else out[key]=fs.readFileSync(p,'utf8');}}walk(root);return out;}
const ok=s=>console.log('ok: commands '+s);
try{
 const root=project('專案 with spaces & symbols');
 const baseline=snapshot(root),files=commandFiles();assert.equal(files.length,commands.length*4+progressFiles().length);
 const ui=files.filter(f=>f.file.endsWith("/agents/openai.yaml"));assert.equal(ui.length,commands.length);
 for(const item of ui){const label=JSON.parse(item.text.match(/short_description: (.+)/)[1]);assert.match(label,/[\u3400-\u9fff]/);assert.match(label,/[A-Za-z]/);assert.ok([...label].length<=24);assert.equal(item.text.includes("policy:"),false);}
 assert.equal(installCommands({root}).status,'preview');assert.deepEqual(snapshot(root),baseline);
 const preview=await run(process.execPath,[cli,'commands','--root',root,'--dry-run'],options);assert.match(preview.stdout,/preview/);assert.deepEqual(snapshot(root),baseline);
 const installed=await run(process.execPath,[cli,'commands','--root',root,'--yes'],options);assert.match(installed.stdout,/ready/);
 for(const f of files)assert.equal(fs.readFileSync(path.join(root,f.file),'utf8'),f.text);
 const times=files.map(f=>fs.statSync(path.join(root,f.file)).mtimeMs);assert.equal(installCommands({root,yes:true}).written.length,0);assert.deepEqual(files.map(f=>fs.statSync(path.join(root,f.file)).mtimeMs),times);
 for(const agent of ['claude','gemini','codex','antigravity']){const p=project(agent);assert.equal(installCommands({root:p,agent,yes:true}).written.length,(["codex","antigravity"].includes(agent)?commands.length*2:commands.length)+progressFiles().length);}
 assert.deepEqual(commandFiles('codex'),commandFiles('antigravity'));
 for(const command of commands){const body=bodyFor(command),gemini=files.find(f=>f.file===`.gemini/commands/${command.name}.toml`);assert.equal(JSON.parse(gemini.text.split('\n')[1].slice(9)),body);assert.ok(files.filter(f=>f.file.endsWith(`/${command.name}/SKILL.md`)).every(f=>f.text.endsWith(body)));assert.match(body,/Loading or discovering this skill is not authorization/);assert.match(body,/Read applicable AGENTS\.md instructions if not already loaded, then follow its `Upgrade lock guard` before loading Kit state/);assert.equal(body.includes("project recovery guidance"),false);assert.equal(body.includes("Before loading Kit state, check dev\/governance_migrations\/\.upgrade\.lock"),false);}
 const progressBody=bodyFor(commands.find(command=>command.name==='handoff-kit-progress'));
 assert.match(progressBody,/Verify the returned page is reachable before reporting success\. Give one short result that includes the exact returned loopback URL\./);
 const updateBody=bodyFor(commands.find(command=>command.name==='handoff-kit-update'));
 assert.match(updateBody,/controlled general `registry=` for the npx invocation working directory/);
 assert.match(updateBody,/direct Node run with only a project `\.npmrc` does not select/);
 assert.equal(updateBody.includes('selected local executable'),false);
 ok('contract check: shared shortcut defers lock handling to the named AGENTS.md guard; native behavioral acceptance is separate');
 // A controlled npx invocation must pass its general registry to update and to
 // the doctor invoked by the current no-op path. No direct .npmrc parsing or
 // endpoint test hook is involved here.
 const npmCli=path.join(path.dirname(process.execPath),'node_modules','npm','bin','npm-cli.js'),npxCli=path.join(path.dirname(process.execPath),'node_modules','npm','bin','npx-cli.js');
 const npm=(args,runOptions={})=>run(process.execPath,[npmCli,...args],{...options,...runOptions});
 const npx=(args,runOptions={})=>run(process.execPath,[npxCli,...args],{...options,...runOptions});
 const packed=JSON.parse((await npm(['pack','--ignore-scripts','--json','--pack-destination',temp],{cwd:source})).stdout)[0];
 const tarball=path.join(temp,packed.filename),tarballBytes=fs.readFileSync(tarball),registryHits=[];
 let registryVersion=version;
 const registry=http.createServer((request,response)=>{
  const requestPath=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);registryHits.push(requestPath);
  const base=`http://127.0.0.1:${registry.address().port}/registry`;
  if(requestPath==='/registry/@adamchanadam/agent-handoff-kit/latest'||requestPath==='/override'){
   response.writeHead(200,{'content-type':'application/json'});response.end(JSON.stringify({version:registryVersion}));return;
  }
  if(requestPath==='/registry/@adamchanadam/agent-handoff-kit'){
   response.writeHead(200,{'content-type':'application/json'});response.end(JSON.stringify({name:'@adamchanadam/agent-handoff-kit','dist-tags':{latest:version},versions:{[version]:{name:'@adamchanadam/agent-handoff-kit',version,bin:{'agent-handoff-kit':'bin/agent-handoff-kit.mjs'},dist:{tarball:`${base}/candidate.tgz`,shasum:createHash('sha1').update(tarballBytes).digest('hex'),integrity:'sha512-'+createHash('sha512').update(tarballBytes).digest('base64')}}}}));return;
  }
  if(requestPath==='/registry/candidate.tgz'){response.writeHead(200,{'content-type':'application/octet-stream'});response.end(tarballBytes);return;}
  response.writeHead(404);response.end('not found');
 });
 await new Promise(resolve=>registry.listen(0,'127.0.0.1',resolve));servers.push({close:()=>new Promise(resolve=>registry.close(resolve))});
 const registryBase=`http://127.0.0.1:${registry.address().port}/registry`;
 const cleanUpdateEnv=(extra={})=>{const env={...options.env};delete env.AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST;delete env.AGENT_HANDOFF_KIT_UPDATE_REGISTRY_URL;delete env.AGENT_HANDOFF_KIT_NO_UPDATE_CHECK;return {...env,...extra};};
 const officialDir=path.join(temp,'official-v042');fs.mkdirSync(officialDir);
 const officialFixture=JSON.parse(fs.readFileSync(path.join(source,'test-fixtures','v0.4.2','fixture-manifest.json'))).source.npm;
 const officialCatalog=JSON.parse(fs.readFileSync(path.join(source,'bin','migration-baselines','official-origin-catalog.json'))).generatedShortcuts['0.4.2'].npm;
 const officialPack=JSON.parse((await npm(['pack',officialFixture.spec,'--ignore-scripts','--json','--pack-destination',officialDir])).stdout)[0];
 const officialTarball=path.join(officialDir,officialPack.filename);
 assert.equal(createHash('sha256').update(fs.readFileSync(officialTarball)).digest('hex'),officialCatalog.tarballSha256,'controlled-update baseline must be the actual v0.4.2 package');
 const baselinePrefix=path.join(temp,'controlled-v042-cli');await npm(['install','--prefix',baselinePrefix,'--ignore-scripts',officialTarball]);
 const oldCli=path.join(baselinePrefix,'node_modules','@adamchanadam','agent-handoff-kit','bin','agent-handoff-kit.mjs');
 const controlled=path.join(temp,'controlled-npx-update');fs.mkdirSync(controlled);
 await run(process.execPath,[oldCli,'init','--yes','--root',controlled],{...options,env:cleanUpdateEnv({AGENT_HANDOFF_KIT_NO_UPDATE_CHECK:'1'})});
 const customPath=path.join(controlled,'private-note.txt');fs.writeFileSync(customPath,'preserve this user byte\n');
 const beforeControlled=snapshot(controlled);
 const controlledResult=await npx(['--yes','--cache',path.join(temp,'controlled-npx-cache'),'--registry',registryBase,'@adamchanadam/agent-handoff-kit@latest','update','--root',controlled],{cwd:controlled,env:cleanUpdateEnv({AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE:'1'})});
 assert.match(controlledResult.stdout,/Installed \/ 已安裝: 0\.4\.2; npm latest \/ 最新版: 0\.4\.3/);assert.equal(fs.readFileSync(customPath,'utf8'),'preserve this user byte\n');assert.notDeepEqual(snapshot(controlled),beforeControlled);
 const controlledDoctor=await npx(['--yes','--cache',path.join(temp,'controlled-npx-cache'),'--registry',registryBase,'@adamchanadam/agent-handoff-kit@latest','doctor','--root',controlled],{cwd:controlled,env:cleanUpdateEnv({AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE:'1'})});
 assert.match(controlledDoctor.stdout,/三向對齊 v0\.4\.3/);
 assert(registryHits.filter(item=>item==='/registry/@adamchanadam/agent-handoff-kit/latest').length>=2,'npx update and doctor must use the controlled registry endpoint');
 assert(!registryHits.some(item=>item.includes('/@adamchanadam/agent-handoff-kit/latest/@adamchanadam/agent-handoff-kit/latest')),'registry package path must be appended exactly once');
 const overrideBefore=snapshot(controlled);
 const overrideResult=await run(process.execPath,[cli,'update','--root',controlled],{...options,cwd:controlled,env:cleanUpdateEnv({npm_config_registry:'ftp://invalid.example',AGENT_HANDOFF_KIT_UPDATE_REGISTRY_URL:`http://127.0.0.1:${registry.address().port}/override`,AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE:'1'})});
 assert.match(overrideResult.stdout,/Already current/);assert.deepEqual(snapshot(controlled),overrideBefore);assert(registryHits.includes('/override'),'explicit endpoint override must take priority over inherited registry');
 const malformed=path.join(temp,'malformed-registry');fs.mkdirSync(malformed);await run(process.execPath,[cli,'init','--yes','--root',malformed],{...options,env:cleanUpdateEnv({AGENT_HANDOFF_KIT_NO_UPDATE_CHECK:'1'})});const malformedBefore=snapshot(malformed);
 for(const [configured,secret] of [['ftp://registry.invalid','ftp://registry.invalid'],['http://user:very-secret@registry.invalid','very-secret']]){
  await assert.rejects(run(process.execPath,[cli,'update','--root',malformed],{...options,cwd:malformed,env:cleanUpdateEnv({npm_config_registry:configured})}),error=>error.code===1&&error.stderr.includes('Configured npm registry is invalid')&&!error.stderr.includes(secret));
  assert.deepEqual(snapshot(malformed),malformedBefore);
 }
 registryVersion='0.4.4';const noticeRoot=path.join(temp,'registry-notice');fs.mkdirSync(noticeRoot);
 const notice=await run(process.execPath,[cli,'init','--yes','--root',noticeRoot],{...options,cwd:noticeRoot,env:cleanUpdateEnv({npm_config_registry:registryBase,AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE:'1'})});
 assert.match(notice.stdout,new RegExp(`${version} -> 0\\.4\\.4`));
 assert.match(fs.readFileSync(cli,'utf8'),/process\.env\.npm_config_registry \?\? officialNpmRegistry/);
 ok('actual v0.4.2-to-candidate controlled npx update preserves custom bytes; fresh doctor, override priority, official default, invalid URL zero-write and shared notice are covered');
 assert.throws(()=>installCommands({root,agent:'../../bad'}),/Unknown agent/);ok('CLI preview, all adapters and concise bilingual Codex menu files, shared content, special-character roots and repeat no-op');
 // Real filesystem/CLI exercises use a disposable home, never the user's configuration.
 const fakeHome=project('scope-home'),customClaude=project('scope-claude'),customCodex=project('scope-codex'),customGemini=project('scope-gemini');
 const scopeEnv={HOME:fakeHome,USERPROFILE:fakeHome,CLAUDE_CONFIG_DIR:customClaude,CODEX_HOME:customCodex,GEMINI_CLI_HOME:customGemini,ProgramFiles:path.join(temp,'scope-programs'),PROGRAMDATA:path.join(temp,'scope-data')};
 const savedEnv=Object.fromEntries(Object.keys(scopeEnv).map(key=>[key,process.env[key]]));
 try{
  Object.assign(process.env,scopeEnv);
  const blockedRoots=[fakeHome,customClaude,customCodex,customGemini,
   ...['.claude','.claude/skills/example','.agents','.agents/skills/example','.gemini','.gemini/commands','.gemini/antigravity-cli/skills/example','.gemini/config/skills','.codex','.codex/skills/example','.codex/worktrees'].map(name=>project(path.relative(temp,path.join(fakeHome,name)))),
   project(path.relative(temp,path.join(customGemini,'.gemini/commands'))),
   project(path.relative(temp,path.join(customClaude,'skills/example')))];
  if(process.platform==='win32')blockedRoots.push(project('scope-programs/ClaudeCode'),project('scope-data/gemini-cli/commands'));
  for(const target of blockedRoots){const before=snapshot(target);
   for(const args of [{dryRun:true},{yes:true}])assert.throws(()=>installCommands({root:target,...args}),e=>e.code==='ERR_COMMAND_SCOPE');
   assert.deepEqual(snapshot(target),before,'refused root must create no files or directories');
  }
  for(const agent of ['claude','gemini','codex','antigravity'])assert.throws(()=>installCommands({root:fakeHome,agent,yes:true}),e=>e.code==='ERR_COMMAND_SCOPE');
  const childOptions={...options,env:{...options.env,...scopeEnv}};
  for(const target of [fakeHome,path.join(fakeHome,'.gemini/antigravity-cli/skills/example'),customClaude]){
   const before=snapshot(target);
   for(const mode of ['--dry-run','--yes'])await assert.rejects(run(process.execPath,[cli,'commands','--root',target,mode],childOptions),e=>e.code===1&&e.stderr.includes('Global location refused'));
   assert.deepEqual(snapshot(target),before);
  }
  await assert.rejects(run(process.execPath,[cli,'commands','--yes'],{...childOptions,cwd:fakeHome}),e=>e.code===1&&e.stderr.includes('Global location refused'));
  // Scope can be unsafe through an output, even when the selected project itself is ordinary.
  const overlap=project('scope-overlap'),beforeOverlap=snapshot(overlap);process.env.CLAUDE_CONFIG_DIR=path.join(overlap,'.claude');
  assert.throws(()=>installCommands({root:overlap,yes:true}),e=>e.code==='ERR_COMMAND_SCOPE');assert.deepEqual(snapshot(overlap),beforeOverlap);
  process.env.CLAUDE_CONFIG_DIR=customClaude;
  // Canonical targets of relocated global directories must not bypass the boundary.
  const alias=path.join(temp,'scope-global-alias');fs.symlinkSync(customClaude,alias,process.platform==='win32'?'junction':'dir');process.env.CLAUDE_CONFIG_DIR=alias;
  assert.throws(()=>installCommands({root:customClaude,yes:true}),e=>e.code==='ERR_COMMAND_SCOPE');process.env.CLAUDE_CONFIG_DIR=customClaude;
  if(process.platform==='win32')assert.throws(()=>installCommands({root:fakeHome.toUpperCase()+path.sep,dryRun:true}),e=>e.code==='ERR_COMMAND_SCOPE');
  assert.throws(()=>installCommands({root:path.parse(temp).root,dryRun:true}),e=>e.code==='ERR_COMMAND_SCOPE');
  // Home descendants, lookalike prefixes, dot-folders and managed worktrees are real projects.
  for(const name of ['scope-home/projects/專案 with spaces','scope-home-copy','scope-claude-copy','scope-home/.codex/worktrees/id/project','scope-codex/worktrees/id/project','normal/.claude/worktrees/project']){
   const target=project(name),before=snapshot(target);assert.equal(installCommands({root:target,dryRun:true}).status,'preview');assert.deepEqual(snapshot(target),before);
   const installed=await run(process.execPath,[cli,'commands','--root',target,'--yes'],childOptions);assert.match(installed.stdout,/ready/);
   for(const f of files)assert.equal(fs.readFileSync(path.join(target,f.file),'utf8'),f.text);
  }
  ok('global homes/configuration, relocated targets and overlaps refuse with zero writes; ordinary and managed-worktree projects install');
 }finally{for(const [key,value]of Object.entries(savedEnv))if(value===undefined)delete process.env[key];else process.env[key]=value;}
 const conflict=project('conflict'),last=files.at(-1);fs.mkdirSync(path.dirname(path.join(conflict,last.file)),{recursive:true});fs.writeFileSync(path.join(conflict,last.file),'user-owned content');const beforeConflict=snapshot(conflict);assert.equal(installCommands({root:conflict,yes:true}).status,'conflict');assert.deepEqual(snapshot(conflict),beforeConflict);
 await assert.rejects(run(process.execPath,[cli,'commands','--root',conflict,'--yes'],options),e=>e.code===1&&e.stdout.includes('conflict'));assert.deepEqual(snapshot(conflict),beforeConflict);
 const locked=project('locked');fs.mkdirSync(path.join(locked,'dev/governance_migrations'));fs.writeFileSync(path.join(locked,'dev/governance_migrations/.upgrade.lock'),'pending');const beforeLock=snapshot(locked);assert.throws(()=>installCommands({root:locked,yes:true}),/lock/);assert.deepEqual(snapshot(locked),beforeLock);
 const blocked=project('blocked-path');fs.writeFileSync(path.join(blocked,'.claude'),'user file');assert.throws(()=>installCommands({root:blocked,yes:true}),/Unsafe path/);
 const escaped=project('linked-path'),outside=project('outside');fs.symlinkSync(outside,path.join(escaped,'.agents'),process.platform==='win32'?'junction':'dir');assert.throws(()=>installCommands({root:escaped,yes:true}),/Unsafe path/);assert.equal(fs.existsSync(path.join(escaped,'.claude')),false);assert.equal(fs.existsSync(path.join(outside,'skills')),false);
 const link=path.join(temp,'linked-root');fs.symlinkSync(root,link,process.platform==='win32'?'junction':'dir');assert.throws(()=>installCommands({root:link,yes:true}),/non-linked/);ok('conflicts, upgrade lock, file collision and junctions stop before writes');
 const partial=project('interrupted'),originalWrite=fs.writeFileSync;let writes=0;
 try{fs.writeFileSync=function(...args){if(args[2]?.flag==='wx'&&++writes===4)throw Error('simulated device failure');return originalWrite.apply(this,args);};assert.throws(()=>installCommands({root:partial,yes:true}),/interrupted after 3 files/);}finally{fs.writeFileSync=originalWrite;}
 const partialPreview=installCommands({root:partial});assert.equal(partialPreview.plan.filter(p=>p.action==='keep').length,3);assert.equal(installCommands({root:partial,yes:true}).written.length,files.length-3);assert.deepEqual(snapshot(partial),snapshot(root));ok('interrupted setup resumes remaining files without replacing completed files');
 await assert.rejects(run(process.execPath,[cli,'commands','--root'],options),e=>e.stderr.includes('missing or duplicate value for --root'));
 await assert.rejects(run(process.execPath,[cli,'commands','--agent'],options),e=>e.stderr.includes('--agent requires'));
 const missing=path.join(temp,'missing');fs.mkdirSync(missing);await assert.rejects(openProgress({root:missing,version,openBrowser:false}),/SESSION_HANDOFF/);await assert.rejects(openProgress({root:locked,version,openBrowser:false}),/lock/);
 // Exercise the INSTALLED launcher with no npm executable, invalid cache and offline registry.
 const installedLaunch=path.join(root,'dev/handoff-kit/launch.mjs'),cacheFile=path.join(temp,'not-a-cache');fs.writeFileSync(cacheFile,'preserve');
 const beforeLocal=snapshot(root),offline={...options,env:{...options.env,PATH:'',npm_config_cache:cacheFile,npm_config_registry:'http://127.0.0.1:1',npm_config_offline:'true'}};
 const launched=JSON.parse((await run(process.execPath,[installedLaunch,'--root',root,'--no-open'],offline)).stdout);if(launched.pid)ownedPids.add(launched.pid);
 assert.equal((await fetch(launched.url)).status,200);assert.match(await(await fetch(launched.url)).text(),/Agent Handoff Kit/);
 const logo=Buffer.from(await(await fetch(launched.url+'/agent-handoff-kit-logo2-256.png')).arrayBuffer());assert.deepEqual(logo,fs.readFileSync(path.join(source,'bin/progress/agent-handoff-kit-logo2-256.png')));
 const localAgain=JSON.parse((await run(process.execPath,[installedLaunch,'--root',root,'--no-open'],offline)).stdout);assert.equal(localAgain.url,launched.url);assert.equal(localAgain.reused,true);
 if(process.platform==='win32'){const alias=JSON.parse((await run(process.execPath,[installedLaunch,'--root',root.toLowerCase(),'--no-open'],offline)).stdout);assert.equal(alias.url,launched.url);assert.equal(alias.reused,true);}
 assert.deepEqual(snapshot(root),beforeLocal);assert.equal(fs.readFileSync(cacheFile,'utf8'),'preserve');
 await assert.rejects(run(process.execPath,[installedLaunch,'--root',outside,'--no-open'],offline),e=>e.stderr.includes('different project'));
 fs.mkdirSync(path.join(root,'dev/governance_migrations'),{recursive:true});fs.writeFileSync(path.join(root,'dev/governance_migrations/.upgrade.lock'),'test');
 await assert.rejects(run(process.execPath,[installedLaunch,'--root',root,'--no-open'],offline),e=>e.stderr.includes('Upgrade lock'));fs.unlinkSync(path.join(root,'dev/governance_migrations/.upgrade.lock'));fs.rmdirSync(path.join(root,'dev/governance_migrations'));
 process.kill(launched.pid);ownedPids.delete(launched.pid);for(let i=0;i<30&&await probeProgress(Number(new URL(launched.url).port));i++)await new Promise(r=>setTimeout(r,100));
 ok('installed offline launcher opens/reuses without npm/cache writes; exact image bytes, project binding and upgrade lock verified');
 const first=await openProgress({root,version,openBrowser:false});if(first.pid)ownedPids.add(first.pid);assert.equal(first.reused,false);
 const again=await openProgress({root,version,openBrowser:false});assert.equal(again.url,first.url);assert.equal(again.reused,true);
 const identity=await(await fetch(first.url+'/api/identity')).json();assert.deepEqual(identity,progressIdentity(root,version));assert.equal(JSON.stringify(identity).includes(root),false);
 const viaCLI=await run(process.execPath,[cli,'progress','--background','--root',root,'--no-open'],options);assert.ok(viaCLI.stdout.includes(first.url));assert.match(viaCLI.stdout,/Reused/);
 assert.ok(first.pid&&ownedPids.has(first.pid));process.kill(first.pid);ownedPids.delete(first.pid);
 const reopenPort=Number(new URL(first.url).port);
 for(let i=0;i<30&&await probeProgress(reopenPort);i++)await new Promise(r=>setTimeout(r,100));
 assert.equal(await probeProgress(reopenPort),null);
 const restarted=await openProgress({root,version,port:reopenPort,openBrowser:false});if(restarted.pid)ownedPids.add(restarted.pid);
 assert.equal(restarted.url,first.url);assert.equal(restarted.reused,false);assert.equal((await fetch(restarted.url+'/api/state')).status,200);
 ok('a stopped task-owned service restarts on the same free URL through the existing entry');
 const other=await openProgress({root:outside,version,openBrowser:false});if(other.pid)ownedPids.add(other.pid);assert.notEqual(other.url,first.url);
 const stale=await startProgress({root,version:'older-build',openBrowser:false});servers.push(stale);await assert.rejects(openProgress({root,version,port:Number(new URL(stale.url).port),openBrowser:false}),/Could not open/);assert.equal((await fetch(stale.url+'/api/state')).status,200);
 const slow=http.createServer((req,res)=>{res.writeHead(200);res.write(' ');const interval=setInterval(()=>res.write(' '),60);res.on('close',()=>clearInterval(interval));});
 await new Promise(r=>slow.listen(0,'127.0.0.1',r));servers.push({close:()=>new Promise(r=>slow.close(r))});
 const probeStarted=Date.now();assert.equal(await probeProgress(slow.address().port),null);assert.ok(Date.now()-probeStarted<1500,'foreign slow response must have an absolute deadline');
 const unrelated=http.createServer((req,res)=>res.end('another application'));await new Promise(r=>unrelated.listen(0,'127.0.0.1',r));servers.push({close:()=>new Promise(r=>unrelated.close(r))});const occupied=unrelated.address().port;await assert.rejects(openProgress({root,version,port:occupied,openBrowser:false}),/Could not open/);assert.equal(await(await fetch(`http://127.0.0.1:${occupied}`)).text(),'another application');
 assert.deepEqual(Object.fromEntries(Object.keys(baseline).map(f=>[f,f.endsWith(path.sep)?null:fs.readFileSync(path.join(root,f),'utf8')])),baseline);ok('background launch, repeat CLI reuse, separate roots, stale and unrelated service preservation');
 // Keep native-platform acceptance distinct: these checks validate generated files and local CLI behavior.
 console.log('Agent Handoff Kit command entry checks passed; native AI invocation is separate acceptance.');
}finally{
 for(const server of servers)await server.close();
 for(const pid of ownedPids){try{process.kill(pid);}catch(e){if(e.code!=='ESRCH')throw e;}}
 await new Promise(r=>setTimeout(r,150));
 const resolved=fs.realpathSync(temp);if(path.dirname(resolved)===fs.realpathSync(os.tmpdir())&&path.basename(resolved).startsWith('ahk-command-'))fs.rmSync(resolved,{recursive:true,force:true});
}
