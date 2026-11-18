import {useEffect,useRef,useState} from 'react';
import {Routes,Route,NavLink,Link,useLocation,useNavigate} from 'react-router-dom';
import {LayoutDashboard,Fingerprint,ScanEye,History,Briefcase,ClipboardCheck,Radio,FileText,Link2,Settings as SettingsIcon,CircleHelp,Bell,Menu,X,PanelLeftClose,PanelLeftOpen,BookOpen,MoreHorizontal,Undo2,type LucideIcon} from 'lucide-react';
import {useStore} from './store';
import {industries} from './data';
import {AnalysisStatus,Modal,Empty} from './components';
import Dashboard from './Dashboard';
import ProfileReview from './ProfileReview';
import {Review} from './Review';
import {Platforms,Industry,Readiness,Monitoring,Reports,Settings,Methodology} from './Pages';
import Onboarding from './Onboarding';
import Tutorial,{useTutorial} from './Tutorial';
type NavItem={path:string;label:string;icon:LucideIcon;description:string};
const primary:NavItem[]=[
{path:'/',label:'Dashboard',icon:LayoutDashboard,description:'Your next step at a glance'},
{path:'/profile',label:'Profile & Privacy',icon:ClipboardCheck,description:'Check visibility and professional details'},
{path:'/review',label:'Content Review',icon:ScanEye,description:'Read, understand and decide'},
{path:'/platforms',label:'Accounts & Data',icon:Link2,description:'Connect an account or import posts'},
{path:'/industry',label:'Career & Industry',icon:Briefcase,description:'Choose the career for your review'},
{path:'/reports',label:'Reports',icon:FileText,description:'Your review, ready to download'}
];
const secondary:NavItem[]=[
{path:'/timeline',label:'Historical Timeline',icon:History,description:'Explore when posts were published'},
{path:'/readiness',label:'Career Readiness',icon:ClipboardCheck,description:'Keep track of preparation tasks'},
{path:'/monitoring',label:'Monitoring Centre',icon:Radio,description:'Demo scan and activity history'}
];
const utility:NavItem[]=[
{path:'/settings',label:'Privacy & Settings',icon:SettingsIcon,description:'Appearance, profiles and your data'},
{path:'/methodology',label:'Help & Methodology',icon:CircleHelp,description:'What the app can and cannot tell you'}
];
export default function App(){
const {state,p,analysisPending,settings,update,notice,undo,canUndo}=useStore();const {start}=useTutorial();
const navigate=useNavigate();
const [mobile,setMobile]=useState(false),[notifications,setNotifications]=useState(false),[more,setMore]=useState(false);
const location=useLocation();const aside=useRef<HTMLElement>(null),workspace=useRef<HTMLDivElement>(null),opener=useRef<HTMLButtonElement>(null);
const page=[...primary,...secondary,...utility].find(i=>i.path===location.pathname)||{label:location.pathname==='/identity'?'My Digital Identity':'Page',description:'Your personal review workspace'};
const [feedback,setFeedback]=useState<{label:string;id:number}|null>(null);
useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const done=(event:Event)=>{clearTimeout(timer);setFeedback({label:(event as CustomEvent<string>).detail,id:Date.now()});timer=setTimeout(()=>setFeedback(null),650);};window.addEventListener('review-complete',done);return()=>{clearTimeout(timer);window.removeEventListener('review-complete',done);};},[]);
const collapsed=!!state.sidebarCollapsed;const extraOpen=more||secondary.some(x=>x.path===location.pathname);
useEffect(()=>{setMobile(false);},[location.pathname,location.search]);
useEffect(()=>{if(!mobile)return;const previous=document.activeElement as HTMLElement;workspace.current?.setAttribute('inert','');const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';aside.current?.querySelector<HTMLButtonElement>('.close-nav')?.focus();
function keyboard(e:KeyboardEvent){if(e.key==='Escape'){setMobile(false);return;}if(e.key==='Tab'){const nodes=Array.from(aside.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')||[]).filter(x=>x.offsetParent!==null);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
document.addEventListener('keydown',keyboard);return()=>{workspace.current?.removeAttribute('inert');document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',keyboard);if(previous?.isConnected)previous.focus();};},[mobile]);
useEffect(()=>{const media=window.matchMedia('(min-width:768px)');const resize=()=>{if(media.matches)setMobile(false);};media.addEventListener('change',resize);return()=>media.removeEventListener('change',resize);},[]);
const navLink=(item:NavItem)=><NavLink key={item.path} to={item.path} end={item.path==='/'} aria-label={item.label} title={collapsed?item.label:undefined} onClick={()=>setMobile(false)}><item.icon size={19} aria-hidden="true"/><span className="nav-text">{item.label}</span></NavLink>;
return <><a className="skip" href="#main">Skip to content</a><div className={'app clarity-shell '+(collapsed?'sidebar-collapsed':'')}>
{mobile&&<button className="scrim" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}
<aside id="app-sidebar" ref={aside} className={'sidebar '+(mobile?'open':'')} aria-label="Workspace navigation"><div className="sidebar-brand"><Link className="brand" to="/" aria-label="Digital Footprint Manager"><span className="brand-icon"><Fingerprint size={25}/></span><span className="nav-text">Digital Footprint<small>MANAGER</small></span></Link><button className="mobile-only close-nav icon" aria-label="Close menu" onClick={()=>setMobile(false)}><X size={20}/></button></div>
<nav aria-label="Main navigation"><div className="nav-group">{primary.map(navLink)}</div><div className="nav-group"><button className="nav-more" aria-label="More tools" aria-expanded={extraOpen} aria-controls="more-tools" title={collapsed?'More tools':undefined} onClick={()=>setMore(!extraOpen)}><MoreHorizontal size={19}/><span className="nav-text">More tools</span></button><div id="more-tools" hidden={!extraOpen}>{secondary.map(navLink)}</div></div></nav>
<div className="sidebar-bottom"><button className="tutorial-launch" onClick={()=>{setMobile(false);if(location.pathname==='/'){document.getElementById('career-assistant')?.scrollIntoView({behavior:state.reduced?'auto':'smooth',block:'start'});}else navigate('/?assistant=open');}}><BookOpen size={19}/><span className="nav-text">Career assistant</span></button><button className="tutorial-launch" aria-label="Start tutorial" title={collapsed?'Tutorial':undefined} onClick={start}><BookOpen size={19}/><span className="nav-text">Tutorial</span></button><div className="nav-group utility-nav">{utility.map(navLink)}</div><Link className="profile" to="/settings" aria-label="Profile settings" title={collapsed?'Profile settings':undefined}><span className="avatar">{p.name.split(' ').map(v=>v[0]).join('').slice(0,2)}</span><span className="nav-text"><strong>{p.name||'Your workspace'}</strong><small>{industries.find(i=>i.id===p.industry)?.name}</small></span></Link></div></aside>
<div className="workspace" ref={workspace}><header className="topbar" aria-label="Page header"><div className="topbar-page"><button className="icon desktop-only" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="app-sidebar" title={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>settings({sidebarCollapsed:!collapsed})}>{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}<span>{collapsed?'Show menu':'Hide menu'}</span></button><button className="icon mobile-only" ref={opener} aria-label="Open navigation" aria-expanded={mobile} aria-controls="app-sidebar" onClick={()=>setMobile(true)}><Menu size={20}/></button><div><strong>{page.label}</strong><span>{page.description}</span></div></div><div className="topbar-actions"><button className="header-tutorial" onClick={start}><BookOpen size={16}/><span>Tutorial</span></button><button className="icon notification-button" aria-label="Open notifications" onClick={()=>setNotifications(true)}><Bell size={19}/>{state.notifications&&p.events.some(x=>!x.read)&&<span/>}</button><Link className="avatar small-avatar" to="/settings" aria-label="Open profile settings">{p.name.split(' ').map(v=>v[0]).join('').slice(0,2)}</Link></div></header>
<div className="workspace-context"><span className="context-source">{(p.source||'demo')==='demo'?'Demo data':p.source==='imported'?'Imported posts':'Connected account posts'}</span><AnalysisStatus/></div>
<main id="main" aria-busy={analysisPending} key={state.persona}><div className="route-transition" key={location.pathname}><Tutorial/>{state.setupStep!==undefined&&state.setupStep<3?null:<>{analysisPending&&<div className="analysis-loading" role="status">Updating your review for {state.profiles[state.persona].occupation}…</div>}<Routes><Route path="/" element={<Dashboard/>}/><Route path="/identity" element={<Platforms identity/>}/><Route path="/profile" element={<ProfileReview/>}/><Route path="/review" element={<Review/>}/><Route path="/timeline" element={<Review timeline/>}/><Route path="/industry" element={<Industry/>}/><Route path="/readiness" element={<Readiness/>}/><Route path="/monitoring" element={<Monitoring/>}/><Route path="/reports" element={<Reports/>}/><Route path="/platforms" element={<Platforms/>}/><Route path="/settings" element={<Settings/>}/><Route path="/methodology" element={<Methodology/>}/><Route path="*" element={<Empty text="This page isn’t available. Choose Dashboard to return to your review."/>}/></Routes></>}</div></main><footer>Digital Footprint Manager<span>Personal review suggestions · You make the decisions</span></footer></div></div>
{feedback&&<div key={feedback.id} className="review-feedback" role="status"><span className="feedback-letters" aria-hidden="true">r e v i e w · s a v e d</span><strong>{feedback.label}</strong></div>}{!state.onboarded&&<Onboarding/>}
{notifications&&<Modal title="Notifications" onClose={()=>setNotifications(false)}><p>Your reviews and demo scans appear here.</p><button onClick={()=>update({events:p.events.map(x=>({...x,read:true}))})}>Mark all as read</button>{p.events.length?p.events.map(x=><article className="activity" key={x.id}><span className="activity-dot" style={{opacity:x.read ? 0.3 : 1}}/><div>{x.text}<small>{new Date(x.date).toLocaleString('en-AU')}</small><button onClick={()=>update({events:p.events.map(e=>e.id===x.id?{...e,read:!e.read}:e)})}>{x.read?'Mark unread':'Mark read'}</button></div></article>):<p className="muted">No activity yet. Review a post to get started.</p>}</Modal>}
{notice&&<div className="toast" role="status"><span>{notice}</span>{canUndo&&<button onClick={undo}><Undo2 size={15}/> Undo</button>}</div>}</>;
}
