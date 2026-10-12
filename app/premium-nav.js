(function(){
if(document.getElementById("es-bottom-nav"))return;
var style=document.createElement("style");
style.id="es-premium-nav-style";
style.textContent=`
#es-bottom-nav{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:10000;width:min(100%,760px);height:72px;padding:7px 10px calc(7px + env(safe-area-inset-bottom));box-sizing:border-box;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:rgba(255,255,255,.97);border:1px solid #d8e2ef;border-bottom:0;border-radius:22px 22px 0 0;box-shadow:0 -10px 32px rgba(3,27,63,.14);backdrop-filter:blur(14px);font-family:Arial,sans-serif}
#es-bottom-nav a,#es-bottom-nav .es-more-btn{min-width:0;border:0;background:transparent;color:#68768b;text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:14px;font:inherit;cursor:pointer}
#es-bottom-nav a span,#es-bottom-nav .es-more-btn span{font-size:21px;line-height:1}
#es-bottom-nav a small,#es-bottom-nav .es-more-btn small{font-size:10px;font-weight:800;line-height:1.1}
#es-bottom-nav a:active,#es-bottom-nav .es-more-btn:active{transform:scale(.96)}
#es-bottom-nav a.active{color:#063b91;background:#eef4fd}
#es-bottom-nav a.active small{font-weight:900}
#es-more-sheet{position:fixed;inset:0;z-index:10001;display:none;font-family:Arial,sans-serif}
#es-more-sheet.open{display:block}
#es-more-sheet .es-sheet-backdrop{position:absolute;inset:0;background:rgba(3,27,63,.42);backdrop-filter:blur(3px)}
#es-more-sheet .es-sheet{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,760px);max-height:min(78vh,680px);overflow:auto;background:#fff;border:1px solid #d8e2ef;border-bottom:0;border-radius:24px 24px 0 0;box-shadow:0 -18px 50px rgba(3,27,63,.22);padding:16px 14px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box}
#es-more-sheet .es-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
#es-more-sheet .es-kicker{font-size:9px;font-weight:900;letter-spacing:2px;color:#b18712;margin-bottom:4px}
#es-more-sheet h2{margin:0;color:#063b91;font-size:20px}
#es-more-sheet .es-sheet-close{width:36px;height:36px;border:1px solid #d8e2ef;border-radius:50%;background:#f5f8fc;color:#34445a;font-size:23px;line-height:1;cursor:pointer}
#es-more-sheet .es-sheet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
#es-more-sheet .es-sheet-item{min-height:66px;border:1px solid #d8e2ef;border-radius:15px;background:#f8fbff;color:#063b91;padding:10px;display:grid;grid-template-columns:34px 1fr;align-items:center;text-align:left;gap:9px;cursor:pointer;font:inherit}
#es-more-sheet .es-sheet-item span{font-size:24px;text-align:center}
#es-more-sheet .es-sheet-item b{font-size:12px}
#es-more-sheet .es-sheet-item:active{transform:scale(.98);background:#eef4fd}
body.es-menu-open{overflow:hidden;padding-bottom:0}
@media(min-width:701px){#es-bottom-nav{width:min(100%,760px);height:68px}.es-sheet{width:min(100%,760px)}}
@media(max-width:380px){#es-bottom-nav{height:68px;padding-left:6px;padding-right:6px}#es-bottom-nav a span,#es-bottom-nav .es-more-btn span{font-size:19px}#es-bottom-nav a small,#es-bottom-nav .es-more-btn small{font-size:9px}#es-more-sheet .es-sheet-grid{grid-template-columns:1fr}}
`;
document.head.appendChild(style);
var onIndex=typeof window.showSection==="function" || location.pathname.endsWith("/index.html") || location.pathname.endsWith("/");
var items=[
 ["learning-home-premium.html","⌂","Home"],
 ["practice","🎯","Practice"],
 ["courses","📚","Courses"],
 ["messenger/","💬","Messenger"]
];
var n=document.createElement("nav");
n.id="es-bottom-nav";
n.setAttribute("aria-label","Primary navigation");
function go(target){
 if(target==="courses"){
   if(typeof window.openExpertSyncCourses==="function"){ window.openExpertSyncCourses(); return; }
   location.href=onIndex?"#courses":"index.html#courses"; return;
 }
 if(target==="messenger/"){ location.href="messenger/"; return; }
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
["📈","Progress","goal-progress.html"],
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