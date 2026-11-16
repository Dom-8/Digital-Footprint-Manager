import {roleResponsibilities,roleCategories} from './careers';
import {industries, categories} from './data';
import type {Post,Decision,Priority,ProfileState} from './types';
export const resolved=(s?:string)=>s==='Reviewed'||s==='Dismissed';
export function analyse(post:Post, industryId:string, decision:Decision={},occupation=''){
const industry=industries.find(i=>i.id===industryId)||industries[9];
const responsibilities=roleResponsibilities(occupation);
const relevant=(occupation&&responsibilities.length?[...roleCategories(occupation),'credentials','consistency']:industry.categories).includes(post.category);
let priority:Priority='No concern identified';
if(post.category!=='ordinary'){
priority= relevant ? (['privacy','confidentiality'].includes(post.category)&&post.visibility==='Public'?'High priority':['creative','humour','ambiguous','misattributed'].includes(post.category)?'Context needed':'Medium priority') : ['creative','humour','ambiguous','misattributed'].includes(post.category)?'Context needed':'Low priority';
if(post.visibility==='Private'&&priority==='Medium priority')priority='Low priority';
}
const before=priority;
if(decision.note?.trim()&&priority==='Context needed')priority='Low priority';
if(decision.priority)priority=decision.priority;
const explanation=post.category==='ordinary'?'No specific cue is identified by these limited rules. This is not a verification of the content.':relevant?categories[post.category]+' may be relevant to '+industry.name.toLowerCase()+'. '+industry.guidance:'This category has indirect relevance to '+industry.name.toLowerCase()+'. '+industry.focus+' is the primary focus for this profile.';
const roleReason=responsibilities.find(r=>r.categories.includes(post.category));
const careerExplanation=explanation+' Selected career: '+(occupation||industry.name)+'. '+(roleReason?roleReason.reason:'No specific role responsibility was identified for this category; the field guidance is a broad starting point, not a job requirement.');
return {priority,before,relevant,explanation:careerExplanation,uncertainty:decision.note?'User context supplied; independently unverified':post.category==='ordinary'?'Insufficient information':relevant?'Possible industry relevance':'Context dependent',
context:decision.note?'Your explanation adds context: “'+decision.note+'”. It has not been independently verified. '+(['privacy','confidentiality','credentials'].includes(post.category)?'The original review concern remains until the underlying information is checked.':'This may support a less literal interpretation, but uncertainty remains.'):post.missing,
next:post.category==='ordinary'?'No specific issue identified by these limited rules. Review visibility if you wish.':post.category==='privacy'||post.category==='confidentiality'?'Verify consent and publication permission; remove identifying details on the original platform if permission is absent.':post.category==='credentials'||post.category==='consistency'?'Compare the claim with your current qualifications and records; clarify incomplete training or inconsistent dates.':post.category==='safety'?'Check the full recording and training context before deciding whether a safety clarification is needed.':'Check the original conversation, account ownership and creative context; add a note before deciding.'};
}
export function scoped(all:Post[],persona:string,p:ProfileState,includeHidden=false){return all.filter(x=>(x.source||'demo')===(p.source||'demo')&&x.persona===persona&&((x.source&&x.source!=='demo')||p.platforms.includes(x.platform))&&(!x.monitor||Number(x.id.split('-')[1])-26<p.scan*3)&&(includeHidden||!p.decisions[x.id]?.hidden));}
export function metrics(items:Post[],p:ProfileState){const flagged=items.filter(x=>analyse(x,p.industry,p.decisions[x.id],p.occupation).priority!=='No concern identified');const done=flagged.filter(x=>resolved(p.decisions[x.id]?.status));return{total:items.length,flagged:flagged.length,done:done.length,unresolved:flagged.length-done.length,progress:flagged.length?Math.round(done.length/flagged.length*100):0};}

export function priorityTone(priority:string,status?:string){return resolved(status)||priority==='No concern identified'?'neutral':priority==='High priority'?'high':priority==='Medium priority'||priority==='Context needed'?'medium':'low';}
export function filterItems(items:Post[],p:ProfileState,params:URLSearchParams){return items.filter(x=>{
const a=analyse(x,p.industry,p.decisions[x.id],p.occupation),s=p.decisions[x.id]?.status||'Not reviewed';
return (!params.get('q')||x.text.toLowerCase().includes(params.get('q')!.toLowerCase()))&&(!params.get('platform')||x.platform===params.get('platform'))&&(!params.get('priority')||a.priority===params.get('priority'))&&(!params.get('status')||s===params.get('status'))&&(!params.get('category')||x.category===params.get('category'))&&(!params.get('type')||x.type===params.get('type'))&&(!params.get('visibility')||x.visibility===params.get('visibility'))&&(!params.get('relevance')||a.relevant===(params.get('relevance')==='direct'))&&(!params.get('from')||x.date>=params.get('from')!)&&(!params.get('to')||x.date<=params.get('to')!)&&(!params.get('unresolved')||(a.priority!=='No concern identified'&&!resolved(s)))&&(!params.get('removed')||!!p.decisions[x.id]?.hidden);
}).sort((a,b)=>params.get('sort')==='oldest'?a.date.localeCompare(b.date):params.get('sort')==='platform'?a.platform.localeCompare(b.platform):params.get('sort')==='priority'?prioritiesRank(a,p)-prioritiesRank(b,p):b.date.localeCompare(a.date));}
function prioritiesRank(x:Post,p:ProfileState){return ['High priority','Medium priority','Context needed','Low priority','No concern identified'].indexOf(analyse(x,p.industry,p.decisions[x.id],p.occupation).priority);}
