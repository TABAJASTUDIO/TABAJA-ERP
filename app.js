const app = document.getElementById('app');
const restoreInput = document.getElementById('restoreInput');

const state = {
  user: sessionStorage.getItem('tabaja_user') || null,
  currentCompanyId: sessionStorage.getItem('tabaja_company') || null,
  view: 'companies',
  message: ''
};

function getCompanies(){
  return JSON.parse(localStorage.getItem('tabaja_companies') || '[]');
}
function saveCompanies(items){localStorage.setItem('tabaja_companies', JSON.stringify(items));}
function uid(){return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);}
function currentCompany(){return getCompanies().find(c=>c.id===state.currentCompanyId) || null;}
function esc(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}

function render(){
  if(!state.user) return renderLogin();
  if(!state.currentCompanyId || !currentCompany()) return renderCompanyHub();
  return renderShell();
}

function renderLogin(){
  app.innerHTML = `
  <div class="center-page">
    <div class="login-card">
      <div class="brand"><div class="brand-logo">T</div><h1>Tabaja <span>ERP</span></h1><p>Personal Business & Accounting System</p></div>
      <div id="loginMsg"></div>
      <form id="loginForm">
        <div class="field"><label>User Name</label><input name="username" autocomplete="username" required placeholder="Enter user name"></div>
        <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required placeholder="Enter password"></div>
        <button class="btn btn-primary btn-block" type="submit">Sign In</button>
      </form>
      <div class="hint">First login: <b>admin</b> / <b>1234</b></div>
    </div>
  </div>`;
  document.getElementById('loginForm').onsubmit=e=>{
    e.preventDefault(); const f=new FormData(e.target);
    const u=f.get('username').trim(), p=f.get('password');
    const saved=JSON.parse(localStorage.getItem('tabaja_admin')||'null');
    const valid=saved ? (u===saved.username&&p===saved.password) : (u==='admin'&&p==='1234');
    if(!valid){document.getElementById('loginMsg').innerHTML='<div class="error">Incorrect user name or password.</div>';return;}
    state.user=u; sessionStorage.setItem('tabaja_user',u); render();
  }
}

function renderCompanyHub(){
  const companies=getCompanies();
  app.innerHTML=`<div class="shell">
    ${sidebar('companies')}
    <main class="main">
      <div class="topbar"><h2>Company Selection</h2><div class="company-pill">User: ${esc(state.user)}</div></div>
      <div class="content">
        ${state.message?`<div class="success">${esc(state.message)}</div>`:''}
        <div class="toolbar">
          <button class="btn btn-primary" id="createBtn">+ Create Company</button>
          <button class="btn btn-outline" id="backupBtn">Backup Data</button>
          <button class="btn btn-outline" id="restoreBtn">Restore Data</button>
          <button class="btn btn-outline" id="logoutBtn">Logout</button>
        </div>
        ${companies.length?`<div class="company-grid">${companies.map(companyCard).join('')}</div>`:
        `<div class="panel"><h3>No company created yet</h3><p>Create your first company to start using Tabaja ERP.</p><button class="btn btn-primary" id="emptyCreate">Create First Company</button></div>`}
      </div>
    </main></div>`;
  state.message='';
  document.getElementById('createBtn').onclick=()=>{state.view='create';renderCreateCompany();};
  document.getElementById('emptyCreate')?.addEventListener('click',()=>{state.view='create';renderCreateCompany();});
  document.getElementById('logoutBtn').onclick=logout;
  document.getElementById('backupBtn').onclick=backupData;
  document.getElementById('restoreBtn').onclick=()=>restoreInput.click();
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCompany(b.dataset.open));
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteCompany(b.dataset.delete));
}

function companyCard(c){return `<div class="company-card">
  <h3>${esc(c.name)}</h3><p>${esc(c.country||'No country')}</p><p>Financial Year: ${esc(c.financialYear)}</p><p>Currency: ${esc(c.currencySymbol)} ${esc(c.currencyName)}</p>
  <div class="card-actions"><button class="btn btn-primary" data-open="${c.id}">Open</button><button class="btn btn-danger" data-delete="${c.id}">Delete</button></div>
</div>`}

function renderCreateCompany(){
  app.innerHTML=`<div class="shell">${sidebar('companies')}<main class="main">
  <div class="topbar"><h2>Create New Company</h2><div class="company-pill">Tabaja ERP</div></div>
  <div class="content"><form id="companyForm" class="panel">
    <div class="form-grid">
      <div><div class="section-title">Basic Information</div>
        ${field('Company Name','name',true)}
        ${field('Mailing Name','mailingName')}
        ${area('Address','address')}
        ${field('Country','country',true,'Sierra Leone')}
        <div class="two-col">${field('Telephone','telephone')}${field('Mobile','mobile')}</div>
        <div class="two-col">${field('E-mail','email','','','email')}${field('Website','website')}</div>
      </div>
      <div><div class="section-title">Financial Year</div>
        ${field('Financial year beginning from','financialYear',true,'2026-04-01','date')}
        ${field('Books beginning from','booksBeginning',true,'2026-04-01','date')}
        <div class="section-title" style="margin-top:22px">Base Currency</div>
        <div class="two-col">${field('Currency Symbol','currencySymbol',true,'NLe')}${field('Formal Name','currencyName',true,'Sierra Leonean Leone')}</div>
        ${field('Decimal Places','decimalPlaces',true,'2','number')}
        <div class="section-title" style="margin-top:22px">Features</div>
        ${selectField('Maintain Inventory','inventory',['Yes','No'],'Yes')}
        ${selectField('Enable Cost Centres','costCentres',['Yes','No'],'Yes')}
      </div>
    </div>
    <div class="note">More settings can be added after the company is created.</div>
    <div class="form-actions"><button type="button" id="cancelCreate" class="btn btn-outline">Cancel</button><button class="btn btn-primary">Create Company</button></div>
  </form></div></main></div>`;
  document.getElementById('cancelCreate').onclick=renderCompanyHub;
  document.getElementById('companyForm').onsubmit=e=>{
    e.preventDefault(); const o=Object.fromEntries(new FormData(e.target).entries());
    const items=getCompanies(); items.push({id:uid(),createdAt:new Date().toISOString(),...o}); saveCompanies(items);
    state.message=`Company “${o.name}” created successfully.`; renderCompanyHub();
  };
}

