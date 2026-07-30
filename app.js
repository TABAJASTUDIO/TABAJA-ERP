const app=document.getElementById('app'),restoreInput=document.getElementById('restoreInput');
const S={user:sessionStorage.getItem('te_user'),companyId:sessionStorage.getItem('te_company'),screen:'gateway',stack:[],focusKey:null};
const DB={companies:()=>JSON.parse(localStorage.getItem('te_companies')||'[]'),saveCompanies:x=>localStorage.setItem('te_companies',JSON.stringify(x)),data:id=>JSON.parse(localStorage.getItem('te_data_'+id)||'null'),save:(id,x)=>localStorage.setItem('te_data_'+id,JSON.stringify(x))};
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const defaultGroups=()=>['Capital Account','Bank Accounts','Bank OD A/c','Cash-in-Hand','Current Assets','Current Liabilities','Deposits (Asset)','Direct Expenses','Direct Incomes','Duties & Taxes','Expenses (Direct)','Expenses (Indirect)','Fixed Assets','Income (Direct)','Income (Indirect)','Investments','Loans & Advances (Asset)','Loans (Liability)','Provisions','Purchase Accounts','Reserves & Surplus','Retained Earnings','Sales Accounts','Secured Loans','Stock-in-Hand','Sundry Creditors','Sundry Debtors','Suspense A/c','Unsecured Loans'].map((name,i)=>({id:'g'+i,name,parent:'Primary',nature:groupNature(name),system:true}));
function groupNature(n){if(/Capital|Liabil|Creditor|Loan|Provision|Reserve|OD/.test(n))return'Liability';if(/Sales|Income/.test(n))return'Income';if(/Purchase|Expense|Duties/.test(n))return'Expense';return'Asset'}
function seed(){return{groups:defaultGroups(),ledgers:[],stockItems:[],vouchers:[],lastEntry:null}}
function company(){return DB.companies().find(x=>x.id===S.companyId)}
function data(){let d=DB.data(S.companyId);if(!d){d=seed();DB.save(S.companyId,d)}if(!d.vouchers)d.vouchers=[];if(!d.stockItems)d.stockItems=[];return d}
function saveData(d){DB.save(S.companyId,d)}
function hk(label,key){const i=label.toLowerCase().indexOf(key.toLowerCase());if(i<0)return esc(label);return esc(label.slice(0,i))+`<u class="hotkey">${esc(label[i])}</u>`+esc(label.slice(i+1))}
function shell(title,body){return `<div class="top"><div class="brand">Tabaja ERP <small>Alpha 9</small></div><div class="topnav"><button>K: Company</button><button>Y: Data</button><button>Z: Exchange</button><button id="gotoTop">G: Go To</button><button>O: Import</button><button>E: Export</button></div></div><div class="strip">${esc(title)}</div>${body}<div class="status"><span>Q: Quit</span><span>A: Accept</span><span>Esc: Back</span><span>Enter: Select</span></div>`}
function render(){if(!S.user)return login();if(!S.companyId||!company())return hub();gateway()}
function login(){S.screen='login';app.innerHTML=`<div class="login"><form class="loginbox" id="f"><h1>Tabaja ERP</h1><p>Personal Accounting System</p><div class="field"><label>User Name</label><input name="u" value="admin"></div><div class="field"><label>Password</label><input name="p" type="password" value="1234"></div><button class="btn primary" style="width:100%">Sign In</button><div class="note">First login: admin / 1234</div></form></div>`;f.onsubmit=e=>{e.preventDefault();let x=new FormData(f);if(x.get('u')==='admin'&&x.get('p')==='1234'){S.user='admin';sessionStorage.setItem('te_user','admin');hub()}else alert('Incorrect login')}}
function hub(){S.screen='hub';S.stack=[];let cs=DB.companies();app.innerHTML=shell('Company Selection',`<main class="hub"><div class="toolbar hub-tools"><button class="btn primary" id="newC">${hk('Create Company','C')}</button><button class="btn" id="backup">${hk('Backup Data','B')}</button><button class="btn" id="restore">${hk('Restore Data','R')}</button><button class="btn" id="logout">${hk('Logout','L')}</button></div><div class="cards">${cs.length?cs.map((c,i)=>`<div class="card company-card"><h3>${esc(c.name)}</h3><p>${esc(c.country||'Sierra Leone')}</p><p>Financial year: ${esc(c.fy)}</p><button class="btn primary open-company" data-open="${c.id}">${hk('Open Company','O')}</button></div>`).join(''):'<div class="card"><h3>No company created</h3><p>Create your first company.</p></div>'}</div></main>`);newC.onclick=companyForm;logout.onclick=()=>{sessionStorage.clear();S.user=null;login()};backup.onclick=backupAll;restore.onclick=()=>restoreInput.click();document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCompany(b.dataset.open));setTimeout(()=>document.querySelector('.open-company')?.focus(),0)}
function openCompany(id){S.companyId=id;sessionStorage.setItem('te_company',id);gateway()}
function companyForm(){S.screen='companyForm';app.innerHTML=shell('Company Creation',`<main class="hub"><form class="card" id="cf"><div class="form-grid"><div class="field"><label>Company Name *</label><input name="name" required></div><div class="field"><label>Mailing Name</label><input name="mailing"></div><div class="field full"><label>Address</label><textarea name="address"></textarea></div><div class="field"><label>Country</label><input name="country" value="Sierra Leone"></div><div class="field"><label>Financial year beginning</label><input type="date" name="fy" value="2026-04-01"></div><div class="field"><label>Books beginning</label><input type="date" name="books" value="2026-04-01"></div><div class="field"><label>Base Currency</label><input name="currency" value="NLe"></div></div><div class="actions"><button type="button" class="btn" id="cancel">Cancel</button><button class="btn primary">Create Company</button></div></form></main>`);cancel.onclick=hub;cf.onsubmit=e=>{e.preventDefault();let o=Object.fromEntries(new FormData(cf));let c={id:uid('c'),...o};let cs=DB.companies();cs.push(c);DB.saveCompanies(cs);DB.save(c.id,seed());openCompany(c.id)};setupFormKeyboard(cf,hub)}
function gateway(){S.screen='gateway';let c=company(),d=data();app.innerHTML=shell(c.name,`<main class="screen"><div class="gateway"><section class="company-info"><div class="meta"><div><small>CURRENT PERIOD</small><b>${esc(c.fy)} onward</b></div><div><small>CURRENT DATE</small><b>${new Date().toLocaleDateString('en-GB')}</b></div><div><small>NAME OF COMPANY</small><h2>${esc(c.name)}</h2></div><div><small>DATE OF LAST ENTRY</small><b>${d.lastEntry||'No entries yet'}</b></div></div></section><aside class="panel"><div class="panel-title">Gateway of Tabaja ERP</div><div class="section-title">MASTERS</div><button class="menu-btn" data-key="c" id="create">${hk('Create','C')}</button><button class="menu-btn" data-key="a" id="alter">${hk('Alter','A')}</button><button class="menu-btn" data-key="h" id="coa">C${hk('hart of Accounts','H')}</button><div class="section-title">TRANSACTIONS</div><button class="menu-btn" data-key="v" id="vouchers">${hk('Vouchers','V')}</button><button class="menu-btn" data-key="y" id="daybook">Da${hk('y Book','Y')}</button><div class="section-title">REPORTS</div><button class="menu-btn" data-key="b" id="bs">${hk('Balance Sheet','B')}</button><button class="menu-btn" data-key="p" id="pl">${hk('Profit & Loss A/c','P')}</button><button class="menu-btn" data-key="s" id="stock">${hk('Stock Summary','S')}</button><button class="menu-btn" data-key="d" id="display">${hk('Display More Reports','D')}</button><button class="menu-btn" data-key="o" id="dashboard">Dashb${hk('oard','O')}</button><div class="section-title"></div><button class="menu-btn" data-key="q" id="close">${hk('Quit','Q')}</button></aside></div></main>`);bindMenu('.panel .menu-btn');create.onclick=createMenu;alter.onclick=alterMenu;coa.onclick=chart;display.onclick=displayMenu;close.onclick=()=>quitPopup('Quit?',()=>{sessionStorage.clear();S.user=null;S.companyId=null;login()});vouchers.onclick=()=>{veResetDraft();voucherEntry()};['daybook','bs','pl','stock','dashboard'].forEach(id=>document.getElementById(id).onclick=()=>toast('This module is prepared for the next build.'));gotoTop.onclick=goToPopup}
function overlay(title,inner,wide=false){let x=document.createElement('div');x.id='ov';x.className='modal-backdrop';x.innerHTML=`<div class="modal ${wide?'wide':''}"><div class="modal-title">${title}</div><div class="modal-body">${inner}</div></div>`;document.body.appendChild(x);return x}
function createMenu(){S.screen='createMenu';let o=overlay('Master Creation',`<div class="master-list"><h4>Accounting Masters</h4><button data-key="g" id="cg">${hk('Group','G')}</button><button data-key="l" id="cl">${hk('Ledger','L')}</button><button data-key="c" id="cc">${hk('Cost Centre','C')}</button><button data-key="u" id="cur">C${hk('urrency','U')}</button><button data-key="v" id="vt">${hk('Voucher Type','V')}</button><h4>Inventory Masters</h4><button data-key="s" id="sg">${hk('Stock Group','S')}</button><button data-key="a" id="sc">Stock C${hk('ategory','A')}</button><button data-key="i" id="si">Stock ${hk('Item','I')}</button><button data-key="n" id="unit">U${hk('nit','N')}</button><button data-key="o" id="loc">L${hk('ocation','O')}</button></div>`);bindMenu('.master-list > button');cg.onclick=createGroup;cl.onclick=createLedger;['cc','cur','vt','sg','sc','si','unit','loc'].forEach(id=>document.getElementById(id).onclick=()=>toast('Coming in the next build.'))}
function alterMenu(){S.screen='alterMenu';let o=overlay('Master Alteration',`<div class="master-list"><h4>Accounting Masters</h4><button data-key="g" id="ag">${hk('Group','G')}</button><button data-key="l" id="al">${hk('Ledger','L')}</button></div>`);bindMenu('.master-list > button');ag.onclick=()=>toast('Group alteration coming next.');al.onclick=()=>ledgerList('alter')}
function displayMenu(){S.screen='displayMenu';let o=overlay('Display More Reports',`<div class="master-list"><h4>ACCOUNTING</h4><button data-key="t" id="dt">${hk('Trial Balance','T')}</button><button data-key="d" id="dd">${hk('Day Book','D')}</button><button data-key="c" id="dc">${hk('Cash Flow','C')}</button><button data-key="f" id="df">${hk('Funds Flow','F')}</button><h4><button class="inline-head" data-key="a" id="ab">${hk('Account Books','A')}</button></h4><button data-key="s" id="sa">${hk('Statements of Accounts','S')}</button><h4>INVENTORY</h4><button data-key="i" id="ib">${hk('Inventory Books','I')}</button><button data-key="e" id="si">Stat${hk('ements of Inventory','E')}</button></div>`);bindMenu('.master-list button');dd.onclick=()=>toast('Day Book will show vouchers after voucher entry is added.');ab.onclick=accountBooks;['dt','dc','df','sa','ib','si'].forEach(id=>document.getElementById(id).onclick=()=>toast('This report is prepared for a later build.'))}
function accountBooks(){document.getElementById('ov')?.remove();S.screen='accountBooks';let o=overlay('Account Books',`<div class="master-list"><button data-key="l" id="abl">${hk('Ledger','L')}</button><button data-key="c" id="cashbook">${hk('Cash/Bank Book(s)','C')}</button><button data-key="g" id="groupsum">${hk('Group Summary','G')}</button><button data-key="s" id="salesreg">${hk('Sales Register','S')}</button><button data-key="p" id="purreg">${hk('Purchase Register','P')}</button></div>`);bindMenu('.master-list button');abl.onclick=()=>ledgerList('display');['cashbook','groupsum','salesreg','purreg'].forEach(id=>document.getElementById(id).onclick=()=>toast('Coming after voucher entry.'))}
function createGroup(){document.getElementById('ov')?.remove();S.screen='groupForm';let d=data();let o=overlay('Group Creation',`<form id="gf"><div class="form-grid"><div class="field full"><label>Name *</label><input name="name" required autofocus></div><div class="field"><label>Under</label><select name="parent"><option>Primary</option>${d.groups.map(g=>`<option>${esc(g.name)}</option>`).join('')}</select></div><div class="field"><label>Nature</label><select name="nature"><option>Asset</option><option>Liability</option><option>Income</option><option>Expense</option></select></div></div><div class="actions"><button type="button" class="btn" id="cancelG">Cancel</button><button class="btn primary">Accept</button></div></form>`);cancelG.onclick=()=>{o.remove();createMenu()};gf.onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(gf));d.groups.push({id:uid('g'),...v,system:false});saveData(d);toast('Group created successfully');gf.reset();gf.elements.name.focus()};setupFormKeyboard(gf,()=>{o.remove();createMenu()})}
function createLedger(editId=null){document.getElementById('ov')?.remove();S.screen='ledgerForm';let d=data(),old=editId?d.ledgers.find(x=>x.id===editId):null;let o=overlay(old?'Ledger Alteration':'Ledger Creation',`<form id="lf"><div class="form-grid"><div class="field"><label>Name *</label><input name="name" required autofocus value="${esc(old?.name||'')}"></div><div class="field"><label>Alias</label><input name="alias" value="${esc(old?.alias||'')}"></div><div class="field"><label>Under *</label><select name="groupId" required>${d.groups.map(g=>`<option value="${g.id}" ${old?.groupId===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div><div class="field"><label>Opening Balance</label><input name="opening" type="number" step="0.01" value="${old?.opening??0}"></div><div class="field"><label>Balance Type</label><select name="balanceType"><option ${old?.balanceType==='Dr'?'selected':''}>Dr</option><option ${old?.balanceType==='Cr'?'selected':''}>Cr</option></select></div><div class="field"><label>Provide bank details</label><select name="bank"><option ${old?.bank!=='Yes'?'selected':''}>No</option><option ${old?.bank==='Yes'?'selected':''}>Yes</option></select></div><div class="field full"><label>Mailing Address</label><textarea name="address">${esc(old?.address||'')}</textarea></div></div><div class="actions"><button type="button" class="btn" id="cancelL">Cancel</button><button class="btn primary">Accept</button></div></form>`);cancelL.onclick=()=>{o.remove();editId?ledgerList('alter'):createMenu()};lf.onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(lf));v.opening=Number(v.opening||0);if(old)Object.assign(old,v);else d.ledgers.push({id:uid('l'),...v});saveData(d);toast(old?'Ledger altered successfully':'Ledger created successfully');if(old){o.remove();ledgerList('alter')}else{lf.reset();lf.elements.opening.value=0;lf.elements.name.focus()}};setupFormKeyboard(lf,()=>{o.remove();editId?ledgerList('alter'):createMenu()})}
function ledgerList(mode='display'){document.getElementById('ov')?.remove();S.screen='ledgerList';let d=data();let o=overlay(mode==='alter'?'Select Ledger to Alter':'Select Ledger',`<div class="list-search"><label>Name of Ledger</label><input id="ledgerSearch" autocomplete="off"></div><div class="scroll-list" id="ledgerRows"></div>`);const draw=()=>{let q=ledgerSearch.value.toLowerCase();let rows=d.ledgers.filter(l=>l.name.toLowerCase().includes(q)||String(l.alias||'').toLowerCase().includes(q));ledgerRows.innerHTML=rows.length?rows.map(l=>`<button class="list-row" data-id="${l.id}">${esc(l.name)}</button>`).join(''):'<div class="empty-row">No ledgers found</div>';bindMenu('#ledgerRows .list-row');document.querySelectorAll('#ledgerRows .list-row').forEach(b=>b.onclick=()=>mode==='alter'?createLedger(b.dataset.id):ledgerDisplay(b.dataset.id))};ledgerSearch.oninput=draw;draw();setTimeout(()=>ledgerSearch.focus(),0)}
function ledgerDisplay(id){document.getElementById('ov')?.remove();S.screen='ledgerDisplay';let d=data(),l=d.ledgers.find(x=>x.id===id),g=d.groups.find(x=>x.id===l.groupId),vs=d.vouchers.filter(v=>v.lines?.some(x=>x.ledgerId===id));let signed=(l.balanceType==='Cr'?-1:1)*Number(l.opening||0);let current=vs.reduce((sum,v)=>sum+v.lines.filter(x=>x.ledgerId===id).reduce((a,x)=>a+Number(x.debit||0)-Number(x.credit||0),0),0);let closing=signed+current;app.innerHTML=shell(company().name,`<main class="hub ledger-page"><div class="report-head"><h2>Ledger Vouchers</h2><div><b>Ledger: ${esc(l.name)}</b><br><small>Under: ${esc(g?.name||'')}</small></div></div><table class="table"><thead><tr><th>Date</th><th>Particulars</th><th>Vch Type</th><th>Vch No.</th><th>Debit</th><th>Credit</th></tr></thead><tbody>${vs.length?vs.map(v=>`<tr><td>${esc(v.date)}</td><td>${esc(v.particulars||'')}</td><td>${esc(v.type||'')}</td><td>${esc(v.number||'')}</td><td class="right">${Number(v.debit||0).toFixed(2)}</td><td class="right">${Number(v.credit||0).toFixed(2)}</td></tr>`).join(''):`<tr><td colspan="6" class="empty-row">No voucher entries yet</td></tr>`}</tbody></table><div class="balances"><div>Opening Balance: <b>${Math.abs(signed).toFixed(2)} ${signed<0?'Cr':'Dr'}</b></div><div>Current Total: <b>${Math.abs(current).toFixed(2)} ${current<0?'Cr':'Dr'}</b></div><div>Closing Balance: <b>${Math.abs(closing).toFixed(2)} ${closing<0?'Cr':'Dr'}</b></div></div></main>`)}
function chart(){S.screen='chart';let d=data();let rows=d.groups.map(g=>{let ls=d.ledgers.filter(l=>l.groupId===g.id);return `<tr><td><b>${esc(g.name)}</b>${g.system?' <span class="badge">System</span>':''}</td><td>${esc(g.parent)}</td><td>${esc(g.nature)}</td><td>${ls.length}</td></tr>${ls.map(l=>`<tr><td style="padding-left:35px">↳ ${esc(l.name)}</td><td>${esc(g.name)}</td><td>Ledger</td><td class="right">${l.opening.toFixed(2)} ${esc(l.balanceType)}</td></tr>`).join('')}`}).join('');app.innerHTML=shell(company().name,`<main class="hub"><h2>Chart of Accounts</h2><table class="table"><thead><tr><th>Name</th><th>Under</th><th>Type / Nature</th><th>Count / Opening</th></tr></thead><tbody>${rows}</tbody></table></main>`)}

const V={type:'Purchase',mode:'Item Invoice',optional:false,postDated:false,activeCell:0,focusId:null,voucherDate:new Date().toISOString().slice(0,10),suppressContextOnce:false,editOriginal:'',editOriginalDate:'',items:[],values:{supplierNo:'',supplierDate:'',party:'',purchaseLedger:'',item:'',qty:'',rate:'',amount:'',narration:''},selected:{party:null,purchaseLedger:null,item:null}};

function veResetDraft(){
 V.type='Purchase';V.mode='Item Invoice';V.optional=false;V.postDated=false;V.activeCell=0;V.focusId=null;V.suppressContextOnce=false;
 V.voucherDate=new Date().toISOString().slice(0,10);V.editOriginal='';V.editOriginalDate='';V.items=[];
 V.values={supplierNo:'',supplierDate:'',party:'',purchaseLedger:'',item:'',qty:'',rate:'',amount:'',narration:''};
 V.selected={party:null,purchaseLedger:null,item:null};VE_LIST.items=[];VE_LIST.index=0;VE_LIST.kind='ledger';VE_LIST.query='';
}
const VOUCHER_CELLS=[
 {key:'supplierNo',label:'Supplier Invoice No.',kind:'text'},{key:'supplierDate',label:'Date',kind:'date'},
 {key:'party',label:'Party A/c name',kind:'ledger'},{key:'purchaseLedger',label:'Purchase ledger',kind:'ledger'},
 {key:'item',label:'Name of Item',kind:'stock'},{key:'qty',label:'Quantity',kind:'number'},
 {key:'rate',label:'Rate',kind:'number'},{key:'amount',label:'Amount',kind:'number'},{key:'narration',label:'Narration',kind:'text'}
];
function voucherEntry(){
 document.getElementById('ov')?.remove();S.screen='voucher';const c=company(),now=veDateObject();if(V.type!=='Purchase')V.type='Purchase';
 V.activeCell=Math.max(0,Math.min(V.activeCell,VOUCHER_CELLS.length-1));
 app.innerHTML=shell(c.name,`<main class="voucher-tally-screen"><section class="voucher-paper">
  <div class="voucher-caption">Accounting Voucher Creation</div><div class="voucher-topline"><b>Purchase</b><span>No.&nbsp;&nbsp; <strong>Auto</strong></span></div>
  <div class="voucher-date-block"><b id="voucherDateTop">${veFormatDate(now)}</b><small id="voucherDayTop">${now.toLocaleDateString('en-GB',{weekday:'long'})}</small></div>
  <div class="voucher-entry-area">
   <div class="voucher-pair-row"><label>Supplier Invoice No.</label>${veRawCell(0)}<label class="date-label">Date</label>${veRawCell(1)}</div>
   <div class="voucher-single-row"><label>Party A/c name</label>${veRawCell(2)}</div><div class="voucher-balance"><span>Current balance</span><b id="partyBalance">${veBalanceText(V.selected.party)}</b></div>
   <div class="voucher-single-row"><label>Purchase ledger</label>${veRawCell(3)}</div><div class="voucher-balance"><span>Current balance</span><b id="purchaseBalance">${veBalanceText(V.selected.purchaseLedger)}</b></div>
   <div class="voucher-item-head"><b>Name of Item</b><span>Quantity</span><span>Rate</span><span>per</span><span>Amount</span></div>
   <div id="voucherCommittedRows">${veCommittedRows()}</div>
   <div class="voucher-item-row voucher-active-item-row"><div class="voucher-item-name-cell">${veRawCell(4)}<small id="voucherItemWeight">${veItemWeight()}</small></div><div class="voucher-qty-cell">${veRawCell(5)}<small id="voucherQtyWeight">${veQtyWeight()}</small></div>${veRawCell(6)}<div class="voucher-unit">${esc(V.selected.item?.unit||'CTN')}</div>${veRawCell(7)}</div>
   <div class="voucher-end-list" id="voucherEndList">◆ End of List</div>
  </div><div class="voucher-empty-space"></div>
  <div class="voucher-narration"><label>Narration</label>${veRawCell(8)}</div>
  <div class="voucher-total"><span class="voucher-total-qty" id="voucherTotalQty">${veTotalQty()}</span><b id="voucherTotal">${veTotal()}</b></div>
  <div class="voucher-flags">${V.optional?'<b>OPTIONAL</b>':''}${V.postDated?'<b>POST-DATED</b>':''}</div>
 </section><aside class="voucher-context-panel" id="voucherContextPanel" hidden></aside>
 <aside class="function-panel ve-functions"><button data-act="date"><b>F2:</b> Date</button><button data-act="company"><b>F3:</b> Company</button><div class="fp-gap"></div>
 <button data-type="Contra"><b>F4:</b> Contra</button><button data-type="Payment"><b>F5:</b> Payment</button><button data-type="Receipt"><b>F6:</b> Receipt</button><button data-type="Journal"><b>F7:</b> Journal</button><button data-type="Sales"><b>F8:</b> Sales</button><button data-type="Purchase" class="selected permanent-selected"><b>F9:</b> Purchase</button><button data-act="types"><b>F10:</b> Other Vouchers</button><div class="fp-gap"></div>
 <button class="disabled"><b>F:</b> Autofill</button><button data-act="mode"><b>H:</b> Change Mode</button><button data-act="details"><b>I:</b> More Details</button><button class="disabled"><b>O:</b> Related Reports</button><button data-act="optional"><b>L:</b> Optional</button><button data-act="postdated"><b>T:</b> Post-Dated</button><div class="fp-bottom"></div><button data-act="config"><b>F12:</b> Configure</button></aside></main>`);
 document.querySelectorAll('.ve-cell').forEach(el=>{const i=Number(el.dataset.i);el.addEventListener('focus',()=>veActivate(i));el.addEventListener('keydown',veCellKeydown);el.addEventListener('beforeinput',veBeforeInput);el.addEventListener('input',veInput);el.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text').replace(/\r?\n/g,' '))})});
 document.querySelectorAll('.function-panel button').forEach(b=>b.onclick=()=>voucherAction(b));veActivate(V.activeCell);
}
function veRawCell(i){let c=VOUCHER_CELLS[i],v=V.values[c.key]||'',readonly=c.key==='amount';return `<div class="ve-cell${readonly?' calculated':''}" id="veCell${i}" data-i="${i}" data-kind="${c.kind}" tabindex="${i===V.activeCell?'0':'-1'}" contenteditable="${readonly?'false':'true'}" spellcheck="false">${esc(v)}</div>`}
function veCommittedRows(){return V.items.map((x,i)=>`<div class="voucher-item-row voucher-committed-row" data-row="${i}"><div class="voucher-item-name-cell"><div class="ve-static">${esc(x.name)}</div><small>${x.kg?'('+Number(x.kg).toFixed(2)+' KG)':''}</small></div><div class="voucher-qty-cell"><div class="ve-static right">${Number(x.qty).toFixed(2)}</div><small>${x.kg?'('+(Number(x.kg)*Number(x.qty)).toFixed(2)+' KG)':''}</small></div><div class="ve-static right">${Number(x.rate).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div class="voucher-unit">${esc(x.unit||'CTN')}</div><div class="ve-static right">${Number(x.amount).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>`).join('')}
function veCurrentAmount(){return Number(V.values.qty||0)*Number(V.values.rate||0)}
function veTotal(){let a=V.items.reduce((n,x)=>n+Number(x.amount||0),0)+veCurrentAmount();return Number(a||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function veItemKg(){let n=String(V.selected.item?.name||V.values.item||'').match(/(20|25)\s*\*?\s*KG/i);return n?Number(n[1]):0}
function veItemWeight(){let kg=veItemKg();return kg?'('+kg.toFixed(2)+' KG)':''}
function veQtyWeight(){let kg=veItemKg(),q=Number(V.values.qty||0);return kg&&q?'('+(kg*q).toFixed(2)+' KG)':''}
function veTotalQty(){let q=V.items.reduce((n,x)=>n+Number(x.qty||0),0)+Number(V.values.qty||0);return q?q.toFixed(2)+' CTN':''}
function veRecalculate(){let a=veCurrentAmount();V.values.amount=(V.values.qty||V.values.rate)?String(a):'';let amount=document.getElementById('veCell7');if(amount)amount.textContent=a?a.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'';let total=document.getElementById('voucherTotal');if(total)total.textContent=veTotal();let tq=document.getElementById('voucherTotalQty');if(tq)tq.textContent=veTotalQty();let qw=document.getElementById('voucherQtyWeight');if(qw)qw.textContent=veQtyWeight()}
function veBalanceText(x){if(!x)return'';let n=Number(x.balance??x.opening??0),t=x.balanceType||'Dr';return `${Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})} ${t}`}
function veActivate(i){V.activeCell=i;document.querySelectorAll('.ve-cell').forEach((x,j)=>{x.classList.toggle('active',j===i);x.tabIndex=j===i?0:-1});const el=document.getElementById('veCell'+i);if(document.activeElement!==el)el?.focus({preventScroll:true});vePlaceCaretEnd(el);V.editOriginal=el?.textContent||'';V.editOriginalDate=V.voucherDate;const kind=VOUCHER_CELLS[i].kind;if((kind==='ledger'||kind==='stock')&&!V.suppressContextOnce)veOpenContext(V.values[VOUCHER_CELLS[i].key]||'',kind);else veCloseContext();V.suppressContextOnce=false}
function vePlaceCaretEnd(el){if(!el)return;let r=document.createRange(),s=window.getSelection();r.selectNodeContents(el);r.collapse(false);s.removeAllRanges();s.addRange(r)}
function veMove(delta){veCommit();let next=Math.max(0,Math.min(VOUCHER_CELLS.length-1,V.activeCell+delta));if(next===7)next=Math.max(0,Math.min(VOUCHER_CELLS.length-1,next+delta));veActivate(next)}
function veMoveBack(){let next=V.activeCell-1;if(next===7)next=6;if(next<0){veCloseContext(false);veResetDraft();gateway();return}veActivate(next)}
function veCommit(){let el=document.getElementById('veCell'+V.activeCell);if(!el)return;let c=VOUCHER_CELLS[V.activeCell],t=el.textContent.trim();if(c.kind==='number')t=t.replace(/[^0-9.-]/g,'');if(c.key==='supplierDate'){let iso=veParseDate(t);if(iso){V.voucherDate=iso;t=veFormatDate(veDateObject());veSyncDateDisplays()}}V.values[c.key]=t;el.textContent=t;if(c.key==='qty'||c.key==='rate')veRecalculate();else document.getElementById('voucherTotal')&&(document.getElementById('voucherTotal').textContent=veTotal())}
function veFinalizeCurrentItem(){veCommit();if(!String(V.values.item||'').trim())return false;let q=Number(V.values.qty||0),r=Number(V.values.rate||0);if(!q)return false;V.items.push({name:V.values.item.trim(),itemId:V.selected.item?.id||null,unit:V.selected.item?.unit||'CTN',kg:veItemKg(),qty:q,rate:r,amount:q*r});V.values.item='';V.values.qty='';V.values.rate='';V.values.amount='';V.selected.item=null;return true}
function veLoadLastItemForEdit(){if(!V.items.length)return false;let x=V.items.pop();V.values.item=x.name;V.values.qty=String(x.qty);V.values.rate=String(x.rate);V.values.amount=String(x.amount);V.selected.item={id:x.itemId,name:x.name,unit:x.unit};return true}
function veBeforeInput(e){let c=VOUCHER_CELLS[Number(e.currentTarget.dataset.i)];if(c.kind==='number'&&e.data&&!/[0-9.\-]/.test(e.data))e.preventDefault();if(e.inputType==='insertParagraph')e.preventDefault()}
function veInput(e){let i=Number(e.currentTarget.dataset.i),c=VOUCHER_CELLS[i];V.values[c.key]=e.currentTarget.textContent.replace(/\r?\n/g,'');if(c.kind==='ledger'||c.kind==='stock')veOpenContext(V.values[c.key],c.kind);if(c.key==='qty'||c.key==='rate')veRecalculate();else document.getElementById('voucherTotal')&&(document.getElementById('voucherTotal').textContent=veTotal())}
function veCancelCurrentEdit(){let el=document.getElementById('veCell'+V.activeCell),c=VOUCHER_CELLS[V.activeCell];if(!el)return false;if(el.textContent!==V.editOriginal){el.textContent=V.editOriginal;V.values[c.key]=V.editOriginal;if(c.key==='supplierDate'){V.voucherDate=V.editOriginalDate;veSyncDateDisplays();el.textContent=V.editOriginal}if(c.key==='qty'||c.key==='rate')veRecalculate();vePlaceCaretEnd(el);return true}return false}
function veCellKeydown(e){
 const cellIndex=Number(e.currentTarget.dataset.i),cellDef=VOUCHER_CELLS[cellIndex],kind=cellDef.kind,panel=document.getElementById('voucherContextPanel');
 if(e.key==='Backspace'&&e.currentTarget.textContent.length===0){e.preventDefault();e.stopPropagation();veMoveBack();return}
 if(panel&&!panel.hidden&&(kind==='ledger'||kind==='stock')){if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();veListMove(1);return}if(e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();veListMove(-1);return}if(e.key==='Enter'){e.preventDefault();e.stopPropagation();veListPick();return}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();veCloseContext(true);return}}
 if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();e.stopPropagation();if(cellIndex===6&&!e.shiftKey){if(veFinalizeCurrentItem()){V.activeCell=4;voucherEntry();return}}veMove(e.shiftKey?-1:1);return}
 if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();veMove(1);return}if(e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();veMoveBack();return}
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();veCloseContext(false);if(veCancelCurrentEdit())return;if(cellIndex===8&&veLoadLastItemForEdit()){V.activeCell=6;voucherEntry();return}veMoveBack();return}
}
let VE_LIST={items:[],index:0,kind:'ledger',query:''};
function veLedgerItems(q=''){
 let d=data(),items=d.ledgers.map(l=>({id:l.id,name:l.name,alias:l.alias||'',group:d.groups.find(g=>g.id===l.groupId)?.name||'',opening:Number(l.opening||0),balanceType:l.balanceType||'Dr'}));
 if(!items.length)items=[{id:'demo1',name:'Cash',group:'Cash-in-Hand',opening:0,balanceType:'Dr'},{id:'demo2',name:'Purchase Accounts',group:'Purchase Accounts',opening:0,balanceType:'Dr'},{id:'demo3',name:'Sundry Supplier',group:'Sundry Creditors',opening:0,balanceType:'Cr'}];
 q=q.trim().toLowerCase();return items.filter(x=>!q||x.name.toLowerCase().includes(q)||x.alias.toLowerCase().includes(q)).slice(0,30)
}
function veStockItems(q=''){
 let d=data(),items=d.stockItems.length?d.stockItems:[
  {id:'s1',name:'JIFU TENNY (CTN) 20*KG',unit:'CTN',closing:'0.00 CTN'},
  {id:'s2',name:'JIFU TENNY (CTN) 25*KG',unit:'CTN',closing:'0.00 CTN'},
  {id:'s3',name:'LB JIFU TENNY (CTN) 20*KG',unit:'CTN',closing:'0.00 CTN'},
  {id:'s4',name:'LB JIFU TENNY (CTN) 25*KG',unit:'CTN',closing:'16.50 CTN'}
 ];q=q.trim().toLowerCase();return items.filter(x=>!q||x.name.toLowerCase().includes(q)).slice(0,30)
}
function veOpenContext(q,kind){document.querySelector('.voucher-tally-screen')?.classList.add('context-open');VE_LIST.kind=kind;VE_LIST.query=(q||'').trim();VE_LIST.items=kind==='stock'?[{id:'__end__',name:'◆ End of List',end:true},...veStockItems(q)]:veLedgerItems(q);let exact=VE_LIST.items.some(x=>x.name.toLowerCase()===VE_LIST.query.toLowerCase());if(VE_LIST.query&&!exact)VE_LIST.items.push({id:'__create__',name:(kind==='stock'?'Create Stock Item: ':'Create Ledger: ')+VE_LIST.query,create:true,rawName:VE_LIST.query});VE_LIST.index=0;let box=document.getElementById('voucherContextPanel');if(!box)return;box.hidden=false;veDrawList()}
function veDrawList(){let box=document.getElementById('voucherContextPanel');if(!box)return;let stock=VE_LIST.kind==='stock';box.innerHTML=`<div class="ve-list-title">${stock?'List of Stock Items':'List of Ledger Accounts'}<small>Create</small></div>${VE_LIST.items.length?VE_LIST.items.map((x,i)=>`<button class="ve-list-row ${x.create?'create-row':''} ${i===VE_LIST.index?'active':''}" data-i="${i}"><span>${esc(x.name)}</span><small>${x.create?'Alt+C':stock?esc(x.closing||''):esc(x.group||'')}</small></button>`).join(''):'<div class="empty-row">No matching entry — type a name to create it</div>'}`;box.querySelectorAll('button').forEach(b=>{b.onmouseenter=()=>{VE_LIST.index=Number(b.dataset.i);veDrawList()};b.onmousedown=e=>{e.preventDefault();VE_LIST.index=Number(b.dataset.i);veListPick()}})}
function veListMove(d){if(!VE_LIST.items.length)return;VE_LIST.index=(VE_LIST.index+d+VE_LIST.items.length)%VE_LIST.items.length;veDrawList();document.querySelector('.ve-list-row.active')?.scrollIntoView({block:'nearest'})}
function veListPick(){let x=VE_LIST.items[VE_LIST.index];if(!x)return;if(x.end){veCloseContext(false);V.activeCell=8;voucherEntry();return}if(x.create){veCreateMaster(VE_LIST.kind,x.rawName);return}let c=VOUCHER_CELLS[V.activeCell],el=document.getElementById('veCell'+V.activeCell);V.values[c.key]=x.name;V.selected[c.key]=x;el.textContent=x.name;if(c.key==='party'){let b=document.getElementById('partyBalance');if(b)b.textContent=veBalanceText(x)}if(c.key==='purchaseLedger'){let b=document.getElementById('purchaseBalance');if(b)b.textContent=veBalanceText(x)}veCloseContext(false);V.suppressContextOnce=true;veMove(1)}
function veCloseContext(refocus=false){let b=document.getElementById('voucherContextPanel');if(b)b.hidden=true;document.querySelector('.voucher-tally-screen')?.classList.remove('context-open');if(refocus){let el=document.getElementById('veCell'+V.activeCell);el?.focus({preventScroll:true});vePlaceCaretEnd(el)}}
function veCreateMaster(kind,prefill){
 const prevCell=V.activeCell,title=kind==='stock'?'Stock Item Creation':'Ledger Creation',d=data();
 let groupOptions=d.groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');
 let x=tallyPopup('quickCreate',title,kind==='stock'?`<form id="quickMasterForm" class="quick-master"><label>Name<input name="name" value="${esc(prefill)}" required></label><label>Unit<input name="unit" value="CTN" required></label><label>Opening Quantity<input name="opening" type="number" step="0.01" value="0"></label><small>Ctrl+A: Accept &nbsp; Esc: Cancel</small></form>`:`<form id="quickMasterForm" class="quick-master"><label>Name<input name="name" value="${esc(prefill)}" required></label><label>Under<select name="groupId">${groupOptions}</select></label><label>Opening Balance<input name="opening" type="number" step="0.01" value="0"></label><label>Balance Type<select name="balanceType"><option>Dr</option><option>Cr</option></select></label><small>Ctrl+A: Accept &nbsp; Esc: Cancel</small></form>`);
 let f=x.querySelector('form'),accept=()=>{if(!f.reportValidity())return;let o=Object.fromEntries(new FormData(f));let made;if(kind==='stock'){made={id:uid('s'),name:o.name.trim(),unit:o.unit||'CTN',opening:Number(o.opening||0),closing:Number(o.opening||0).toFixed(2)+' '+(o.unit||'CTN')};d.stockItems.push(made)}else{made={id:uid('l'),name:o.name.trim(),alias:'',groupId:o.groupId,group:d.groups.find(g=>g.id===o.groupId)?.name||'',opening:Number(o.opening||0),balanceType:o.balanceType||'Dr'};d.ledgers.push(made)}saveData(d);x.remove();V.activeCell=prevCell;let c=VOUCHER_CELLS[prevCell];V.values[c.key]=made.name;V.selected[c.key]=made;voucherEntry();V.suppressContextOnce=true;setTimeout(()=>{veCloseContext();veMove(1)},0)};
 f.onsubmit=e=>{e.preventDefault();accept()};x.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();x.closePopup()}else if(e.ctrlKey&&e.key.toLowerCase()==='a'){e.preventDefault();accept()}};setTimeout(()=>f.elements.name.select(),0)
}
function veDateObject(){let d=new Date((V.voucherDate||new Date().toISOString().slice(0,10))+'T00:00:00');return isNaN(d)?new Date():d}
function veFormatDate(d){return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}).replace(/ /g,'-')}
function veParseDate(t){t=(t||'').trim();if(!t)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;let named=t.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{2}|\d{4})$/);if(named){let y=named[3].length===2?'20'+named[3]:named[3],d=new Date(`${named[1]} ${named[2]} ${y}`);return isNaN(d)?null:d.toISOString().slice(0,10)}let m=t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/);if(!m)return null;let y=m[3].length===2?'20'+m[3]:m[3],d=new Date(`${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T00:00:00`);return isNaN(d)?null:`${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`}
function veSyncDateDisplays(){let d=veDateObject(),top=document.getElementById('voucherDateTop'),day=document.getElementById('voucherDayTop');if(top)top.textContent=veFormatDate(d);if(day)day.textContent=d.toLocaleDateString('en-GB',{weekday:'long'});V.values.supplierDate=veFormatDate(d)}
function voucherAction(b){
 if(b.classList.contains('disabled'))return;
 if(b.dataset.type){if(b.dataset.type!=='Purchase'){toast('Purchase is the active test voucher in this build.');return}V.type='Purchase';voucherEntry();return}
 const a=b.dataset.act;
 if(a==='date')datePopup();else if(a==='company')toast('Company selection remains unchanged in this test build.');
 else if(a==='types')voucherTypePopup();else if(a==='mode')voucherModePopup();else if(a==='details')moreDetailsPopup();
 else if(a==='optional'){V.optional=!V.optional;voucherEntry()}else if(a==='postdated'){V.postDated=!V.postDated;voucherEntry()}else if(a==='config')voucherConfigPopup();
}
function tallyPopup(id,title,body,afterClose){
 document.getElementById('tallyOv')?.remove(); const prev=document.activeElement; if(prev?.id)V.focusId=prev.id;
 let x=document.createElement('div');x.id='tallyOv';x.className='tally-overlay';x.innerHTML=`<div class="tally-dialog"><div class="tally-title">${esc(title)}</div>${body}</div>`;document.body.appendChild(x);
 x.closePopup=()=>{x.remove();setTimeout(()=>{(document.getElementById(V.focusId)||prev)?.focus?.()},0);afterClose?.()};return x
}
function popupList(title,items,onPick){let x=tallyPopup('list',title,`<div class="tally-list">${items.map((it,i)=>`<button data-i="${i}" class="${i===0?'active':''}"><span>${esc(it.name||it)}</span><kbd>${esc(it.key||'')}</kbd></button>`).join('')}</div>`);let bs=[...x.querySelectorAll('button')],i=0;const set=n=>{i=(n+bs.length)%bs.length;bs.forEach((b,j)=>b.classList.toggle('active',j===i));bs[i].focus()};bs.forEach((b,j)=>b.onclick=()=>{let it=items[j];x.remove();onPick(it)});x.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();x.closePopup()}else if(e.key==='ArrowDown'){e.preventDefault();set(i+1)}else if(e.key==='ArrowUp'){e.preventDefault();set(i-1)}else if(e.key==='Enter'){e.preventDefault();bs[i].click()}};setTimeout(()=>set(0),0)}
function voucherTypePopup(){popupList('List of Voucher Types',[{name:'Contra',key:'F4'},{name:'Credit Note',key:'Alt+F6'},{name:'Debit Note',key:'Alt+F5'},{name:'Journal',key:'F7'},{name:'Payment',key:'F5'},{name:'Purchase',key:'F9'},{name:'Receipt',key:'F6'},{name:'Sales',key:'F8'},{name:'Material In'},{name:'Material Out'},{name:'Physical Stock',key:'Ctrl+F7'},{name:'Stock Journal',key:'Alt+F7'}],it=>{V.type=it.name;voucherEntry()})}
function voucherModePopup(){popupList('List of Modes/Usages',['Item Invoice','Accounting Invoice','As Voucher'],it=>{V.mode=it;toast('Mode: '+it);voucherEntry()})}
function datePopup(){let x=tallyPopup('date','Change Date',`<div class="single-field"><input id="popupDate" type="date" value="${V.voucherDate}"><small>Enter: Accept &nbsp; Esc: Cancel</small></div>`);popupDate.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();x.closePopup()}else if(e.key==='Enter'){e.preventDefault();V.voucherDate=popupDate.value;veSyncDateDisplays();let cell=document.getElementById('veCell1');if(cell)cell.textContent=V.values.supplierDate;x.remove();document.getElementById(V.focusId)?.focus()}};setTimeout(()=>popupDate.focus(),0)}
function moreDetailsPopup(){let rows=['Effective Date','Import Details','Voucher Narration','Order Details','Party Details','Consignee Details','Receipt Details','Supplier Invoice No. & Date','Voucher No. Details'];let x=tallyPopup('details','More Details',`<div class="more-details"><div class="show-less">Show Less</div><h4>General</h4>${rows.map((r,i)=>`<button class="detail-row ${i===0?'active':''}"><span>${r}</span><span>${i===0?new Date().toLocaleDateString('en-GB'):''}</span></button>`).join('')}</div>`);bindPopupButtons(x)}
function bindPopupButtons(x){let bs=[...x.querySelectorAll('button')],i=0;if(!bs.length){x.tabIndex=0;x.focus()}const set=n=>{i=(n+bs.length)%bs.length;bs.forEach((b,j)=>b.classList.toggle('active',j===i));bs[i]?.focus()};x.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();x.closePopup()}else if(e.key==='ArrowDown'&&bs.length){e.preventDefault();set(i+1)}else if(e.key==='ArrowUp'&&bs.length){e.preventDefault();set(i-1)}};if(bs.length)setTimeout(()=>set(0),0)}
function voucherConfigPopup(){let opts=['Provide Supplier details','Provide Receipt Note, Order and Import details','Provide Order details','Provide Import details','Select common Ledger Account for Item Allocation','Use default Bill-wise details for Bill Allocation','Show list of Bills for selection','Show Final Balance for each Bill','Provide Additional Descriptions for Ledgers','Provide Additional Descriptions for Stock Items','Warn on negative Stock Balance','Provide Supplier Invoice details','Modify all fields during voucher entry','Select Cost Centre/Class','Show list of Cost Centres','Skip the Date field during voucher creation','Show Turnover from selected Party A/c','Show Current Balance of Ledgers','Show Balances as on Voucher date','Show final Ledger Balance','Enable Stripe View'];let x=tallyPopup('config','Voucher Configuration',`<div class="config-dialog"><div class="config-col"><h4>General Details</h4>${opts.map((o,i)=>`<button class="config-row ${i===0?'active':''}" data-val="${i%3===0?'Yes':'No'}"><span>${o}</span><b>${i%3===0?'Yes':'No'}</b></button>`).join('')}</div><div class="config-col"><h4>Bank Details</h4><button class="config-row"><span>Print Cheque after saving Voucher</span><b>No</b></button><button class="config-row"><span>Show Cheque details before printing</span><b>Yes</b></button><h4>Tax Details</h4><button class="config-row"><span>Calculate Tax on Current Subtotal</span><b>No</b></button></div></div>`);x.querySelectorAll('.config-row').forEach(b=>b.onclick=()=>{let v=b.querySelector('b');v.textContent=v.textContent==='Yes'?'No':'Yes'});bindPopupButtons(x)}

function goToPopup(){
 if(document.getElementById('gotoOv'))return;
 const previousScreen=S.screen;
 const items=[
  {name:'Ledger Vouchers',path:'Display > Account Books > Ledger',code:'DAL',run:()=>ledgerList('display')},
  {name:'Day Book',path:'Display > Day Book',code:'DD',run:()=>toast('Day Book will show vouchers after voucher entry is added.')},
  {name:'Trial Balance',path:'Display > Trial Balance',code:'TB',run:()=>toast('Trial Balance is prepared for a later build.')},
  {name:'Chart of Accounts',path:'Masters > Chart of Accounts',code:'CHA',run:chart},
  {name:'Create Ledger',path:'Create > Ledger',code:'CAL',run:()=>createLedger()},
  {name:'Alter Ledger',path:'Alter > Ledger',code:'AAL',run:()=>ledgerList('alter')},
  {name:'Create Group',path:'Create > Group',code:'CAG',run:()=>createGroup()},
  {name:'Gateway of Tabaja ERP',path:'Gateway',code:'GW',run:gateway}
 ];
 let x=document.createElement('div');x.id='gotoOv';x.className='goto-overlay';
 x.innerHTML=`<div class="goto-bar"><div class="goto-caption">Go To</div><input id="gotoInput" autocomplete="off" placeholder="Search reports and masters..."><div class="goto-hint">Enter: Open &nbsp; Esc: Close</div></div><div class="goto-results" id="gotoResults"></div>`;
 document.body.appendChild(x);
 let filtered=items.slice(),index=0;
 const draw=()=>{
  const q=gotoInput.value.trim().toLowerCase();
  filtered=items.filter(i=>!q||i.name.toLowerCase().includes(q)||i.path.toLowerCase().includes(q)||i.code.toLowerCase().includes(q));
  if(index>=filtered.length)index=0;
  gotoResults.innerHTML=filtered.length?filtered.map((i,n)=>`<button class="goto-row ${n===index?'active':''}" data-n="${n}"><span><b>${esc(i.name)}</b><small>${esc(i.path)}</small></span><kbd>${esc(i.code)}</kbd></button>`).join(''):'<div class="empty-row">No matching report</div>';
  gotoResults.querySelectorAll('.goto-row').forEach(b=>{b.onclick=()=>open(Number(b.dataset.n));b.onmouseenter=()=>{index=Number(b.dataset.n);draw()}})
 };
 const close=()=>{x.remove();S.screen=previousScreen};
 const open=n=>{let item=filtered[n];if(!item)return; x.remove();item.run()};
 gotoInput.oninput=()=>{index=0;draw()};
 gotoInput.onkeydown=e=>{
  if(e.key==='Escape'){e.preventDefault();close()}
  else if(e.key==='ArrowDown'){e.preventDefault();if(filtered.length){index=(index+1)%filtered.length;draw()}}
  else if(e.key==='ArrowUp'){e.preventDefault();if(filtered.length){index=(index-1+filtered.length)%filtered.length;draw()}}
  else if(e.key==='Enter'){e.preventDefault();open(index)}
 };
 draw();setTimeout(()=>gotoInput.focus(),0)
}
function quitPopup(text,onYes){if(document.getElementById('quitOv'))return;const previousFocus=document.activeElement;let q=document.createElement('div');q.id='quitOv';q.className='modal-backdrop quit-backdrop';q.innerHTML=`<div class="quit-box"><div>${esc(text)}</div><div class="quit-actions"><button data-choice="yes">Yes</button><button class="active" data-choice="no">No</button></div></div>`;document.body.appendChild(q);let buttons=[...q.querySelectorAll('button')],i=1;const set=n=>{i=(n+2)%2;buttons.forEach((b,j)=>b.classList.toggle('active',j===i));buttons[i].focus()};buttons.forEach((b,j)=>b.onclick=()=>{if(j===0){q.remove();onYes()}else{q.remove();setTimeout(()=>{if(previousFocus&&document.contains(previousFocus))previousFocus.focus({preventScroll:true});else document.querySelector('.menu-btn.active,.menu-btn')?.focus({preventScroll:true})},0)}});q.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Tab'){e.preventDefault();set(i===0?1:0)}else if(e.key==='Enter'){e.preventDefault();buttons[i].click()}else if(e.key==='Escape'||e.key.toLowerCase()==='n'){e.preventDefault();buttons[1].click()}else if(e.key.toLowerCase()==='y'){e.preventDefault();buttons[0].click()}};set(1)}
function toast(t){let e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2200)}
function backupAll(){let out={version:'alpha-9',companies:DB.companies(),data:{}};out.companies.forEach(c=>out.data[c.id]=DB.data(c.id));let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));a.download='tabaja-erp-alpha-9-backup.json';a.click()}
restoreInput.onchange=async e=>{try{let o=JSON.parse(await e.target.files[0].text());DB.saveCompanies(o.companies||[]);Object.entries(o.data||{}).forEach(([id,v])=>DB.save(id,v));hub()}catch{alert('Invalid backup file')}};
function focusables(root=document){return [...root.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null)}
function bindMenu(selector){const items=[...document.querySelectorAll(selector)];if(!items.length)return;let i=0;const set=n=>{i=(n+items.length)%items.length;items.forEach((x,j)=>{x.classList.toggle('active',j===i);x.tabIndex=j===i?0:-1});items[i].focus({preventScroll:true})};items.forEach((x,j)=>x.addEventListener('focus',()=>{i=j;items.forEach((a,k)=>a.classList.toggle('active',k===i))}));set(0)}
function setupFormKeyboard(form,onCancel){form.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();onCancel();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();form.requestSubmit();return}if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();const list=focusables(form);let i=list.indexOf(e.target),next=list[i+1];if(!next||e.target.type==='submit')form.requestSubmit();else next.focus()}});setTimeout(()=>focusables(form)[0]?.focus(),0)}
function handleMenuKeys(e,root=document){const items=[...root.querySelectorAll('.menu-btn,.master-list button,.list-row')].filter(x=>x.offsetParent!==null);if(!items.length)return false;let i=items.indexOf(document.activeElement);if(i<0)i=items.findIndex(x=>x.classList.contains('active'));if(e.key==='ArrowDown'){e.preventDefault();items[(i+1+items.length)%items.length].focus();return true}if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length].focus();return true}if(e.key==='Enter'&&items.includes(document.activeElement)){e.preventDefault();document.activeElement.click();return true}if(!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key.length===1){let k=e.key.toLowerCase(),match=items.find(x=>x.dataset.key===k);if(match){e.preventDefault();match.click();return true}}return false}
const KeyboardEngine={
 enabled:true,
 isTypingTarget(el=document.activeElement){return !!el&&['INPUT','TEXTAREA','SELECT'].includes(el.tagName)},
 stop(e){e.preventDefault();e.stopImmediatePropagation()},
 key(e){
  const parts=[];
  if(e.ctrlKey||e.metaKey)parts.push('CTRL');
  if(e.altKey)parts.push('ALT');
  if(e.shiftKey)parts.push('SHIFT');
  parts.push(e.key.length===1?e.key.toUpperCase():e.key.toUpperCase());
  return parts.join('+')
 },
 restoreFocus(){
  setTimeout(()=>{
   const preferred=S.focusKey&&document.querySelector(`[data-focus-key="${S.focusKey}"]`);
   const target=preferred||document.querySelector('.menu-btn.active,.list-row.active,.master-list button.active,.open-company,.menu-btn,button,input,select,textarea');
   if(target&&document.contains(target))target.focus({preventScroll:true})
  },0)
 },
 rememberFocus(){
  const el=document.activeElement;
  if(!el)return;
  if(!el.dataset.focusKey)el.dataset.focusKey=el.id||`focus-${Date.now().toString(36)}`;
  S.focusKey=el.dataset.focusKey
 },
 closeOverlay(){
  const ov=document.getElementById('ov');
  if(!ov)return false;
  ov.remove();
  if(S.screen==='ledgerList')gateway();
  else if(S.screen==='accountBooks')displayMenu();
  else if(['displayMenu','createMenu','alterMenu'].includes(S.screen))gateway();
  this.restoreFocus();
  return true
 },
 handleQuit(e){
  const q=document.getElementById('quitOv');
  if(!q)return false;
  const k=this.key(e);
  if(k==='ESCAPE'||k==='N'){this.stop(e);q.querySelector('[data-choice="no"]')?.click()}
  else if(k==='Y'){this.stop(e);q.querySelector('[data-choice="yes"]')?.click()}
  return true
 },
 handleVoucher(e){
  if(S.screen!=='voucher')return false;
  const k=this.key(e);
  if(k==='ESCAPE'){if(e.target?.closest?.('.ve-cell'))return true;this.stop(e);veCloseContext(false);veResetDraft();gateway();return true}
  const map={F2:'date',F3:'company',F4:'Contra',F5:'Payment',F6:'Receipt',F7:'Journal',F8:'Sales',F9:'Purchase',F10:'types',F12:'config','ALT+F5':'Debit Note','ALT+F6':'Credit Note','ALT+F7':'Stock Journal','CTRL+F7':'Physical Stock'};
  if(map[k]){
   this.stop(e);const v=map[k];
   if(['Contra','Payment','Receipt','Journal','Sales','Purchase','Debit Note','Credit Note','Stock Journal','Physical Stock'].includes(v)){V.type=v;voucherEntry()}
   else voucherAction({dataset:{act:v},classList:{contains:()=>false}});
   return true
  }
  if(!this.isTypingTarget()&&['H','I','L','T'].includes(k)){
   this.stop(e);voucherAction({dataset:{act:{H:'mode',I:'details',L:'optional',T:'postdated'}[k]},classList:{contains:()=>false}});return true
  }
  return false
 },
 handleEscape(e){
  if(e.key!=='Escape')return false;
  this.stop(e);
  if(this.closeOverlay())return true;
  if(S.screen==='ledgerDisplay'){ledgerList('display');return true}
  if(S.screen==='chart'){gateway();return true}
  if(S.screen==='gateway'){quitPopup('Quit?',()=>{sessionStorage.clear();S.user=null;S.companyId=null;login()});return true}
  if(S.screen==='hub'){quitPopup('Quit?',()=>{sessionStorage.clear();S.user=null;login()});return true}
  if(S.screen==='companyForm'){hub();return true}
  return true
 },
 handleGlobal(e){
  const k=this.key(e),typing=this.isTypingTarget();
  if(k==='F4'||(k==='G'&&!typing)){this.stop(e);goToPopup();return true}
  const ov=document.getElementById('ov');
  if(ov&&handleMenuKeys(e,ov))return true;
  if(!ov&&handleMenuKeys(e,document))return true;
  if(!ov&&S.screen==='gateway'&&!typing&&e.key.length===1){
   const map={c:createMenu,a:alterMenu,h:chart,v:()=>{veResetDraft();voucherEntry()},d:displayMenu,q:()=>quitPopup('Quit?',()=>{sessionStorage.clear();S.user=null;S.companyId=null;login()})};
   const fn=map[e.key.toLowerCase()];if(fn){this.stop(e);fn();return true}
  }
  if(!ov&&S.screen==='hub'&&e.key==='Enter'&&document.activeElement?.classList.contains('open-company')){this.stop(e);document.activeElement.click();return true}
  return false
 },
 dispatch(e){
  if(!this.enabled||e.defaultPrevented)return;
  this.rememberFocus();
  if(this.handleQuit(e))return;
  if(document.getElementById('gotoOv')||document.getElementById('tallyOv'))return;
  if(this.handleVoucher(e))return;
  if(this.handleEscape(e))return;
  this.handleGlobal(e)
 },
 init(){document.addEventListener('keydown',e=>this.dispatch(e),true)}
};
KeyboardEngine.init();
render();
