import {useEffect} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {ArrowRight,Check,BookOpen,X} from 'lucide-react';
import {useStore} from './store';
import {scoped,analyse,resolved} from './engine';
import {IndustryControl} from './components';
export function useTutorial(){
const {state,settings,toast}=useStore();const navigate=useNavigate();
function start(){
if(state.tutorialStep!==undefined){navigate(state.tutorialStep===1?'/review?open='+encodeURIComponent(state.tutorialPostId||''):state.tutorialStep===2?'/reports':'/');return;}
const raw=state.profiles[state.persona];
settings({onboarded:true,tutorialStep:0,tutorialPostId:undefined,tutorialPreviousSource:raw.source||'demo',tutorialPersona:state.persona,profiles:{...state.profiles,[state.persona]:{...raw,source:'demo'}}});
navigate('/');
}
function exit(finished=false){
const person=state.tutorialPersona;const profiles=person&&state.profiles[person]?{...state.profiles,[person]:{...state.profiles[person],source:state.tutorialPreviousSource||'demo'}}:state.profiles;
settings({profiles,onboarded:true,tutorialStep:undefined,tutorialPostId:undefined,tutorialPreviousSource:undefined,tutorialPersona:undefined,tutorialDone:finished||state.tutorialDone});
toast(finished?'Tutorial complete. You’re ready to review your own posts.':'Tutorial paused. Your review decisions are saved.');
navigate('/');
}
return {start,exit};
}
export default function Tutorial(){
const {state,p,posts,settings,analysisPending}=useStore();const navigate=useNavigate();const location=useLocation();const {exit}=useTutorial();
const step=state.tutorialStep;
const all=scoped(posts,state.persona,p);
const examples=all.filter(x=>(x.source||'demo')==='demo'&&analyse(x,p.industry,{},p.occupation).priority!=='No concern identified');
const example=examples.find(x=>!resolved(p.decisions[x.id]?.status))||examples[0];
useEffect(()=>{if(step===2&&location.pathname!=='/reports')navigate('/reports');},[step]);
if(step===undefined)return null;
return <section className="tutorial-guide" aria-label="Tutorial"><div className="tutorial-guide-top"><span><BookOpen size={16}/> Tutorial · Step {step+1} of 3</span><button className="icon" aria-label="Exit tutorial" onClick={()=>exit()}><X size={17}/></button></div><div className="tutorial-progress" aria-label={'Tutorial step '+(step+1)+' of 3'}>{['Choose a career','Review a post','See your report'].map((s,i)=><span key={s} className={i===step?'current':i<step?'complete':''}>{i<step?<Check size={13}/>:i+1}<span>{s}</span></span>)}</div>
{step===0?<><h2>First, choose the career you want to prepare for.</h2><p>This changes which details may be relevant. You can keep the current career or choose another.</p><div className="tutorial-actions"><IndustryControl/><button className="primary" disabled={analysisPending||!example} onClick={()=>{if(!example)return;settings({tutorialStep:1,tutorialPostId:example.id});navigate('/review?open='+encodeURIComponent(example.id));}}>Use this career <ArrowRight size={16}/></button></div>{!analysisPending&&!example&&<p>Enable a demo platform to open an example. <Link to="/platforms">Choose demo platforms →</Link></p>}</>:step===1?<><h2>Now review one post and make a decision.</h2><p>Read why it was flagged and what context may be missing. Add a note if useful, then choose <strong>Mark reviewed</strong> or <strong>Dismiss</strong>. This only changes your review record.</p><Link className="button" to={'/review?open='+encodeURIComponent(state.tutorialPostId||'')}>Open the example post <ArrowRight size={15}/></Link></>:<><h2>Your decision is now reflected in your report.</h2><p>Your report shows the selected career, included posts and your review decisions. Use Download PDF or Export CSV below when you want a copy.</p><button className="primary" onClick={()=>exit(true)}>Finish tutorial <Check size={16}/></button></>}
<p className="tutorial-sample-note">Tutorial uses sample posts. Your own imported or connected posts are kept separate.</p></section>;
}
