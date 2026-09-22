"use client";
import { FormEvent, useState } from "react";
import type { ProjectStatus } from "@/lib/brickline-data";
import { Modal } from "./ui";

const commonCurrencies = [
 ["INR", "Indian rupee"], ["USD", "US dollar"], ["EUR", "Euro"], ["GBP", "British pound"],
 ["AED", "UAE dirham"], ["SAR", "Saudi riyal"], ["SGD", "Singapore dollar"], ["AUD", "Australian dollar"],
 ["CAD", "Canadian dollar"], ["JPY", "Japanese yen"], ["CNY", "Chinese yuan"], ["HKD", "Hong Kong dollar"],
 ["NZD", "New Zealand dollar"], ["CHF", "Swiss franc"], ["ZAR", "South African rand"], ["BRL", "Brazilian real"],
 ["MXN", "Mexican peso"], ["KRW", "South Korean won"], ["THB", "Thai baht"], ["MYR", "Malaysian ringgit"],
 ["IDR", "Indonesian rupiah"], ["PHP", "Philippine peso"], ["TRY", "Turkish lira"], ["EGP", "Egyptian pound"],
];

export type FormKind="project"|"opportunity"|"alert"|"message";
export type FormResult =
 | {kind:"project";name:string;area:string;country:string;siteAddress:string;reraNumber:string;currency:string;builder:string;status:ProjectStatus;value:number;homes:number;notes:string}
 | {kind:"opportunity";name:string;area:string;country:string;builder:string;commission:string;notes:string}
 | {kind:"alert";name:string;area:string;country:string;notes:string}
 | {kind:"message";name:string;notes:string};

export function SimpleFormModal({kind,recipient="",initialArea="",onClose,onSubmit}:{kind:FormKind;recipient?:string;initialArea?:string;onClose:()=>void;onSubmit:(result:FormResult)=>void}){
 const [name,setName]=useState(recipient),[area,setArea]=useState(initialArea),[country,setCountry]=useState(""),[siteAddress,setSiteAddress]=useState(""),[reraNumber,setReraNumber]=useState(""),[currency,setCurrency]=useState(""),[otherCurrency,setOtherCurrency]=useState(""),[notes,setNotes]=useState(""),[builder,setBuilder]=useState(""),[status,setStatus]=useState<ProjectStatus>("New construction"),[value,setValue]=useState(""),[homes,setHomes]=useState(""),[commission,setCommission]=useState("");
 const titles={project:"Add project",opportunity:"Post opportunity",alert:"Create Radar alert",message:"Send message"};
 const submit=(e:FormEvent)=>{e.preventDefault();if(!name.trim())return;if(kind==="project"){const selectedCurrency=(currency==="OTHER"?otherCurrency:currency).trim().toUpperCase();if(!/^[A-Z]{3}$/.test(selectedCurrency))return;onSubmit({kind,name:name.trim(),area:area.trim(),country:country.trim(),siteAddress:siteAddress.trim(),reraNumber:reraNumber.trim(),currency:selectedCurrency,builder:builder.trim()||"Your company",status,value:Number(value)||0,homes:Number(homes)||0,notes:notes.trim()})}else if(kind==="opportunity")onSubmit({kind,name:name.trim(),area:area.trim(),country:country.trim(),builder:builder.trim()||"Your company",commission:commission.trim()||"To be discussed",notes:notes.trim()});else if(kind==="alert")onSubmit({kind,name:name.trim(),area:area.trim(),country:country.trim(),notes:notes.trim()});else onSubmit({kind,name:name.trim(),notes:notes.trim()});onClose()};
 return <Modal title={titles[kind]} onClose={onClose}><form className="modal-form" onSubmit={submit}>
  <label>{kind==="project"?"Project name":kind==="opportunity"?"Opportunity title":kind==="alert"?"Alert name":"Recipient"}<input autoFocus value={name} onChange={e=>setName(e.target.value)} required placeholder={kind==="message"?"Person or company":"Enter a name"}/></label>
  {(kind==="project"||kind==="opportunity")&&<label>Builder or company<input value={builder} onChange={e=>setBuilder(e.target.value)} required placeholder="Company name"/></label>}
  {kind!=="message"&&<div className="form-row"><label>City or region<input value={area} onChange={e=>setArea(e.target.value)} required placeholder="e.g. Singapore"/></label><label>Country<input value={country} onChange={e=>setCountry(e.target.value)} required placeholder="e.g. Singapore"/></label></div>}
  {kind==="project"&&<label>Exact site address (optional)<input value={siteAddress} onChange={e=>setSiteAddress(e.target.value)} placeholder="Street address or Google Maps place name"/><small>Without this, the map shows the project area only.</small></label>}
  {kind==="project"&&<><label>RERA registration number (if applicable)<input value={reraNumber} onChange={e=>setReraNumber(e.target.value)} maxLength={80} placeholder="Enter the project's RERA number"/><small>For projects in India. This number is builder-provided and not verified by Brickline.</small></label><label>Development stage<select value={status} onChange={e=>setStatus(e.target.value as ProjectStatus)}><option>New construction</option><option>Redevelopment</option><option>Approval stage</option><option>Construction started</option></select></label><div className="form-row"><label>Currency<select value={currency} onChange={e=>setCurrency(e.target.value)} required><option value="">Select currency</option>{commonCurrencies.map(([code,label])=><option key={code} value={code}>{code} · {label}</option>)}<option value="OTHER">Other currency</option></select></label><label>Estimated value<input type="number" min="0" value={value} onChange={e=>setValue(e.target.value)} required/></label></div>{currency==="OTHER"&&<label>Other currency code<input value={otherCurrency} onChange={e=>setOtherCurrency(e.target.value.toUpperCase())} maxLength={3} minLength={3} pattern="[A-Z]{3}" required placeholder="Three-letter ISO code"/></label>}<label>Number of homes<input type="number" min="0" value={homes} onChange={e=>setHomes(e.target.value)} required/></label></>}
  {kind==="opportunity"&&<label>Partner commission<input value={commission} onChange={e=>setCommission(e.target.value)} placeholder="For example, 2.5% + bonus" required/></label>}
  <label>{kind==="message"?"Message":kind==="alert"?"What should trigger this alert?":"Description"}<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add useful details" rows={4} required/></label>
  <div className="modal-buttons"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" type="submit">{kind==="message"?"Send message":"Save"}</button></div>
 </form></Modal>
}
