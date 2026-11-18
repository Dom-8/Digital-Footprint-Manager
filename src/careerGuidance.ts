import {industries} from './data';
import {roleResponsibilities} from './careers';
import {roleExamples} from './roleExamples';
export function careerGuide(role:string,field:string){
const industry=industries.find(x=>x.id===field)||industries[0];
const checks=roleResponsibilities(role).map(x=>({title:x.label,text:x.reason}));
const contexts:[RegExp,string,string][]=[
[/teacher|educator|education/i,'Classroom posts','Check pupil names, uniforms, work samples and school locations before sharing.'],
[/nurse|doctor|paramedic|physio|health|hospital|medical/i,'Care settings','Check photos, shift stories and records for details that could identify a patient.'],
[/electric|plumb|carpent|welder|mechanic|trade|construction|building/i,'Worksite posts','Check visible addresses, customer property and whether equipment demonstrations show training or actual work.'],
[/civil engineer|mechanical engineer|engineering graduate/i,'Project evidence','Confirm permission for drawings, site photos and calculations. Describe your contribution and who checked the work.'],
[/security|penetration/i,'Security research','Confirm authorisation before publishing targets, exploit details or findings. Remove tokens and private infrastructure details.'],
[/software|developer|IT support|data analyst|UX/i,'Portfolio and screenshots','Remove credentials, internal tickets and customer data. Explain your contribution to shared code or designs.'],
[/account|bookkeep|audit|bank|financial|business/i,'Client and financial material','Use fictional figures in examples. Check statements, spreadsheets and screenshots for identifiable client data.'],
[/solicitor|barrister|paralegal|legal|law/i,'Case discussions','Use public or fictional case material; check whether a client could still be identified after names are removed.'],
[/government|policy|public serv|council|administration officer/i,'Official and personal posts','Clarify when you speak personally. Check internal briefings and correspondence before sharing.'],
[/retail|customer|store|barista|waiter|hotel|hospitality|chef/i,'Customer and workplace posts','Check receipts, bookings and complaints for customer details. Add context to staged or training demonstrations.'],
[/driver|warehouse|logistics/i,'Routes and deliveries','Remove labels, tracking numbers and customer addresses. Clarify whether driving or equipment footage was staged.'],
[/journalist|editor|producer/i,'Sources and publication','Protect confidential sources. Distinguish quotations, reporting and personal comment; credit collaborators.'],
[/musician|designer|photograph|writer|artist|creative/i,'Creative portfolio','Credit collaborators and confirm client publication permission. Label fictional characters, satire and commissioned work.'],
[/social worker|youth worker|disability|community|volunteer/i,'People you support','Check whether stories, locations or photos identify service users. Verify consent for the actual publication.'],
[/coach|trainer|athlete|sport/i,'Training and participants','Check participant consent, especially for children. Distinguish personal training experience from verified qualifications.'],
[/student|apprentice|graduate|explor/i,'Learning and experience','Label coursework, placements and supervised work accurately. Keep current study separate from completed qualifications.']
];
const specific=roleExamples[role];
const match=contexts.find(([pattern])=>pattern.test(role));
return {role,industry:industry.name,focus:industry.focus,checks:[...(specific?[{title:'For '+role,text:specific}]:[]),...(match?[{title:match[1],text:match[2]}]:[{title:industry.focus,text:industry.guidance}]),...checks].slice(0,3),action:/student|apprentice|graduate/i.test(role)?'Check that your profile separates training from completed qualifications.':'Check your public profile against your current role, dates and qualifications.'};
}
