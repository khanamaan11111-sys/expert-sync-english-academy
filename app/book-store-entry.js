(function(){
  function add(){
    if(document.getElementById("esa-book-store-card"))return;
    const host=document.querySelector("#es-smart-home")||document.querySelector(".aviation-feature-grid");
    if(!host)return;
    const card=document.createElement("article");
    card.id="esa-book-store-card";
    card.style.cssText="margin:14px 15px;padding:18px;border-radius:18px;background:linear-gradient(145deg,#041b3d,#063b91);color:#fff;border:1px solid rgba(255,217,120,.5);box-shadow:0 10px 25px rgba(3,27,63,.18);";
    card.innerHTML='<div style="font-size:10px;font-weight:900;letter-spacing:1.5px;color:#ffd978">DIGITAL BOOK STORE</div><h3 style="margin:7px 0;font-size:20px">📚 Expert Sync Book</h3><p style="margin:0;color:#dce9f7;font-size:12px;line-height:1.5">Buy an authorised Expert Sync PDF for ₹400, unlock it after verified payment, and share your referral link to earn ₹100.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" style="border:0;border-radius:11px;padding:10px 13px;font-weight:800;background:#d4af37;color:#172033;cursor:pointer" onclick="location.href='book-store.html'">Open Book Store →</button></div>';
    host.parentNode.insertBefore(card,host.nextSibling);\n    try{if(window.supabaseClient){window.supabaseClient.auth.getUser().then(function(x){if(x.data?.user?.app_metadata?.role==="admin"){var b=document.createElement("button");b.type="button";b.style.cssText="border:1px solid rgba(255,255,255,.45);border-radius:11px;padding:10px 13px;font-weight:800;background:transparent;color:#fff;cursor:pointer";b.textContent="⚙️ Upload Book";b.onclick=function(){location.href="book-admin.html"};card.querySelector("div[style*=\"display:flex\"]").appendChild(b)}})}}catch(e){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",add);else add();
})();