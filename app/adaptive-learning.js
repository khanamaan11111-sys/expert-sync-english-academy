/* Expert Sync Adaptive Learning Engine — Stage 50 */
(function(){
const KEY="esaAdaptivePlanV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(n||0)))}
function build(){
 const a=window.ESASkillAnalytics?.all?ESASkillAnalytics.all():{},diag=read("esaVocabularyDiagnosticV1",null);
 const skills=Object.keys(a).map(k=>({key:k,...a[k]})).sort((x,y)=>x.current-y.current);
 const weakest=skills[0]||{key:"vocabulary",current:0};
 const focus=weakest.key;
 const difficulty=weakest.current<40?"foundation":weakest.current<65?"developing":weakest.current<80?"intermediate":"advanced";
 const activities={
  grammar:"Practice grammar questions and correct recurring errors.",
  vocabulary:"Complete Smart Review and learn high-priority words.",
  speaking:"Complete a speaking practice session and produce original responses.",
  pronunciation:"Complete pronunciation practice and repeat difficult sounds.",
  interview:"Practise one interview response with structured speaking.",
  customerService:"Practise one customer-service scenario and response.",
  aviation:"Complete an aviation communication/safety scenario."
 };
 const plan={date:new Date().toISOString().slice(0,10),focus,weakestScore:weakest.current,difficulty,reason:"Lowest current skill evidence",activity:activities[focus]||activities.vocabulary,diagnosticPath:diag?.recommendedPath||null,skills:Object.fromEntries(skills.map(s=>[s.key,s.current]))};
 localStorage.setItem(KEY,JSON.stringify(plan)); return plan;
}
function get(){return read(KEY,null)||build()}
function next(){const p=get();return {focus:p.focus,difficulty:p.difficulty,activity:p.activity,reason:p.reason}}
window.ESAAdaptiveLearning={build,get,next};
})();