const pages=[...document.querySelectorAll('.page')],navs=[...document.querySelectorAll('.nav')],title=document.getElementById('pageTitle');
const titles={dashboard:'How can we help?',reports:'Game Reports',appeals:'Appeals',tickets:'Other Tickets',forms:'Forms',moderation:'Moderation Dashboard'};
const statuses=['Pending','Reviewing','Reviewed','Accepted','Rejected','Closed'];
function getRequests(){try{return JSON.parse(localStorage.getItem('sp_support_requests')||'[]')}catch{return[]}}
function saveRequests(v){localStorage.setItem('sp_support_requests',JSON.stringify(v))}
function showPage(id){pages.forEach(p=>p.classList.toggle('active',p.id===id));navs.forEach(n=>n.classList.toggle('active',n.dataset.page===id));title.textContent=titles[id]||'SP Support';document.querySelector('.main').scrollTo({top:0,behavior:'smooth'});if(id==='moderation')renderModeration()}
document.addEventListener('click',e=>{const el=e.target.closest('[data-page]');if(el)showPage(el.dataset.page)});
document.getElementById('collapse').onclick=()=>{document.getElementById('sidebar').classList.toggle('collapsed');document.querySelector('.main').classList.toggle('shift')};
function toast(message,bold='Submitted!'){const t=document.getElementById('toast');t.querySelector('b').textContent=bold;t.querySelector('span').textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4000)}
function submitRequest(e,type){e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());const item={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),type,username:data.username,reason:data.reason||'',description:data.description||'',evidence:data.evidence||'',status:'Pending',note:'',createdAt:new Date().toLocaleString()};const all=getRequests();all.unshift(item);saveRequests(all);e.target.reset();toast(type+' received and marked Pending.','Submitted!')}
function esc(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function renderModeration(){const all=getRequests();const filter=document.getElementById('modFilter').value;const list=filter==='All'?all:all.filter(x=>x.status===filter);document.getElementById('statPending').textContent=all.filter(x=>x.status==='Pending').length;document.getElementById('statReviewing').textContent=all.filter(x=>x.status==='Reviewing').length;document.getElementById('statAccepted').textContent=all.filter(x=>x.status==='Accepted').length;document.getElementById('statRejected').textContent=all.filter(x=>x.status==='Rejected').length;const box=document.getElementById('modList');if(!list.length){box.innerHTML='<div class="empty-mod"><div>◆</div><h3>No requests here</h3><p>New public submissions will appear in this dashboard.</p></div>';return}box.innerHTML=list.map(x=>`<article class="mod-item"><div class="mod-item-head"><div><span class="type-badge">${esc(x.type)}</span><h3>${esc(x.username)}</h3><small>${esc(x.createdAt)} · ID ${esc(x.id)}</small></div><span class="status-dot-badge ${x.status.toLowerCase()}">${esc(x.status)}</span></div><div class="request-body"><div><b>${esc(x.reason||'Request')}</b><p>${esc(x.description)}</p>${x.evidence?`<a href="${esc(x.evidence)}" target="_blank" rel="noopener">Evidence link ↗</a>`:''}</div><div class="mod-controls"><label>Status<select onchange="changeStatus('${x.id}',this.value)">${statuses.map(s=>`<option ${s===x.status?'selected':''}>${s}</option>`).join('')}</select></label><label>Moderator note<textarea id="note-${x.id}" placeholder="Internal note...">${esc(x.note)}</textarea></label><button class="save-note" onclick="saveNote('${x.id}')">Save note</button></div></div></article>`).join('')}
function changeStatus(id,status){const all=getRequests();const x=all.find(r=>r.id===id);if(!x)return;x.status=status;saveRequests(all);renderModeration();toast('Status updated to '+status+'.','Updated!')}
function saveNote(id){const el=document.getElementById('note-'+id);const all=getRequests();const x=all.find(r=>r.id===id);if(!x||!el)return;x.note=el.value;saveRequests(all);toast('Moderator note saved.','Saved!')}
document.getElementById('modFilter').addEventListener('change',renderModeration);
window.addEventListener('load',()=>setTimeout(()=>{document.getElementById('loader').classList.add('done');document.body.style.overflow='auto'},2550));
// Staff authentication: Google Identity Services + allowlist.
// Put your Google OAuth 2.0 Web Client ID here.
const GOOGLE_CLIENT_ID = '148690866861-krt7sfvat6dj5aahbse3c0jcsnshbljn.apps.googleusercontent.com';
const ALLOWED_STAFF = new Set(['contactkyrixpixel@gmail.com']);
const authGate = document.getElementById('authGate');
const googleSignIn = document.getElementById('googleSignIn');
const modNav = document.getElementById('modNav');
const signOutBtn = document.getElementById('signOut');
const avatar = document.getElementById('avatar');
const authError = document.getElementById('authError');
let staffEmail = '';
let googleReady = false;

function decodeJwt(token){
  try{
    const part=token.split('.')[1];
    const normalized=part.replace(/-/g,'+').replace(/_/g,'/');
    const padded=normalized+'='.repeat((4-normalized.length%4)%4);
    return JSON.parse(atob(padded));
  }catch{return null}
}

function setStaffUI(email,name='Staff'){
  staffEmail=email;
  authGate.style.display='none';
  modNav.hidden=false;
  signOutBtn.hidden=false;
  avatar.textContent=(name||email).trim().slice(0,2).toUpperCase();
}

function finishStaffLogin(response){
  authError.textContent='';
  if(!response?.credential){
    authError.textContent='Google did not return a sign-in credential. Please try again.';
    return;
  }

  const data=decodeJwt(response.credential);
  const email=(data?.email||'').toLowerCase().trim();

  if(!data || !data.email_verified){
    authError.textContent='Your Google email could not be verified.';
    return;
  }

  if(!ALLOWED_STAFF.has(email)){
    authError.textContent='This Google account is not authorized for the SP staff dashboard.';
    google.accounts.id.disableAutoSelect();
    return;
  }

  // Session-only: do not persist a trusted staff session in localStorage.
  sessionStorage.setItem('sp_staff_email',email);
  sessionStorage.setItem('sp_staff_name',data.name||email);
  setStaffUI(email,data.name||email);
  toast('Signed in as '+email+'.','Welcome!');
}

function showGoogleError(message){
  authError.textContent=message;
  googleReady=false;
}

function initGoogle(){
  if(googleReady) return;
  if(typeof google==='undefined' || !google.accounts?.id){
    setTimeout(initGoogle,200);
    return;
  }

  if(!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('YOUR_')){
    showGoogleError('Add your Google OAuth Web Client ID to script.js first.');
    return;
  }

  try{
    google.accounts.id.initialize({
      client_id:GOOGLE_CLIENT_ID,
      callback:finishStaffLogin,
      auto_select:false,
      cancel_on_tap_outside:true,
      context:'signin',
      use_fedcm_for_button:true
    });

    googleReady=true;
    googleSignIn.disabled=false;
    googleSignIn.onclick=()=>{
      authError.textContent='';
      google.accounts.id.prompt((notification)=>{
        if(notification.isNotDisplayed() || notification.isSkippedMoment()){
          authError.textContent='Google sign-in could not open. Make sure your website URL is added to Authorized JavaScript origins in Google Cloud.';
        }
      });
    };
  }catch(err){
    console.error(err);
    showGoogleError('Google sign-in failed to initialize. Check your OAuth client ID and website origin.');
  }
}

signOutBtn.onclick=()=>{
  staffEmail='';
  sessionStorage.removeItem('sp_staff_email');
  sessionStorage.removeItem('sp_staff_name');
  modNav.hidden=true;
  signOutBtn.hidden=true;
  authGate.style.display='flex';
  authError.textContent='';
  showPage('dashboard');
  if(typeof google!=='undefined' && google.accounts?.id){
    google.accounts.id.disableAutoSelect();
  }
};

window.addEventListener('load',()=>{
  const saved=sessionStorage.getItem('sp_staff_email');
  const savedName=sessionStorage.getItem('sp_staff_name')||'Staff';
  if(saved && ALLOWED_STAFF.has(saved)) setStaffUI(saved,savedName);
  initGoogle();
});