function field(label,name,required=false,value='',type='text'){return `<div class="field"><label>${label}${required?' *':''}</label><input type="${type}" name="${name}" value="${esc(value)}" ${required?'required':''}></div>`}
function area(label,name){return `<div class="field"><label>${label}</label><textarea name="${name}" rows="3"></textarea></div>`}
function selectField(label,name,opts,value){return `<div class="field"><label>${label}</label><select name="${name}">${opts.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select></div>`}

function renderShell(){
  const c=currentCompany();
  app.innerHTML=`<div class="shell">${sidebar('gateway')}<main class="main">
  <div class="topbar"><h2>Gateway of Tabaja ERP</h2><div class="company-pill">${esc(c.name)}</div></div>
  <div class="content">
    <div class="gateway">
      <div class="panel"><h3>${esc(c.name)}</h3><div class="gateway-menu">
        <div class="menu-box"><h4>Masters</h4><button data-coming>Groups</button><button data-coming>Ledgers</button><button data-coming>Cost Centres</button></div>
        <div class="menu-box"><h4>Inventory Masters</h4><button data-coming>Stock Groups</button><button data-coming>Stock Items</button><button data-coming>Units</button></div>
        <div class="menu-box"><h4>Transactions</h4><button data-coming>Payment</button><button data-coming>Receipt</button><button data-coming>Contra</button><button data-coming>Journal</button><button data-coming>Sales</button><button data-coming>Purchase</button></div>
        <div class="menu-box"><h4>Reports</h4><button data-coming>Day Book</button><button data-coming>Trial Balance</button><button data-coming>Profit & Loss</button><button data-coming>Balance Sheet</button><button data-coming>Stock Summary</button></div>
      </div></div>
      <div><div class="panel"><h3>Company Summary</h3><div class="summary-row">
        <div class="summary-card"><small>Financial Year</small><strong>${esc(c.financialYear)}</strong></div>
        <div class="summary-card"><small>Base Currency</small><strong>${esc(c.currencySymbol)}</strong></div>
        <div class="summary-card"><small>Inventory</small><strong>${esc(c.inventory)}</strong></div>
        <div class="summary-card"><small>Cost Centres</small><strong>${esc(c.costCentres)}</strong></div>
      </div></div><br><div class="panel"><h3>V1 Status</h3><p>Login, company creation, company opening and data backup are active.</p><div id="comingMsg"></div></div></div>
    </div>
  </div></main></div>`;
  document.querySelectorAll('[data-coming]').forEach(b=>b.onclick=()=>document.getElementById('comingMsg').innerHTML=`<div class="note"><b>${esc(b.textContent)}</b> will be built in the next stage.</div>`);
}

function sidebar(active){return `<aside class="sidebar"><div class="side-brand"><div class="mini-logo">T</div>Tabaja ERP</div><nav class="side-nav">
<button class="${active==='gateway'?'active':''}" id="gatewayNav">Gateway</button>
<button class="${active==='companies'?'active':''}" id="companiesNav">Companies</button>
<button id="backupNav">Backup</button><button id="logoutNav">Logout</button></nav><div class="side-footer">Tabaja ERP V1.0<br>Personal Edition</div></aside>`}

function bindSidebar(){
  setTimeout(()=>{
    document.getElementById('gatewayNav')?.addEventListener('click',()=>{if(currentCompany()) renderShell();});
    document.getElementById('companiesNav')?.addEventListener('click',()=>{state.currentCompanyId=null;sessionStorage.removeItem('tabaja_company');renderCompanyHub();});
    document.getElementById('backupNav')?.addEventListener('click',backupData);
    document.getElementById('logoutNav')?.addEventListener('click',logout);
  },0)
}
const oldRender=render; render=function(){oldRender();bindSidebar();}

function openCompany(id){state.currentCompanyId=id;sessionStorage.setItem('tabaja_company',id);render();}
function deleteCompany(id){if(!confirm('Delete this company? This cannot be undone.')) return; saveCompanies(getCompanies().filter(x=>x.id!==id));renderCompanyHub();}
function logout(){sessionStorage.clear();state.user=null;state.currentCompanyId=null;render();}
function backupData(){
  const data={app:'Tabaja ERP',version:'1.0',exportedAt:new Date().toISOString(),companies:getCompanies(),admin:JSON.parse(localStorage.getItem('tabaja_admin')||'null')};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tabaja-erp-backup.json';a.click();URL.revokeObjectURL(a.href);
}
restoreInput.addEventListener('change',async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{const data=JSON.parse(await file.text()); if(!Array.isArray(data.companies)) throw new Error(); saveCompanies(data.companies); if(data.admin)localStorage.setItem('tabaja_admin',JSON.stringify(data.admin)); state.message='Backup restored successfully.'; state.currentCompanyId=null;sessionStorage.removeItem('tabaja_company');renderCompanyHub();}
  catch{alert('Invalid backup file.');} e.target.value='';
});

render();
