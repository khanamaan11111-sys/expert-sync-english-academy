(function(){
if(document.getElementById("es-bottom-nav"))return;
var onIndex=typeof window.showSection==="function" || location.pathname.endsWith("/index.html") || location.pathname.endsWith("/");
var items=[
 ["learning-home-premium.html","⌂","Home"],
 ["courses","📚","Courses"],
 ["practice","🎯","Practice"],
 ["goal-progress.html","📈","Progress"]
];
var n=document.createElement("nav");
n.id="es-bottom-nav";
n.setAttribute("aria-label","Primary navigation");
function go(target){
 if(onIndex && typeof window.showSection==="function"){ window.showSection(target); window.scrollTo({top:0,behavior:"smooth"}); return; }
 location.href=target;
}
items.forEach(function(x){
 var a=document.createElement("a");
 a.href=onIndex?"#"+x[0]:x[0];
 a.innerHTML="<span>"+x[1]+"</span><small>"+x[2]+"</small>";
 a.addEventListener("click",function(e){if(onIndex){e.preventDefault();go(x[0]);}});
 n.appendChild(a);
});
var more=document.createElement("button");
more.type="button";more.className="es-more-btn";more.setAttribute("aria-label","Open more learning areas");
more.innerHTML="<span>☰</span><small>More</small>";
n.appendChild(more);
document.body.appendChild(n);
var sheet=document.createElement("div");
sheet.id="es-more-sheet";
sheet.innerHTML='<div class="es-sheet-backdrop"></div><section class="es-sheet" role="dialog" aria-modal="true" aria-label="More learning areas"><div class="es-sheet-head"><div><div class="es-kicker">EXPERT SYNC</div><h2>More Learning Areas</h2></div><button type="button" class="es-sheet-close" aria-label="Close menu">×</button></div><div class="es-sheet-grid">'+[
["📖","Dictionary","dictionary.html"],
["📚","Vocabulary","vocabulary-achievement-center.html"],
["🎤","Interview Academy","interview-hub.html"],
["🔊","Pronunciation","pronunciation-lab.html"],
["💼","Jobs","jobs"],
["🛠️","Services","services"],
["👤","My Profile","learner-profile.html"],
["🏆","Achievements","achievement-showcase.html"],
["🌟","Weekly Wins","weekly-wins.html"],
["📄","Learning Report","learning-report.html"]
].map(function(x){return '<button type="button" class="es-sheet-item" data-target="'+x[2]+'"><span>'+x[0]+'</span><b>'+x[1]+'</b></button>'}).join("")+'</div></section>';
document.body.appendChild(sheet);
function open(){sheet.classList.add("open");document.body.classList.add("es-menu-open");}
function close(){sheet.classList.remove("open");document.body.classList.remove("es-menu-open");}
more.addEventListener("click",open);
sheet.querySelector(".es-sheet-backdrop").addEventListener("click",close);
sheet.querySelector(".es-sheet-close").addEventListener("click",close);
sheet.querySelectorAll(".es-sheet-item").forEach(function(b){b.addEventListener("click",function(){var t=b.dataset.target;close();if(onIndex&&typeof window.showSection==="function"&&(t==="jobs"||t==="services")){window.showSection(t);window.scrollTo({top:0,behavior:"smooth"});}else{location.href=t;}})});
document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
var path=location.pathname.split("/").pop();
n.querySelectorAll("a").forEach(function(a){a.setAttribute("aria-label",a.querySelector("small")?.textContent||"Navigate");});
})();