export type Category = 'privacy'|'communication'|'safety'|'credentials'|'consistency'|'confidentiality'|'conflict'|'creative'|'humour'|'ambiguous'|'misattributed'|'ordinary';
export type Priority = 'High priority'|'Medium priority'|'Low priority'|'Context needed'|'No concern identified';
export type Status = 'Not reviewed'|'Needs context'|'Reviewed'|'Dismissed'|'Marked for follow-up'|'Simulated action planned';
export type DataSource='demo'|'imported'|'connected';
export interface Post {source?:DataSource;url?:string;id:string;persona:string;platform:string;date:string;text:string;category:Category;type:'Post'|'Comment'|'Video'|'Repost';visibility:'Public'|'Private';missing:string;alternative:string;monitor?:boolean;}
export interface Persona {id:string;name:string;age:number;industry:string;occupation:string;platforms:string[];milestone:string;}
export interface Industry {id:string;name:string;occupations:string[];focus:string;categories:Category[];guidance:string;}
export interface Decision {status?:Status;note?:string;priority?:Priority;hidden?:'archived'|'deleted';}
export interface Event {id:string;date:string;text:string;read:boolean;}
export interface ProfileState {source?:DataSource;importedPosts?:Post[];roleDescription?:string;industry:string;occupation:string;platforms:string[];decisions:Record<string,Decision>;checklist:string[];scan:number;events:Event[];lastScan:string|null;frequency:string;cvStart:string;linkedStart:string;name:string;}
export interface State {setupStep?:0|1|2|3|4;setupEmail?:string;setupName?:string;version:1;appearanceVersion?:2;sidebarCollapsed?:boolean;tutorialStep?:0|1|2;tutorialPostId?:string;tutorialPreviousSource?:DataSource;tutorialPersona?:string;tutorialDone?:boolean;persona:string;profiles:Record<string,ProfileState>;onboarded:boolean;theme:'light'|'dark';compact:boolean;reduced:boolean;notifications:boolean;reminders:boolean;}
