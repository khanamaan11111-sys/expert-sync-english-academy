
  function emojiOnlyCount(body) {
    if (!body || !globalThis.Intl?.Segmenter) return 0;
    const segments = [...new Intl.Segmenter(undefined, {granularity:"grapheme"}).segment(body.trim())]
      .map(item => item.segment).filter(part => !/^\s+$/u.test(part));
    if (!segments.length || segments.length > 3) return 0;
    const emoji = /^(?:\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*)$/u;
    return segments.every(part => emoji.test(part)) ? segments.length : 0;
  }

(async () => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function notice(text, error = false) {
    $("notice").textContent = text;
    $("notice").classList.toggle("error", error);
  }

  // Display user content as text, never as HTML.
  function element(tag, text, className = "") {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
  }

  let db;
  let user = null;
  let profile = null;
  let activeChat = null;
  let activeGroup = false;
  let groupVersion = 0;
  let reportsVersion = 0;
  let replyTarget = null;
let activeFriendId = null;
let friendProfileVersion = 0;
  let channel = null;
  let sessionVersion = 0;
  let blocksVersion = 0;
  let storiesVersion = 0;
  let deletionVersion = 0;
  const messageDrafts = new Map();
  let messageVersion = 0;
  let chatVersion = 0;
  let peopleSearchVersion = 0;
    let feedVersion = 0;
  let feedPage = 0;
  let feedFilter = "all";
  let notificationsVersion = 0;
  let displayedNotificationIds = [];
  let messageLimit = 100;
  let recoveryMode = new URLSearchParams(location.hash.slice(1)).get("type") === "recovery";
  let pendingInstall = null;
  const invitation = new URL(location.href).searchParams.get("friend");

  function showRecovery() {
    for (const id of ["auth-section", "profile-section", "messenger-section", "feed-section", "app-navigation", "settings-section", "notifications-section"]) $(id).hidden = true;
    $("recovery-section").hidden = false;
    $("new-password").focus();
  }

  function filterMessages() {
    const query = $("message-search").value.trim().toLowerCase();
    let matches = 0;
    for (const bubble of $("messages").querySelectorAll(".message")) {
      bubble.hidden = !bubble.dataset.search.includes(query);
      if (!bubble.hidden) matches++;
    }
    $("message-search-status").textContent = query ? matches + " matching messages in loaded history." : "";
  }

  function openPhoto(src, alt) {
    $("photo-viewer-image").src = src;
    $("photo-viewer-image").alt = alt;
    $("photo-viewer").showModal();
    $("close-photo-viewer").focus();
  }

  function connectionStatus() {
    $("connection-status").textContent = navigator.onLine ? "" : "You are offline. Connect to the internet to send messages or load posts.";
    $("connection-status").hidden = navigator.onLine;
  }


  function showAppView(view) {
    if (!user || !profile) return;

    const feed = view === "feed";
    $("notifications-section").hidden = view !== "notifications";
    $("show-notifications-button").setAttribute("aria-pressed", String(view === "notifications"));
    $("settings-section").hidden = view !== "settings";
    $("show-settings-button").setAttribute("aria-pressed", String(view === "settings"));
    $("profile-section").hidden = true;
    $("app-navigation").hidden = false;
    $("messenger-section").hidden = view !== "chats";
    $("feed-section").hidden = !feed;
    $("show-chats-button").setAttribute("aria-pressed", String(view === "chats"));
    $("show-feed-button").setAttribute("aria-pressed", String(feed));
  }
  async function loadNotifications() {
    if (!user || !profile) return;
    const currentId = user.id;
    const session = sessionVersion;
    const version = ++notificationsVersion;
    const current = () => user?.id === currentId && sessionVersion === session && notificationsVersion === version;
    displayedNotificationIds = [];
    $("read-notifications").disabled = true;
    $("notifications-list").replaceChildren();
    $("notifications-status").textContent = "Loading notifications…";
    const result = await db.from("activity_notifications")
      .select("id, actor_id, kind, post_id, created_at, read_at")
      .eq("recipient_id", currentId).order("created_at", {ascending:false}).order("id", {ascending:false}).limit(50);
    if (!current()) return;
    if (result.error) {
      $("notifications-status").textContent = ["PGRST205", "42P01"].includes(result.error.code)
        ? "Notifications setup is pending." : "Could not load notifications. Please refresh.";
      return;
    }
    const updates = result.data || [];
    if (!updates.length) { $("notifications-status").textContent = "No notifications yet."; return; }
    const actors = check(await db.from("profiles").select("id, display_name, username")
      .in("id", [...new Set(updates.map(item => item.actor_id))]));
    if (!current()) return;
    let unread = 0;
    for (const item of updates) {
      const actor = actors.find(person => person.id === item.actor_id);
      const name = actor ? `${actor.display_name} · @${actor.username}` : "A member";
      const wording = {follow:"started following you", like:"liked your post", comment:"commented on your post"};
      const row = element("article", "", "notification-item");
      row.style.cssText = "padding:12px 0;border-bottom:1px solid #304963;overflow-wrap:anywhere";
      row.append(element("p", `${name} ${wording[item.kind] || "sent an update"}.`));
      const time = element("time", new Date(item.created_at).toLocaleString());
      time.dateTime = item.created_at;
      row.append(time, element("p", item.read_at ? "Read" : "Unread"));
      if (!item.read_at) { unread++; displayedNotificationIds.push(item.id); }
      $("notifications-list").append(row);
    }
    $("notifications-status").textContent = `${unread} unread in these ${updates.length} notifications.`;
    $("read-notifications").disabled = unread === 0;
  }

  for(const toggle of document.querySelectorAll(".password-toggle")){
    const field=$(toggle.dataset.password);
    toggle.onclick=()=>{
      const show=field.type==="password";
      field.type=show ? "text" : "password";
      toggle.textContent=show ? "Hide password" : "Show password";
      toggle.setAttribute("aria-pressed",String(show));
    };
    field.onblur=()=>{field.type="password";toggle.textContent="Show password";toggle.setAttribute("aria-pressed","false");};
  }

  async function readWithTimeout(query,timeoutMs=8000){
    const controller=new AbortController();
    const request=typeof query.abortSignal==="function" ? query.abortSignal(controller.signal) : query;
    let timer;
    try{
      return await Promise.race([Promise.resolve(request),new Promise((resolve,reject)=>{
        timer=setTimeout(()=>{const error=new Error("Read timed out");error.name="TimeoutError";reject(error);controller.abort();},timeoutMs);
      })]);
    }finally{clearTimeout(timer);}
  }

  async function checkFeatureAccess(){
    if(!user)return;
    const id=user.id,session=sessionVersion,current=()=>user?.id===id && sessionVersion===session;
    const container=$("connection-check-results");container.replaceChildren();
    const checks=[
      ["Profile","profiles","id,username"],["Messages","messages","id,reply_to,deleted_at"],
      ["Group chats","chats","id,is_group,title"],["Photo feed","posts","id,caption"],
      ["Following","profile_follows","follower_id"],["Notifications","activity_notifications","id"],
      ["Saved posts","post_bookmarks","post_id"],["Message reactions","message_reactions","message_id"],
      ["Reports","content_reports","id"],["Blocking","user_blocks","blocked_id"],
      ["Stories","text_stories","id,expires_at"],["Deletion requests","account_deletion_requests","user_id"]
    ];
    let stopped=false;
    for(const [label,table,columns] of checks){
      if(!current())return;
      const row=element("p",label+": checking…");container.append(row);
      if(stopped){row.textContent=label+": not checked—retry when connected";continue;}
      try{
        const result=await readWithTimeout(db.from(table).select(columns).limit(1));
        if(!current())return;
        const missing=result.error && ["42P01","42703","PGRST200","PGRST204","PGRST205"].includes(result.error.code);
        row.textContent=label+": "+(!result.error ? "basic read access OK" : missing ? "setup needed" : "check unavailable—try again or contact the app owner");
      }catch(error){
        if(!current())return;
        row.textContent=label+(error.name==="TimeoutError" ? ": connection timed out—run the check again" : ": connection unavailable—run the check again");
        stopped=true;
      }
    }
  }

  async function loadDeletionRequest(){
    if(!user)return;
    const id=user.id,session=sessionVersion,version=++deletionVersion;
    const current=()=>user?.id===id && sessionVersion===session && deletionVersion===version;
    $("deletion-admin-panel").hidden=true;$("deletion-admin-list").replaceChildren();
    $("request-account-deletion").disabled=true;$("cancel-account-deletion").hidden=true;
    const result=await db.from("account_deletion_requests").select("status,requested_at").eq("user_id",id).maybeSingle();
    if(!current())return;
    if(result.error){$("deletion-request-status").textContent="Deletion request setup is pending or unavailable.";return;}
    const pending=result.data?.status==="pending";
    $("deletion-request-status").textContent=pending ? "Deletion requested. Your account is still active; administrator processing is pending." : result.data ? "Your deletion request was cancelled." : "No deletion request submitted.";
    $("request-account-deletion").disabled=pending;$("request-account-deletion").hidden=pending;$("cancel-account-deletion").hidden=!pending;
    const mod=await db.rpc("is_app_moderator");if(!current() || mod.error || mod.data!==true)return;
    const requests=check(await db.from("account_deletion_requests").select("user_id,requested_at").eq("status","pending").order("requested_at",{ascending:true}).limit(100));
    if(!current())return;
    $("deletion-admin-panel").hidden=false;
    for(const request of requests)$("deletion-admin-list").append(element("p",`Account ID: ${request.user_id} · Requested ${new Date(request.requested_at).toLocaleString()}`));
    if(!requests.length)$("deletion-admin-list").textContent="No pending requests.";
  }

  async function loadStories(){
    if(!user || !profile)return;
    const id=user.id,session=sessionVersion,version=++storiesVersion;
    const current=()=>user?.id===id && sessionVersion===session && storiesVersion===version;
    const result=await db.from("text_stories").select("id,user_id,body,created_at,expires_at").order("created_at",{ascending:false}).limit(60);
    if(!current())return;
    const container=$("stories-list");container.replaceChildren();
    if(result.error){$("stories-status").textContent="Stories setup is pending or unavailable.";return;}
    const stories=result.data || [];
    const ids=[...new Set(stories.map(s=>s.user_id))];
    const people=ids.length ? check(await db.from("profiles").select("id,display_name,username").in("id",ids)) : [];
    const mod=await db.rpc("is_app_moderator");
    if(!current())return;
    for(const story of stories){
      const person=people.find(p=>p.id===story.user_id);
      const card=element("article","","story-card");card.dataset.expiresAt=story.expires_at;
      card.append(element("strong",person ? `${person.display_name} · @${person.username}` : "Member"),element("p",story.body,"story-body"),element("time","Expires "+new Date(story.expires_at).toLocaleString()));
      if(story.user_id===id || (!mod.error && mod.data===true)){
        const remove=element("button",story.user_id===id ? "Delete story" : "Remove as moderator","delete-story-button");remove.type="button";
        remove.onclick=()=>action(remove,async()=>{
          if(!current())return;
          if(story.user_id===id){if(!window.confirm("Delete your story?"))return;check(await db.from("text_stories").delete().eq("id",story.id).eq("user_id",id));}
          else{const note=window.prompt("Moderator reason (5–480 characters)");if(note===null)return;if(!window.confirm("Remove this story?"))return;check(await db.rpc("moderate_text_story",{target_story:story.id,action_note:note}));}
          if(current())await loadStories();
        });card.append(remove);
      }container.append(card);
    }
    $("stories-status").textContent=stories.length ? "Showing up to 60 active stories." : "No active stories yet.";
  }
  setInterval(()=>{for(const card of $("stories-list").querySelectorAll(".story-card")){if(Date.parse(card.dataset.expiresAt)<=Date.now())card.remove();}},30000);

  async function addBlockControl(container,person,current){
    const currentId=user?.id;
    const result=await db.from("user_blocks").select("blocked_id").eq("blocker_id",currentId).eq("blocked_id",person.id).maybeSingle();
    if(!current()) return;
    const button=element("button",result.error ? "Blocking setup pending" : result.data ? "Unblock member" : "Block member","block-member-button");
    button.type="button";button.disabled=!!result.error;
    let blocked=!!result.data;
    button.onclick=()=>action(button,async()=>{
      if(!current() || !window.confirm(blocked ? `Unblock @${person.username}? Direct messages can resume if they have not blocked you.` : `Block @${person.username}? New direct messages stop in both directions. Shared groups and community posts remain visible.`)) return;
      check(await db.rpc("set_user_block",{other_user:person.id,should_block:!blocked}));
      if(!current()) return;
      blocked=!blocked;button.textContent=blocked ? "Unblock member" : "Block member";
      notice(blocked ? "Member blocked for direct messaging." : "Member unblocked.");
    });container.append(button);
  }
  async function loadBlockedMembers(){
    if(!user) return;
    const currentId=user.id,session=sessionVersion,version=++blocksVersion;
    const current=()=>user?.id===currentId && sessionVersion===session && blocksVersion===version;
    const container=$("blocked-members-list");container.replaceChildren();
    const result=await db.from("user_blocks").select("blocked_id").eq("blocker_id",currentId).order("created_at",{ascending:false}).limit(100);
    if(!current()) return;
    if(result.error){container.textContent="Blocking setup is pending or unavailable.";return;}
    const ids=(result.data || []).map(b=>b.blocked_id);
    const people=ids.length ? check(await db.from("profiles").select("id,username,display_name").in("id",ids)) : [];
    if(!current()) return;
    if(!ids.length){container.textContent="You haven’t blocked anyone.";return;}
    container.append(element("p","Showing up to 100 blocked members."));
    for(const id of ids){
      const person=people.find(p=>p.id===id) || {id,username:"member",display_name:"Member"};
      const row=element("article","","blocked-member");row.append(element("p",`${person.display_name} · @${person.username}`));
      const unblock=element("button","Unblock");unblock.type="button";
      unblock.onclick=()=>action(unblock,async()=>{
        if(!current() || !window.confirm(`Unblock @${person.username}?`)) return;
        check(await db.rpc("set_user_block",{other_user:id,should_block:false}));
        if(current()) await loadBlockedMembers();
      });row.append(unblock);container.append(row);
    }
  }

  async function copyMessageText(node,current) {
    if(!current()) return;
    try {
      if(!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(node.textContent);
      if(current()) notice("Message copied.");
    } catch {
      if(!current()) return;
      const range=document.createRange();range.selectNodeContents(node);
      const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      notice("Message selected. Use Copy from your browser menu or press Ctrl+C.");
    }
  }

  function reportButton(kind, id, current) {
    const button=element("button",kind === "post" ? "Report post" : "Report message", "report-content-button");
    button.type="button";
    button.onclick=()=>action(button,async()=>{
      if(!user || !current()) return;
      const currentId=user.id, session=sessionVersion;
      const reason=window.prompt("Why are you reporting this? Use 5–1000 characters. Your reason and this selected content’s text will be shared with moderators.");
      if(reason===null) return;
      const text=reason.trim();
      if(text.length<5 || text.length>1000) throw new Error("Give a reason of 5–1000 characters.");
      check(await db.rpc("submit_content_report",{source_kind:kind,target_key:String(id),report_reason:text}));
      if(user?.id!==currentId || sessionVersion!==session) return;
      notice("Report saved. You can track it in Account & help. Reporting does not remove content automatically.");
    });
    return button;
  }

  async function loadReportCenter() {
    if(!user || !profile) return;
    const currentId=user.id,session=sessionVersion,version=++reportsVersion;
    const current=()=>user?.id===currentId && sessionVersion===session && reportsVersion===version;
    $("moderator-panel").hidden=true;
    $("moderator-reports-list").replaceChildren();
    $("my-reports-list").replaceChildren();
    $("reports-status").textContent="Loading reports…";
    const own=await db.from("content_reports").select("id, source_kind, reason, status, review_note, created_at")
      .eq("reporter_id",currentId).order("created_at",{ascending:false}).limit(30);
    if(!current()) return;
    if(own.error){$("reports-status").textContent="Reporting setup is pending or unavailable.";return;}
    for(const report of own.data || []) {
      const row=element("article","","report-item");
      row.append(element("p",`${report.source_kind} report · ${report.status}`),element("p",report.reason),element("p",report.review_note || "No review note yet."),element("time",new Date(report.created_at).toLocaleString()));
      $("my-reports-list").append(row);
    }
    $("reports-status").textContent=own.data?.length ? "Showing your latest 30 reports." : "You haven’t submitted any reports.";
    const moderator=await db.rpc("is_app_moderator");
    if(!current() || moderator.error || !moderator.data) return;
    const queue=check(await db.from("content_reports").select("id, source_kind, target_key, reason, content_snapshot, created_at").eq("status","open").order("created_at",{ascending:false}).limit(100));
    if(!current()) return;
    $("moderator-panel").hidden=false;
    if(!queue.length) $("moderator-reports-list").append(element("p","No open reports."));
    for(const report of queue) {
      const row=element("article","","moderator-report");
      row.append(element("h4",`${report.source_kind} report`),element("p",report.reason),element("p",report.content_snapshot));
      for(const status of ["reviewed","dismissed"]) {
        const button=element("button",status === "reviewed" ? "Mark reviewed" : "Dismiss");button.type="button";
        button.onclick=()=>action(button,async()=>{
          if(!current()) return;
          const note=window.prompt("Review note (up to 500 characters). This note is visible to the reporter.","");
          if(note===null) return;
          if(note.length>500) throw new Error("Use a note up to 500 characters.");
          check(await db.rpc("review_content_report",{report_id:report.id,new_status:status,moderator_note:note}));
          if(current()) await loadReportCenter();
        });
        row.append(button);
      }
      const remove=element("button",report.source_kind==="post" ? "Remove reported post" : "Clear reported message","moderator-remove-button");remove.type="button";
      remove.onclick=()=>action(remove,async()=>{
        if(!current()) return;
        const note=window.prompt("Reason for removal (5–480 characters). The reporter can read this note.");
        if(note===null) return;
        if(note.trim().length<5 || note.trim().length>480) throw new Error("Give a reason of 5–480 characters.");
        if(!window.confirm("Remove this reported content? A post is deleted; a message is replaced with a moderator notice. This cannot be undone here. Downloaded copies and stored photo files are not erased.")) return;
        check(await db.rpc("remove_reported_content",{target_report:report.id,action_note:note.trim()}));
        if(current()){await loadReportCenter();notice("Moderation action recorded.");}
      });row.append(remove);
      $("moderator-reports-list").append(row);
    }
  }

  async function addPostLikes(card, post, stillCurrent) {
    const currentId = user.id;
    const actions = element("div", "", "post-actions");
    const button = element("button", "♡ Like", "like-button");
    button.type = "button";
    button.setAttribute("aria-pressed", "false");

    const count = element("span", "", "like-count");
    count.setAttribute("aria-live", "polite");
    actions.append(button, count);
    card.append(actions);

    let liked = false;

    async function refreshLikes() {
      const [total, own] = await Promise.all([
        db.from("post_likes")
          .select("post_id", { count: "exact", head: true })
          .eq("post_id", post.id),
        db.from("post_likes")
          .select("post_id")
          .eq("post_id", post.id)
          .eq("user_id", currentId)
          .maybeSingle()
      ]);

      if (!stillCurrent()) return;
      check(total);
      liked = Boolean(check(own));

      const number = total.count || 0;
      count.textContent = `${number} ${number === 1 ? "like" : "likes"}`;
      button.textContent = liked ? "♥ Unlike" : "♡ Like";
      button.setAttribute("aria-pressed", String(liked));
    }

    button.onclick = () => action(button, async () => {
      if (!stillCurrent() || user?.id !== currentId) return;

      if (liked) {
        check(await db.from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentId));
      } else {
        const result = await db.from("post_likes").insert({
          post_id: post.id,
          user_id: currentId
        });

        // Another tab may already have added this like.
        if (result.error && result.error.code !== "23505") {
          throw result.error;
        }
      }

      if (!stillCurrent()) return;
      await refreshLikes();
    });

    button.disabled = true;
    try {
      await refreshLikes();
    } catch (error) {
      count.textContent = "Likes unavailable";
      throw error;
    } finally {
      button.disabled = false;
    }
  }

  function addPostComments(card, post, stillCurrent) {
    const currentId = user.id;
    const toggle = element("button", "Comments", "comments-button");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    const panel = element("section", "", "post-comments");
    panel.id = "comments-" + post.id;
    panel.setAttribute("aria-label", "Post comments");
    toggle.setAttribute("aria-controls", panel.id);
    panel.hidden = true;
    const status = element("p", "", "comments-status");
    status.setAttribute("role", "status");
    const list = element("div", "", "comments-list");
    const form = element("form", "", "comment-form");
    const label = element("label", "Add a comment");
    const input = document.createElement("textarea");
    input.id = "comment-input-" + post.id;
    label.htmlFor = input.id;
    input.maxLength = 1000;
    input.rows = 2;
    input.required = true;
    const send = element("button", "Post comment");
    send.type = "submit";
    const refresh = element("button", "Refresh comments", "comments-button");
    refresh.type = "button";
    form.append(label, input, send);
    panel.append(status, list, refresh, form);
    card.append(toggle, panel);
    let version = 0;
    async function refreshComments() {
      const request = ++version;
      status.textContent = "Loading comments…";
      try {
        const result = await db.from("post_comments")
          .select("id, user_id, body, created_at").eq("post_id", post.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false }).limit(50);
        if (!stillCurrent() || request !== version) return;
        const rows = check(result);
        const ids = [...new Set(rows.map(row => row.user_id))];
        const people = ids.length ? check(await db.from("profiles")
          .select("id, display_name, username").in("id", ids)) : [];
        if (!stillCurrent() || request !== version) return;
        list.replaceChildren();
        for (const row of rows.reverse()) {
          const person = people.find(item => item.id === row.user_id);
          const item = element("article", "", "comment-item");
          item.append(element("p", person
            ? person.display_name + " · @" + person.username : "Member", "comment-author"));
          item.append(element("p", row.body, "comment-body"));
          const time = element("time", new Date(row.created_at).toLocaleString(), "comment-date");
          time.dateTime = row.created_at;
          item.append(time);
          if (row.user_id === currentId) {
            const remove = element("button", "Delete comment", "delete-comment-button");
            remove.type = "button";
            remove.onclick = () => action(remove, async () => {
              if (!stillCurrent() || !window.confirm("Delete your comment?")) return;
              check(await db.from("post_comments").delete()
                .eq("id", row.id).eq("user_id", currentId));
              if (stillCurrent()) await refreshComments();
            });
            const edit=element("button","Edit comment","edit-comment-button");edit.type="button";
            const editor=element("form","","edit-comment-form");editor.hidden=true;
            const label=element("label","Comment (1–1,000 characters)");
            const field=document.createElement("textarea");field.maxLength=1000;field.rows=3;field.required=true;field.value=row.body;
            label.append(field);
            const save=element("button","Save comment");save.type="submit";
            const cancel=element("button","Cancel");cancel.type="button";editor.append(label,save,cancel);
            const valid=()=>stillCurrent() && request===version && user?.id===currentId;
            edit.onclick=()=>{if(!valid())return;field.value=row.body;editor.hidden=false;edit.hidden=true;field.focus();};
            cancel.onclick=()=>{editor.hidden=true;edit.hidden=false;};
            editor.onsubmit=event=>{event.preventDefault();action(save,async()=>{
              if(!valid()) return;
              const body=field.value.trim();if(!body || body.length>1000) throw new Error("Use 1–1,000 characters for your comment.");
              field.disabled=true;cancel.disabled=true;remove.disabled=true;
              try{
                check(await db.rpc("edit_own_comment",{target_comment:row.id,new_body:body}));
                if(!valid()) return;
                row.body=body;item.querySelector(".comment-body").textContent=body;
                editor.hidden=true;edit.hidden=false;notice("Comment updated.");
              }finally{field.disabled=false;cancel.disabled=false;remove.disabled=false;}
            });};
            item.append(edit,remove,editor);
          }
          list.append(item);
        }
        status.textContent = rows.length
          ? "Showing " + rows.length + " recent comments." : "No comments yet.";
      } catch (error) {
        if (stillCurrent() && request === version) {
          status.textContent = "Comments unavailable. Try Refresh comments.";
          throw error;
        }
      }
    }
    toggle.onclick = () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) action(refresh, refreshComments);
    };
    refresh.onclick = () => action(refresh, refreshComments);
    form.onsubmit = event => {
      event.preventDefault();
      action(send, async () => {
        if (!stillCurrent()) return;
        const body = input.value.trim();
        if (!body || body.length > 1000) throw new Error("Use 1–1,000 characters for your comment.");
        input.disabled = true;
        try {
          const id = crypto.randomUUID();
          const result = await db.from("post_comments").insert({ id, post_id: post.id, user_id: currentId, body });
          if (!stillCurrent()) return;
          if (result.error) {
            const verified = await db.from("post_comments").select("id").eq("id", id).maybeSingle();
            if (!stillCurrent()) return;
            if (verified.error) throw new Error("Could not confirm your comment. Refresh comments before trying again.");
            if (!verified.data) throw result.error;
          }
          input.value = "";
          await refreshComments();
        } finally { input.disabled = false; }
      });
    };
  }

  function filterChats() {
    const query = $("chat-filter").value.trim().toLowerCase();
    for (const button of $("chat-list").querySelectorAll(".chat-item")) {
      button.hidden = !button.textContent.toLowerCase().includes(query);
    }
  }

  function setupPhotoPreview(pickerId, previewId) {
    const picker = $(pickerId), preview = $(previewId);
    let url = null;
    function clear() {
      if (url) URL.revokeObjectURL(url);
      url = null;
      preview.removeAttribute("src");
      preview.hidden = true;
    }
    picker.addEventListener("change", () => {
      clear();
      const file = picker.files[0];
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          !file.size || file.size > 2 * 1024 * 1024) {
        picker.value = "";
        notice(file.size > 2 * 1024 * 1024
          ? "This photo is larger than 2 MB. Choose a smaller photo."
          : "Choose a non-empty JPEG, PNG or WebP photo.", true);
        return;
      }
      url = URL.createObjectURL(file);
      preview.src = url;
      preview.hidden = false;
    });
    picker.form.addEventListener("reset", clear);
  }

  async function loadFeed() {
    if (!user || !profile) return;

    const version = ++feedVersion;
    const currentId = user.id;
    const session = sessionVersion;
    const stillCurrent = () =>
      version === feedVersion &&
      session === sessionVersion &&
      user?.id === currentId;

    $("feed-status").textContent = "Loading posts…";

    try {
      let query = db.from("posts")
        .select("id, user_id, caption, image_path, created_at");
      if (feedFilter === "mine") query = query.eq("user_id", currentId);
      const result = feedFilter === "saved"
        ? await db.rpc("get_saved_posts", {page_offset:feedPage * 20})
        : feedFilter === "following"
        ? await db.rpc("get_following_posts", { page_offset: feedPage * 20 })
        : await query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(feedPage * 20, feedPage * 20 + 20);

      if (!stillCurrent()) return;
      const allPosts = check(result);
      const posts = allPosts.slice(0, 20);
      $("previous-feed").disabled = feedPage === 0;
      $("next-feed").disabled = allPosts.length <= 20;
      $("feed-page-label").textContent = "Page " + (feedPage + 1);

      if (!posts.length) {
        if (feedPage > 0) {
          feedPage--;
          return loadFeed();
        }
        $("posts-list").replaceChildren();
        $("feed-status").textContent =
          feedFilter === "saved" ? "No saved posts yet. Tap Save post on a photo to keep it here." : feedFilter === "following" ? "No posts from people you follow yet." : feedFilter === "mine" ? "You haven’t shared any posts yet." : "No posts yet. Share the first photo!";
        return;
      }

      const savedResult = await db.from("post_bookmarks").select("post_id")
        .eq("user_id", currentId).in("post_id", posts.map(post=>post.id));
      if (!stillCurrent()) return;
      const savedIds = new Set((savedResult.error ? [] : savedResult.data || []).map(item=>item.post_id));
      const ids = [...new Set(posts.map((post) => post.user_id))];
      const peopleResult = await db.from("profiles")
        .select("id, display_name, username")
        .in("id", ids);

      if (!stillCurrent()) return;
      const people = check(peopleResult);

      const photosResult = await db.storage.from("post-photos")
        .createSignedUrls(posts.map((post) => post.image_path), 3600);

      if (!stillCurrent()) return;
      const photos = check(photosResult);
      const cards = [];

      for (const post of posts) {
        const person = people.find((item) => item.id === post.user_id);
        const photo = photos.find((item) => item.path === post.image_path);
        const card = element("article", "", "post-card");
        const header = element("div", "", "post-header");
        const author = element("div", "", "post-author");

        author.append(element("h3", person?.display_name || "Member"));
        author.append(element("p",
          person ? `@${person.username}` : "", "post-username"));

        const time = element("time",
          new Date(post.created_at).toLocaleString(), "post-date");
        time.dateTime = post.created_at;
        author.append(time);
        header.append(author);

        if (post.user_id === currentId) {
          const remove = element("button", "Delete post",
            "delete-post-button");
          remove.type = "button";

          remove.onclick = () => action(remove, async () => {
            if (!stillCurrent()) return;
            if (!window.confirm("Delete this post permanently?")) return;

            const deletedResult = await db.from("posts")
              .delete()
              .eq("id", post.id)
              .eq("user_id", currentId)
              .select("id");

            if (!stillCurrent()) return;
            const deleted = check(deletedResult);
            if (!deleted.length) {
              throw new Error("Post not found. Refresh the feed.");
            }

            card.remove();

            const cleanup = await db.storage.from("post-photos")
              .remove([post.image_path]);

            if (!stillCurrent()) return;
            notice(cleanup.error
              ? "Post deleted, but its stored photo could not be removed."
              : "Post deleted.", Boolean(cleanup.error));

            await loadFeed();
          });

          header.append(remove);
        }

        card.append(header);

        if (photo?.signedUrl && !photo.error) {
          const img = document.createElement("img");
          img.className = "post-photo";
          img.alt = `Photo shared by ${person?.display_name || "a member"}`;
          img.loading = "lazy";
          img.decoding = "async";
          img.tabIndex = 0;
          img.setAttribute("role", "button");
          img.setAttribute("aria-label", "Open shared photo");
          img.src = photo.signedUrl;
          img.onerror = () => {
            img.replaceWith(element("p",
              "Photo unavailable. Try refreshing the feed."));
          };
          card.append(img);
        } else {
          card.append(element("p", "Photo unavailable."));
        }

        if (post.caption) {
          card.append(element("p", post.caption, "post-caption"));
        }

        const save = element("button", savedResult.error ? "Saved posts setup pending" : savedIds.has(post.id) ? "Unsave post" : "Save post", "save-post-button");
        save.type = "button";
        save.disabled = !!savedResult.error;
        save.setAttribute("aria-pressed", String(savedIds.has(post.id)));
        let saved = savedIds.has(post.id);
        save.onclick = () => action(save, async () => {
          if (!stillCurrent() || user?.id !== currentId) return;
          const mutation = saved
            ? await db.from("post_bookmarks").delete().eq("user_id", currentId).eq("post_id", post.id)
            : await db.from("post_bookmarks").insert({user_id:currentId, post_id:post.id});
          if (mutation.error && mutation.error.code !== "23505") throw mutation.error;
          if (!stillCurrent()) return;
          const status = check(await db.from("post_bookmarks").select("post_id")
            .eq("user_id", currentId).eq("post_id", post.id).maybeSingle());
          if (!stillCurrent()) return;
          saved = !!status;
          save.textContent = saved ? "Unsave post" : "Save post";
          save.setAttribute("aria-pressed", String(saved));
          if (feedFilter === "saved" && !saved) await loadFeed();
        });
        card.append(save, reportButton("post",post.id,stillCurrent));
        if(post.user_id===currentId){
          const edit=element("button","Edit caption","edit-post-button");edit.type="button";
          const editor=element("form","","edit-post-form");editor.hidden=true;
          const label=element("label","Caption (up to 2,000 characters)");
          const input=document.createElement("textarea");input.maxLength=2000;input.rows=3;input.value=post.caption || "";
          label.append(input);
          const submit=element("button","Save caption");submit.type="submit";
          const cancel=element("button","Cancel");cancel.type="button";
          editor.append(label,submit,cancel);
          edit.onclick=()=>{if(!stillCurrent()) return;input.value=post.caption || "";editor.hidden=false;edit.hidden=true;input.focus();};
          cancel.onclick=()=>{editor.hidden=true;edit.hidden=false;};
          editor.onsubmit=event=>{event.preventDefault();action(submit,async()=>{
            if(!stillCurrent() || user?.id!==currentId) return;
            const caption=input.value.trim();
            if(caption.length>2000) throw new Error("Use a caption up to 2,000 characters.");
            input.disabled=true;cancel.disabled=true;
            try{
              check(await db.rpc("edit_post_caption",{target_post:post.id,new_caption:caption}));
              if(!stillCurrent()) return;
              post.caption=caption;
              let displayed=card.querySelector(".post-caption");
              if(!displayed){displayed=element("p","","post-caption");card.insertBefore(displayed,save);}
              displayed.textContent=caption;displayed.hidden=!caption;
              editor.hidden=true;edit.hidden=false;notice("Caption updated.");
            }finally{input.disabled=false;cancel.disabled=false;}
          });};
          card.append(edit,editor);
        }

        await addPostLikes(card, post, stillCurrent);
        if (!stillCurrent()) return;
        addPostComments(card, post, stillCurrent);
        cards.push(card);
      }

      $("posts-list").replaceChildren(...cards);
      $("feed-status").textContent =
        `Showing ${posts.length} ${feedFilter === "saved" ? "saved" : "recent"} ${posts.length === 1 ? "post" : "posts"}.`;
    } catch (error) {
      if (stillCurrent()) {
        $("feed-status").textContent =
          "Could not load posts. Click Refresh feed to try again.";
        throw error;
      }
    }
  }

  async function action(button, task) {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await task();
    } catch (error) {
      notice(error.message || "Something went wrong. Try again.", true);
    } finally {
      button.disabled = false;
    }
  }

  function check(result) {
    if (result.error) throw result.error;
    return result.data;
  }

  function clearReply() {
    replyTarget = null;
    $("reply-preview").hidden = true;
    $("reply-preview-text").textContent = "";
  }

  function clearChat(keepDraft=true) {
    if(keepDraft && user && activeChat){
      const text=$("message-input").value.slice(0,4000);
      messageDrafts.delete(activeChat);
      if(text.trim())messageDrafts.set(activeChat,text);
      while(messageDrafts.size>20)messageDrafts.delete(messageDrafts.keys().next().value);
    }

    clearReply();
    activeGroup = false;
    groupVersion++;
    $("group-panel").hidden = true;
    $("group-members-list").replaceChildren();
    $("add-group-member-form").hidden = true;
    $("rename-group-button").hidden = true;
    $("add-group-member-form").reset();
    $("messenger-section").classList.remove("chat-open");
    $("chat-filter").value = "";
    $("message-search").value = "";
    $("message-search-status").textContent = "";
    $("load-older-messages").hidden = true;
    messageLimit = 100;
    activeChat = null;
    activeFriendId = null;
friendProfileVersion++;
$("view-profile-button").hidden = true;
$("friend-profile").hidden = true;
$("friend-avatar").hidden = true;
$("friend-avatar").removeAttribute("src");
$("friend-name").textContent = "";
$("friend-username").textContent = "";
$("friend-bio").textContent = "";
    messageVersion++;
    if (channel) {
      db.removeChannel(channel);
      channel = null;
    }
    $("messages").replaceChildren();
    $("chat-title").textContent = "Select a chat";
    $("message-form").hidden = true;
    $("message-form").reset();
  }

  async function showSession(session) {
    const nextUser = session?.user || null;
    if (recoveryMode && nextUser) {
      user = nextUser;
      showRecovery();
      return;
    }
    $("recovery-section").hidden = true;
    if (nextUser && nextUser.id === user?.id) return;

    const version = ++sessionVersion;
    if ($("photo-viewer").open) $("photo-viewer").close();
        feedVersion++;
    feedPage = 0;
    feedFilter = "all";
    $("feed-filter").value = "all";
    $("notifications-section").hidden = true;
    $("notifications-list").replaceChildren();
    $("notifications-status").textContent = "";
    displayedNotificationIds = [];
    notificationsVersion++;
    $("connection-check-results").replaceChildren();
    deletionVersion++;
    $("deletion-admin-panel").hidden=true;
    $("deletion-admin-list").replaceChildren();
    $("deletion-request-status").textContent="";
    storiesVersion++;
    $("stories-list").replaceChildren();
    $("stories-status").textContent="";
    $("story-form").reset();
    blocksVersion++;
    $("blocked-members-list").replaceChildren();
    $("friend-block-controls").replaceChildren();
    reportsVersion++;
    $("my-reports-list").replaceChildren();
    $("moderator-reports-list").replaceChildren();
    $("moderator-panel").hidden=true;
    $("reports-status").textContent="";
    $("settings-section").hidden = true;
    $("invite-text").value = "";
    $("app-navigation").hidden = true;
    $("feed-section").hidden = true;
    $("posts-list").replaceChildren();
    $("feed-status").textContent = "";
    $("post-form").reset();
    user = nextUser;
    profile = null;
    chatVersion++;
    messageDrafts.clear();
    clearChat(false);

    $("chat-list").replaceChildren();
    $("search-results").replaceChildren();
    $("my-profile").textContent = "";
    $("my-bio").textContent = "";
$("my-bio").hidden = true;
$("my-avatar").hidden = true;
$("my-avatar").removeAttribute("src");
$("edit-profile-button").hidden = true;
$("cancel-profile-button").hidden = true;
$("profile-form").reset();
$("profile-section").querySelector("h2").textContent = "Create your profile";
    $("auth-section").hidden = Boolean(user);
    $("profile-section").hidden = true;
    $("messenger-section").hidden = true;
    $("logout-button").hidden = !user;

    if (!user) {
      notice("Sign in or create an account to get started.");
      return;
    }

    const result = await db.from("profiles")
      .select("id, username, display_name, bio, avatar_path")
      .eq("id", user.id)
      .maybeSingle();

    if (version !== sessionVersion) return;
    profile = check(result);

    if (!profile) {
      $("profile-section").hidden = false;
      notice("Choose your name and username.");
      return;
    }

    $("my-profile").textContent =
      `${profile.display_name} · @${profile.username}`;
    $("my-bio").textContent = profile.bio || "";
$("my-bio").hidden = !profile.bio;
$("edit-profile-button").hidden = false;

const avatar = $("my-avatar");
avatar.hidden = true;
avatar.removeAttribute("src");

if (profile.avatar_path) {
  const photoResult = await db.storage
    .from("avatars")
    .createSignedUrl(profile.avatar_path, 3600);

  if (version !== sessionVersion) return;

  if (!photoResult.error) {
    avatar.src = photoResult.data.signedUrl;
    avatar.hidden = false;
  }
}
    showAppView("chats");
    notice("Find a friend to chat, or open Photo feed to share a photo.");
    await loadChats();
    if (invitation && /^[a-z0-9_]{3,24}$/.test(invitation) && invitation !== profile.username) {
      $("search-username").value = invitation;
      notice("Invitation from @" + invitation + ". Click Find user to start a chat.");
    }
  }

  async function loadGroupMembers() {
    if (!user || !activeChat || !activeGroup) return;
    const chatId=activeChat, currentId=user.id, session=sessionVersion, version=++groupVersion;
    const current=()=>activeChat===chatId && activeGroup && user?.id===currentId && sessionVersion===session && groupVersion===version;
    $("add-group-member-form").hidden=true;
    $("rename-group-button").hidden=true;
    const result=await db.rpc("get_group_members",{target_chat:chatId});
    if (!current()) return;
    if (result.error) { $("group-members-list").replaceChildren(element("li","Group setup is pending or access is unavailable.")); return; }
    const members=result.data || [];
    const owner=members.some(member=>member.user_id===currentId && member.is_owner);
    $("group-members-list").replaceChildren(...members.map(member=>{
      const row=element("li",`${member.display_name} · @${member.username}${member.is_owner ? " · Owner" : ""}`);
      if(owner && !member.is_owner){
        const remove=element("button","Remove member","remove-group-member-button");remove.type="button";
        remove.onclick=()=>action(remove,async()=>{
          if(!current() || !window.confirm(`Remove @${member.username}? They will lose group access. Previously downloaded messages and photos remain on their device.`)) return;
          check(await db.rpc("remove_group_member",{target_chat:chatId,member_id:member.user_id}));
          if(!current()) return;
          await loadGroupMembers();notice("Group member removed.");
        });row.append(remove);
        const transfer=element("button","Make owner","transfer-group-owner-button");transfer.type="button";
        transfer.onclick=()=>action(transfer,async()=>{
          if(!current() || !window.confirm(`Make @${member.username} the group owner? You will remain a member and lose the ability to manage this group. Only the new owner can transfer ownership back.`)) return;
          check(await db.rpc("transfer_group_ownership",{target_chat:chatId,new_owner:member.user_id}));
          if(!current()) return;
          await loadGroupMembers();notice("Group ownership transferred.");
        });row.append(transfer);
      }
      return row;
    }));
    $("add-group-member-form").hidden=!owner;
    $("rename-group-button").hidden=!owner;
  }

  async function loadChats() {
    if (!profile) return;
    const version = ++chatVersion;
    const currentId = user.id;

    const chats = check(await db.from("chats")
      .select("id, title, is_group, created_at")
      .order("created_at", { ascending: false })
      .limit(100));

    if (version !== chatVersion || user?.id !== currentId) return;

    const members = chats.length
      ? check(await db.from("chat_members")
          .select("chat_id, user_id")
          .in("chat_id", chats.map((chat) => chat.id)))
      : [];

    const ids = [...new Set(members
      .map((member) => member.user_id)
      .filter((id) => id !== currentId))];

    const people = ids.length
      ? check(await db.from("profiles")
          .select("id, display_name, username")
          .in("id", ids))
      : [];

    if (version !== chatVersion || user?.id !== currentId) return;

    const countsResult = chats.length ? await db.rpc("get_chat_unread_counts", {chat_ids:chats.map(chat=>chat.id)}) : {data:[]};
    if (version !== chatVersion || user?.id !== currentId) return;
    const counts = countsResult.error ? [] : countsResult.data || [];
    $("chat-list").replaceChildren();

    for (const chat of chats) {
      const member = members.find((item) =>
        item.chat_id === chat.id && item.user_id !== currentId);
      const person = people.find((item) => item.id === member?.user_id);
      const title = chat.is_group
        ? chat.title || "Group chat"
        : person
          ? `${person.display_name} · @${person.username}`
          : "Private chat";

      const button = element("button", "", "chat-item");
      const avatar=element("span",chat.is_group ? "#" : (person?.display_name || "P").slice(0,1).toUpperCase(),"chat-avatar");
      avatar.setAttribute("aria-hidden","true");
      button.append(avatar,element("span",title,"chat-item-title"));
      button.type = "button";
      const unread = counts.find(item=>item.chat_id === chat.id)?.unread_count || 0;
      if (Number(unread) > 0) {
        const badge = element("span", ` · ${unread} unread`, "unread-count");
        badge.style.cssText = "font-weight:700;color:#b8d8ff";
        button.append(badge);
      }
      button.classList.toggle("active", chat.id === activeChat);
      button.onclick = () => action(button, () => openChat(chat.id, title, chat.is_group ? null : person?.id, chat.is_group));
      $("chat-list").append(button);
    }

    filterChats();
    if (!chats.length) {
      $("chat-list").append(element("p", "No chats yet. Find a friend above."));
    }
  }
  async function loadMessages(chatId) {
    const version = ++messageVersion;
    const currentId = user?.id;
    const session = sessionVersion;

    const stillCurrent = () =>
      version === messageVersion &&
      activeChat === chatId &&
      user?.id === currentId &&
      sessionVersion === session;

    const result = await db.from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(messageLimit);

    if (!stillCurrent()) return;

    const messages = check(result);
    const originals = new Map(messages.map(message => [String(message.id), message]));
    if (replyTarget && originals.get(String(replyTarget.id))?.deleted_at) clearReply();
    const missing = [...new Set(messages.filter(message => message.reply_to != null && !originals.has(String(message.reply_to))).map(message => message.reply_to))];
    if (missing.length) {
      const referenced = await db.from("messages").select("id, body, image_path, sender_id")
        .eq("chat_id", chatId).in("id", missing);
      if (!stillCurrent()) return;
      if (!referenced.error) for (const original of referenced.data || []) originals.set(String(original.id), original);
    }
    $("load-older-messages").hidden = messages.length < messageLimit || messageLimit >= 1000;
    $("history-help").textContent = "Showing up to " + messageLimit + " recent messages. Search applies to loaded history.";
    let senders = [];
    if (activeGroup && messages.length) {
      const names = await db.from("profiles").select("id, display_name, username").in("id", [...new Set(messages.map(message=>message.sender_id))]);
      if (!stillCurrent()) return;
      if (!names.error) senders=names.data || [];
    }
    const paths = messages
      .filter((message) => message.image_path)
      .map((message) => message.image_path);

    let photos = [];

    if (paths.length) {
      const photoResult = await db.storage.from("chat-photos")
        .createSignedUrls(paths, 3600);

      if (!stillCurrent()) return;

      if (!photoResult.error) {
        photos = photoResult.data || [];
      }
    }

    const reactionResult=await db.from("message_reactions").select("message_id,user_id,emoji").in("message_id",messages.map(m=>m.id));
    if(!stillCurrent()) return;
    const reactions=reactionResult.error ? null : (reactionResult.data || []);
    const container = $("messages");
    const nearBottom =
      container.scrollHeight - container.scrollTop -
      container.clientHeight < 100;

    container.replaceChildren();

    for (const message of messages.reverse()) {
      const bubble = element("div", "", "message");
      bubble.dataset.messageId = String(message.id);
      if (activeGroup) {
        const sender=senders.find(person=>person.id===message.sender_id);
        bubble.append(element("strong",sender ? `${sender.display_name} · @${sender.username}` : "Member"));
        bubble.append(document.createElement("br"));
      }
      if (message.reply_to != null) {
        const original = originals.get(String(message.reply_to));
        const quote = element("p", original ? "Reply to: " + (original.body || "Photo").slice(0,160) : "Original message unavailable", "reply-quote");
        quote.style.cssText = "border-left:3px solid #79b4ff;padding-left:8px;white-space:pre-wrap";
        bubble.append(quote);
      }
      bubble.dataset.search = (message.body || (message.image_path ? "photo" : "")).toLowerCase();
      bubble.classList.toggle(
        "own", message.sender_id === currentId
      );

      if (message.image_path) {
        const photo = photos.find(
          (item) => item.path === message.image_path
        );

        if (photo?.signedUrl && !photo.error) {
          const img = document.createElement("img");
          img.className = "chat-photo";
          img.alt = "Photo shared in this chat";
          img.decoding = "async";
          img.tabIndex = 0;
          img.setAttribute("role", "button");
          img.setAttribute("aria-label", "Open shared photo");

          img.style.cssText =
            "display:block;width:100%;max-width:320px;" +
            "max-height:360px;object-fit:contain;" +
            "border-radius:10px;margin-bottom:8px;";

          img.onload = () => {
            if (stillCurrent() && nearBottom) {
              container.scrollTop = container.scrollHeight;
            }
          };

          img.onerror = () => {
            img.replaceWith(element("p",
              "Photo unavailable. Reopen the chat to refresh."
            ));
          };

          img.src = photo.signedUrl;
          bubble.append(img);
        } else {
          bubble.append(element("p",
            "Photo unavailable. Reopen the chat to refresh."
          ));
        }
      }

      if (message.body) {
        const emojiCount = !message.deleted_at && !message.image_path ? emojiOnlyCount(message.body) : 0;
        const bodyNode = element("span", message.body, emojiCount ? "emoji-message-body" : "message-body");
        if (emojiCount) {
          bubble.classList.add("emoji-only");
          bubble.dataset.emojiCount = String(emojiCount);
        }
        bubble.append(bodyNode);
      }

      const time = element("time",
        new Date(message.created_at).toLocaleString()
      );
      time.dateTime = message.created_at;

      bubble.append(time);
      const reply = element("button", "Reply", "reply-message-button");
      reply.type = "button";
      reply.style.cssText = "margin-top:8px;padding:5px 10px;font-size:13px";
      reply.disabled = !!message.deleted_at || !Object.prototype.hasOwnProperty.call(message, "reply_to");
      if (reply.disabled) reply.title = "Reply database setup pending";
      reply.onclick = () => {
        if (!stillCurrent() || $("send-button").disabled) return;
        replyTarget = {id:message.id, chatId};
        $("reply-preview-text").textContent = "Replying to: " + (message.body || "Photo").slice(0,160);
        $("reply-preview").hidden = false;
        $("message-input").focus();
      };
      if (!message.deleted_at) bubble.append(reply,reportButton("message",message.id,stillCurrent));
      if(!message.deleted_at && message.body){
        const copy=element("button","Copy message","copy-message-button");copy.type="button";
        copy.onclick=()=>action(copy,()=>copyMessageText(bubble.querySelector("span"),stillCurrent));
        bubble.append(copy);
      }

      if(!message.deleted_at && reactions){
        const bar=element("div","","message-reactions");
        bar.setAttribute("aria-label","Message reactions");
        for(const emoji of ["👍","❤️","😂","😮","😢"]){
          const matching=reactions.filter(r=>String(r.message_id)===String(message.id) && r.emoji===emoji);
          const mine=matching.some(r=>r.user_id===currentId);
          const react=element("button",emoji+(matching.length ? " "+matching.length : ""),"reaction-button");
          react.type="button";react.setAttribute("aria-pressed",String(mine));react.setAttribute("aria-label",(mine ? "Remove " : "React with ")+emoji);
          react.style.cssText="padding:4px 8px;margin:6px 3px 0 0;font-size:14px";
          if(mine) react.style.outline="2px solid #79b4ff";
          react.onclick=()=>action(react,async()=>{
            if(!stillCurrent()) return;
            check(await db.rpc("toggle_message_reaction",{target_message:message.id,reaction:emoji}));
            if(stillCurrent()) await loadMessages(chatId);
          });bar.append(react);
        }bubble.append(bar);
      }

      if (message.sender_id === currentId && !message.deleted_at) {
        const remove = element("button", "Delete message", "delete-message-button");
        remove.type = "button";
        remove.style.cssText = "margin:8px 0 0 8px;padding:5px 10px;font-size:13px";
        remove.disabled = !Object.prototype.hasOwnProperty.call(message, "deleted_at");
        if (remove.disabled) remove.title = "Message deletion setup pending";
        remove.onclick = () => action(remove, async () => {
          if (!stillCurrent() || $("send-button").disabled) return;
          if (!window.confirm("Delete this message for everyone? This cannot be undone. Photos already saved by others cannot be removed.")) return;
          const result = await db.rpc("delete_own_message", {message_id:message.id});
          const path = check(result);
          if (user?.id !== currentId || sessionVersion !== session) return;
          let photoCleanupFailed = false;
          if (path) {
            const cleanup = await db.storage.from("chat-photos").remove([path]);
            photoCleanupFailed = !!cleanup.error;
          }
          if (user?.id !== currentId || sessionVersion !== session) return;
          if (replyTarget?.id === message.id) clearReply();
          if ($("photo-viewer").open) $("photo-viewer").close();
          notice(photoCleanupFailed ? "Message deleted. Photo storage cleanup is pending." : "Message deleted.");
          if (activeChat === chatId) await loadMessages(chatId);
        });
        bubble.append(remove);
      }
      container.append(bubble);
    }

    if (!messages.length) {
      container.append(element("p",
        "Say hello or share a photo to start the conversation."
      ));
    }

    filterMessages();
    const mobileListVisible = window.matchMedia?.("(max-width: 720px)").matches && !$("messenger-section").classList.contains("chat-open");
    if (stillCurrent() && !$("messenger-section").hidden && document.visibilityState === "visible" && !mobileListVisible && !$("message-search").value) {
      const unreadIds = messages.filter(message=>message.sender_id !== currentId && !message.deleted_at).map(message=>message.id);
      if (unreadIds.length) {
        const marked = await db.rpc("mark_loaded_messages_read", {target_chat:chatId, message_ids:unreadIds});
        if (!stillCurrent()) return;
        if (!marked.error) await loadChats();
      }
    }
    if (nearBottom && !$("message-search").value) {
      container.scrollTop = container.scrollHeight;
    }
  }
