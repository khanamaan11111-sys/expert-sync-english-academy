/* Expert Sync Adaptive Learning Engine — Stage 50 */
(function(){
const KEY="esaAdaptivePlanV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(n||0)))}
function build(){
 const a=window.ESASkillAnalytics?.all?ESASkillAnalytics.all():{},diag=read("esaVocabularyDiagnosticV1",null);
 const raw=a.skills||a;const skills=Object.keys(raw).filter(k=>raw[k]&&typeof raw[k]==="object").map(k=>({key:k,...raw[k],current:Number(raw[k].score??raw[k].current)||0})).sort((x,y)=>x.current-y.current);
 const mastery=window.ESAMastery?.get?window.ESAMastery.get():{mastery:{}};const retention=window.ESAMasteryRetention?.build?window.ESAMasteryRetention.build():{due:[]};const transfer=window.ESACrossSkillTransfer?.build?window.ESACrossSkillTransfer.build():{recommendations:[]};const learner=window.ESALearnerProfile?.refresh?window.ESALearnerProfile.refresh():null;const dueSkill=retention.due?.[0];const eligible=skills.filter(s=>mastery.mastery?.[s.key]?.status!=="mastered");const weakest=eligible[0]||skills[0]||{key:"vocabulary",current:0};
 const transferTarget=transfer.recommendations?.[0]?.target;const profilePriority=learner?.priority;const focus=dueSkill||transferTarget||profilePriority||weakest.key;
 const baseDifficulty=weakest.current<40?"foundation":weakest.current<65?"developing":weakest.current<80?"intermediate":"advanced";
 const loop=window.ESAClosedLoop?.get?window.ESAClosedLoop.get():null;
 const difficulty=loop?.nextDifficulty||baseDifficulty;
 const activities={
  grammar:"Practice grammar questions and correct recurring errors.",
  vocabulary:"Complete Smart Review and learn high-priority words.",
  speaking:"Complete a speaking practice session and produce original responses.",
  pronunciation:"Complete pronunciation practice and repeat difficult sounds.",
  interview:"Practise one interview response with structured speaking.",
  customerService:"Practise one customer-service scenario and response.",
  aviation:"Complete an aviation communication/safety scenario."
 };
 const plan={date:new Date().toISOString().slice(0,10),focus,weakestScore:weakest.current,difficulty,reason:loop?.reason||(dueSkill?"Mastery retention review is due for "+dueSkill:transferTarget?"Cross-skill transfer from "+transfer.recommendations[0].source+" prioritises "+transferTarget:"Lowest current skill evidence"),activity:activities[focus]||activities.vocabulary,diagnosticPath:diag?.recommendedPath||null,skills:Object.fromEntries(skills.map(s=>[s.key,s.current])),learnerState:learner?.learningState||null,mastery:Object.fromEntries(skills.map(s=>[s.key,mastery.mastery?.[s.key]?.status||"building"]))};
 localStorage.setItem(KEY,JSON.stringify(plan)); return plan;
}
function get(){return read(KEY,null)||build()}
function next(){const p=get();return {focus:p.focus,difficulty:p.difficulty,activity:p.activity,reason:p.reason}}
window.ESAAdaptiveLearning={build,get,next};
})();