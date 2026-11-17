import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowUpRight,CheckCheck,Layers,Clock,ScanEye,RefreshCw} from 'lucide-react';
import {ResponsiveContainer,PieChart,Pie,Cell,Tooltip,BarChart,Bar,XAxis,YAxis} from 'recharts';
import {industries,priorities} from './data';
import {scoped,analyse,metrics,resolved,priorityTone} from './engine';
import {useStore} from './store';
import {Card,Badge,Title,Empty} from './components';
import {Detail} from './Review';
import type {Post} from './types';
export const colours=['#171717','#525252','#737373','#a3a3a3','#b8b8b8','#d4d4d4','#404040','#8a8a8a','#c4c4c4'];
export default function Dashboard(){
const {posts,state,p,connection,runDemoScan}=useStore();const nav=useNavigate();
const [mode,setMode]=useState('All content');const [opened,setOpened]=useState<Post|null>(null);
const items=scoped(posts,state.persona,p),m=metrics(items,p);
const assessment=(x:Post)=>analyse(x,p.industry,p.decisions[x.id],p.occupation);
const pending=items.filter(x=>assessment(x).priority!=='No concern identified'&&!resolved(p.decisions[x.id]?.status)).sort((a,b)=>priorities.indexOf(assessment(a).priority)-priorities.indexOf(assessment(b).priority));
const chartItems=items.filter(x=>mode==='All content'||(mode==='Items requiring review'?pending.some(y=>y.id===x.id):mode==='Dismissed items'?p.decisions[x.id]?.status==='Dismissed':p.decisions[x.id]?.status==='Reviewed'));
const breakdown=[...new Set(items.map(x=>x.platform))].map(name=>({name,value:chartItems.filter(x=>x.platform===name).length}));
const industry=industries.find(i=>i.id===p.industry)!;const demo=(p.source||'demo')==='demo';
const chartLink=(platform:string)=>'/review?platform='+encodeURIComponent(platform)+(mode==='Items requiring review'?'&unresolved=yes':mode==='Reviewed items'?'&status=Reviewed':mode==='Dismissed items'?'&status=Dismissed':'');
return <div className="dashboard-minimal">
<Title eyebrow="OVERVIEW" title={'Welcome back, '+p.name.split(' ')[0]+'.'}><div className="dashboard-actions"><Link className="button" to="/review?unresolved=yes">Review items <ArrowUpRight size={15}/></Link><button className="primary" disabled={!demo||p.scan===1} onClick={runDemoScan} aria-describedby="dashboard-scan-help"><RefreshCw size={15}/>{p.scan===1?'Demo scan completed':'Run demo scan'}</button></div></Title>
<p className="subtitle">Your digital history, ready for a closer look.</p>
<div className="dashboard-context"><div><strong>{p.occupation}</strong><span>{industry.name}</span></div><div><span className="source-dot"/><span>{demo?'Demo data':p.source==='imported'?'Imported archive':connection.connected?'Mastodon connected':'No account connected'}</span><Link to="/platforms">{connection.connected?'Manage accounts':'Connect or import'} <ArrowUpRight size={13}/></Link></div></div>
<p id="dashboard-scan-help" className="fine scan-help">{demo?(p.scan===1?'Your three sample posts are available. Reset the scan in Monitoring Centre to try again.':'The demo scan adds three bundled sample posts. It does not scan real accounts.'):'Demo scans are available when Demo data is selected. Manage real posts in Connected Platforms.'}</p>
<div className="metrics">{[
{icon:Layers,label:'Posts in scope',value:m.total,note:new Set(items.map(x=>x.platform)).size+' platforms'},
{icon:ScanEye,label:'Items needing review',value:m.unresolved,note:pending.filter(x=>assessment(x).priority==='High priority').length+' high priority'},
{icon:CheckCheck,label:'Review progress',value:m.progress+'%',note:m.done+' of '+m.flagged+' flagged items reviewed'},
{icon:Clock,label:'Last demo scan',value:p.lastScan?'Completed':'Not run',note:p.lastScan?new Date(p.lastScan).toLocaleDateString('en-AU'):'Ready when you are'}
].map((x,i)=><Card key={x.label}><div className="metric-top"><span>{x.label}</span><x.icon size={16}/></div><strong className="metric-value">{x.value}</strong><small>{x.note}</small>{i===2&&<progress max={100} value={m.progress} aria-label="Review completion"/>}</Card>)}</div>
<div className="dashboard-grid review-first"><Card><div className="section-head"><h2>Next to review</h2><Link to="/review?unresolved=yes">View all <ArrowUpRight size={14}/></Link></div>{pending.slice(0,4).map(x=><button key={x.id} className={'recent-post priority-card priority-'+priorityTone(assessment(x).priority,p.decisions[x.id]?.status)} onClick={()=>setOpened(x)}><span className="platform-mark">{x.platform.slice(0,2)}</span><span><small>{x.platform} · {x.date.slice(0,4)}</small><strong>{x.text}</strong></span><Badge value={assessment(x).priority}/></button>)}{!pending.length&&<Empty text="Nothing is waiting for review in this view. You can still explore your full history."/>}</Card>
<Card><h2>Review priorities</h2><div className="priority-list">{priorities.slice(0,4).map(priority=><Link key={priority} to={'/review?unresolved=yes&priority='+encodeURIComponent(priority)}><Badge value={priority}/><strong>{pending.filter(x=>assessment(x).priority===priority).length}</strong></Link>)}</div><p className="fine">Suggestions for your review, not predictions of hiring outcomes.</p><details className="help-disclosure"><summary>About your career lens</summary><p>{industry.guidance}</p><Link to="/industry">Compare industries →</Link></details></Card></div>
<details className="dashboard-explore"><summary>Explore platforms and history <span>{items.length} posts</span></summary>
<div className="dashboard-grid"><Card><div className="section-head"><h2>Platforms</h2><select aria-label="Chart content scope" value={mode} onChange={e=>setMode(e.target.value)}>{['All content','Items requiring review','Dismissed items','Reviewed items'].map(v=><option key={v}>{v}</option>)}</select></div>{chartItems.length?<div className="chart-layout"><div className="donut"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={breakdown.filter(x=>x.value)} dataKey="value" nameKey="name" innerRadius={72} outerRadius={100} paddingAngle={3} stroke="none" onClick={(d:any)=>nav(chartLink(d.name))}>{breakdown.filter(x=>x.value).map((x,i)=><Cell key={x.name} fill={colours[i%colours.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-centre"><strong>{chartItems.length}</strong><small>posts</small></div></div><div className="legend">{breakdown.map((x,i)=><button key={x.name} onClick={()=>nav(chartLink(x.name))}><span style={{background:colours[i%colours.length]}}/>{x.name}<strong>{x.value}</strong></button>)}</div></div>:<Empty text="No posts in this chart view. Choose a different scope."/>}</Card>
<Card><div className="section-head"><h2>History</h2><Link to="/timeline">Open timeline <ArrowUpRight size={14}/></Link></div><ResponsiveContainer width="100%" height={230}><BarChart data={[...new Set(items.map(x=>x.date.slice(0,4)))].sort().map(year=>({year,posts:items.filter(x=>x.date.startsWith(year)).length}))}><XAxis dataKey="year" tick={{fontSize:11}}/><YAxis allowDecimals={false} width={24}/><Tooltip/><Bar dataKey="posts" fill="var(--text)" radius={[2,2,0,0]} onClick={(d:any)=>nav('/timeline?from='+d.year+'-01-01&to='+d.year+'-12-31')}/></BarChart></ResponsiveContainer></Card></div></details>
<details className="dashboard-explore"><summary>Recent activity <span>{p.events.length} updates</span></summary>{p.events.length?p.events.slice(0,5).map(e=><div className="activity" key={e.id}><span className="activity-dot"/><div>{e.text}<small>{new Date(e.date).toLocaleString('en-AU')}</small></div></div>):<p className="muted">Your reviews and demo scans will appear here.</p>}</details>
{opened&&<Detail post={opened} onClose={()=>setOpened(null)}/>}
</div>;}
