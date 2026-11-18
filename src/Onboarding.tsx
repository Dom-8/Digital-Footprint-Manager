import {ArrowRight,Briefcase,ScanEye,CheckCircle2} from 'lucide-react';
import {useStore} from './store';
import {Modal} from './components';
import {useTutorial} from './Tutorial';
export default function Onboarding(){const {settings}=useStore();const {start,startDemo}=useTutorial();
return <Modal title="Welcome to Digital Footprint Manager" wide onClose={()=>settings({onboarded:true})}><div className="welcome-simple"><span className="eyebrow">A CLEARER VIEW OF YOUR ONLINE HISTORY</span><h1 aria-label="Understand old posts. Decide your next step.">Understand old posts.<br/>Decide your next step.</h1><p>Optional tools to review your public profile, privacy and posts.</p><ol className="welcome-steps"><li><Briefcase size={20}/><div><strong>Make it yours</strong></div></li><li><ScanEye size={20}/><div><strong>Connect your account</strong></div></li><li><CheckCircle2 size={20}/><div><strong>Make a decision</strong></div></li></ol><div className="actions"><button className="primary" onClick={start}>Start tutorial <ArrowRight size={16}/></button><button onClick={startDemo}>Try sample tutorial</button><button onClick={()=>settings({onboarded:true})}>Explore on my own</button></div><p className="fine">Progress saves in this browser.</p></div></Modal>;
}
