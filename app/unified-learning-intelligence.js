/* Expert Sync Unified Learning Intelligence — Stage 48 */
(function(){
  const KEYS={
    vocab:"esaVocabularyProgressV1",
    diagnostic:"esaVocabularyDiagnosticV1",
    daily:"esaDailyResultsV1",
    dailySteps:"esaDailyPlanStepsV1",
    practiceSessions:"esaPracticeSessions",
    questions:"esaQuestionsAnswered",
    bestScore:"esaBestScore",
    streak:"esaStreak",
    simulator:"esaSimulatorProgress"
  };
  function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
  function num(k){return Number(localStorage.getItem(k))||0}
  function vocabulary(){
    const p=read(KEYS.vocab,{}), words=Object.keys(p), known=words.filter(w=>p[w]?.status==="known").length;
    const attempts=words.reduce((n,w)=>n+(p[w]?.attempts||0),0),correct=words.reduce((n,w)=>n+(p[w]?.correct||0),0);
    return {started:words.length,mastered:known,attempts,correct,accuracy:attempts?Math.round(correct/attempts*100):0};
  }
  function daily(){
    const d=read(KEYS.daily,{}), plans=read(KEYS.dailySteps,{}), days=Object.keys(plans).filter(k=>Object.values(plans[k]||{}).filter(Boolean).length===5);
    return {completed:Object.values(d).filter(x=>x?.steps===5).length,completedDays:days.length,today:plans[new Date().toISOString().slice(0,10)]||{}};
  }
  function simulator(){
    const s=read(KEYS.simulator,null); if(!s)return {available:false,progress:0,score:0,complete:false};
    return {available:true,progress:Number(s.routeProgress)||0,score:Number(s.score)||0,complete:!!s.mission17Complete};
  }
  function snapshot(){
    const v=vocabulary(),d=daily(),sim=simulator(),diag=read(KEYS.diagnostic,null);
    const sessions=num(KEYS.practiceSessions),questions=num(KEYS.questions),best=num(KEYS.bestScore),legacyStreak=num(KEYS.streak);
    const components=[
      Math.min(100,v.accuracy),
      Math.min(100,v.mastered?Math.min(100,v.mastered*4):0),
      Math.min(100,d.completedDays*10),
      Math.min(100,sessions*5),
      Math.min(100,best),
      sim.available?Math.min(100,Math.round((sim.progress+sim.score)/2)):0
    ];
    const overall=Math.round(components.reduce((a,b)=>a+b,0)/components.length);
    const activeToday=Object.values(d.today).filter(Boolean).length;
    return {vocabulary:v,daily:d,simulator:sim,diagnostic:diag,practice:{sessions,questions,bestScore:best,legacyStreak},overall,activeToday};
  }
  function nextAction(s){
    if(!s.diagnostic)return {title:"Take the Diagnostic",text:"Establish your starting level so the Academy can personalise your journey.",href:"vocabulary-diagnostic.html"};
    if(s.activeToday<5)return {title:"Continue Today's Plan",text:s.activeToday+"/5 steps completed today.",href:"vocabulary-daily.html"};
    if(s.vocabulary.accuracy<80)return {title:"Strengthen Vocabulary Recall",text:"Smart Review is the highest-value next step for your current recall evidence.",href:"vocabulary-review.html"};
    if(s.simulator.available&&!s.simulator.complete)return {title:"Continue Aviation Simulator",text:"Your simulator flight is still in progress.",href:"aviation-game.html"};
    return {title:"Advance Your Learning Path",text:"Your core progress is on track. Continue your recommended path.",href:"vocabulary-paths.html"};
  }
  window.ESAUnifiedLearning={keys:KEYS,read,snapshot,nextAction};
})();