export type GuideAction={to:string;label:string};
export type GuideTopic={label:string;text:string;action:GuideAction};
export function guidedReply(question:string,topics:GuideTopic[],role:string,previous?:{text:string;action?:GuideAction}){
const q=question.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9\s]/g,' ');
const has=(pattern:RegExp)=>pattern.test(q);
if(has(/\b(shorter|summarise|summarize|simpler|brief)\b/)){
const text=previous?.text||topics[0].text;const words=text.split(/\s+/).filter(Boolean);return {text:words.slice(0,35).join(' ')+(words.length>35?'…':''),action:previous?.action||topics[0].action};
}
if(has(/\b(dismiss|resolved|reviewed|follow up|undo)\b/))return {text:'Mark reviewed after checking a suggestion. Dismiss when the concern does not apply. Follow up if you need more information. Use Undo to reverse your last action.',action:{to:'/review?unresolved=yes',label:'Open content review'}};
if(has(/\b(report|reports|pdf|csv|export)\b/))return {text:'Open Reports to download a PDF or CSV. Apply filters in Content Review first if you only want some posts included.',action:{to:'/reports',label:'Open reports'}};
if(has(/\b(connect|import|account|accounts|archive)\b/))return {text:'Connect Mastodon or import outbox.json in Accounts & Data. Check the handle belongs to you. Other platform connections are not available yet.',action:{to:'/platforms',label:'Manage accounts'}};
const topic=has(/\b(privacy|private|confidential|consent|photo|photos|identifiable)\b/)?topics[1]:has(/\b(profile|bio|portfolio|linkedin|qualification|qualifications|resume|cv|dates)\b/)?topics[2]:has(/\b(context|old post|explain|caption|joke)\b/)?topics[3]:has(/\b(plan|start|first|review|check|priorities|career|help)\b/)?topics[0]:null;
return topic?{text:topic.text,action:topic.action}:{text:'I use prepared guidance for '+role+'. I can help with a review plan, privacy checks, profile wording, old-post context or review actions. Choose a prompt or ask about one of those topics.'};
}
