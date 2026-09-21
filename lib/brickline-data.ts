export type Role = "Agent" | "Builder";
export type ViewId = "overview" | "map" | "projects" | "network" | "marketplace" | "radar" | "alerts" | "profile";
export type ProjectStatus = "New construction" | "Redevelopment" | "Approval stage" | "Construction started";

export interface Project {
  id: string; name: string; area: string; status: ProjectStatus; builder: string;
  value: number; homes: number; completion: string; confidence: number; updated: string;
  description: string; tags: string[]; coordinates: { x: number; y: number };
}

export interface NetworkMember {
  id: string; name: string; kind: Role; company: string; areas: string[];
  specialties: string[]; deals: number; rating: number; initials: string; color: string;
}

export interface Opportunity {
  id: string; title: string; builder: string; area: string; type: string;
  commission: string; deadline: string; matches: number; description: string;
}

export interface RadarSignal {
  id: string; title: string; area: string; type: ProjectStatus; when: string;
  confidence: number; detail: string; projectId?: string;
}

export const projects: Project[] = [
  { id:"aurelia", name:"Aurelia Heights", area:"Bandra West", status:"Construction started", builder:"Aurelia Developments", value:420, homes:118, completion:"Dec 2028", confidence:96, updated:"2h ago", description:"Premium residential tower with sea-facing inventory and a focused channel-partner launch plan.", tags:["Luxury","Residential","RERA filed"], coordinates:{x:24,y:47} },
  { id:"grove", name:"The Grove Residences", area:"Andheri East", status:"New construction", builder:"Nexus Habitat", value:290, homes:86, completion:"Mar 2029", confidence:92, updated:"5h ago", description:"Transit-led residential development near the metro corridor, designed for mid-premium buyers.", tags:["Residential","Metro access","Pre-launch"], coordinates:{x:58,y:24} },
  { id:"saffron", name:"Saffron House", area:"Dadar", status:"Redevelopment", builder:"Kohinoor Living", value:165, homes:64, completion:"Sep 2027", confidence:89, updated:"Yesterday", description:"Society redevelopment with 42 rehabilitation homes and limited free-sale inventory.", tags:["Redevelopment","Society","Central Mumbai"], coordinates:{x:44,y:70} },
  { id:"arden", name:"Arden Park", area:"Worli", status:"Approval stage", builder:"Serein Realty", value:510, homes:142, completion:"Jun 2030", confidence:84, updated:"Yesterday", description:"Large urban infill opportunity progressing through municipal approvals and environmental review.", tags:["Luxury","Mixed use","Approval"], coordinates:{x:76,y:48} },
  { id:"northstar", name:"Northstar One", area:"Powai", status:"New construction", builder:"Meridian Spaces", value:350, homes:126, completion:"Nov 2029", confidence:91, updated:"2 days ago", description:"Tech-corridor homes with flexible layouts and a planned broker preview in the next quarter.", tags:["Residential","Tech corridor","Family"], coordinates:{x:70,y:16} },
  { id:"terraces", name:"Harbour Terraces", area:"Sewri", status:"Redevelopment", builder:"Crestline Group", value:230, homes:94, completion:"Aug 2028", confidence:87, updated:"3 days ago", description:"Harbour-facing cluster redevelopment adjacent to major transport infrastructure upgrades.", tags:["Redevelopment","Harbour","Infrastructure"], coordinates:{x:58,y:72} },
];

export const network: NetworkMember[] = [
  {id:"ananya",name:"Ananya Kapoor",kind:"Agent",company:"AK Realty",areas:["Bandra","Khar","Santacruz"],specialties:["Luxury","NRI"],deals:34,rating:4.9,initials:"AK",color:"#5f8f72"},
  {id:"rohan",name:"Rohan Nair",kind:"Agent",company:"Nair Properties",areas:["Andheri","Powai"],specialties:["Residential","Investor"],deals:28,rating:4.8,initials:"RN",color:"#5271a8"},
  {id:"jaya",name:"Jaya Patel",kind:"Agent",company:"Urban Keys",areas:["Worli","Lower Parel"],specialties:["Luxury","Primary sales"],deals:41,rating:4.9,initials:"JP",color:"#a2636d"},
  {id:"vikram",name:"Vikram Shah",kind:"Builder",company:"Aurelia Developments",areas:["Bandra","Worli"],specialties:["Luxury","High-rise"],deals:12,rating:4.8,initials:"VS",color:"#8b6b48"},
  {id:"meera",name:"Meera Desai",kind:"Builder",company:"Nexus Habitat",areas:["Andheri","Powai"],specialties:["Residential","Transit-led"],deals:9,rating:4.7,initials:"MD",color:"#6457a6"},
  {id:"arjun",name:"Arjun Rao",kind:"Agent",company:"Harbour Homes",areas:["Dadar","Sewri"],specialties:["Redevelopment","Society"],deals:22,rating:4.6,initials:"AR",color:"#3e8290"},
];

export const opportunities: Opportunity[] = [
  {id:"opp1",title:"Exclusive channel partners",builder:"Aurelia Developments",area:"Bandra West",type:"Luxury launch",commission:"2.5% + bonus",deadline:"30 Sep",matches:18,description:"Invite-only partner allocation for the first 40 residences at Aurelia Heights."},
  {id:"opp2",title:"Pre-launch sales mandate",builder:"Nexus Habitat",area:"Andheri East",type:"Residential",commission:"2.0%",deadline:"08 Oct",matches:27,description:"Early-access inventory for agents with an active Andheri and Powai buyer base."},
  {id:"opp3",title:"Redevelopment sourcing partner",builder:"Kohinoor Living",area:"Dadar",type:"Land & society",commission:"Success fee",deadline:"15 Oct",matches:12,description:"Seeking local partners with society relationships and redevelopment experience."},
  {id:"opp4",title:"Worli premium distribution",builder:"Serein Realty",area:"Worli",type:"Luxury launch",commission:"3.0%",deadline:"22 Oct",matches:9,description:"Curated distribution network for an upcoming high-value launch."},
];

export const signals: RadarSignal[] = [
  {id:"sig1",title:"Foundation activity detected",area:"Bandra West",type:"Construction started",when:"28 min ago",confidence:96,detail:"Site activity and contractor movement indicate the project has entered active construction.",projectId:"aurelia"},
  {id:"sig2",title:"New site barricading",area:"Andheri East",type:"New construction",when:"2h ago",confidence:92,detail:"New perimeter branding and equipment movement appeared on the JVLR parcel.",projectId:"grove"},
  {id:"sig3",title:"Society resolution filed",area:"Dadar",type:"Redevelopment",when:"5h ago",confidence:89,detail:"The society has filed its redevelopment resolution and appointed a project consultant.",projectId:"saffron"},
  {id:"sig4",title:"Municipal approval advanced",area:"Worli",type:"Approval stage",when:"Yesterday",confidence:84,detail:"The project moved to the next municipal review stage after document resubmission.",projectId:"arden"},
  {id:"sig5",title:"Contractor mobilisation",area:"Powai",type:"New construction",when:"Yesterday",confidence:91,detail:"Temporary site offices and heavy equipment are now present on the parcel.",projectId:"northstar"},
];

export const statusColor: Record<ProjectStatus,string> = {
  "New construction":"#3f65d9", "Redevelopment":"#df8c34", "Approval stage":"#9b62d6", "Construction started":"#2f8f78"
};
