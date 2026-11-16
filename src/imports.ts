import type {Post,Category} from './types';
export function plainText(html:string){return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
export function contentCategory(text:string):Category{
// Narrow, explainable cues only. Never classify identity, politics, sentiment or lawful opinions.
if(/\b(password|access code|entry code|api[_ -]?key)\s*[:=]\s*\S+/i.test(text))return 'confidentiality';
if(/\b(my (CV|resume|profile).{0,40}(wrong|incorrect|different) date)/i.test(text))return 'consistency';
return 'ordinary';
}
export function externalPost(raw:{id:string;text:string;date:string;visibility?:string;url?:string},persona:string,source:'imported'|'connected'):Post{
const text=plainText(raw.text).slice(0,20000);
return {id:source+'-mastodon-'+raw.id,persona,source,platform:'Mastodon',date:new Date(raw.date).toISOString().slice(0,10),text,category:contentCategory(text),type:'Post',visibility:raw.visibility==='public'||raw.visibility==='unlisted'?'Public':'Private',missing:'Only retrieved text and metadata are available. Authorship, consent, media and surrounding conversation have not been verified.',alternative:'A literal cue can be fictional, quoted or already public. Check the original post before taking action.',url:raw.url?.startsWith('https://')?raw.url:undefined};
}
export function importArchive(value:unknown,persona:string):Post[]{
const x=value as any;
if(!x||!['OrderedCollection','OrderedCollectionPage'].includes(x.type)||!Array.isArray(x.orderedItems))throw Error('Expected Mastodon outbox.json with an ActivityStreams OrderedCollection and orderedItems array. Extract the JSON from your archive first.');
if(x.orderedItems.length>5000)throw Error('This prototype supports at most 5,000 archive entries.');
const result:Post[]=[];
for(const activity of x.orderedItems){
if(activity?.type!=='Create')continue;const o=activity.object;
if(!o||o.type!=='Note'||typeof o.id!=='string'||typeof o.content!=='string'||typeof o.published!=='string'||!Number.isFinite(Date.parse(o.published)))throw Error('An archive post is missing a valid id, content or publication date. No data was imported.');
const audience=[...(Array.isArray(o.to)?o.to:[]),...(Array.isArray(o.cc)?o.cc:[])];
result.push(externalPost({id:o.id,text:o.content,date:o.published,visibility:audience.includes('https://www.w3.org/ns/activitystreams#Public')?'public':'private',url:typeof o.url==='string'?o.url:undefined},persona,'imported'));
}
if(!result.length)throw Error('No supported Create/Note posts found. Media and Announce boosts are not imported.');
return [...new Map(result.map(p=>[p.id,p])).values()];
}
