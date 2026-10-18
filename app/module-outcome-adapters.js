/* Expert Sync Real Module Outcome Adapters — Stage 67 */
(function(){
const KEY="esaModuleAdaptersV1";
const DEFINITIONS={
 vocabulary:{types:["vocabulary-challenge","vocabulary-review","vocabulary"],label:"Vocabulary"},
 grammar:{types:["grammar","grammar-practice"],label:"Grammar"},
 speaking:{types:["speaking","ai-speaking"],label:"Speaking"},
 pronunciation:{types:["pronunciation"],label:"Pronunciation"},
 interview:{types:["interview"],label:"Interview"},
 customerService:{types:["customer-service","customerService"],label:"Customer Service"},
 aviation:{types:["aviation-mission","aviation-atc","aviation","atc"],label:"Aviation"}
};
function clamp(n){return Math.max(0,Math.min(100,Number(n)||0))}
function normalise(skill,result){
 const r=result||{}, total=Math.max(1,Number(r.total??r.questions??r.attempts)||1);
 const correct=Math.max(0,Number(r.correct??r.correctAnswers??0));
 const score=r.score!=null?clamp(r.score):r.accuracy!=null?clamp(r.accuracy):clamp(correct/total*100);
 return {score,attempts:Math.max(1,Number(r.attempts)||total),correct,evidence:"module_adapter",skill,module:DEFINITIONS[skill]?.label||skill};
}
function begin(skill,title){return window.ESAOutcomeIntegrator?.start?window.ESAOutcomeIntegrator.start({type:DEFINITIONS[skill]?.types[0]||skill,title:title||DEFINITIONS[skill]?.label||skill}):null}
function complete(skill,result){const n=normalise(skill,result);return window.ESAOutcomeIntegrator?.sync?window.ESAOutcomeIntegrator.sync(n):null}
function definition(skill){return DEFINITIONS[skill]||null}
function all(){return DEFINITIONS}
window.ESAModuleAdapters={begin,complete,normalise,definition,all};
})();