// Source assets; the normal installer materializes these same bytes locally.
import {readFileSync} from 'node:fs';
export const assetNames=Object.freeze(['index.html','styles.css','renderer.js','agent-handoff-kit-logo2-256.png','dashboard-hero.png','icons.svg','ICON-LICENSE.txt']);
export const installed=false;
export const runtimeVersion=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8')).version;
export function assetBytes(name){if(!assetNames.includes(name))throw Error('Unknown progress asset');return readFileSync(new URL(name,import.meta.url));}
