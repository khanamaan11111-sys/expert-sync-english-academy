/* Expert Sync Grammar Outcome Adapter — Stage 68 */
(function(){
const KEY="esaGrammarOutcomeV1";
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function calculate(result){
 const r=result||{}, total=Math.max(1,Number(r.total??r.questions??0)||1);
 const correct=Math.max(0,Number(r.correct??r.correctAnswers??0));
 const score=r.score!=null?clamp(r.score):r.accuracy!=null?clamp(r.accuracy):clamp(correct/total*100);
 return {score,attempts:Math.max(1,Number(r.attempts)||1),correct,total,grammarArea:r.grammarArea||r.topic||"general",evidence:"grammar_module_result"};
}
function start(title){return window.ESAModuleAdapters?.begin?window.ESAModuleAdapters.begin("grammar",title||"Grammar Practice"):window.ESAOutcomeIntegrator?.start({type:"grammar",title:title||"Grammar Practice"})}
function complete(result){const n=calculate(result);localStorage.setItem(KEY,JSON.stringify({...n,completedAt:new Date().toISOString()}));return window.ESAModuleAdapters?.complete?window.ESAModuleAdapters.complete("grammar",n):window.ESAOutcomeIntegrator?.sync(n)}
function last(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){return null}}
window.ESAGrammarOutcome={start,complete,calculate,last};
})();