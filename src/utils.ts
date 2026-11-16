export const date=(v:string)=>new Date(v+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
export const age=(v:string)=>Math.max(0,Math.floor((Date.UTC(2026,10,17)-Date.parse(v))/(365.25*86400000)));
export function download(name:string,content:string,type='text/plain'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function csv(rows:string[][]){return rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""').replace(/^[=+@\-\t\r]/,"'$&")+'"').join(',')).join('\r\n');}
