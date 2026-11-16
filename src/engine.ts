import {industries, categories} from './data';
import type {Post,Decision,Priority,ProfileState} from './types';
export const resolved=(s?:string)=>s==='Reviewed'||s==='Dismissed';
export function analyse(post:Post, industryId:string, decision:Decision={}){
const industry=industries.find(i=>i.id===industryId)||industries[9];
const relevant=industry.categories.includes(post.category);
let priority:Priority='No concern identified';
if(post.category!=='ordinary'){
priority= relevant ? (['privacy','confidentiality'].includes(post.category)&&post.visibility==='Public'?'High priority':['creative','humour','ambiguous','misattributed'].includes(post.category)?'Context needed':'Medium priority') : ['creative','humour','ambiguous','misattributed'].includes(post.category)?'Context needed':'Low priority';
if(post.visibility==='Private'&&priority==='Medium priority')priority='Low priority';
}
const before=priority;
if(decision.note?.trim()&&priority==='Context needed')priority='Low priority';
if(decision.priority)priority=decision.priority;
const explanation=post.category==='ordinary'?'No professional concern is identified by the sample rules. This is not a verification of the content.':relevant?categories[post.category]+' may be relevant to '+industry.name.toLowerCase()+'. '+industry.guidance:'This category has indirect relevance to '+industry.name.toLowerCase()+'. '+industry.focus+' is the primary focus for this profile.';
return {priority,before,relevant,explanation,uncertainty:decision.note?'User context supplied; independently unverified':post.category==='ordinary'?'Insufficient information':relevant?'Possible industry relevance':'Context dependent',
context:decision.note?'Your explanation adds context: “'+decision.note+'”. It has not been independently verified. '+(['privacy','confidentiality','credentials'].includes(post.category)?'The original review concern remains until the underlying information is checked.':'This may support a less literal interpretation, but uncertainty remains.'):post.missing,
next:post.category==='ordinary'?'Review visibility if you wish.':'Check the original conversation, account ownership and permissions; add context and choose your own next step.'};
}
export function scoped(all:Post[],persona:string,p:ProfileState,includeHidden=false){return all.filter(x=>x.persona===persona&&p.platforms.includes(x.platform)&&(!x.monitor||Number(x.id.split('-')[1])-26<p.scan*3)&&(includeHidden||!p.decisions[x.id]?.hidden));}
export function metrics(items:Post[],p:ProfileState){const flagged=items.filter(x=>analyse(x,p.industry,p.decisions[x.id]).priority!=='No concern identified');const done=flagged.filter(x=>resolved(p.decisions[x.id]?.status));return{total:items.length,flagged:flagged.length,done:done.length,unresolved:flagged.length-done.length,progress:flagged.length?Math.round(done.length/flagged.length*100):0};}
