/* Expert Sync Adaptive Session Generator — Stage 51 */
(function(){
const KEY="esaAdaptiveSessionV1",HIST="esaAdaptiveSessionHistoryV1",XP="esaAdaptiveSessionXPV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function build(){
 const plan=window.ESAAdaptiveLearning?.get?ESAAdaptiveLearning.get():{focus:"vocabulary",difficulty:"developing",activity:"Complete Smart Review and learn high-priority words."};
 const sequence=window.ESASequence?.build?window.ESASequence.build():null;
 const map={
  grammar:[["grammar","Grammar Accuracy Practice"],["review","Error Correction Review"],["challenge","Grammar Challenge"]],
  vocabulary:[["learn","Priority Vocabulary"],["recall","Recall Practice"],["review","Smart Review"]],
  speaking:[["speaking","Speaking Response"],["use","Sentence Production"],["challenge","Speaking Challenge"]],
  pronunciation:[["pronunciation","Pronunciation Practice"],["recall","Sound Recall"],["challenge","Pronunciation Challenge"]],
  interview:[["interview","Interview Response"],["speaking","Structured Speaking"],["challenge","Interview Challenge"]],
  customerService:[["customer-service","Customer Service Scenario"],["speaking","Response Practice"],["challenge","Service Challenge"]],
  aviation:[["aviation","Aviation Communication"],["speaking","Operational Response"],["challenge","Aviation Challenge"]]
 };
 const activities=sequence?.activities?.map(a=>[a.type,a.title])||map[plan.focus]||map.vocabulary;