async function openChat(chatId, title, friendId = null, isGroup = false) {
  clearChat();
  activeChat = chatId;
  $("message-input").value=messageDrafts.get(chatId) || "";
  activeGroup = !!isGroup;
  $("group-panel").hidden = !activeGroup;
  if (activeGroup) await loadGroupMembers();
  if (activeChat !== chatId) return;
  $("messenger-section").classList.add("chat-open");
  activeFriendId = friendId;
  $("view-profile-button").hidden = !friendId;
  $("chat-title").textContent = title;

    channel = db.channel(`messages-${chatId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`
      }, () => {
        if (activeChat === chatId) {
          loadMessages(chatId).catch((error) => notice(error.message, true));
        }
      })
      .subscribe((status) => {
        if (activeChat !== chatId) return;
        if (status === "SUBSCRIBED") {
          loadMessages(chatId).catch((error) => notice(error.message, true));
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          notice("Live updates are unavailable. Reopen the chat to refresh.", true);
        }
      });

    await loadMessages(chatId);
    if (activeChat !== chatId) return;
    $("message-form").hidden = false;
    $("messages").scrollTop = $("messages").scrollHeight;
    await loadChats();
  }

  try {
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2.110.2"
    );

    db = createClient(
      "https://tifjzpejgbxbvjphjpjy.supabase.co",
      "sb_publishable_sJF3cOPsKACa_ENYE2NLcw_Rdslpiyb"
    );

    db.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") recoveryMode = true;
      if (event === "SIGNED_OUT") recoveryMode = false;
      setTimeout(() => {
        showSession(session).catch(error => notice(error.message, true));
      }, 0);
    });
    connectionStatus();
    window.addEventListener("online", connectionStatus);
    window.addEventListener("offline", connectionStatus);
    $("message-search").oninput = filterMessages;
    $("refresh-messages").onclick = () => action($("refresh-messages"), async () => {
      if (activeChat) await loadMessages(activeChat);
    });
    $("load-older-messages").onclick = () => action($("load-older-messages"), async () => {
      if (!activeChat) return;
      const chatId = activeChat;
      const container = $("messages");
      const height = container.scrollHeight;
      const top = container.scrollTop;
      const previous = messageLimit;
      messageLimit = Math.min(1000, messageLimit + 100);
      try {
        await loadMessages(chatId);
        if (activeChat === chatId) container.scrollTop = top + container.scrollHeight - height;
      } catch (error) { if (activeChat === chatId) messageLimit = previous; throw error; }
    });
    let feedBusy = false;
    async function changeFeedPage(delta) {
      if (feedBusy) return;
      feedBusy = true;
      const before = feedPage;
      feedPage = Math.max(0, feedPage + delta);
      try { await loadFeed(); }
      catch (error) { feedPage = before; notice(error.message, true); }
      finally { feedBusy = false; }
    }
    $("previous-feed").onclick = () => changeFeedPage(-1);
    $("next-feed").onclick = () => changeFeedPage(1);
    $("show-notifications-button").onclick = () => {
      showAppView("notifications");
      action($("refresh-notifications"), loadNotifications);
    };
    $("refresh-notifications").onclick = () => action($("refresh-notifications"), loadNotifications);
    $("read-notifications").onclick = async () => {
      await action($("read-notifications"), async () => {
      if (!user || !displayedNotificationIds.length) return;
      const currentId = user.id;
      const session = sessionVersion;
      const ids = [...displayedNotificationIds];
      check(await db.from("activity_notifications").update({read_at:new Date().toISOString()})
        .eq("recipient_id", currentId).in("id", ids));
      if (user?.id === currentId && sessionVersion === session) await loadNotifications();
      });
      $("read-notifications").disabled = displayedNotificationIds.length === 0;
    };
    $("check-app-connection").onclick=()=>action($("check-app-connection"),checkFeatureAccess);
    $("download-profile-data").onclick=()=>{
      if(!user || !profile)return;
      const data={exported_at:new Date().toISOString(),profile:{display_name:profile.display_name,username:profile.username,bio:profile.bio || "",avatar_path:profile.avatar_path || null}};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
      const link=document.createElement("a");link.href=url;link.download="expert-sync-profile.json";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      notice("Profile download prepared. Keep it private on shared devices.");
    };
    $("refresh-deletion-request").onclick=()=>action($("refresh-deletion-request"),loadDeletionRequest);
    for(const [buttonId,want] of [["request-account-deletion",true],["cancel-account-deletion",false]]){
      $(buttonId).onclick=()=>action($(buttonId),async()=>{
        if(!user || !window.confirm(want ? "Request account deletion? This submits a request; your account stays active until an administrator processes it." : "Cancel your pending deletion request?"))return;
        const id=user.id,session=sessionVersion;
        check(await db.rpc("set_account_deletion_request",{want_deletion:want}));
        if(user?.id===id && sessionVersion===session)await loadDeletionRequest();
      });
    }
    $("refresh-stories").onclick=()=>action($("refresh-stories"),loadStories);
    $("story-form").onsubmit=event=>{event.preventDefault();action($("publish-story"),async()=>{
      if(!user)return;
      const id=user.id,session=sessionVersion,body=$("story-body").value.trim();
      if(!body || body.length>500)throw new Error("Use 1–500 characters.");
      $("story-body").disabled=true;
      try{check(await db.rpc("publish_text_story",{story_body:body}));if(user?.id!==id || sessionVersion!==session)return;$("story-form").reset();await loadStories();notice("Story published for 24 hours.");}finally{$("story-body").disabled=false;}
    });};
    $("refresh-blocks").onclick=()=>action($("refresh-blocks"),loadBlockedMembers);
    $("refresh-reports").onclick=()=>action($("refresh-reports"),loadReportCenter);
    $("show-settings-button").onclick = () => {
      showAppView("settings");
      const url = new URL("./", location.href);
      url.searchParams.set("friend", profile.username);
      $("invite-text").value = "Join me on Expert Sync Messenger. My username is @" + profile.username + ". " + url.href;
      $("account-details").textContent = profile.display_name + " · @" + profile.username;
      action($("refresh-reports"),loadReportCenter);
      action($("refresh-blocks"),loadBlockedMembers);
      action($("refresh-deletion-request"),loadDeletionRequest);
    };
    $("share-invite").onclick = () => action($("share-invite"), async () => {
      const text = $("invite-text").value;
      if (navigator.share) {
        try { await navigator.share({ title: "Expert Sync Messenger", text }); }
        catch (error) { if (error.name !== "AbortError") throw error; }
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        notice("Invitation copied. Paste it into a message to your friend.");
      } else {
        $("invite-text").focus(); $("invite-text").select();
        notice("Select and copy the invitation text.");
      }
    });
    $("forgot-password-button").onclick = () => action($("forgot-password-button"), async () => {
      const email = $("email");
      if (!email.reportValidity()) return;
      check(await db.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: new URL("./", location.href).href }));
      notice("If this email has an account, check its inbox for a password reset link.");
    });
    $("recovery-form").onsubmit = event => {
      event.preventDefault();
      action($("update-password-button"), async () => {
        const password = $("new-password").value;
        if (password.length < 8) throw new Error("Use at least 8 characters.");
        if (password !== $("confirm-password").value) throw new Error("The passwords do not match.");
        check(await db.auth.updateUser({ password }));
        recoveryMode = false;
        $("recovery-form").reset();
        history.replaceState(null, "", new URL("./", location.href).pathname);
        const session = check(await db.auth.getSession()).session;
        user = null;
        await showSession(session);
        notice("Password updated.");
      });
    };
    $("cancel-recovery").onclick = () => action($("cancel-recovery"), async () => {
      check(await db.auth.signOut());
      recoveryMode = false;
      history.replaceState(null, "", new URL("./", location.href).pathname);
      await showSession(null);
    });
    for (const [pickerId, clearId] of [["message-photo", "clear-message-photo"], ["post-photo", "clear-post-photo"]]) {
      $(clearId).onclick = () => { $(pickerId).value = ""; $(pickerId).dispatchEvent(new Event("change")); };
    }
    $("message-input").addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !$("send-button").disabled) {
        event.preventDefault(); $("message-form").requestSubmit();
      }
    });
    document.addEventListener("click", event => {
      const photo = event.target.closest(".post-photo, .chat-photo");
      if (photo) openPhoto(photo.src, photo.alt);
    });
    document.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && event.target.matches(".post-photo, .chat-photo")) {
        event.preventDefault(); openPhoto(event.target.src, event.target.alt);
      }
    });
    $("close-photo-viewer").onclick = () => $("photo-viewer").close();
    $("photo-viewer").addEventListener("close", () => $("photo-viewer-image").removeAttribute("src"));
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault(); pendingInstall = event; $("install-app").hidden = false;
    });
    $("install-app").onclick = () => action($("install-app"), async () => {
      if (!pendingInstall) return;
      await pendingInstall.prompt();
      await pendingInstall.userChoice;
      pendingInstall = null; $("install-app").hidden = true;
    });
    window.addEventListener("appinstalled", () => { pendingInstall = null; $("install-app").hidden = true; });
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
    setupPhotoPreview("message-photo", "message-photo-preview");
    setupPhotoPreview("post-photo", "post-photo-preview");
    $("chat-filter").oninput = filterChats;
    $("back-to-chats").onclick = () => {
      clearChat();
      for (const button of $("chat-list").querySelectorAll(".chat-item")) {
        button.classList.remove("active");
        button.hidden = false;
      }
      $("search-username").focus();
    };

    $("auth-form").onsubmit = (event) => {
      event.preventDefault();
      action($("signin-button"), async () => {
        const result = await db.auth.signInWithPassword({
          email: $("email").value.trim(),
          password: $("password").value
        });
        if (result.error) {
          const code = result.error.code;
          if (code === "invalid_credentials" ||
              result.error.message === "Invalid login credentials") {
            throw new Error(
              "Sign-in failed. Check your email and password. " +
              "If you forgot your password, click Forgot password? " +
              "If you have not registered yet, click Create account."
            );
          }
          if (code === "email_not_confirmed") {
            throw new Error(
              "Confirm your email using the link in your registration email, " +
              "then sign in. Check your spam folder too."
            );
          }
          throw result.error;
        }
        $("password").value = "";
      });
    };

    $("signup-button").onclick = () => {
      if (!$("auth-form").reportValidity()) return;
      action($("signup-button"), async () => {
        const data = check(await db.auth.signUp({
          email: $("email").value.trim(),
          password: $("password").value,
          options: {
            emailRedirectTo: new URL("./", window.location.href).href
          }
        }));
        $("password").value = "";
        if (!data.session) {
          notice("Check your email for a confirmation link, then sign in.");
        }
      });
    };
