const app = document.getElementById('app');
const restoreInput = document.getElementById('restoreInput');

const state = {
  user: sessionStorage.getItem('tabaja_user') || null,
  currentCompanyId: sessionStorage.getItem('tabaja_company') || null,
  message: ''
};

const storage = {
  companies(){ return JSON.parse(localStorage.getItem('tabaja_companies') || '[]'); },
  saveCompanies(items){ localStorage.setItem('tabaja_companies', JSON.stringify(items)); },
  companyData(id){ return JSON.parse(localStorage.getItem(`tabaja_company_${id}`) || '{}'); },
  saveCompanyData(id, data){ localStorage.setItem(`tabaja_company_${id}`, JSON.stringify(data)); }
};

function uid(prefix='id'){ return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`; }
function esc(s=''){ return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])); }
function currentCompany(){ return storage.companies().find(c=>c.id===state.currentCompanyId) || null; }
function formatDate(v){ if(!v) return '—'; const d=new Date(v+'T00:00:00'); return d.toLocaleDateString('en-GB'); }

function render(){
  if(!state.user) return renderLogin();
  if(!state.currentCompanyId || !currentCompany()) return renderCompanyHub();
  return renderGateway();
}

function renderLogin(){
  app.innerHTML = `
  <div class="login-page">
    <div class="login-glow glow-one"></div><div class="login-glow glow-two"></div>
    <div class="login-card">
      <div class="brand-logo">T</div>
      <h1>Tabaja <span>ERP</span></h1>
      <p class="subtitle">Personal Business & Accounting System</p>
      <div id="loginMsg"></div>
      <form id="loginForm">
        ${field('User Name','username',true,'admin')}
        ${field('Password','password',true,'1234','password')}
        <button class="btn btn-primary btn-block" type="submit">Sign In</button>
      </form>
      <div class="hint">First login: <b>admin</b> / <b>1234</b></div>
    </div>
  </div>`;
  document.getElementById('loginForm').onsubmit=e=>{
    e.preventDefault();
    const f=new FormData(e.target), u=f.get('username').trim(), p=f.get('password');
    const saved=JSON.parse(localStorage.getItem('tabaja_admin')||'null');
    const valid=saved ? (u===saved.username && p===saved.password) : (u==='admin' && p==='1234');
    if(!valid){ document.getElementById('loginMsg').innerHTML='<div class="error">Incorrect user name or password.</div>'; return; }
    state.user=u; sessionStorage.setItem('tabaja_user',u); render();
  };
}

function renderCompanyHub(){
  const companies=storage.companies();
  app.innerHTML=`<div class="company-page">
    <header class="app-header"><div class="header-brand"><span class="mini-logo">T</span><b>Tabaja ERP</b></div><div>User: <b>${esc(state.user)}</b></div></header>
    <main class="company-wrap">
      <div class="page-title-row"><div><h2>Company Selection</h2><p>Create a company or open an existing one.</p></div><button class="btn btn-outline" id="logoutBtn">Logout</button></div>
      ${state.message?`<div class="success">${esc(state.message)}</div>`:''}
      <div class="toolbar">
        <button class="btn btn-primary" id="createBtn">+ Create Company</button>
        <button class="btn btn-outline" id="backupBtn">Backup Data</button>
        <button class="btn btn-outline" id="restoreBtn">Restore Data</button>
      </div>
      ${companies.length?`<div class="company-grid">${companies.map(companyCard).join('')}</div>`:
      `<div class="empty-panel"><div class="empty-icon">🏢</div><h3>No company created yet</h3><p>Create your first company to start using Tabaja ERP.</p><button class="btn btn-primary" id="emptyCreate">Create First Company</button></div>`}
    </main>
  </div>`;
  state.message='';
  document.getElementById('createBtn').onclick=renderCreateCompany;
  document.getElementById('emptyCreate')?.addEventListener('click',renderCreateCompany);
  document.getElementById('logoutBtn').onclick=logout;
  document.getElementById('backupBtn').onclick=backupData;
  document.getElementById('restoreBtn').onclick=()=>restoreInput.click();
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCompany(b.dataset.open));
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>renderCreateCompany(b.dataset.edit));
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteCompany(b.dataset.delete));
}

function companyCard(c){
  return `<article class="company-card">
    <div class="company-card-head"><div class="company-avatar">${esc(c.name.slice(0,1).toUpperCase())}</div><div><h3>${esc(c.name)}</h3><span>${esc(c.country||'No country')}</span></div></div>
    <div class="company-details"><div><small>Financial Year</small><b>${formatDate(c.financialYear)}</b></div><div><small>Currency</small><b>${esc(c.currencySymbol)} · ${esc(c.currencyName)}</b></div></div>
    <div class="card-actions"><button class="btn btn-primary" data-open="${c.id}">Open Company</button><button class="btn btn-outline" data-edit="${c.id}">Edit</button><button class="icon-btn danger" title="Delete" data-delete="${c.id}">×</button></div>
  </article>`;
}

function renderCreateCompany(editId=null){
  const editing=editId?storage.companies().find(c=>c.id===editId):null;
  const v=(name,def='')=>editing?.[name] ?? def;
  app.innerHTML=`<div class="setup-page">
    <header class="app-header"><div class="header-brand"><span class="mini-logo">T</span><b>Tabaja ERP</b></div><button class="btn btn-outline" id="cancelTop">Back</button></header>
    <main class="setup-wrap">
      <div class="page-title-row"><div><h2>${editing?'Edit Company':'Create New Company'}</h2><p>Enter the basic information and accounting settings.</p></div><div class="step-pill">Company Setup</div></div>
      <form id="companyForm" class="setup-card">
        <section>
          <h3>Company Information</h3>
          <div class="form-grid three">
            ${field('Company Name','name',true,v('name'))}
            ${field('Mailing Name','mailingName',false,v('mailingName'))}
            ${field('Company Code','companyCode',false,v('companyCode','AUTO'))}
          </div>
          ${area('Address','address',v('address'))}
          <div class="form-grid three">
            ${field('Country','country',true,v('country','Sierra Leone'))}
            ${field('State / Province','state',false,v('state','Western Area'))}
            ${field('Pincode','pincode',false,v('pincode'))}
          </div>
          <div class="form-grid four">
            ${field('Telephone','telephone',false,v('telephone'))}
            ${field('Mobile','mobile',false,v('mobile'))}
            ${field('E-mail','email',false,v('email'),'email')}
            ${field('Website','website',false,v('website'))}
          </div>
        </section>
        <section>
          <h3>Books & Financial Year</h3>
          <div class="form-grid four">
            ${field('Financial year beginning from','financialYear',true,v('financialYear','2026-04-01'),'date')}
            ${field('Books beginning from','booksBeginning',true,v('booksBeginning','2026-04-01'),'date')}
            ${selectField('Maintain Accounts','maintainAccounts',['Yes','No'],v('maintainAccounts','Yes'))}
            ${selectField('Maintain Inventory','inventory',['Yes','No'],v('inventory','Yes'))}
          </div>
        </section>
        <section>
          <h3>Base Currency</h3>
          <div class="form-grid four">
            ${field('Currency Symbol','currencySymbol',true,v('currencySymbol','NLe'))}
            ${field('Formal Name','currencyName',true,v('currencyName','Sierra Leonean Leone'))}
            ${field('Decimal Places','decimalPlaces',true,v('decimalPlaces','2'),'number')}
            ${selectField('Symbol Position','symbolPosition',['Before amount','After amount'],v('symbolPosition','Before amount'))}
          </div>
        </section>
        <section>
          <h3>Features & Security</h3>
          <div class="form-grid four">
            ${selectField('Enable Cost Centres','costCentres',['Yes','No'],v('costCentres','Yes'))}
            ${selectField('Enable Multi-Currency','multiCurrency',['Yes','No'],v('multiCurrency','Yes'))}
            ${selectField('Enable Bill-by-Bill','billByBill',['Yes','No'],v('billByBill','Yes'))}
            ${selectField('Control User Access','security',['No','Yes'],v('security','No'))}
          </div>
        </section>
        <div class="form-actions"><button type="button" class="btn btn-outline" id="cancelCreate">Cancel</button><button class="btn btn-primary">${editing?'Save Changes':'Create Company'}</button></div>
      </form>
    </main>
  </div>`;
  const cancel=()=>renderCompanyHub();
  document.getElementById('cancelTop').onclick=cancel;
  document.getElementById('cancelCreate').onclick=cancel;
  document.getElementById('companyForm').onsubmit=e=>{
    e.preventDefault(); const o=Object.fromEntries(new FormData(e.target).entries());
    const items=storage.companies();
    if(editing){ const i=items.findIndex(x=>x.id===editing.id); items[i]={...editing,...o,updatedAt:new Date().toISOString()}; }
    else { const id=uid('company'); items.push({id,createdAt:new Date().toISOString(),...o}); storage.saveCompanyData(id,seedCompanyData()); }
    storage.saveCompanies(items);
    state.message=`Company “${o.name}” ${editing?'updated':'created'} successfully.`; renderCompanyHub();
  };
}

function seedCompanyData(){
  return {
    groups:[
      {id:'g_capital',name:'Capital Account',nature:'Liabilities'},
      {id:'g_assets',name:'Current Assets',nature:'Assets'},
      {id:'g_liabilities',name:'Current Liabilities',nature:'Liabilities'},
      {id:'g_sales',name:'Sales Accounts',nature:'Income'},
      {id:'g_purchase',name:'Purchase Accounts',nature:'Expense'},
      {id:'g_direct_exp',name:'Direct Expenses',nature:'Expense'},
      {id:'g_indirect_exp',name:'Indirect Expenses',nature:'Expense'},
      {id:'g_cash',name:'Cash-in-Hand',nature:'Assets'},
      {id:'g_bank',name:'Bank Accounts',nature:'Assets'},
      {id:'g_debtors',name:'Sundry Debtors',nature:'Assets'},
      {id:'g_creditors',name:'Sundry Creditors',nature:'Liabilities'}
    ], ledgers:[], units:[], stockGroups:[], stockItems:[], costCentres:[], vouchers:[]
  };
}

function renderGateway(){
  const c=currentCompany(), data=storage.companyData(c.id), counts={
    ledgers:(data.ledgers||[]).length, items:(data.stockItems||[]).length, vouchers:(data.vouchers||[]).length, centres:(data.costCentres||[]).length
  };
  app.innerHTML=`<div class="tally-page">
    <header class="tally-topbar"><div class="tally-brand"><span class="mini-logo">T</span><b>Tabaja ERP</b><small>Personal Edition</small></div><div class="top-actions"><button id="switchCompany">K: Company</button><button id="backupBtn">Y: Backup</button><button id="logoutBtn">Logout</button></div></header>
    <div class="company-strip"><div><b>${esc(c.name)}</b><span>${esc(c.address||c.country||'')}</span></div><div><small>Current Period</small><b>${formatDate(c.booksBeginning)} to ${formatDate(c.financialYear?.slice(0,4)+'-12-31')}</b></div><div><small>Current Date</small><b>${new Date().toLocaleDateString('en-GB')}</b></div></div>
    <main class="gateway-layout">
      <section class="gateway-info">
        <h2>Gateway of Tabaja ERP</h2>
        <div class="quick-stats"><div><small>Ledgers</small><b>${counts.ledgers}</b></div><div><small>Stock Items</small><b>${counts.items}</b></div><div><small>Vouchers</small><b>${counts.vouchers}</b></div><div><small>Cost Centres</small><b>${counts.centres}</b></div></div>
        <div class="company-summary-card"><h3>Company Features</h3><p><span>Accounts</span><b>${esc(c.maintainAccounts||'Yes')}</b></p><p><span>Inventory</span><b>${esc(c.inventory)}</b></p><p><span>Cost Centres</span><b>${esc(c.costCentres)}</b></p><p><span>Multi-Currency</span><b>${esc(c.multiCurrency||'No')}</b></p><p><span>Base Currency</span><b>${esc(c.currencySymbol)} — ${esc(c.currencyName)}</b></p></div>
      </section>
      <section class="gateway-menu-card">
        <div class="gateway-title">Gateway Menu</div>
        ${menuSection('MASTERS',[
          ['Groups','Groups'],['Ledgers','Ledgers'],['Cost Centres','Cost Centres']
        ])}
        ${menuSection('INVENTORY MASTERS',[
          ['Stock Groups','Stock Groups'],['Stock Items','Stock Items'],['Units','Units']
        ])}
        ${menuSection('TRANSACTIONS',[
          ['F4','Contra'],['F5','Payment'],['F6','Receipt'],['F7','Journal'],['F8','Sales'],['F9','Purchase']
        ])}
        ${menuSection('REPORTS',[
          ['','Day Book'],['','Trial Balance'],['','Profit & Loss'],['','Balance Sheet'],['','Stock Summary']
        ])}
      </section>
    </main>
    <footer class="shortcut-bar"><span>F2: Date</span><span>Alt+C: Create</span><span>Ctrl+A: Accept</span><span>Esc: Back</span></footer>
    <div id="toast"></div>
  </div>`;
  document.getElementById('switchCompany').onclick=()=>{ state.currentCompanyId=null; sessionStorage.removeItem('tabaja_company'); renderCompanyHub(); };
  document.getElementById('backupBtn').onclick=backupData;
  document.getElementById('logoutBtn').onclick=logout;
  document.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>showComing(b.dataset.menu));
  document.addEventListener('keydown',shortcutHandler,{once:true});
}

function menuSection(title,items){
  return `<div class="tally-menu-section"><h3>${title}</h3>${items.map(([key,label])=>`<button data-menu="${esc(label)}"><span>${key}</span>${esc(label)}</button>`).join('')}</div>`;
}
function shortcutHandler(e){
  const map={F4:'Contra',F5:'Payment',F6:'Receipt',F7:'Journal',F8:'Sales',F9:'Purchase'};
  if(map[e.key]){ e.preventDefault(); showComing(map[e.key]); }
}
function showComing(name){
  const t=document.getElementById('toast'); if(!t)return;
  t.innerHTML=`<div class="toast"><b>${esc(name)}</b><span>This module is prepared for the next build.</span></div>`;
  setTimeout(()=>t.innerHTML='',2400);
}

function field(label,name,required=false,value='',type='text'){return `<div class="field"><label>${label}${required?' *':''}</label><input type="${type}" name="${name}" value="${esc(value)}" ${required?'required':''}></div>`;}
function area(label,name,value=''){return `<div class="field"><label>${label}</label><textarea name="${name}" rows="3">${esc(value)}</textarea></div>`;}
function selectField(label,name,opts,value){return `<div class="field"><label>${label}</label><select name="${name}">${opts.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select></div>`;}
function openCompany(id){state.currentCompanyId=id;sessionStorage.setItem('tabaja_company',id);render();}
function deleteCompany(id){if(!confirm('Delete this company and all its data?'))return; storage.saveCompanies(storage.companies().filter(x=>x.id!==id)); localStorage.removeItem(`tabaja_company_${id}`); renderCompanyHub();}
function logout(){sessionStorage.clear();state.user=null;state.currentCompanyId=null;render();}
function backupData(){
  const companies=storage.companies(); const companyData={}; companies.forEach(c=>companyData[c.id]=storage.companyData(c.id));
  const data={app:'Tabaja ERP',version:'1.1',exportedAt:new Date().toISOString(),companies,companyData,admin:JSON.parse(localStorage.getItem('tabaja_admin')||'null')};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`tabaja-erp-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
}
restoreInput.addEventListener('change',async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{const data=JSON.parse(await file.text()); if(!Array.isArray(data.companies))throw new Error(); storage.saveCompanies(data.companies); Object.entries(data.companyData||{}).forEach(([id,value])=>storage.saveCompanyData(id,value)); if(data.admin)localStorage.setItem('tabaja_admin',JSON.stringify(data.admin)); state.message='Backup restored successfully.'; state.currentCompanyId=null;sessionStorage.removeItem('tabaja_company');renderCompanyHub();}
  catch{alert('Invalid backup file.');} e.target.value='';
});

render();
