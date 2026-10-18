/* Expert Sync Speaking & Pronunciation Outcome Integration — Stage 69 */
(function(){
const KEY="esaSpeakingPronunciationOutcomeV1";
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function normalise(result,skill){
 const r=result||{}, score=r.score!=null?clamp(r.score):clamp((Number(r.accuracy)||0)*100);
 return {score,attempts:Math.max(1,Number(r.attempts)||1),correct:Math.max(0,Number(r.correct)||0),skill,evidence:"speaking_pronunciation_module",fluency:clamp(r.fluency),clarity:clamp(r.clarity),pronunciation:clamp(r.pronunciation)};
}
function start(skill,title){return window.ESAModuleAdapters?.begin?window.ESAModuleAdapters.begin(skill,title):window.ESAOutcomeIntegrator?.start({type:skill,title})}
function complete(skill,result){const o=normalise(result,skill);localStorage.setItem(KEY,JSON.stringify({...o,completedAt:new Date().toISOString()}));return window.ESAModuleAdapters?.complete?window.ESAModuleAdapters.complete(skill,o):window.ESAOutcomeIntegrator?.sync(o)}
function startSpeaking(title){return start("speaking",title||"Speaking Practice")}
function completeSpeaking(result){return complete("speaking",result)}
function startPronunciation(title){return start("pronunciation",title||"Pronunciation Practice")}
function completePronunciation(result){return complete("pronunciation",result)}
function last(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){return null}}
window.ESASpeakingPronunciationOutcome={startSpeaking,completeSpeaking,startPronunciation,completePronunciation,normalise,last};
})();