import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import {analyse,resolved} from './engine';
import {industries} from './data';
import type {Post,ProfileState} from './types';
import {csv,download} from './utils';
export function reportModel(items:Post[],p:ProfileState,filters:URLSearchParams,generatedAt:string){
const field=industries.find(x=>x.id===p.industry)!.name;
const rows=items.filter(x=>analyse(x,p.industry,p.decisions[x.id],p.occupation).priority!=='No concern identified').map(x=>({post:x,assessment:analyse(x,p.industry,p.decisions[x.id],p.occupation),status:p.decisions[x.id]?.status||'Not reviewed'})).sort((a,b)=>['High priority','Medium priority','Context needed','Low priority'].indexOf(a.assessment.priority)-['High priority','Medium priority','Context needed','Low priority'].indexOf(b.assessment.priority));
const dates=items.map(x=>x.date).sort();
return {title:'Your digital footprint review',generatedAt,career:p.occupation,field,source:p.source||'demo',scope:filters.toString()||'All available content in the selected source',period:dates.length?dates[0]+' to '+dates[dates.length-1]:'No posts in scope',platforms:[...new Set(items.map(x=>x.platform))].join(', ')||'None',count:items.length,rows,breakdown:['High priority','Medium priority','Low priority','Context needed'].map(priority=>({priority,count:rows.filter(x=>x.assessment.priority===priority&&!resolved(x.status)).length})),resolved:rows.filter(x=>resolved(x.status)).length,
limitations:'Personal review suggestions, not predictions of hiring outcomes. Deterministic rules do not verify misconduct, identity or professional suitability. Lawful opinions and protected characteristics are not risk signals. '+((p.source||'demo')==='demo'?'All included content is fictional demonstration data. ':'Only available text and metadata are analysed. Images, video, deleted content and surrounding conversations are unavailable. Imported and connected text uses narrow explicit cues only; no cue does not mean safe or verified. ')+(p.source==='connected'?'Coverage includes only pages loaded so far from the API, not the complete account history. ':p.source==='imported'?'Coverage includes only supported Create/Note records in the supplied archive, not boosts or media. ':'')+'Context notes are unverified. Manual overrides and saved decisions are preserved.'};
}
export type ReportModel=ReturnType<typeof reportModel>;
export function exportPDF(m:ReportModel){
const doc=new jsPDF({unit:'mm',format:'a4'});let y=22;const width=174;
function heading(text:string){if(y>258){doc.addPage();y=22;}doc.setTextColor('#171717');doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text(text,18,y);y+=8;}
function para(text:string){doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor('#333333');for(const line of doc.splitTextToSize(text,width)){if(y>276){doc.addPage();y=22;}doc.text(line,18,y);y+=5;}y+=4;}
heading(m.title);para('Generated: '+new Date(m.generatedAt).toLocaleString('en-AU')+' | '+m.career+' | '+m.field);
heading('Scope and coverage');para(m.count+' posts analysed | '+m.source+' data | '+m.platforms+' | '+m.period);para('Active filters: '+m.scope);
heading('Review priorities');para(m.breakdown.map(x=>x.priority+': '+x.count).join(' | ')+' | Reviewed or resolved: '+m.resolved);para('Breakdown counts unresolved items; resolved items remain in the review table.');
autoTable(doc,{startY:y,head:[['Post / platform / date','Priority / status','Explanation']],body:m.rows.map(x=>[x.post.text+'\n'+x.post.platform+' | '+x.post.date,x.assessment.priority+'\n'+x.status,x.assessment.explanation]),margin:{top:20,bottom:20,left:18,right:18},styles:{fontSize:8,cellPadding:3,overflow:'linebreak'},headStyles:{fillColor:[23,23,23]},columnStyles:{0:{cellWidth:58},1:{cellWidth:36},2:{cellWidth:80}},rowPageBreak:'avoid',showHead:'everyPage',didParseCell:data=>{if(data.section==='body'&&data.column.index===1){const x=m.rows[data.row.index];const tone=resolved(x.status)?[100,100,100]:x.assessment.priority==='High priority'?[156,39,39]:x.assessment.priority==='Medium priority'||x.assessment.priority==='Context needed'?[133,80,0]:[33,79,146];data.cell.styles.textColor=tone as [number,number,number];data.cell.styles.fontStyle='bold';}}});
y=(doc as any).lastAutoTable?.finalY+12||22;
heading('Recommended actions');
const pending=m.rows.filter(x=>!resolved(x.status));if(!pending.length)para('No unresolved flagged items in this scope. Review coverage before drawing conclusions.');
pending.forEach((x,i)=>para((i+1)+'. '+x.assessment.priority+' | '+x.post.platform+' '+x.post.date+' | '+x.assessment.next));
heading('Limitations');para(m.limitations);
const total=doc.getNumberOfPages();for(let i=1;i<=total;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor('#666666');doc.text('Digital Footprint Manager | Personal review | Page '+i+' of '+total,18,289);}
doc.save('digital-footprint-review.pdf');
}
export function exportCSV(m:ReportModel){download('digital-footprint-review.csv',csv([['Report',m.title],['Generated',m.generatedAt],['Career',m.career],['Industry',m.field],['Source',m.source],['Active filters',m.scope],['Coverage',m.period],['ID','Platform','Date','Text','Source','Priority','Status','Explanation','Recommended action'],...m.rows.map(x=>[x.post.id,x.post.platform,x.post.date,x.post.text,x.post.source||'demo',x.assessment.priority,x.status,x.assessment.explanation,x.assessment.next])]),'text/csv;charset=utf-8');}
