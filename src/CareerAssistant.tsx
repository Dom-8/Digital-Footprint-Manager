import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useStore} from './store';
import {careerGuide} from './careerGuidance';
import {scoped,analyse,resolved} from './engine';
type Message={role:'user'|'assistant';text:string};
export default function CareerAssistant({onNavigate}:{onNavigate?:()=>void}={}){
const {p,state,posts}=useStore();const guide=careerGuide(p.occupation,p.industry);
const [question,setQuestion]=useState(''),[messages,setMessages]=useState<Message[]>([]),[error,setError]=useState(''),[copied,setCopied]=useState(-1);
const end=useRef<HTMLDivElement>(null);
const items=scoped(posts,state.persona,p);const pending=items.filter(x=>analyse(x,p.industry,p.decisions[x.id],p.occupation).priority!=='No concern identified'&&!resolved(p.decisions[x.id]?.status));
useEffect(()=>{setMessages([]);setError('');setQuestion('');setCopied(-1);},[p.occupation,p.industry,state.persona,p.source]);
useEffect(()=>{if(messages.length)end.current?.scrollIntoView({block:'nearest',behavior:'auto'});},[messages]);
function clear(){setMessages([]);setQuestion('');setError('');setCopied(-1);}
const topics=[
{label:'Make a review plan',question:'Give me a short online-presence review plan for my career.',text:['1. '+guide.checks[0].text,'2. '+guide.action,'3. Open Content Review. Add context, then mark reviewed or dismiss.'].join('\n\n')},
{label:'Check privacy',question:'What privacy details should I check in my posts?',text:guide.checks.map(x=>x.title+': '+x.text).join('\n\n')+'\n\nCheck faces, captions and background details on the original platform. This app analyses text only.'},
{label:'Improve my profile',question:'How can I improve my public career profile?',text:guide.action+'\n\nProfile outline:\n'+p.occupation+' | [current study or verified qualification]\n[Your skill] · [a project you can discuss publicly]\n[Accurate dates and your contribution]\n\nReplace brackets with details you can support.'},
{label:'Explain an old post',question:'Help me add context to an old post without inventing an excuse.',text:'Context template:\n“Posted in [year] during [situation]. This was [your actual role or purpose]. The excerpt leaves out [relevant context]. Since then, [a change you can support, if relevant].”\n\nUse only details you know. A note does not automatically resolve private information.'}
];
function reply(text:string,answer:string){setError('');setMessages(v=>[...v,{role:'user',text},{role:'assistant',text:answer}]);setQuestion('');}
function useGuide(topic:typeof topics[number]){reply(topic.label,topic.text);}
function ask(){const text=question.trim();if(!text)return;const q=text.toLowerCase();
let answer:string;
if(/shorter|summaris|summariz|simpler/.test(q)){const last=[...messages].reverse().find(x=>x.role==='assistant');answer=last?last.text.split('\n\n').slice(0,2).join('\n\n'):'Start with this: '+guide.checks[0].text;}
else if(/privacy|private|confidential|consent|photo|identif/.test(q))answer=topics[1].text;
else if(/profile|bio|portfolio|linkedin|qualification|resume|cv/.test(q))answer=topics[2].text;
else if(/context|old post|explain|caption|joke/.test(q))answer=topics[3].text;
else if(/dismiss|resolved|mark reviewed|follow.?up/.test(q))answer='Mark reviewed when you have checked a suggestion. Dismiss when the concern does not apply. Choose Follow up if you still need information. These actions update your review record, not the original post.';
else if(/report|pdf|csv|export/.test(q))answer='Open Reports to download a PDF or CSV of the current review. Use filters in Content Review to report on a smaller set of posts.';
else if(/connect|import|account|archive/.test(q))answer='Open Accounts & Data to connect Mastodon or import outbox.json. You can use demo posts while setting up your own data.';
else if(/plan|start|first|review|check|priorit|career|help/.test(q))answer=topics[0].text;
else answer='I use prepared guidance for '+p.occupation+'. Try asking for a review plan, privacy checks, profile wording or context for an old post. I can also explain review actions and reports.';
reply(text,answer);
}
return <div className="career-assistant expanded-assistant">
<div className="assistant-context"><div><strong>{p.occupation}</strong><span>{guide.industry}</span></div><button onClick={clear} disabled={!messages.length&&!question}>New chat</button></div>
<div className="assistant-shortcuts"><Link onClick={onNavigate} to="/review?unresolved=yes">Review {pending.length} pending</Link><Link onClick={onNavigate} to="/industry">Change career</Link><Link onClick={onNavigate} to="/reports">Open report</Link></div>

<div className="assistant-topics" role="group" aria-label="Career guide tools">{topics.map(topic=><button key={topic.label} onClick={()=>useGuide(topic)}>{topic.label}</button>)}</div>
<div className="assistant-thread" aria-label="Conversation">{messages.map((m,i)=><article className={'assistant-message '+m.role} key={i}><small>{m.role==='user'?'You':'Guided reply'}</small><div className="assistant-answer" role={m.role==='assistant'&&i===messages.length-1?'status':undefined}>{m.text}</div>{m.role==='assistant'&&<button className="quiet-action" onClick={async()=>{try{await navigator.clipboard.writeText(m.text);setCopied(i);}catch{setError('Copy unavailable. Select the answer text to copy it.');}}}>{copied===i?'Copied':'Copy answer'}</button>}</article>)}<div ref={end}/></div>
<span className="scope-label">Guided chat · {p.occupation}</span>
<form onSubmit={e=>{e.preventDefault();ask();}}><label className="field"><span>Ask about your online presence</span><textarea rows={3} maxLength={1000} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();ask();}}} placeholder={messages.length?'Ask a follow-up…':'What should I check as a '+p.occupation+'?'}/></label>
<div className="actions"><button className="primary" disabled={!question.trim()}>Send message</button></div></form>
{error&&<p role="alert">{error}</p>}

</div>;
}
