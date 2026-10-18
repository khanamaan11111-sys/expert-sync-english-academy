/* Expert Sync Adaptive Mastery Engine — Stage 60 */
(function(){
const KEY="esaAdaptiveMasteryV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function build(){
 const outcomes=read("esaActivityOutcomesV1",[]), skills=["grammar","vocabulary","speaking","pronunciation","interview","customerService","aviation"], profile=window.ESAUnifiedEvidence?.refresh?.()||read("esaUnifiedEvidenceV1",{summary:{}});
 const mastery={};
 for(const skill of skills){
  const target=outcomes.filter(x=>{const t=x.type||"";return skill==="vocabulary"?t.includes("vocab"):skill==="aviation"?t.includes("aviation")||t.includes("atc"):t.toLowerCase().includes(skill.toLowerCase())});
  const recent=target.slice(-5), scores=recent.map(x=>clamp(x.score)), consistency=scores.length?clamp(100-(Math.max(...scores)-Math.min(...scores))):0;
  const recency=recent.length?clamp(100-(Math.max(0,(Date.now()-new Date(recent.at(-1).completedAt).getTime())/86400000)*10)):0;
  const evidence=clamp(recent.length*20), avg=scores.length?clamp(scores.reduce((a,b)=>a+b,0)/scores.length):0;
  const masteryScore=clamp(avg*.5+consistency*.2+evidence*.2+recency*.1);
  mastery[skill]={score:masteryScore,evidenceCount:target.length,recentCount:recent.length,average:avg,consistency,recency,status:masteryScore>=85&&recent.length>=3?"mastered":masteryScore>=65?"developing":"building"};
 }
 const profileOut={updatedAt:new Date().toISOString(),mastery};
 localStorage.setItem(KEY,JSON.stringify(profileOut));return profileOut;
}
function get(){return read(KEY,build())}
function skill(k){return get().mastery?.[k]||null}
function isMastered(k){return skill(k)?.status==="mastered"}
window.ESAMastery={build,get,skill,isMastered};
})();