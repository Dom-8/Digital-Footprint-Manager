import {useState,useEffect,useRef} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,CheckCheck,Layers,ScanEye,RefreshCw,Briefcase,Link2,BookOpen} from 'lucide-react';
import {ResponsiveContainer,PieChart,Pie,Cell,Tooltip,BarChart,Bar,XAxis,YAxis} from 'recharts';
import {industries,priorities} from './data';
import {scoped,analyse,metrics,resolved,priorityTone} from './engine';
import {useStore} from './store';
import {Card,Badge,Empty} from './components';
import {Detail} from './Review';
import {useTutorial} from './Tutorial';
import type {Post} from './types';
const priorityColours:Record<string,string>={'High priority':'#d96262','Medium priority':'#d59a3c','Low priority':'#639ce8','Context needed':'#9c732f','Reviewed':'#737373'};
export default function Dashboard(){
const {posts,state,p,connection,runDemoScan}=useStore();const nav=useNavigate();const {start}=useTutorial();
const [mode,setMode]=useState('All content'),[opened,setOpened]=useState<Post|null>(null);
const items=scoped(posts,state.persona,p),m=metrics(items,p);
const assessment=(x:Post)=>analyse(x,p.industry,p.decisions[x.id],p.occupation);
const order=['High priority','Medium priority','Context needed','Low priority','No concern identified'];
const pending=items.filter(x=>assessment(x).priority!=='No concern identified'&&!resolved(p.decisions[x.id]?.status)).sort((a,b)=>order.indexOf(assessment(a).priority)-order.indexOf(assessment(b).priority));
const chartItems=items.filter(x=>mode==='All content'||(mode==='Items requiring review'?pending.some(y=>y.id===x.id):mode==='Dismissed items'?p.decisions[x.id]?.status==='Dismissed':p.decisions[x.id]?.status==='Reviewed'));
const platforms=[...new Set(items.map(x=>x.platform))].map(name=>({name,value:chartItems.filter(x=>x.platform===name).length}));
const industry=industries.find(i=>i.id===p.industry)!;const demo=(p.source||'demo')==='demo';
const wheel=[...priorities.slice(0,4).map(name=>({name,value:pending.filter(x=>assessment(x).priority===name).length})),{name:'Reviewed',value:m.done}];
const weights:Record<string,number>={'High priority':3,'Medium priority':2,'Context needed':1,'Low priority':1};
const totalWeight=items.reduce((sum,x)=>sum+(weights[assessment(x).priority]||0),0);
const remainingWeight=pending.reduce((sum,x)=>sum+(weights[assessment(x).priority]||0),0);
const burden=totalWeight?remainingWeight/totalWeight:0;
const first=pending[0];const hour=new Date().getHours();const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
const chartLink=(platform:string)=>'/review?platform='+encodeURIComponent(platform)+(mode==='Items requiring review'?'&unresolved=yes':mode==='Reviewed items'?'&status=Reviewed':mode==='Dismissed items'?'&status=Dismissed':'');
function wheelClick(name:string){nav(name==='Reviewed'?'/review?resolved=yes':'/review?unresolved=yes&priority='+encodeURIComponent(name));}
return <div className="dashboard-clear">
<div className="dashboard-focus"><section className="dashboard-intro" aria-label="Your next step"><p className="greeting">{greeting}, {p.name.split(' ')[0]||'there'}.</p><h1 aria-label="Your history. Your next step.">Your history.<br/>Your next step.</h1><p className="purpose">Understand old posts in the context of your next career. Review what needs attention, add context and decide what to change.</p><div className="hero-actions"><Link className="primary hero-primary" to={first?'/review?unresolved=yes&open='+encodeURIComponent(first.id):items.length?'/review':'/platforms'}>{first?'Review your next post':items.length?'Explore your posts':'Add your posts'} <ArrowRight size={18}/></Link><button className="hero-tutorial" onClick={start}><BookOpen size={16}/> {state.tutorialDone?'Replay tutorial':'Start tutorial'}</button></div><p className="fine">{first?m.unresolved+' items are waiting for your review.':items.length?'You’ve reviewed everything flagged in this view.':'Start with a demo, import an archive or connect an account.'}</p></section><Footprint burden={burden} count={pending.length} total={items.length} reduced={state.reduced}/>
<Card className="priority-overview"><div className="section-head"><div><h2>Your review priorities</h2><p>Choose a section to see the posts.</p></div><span className="scope-label">{demo?'Sample posts':p.source==='imported'?'Imported posts':'Loaded posts'}</span></div><div className="priority-wheel-layout">{m.flagged?<div className="donut priority-wheel" aria-label={'Priority breakdown: '+wheel.map(x=>x.name+' '+x.value).join(', ')}><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={wheel.filter(x=>x.value)} dataKey="value" nameKey="name" innerRadius={65} outerRadius={91} paddingAngle={3} stroke="none" onClick={(d:any)=>wheelClick(d.name)}>{wheel.filter(x=>x.value).map(x=><Cell key={x.name} fill={priorityColours[x.name]}/>)}</Pie><Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text)'}} itemStyle={{color:'var(--text)'}}/></PieChart></ResponsiveContainer><div className="donut-centre"><strong>{m.unresolved}</strong><small>need review</small></div></div>:<div className="wheel-empty"><CheckCheck size={30}/><strong>No flagged posts in this view</strong><span>Check data coverage before drawing conclusions.</span></div>}<div className="priority-list">{wheel.map(x=><button className="priority-count" key={x.name} onClick={()=>wheelClick(x.name)} aria-label={x.name+': '+x.value+' posts'}><Badge value={x.name}/><strong>{x.value}</strong><ArrowUpRight size={13}/></button>)}</div></div></Card></div>
<section className="next-steps-section" aria-labelledby="next-steps-title"><h2 id="next-steps-title">Three simple steps</h2><div className="task-path">
<Link className="task-step" to="/industry"><span className="step-number">01</span><div><h3>Choose your career</h3><strong>{p.occupation}</strong><span>{industry.name}</span></div><ArrowUpRight size={17}/></Link>
<Link className="task-step" to="/platforms"><span className="step-number">02</span><div><h3>Add your posts</h3><strong>{demo?'Using demo data':p.source==='imported'?'Archive imported':connection.connected?'Account connected':'Account not connected'}</strong><span>{items.length} posts available · {demo?'Try your own archive any time':'Manage accounts and data'}</span></div><ArrowUpRight size={17}/></Link>
<Link className="task-step" to="/review?unresolved=yes"><span className="step-number">03</span><div><h3>Review and decide</h3><strong>{m.unresolved} items to look at</strong><span>Add context, review or dismiss</span></div><ArrowUpRight size={17}/></Link>
</div></section>
<div className="metrics clear-metrics">{[{icon:Layers,label:'Posts in scope',value:m.total,note:platforms.length+' platforms'},{icon:ScanEye,label:'Items needing review',value:m.unresolved,note:pending.filter(x=>assessment(x).priority==='High priority').length+' high priority'},{icon:CheckCheck,label:'Review progress',value:m.progress+'%',note:m.done+' of '+m.flagged+' flagged items reviewed'}].map(x=><Card key={x.label}><div className="metric-top"><span>{x.label}</span><x.icon size={16}/></div><strong className="metric-value">{x.value}</strong><small>{x.note}</small></Card>)}</div>
<Card className="next-posts"><div className="section-head"><div><h2>Start with these posts</h2><p>The highest priorities appear first.</p></div><Link to="/review?unresolved=yes">Review all posts <ArrowUpRight size={14}/></Link></div>{pending.slice(0,3).map(x=><button key={x.id} className={'recent-post priority-card priority-'+priorityTone(assessment(x).priority,p.decisions[x.id]?.status)} onClick={()=>setOpened(x)}><span className="platform-mark">{x.platform.slice(0,2)}</span><span><small>{x.platform} · {x.date.slice(0,4)}</small><strong>{x.text}</strong></span><Badge value={assessment(x).priority}/><ArrowRight className="post-open-arrow" size={17}/></button>)}{!pending.length&&<Empty text="No flagged posts are waiting in this view. You can still open your full history."/>}</Card>
<section className="visible-insights" aria-labelledby="platform-history-title"><div className="section-head"><div><h2 id="platform-history-title">Your platforms and history</h2><p>See what is included in this review.</p></div><Link to="/timeline">Open timeline <ArrowUpRight size={14}/></Link></div><div className="dashboard-grid"><Card><div className="section-head"><h3>Posts by platform</h3><Link to="/platforms">Manage data</Link></div><div className="scope-tabs" role="group" aria-label="Chart content scope">{['All content','Items requiring review','Reviewed items','Dismissed items'].map(v=><button key={v} aria-pressed={mode===v} onClick={()=>setMode(v)}>{v==='Items requiring review'?'Needs review':v==='Reviewed items'?'Reviewed':v==='Dismissed items'?'Dismissed':'All posts'}</button>)}</div><div className="platform-bars">{platforms.map(x=><button key={x.name} onClick={()=>nav(chartLink(x.name))}><span>{x.name}</span><strong>{x.value}</strong><span className="track"><span style={{width:(chartItems.length?x.value/chartItems.length*100:0)+'%'}}/></span></button>)}</div>{!chartItems.length&&<p className="muted">No posts in this view. Try another scope.</p>}</Card>
<Card><h3>Posts over time</h3>{items.length?<ResponsiveContainer width="100%" height={220}><BarChart data={[...new Set(items.map(x=>x.date.slice(0,4)))].sort().map(year=>({year,posts:items.filter(x=>x.date.startsWith(year)).length}))}><XAxis dataKey="year" tick={{fontSize:11,fill:'var(--muted)'}}/><YAxis allowDecimals={false} width={24} tick={{fill:'var(--muted)'}}/><Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)'}}/><Bar dataKey="posts" fill="#a3a3a3" radius={[3,3,0,0]} onClick={(d:any)=>nav('/timeline?from='+d.year+'-01-01&to='+d.year+'-12-31')}/></BarChart></ResponsiveContainer>:<p className="muted">Add posts to see your timeline here.</p>}</Card></div></section>
<Card className="demo-scan-row"><div><h3>{demo?'Try a fresh demo scan':'Want to test the demo scan?'}</h3><p id="dashboard-scan-help">{demo?(p.scan===1?'Your three sample posts are available. Reset the scan in Monitoring Centre to try again.':'Add three bundled sample posts and see how your review updates. This does not scan real accounts.'):'Demo scans are available when Demo data is selected. Manage real posts in Connected Platforms.'}</p></div><button className="button" disabled={!demo||p.scan===1} onClick={runDemoScan} aria-describedby="dashboard-scan-help"><RefreshCw size={16}/>{p.scan===1?'Demo scan completed':'Run demo scan'}</button></Card>
{p.events.length>0&&<section className="recent-activity"><h2>Recent activity</h2>{p.events.slice(0,3).map(e=><div className="activity" key={e.id}><span className="activity-dot"/><div>{e.text}<small>{new Date(e.date).toLocaleString('en-AU')}</small></div></div>)}</section>}
{opened&&<Detail post={opened} onClose={()=>setOpened(null)}/>}
</div>;}

