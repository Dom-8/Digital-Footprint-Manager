import {useEffect,useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {ArrowRight,Check,BookOpen,X} from 'lucide-react';
import {useStore} from './store';
import {scoped,analyse,resolved} from './engine';
import Connections from './Connections';
import {IndustryControl} from './components';
export function useTutorial(){
const {state,settings,toast}=useStore();const navigate=useNavigate();
function startDemo(){
if(state.tutorialStep!==undefined){navigate(state.tutorialStep===1?'/review?open='+encodeURIComponent(state.tutorialPostId||''):state.tutorialStep===2?'/reports':'/');return;}
const raw=state.profiles[state.persona];
settings({setupStep:undefined,onboarded:true,tutorialStep:0,tutorialPostId:undefined,tutorialPreviousSource:raw.source||'demo',tutorialPersona:state.persona,profiles:{...state.profiles,[state.persona]:{...raw,source:'demo'}}});
navigate('/');
}
function exit(finished=false){
const person=state.tutorialPersona;const profiles=person&&state.profiles[person]?{...state.profiles,[person]:{...state.profiles[person],source:state.tutorialPreviousSource||'demo'}}:state.profiles;
settings({profiles,onboarded:true,tutorialStep:undefined,tutorialPostId:undefined,tutorialPreviousSource:undefined,tutorialPersona:undefined,tutorialDone:finished||state.tutorialDone});
toast(finished?'Tutorial complete.':'Progress saved.');
navigate('/');
}
function start(){settings({onboarded:true,setupStep:state.setupStep??state.setupResume??0,tutorialStep:undefined});navigate('/');}
return {start,startDemo,exit};
}
export default function Tutorial(){
const {state,p,posts,settings,analysisPending}=useStore();const navigate=useNavigate();const location=useLocation();const {exit}=useTutorial();
const step=state.tutorialStep;
const all=scoped(posts,state.persona,p);
const examples=all.filter(x=>(x.source||'demo')==='demo'&&analyse(x,p.industry,{},p.occupation).priority!=='No concern identified');
const example=examples.find(x=>!resolved(p.decisions[x.id]?.status))||examples[0];
useEffect(()=>{if(step===2&&location.pathname!=='/reports')navigate('/reports');},[step]);
if(state.setupStep!==undefined)return <AccountSetup/>;
if(step===undefined)return null;
return <section className="tutorial-guide" aria-label="Tutorial"><div className="tutorial-guide-top"><span><BookOpen size={16}/> Tutorial · Step {step+1} of 3</span><button className="icon" aria-label="Exit tutorial" onClick={()=>exit()}><X size={17}/></button></div><div className="tutorial-progress" aria-label={'Tutorial step '+(step+1)+' of 3'}>{['Choose a career','Review a post','See your report'].map((s,i)=><span key={s} className={i===step?'current':i<step?'complete':''}>{i<step?<Check size={13}/>:i+1}<span>{s}</span></span>)}</div>
{step===0?<><h2>Choose your career.</h2><div className="tutorial-actions"><IndustryControl/><button className="primary" disabled={analysisPending||!example} onClick={()=>{if(!example)return;settings({tutorialStep:1,tutorialPostId:example.id});navigate('/review?open='+encodeURIComponent(example.id));}}>Use this career <ArrowRight size={16}/></button></div>{!analysisPending&&!example&&<p>Enable a demo platform to open an example. <Link to="/platforms">Choose demo platforms →</Link></p>}</>:step===1?<><h2>Review one post.</h2><p>Read the suggestion, then choose <strong>Mark reviewed</strong> or <strong>Dismiss</strong>.</p><Link className="button" to={'/review?open='+encodeURIComponent(state.tutorialPostId||'')}>Open the example post <ArrowRight size={15}/></Link></>:<><h2>Your report is ready.</h2><p>Download PDF or CSV below.</p><button className="primary" onClick={()=>exit(true)}>Finish tutorial <Check size={16}/></button></>}
<p className="tutorial-sample-note">Sample posts</p></section>;
}

function AccountSetup(){
const {state,p,settings,update,posts,connection,analysisPending}=useStore();const nav=useNavigate();
const [name,setName]=useState(state.setupName||''),[email,setEmail]=useState(state.setupEmail||'');
const {startDemo}=useTutorial();const step=state.setupStep??0;const items=scoped(posts,state.persona,p).filter(x=>state.setupPractice?(x.source||'demo')==='demo':x.source==='connected'||x.source==='imported');
const ready=p.source==='connected'?connection.connected:p.source==='imported'&&!!p.importedPosts?.length;
const target=items.find(x=>!resolved(p.decisions[x.id]?.status))||items[0];
const go=(next:0|1|2|3|4)=>{settings({setupStep:next});nav(next===4?'/reports':'/');};
return <section className="tutorial-guide account-setup" aria-label="Account setup"><div className="tutorial-guide-top"><span><BookOpen size={16}/> Set up your workspace · {step+1} of 5</span><button onClick={()=>settings({setupStep:undefined,setupResume:step})}>Save & exit</button></div>
<div className="tutorial-progress">{['Your details','Your career','Your account','First review','Your report'].map((label,i)=><span key={label} className={step===i?'current':''}>{i<step?<Check size={13}/>:i+1} {label}</span>)}</div>
{step===0?<><h2>Your details.</h2><p>Saved in this browser. No login or email verification yet.</p><form onSubmit={e=>{e.preventDefault();settings({setupName:name.trim(),setupEmail:email.trim(),setupStep:1});update({name:name.trim()});}}><label className="field"><span>Your name</span><input required autoComplete="name" maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><label className="field"><span>Email address</span><input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button className="primary" type="submit">Save details & continue <ArrowRight size={16}/></button></form><button className="quiet-action" onClick={startDemo}>Try sample tutorial</button></>:step===1?<><h2>Choose your career, {state.setupName?.split(' ')[0]}.</h2><IndustryControl/><div className="tutorial-actions"><button onClick={()=>go(0)}>Back</button><button className="primary" disabled={analysisPending} onClick={()=>go(2)}>Continue to accounts <ArrowRight size={16}/></button></div></>:step===2?<><h2>Add your posts.</h2><Connections onboarding/><div className="tutorial-actions"><button onClick={()=>go(1)}>Back</button><button className="primary" disabled={!ready||analysisPending||(p.source==='connected'&&!items.length)} onClick={()=>{settings({setupPractice:false,setupStep:3,tutorialPostId:target?.id});nav('/review'+(target?'?open='+encodeURIComponent(target.id):''));}}>Continue with my posts <ArrowRight size={16}/></button><button onClick={()=>{settings({setupPractice:true,setupPreviousSource:p.source||'demo',setupStep:3,tutorialPostId:undefined});update({source:'demo'});nav('/review');}}>Skip for now — add posts later</button></div>{!items.length&&connection.connected&&<p>Load posts to continue, or save and exit.</p>}</>:step===3?<><h2>Review your first post.</h2>{state.setupPractice&&<span className="scope-label">Practice · Sample posts</span>}<p>Read the suggestion, then mark reviewed or dismiss.</p>{target?<Link className="primary" to={'/review?open='+encodeURIComponent(target.id)}>{state.setupPractice?'Open sample post':'Open my post'} <ArrowRight size={16}/></Link>:<button onClick={()=>go(4)}>Continue to report</button>}{state.setupPractice&&<button className="quiet-action" onClick={()=>go(4)}>Skip practice & see report</button>}</>:<><h2>{state.setupPractice?'Your practice report.':'Your first review is saved.'}</h2>{state.setupPractice&&<p>Sample data. Add your own posts in Accounts & Data.</p>}<div className="actions"><Link className="button" to="/reports">Open my report</Link><button className="primary" onClick={()=>{if(state.setupPractice)update({source:state.setupPreviousSource||'demo'});settings({setupPractice:undefined,setupPreviousSource:undefined,setupStep:undefined,setupResume:undefined,tutorialDone:true,tutorialPostId:undefined});nav('/');}}>Finish setup <Check size={16}/></button></div></>}
</section>;
}
