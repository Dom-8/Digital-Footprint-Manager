import {roleResponsibilities,roleCategories} from './careers';
import {industries} from './data';
import type {Post,Decision,Priority,ProfileState} from './types';
export const resolved=(s?:string)=>s==='Reviewed'||s==='Dismissed';
export function analyse(post:Post, industryId:string, decision:Decision={},occupation=''){
const industry=industries.find(i=>i.id===industryId)||industries[9];
const responsibilities=roleResponsibilities(occupation);
const relevant=(occupation&&responsibilities.length?[...roleCategories(occupation),'privacy','confidentiality','credentials','consistency']:industry.categories).includes(post.category);
let priority:Priority='No concern identified';
if(post.category!=='ordinary'){
priority= relevant ? (['privacy','confidentiality'].includes(post.category)&&post.visibility==='Public'?'High priority':['creative','humour','ambiguous','misattributed'].includes(post.category)?'Context needed':'Medium priority') : ['creative','humour','ambiguous','misattributed'].includes(post.category)?'Context needed':'Low priority';
if(post.visibility==='Private'&&priority==='Medium priority')priority='Low priority';
}
const before=priority;
if(decision.note?.trim()&&priority==='Context needed')priority='Low priority';
if(decision.priority)priority=decision.priority;
const messages={
privacy:{why:'This post may identify someone who expected privacy.',next:'Check whether anyone can be identified. If you don’t have permission to share their details, remove them on the original platform.'},
confidentiality:{why:'This post may share information that wasn’t meant to be public.',next:'Check whether these details are public or approved for sharing. Remove private information on the original platform if needed.'},
credentials:{why:'This claim may need checking against your current qualifications.',next:'Compare the claim with your qualifications. Make it clear if you’re still studying or training.'},
consistency:{why:'Some professional details may not match your other records.',next:'Check the dates and job details against your records, then correct or explain any differences.'},
safety:{why:'This post could be read as describing unsafe work.',next:'Watch or read the full post. If it was staged, training or a joke, add that context before deciding what to change.'},
communication:{why:'A short excerpt may make this conversation sound different from what you intended.',next:'Read the full conversation. Add any missing context, and check whether another person’s details need removing.'},
conflict:{why:'This exchange may be missing the other side of the conversation.',next:'Read the full exchange before deciding whether it needs clarification or a change.'},
creative:{why:'Creative work can be misunderstood when its original context is missing.',next:'Check that it’s clear who is speaking and whether the work is fictional, quoted or satirical.'},
humour:{why:'This joke may be missing the context that made its meaning clear.',next:'Check the original audience and conversation. Add context if the excerpt gives a different impression.'},
ambiguous:{why:'The meaning of this post isn’t clear from the excerpt.',next:'Open the original post and check what it refers to. Add a short explanation if something important is missing.'},
misattributed:{why:'This post may not belong to you.',next:'Check the original account and who published the post before treating it as yours.'},
ordinary:{why:'These limited checks didn’t find a specific issue to review.',next:'No action is suggested by these checks. You can still review the post and its visibility yourself.'}
}[post.category];
const roleReason=responsibilities.find(r=>r.categories.includes(post.category));
const careerNote=roleReason?roleReason.reason:relevant?'Start with privacy, permissions and accurate professional details for this role.':'This has less direct relevance to the selected role. Context may still be useful.';
const roleLink=roleReason?.label==='Practical safety'?'check what this says about safety in physical work':roleReason?.label==='People in your care'?'check whether someone in your care could be identified':roleReason?.label==='Entrusted information'?'check that you have permission to share work or client details':roleReason?.label==='Published and creative work'?'make the original speaker and creative context clear':relevant?'start by checking privacy, permissions and accuracy':'add context if you think it would help';
const explanation=messages.why+(post.category==='ordinary'?' These checks can miss things.':' For '+(occupation||industry.name)+', '+roleLink+'.');
return {priority,before,relevant,explanation,careerNote,uncertainty:decision.note?'Context added by you':post.category==='ordinary'?'Limited checks':'Needs your judgement',
context:decision.note?'Your note: “'+decision.note+'”. '+(['privacy','confidentiality','credentials'].includes(post.category)?'Check the original details before treating the concern as resolved.':'The note adds context, but hasn’t been checked independently.'):post.missing,
next:messages.next};
}

export function scoped(all:Post[],persona:string,p:ProfileState,includeHidden=false){return all.filter(x=>(x.source||'demo')===(p.source||'demo')&&x.persona===persona&&((x.source&&x.source!=='demo')||p.platforms.includes(x.platform))&&(!x.monitor||Number(x.id.split('-')[1])-26<p.scan*3)&&(includeHidden||!p.decisions[x.id]?.hidden));}
export function metrics(items:Post[],p:ProfileState){const flagged=items.filter(x=>analyse(x,p.industry,p.decisions[x.id],p.occupation).priority!=='No concern identified');const done=flagged.filter(x=>resolved(p.decisions[x.id]?.status));return{total:items.length,flagged:flagged.length,done:done.length,unresolved:flagged.length-done.length,progress:flagged.length?Math.round(done.length/flagged.length*100):0};}

export function priorityTone(priority:string,status?:string){return resolved(status)||priority==='No concern identified'?'neutral':priority==='High priority'?'high':priority==='Medium priority'||priority==='Context needed'?'medium':'low';}
export function filterItems(items:Post[],p:ProfileState,params:URLSearchParams){return items.filter(x=>{
const a=analyse(x,p.industry,p.decisions[x.id],p.occupation),s=p.decisions[x.id]?.status||'Not reviewed';
return (!params.get('q')||x.text.toLowerCase().includes(params.get('q')!.toLowerCase()))&&(!params.get('platform')||x.platform===params.get('platform'))&&(!params.get('priority')||a.priority===params.get('priority'))&&(!params.get('status')||s===params.get('status'))&&(!params.get('category')||x.category===params.get('category'))&&(!params.get('type')||x.type===params.get('type'))&&(!params.get('visibility')||x.visibility===params.get('visibility'))&&(!params.get('relevance')||a.relevant===(params.get('relevance')==='direct'))&&(!params.get('from')||x.date>=params.get('from')!)&&(!params.get('to')||x.date<=params.get('to')!)&&(!params.get('unresolved')||(a.priority!=='No concern identified'&&!resolved(s)))&&(!params.get('removed')||!!p.decisions[x.id]?.hidden)&&(!params.get('resolved')||(a.priority!=='No concern identified'&&resolved(s)));
}).sort((a,b)=>params.get('sort')==='oldest'?a.date.localeCompare(b.date):params.get('sort')==='platform'?a.platform.localeCompare(b.platform):params.get('sort')==='priority'?prioritiesRank(a,p)-prioritiesRank(b,p):b.date.localeCompare(a.date));}
function prioritiesRank(x:Post,p:ProfileState){return ['High priority','Medium priority','Context needed','Low priority','No concern identified'].indexOf(analyse(x,p.industry,p.decisions[x.id],p.occupation).priority);}
