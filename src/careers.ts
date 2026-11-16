import type {Category} from './types';
export const additionalFields=[
{id:'construction',name:'Construction',occupations:['Construction Worker','Site Supervisor','Building Apprentice'],focus:'Site safety and client confidentiality',categories:['safety','confidentiality','credentials'],guidance:'Check site details and whether safety statements describe actual work or training.'},
{id:'engineering',name:'Engineering',occupations:['Civil Engineer','Mechanical Engineer','Engineering Graduate'],focus:'Technical attribution, safety and project information',categories:['safety','credentials','confidentiality','consistency'],guidance:'Review technical claims and permission to publish project information.'},
{id:'cybersecurity',name:'Cybersecurity',occupations:['Security Analyst','Penetration Tester','Security Graduate'],focus:'Disclosure permission and confidential technical information',categories:['confidentiality','credentials','consistency'],guidance:'Check authorisation and responsible disclosure before sharing technical details.'},
{id:'retail',name:'Retail',occupations:['Retail Assistant','Store Manager','Customer Service Worker'],focus:'Customer privacy and communication',categories:['privacy','communication','confidentiality'],guidance:'Check whether customer information is identifiable; consider the surrounding conversation.'},
{id:'transport',name:'Transport and Logistics',occupations:['Truck Driver','Bus Driver','Warehouse Worker','Logistics Coordinator'],focus:'Operational safety and delivery information',categories:['safety','credentials','confidentiality'],guidance:'Clarify safety context and remove identifiable delivery details if permission is absent.'},
{id:'media',name:'Media and Journalism',occupations:['Journalist','Editor','Social Media Producer'],focus:'Source confidentiality and attribution',categories:['confidentiality','credentials','misattributed','creative'],guidance:'Distinguish reporting, quotation and personal endorsement; verify publication permissions.'},
{id:'community',name:'Community Services',occupations:['Social Worker','Youth Worker','Disability Support Worker','Community Volunteer'],focus:'Service-user privacy and professional boundaries',categories:['privacy','confidentiality','credentials','communication'],guidance:'Check consent and whether a service user could be identified.'},
{id:'sport',name:'Sport and Recreation',occupations:['Coach','Personal Trainer','Athlete','Sports Administrator'],focus:'Participant privacy, safety and qualifications',categories:['privacy','safety','credentials','communication'],guidance:'Check participant consent and distinguish training advice from verified qualifications.'}
] satisfies {id:string;name:string;occupations:string[];focus:string;categories:Category[];guidance:string}[];
export const extraRoles:Record<string,string[]>={
education:['Secondary Teacher','Early Childhood Educator','School Administrator'],
healthcare:['Nurse','Paramedic','Physiotherapist','Medical Receptionist','Healthcare Student'],
trades:['Welder','Mechanic','Trade Apprentice'],
business:['Bookkeeper','Auditor','Banking Customer Adviser'],
technology:['Software Developer','IT Support Technician','Data Analyst','UX Designer'],
hospitality:['Hospitality Worker','Barista','Waiter','Hotel Receptionist'],
government:['Public Servant','Council Worker'],law:['Solicitor','Barrister','Law Student'],
creative:['Musician','Graphic Designer','Photographer','Writer'],general:['Student','Apprentice','Graduate','Career Explorer']
};
export interface Responsibility {label:string;categories:Category[];reason:string}
const responsibility=(label:string,categories:Category[],reason:string):Responsibility=>({label,categories,reason});
export function roleResponsibilities(role:string):Responsibility[]{
const r=role.toLowerCase();const out:Responsibility[]=[];
if(/teacher|nurse|doctor|paramedic|physio|social worker|youth worker|support worker|coach|trainer|educator/.test(r))out.push(responsibility('People in your care',['privacy','communication'],'This role may involve identifiable students, patients, participants or service users.'));
if(/electric|plumb|carpenter|welder|mechanic|construction|engineer|driver|warehouse|chef|trade|coach|trainer/.test(r))out.push(responsibility('Practical safety',['safety'],'This role can involve equipment, physical work or supervision; clarify whether a safety statement describes actual conduct.'));
if(/developer|software|security|analyst|designer|engineer|journalist|solicitor|paralegal|accountant|auditor|policy|administrator|manager/.test(r))out.push(responsibility('Entrusted information',['confidentiality'],'Projects, client work or sources may carry confidentiality obligations; verify permission and context.'));
if(/journalist|musician|artist|designer|writer|producer|photographer/.test(r))out.push(responsibility('Published and creative work',['misattributed','creative'],'Attribution, quotation and fictional voices need context; creative expression alone is not a professional concern.'));
return out;
}
export function roleCategories(role:string):Category[]{return [...new Set(roleResponsibilities(role).flatMap(x=>x.categories))];}
