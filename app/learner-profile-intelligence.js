/* Expert Sync Learner Profile Intelligence — Stage 63 */
(function(){
const KEY="esaLearnerProfileV1";
const SKILLS=["grammar","vocabulary","speaking","pronunciation","interview","customerService","aviation"];
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function build(){
 const evidence=window.ESAUnifiedEvidence?.refresh?.()||read("esaUnifiedEvidenceV1",{summary:{}}), summary=evidence.summary||{};
 const mastery=window.ESAMastery?.get?.()||{mastery:{}}, retention=window.ESAMasteryRetention?.build?.()||{due:[]}, transfer=window.ESACrossSkillTransfer?.build?.()||{recommendations:[]};
 const outcomes=read("esaActivityOutcomesV1",[]);
 const profile={skills:{},overall:0,priority:"vocabulary",strength:"vocabulary",learningState:"starting",evidenceCount:outcomes.length,updatedAt:new Date().toISOString()};
 SKILLS.forEach(k=>{
  const s=summary[k]||{}, m=mastery.mastery?.[k]||{}, score=clamp(s.score), attempts=Number(s.attempts)||0;
  profile.skills[k]={score,attempts,status:m.status||"building",confidence:clamp(attempts*20),last:s.last||null};
 });
 const ranked=SKILLS.slice().sort((a,b)=>profile.skills[a].score-profile.skills[b].score);
 profile.priority=ranked[0]; profile.strength=ranked.at(-1);
 profile.overall=clamp(SKILLS.reduce((n,k)=>n+profile.skills[k].score,0)/SKILLS.length);
 profile.learningState=profile.overall>=85?"advanced":profile.overall>=65?"progressing":profile.overall>=40?"developing":"starting";
 profile.retentionDue=retention.due||[];
 profile.transferPriority=transfer.recommendations?.[0]||null;
 profile.recommendation=profile.retentionDue.length
  ?"Maintain "+profile.retentionDue[0]+" through a retention review."
  :profile.transferPriority
  ?"Strengthen "+profile.transferPriority.target+" through "+profile.transferPriority.source+" transfer practice."
  :"Focus on "+profile.priority+" to build the weakest measured skill.";
 localStorage.setItem(KEY,JSON.stringify(profile));return profile;
}
function get(){return read(KEY,build())}
function refresh(){return build()}
window.ESALearnerProfile={build,get,refresh};
})();