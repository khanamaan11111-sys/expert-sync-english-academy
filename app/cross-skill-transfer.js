/* Expert Sync Cross-Skill Transfer Engine — Stage 62 */
(function(){
const KEY="esaCrossSkillTransferV1";
const SKILLS=["grammar","vocabulary","speaking","pronunciation","interview","customerService","aviation"];
const LINKS={
 vocabulary:["speaking","interview","customerService","aviation"],
 grammar:["speaking","interview","customerService"],
 pronunciation:["speaking","interview","aviation"],
 speaking:["interview","customerService","aviation"],
 interview:["speaking","customerService"],
 customerService:["speaking","interview"],
 aviation:["speaking","pronunciation","customerService"]
};
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function build(){
 const p=window.ESAUnifiedEvidence?.refresh?.()||read("esaUnifiedEvidenceV1",{summary:{}}), s=p.summary||{}, transfer={};
 SKILLS.forEach(skill=>{
  const source=Number(s[skill]?.score)||0;
  transfer[skill]=LINKS[skill].map(target=>{
   const targetScore=Number(s[target]?.score)||0;
   const gap=clamp(source-targetScore);
   return {target,gap,priority:gap>=25?"high":gap>=10?"medium":"low"};
  }).filter(x=>x.priority!=="low").sort((a,b)=>b.gap-a.gap);
 });
 const recommendations=[];
 Object.entries(transfer).forEach(([source,items])=>items.slice(0,2).forEach(x=>recommendations.push({source,target:x.target,gap:x.gap,priority:x.priority})));
 recommendations.sort((a,b)=>b.gap-a.gap);
 const result={updatedAt:new Date().toISOString(),transfer,recommendations:recommendations.slice(0,8)};
 localStorage.setItem(KEY,JSON.stringify(result));return result;
}
function get(){return read(KEY,build())}
function next(){return build().recommendations[0]||null}
window.ESACrossSkillTransfer={build,get,next};
})();