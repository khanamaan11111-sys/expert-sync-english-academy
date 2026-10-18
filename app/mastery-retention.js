/* Expert Sync Mastery Review & Retention — Stage 61 */
(function(){
const KEY="esaMasteryRetentionV1";
const SKILLS=["grammar","vocabulary","speaking","pronunciation","interview","customerService","aviation"];
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function build(){
 const mastery=window.ESAMastery?.get?window.ESAMastery.get():{mastery:{}}, history=read("esaActivityOutcomesV1",[]), now=Date.now(), review={};
 SKILLS.forEach(skill=>{
  const m=mastery.mastery?.[skill]||{}, items=history.filter(x=>{const t=(x.type||"").toLowerCase();return skill==="vocabulary"?t.includes("vocab"):skill==="aviation"?t.includes("aviation")||t.includes("atc"):t.includes(skill.toLowerCase())});
  const last=items.at(-1)?.completedAt, days=last?Math.max(0,(now-new Date(last).getTime())/86400000):Infinity;
  const mastered=m.status==="mastered", due=mastered&&days>=7;
  const retention=mastered?clamp(100-Math.max(0,days-7)*4):clamp(m.score||0);
  review[skill]={mastered,due,lastReview:last||null,daysSinceReview:Number.isFinite(days)?Math.round(days*10)/10:null,retention};
 });
 const due=SKILLS.filter(s=>review[s].due).sort((a,b)=>review[a].retention-review[b].retention);
 const plan={updatedAt:new Date().toISOString(),due,review};
 save(KEY,plan);return plan;
}
function get(){return read(KEY,build())}
function next(){const p=build();return p.due[0]||null}
window.ESAMasteryRetention={build,get,next};
})();