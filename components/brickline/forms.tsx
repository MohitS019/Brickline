"use client";
import { FormEvent, useState } from "react";
import type { ProjectStatus } from "@/lib/brickline-data";
import { allIndiaAreas } from "@/lib/india-areas";
import { Modal } from "./ui";

export type FormKind="project"|"opportunity"|"alert"|"message";
export type FormResult =
 | {kind:"project";name:string;area:string;builder:string;status:ProjectStatus;value:number;homes:number;notes:string}
 | {kind:"opportunity";name:string;area:string;builder:string;commission:string;notes:string}
 | {kind:"alert";name:string;area:string;notes:string}
 | {kind:"message";name:string;notes:string};

export function SimpleFormModal({kind,recipient="",onClose,onSubmit}:{kind:FormKind;recipient?:string;onClose:()=>void;onSubmit:(result:FormResult)=>void}){
 const [name,setName]=useState(recipient),[area,setArea]=useState("Bandra West"),[notes,setNotes]=useState(""),[builder,setBuilder]=useState(""),[status,setStatus]=useState<ProjectStatus>("New construction"),[value,setValue]=useState(""),[homes,setHomes]=useState(""),[commission,setCommission]=useState("");
 const titles={project:"Add project",opportunity:"Post opportunity",alert:"Create Radar alert",message:"Send message"};
 const submit=(e:FormEvent)=>{e.preventDefault();if(!name.trim())return;if(kind==="project")onSubmit({kind,name:name.trim(),area,builder:builder.trim()||"Your company",status,value:Number(value)||0,homes:Number(homes)||0,notes:notes.trim()});else if(kind==="opportunity")onSubmit({kind,name:name.trim(),area,builder:builder.trim()||"Your company",commission:commission.trim()||"To be discussed",notes:notes.trim()});else if(kind==="alert")onSubmit({kind,name:name.trim(),area,notes:notes.trim()});else onSubmit({kind,name:name.trim(),notes:notes.trim()});onClose()};
 return <Modal title={titles[kind]} onClose={onClose}><form className="modal-form" onSubmit={submit}>
  <label>{kind==="project"?"Project name":kind==="opportunity"?"Opportunity title":kind==="alert"?"Alert name":"Recipient"}<input autoFocus value={name} onChange={e=>setName(e.target.value)} required placeholder={kind==="message"?"Person or company":"Enter a name"}/></label>
  {(kind==="project"||kind==="opportunity")&&<label>Builder or company<input value={builder} onChange={e=>setBuilder(e.target.value)} required placeholder="Company name"/></label>}
  {kind!=="message"&&<label>Area<input list="india-area-options" value={area} onChange={e=>setArea(e.target.value)} required placeholder="Search any Indian state or city"/><datalist id="india-area-options">{allIndiaAreas.map(item=><option value={item} key={item}/>)}</datalist></label>}
  {kind==="project"&&<><label>Development stage<select value={status} onChange={e=>setStatus(e.target.value as ProjectStatus)}><option>New construction</option><option>Redevelopment</option><option>Approval stage</option><option>Construction started</option></select></label><div className="form-row"><label>Estimated value (₹ Cr)<input type="number" min="0" value={value} onChange={e=>setValue(e.target.value)} required/></label><label>Number of homes<input type="number" min="0" value={homes} onChange={e=>setHomes(e.target.value)} required/></label></div></>}
  {kind==="opportunity"&&<label>Partner commission<input value={commission} onChange={e=>setCommission(e.target.value)} placeholder="For example, 2.5% + bonus" required/></label>}
  <label>{kind==="message"?"Message":kind==="alert"?"What should trigger this alert?":"Description"}<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add useful details" rows={4} required/></label>
  <div className="modal-buttons"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" type="submit">{kind==="message"?"Send message":"Save"}</button></div>
 </form></Modal>
}