$("edit-profile-button").onclick = () => {
  if (!profile || !user) return;

  $("display-name").value = profile.display_name;
  $("username").value = profile.username;
  $("bio").value = profile.bio || "";
  $("avatar-file").value = "";

  $("profile-section").querySelector("h2").textContent = "Edit profile";
  $("cancel-profile-button").hidden = false;
  $("profile-section").hidden = false;
  $("messenger-section").hidden = true;
  $("feed-section").hidden = true;
  $("app-navigation").hidden = true;
  $("settings-section").hidden = true;
  $("notifications-section").hidden = true;
  $("display-name").focus();
};

$("cancel-profile-button").onclick = () => {
  if ($("save-profile-button").disabled) return;

  $("avatar-file").value = "";
  $("profile-section").hidden = true;
  showAppView("chats");
};
    $("profile-form").onsubmit = (event) => {
  event.preventDefault();

  action($("save-profile-button"), async () => {
    if (!user) throw new Error("Please sign in first.");

    const currentUserId = user.id;
    const version = sessionVersion;
    const existingProfile = profile;
    const name = $("display-name").value.trim();
    const username = $("username").value.trim().toLowerCase();
    const bio = $("bio").value.trim();
    const file = $("avatar-file").files[0];

    if (!name || name.length > 60 ||
        !/^[a-z0-9_]{3,24}$/.test(username)) {
      throw new Error("Enter a name and a valid username.");
    }

    if (bio.length > 160) {
      throw new Error("Your bio must be 160 characters or fewer.");
    }

    const extensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };

    if (file && (!extensions[file.type] ||
        file.size > 2 * 1024 * 1024)) {
      throw new Error("Choose a JPEG, PNG or WebP image up to 2 MB.");
    }

    let avatarPath = existingProfile?.avatar_path || null;
    let uploadedPath = null;

    try {
      if (file) {
        uploadedPath = `${currentUserId}/${crypto.randomUUID()}.${extensions[file.type]}`;

        check(await db.storage.from("avatars").upload(
          uploadedPath,
          file,
          { contentType: file.type, upsert: false }
        ));

        avatarPath = uploadedPath;
      }

      if (version !== sessionVersion || user?.id !== currentUserId) {
        throw new Error("Your session changed. Please try again.");
      }

      const fields = {
        display_name: name,
        username,
        bio,
        avatar_path: avatarPath
      };

      if (existingProfile) {
        check(await db.from("profiles")
          .update(fields)
          .eq("id", currentUserId)
          .select("id")
          .single());
      } else {
        check(await db.from("profiles").insert({
          id: currentUserId,
          ...fields
        }));
      }
    } catch (error) {
      if (uploadedPath) {
        await db.storage.from("avatars").remove([uploadedPath]);
      }
      throw error;
    }

    if (uploadedPath && existingProfile?.avatar_path) {
      await db.storage.from("avatars")
        .remove([existingProfile.avatar_path]);
    }

    if (version !== sessionVersion || user?.id !== currentUserId) return;

    $("avatar-file").value = "";
    const session = check(await db.auth.getSession()).session;
    user = null;
    await showSession(session);
    notice("Profile saved successfully.");
  });
};
    $("create-group-form").onsubmit = event => {
      event.preventDefault();
      action($("create-group-button"), async()=>{
        if (!user || !profile) throw new Error("Please sign in first.");
        const currentId=user.id, session=sessionVersion;
        const title=$("group-title").value.trim();
        const names=[...new Set($("group-usernames").value.split(/[\s,]+/).map(name=>name.toLowerCase().replace(/^@/,"")).filter(Boolean))];
        if (!title || title.length>60 || names.length<1 || names.length>19 || names.some(name=>!/^[a-z0-9_]{3,24}$/.test(name))) throw new Error("Enter a group name and 1–19 valid usernames.");
        const chatId=check(await db.rpc("create_group_chat",{group_title:title,member_usernames:names}));
        if(user?.id!==currentId || sessionVersion!==session) return;
        $("create-group-form").reset();
        showAppView("chats");
        await openChat(chatId,title,null,true);
        notice("Group created.");
      });
    };
    $("rename-group-button").onclick=()=>action($("rename-group-button"),async()=>{
      if(!user || !activeGroup) return;
      const chatId=activeChat,currentId=user.id,session=sessionVersion;
      const title=window.prompt("New group name (1–60 characters)",$("chat-title").textContent);
      if(title===null) return;
      const name=title.trim();if(!name || name.length>60) throw new Error("Use a name of 1–60 characters.");
      check(await db.rpc("rename_group_chat",{target_chat:chatId,new_title:name}));
      if(user?.id!==currentId || sessionVersion!==session || activeChat!==chatId) return;
      $("chat-title").textContent=name;await loadChats();notice("Group renamed.");
    });
    $("refresh-group-members").onclick=()=>action($("refresh-group-members"),loadGroupMembers);
    $("add-group-member-form").onsubmit=event=>{
      event.preventDefault();
      action($("add-group-member-button"),async()=>{
        if(!user || !activeGroup) return;
        const chatId=activeChat, currentId=user.id, session=sessionVersion;
        const name=$("new-group-member").value.trim().toLowerCase().replace(/^@/,"");
        if(!/^[a-z0-9_]{3,24}$/.test(name)) throw new Error("Enter a valid username.");
        check(await db.rpc("add_group_member",{target_chat:chatId,member_username:name}));
        if(user?.id!==currentId || sessionVersion!==session || activeChat!==chatId) return;
        $("add-group-member-form").reset();
        await loadGroupMembers();
        notice("Group member added.");
      });
    };
    $("leave-group-button").onclick=()=>action($("leave-group-button"),async()=>{
      if(!user || !activeGroup) return;
      if(!window.confirm("Leave this group? You will lose access. If you own it, ownership will transfer. If you are the last member, the group will be removed.")) return;
      const chatId=activeChat, currentId=user.id, session=sessionVersion;
      check(await db.rpc("leave_group_chat",{target_chat:chatId}));
      if(user?.id!==currentId || sessionVersion!==session) return;
      if(activeChat===chatId) clearChat();
      await loadChats();
      notice("You left the group.");
    });
    $("search-form").onsubmit = (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button");
      action(button, async () => {
        if (!profile) throw new Error("Create your profile first.");
        const currentId = user.id;
        const version = ++peopleSearchVersion;
        const session = sessionVersion;
        const current = () => user?.id === currentId && sessionVersion === session && version === peopleSearchVersion;
        const username = $("search-username").value.trim().toLowerCase().replace(/^@/, "");
        if (username.length<2 || username.length>60) throw new Error("Search with 2–60 characters.");
        const person = /^[a-z0-9_]{3,24}$/.test(username) ? check(await db.from("profiles")
          .select("id, username, display_name, bio, avatar_path")
          .eq("username", username)
          .neq("id", currentId)
          .maybeSingle()) : null;

        if (!current()) return;
        $("search-results").replaceChildren();
        if (!person) {
          const matches=await db.rpc("search_people",{search_text:username});
          if(!current()) return;
          if(matches.error) throw new Error("Name search is unavailable. Try an exact username, or ask the owner to activate people search.");
          const people=matches.data || [];
          $("search-results").append(element("p",people.length ? "Choose a profile · up to 12 matches" : "No matching people found.","people-search-status"));
          for(const match of people){
            const choice=element("button","","people-search-choice");choice.type="button";
            choice.append(element("strong",match.display_name),element("span","@"+match.username));
            choice.onclick=()=>{if(!current())return;$("search-username").value=match.username;$("search-form").requestSubmit();};
            $("search-results").append(choice);
          }
          return;
        }

        const start = element("button",
          `Chat with ${person.display_name}`);
        start.type = "button";
        start.onclick = () => action(start, async () => {
          if (user?.id !== currentId) return;

          const mine = check(await db.from("chat_members")
            .select("chat_id").eq("user_id", currentId));
          const theirs = check(await db.from("chat_members")
            .select("chat_id").eq("user_id", person.id));
          const common = mine.map((item) => item.chat_id)
            .filter((id) => theirs.some((item) => item.chat_id === id));

          const existing = common.length
            ? check(await db.from("chats").select("id")
                .in("id", common).eq("is_group", false).limit(1))
            : [];

          const chatId = existing[0]?.id ||
            check(await db.rpc("create_direct_chat", {
              other_user: person.id
            }));

          if (user?.id !== currentId) return;
          await openChat(chatId, `${person.display_name} · @${person.username}`, person.id);
        });
        const card = element("section", "", "people-card");
        addBlockControl(card,person,current).catch(error=>{if(current())notice(error.message,true);});
        card.append(element("h3", person.display_name), element("p", `@${person.username}`), element("p", person.bio || "No bio yet."));
        const preview = element("button", "View recent posts");
        preview.type = "button";
        const postsArea = element("div", "", "people-posts");
        preview.onclick = () => action(preview, async () => {
          if (!current() || !card.isConnected) return;
          const posts = check(await db.from("posts").select("id, caption, image_path, created_at")
            .eq("user_id", person.id).order("created_at", {ascending:false}).limit(6));
          if (!current() || !card.isConnected) return;
          postsArea.replaceChildren();
          if (!posts.length) postsArea.append(element("p", "No posts yet."));
          for (const post of posts) {
            const article = element("article", "", "people-post");
            article.append(element("p", post.caption || "Photo post"));
            postsArea.append(article);
            if (post.image_path) {
              const photo = await db.storage.from("post-photos").createSignedUrl(post.image_path, 3600);
              if (!current() || !card.isConnected) return;
              if (!photo.error && photo.data?.signedUrl) {
                const button = element("button", "", "people-photo-button");
                button.type = "button";
                button.setAttribute("aria-label", "Enlarge photo");
                const image = document.createElement("img");
                image.src = photo.data.signedUrl;
                image.alt = post.caption || "Profile post photo";
                image.loading = "lazy";
                button.append(image);
                button.onclick = () => { if (current()) openPhoto(image.src, image.alt); };
                article.prepend(button);
              } else article.append(element("p", "Photo unavailable."));
            }
          }
        });
        const follow = element("button", "Loading follow status…");
        follow.type = "button";
        follow.disabled = true;
        let following = false;
        follow.onclick = () => action(follow, async () => {
          if (!current() || !card.isConnected) return;
          const result = following
            ? await db.from("profile_follows").delete().eq("follower_id", currentId).eq("followed_id", person.id)
            : await db.from("profile_follows").insert({follower_id:currentId, followed_id:person.id});
          if (!current() || !card.isConnected) return;
          if (result.error && result.error.code !== "23505") throw result.error;
          const saved = check(await db.from("profile_follows").select("followed_id")
            .eq("follower_id", currentId).eq("followed_id", person.id).maybeSingle());
          if (!current() || !card.isConnected) return;
          following = !!saved;
          follow.textContent = following ? "Unfollow" : "Follow";
          follow.setAttribute("aria-pressed", String(following));
        });
        card.append(start, follow, preview, postsArea);
        $("search-results").append(card);
        const status = await db.from("profile_follows").select("followed_id")
          .eq("follower_id", currentId).eq("followed_id", person.id).maybeSingle();
        if (!current() || !card.isConnected) return;
        if (status.error) {
          follow.textContent = "Following setup pending";
        } else {
          following = !!status.data;
          follow.textContent = following ? "Unfollow" : "Follow";
          follow.setAttribute("aria-pressed", String(following));
          follow.disabled = false;
        }
        if (person.avatar_path) {
          const photo = await db.storage.from("avatars").createSignedUrl(person.avatar_path, 3600);
          if (!current() || !card.isConnected) return;
          if (!photo.error && photo.data?.signedUrl) {
            const avatar = document.createElement("img");
            avatar.src = photo.data.signedUrl;
            avatar.alt = `${person.display_name}'s profile photo`;
            avatar.width = 64; avatar.height = 64;
            avatar.className = "people-avatar";
            card.prepend(avatar);
          }
        }
      });
    };
