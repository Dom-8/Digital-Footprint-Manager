import {createContext,useContext,useEffect,useState,useRef,type ReactNode} from 'react';
import {analyse} from './engine';
import {externalPost,importArchive} from './imports';
import {posts as demoPosts,personas,platforms,industries,statuses,priorities,checklist} from './data';
import type {State,ProfileState,Decision,Post} from './types';
const KEY='dfm-demo-v1';
export function defaults():State{return{version:1,appearanceVersion:2,persona:'alex',profiles:Object.fromEntries(personas.map(p=>[p.id,{industry:p.industry,occupation:p.occupation,platforms:p.platforms,decisions:{},checklist:[],scan:0,events:[],lastScan:null,frequency:'Manual only',cvStart:'2022',linkedStart:'2021',name:p.name}])),onboarded:false,theme:'dark',compact:false,reduced:false,notifications:true,reminders:true};}
function read():State{try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x?.version!==1)return defaults();const base=defaults();if(personas.some(p=>p.id===x.persona))base.persona=x.persona;base.onboarded=x.onboarded===true;if([0,1,2,3,4].includes(x.setupStep))base.setupStep=x.setupStep;if([0,1,2,3,4].includes(x.setupResume))base.setupResume=x.setupResume;if(typeof x.setupEmail==='string')base.setupEmail=x.setupEmail.slice(0,254);if(typeof x.setupName==='string')base.setupName=x.setupName.slice(0,60);base.sidebarCollapsed=x.sidebarCollapsed===true;base.tutorialDone=x.tutorialDone===true;if([0,1,2].includes(x.tutorialStep))base.tutorialStep=x.tutorialStep;if(typeof x.tutorialPostId==='string'&&x.tutorialPostId.length<200)base.tutorialPostId=x.tutorialPostId;if(['demo','imported','connected'].includes(x.tutorialPreviousSource))base.tutorialPreviousSource=x.tutorialPreviousSource;if(personas.some(p=>p.id===x.tutorialPersona))base.tutorialPersona=x.tutorialPersona;base.theme=x.appearanceVersion===2&&x.theme==='light'?'light':'dark';base.compact=x.compact===true;base.reduced=x.reduced===true;base.notifications=x.notifications!==false;base.reminders=x.reminders!==false;for(const person of personas){const p=x.profiles?.[person.id];if(!p||typeof p!=='object')continue;const d=base.profiles[person.id];if(industries.some(i=>i.id===p.industry))d.industry=p.industry;if(['demo','imported','connected'].includes(p.source))d.source=p.source;if(typeof p.roleDescription==='string')d.roleDescription=p.roleDescription.slice(0,500);if(Array.isArray(p.importedPosts)){try{d.importedPosts=p.importedPosts.filter((v:any)=>v?.source==='imported'&&v?.platform==='Mastodon'&&v?.persona===person.id&&typeof v?.id==='string'&&typeof v?.text==='string'&&Number.isFinite(Date.parse(v?.date))&&Object.keys({privacy:1,confidentiality:1,consistency:1,ordinary:1}).includes(v.category)).slice(0,5000);}catch{d.importedPosts=[];}}for(const k of ['name','occupation','cvStart','linkedStart'] as const)if(typeof p[k]==='string')d[k]=p[k];if(Array.isArray(p.platforms))d.platforms=p.platforms.filter((v:unknown)=>typeof v==='string'&&platforms.includes(v));if(Array.isArray(p.checklist))d.checklist=p.checklist.filter((v:unknown)=>typeof v==='string'&&checklist.includes(v));d.scan=p.scan===1?1:0;if(typeof p.lastScan==='string'&&!isNaN(Date.parse(p.lastScan)))d.lastScan=p.lastScan;if(['Weekly','Fortnightly','Monthly','Manual only'].includes(p.frequency))d.frequency=p.frequency;if(Array.isArray(p.events))d.events=p.events.filter((v:any)=>typeof v?.id==='string'&&typeof v?.text==='string'&&typeof v?.date==='string').slice(0,100);if(p.decisions&&typeof p.decisions==='object')for(const [id,raw] of Object.entries(p.decisions)){const r=raw as any;if(!r||typeof r!=='object')continue;const value:Decision={};if(statuses.includes(r.status))value.status=r.status;if(priorities.includes(r.priority))value.priority=r.priority;if(typeof r.note==='string')value.note=r.note;if(['archived','deleted'].includes(r.hidden))value.hidden=r.hidden;d.decisions[id]=value;}}return base;}catch{return defaults();}}
export interface Connection {configured:boolean;connected:boolean;instance?:string;account?:string;next?:string|null;error?:string;missing?:string[];retryAfter?:number;}
interface Store {runDemoScan:()=>void;posts:Post[];analysisPending:boolean;analysisAt:string;changedPosts:Set<string>;connection:Connection;connectionError:string;connectionBusy:boolean;connectionChecking:boolean;refreshConnection:()=>Promise<void>;loadConnection:(more?:boolean)=>Promise<void>;disconnect:()=>Promise<void>;importData:(value:unknown)=>void;state:State;p:ProfileState;update:(patch:Partial<ProfileState>,event?:string)=>void;settings:(patch:Partial<State>)=>void;decide:(ids:string[],patch:Decision,event:string)=>void;undo:()=>void;canUndo:boolean;reset:()=>void;notice:string;toast:(text:string)=>void;}
const Context=createContext<Store>(null!);
export function Provider({children}:{children:ReactNode}){const [state,setState]=useState(read);
const raw=state.profiles[state.persona];
const [live,setLive]=useState<Post[]>([]);
const [connection,setConnection]=useState<Connection>({configured:false,connected:false});
const [connectionError,setConnectionError]=useState('');
const [connectionBusy,setConnectionBusy]=useState(false);
const [connectionChecking,setConnectionChecking]=useState(true);const connectionCheckVersion=useRef(0);
const liveVersion=useRef(0);
const activePersona=useRef(state.persona);activePersona.current=state.persona;
const [completed,setCompleted]=useState({persona:state.persona,industry:raw.industry,occupation:raw.occupation,description:raw.roleDescription,at:new Date().toISOString(),signatures:{} as Record<string,string>,changed:new Set<string>()});
const analysisVersion=useRef(0);
const allPosts=[...demoPosts,...(raw.importedPosts||[]),...live.map(x=>({...x,persona:state.persona}))];
const analysisKey=JSON.stringify([state.persona,raw.industry,raw.occupation,raw.roleDescription,raw.source,raw.importedPosts?.length,live.length]);
const [doneKey,setDoneKey]=useState('');
useEffect(()=>{const version=++analysisVersion.current;const timer=setTimeout(()=>{
const signatures=Object.fromEntries(allPosts.map(x=>{const a=analyse(x,raw.industry,{},raw.occupation);return [x.id,JSON.stringify([a.priority,a.explanation,a.next])];}));
if(version!==analysisVersion.current)return;
setCompleted(old=>({persona:state.persona,industry:raw.industry,occupation:raw.occupation,description:raw.roleDescription,at:new Date().toISOString(),signatures,changed:new Set(Object.keys(signatures).filter(id=>old.persona===state.persona&&old.signatures[id]&&old.signatures[id]!==signatures[id]))}));setDoneKey(analysisKey);
},250);return()=>{clearTimeout(timer);++analysisVersion.current;};},[analysisKey]);
async function api(action:string,method='GET'){
const r=await fetch('/api/connection?action='+action,{method,headers:method==='POST'?{'X-DFM-Request':'1'}:{},credentials:'same-origin',cache:'no-store'});
if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('We couldn’t reach account connections. You can import an archive or try again shortly.');
const d=await r.json();if(!r.ok){const e=new Error(d.error||'Connection request failed.') as Error&{retryAfter?:number};e.retryAfter=d.retryAfter;throw e;}return d;
}
async function refreshConnection(){const v=++connectionCheckVersion.current;setConnectionChecking(true);setConnectionError('');try{const d=await api('status');if(v===connectionCheckVersion.current)setConnection(d);}catch(e){if(v===connectionCheckVersion.current)setConnectionError((e as Error).message);}finally{if(v===connectionCheckVersion.current)setConnectionChecking(false);}}
useEffect(()=>{void refreshConnection();},[]);
async function loadConnection(more=false){if(connectionBusy)return;const v=++liveVersion.current;setConnectionBusy(true);setConnectionError('');try{
const d=await api('posts'+(more&&connection.next?'&cursor='+encodeURIComponent(connection.next):''));
if(v!==liveVersion.current)return;
const values=d.posts.map((x:any)=>externalPost(x,activePersona.current,'connected'));
setLive(old=>[...new Map([...(more?old:[]),...values].map(x=>[x.id,x])).values()]);
setConnection(c=>({...c,connected:true,next:d.next,account:d.account,configured:true}));
update({source:'connected'},'Connected account content loaded');
}catch(e){if(v===liveVersion.current)setConnectionError((e as Error).message+((e as any).retryAfter?' Retry after '+(e as any).retryAfter+' seconds.':''));}finally{if(v===liveVersion.current)setConnectionBusy(false);}}
async function disconnect(){++liveVersion.current;setConnectionBusy(true);setConnectionError('');try{const d=await api('disconnect','POST');setLive([]);setConnection({configured:true,connected:false});setState(s=>({...s,profiles:Object.fromEntries(Object.entries(s.profiles).map(([id,p])=>[id,{...p,source:p.source==='connected'?'connected':p.source,decisions:Object.fromEntries(Object.entries(p.decisions).filter(([key])=>!key.startsWith('connected-')))}]))}));if(d.warning)setConnectionError(d.warning);}catch(e){setConnectionError((e as Error).message);}finally{setConnectionBusy(false);}}
function importData(value:unknown){const importedPosts=importArchive(value,state.persona);update({importedPosts,source:'imported'},importedPosts.length+' archive posts imported into this browser');}
const effective={...raw,industry:completed.persona===state.persona?completed.industry:raw.industry,occupation:completed.persona===state.persona?completed.occupation:raw.occupation};
const [previous,setPrevious]=useState<State|null>(null);const [notice,toast]=useState('');const [storageError,setStorageError]=useState(false);
useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(state));setStorageError(false);}catch{setStorageError(true);}},[state]);
useEffect(()=>{document.documentElement.dataset.theme=state.theme;document.documentElement.dataset.density=state.compact?'compact':'comfortable';document.documentElement.dataset.motion=state.reduced?'reduced':'normal';},[state.theme,state.compact,state.reduced]);
useEffect(()=>{if(!notice)return;const id=setTimeout(()=>toast(''),6000);return()=>clearTimeout(id);},[notice]);
function update(patch:Partial<ProfileState>,event?:string){setState(s=>{setPrevious(s);const p=s.profiles[s.persona];return{...s,profiles:{...s.profiles,[s.persona]:{...p,...patch,events:event?[{id:crypto.randomUUID(),date:new Date().toISOString(),text:event,read:false},...p.events].slice(0,100):patch.events||p.events}}};});if(event)toast(event);}
function decide(ids:string[],patch:Decision,event:string){const decisions={...state.profiles[state.persona].decisions};ids.forEach(id=>decisions[id]={...decisions[id],...patch});update({decisions},event);}
function runDemoScan(){
setState(s=>{const profile=s.profiles[s.persona];if(profile.scan||(profile.source||'demo')!=='demo')return s;
const now=new Date().toISOString();const count=demoPosts.filter(x=>x.persona===s.persona&&x.monitor&&profile.platforms.includes(x.platform)).length;
return {...s,profiles:{...s.profiles,[s.persona]:{...profile,scan:1,lastScan:now,events:[{id:crypto.randomUUID(),date:now,text:'Demo scan completed: '+count+' new posts in your review ('+3+' sample posts unlocked).',read:false},...profile.events].slice(0,100)}}};
});
}
return <Context.Provider value={{runDemoScan,state,p:effective,posts:allPosts,analysisPending:doneKey!==analysisKey,analysisAt:completed.at,changedPosts:completed.changed,connection,connectionError,connectionBusy,connectionChecking,refreshConnection,loadConnection,disconnect,importData,update,settings:patch=>setState(s=>({...s,...patch})),decide,undo:()=>{if(previous){setState(previous);setPrevious(null);toast('Previous action restored.');}},canUndo:!!previous,reset:()=>{setPrevious(state);setState(defaults());toast('Demo restored to its original state.');},notice:storageError?'Browser storage is unavailable. Changes will last only for this session.':notice,toast}}>{children}</Context.Provider>;}
export const useStore=()=>useContext(Context);
