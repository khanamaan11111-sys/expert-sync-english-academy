/* Expert Sync Unified Learner Evidence Profile — Stage 58 */
(function(){
const KEY="esaUnifiedEvidenceV1";
const SOURCES=["esaActivityOutcomesV1","esaSkillAnalyticsV1","esaVocabularyProgressV1","esaAdaptiveSessionHistoryV1","esaDailyResultsV1","esaDailyVocabularyMissionV1","esaSimulatorProgress"];
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function outcomes(){return read("esaActivityOutcomesV1",[])}
function build(){
 const o=outcomes(), by={};
 o.forEach(x=>{const k=x.type||"general";(by[k]??=[]).push(x)});
 const skills={vocabulary:[],grammar:[],speaking:[],pronunciation:[],interview:[],customerService:[],aviation:[]};
 Object.entries(by).forEach(([k,v])=>{const target=k.includes("vocab")?"vocabulary":k.includes("grammar")?"grammar":k.includes("pronunciation")?"pronunciation":k.includes("interview")?"interview":k.includes("customer")?"customerService":k.includes("aviation")||k.includes("atc")?"aviation":k.includes("speak")?"speaking":"speaking";skills[target].push(...v)});
 const summary={};
 Object.entries(skills).forEach(([k,v])=>{const scores=v.map(x=>Number(x.score)||0);summary[k]={attempts:v.length,score:scores.length?clamp(scores.reduce((a,b)=>a+b,0)/scores.length):0,last:v.at(-1)?.completedAt||null}});
 const profile={updatedAt:new Date().toISOString(),totalOutcomes:o.length,summary,sources:SOURCES};
 localStorage.setItem(KEY,JSON.stringify(profile));return profile;
}
function get(){return read(KEY,build())}
function refresh(){return build()}
window.ESAUnifiedEvidence={get,refresh,build};
})();