$("view-profile-button").onclick = () => {
  action($("view-profile-button"), async () => {
    if (!user || !activeFriendId) return;

    const friendId = activeFriendId;
    const chatId = activeChat;
    const session = sessionVersion;
    const version = ++friendProfileVersion;

    const stillCurrent = () =>
      version === friendProfileVersion &&
      session === sessionVersion &&
      chatId === activeChat &&
      friendId === activeFriendId;

    $("friend-profile").hidden = true;
    $("friend-avatar").hidden = true;
    $("friend-avatar").removeAttribute("src");

    const result = await db.from("profiles")
      .select("id, display_name, username, bio, avatar_path")
      .eq("id", friendId)
      .maybeSingle();

    if (!stillCurrent()) return;
    const friend = check(result);
    if (!friend) throw new Error("Profile not found.");

    $("friend-name").textContent = friend.display_name;
    $("friend-username").textContent = `@${friend.username}`;
    $("friend-bio").textContent = friend.bio || "No bio yet.";
    $("friend-profile").hidden = false;
    $("friend-block-controls").replaceChildren();
    await addBlockControl($("friend-block-controls"),friend,stillCurrent);
    if(!stillCurrent())return;

    if (friend.avatar_path) {
      const photo = await db.storage.from("avatars")
        .createSignedUrl(friend.avatar_path, 3600);

      if (!stillCurrent()) return;
      if (!photo.error && photo.data?.signedUrl) {
        $("friend-avatar").src = photo.data.signedUrl;
        $("friend-avatar").hidden = false;
      }
    }
  });
};

