const KEY='ritual-planner:v1';
const initial={tasks:[],done:{},checkins:{},low:false,notifications:false};
let state=load(),filter='Todos',view='today',timers=[];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const today=()=>new Date().toLocaleDateString('en-CA');
function load(){try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return structuredClone(initial)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render();scheduleNotifications()}
function occurs(t,d=new Date()){if(t.repeat==='once')return t.created===today();const day=d.getDay();return t.repeat==='daily'||(t.repeat==='weekly'&&t.days?.includes(day))||(t.repeat==='weekdays'&&day>0&&day<6)||(t.repeat==='weekends'&&(day===0||day===6))}
function repeatLabel(t){if(t.repeat==='daily')return'todos os dias';if(t.repeat==='weekdays')return'dias úteis';if(t.repeat==='weekends')return'fim de semana';if(t.repeat==='once')return'só hoje';const names=['dom','seg','ter','qua','qui','sex','sáb'];return(t.days||[]).map(d=>names[d]).join(', ')}
function visibleTasks(){let list=view==='habits'?state.tasks:state.tasks.filter(t=>occurs(t));if(state.low)list=list.filter(t=>t.essential);if(filter!=='Todos')list=list.filter(t=>t.category===filter);return list.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))}
function isDone(id){return !!state.done[today()]?.[id]}
function render(){
  const now=new Date(),h=now.getHours();$('#greeting').textContent=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';$('#dateLabel').textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const ci=state.checkins[today()]||{};$$('[data-mood]').forEach(b=>b.classList.toggle('selected',+b.dataset.mood===ci.mood));$$('[data-energy]').forEach(b=>b.classList.toggle('selected',+b.dataset.energy===ci.energy));
  $('#lowMode').classList.toggle('active',state.low);$('#listTitle').textContent=state.low?'Só o essencial':view==='habits'?'Todos os hábitos':'Para hoje';
  const cats=['Todos',...new Set(state.tasks.map(t=>t.category))];$('#filters').innerHTML=cats.map(c=>`<button class="${c===filter?'active':''}" data-filter="${c}">${c}</button>`).join('');
  const list=visibleTasks(),done=list.filter(t=>isDone(t.id)).length,pct=list.length?Math.round(done/list.length*100):0;$('#progressText').textContent=`${done} de ${list.length}`;$('#progressPercent').textContent=`${pct}%`;$('#progressBar').style.width=`${pct}%`;
  $('#taskList').innerHTML=list.length?list.map(t=>`<article class="task ${isDone(t.id)?'done':''}"><button class="check" data-toggle="${t.id}" aria-label="Marcar como feito">${isDone(t.id)?'✓':''}</button><div class="task-copy"><div class="task-name">${escapeHtml(t.title)}</div><div class="task-meta">${t.time?`${t.time} · `:''}${t.duration} min · ${t.category} · ${repeatLabel(t)}${t.reminder?' · lembrete':''}</div></div><button class="delete" data-delete="${t.id}" aria-label="Excluir">×</button></article>`).join(''):$('#emptyTemplate').innerHTML;
  $$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
document.addEventListener('click',e=>{
  const mood=e.target.closest('[data-mood]'),energy=e.target.closest('[data-energy]'),toggle=e.target.closest('[data-toggle]'),del=e.target.closest('[data-delete]'),f=e.target.closest('[data-filter]'),nav=e.target.closest('[data-view]');
  if(mood){state.checkins[today()]={...state.checkins[today()],mood:+mood.dataset.mood};save()} if(energy){state.checkins[today()]={...state.checkins[today()],energy:+energy.dataset.energy};save()}
  if(toggle){state.done[today()]={...state.done[today()],[toggle.dataset.toggle]:!isDone(toggle.dataset.toggle)};navigator.vibrate?.(12);save()}
  if(del&&confirm('Excluir este ritual?')){state.tasks=state.tasks.filter(t=>t.id!==del.dataset.delete);save()} if(f){filter=f.dataset.filter;render()} if(nav){view=nav.dataset.view;render()}
});
$('#lowMode').onclick=()=>{state.low=!state.low;save()};$('#openComposer').onclick=()=>$('#composer').showModal();
$('#repeatSelect').onchange=e=>{$('#weekdayPicker').hidden=e.target.value!=='weekly'};
$('#taskForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return; e.preventDefault();const fd=new FormData(e.currentTarget),time=fd.get('time'),repeat=fd.get('repeat'),days=fd.getAll('days').map(Number);if(repeat==='weekly'&&!days.length){alert('Escolha pelo menos um dia da semana.');return}state.tasks.push({id:crypto.randomUUID(),title:fd.get('title').trim(),time,category:fd.get('category'),duration:+fd.get('duration'),repeat,days,essential:fd.get('essential')==='on',reminder:fd.get('reminder')==='on'&&!!time,created:today()});e.currentTarget.reset();$('#weekdayPicker').hidden=true;$('#composer').close();save()};
function openSettings(){renderNotificationButton();$('#settings').showModal()}$('#openSettings').onclick=openSettings;$('#navSettings').onclick=openSettings;$('.close-settings').onclick=()=>$('#settings').close();
function renderNotificationButton(){const supported='Notification'in window,status=supported?Notification.permission:'unsupported';$('#enableNotifications').firstChild.textContent=state.notifications&&status==='granted'?'Notificações ativadas ':status==='denied'?'Permissão bloqueada ':'Ativar notificações '}
$('#enableNotifications').onclick=async()=>{if(!('Notification'in window)){alert('No iPhone, abra no Safari, adicione à Tela de Início e tente novamente pelo app instalado.');return}const p=await Notification.requestPermission();state.notifications=p==='granted';save();renderNotificationButton();if(p==='granted')testNotification()};
async function testNotification(){if(Notification.permission!=='granted'){alert('Ative as notificações primeiro.');return}const reg=await navigator.serviceWorker.ready;reg.showNotification('Um lembrete gentil ✦',{body:'Seu planner Ritual está pronto.',icon:'icon.svg',tag:'ritual-test'})}$('#testNotification').onclick=testNotification;
function scheduleNotifications(){timers.forEach(clearTimeout);timers=[];if(!state.notifications||!('Notification'in window)||Notification.permission!=='granted')return;const now=new Date();visibleTasks().filter(t=>t.reminder&&t.time&&!isDone(t.id)).forEach(t=>{const [h,m]=t.time.split(':').map(Number),at=new Date();at.setHours(h,m,0,0);const delay=at-now;if(delay>0&&delay<86400000)timers.push(setTimeout(async()=>{const reg=await navigator.serviceWorker.ready;reg.showNotification('Hora do seu ritual',{body:t.title,icon:'icon.svg',tag:`ritual-${t.id}-${today()}`})},delay))})}
$('#exportData').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download=`ritual-${today()}.json`;a.click();URL.revokeObjectURL(a.href)};
$('#importData').onchange=async e=>{try{state={...initial,...JSON.parse(await e.target.files[0].text())};save();alert('Backup importado.')}catch{alert('Não consegui ler esse arquivo.')}};
$('#clearData').onclick=()=>{if(confirm('Apagar todos os hábitos e registros?')){state=structuredClone(initial);save();$('#settings').close()}};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');render();scheduleNotifications();
