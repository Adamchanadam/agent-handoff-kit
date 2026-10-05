import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {validateOfficialOriginCatalog} from './official-origin-catalog.mjs';
import {assetBytes,assetNames,runtimeVersion} from './progress/assets.mjs';

// One content owner; platform adapters are generated from these entries.
export const commands = Object.freeze([
  {name:'handoff-kit-start',label:'開工 / Start',description:'Resume Agent Handoff Kit state when the user asks to start or resume a session.',intent:'Start Agent Handoff',body:'Follow the project AGENTS.md startup contract. This is bare continuity startup unless the user explicitly adds a task or long-run instruction. Receive the required handoff content; truncated output is incomplete and requires bounded follow-up reads before a loaded claim. Show the startup result and stop at the applicable startup boundary. Do not open the progress page, load the log, or begin the saved objective merely because this shortcut was invoked.'},
  {name:'handoff-kit-close',label:'收工 / Wrap up',description:'Save and verify the Agent Handoff Kit handoff when the user ends the session.',intent:'Wrap up Agent Handoff',body:'Follow AGENTS.md and the closeout route in dev/RULE_PACKS.md through its complete workflow. Save and reconcile the actual handoff, log and opening mirror, then run the required closeout checks and report their actual result. Running closeout-status alone is not closeout. This shortcut grants no additional Git commit, push, release or external-write permission.'},
  {name:'handoff-kit-progress',label:'進度頁 / Progress',description:'Open the existing Agent Handoff Kit project overview without generating a report.',intent:'Open the project progress page',body:'In the verified project root, run node dev/handoff-kit/launch.mjs --root <project-root>, quoting the root as one argument in the active shell. The normal installer supplies this local program and its assets; opening progress does not use npm, download tools or require registry access. For an integrated browser, add --no-open and open the returned loopback URL there. Verify the returned page is reachable before reporting success. Give one short result that includes the exact returned loopback URL. If the local program is missing or damaged, identify incomplete installation rather than silently acquiring @latest or overwriting files. A platform permission failure requires the runtime’s supported approval mechanism; do not change global caches, credentials, ACLs or sandbox settings or ask the user to repair npm. Do not read or summarize the log for the model, generate HTML, write progress data, or change the normal record-saving schedule.'},
  {name:'handoff-kit-align',label:'對齊治理 / Align',description:'Check a named document or scan for important documents not connected to Agent Handoff Kit.',intent:'Bridge governance / scan for unbridged governance documents',body:'Use the governance-bridge route in dev/RULE_PACKS.md and its existing owner. With a named target, review that target and its source/index/sync relationships. Without a target, perform the bounded candidate scan described by that workflow. Report gaps and proposed changes; a scan alone never authorizes edits, renames, deletes or authority merges. Apply a concrete fix only when the user has authorized its scope. This is not a Kit upgrade or a blanket rule rewrite.'},
  {name:'handoff-kit-onboard',label:'新手引導 / Onboard',description:'Guide a user who explicitly asks to learn or start using Agent Handoff Kit.',intent:'Teach me to use Agent Handoff Kit',body:'Use the onboarding route in dev/RULE_PACKS.md. Explain in the user’s language, use their existing goal when provided, and ask only for missing information that matters. Do not reset first-use state, reinstall the Kit, or mark project work complete. Follow the existing onboarding procedure rather than inventing another questionnaire.'},
  {name:'handoff-kit-remember',label:'保存工作規則 / Remember',description:'Route an explicitly requested future working rule into Agent Handoff Kit governance.',intent:'Connect this future working rule to Agent Handoff Kit',body:'Use the long-term governance route in dev/RULE_PACKS.md. If no rule or identifiable preceding instruction was provided, ask one short question. Locate the existing owner and writable project supplement, then merge only the authorized rule and verify its consumer route. Keep each durable rule in one authoritative location; resolve conflicts there using the project\'s existing authority order, without duplicating the rule or creating a compromise rule. Preserve official core/pack bodies. Do not save secrets or treat a session-log note as the durable rule owner.'},
  {name:'handoff-kit-check',label:'檢查安裝 / Check',description:'Check the selected project’s Agent Handoff Kit installation without repairing or upgrading it.',intent:'Check Agent Handoff Kit health',body:'Run npx --yes @adamchanadam/agent-handoff-kit@latest doctor --root <project-root> using the verified root and active shell quoting. Report the actual result in plain language. Fetching the CLI into the npm cache is tool acquisition, not project installation. Missing CLI or blocked checks are not success. Do not run init or upgrade, rewrite project files or claim that a healthy installation proves full handoff reception or task completion.'},
  {name:'handoff-kit-update',label:'檢查更新 / Update',description:'Check the latest public Agent Handoff Kit version and safely upgrade this project when newer.',intent:'Check for and install an Agent Handoff Kit update',body:'Run npx --yes @adamchanadam/agent-handoff-kit@latest update --root <project-root>, quoting the verified root as one shell argument. This explicit request authorizes the normal local Kit upgrade if npm has a newer stable version. Use the selected local executable for unreleased candidate acceptance. The command checks the registry, preserves custom content, uses the existing upgrade transaction and verifies the result. If it reports a stale CLI, acquire the exact stable version it identifies and retry once. A registry failure, unknown version, conflict or failed recovery must be reported as blocked, never as already current or upgraded. Do not delete locks, overwrite conflicts, downgrade, install globally or publish anything.'},
  {name:'handoff-kit-help',label:'功能選單 / Help',description:'Show Agent Handoff Kit common shortcuts and explain how to use them.',intent:'Show Agent Handoff Kit commands',body:'Show the short command menu below in the user’s language. Use /handoff-kit-* in Claude Code, Gemini CLI or Antigravity CLI; use $handoff-kit-* or /skills selection in Codex. If the host is unknown, name the difference rather than guessing support. This is guidance only: do not read handoff/log, run health checks or begin a task. For writing, coding, research, knowledge work or external tools, the user can still state their goal normally; use the existing task router when such work is actually requested.'}
]);
const menu=commands.map(c=>`${c.name}: ${c.label}`).join('\n');
export function bodyFor(command){return `# Agent Handoff Kit — ${command.name}\n\nResolve the active project root from the current workspace and its applicable AGENTS.md; do not use a fixed personal path. Read applicable AGENTS.md instructions if not already loaded, then follow its \`Upgrade lock guard\` before loading Kit state. Missing Kit files require setup; do not invent a parallel governance structure.\n\nUser intent: ${command.intent}. Any accompanying user text is task input, never shell interpolation. Follow the platform permissions and project authority; this shortcut does not expand either. Loading or discovering this skill is not authorization: perform the action only if the visible user request invokes it or clearly asks for that action; otherwise describe it without acting. Reply briefly in the user’s language.\n\n${command.body}\n${command.name==='handoff-kit-help'?'\n'+menu+'\n':''}`;}
export function commandFiles(agent='all'){
 if(!['all','claude','gemini','codex','antigravity'].includes(agent))throw Error('Unknown agent; use all, claude, gemini, codex or antigravity.');
 const files=[];
 for(const command of commands){const body=bodyFor(command),skill=`---\nname: ${command.name}\ndescription: ${JSON.stringify(command.description)}\n---\n\n${body}`;
  if(['all','claude'].includes(agent))files.push({file:`.claude/skills/${command.name}/SKILL.md`,text:skill});
  if(['all','codex','antigravity'].includes(agent)){
   files.push({file:`.agents/skills/${command.name}/SKILL.md`,text:skill});
   // UI copy is separate from model routing; reuse the existing bilingual label.
   const title=command.name.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
   files.push({file:`.agents/skills/${command.name}/agents/openai.yaml`,text:`interface:\n  display_name: ${JSON.stringify(title)}\n  short_description: ${JSON.stringify(command.label)}\n`});
  }
  if(['all','gemini'].includes(agent))files.push({file:`.gemini/commands/${command.name}.toml`,text:`description = ${JSON.stringify(command.label)}\nprompt = ${JSON.stringify(body)}\n`});
 }
 return [...files,...progressFiles()];
}
function stat(file){try{return fs.lstatSync(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
function safePath(root,relative,{directory=false}={}){
 const segments=relative.split('/');let at=root;
 for(let i=0;i<segments.length;i++){at=path.join(at,segments[i]);const s=stat(at);if(!s)continue;if(s.isSymbolicLink()||!((i<segments.length-1||directory)?s.isDirectory():s.isFile()))throw Error(`Unsafe path: ${relative}`);}
 return at;
}
// Resolve existing ancestors too: a relocated global directory may itself be a link.
function scopePath(file){
 let at=path.resolve(file);const tail=[];
 while(true){try{return path.join(fs.realpathSync(at),...tail);}catch(e){if(e.code!=='ENOENT')throw e;const parent=path.dirname(at);if(parent===at)throw e;tail.unshift(path.basename(at));at=parent;}}
}
function within(base,file){const relative=path.relative(base,file);return relative===''||(!path.isAbsolute(relative)&&relative!=='..'&&!relative.startsWith('..'+path.sep));}
function assertProjectScope(root,files){
 const refuse=()=>{const error=Error('Global location refused: Kit shortcuts belong in an installed project folder, not a home, drive root or shared AI configuration directory. / 快捷入口只可安裝在專案目錄，請勿選擇使用者主目錄、磁碟根目錄或 AI 全域設定位置。');error.code='ERR_COMMAND_SCOPE';throw error;};
 const homes=[os.homedir(),process.env.HOME,process.env.USERPROFILE].filter(Boolean).map(scopePath);
 // Environment overrides do not erase the operating system's actual home boundary.
 try{homes.push(scopePath(os.userInfo().homedir));}catch(e){if(e.code!=='ERR_SYSTEM_ERROR')throw e;}
 const selected=scopePath(root);
 if(path.relative(path.parse(selected).root,selected)===''||homes.some(home=>path.relative(home,selected)===''))refuse();
 const shared=[];
 for(const home of homes){for(const name of ['.claude','.gemini','.agents'])shared.push({dir:path.join(home,name)});shared.push({dir:path.join(home,'.codex'),worktrees:true});}
 if(process.env.CLAUDE_CONFIG_DIR)shared.push({dir:process.env.CLAUDE_CONFIG_DIR});
 if(process.env.CODEX_HOME)shared.push({dir:process.env.CODEX_HOME,worktrees:true});
 if(process.env.GEMINI_CLI_HOME){const home=scopePath(process.env.GEMINI_CLI_HOME);if(path.relative(home,selected)==='')refuse();shared.push({dir:path.join(home,'.gemini')});}
 if(process.platform==='win32'){
  for(const base of [process.env.ProgramFiles,process.env.PROGRAMDATA].filter(Boolean))for(const name of ['ClaudeCode','GeminiCli','gemini-cli','codex'])shared.push({dir:path.join(base,name)});
 }else{
  for(const dir of ['/etc/codex','/etc/claude-code','/etc/gemini-cli','/Library/Application Support/ClaudeCode','/Library/Application Support/GeminiCli'])shared.push({dir});
 }
 const locations=[selected,...files.map(file=>scopePath(path.join(root,file.file)))];
 for(const entry of shared){const base=scopePath(entry.dir),worktrees=path.join(base,'worktrees');
  for(const location of locations){
   if(!within(base,location))continue;
   // Codex-managed checkouts remain project-scoped; the worktree container is not a project.
   if(entry.worktrees&&within(worktrees,selected)&&path.relative(worktrees,selected)!=='')continue;
   refuse();
  }
 }
}
// Shared, read-only installer boundary. Missing project roots are allowed here;
// the standalone commands route still requires an installed, unlocked Kit.
export function assertCommandPaths(root,files=commandFiles()){
 root=path.resolve(root);assertProjectScope(root,files);
 const s=stat(root);if(s&&(!s.isDirectory()||s.isSymbolicLink()))throw Error('Select a non-linked project root; a symbolic link or junction is not supported.');
 if(path.relative(scopePath(root),root)!=='')throw Error('Linked project root is not supported.');
 for(const item of files)safePath(root,item.file);
}
let shortcutCatalog;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function officialShortcutVersion(file, bytes){
 if(!shortcutCatalog){const c=JSON.parse(fs.readFileSync(new URL('./migration-baselines/official-origin-catalog.json',import.meta.url),'utf8'));validateOfficialOriginCatalog(c);shortcutCatalog=c;}
 const sha=digest(bytes);
 return Object.entries(shortcutCatalog.generatedShortcuts??{}).find(([,entry])=>entry.files[file]===sha)?.[0]??null;
}
export function planCommands(root,agent='all'){
 root=path.resolve(root);const files=commandFiles(agent);assertCommandPaths(root,files);
 return files.map(item=>{
  const target=safePath(root,item.file),s=stat(target);
  if(!s)return{...item,target,action:'create'};
  const bytes=fs.readFileSync(target);
  if(bytes.equals(Buffer.from(item.text)))return{...item,target,action:'keep'};
  const officialVersion=officialShortcutVersion(item.file,bytes);
  return{...item,target,action:officialVersion?'merge':'conflict',...(officialVersion?{officialVersion,plannedInputHash:digest(bytes)}:{})};
 });
}
function assertRoot(root,files){assertCommandPaths(root,files);const s=stat(root);if(!s?.isDirectory()||s.isSymbolicLink())throw Error('Select an existing, non-linked project root.');const canonical=fs.realpathSync(root);if(path.relative(canonical,root)!=='')throw Error('Linked project root is not supported.');
 safePath(root,'dev', {directory:true});
 if(stat(path.join(root,'dev/governance_migrations/.upgrade.lock')))throw Error('Upgrade lock exists; recover the Kit upgrade before installing commands.');
 for(const f of ['AGENTS.md','dev/SESSION_HANDOFF.md'])if(!stat(safePath(root,f)))throw Error('Select an installed Kit project before enabling commands.');
}
export function installCommands({root,agent='all',yes=false,dryRun=false}){
 root=path.resolve(root);const files=commandFiles(agent);assertRoot(root,files);
 const plan=planCommands(root,agent);
 if(plan.some(p=>p.action==='merge'))return{status:'upgrade-required',written:[],plan:plan.map(({file,action})=>({file,action}))};
 if(plan.some(p=>p.action==='conflict'))return{status:'conflict',written:[],plan:plan.map(({file,action})=>({file,action}))};
 if(dryRun||!yes)return{status:'preview',written:[],plan:plan.map(({file,action})=>({file,action}))};
 const written=[];
 try{for(const item of plan){assertRoot(root,files);safePath(root,item.file);if(item.action==='keep')continue;
   // Create-only: even a concurrent writer cannot be overwritten by this command.
   fs.mkdirSync(path.dirname(item.target),{recursive:true});safePath(root,item.file);
   try{fs.writeFileSync(item.target,item.text,{encoding:'utf8',flag:'wx'});written.push(item.file);}catch(e){if(e.code==='EEXIST'&&stat(item.target)?.isFile()&&!stat(item.target)?.isSymbolicLink()&&fs.readFileSync(item.target,'utf8')===item.text)continue;throw e;}
  }
  for(const item of plan){safePath(root,item.file);if(fs.readFileSync(item.target,'utf8')!==item.text)throw Error('Readback changed: '+item.file);}
 }catch(e){const error=new Error(`Command setup interrupted after ${written.length} files; existing files preserved. Rerun preview to inspect remaining paths. ${e.message}`);error.written=written;throw error;}
 return{status:'ready',written,plan:plan.map(({file,action})=>({file,action}))};
}

// Generated support files use the same exact-byte ownership and transaction as entries.
let cachedProgressFiles;
export function progressFiles(){
 if(!cachedProgressFiles){
  const names=['launch','open','server','projection','dashboard','project-version'];
  const data=Object.fromEntries(assetNames.map(name=>[name,assetBytes(name).toString('base64')]));
  const assets=`// Generated from the shipped Dashboard. Do not edit.\nexport const installed=true;\nexport const runtimeVersion=${JSON.stringify(runtimeVersion)};\nconst data=${JSON.stringify(data)};\nexport const assetNames=Object.freeze(Object.keys(data));\nexport function assetBytes(name){if(!Object.hasOwn(data,name))throw Error('Unknown progress asset');return Buffer.from(data[name],'base64');}\n`;
  cachedProgressFiles=[...names.map(name=>({file:`dev/handoff-kit/${name}.mjs`,text:fs.readFileSync(new URL(`./progress/${name}.mjs`,import.meta.url),'utf8')})),{file:'dev/handoff-kit/assets.mjs',text:assets}];
 }
 return cachedProgressFiles.map(item=>({...item}));
}
