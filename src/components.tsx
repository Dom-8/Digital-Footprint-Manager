import {useEffect,useRef,type ReactNode} from 'react';
import {X,Info,ArrowUpRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import {industries} from './data';
import {useStore} from './store';
export function Card({children,className=''}:{children:ReactNode;className?:string}){return <section className={'card '+className}>{children}</section>;}
export function Badge({value}:{value:string}){const tone=value.includes('High')?'red':value.includes('Medium')?'amber':value.includes('Context')||value==='Needs context'?'purple':value==='Reviewed'||value==='Dismissed'||value==='No concern identified'?'green':'blue';return <span className={'badge '+tone}>{value}</span>;}
export function Empty({text='No sample content matches this view.'}:{text?:string}){return <div className="empty"><Info size={26}/><p>{text}</p><Link to="/platforms">Manage demo platforms <ArrowUpRight size={14}/></Link></div>;}
export function IndustrySelect({value,onChange,label='Career industry'}:{value:string;onChange:(v:string)=>void;label?:string}){return <label className="field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{industries.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>;}
export function IndustryControl(){const {p,update}=useStore();return <IndustrySelect value={p.industry} onChange={industry=>update({industry,occupation:industries.find(i=>i.id===industry)!.occupations[0]},'Industry preference updated')}/>;}
export function Modal({children,title,onClose,wide=false}:{children:ReactNode;title:string;onClose:()=>void;wide?:boolean}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const previous=document.activeElement as HTMLElement;const dialog=ref.current!;dialog.showModal();return()=>{dialog.close();previous?.focus();};},[]);return <dialog className={wide?'modal wide':'modal'} ref={ref} onCancel={e=>{e.preventDefault();onClose();}}><div className="modal-head"><h2>{title}</h2><button className="icon" aria-label="Close dialog" onClick={onClose}><X/></button></div>{children}</dialog>;}
export function Title({eyebrow,title,children}:{eyebrow:string;title:string;children?:ReactNode}){return <div className="page-title"><div><small className="eyebrow">{eyebrow}</small><h1>{title}</h1></div>{children}</div>;}