function Footprint({burden,count,total,reduced}:{burden:number;count:number;total:number;reduced:boolean}){
const canvas=useRef<HTMLCanvasElement>(null);
useEffect(()=>{
const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
const W=600,H=300,dpr=Math.min(window.devicePixelRatio||1,2);
el.width=W*dpr;el.height=H*dpr;ctx.scale(dpr,dpr);
const shape=new Path2D();
shape.ellipse(108,30,23,29,15*Math.PI/180,0,Math.PI*2);
shape.ellipse(65,36,15,21,-10*Math.PI/180,0,Math.PI*2);
shape.ellipse(35,53,12,17,-25*Math.PI/180,0,Math.PI*2);
shape.ellipse(17,78,10,14,-30*Math.PI/180,0,Math.PI*2);
shape.ellipse(12,104,8,11,0,0,Math.PI*2);
shape.addPath(new Path2D('M35 87 C52 64 108 64 127 91 C147 121 119 145 103 166 C90 184 107 209 92 231 C77 253 42 245 38 222 C34 202 47 180 40 157 C30 134 17 111 35 87 Z'));
const particles:{x:number;y:number;homeX:number;homeY:number;vx:number;vy:number;letter:string}[]=[];
const letters='digitalfootprint';
for(let y=8;y<245;y+=5)for(let x=6;x<145;x+=5){
if(ctx.isPointInPath(shape,x*dpr,y*dpr)){const homeX=55+(245-y)*2,homeY=12+x*1.85;particles.push({x:homeX,y:homeY,homeX,homeY,vx:0,vy:0,letter:letters[(x*7+y*3)%letters.length]});}}
const media=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0,previous=0,steps=0,pointer:{x:number;y:number}|null=null;
const draw=()=>{
ctx.clearRect(0,0,W,H);ctx.font='9px ui-monospace, SFMono-Regular, monospace';ctx.textAlign='center';
for(const p of particles){
const t=p.homeX/W;
const red=[239,95+Math.round(t*50),105+Math.round(t*40)],blue=[80+Math.round(t*35),155+Math.round(t*45),245];
ctx.fillStyle=total?'rgb('+blue.map((v,i)=>Math.round(v+(red[i]-v)*burden)).join(',')+')':'#888';
ctx.globalAlpha=.58+.42*(p.homeY/H);ctx.fillText(p.letter,p.x,p.y);
}ctx.globalAlpha=1;
};
const tick=(now:number)=>{
const dt=Math.min((now-previous)/16.67||1,2);previous=now;let energy=0;
for(const p of particles){
let fx=(p.homeX-p.x)*.045,fy=(p.homeY-p.y)*.045;
if(pointer){const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(d<65&&d>0){const force=(1-d/65)*1.8;fx+=dx/d*force;fy+=dy/d*force;}}
p.vx=(p.vx+fx*dt)*Math.pow(.83,dt);p.vy=(p.vy+fy*dt)*Math.pow(.83,dt);
p.x+=p.vx*dt;p.y+=p.vy*dt;energy+=Math.abs(p.vx)+Math.abs(p.vy);
}draw();steps++;frame=0;if(energy>.1&&steps<240)frame=requestAnimationFrame(tick);
};
const move=(e:PointerEvent)=>{if(reduced||media.matches||e.pointerType==='touch')return;
const r=el.getBoundingClientRect();pointer={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};steps=0;if(!frame){previous=performance.now();frame=requestAnimationFrame(tick);}};
const leave=()=>{pointer=null;steps=0;if(!frame&&!reduced&&!media.matches){previous=performance.now();frame=requestAnimationFrame(tick);}};
const reset=()=>{cancelAnimationFrame(frame);frame=0;pointer=null;for(const p of particles){p.x=p.homeX;p.y=p.homeY;p.vx=p.vy=0;}draw();};
draw();el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);media.addEventListener('change',reset);
return()=>{cancelAnimationFrame(frame);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);media.removeEventListener('change',reset);};
},[burden,total,reduced]);
return <figure className="footprint-art" aria-label={total?`Your footprint: ${count} posts to review`:'Your footprint: no posts loaded'}>
<canvas ref={canvas} aria-hidden="true"/>
<figcaption><strong>Your footprint</strong><span>{!total?'Add posts to begin':count?`${count} posts to review`:'Review complete'}</span></figcaption>
</figure>;
}