$("close-profile-button").onclick = () => {
  friendProfileVersion++;
  $("friend-profile").hidden = true;
  $("friend-avatar").hidden = true;
  $("friend-avatar").removeAttribute("src");
  $("view-profile-button").focus();
};
    $("cancel-reply").onclick = () => {
      if ($("send-button").disabled) return;
      clearReply();
      $("message-input").focus();
    };
    $("message-form").onsubmit = (event) => {
      event.preventDefault();

      action($("send-button"), async () => {
        const chatId = activeChat;
        const senderId = user?.id;
        const directFriend=!activeGroup ? activeFriendId : null;
        const replyingTo = replyTarget?.chatId === chatId ? replyTarget.id : null;
        const session = sessionVersion;

        const sameSession = () =>
          user?.id === senderId && sessionVersion === session;

        const sameChat = () =>
          sameSession() && activeChat === chatId;

        const input = $("message-input");
        const picker = $("message-photo");
        const body = input.value.trim();
        const file = picker.files[0];

        if (!chatId || !senderId) {
          throw new Error("Open a chat first.");
        }

        if (!body && !file) {
          throw new Error("Type a message or choose a photo.");
        }

        if (body.length > 4000) {
          throw new Error("Use up to 4,000 characters.");
        }

        const extensions = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp"
        };

        if (file && (
          !extensions[file.type] ||
          file.size === 0 ||
          file.size > 2 * 1024 * 1024
        )) {
          throw new Error(
            "Choose a JPEG, PNG or WebP photo up to 2 MB."
          );
        }

        if(directFriend){
          const permission=await db.rpc("can_direct_message",{other_user:directFriend});
          if(!sameChat()) return;
          if(!permission.error && !permission.data) throw new Error("Direct messaging is unavailable between these members.");
          if(permission.error && permission.error.code!=="PGRST202") throw permission.error;
        }
        input.disabled = true;
        picker.disabled = true;

        try {
          let path = null;

          if (file) {
            path = `${senderId}/${chatId}/` +
              `${crypto.randomUUID()}.${extensions[file.type]}`;

            check(await db.storage.from("chat-photos")
              .upload(path, file, {
                contentType: file.type,
                upsert: false
              }));

            if (!sameSession()) {
              await db.storage.from("chat-photos").remove([path]);
              return;
            }
          }

          const payload = {chat_id:chatId, sender_id:senderId, body, image_path:path};
          if (replyingTo != null) payload.reply_to = replyingTo;
          const result = await db.from("messages").insert(payload);

          if (!sameSession()) return;

          if (result.error) {
            if (!path) throw result.error;

            const verified = await db.from("messages")
              .select("id")
              .eq("image_path", path)
              .eq("sender_id", senderId)
              .eq("chat_id", chatId)
              .maybeSingle();

            if (!sameSession()) return;

            if (verified.error) {
              throw new Error(
                "Could not confirm sending. Reopen the chat " +
                "and check before sending again."
              );
            }

            if (!verified.data) {
              await db.storage.from("chat-photos").remove([path]);
              throw result.error;
            }
          }

          if(messageDrafts.get(chatId)?.trim()===body)messageDrafts.delete(chatId);
          if (sameChat()) {
            clearReply();
            messageDrafts.delete(chatId);
            $("message-form").reset();
            notice("Message sent.");
            await loadMessages(chatId);

            if (sameChat()) {
              $("messages").scrollTop =
                $("messages").scrollHeight;
            }
          }
        } finally {
          input.disabled = false;
          picker.disabled = false;
        }
      });
    };
    
    $("show-chats-button").onclick = () => {
      showAppView("chats");
      if (activeChat) loadMessages(activeChat).catch(error=>notice(error.message,true));
      else loadChats().catch(error=>notice(error.message,true));
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && activeChat && !$("messenger-section").hidden) {
        loadMessages(activeChat).catch(error=>notice(error.message,true));
      }
    });

    $("show-feed-button").onclick = () => {
      action($("refresh-stories"),loadStories);
      action($("show-feed-button"), async () => {
        showAppView("feed");
        await loadFeed();
      });
    };

    $("feed-filter").onchange = () => {
      feedFilter = ["mine", "following", "saved"].includes($("feed-filter").value) ? $("feed-filter").value : "all";
      feedPage = 0;
      // Invalidate an in-flight page before loading the selected view.
      feedVersion++;
      $("posts-list").replaceChildren();
      action($("refresh-feed-button"), loadFeed);
    };

    $("refresh-feed-button").onclick = () => {
      feedPage = 0;
      action($("refresh-feed-button"), loadFeed);
    };

    $("post-form").onsubmit = (event) => {
      event.preventDefault();

      action($("publish-post-button"), async () => {
        if (!user || !profile) {
          throw new Error("Sign in and create your profile first.");
        }

        const currentId = user.id;
        const session = sessionVersion;
        const stillCurrent = () =>
          session === sessionVersion && user?.id === currentId;

        const file = $("post-photo").files[0];
        const caption = $("post-caption").value.trim();
        const extensions = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp"
        };

        if (!file || !extensions[file.type] ||
            file.size === 0 || file.size > 2 * 1024 * 1024) {
          throw new Error("Choose a JPEG, PNG or WebP photo up to 2 MB.");
        }

        if (caption.length > 2000) {
          throw new Error("Keep your caption within 2,000 characters.");
        }

        const id = crypto.randomUUID();
        const path = `${currentId}/${id}.${extensions[file.type]}`;

        notice("Uploading your photo…");

        check(await db.storage.from("post-photos").upload(
          path, file, { contentType: file.type, upsert: false }
        ));

        if (!stillCurrent()) return;

        const inserted = await db.from("posts").insert({
          id,
          user_id: currentId,
          caption,
          image_path: path
        });

        if (!stillCurrent()) return;

        if (inserted.error) {
          const verification = await db.from("posts")
            .select("id")
            .eq("id", id)
            .maybeSingle();

          if (!stillCurrent()) return;

          if (verification.error) {
            throw new Error(
              "Could not confirm publication. Refresh the feed before retrying."
            );
          }

          if (!verification.data) {
            await db.storage.from("post-photos").remove([path]);
            throw inserted.error;
          }
        }

        $("post-form").reset();
        feedPage = 0;
        notice("Photo published successfully.");
        showAppView("feed");
        await loadFeed();
      });
    };
    $("refresh-chats").onclick = () =>
      action($("refresh-chats"), loadChats);

    $("logout-button").onclick = () =>
      action($("logout-button"), async () => {
        check(await db.auth.signOut());
        await showSession(null);
      });

    const session = check(await db.auth.getSession()).session;
    await showSession(session);
  } catch (error) {
    notice(
      error.message || "Could not load the app. Check your connection and reload.",
      true
    );
  }
})();

