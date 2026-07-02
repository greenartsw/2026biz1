const cfg = window.DASHBOARD_CONFIG;
const fallbackRows = window.FALLBACK_ROWS;
const fieldTripFallbackRows = window.FIELD_TRIP_FALLBACK_ROWS || [];
const deck = document.getElementById('deck');
const slideSelect = document.getElementById('slideSelect');
const themeSelect = document.getElementById('themeSelect');
const cleanView = document.getElementById('cleanView');
const showAll = document.getElementById('showAll');
const reloadData = document.getElementById('reloadData');
const palettes = {
  light: {blue:'#246bde',teal:'#18a999',coral:'#ef6d5a',amber:'#f2b43f',violet:'#6c5bd6',sky:'#e5efff',mint:'#dff7f1',peach:'#ffe6df',lemon:'#fff0bf',lavender:'#ece8ff',navy:'#18327a'},
  dark: {blue:'#4db8ff',teal:'#35d6c8',coral:'#ff6f8a',amber:'#ffd34f',violet:'#a997ff',sky:'#123a68',mint:'#0e4c48',peach:'#5d2330',lemon:'#5a4812',lavender:'#2d255e',navy:'#081326'},
  aqua: {blue:'#35aee2',teal:'#39c3bf',coral:'#ef4f87',amber:'#f8c84e',violet:'#7a6fc0',sky:'#dff4fb',mint:'#def7f4',peach:'#ffe0ea',lemon:'#fff2c2',lavender:'#e8e3fb',navy:'#334155'},
  pulse: {blue:'#6157ff',teal:'#2fc7d3',coral:'#ff3f86',amber:'#ffb000',violet:'#8b6cff',sky:'#eceaff',mint:'#e4fbfd',peach:'#ffe4ef',lemon:'#fff2c8',lavender:'#eee9ff',navy:'#2d3748'},
  task: {blue:'#5b7cfa',teal:'#11b9c5',coral:'#ff496d',amber:'#c9f83f',violet:'#8b5cf6',sky:'#edf0ff',mint:'#e8fbf5',peach:'#ffe6ec',lemon:'#f6ffd5',lavender:'#efe9ff',navy:'#252b3a'}
};
var colors = palettes.light;
var lastRenderStatus = null;
var navStudents = [];
var fieldTripByName = {};
var fieldTripByKey = {};
function getThemeFromRoute(){
  var p=new URLSearchParams(location.search);
  var raw=(p.get('theme')||p.get('ui')||p.get('UIType')||'').toLowerCase();
  if(p.has('UITypeDark')||p.has('dark')||raw==='dark'||raw==='uitypedark') return 'dark';
  if(p.has('UITypeAquaPop')||p.has('aqua')||p.has('fresh')||raw==='aqua'||raw==='aquapop'||raw==='fresh'||raw==='uitypeaquapop') return 'aqua';
  if(p.has('UITypeMetricPulse')||p.has('pulse')||p.has('metric')||raw==='pulse'||raw==='metric'||raw==='metricpulse'||raw==='uitypemetricpulse') return 'pulse';
  if(p.has('UITypeTaskFlow')||p.has('task')||p.has('flow')||raw==='task'||raw==='flow'||raw==='taskflow'||raw==='uitypetaskflow') return 'task';
  if(p.has('UITypeLight')||p.has('light')||raw==='light'||raw==='uitypelight') return 'light';
  return 'light';
}
function applyTheme(theme,updateUrl){
  theme=palettes[theme]?theme:'light';
  colors=palettes[theme];
  document.body.dataset.theme=theme;
  document.body.classList.toggle('theme-dark',theme==='dark');
  document.body.classList.toggle('theme-aqua',theme==='aqua');
  document.body.classList.toggle('theme-pulse',theme==='pulse');
  document.body.classList.toggle('theme-task',theme==='task');
  if(themeSelect) themeSelect.value=theme;
  if(updateUrl){
    var url=new URL(location.href);
    ['UITypeDark','UITypeLight','UITypeAquaPop','UITypeMetricPulse','UITypeTaskFlow','dark','light','aqua','fresh','pulse','metric','task','flow','theme','ui','UIType'].forEach(function(k){url.searchParams.delete(k);});
    if(theme==='dark') url.searchParams.set('UITypeDark','1');
    else if(theme==='aqua') url.searchParams.set('UITypeAquaPop','1');
    else if(theme==='pulse') url.searchParams.set('UITypeMetricPulse','1');
    else if(theme==='task') url.searchParams.set('UITypeTaskFlow','1');
    else url.searchParams.set('UITypeLight','1');
    history.replaceState(null,'',url);
  }
}
applyTheme(getThemeFromRoute(),false);
function updateViewportScale(){
  var isCapture=document.body.classList.contains('capture');
  var isSingle=document.body.classList.contains('single-view')||isCapture;
  var toolbar=isCapture?0:(document.querySelector('.screen-toolbar')?document.querySelector('.screen-toolbar').offsetHeight:0);
  var pad=Math.min(72,Math.max(18,window.innerWidth*0.04));
  var widthScale=(window.innerWidth-pad*2)/1600;
  var heightScale=isSingle?(window.innerHeight-toolbar-pad*2)/900:Infinity;
  var scale=Math.max(0.2,Math.min(widthScale,heightScale,1));
  document.documentElement.style.setProperty('--slide-scale',scale.toFixed(4));
  document.documentElement.style.setProperty('--stage-pad-px',pad.toFixed(0)+'px');
  document.documentElement.style.setProperty('--toolbar-height-px',toolbar+'px');
}
window.addEventListener('resize',updateViewportScale);
function n(v){ if(v===null||v===undefined||v==='') return 0; return Number(String(v).replace(/[%점, ]/g,''))||0; }
function one(v){ return Number(n(v)).toFixed(1); }
function avg(a){ return a.length ? a.reduce(function(x,y){return x+n(y);},0)/a.length : 0; }
function sum(a,k){ return a.reduce(function(x,y){return x+n(y[k]);},0); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
function signed(v){ return (n(v)>=0?'+':'')+one(v); }
function officialProjectLabel(){ var p=cfg.projectModel&&cfg.projectModel.officialProjects&&cfg.projectModel.officialProjects[0]; return p ? p.id+'('+p.company+')' : '정식 프로젝트'; }
function shortProjectLabel(){ var p=cfg.projectModel&&cfg.projectModel.officialProjects&&cfg.projectModel.officialProjects[0]; return p ? p.id : '프로젝트'; }
function pblLabel(){ return cfg.projectModel&&cfg.projectModel.unit7 ? cfg.projectModel.unit7.label : '능력단위7 PBL'; }
function tone(v){ return n(v)>=92?'teal':n(v)>=86?'blue':n(v)>=80?'amber':'coral'; }
function soft(t){ return {blue:'sky',teal:'mint',coral:'peach',amber:'lemon',violet:'lavender'}[t]||'sky'; }
function groupOf(s){ if(s.attendance<90) return '출석관리'; if(s.fit>=94) return '최우수'; if(s.project>=91||s.grade==='A') return '협업강점'; if(s.fit>=91) return '우수'; if(s.final<80||s.fit<85) return '보완'; if(s.growth>=4) return '성장'; return '안정'; }
function tagOf(s){ return {최우수:'기업 제안 최우선',우수:'기업 제안 우선군',협업강점:''+officialProjectLabel()+' 협업 강점',출석관리:'출석 안정화 필요',보완:'기초 역량 보완',성장:'성장 스토리 강조',안정:'지표 안정군'}[s.group]||'개인 성장 현황'; }
function commentsFor(s){ var st=[], dev=[]; if(s.attendance>=98) st.push('출석 지표 우수'); if(s.self>=98) st.push('SELF CHECK 자기점검 우수'); if(s.project>=90) st.push(''+officialProjectLabel()+' 수행 완성도 높음'); if(s.fit>=91) st.push('채용 적합도 우수'); if(!st.length) st.push('과정 참여 흐름 안정'); if(s.attendance<90) dev.push('출석률 90% 미만 보완 필요'); if(s.final<80) dev.push('본(재)평가 기초 역량 보완'); if(s.diagnostic<75) dev.push('사전진단 낮은 단원 재점검'); if(!dev.length) dev.push('포트폴리오 설명 구조화 권장'); var ent=s.group==='보완'?'성실성은 확인되며, 기초 역량 보완 후 기업 검토가 적합합니다.':s.group==='출석관리'?'학습 성취는 양호하나 출석 안정화 계획을 함께 제시하는 것이 좋습니다.':s.group==='최우수'?'평가·출석·'+officialProjectLabel()+'가 모두 안정적인 기업 제안 최우선군입니다.':'평가와 '+officialProjectLabel()+' 흐름이 안정적이며 기업 과제 검토가 가능합니다.'; return {strengths:st,dev:dev,enterprise:ent}; }
function normalizeRow(row,i){ var s={no:i+1,name:row[0],initial:String(row[0]||'').slice(0,1),pre:n(row[1]),diagnostic:n(row[2]),final:n(row[3]),self:n(row[4]),attendedDays:n(row[5]),totalDays:n(row[6])||90,attendance:n(row[7]),peer:n(row[8]),selfEval:n(row[9]),instructor:n(row[10]),project:n(row[11]),grade:row[12]||'',fit:n(row[13]),portfolioUrl:row[14]||''}; s.growth=Number((s.final-s.pre).toFixed(1)); s.group=groupOf(s); s.tag=tagOf(s); s.notes=commentsFor(s); s.trend='사전→본재 '+signed(s.growth)+'p · SELF '+one(s.self)+' · '+officialProjectLabel()+' '+one(s.project); s.comment=s.notes.enterprise; return s; }
function normalizeRows(rows){ return rows.filter(function(r){return r&&r[0];}).map(normalizeRow); }
function rowsWithoutHeader(raw){
  if(!raw.length) return raw;
  var first=String(raw[0][0]||'').trim();
  return (/^(사전평가|훈련생|이름|성명|구분)$/.test(first)||first.indexOf('사전평가')>=0) ? raw.slice(1) : raw;
}
function parseGvizResponse(data){
  if(!data||!data.table||!data.table.rows) throw new Error('시트 응답 구조를 확인하지 못했습니다.');
  var raw=data.table.rows.map(function(r){return (r.c||[]).map(function(c){return c ? (c.f==null ? c.v : c.f) : '';});});
  return normalizeRows(rowsWithoutHeader(raw));
}
function gvizUrl(handler){
  var tqx=handler ? 'out:json;responseHandler:'+handler : 'out:json';
  return 'https://docs.google.com/spreadsheets/d/'+cfg.spreadsheetId+'/gviz/tq?gid='+cfg.gid+'&range='+encodeURIComponent(cfg.range)+'&tqx='+encodeURIComponent(tqx);
}
function loadViaJsonp(){
  return new Promise(function(resolve,reject){
    var handler='__dashboardSheetCallback_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    var script=document.createElement('script');
    var done=false;
    function cleanup(){
      if(done) return;
      done=true;
      clearTimeout(timer);
      try{ delete window[handler]; }catch(e){ window[handler]=undefined; }
      if(script.parentNode) script.parentNode.removeChild(script);
    }
    var timer=setTimeout(function(){cleanup(); reject(new Error('Google Sheets 라이브 연결 시간이 초과되었습니다. 시트 공유 권한 또는 브라우저 로그인 상태를 확인하세요.'));},9000);
    window[handler]=function(data){
      try{ var students=parseGvizResponse(data); cleanup(); resolve(students); }
      catch(e){ cleanup(); reject(e); }
    };
    script.onerror=function(){cleanup(); reject(new Error('Google Sheets JSONP 요청 실패. 시트 공유 권한 또는 쿠키 허용 상태를 확인하세요.'));};
    script.src=gvizUrl(handler)+'&cacheBust='+Date.now();
    document.head.appendChild(script);
  });
}
async function loadViaFetch(){
  var res=await fetch(gvizUrl(),{cache:'no-store'});
  if(!res.ok) throw new Error('Google Sheets 응답 오류 '+res.status);
  var text=await res.text();
  var m=text.match(/setResponse\((.*)\);?$/s);
  if(!m) throw new Error('시트 응답을 JSON으로 해석하지 못했습니다. 공유/게시 권한을 확인하세요.');
  return parseGvizResponse(JSON.parse(m[1]));
}
async function loadFromSheet(){
  try{ return await loadViaJsonp(); }
  catch(jsonpError){
    try{ return await loadViaFetch(); }
    catch(fetchError){ throw new Error(jsonpError.message+' / fetch: '+fetchError.message); }
  }
}
async function getStudents(){ try{ var students=await loadFromSheet(); return {students:students,live:true,message:'Google Sheets live 연결 중: '+cfg.sheetName+'!'+cfg.range}; }catch(e){ return {students:normalizeRows(fallbackRows),live:false,message:'라이브 시트 읽기 실패: '+e.message+' · 현재 HTML에는 임시 fallback 값이 표시됩니다.'}; } }
function parseRawRows(data){
  if(!data||!data.table||!data.table.rows) throw new Error('시트 응답 구조를 확인하지 못했습니다.');
  return data.table.rows.map(function(r){return (r.c||[]).map(function(c){return c ? (c.f==null ? c.v : c.f) : '';});});
}
function sourceGvizUrl(source,handler){
  var tqx=handler ? 'out:json;responseHandler:'+handler : 'out:json';
  return 'https://docs.google.com/spreadsheets/d/'+source.spreadsheetId+'/gviz/tq?gid='+source.gid+'&range='+encodeURIComponent(source.range)+'&tqx='+encodeURIComponent(tqx);
}
function loadSourceViaJsonp(source){
  return new Promise(function(resolve,reject){
    var handler='__dashboardSourceCallback_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    var script=document.createElement('script');
    var done=false;
    function cleanup(){ if(done) return; done=true; clearTimeout(timer); try{ delete window[handler]; }catch(e){ window[handler]=undefined; } if(script.parentNode) script.parentNode.removeChild(script); }
    var timer=setTimeout(function(){cleanup(); reject(new Error('소감 시트 라이브 연결 시간이 초과되었습니다.'));},9000);
    window[handler]=function(data){ try{ var rows=parseRawRows(data); cleanup(); resolve(rows); } catch(e){ cleanup(); reject(e); } };
    script.onerror=function(){cleanup(); reject(new Error('소감 시트 JSONP 요청 실패.'));};
    script.src=sourceGvizUrl(source,handler)+'&cacheBust='+Date.now();
    document.head.appendChild(script);
  });
}
async function loadSourceViaFetch(source){
  var res=await fetch(sourceGvizUrl(source),{cache:'no-store'});
  if(!res.ok) throw new Error('소감 시트 응답 오류 '+res.status);
  var text=await res.text();
  var m=text.match(/setResponse\((.*)\);?$/s);
  if(!m) throw new Error('소감 시트 응답을 JSON으로 해석하지 못했습니다.');
  return parseRawRows(JSON.parse(m[1]));
}
function normalizeFieldTripRows(rows){
  return rowsWithoutHeader(rows).filter(function(r){return r&&r[0];}).map(function(r){return {name:r[0],quote:r[1]||'',point:r[2]||'',ksa:r[3]||'',metaphor:r[4]||'',prompt:r[5]||''};});
}
async function loadFieldTripFromSheet(){
  var source=cfg.fieldTripSource;
  try{ return normalizeFieldTripRows(await loadSourceViaJsonp(source)); }
  catch(jsonpError){ return normalizeFieldTripRows(await loadSourceViaFetch(source)); }
}
async function getFieldTripReflections(){
  if(!cfg.fieldTripSource) return {items:normalizeFieldTripRows(fieldTripFallbackRows),live:false,message:'현장체험 소감 시트 설정 없음'};
  try{ var items=await loadFieldTripFromSheet(); return {items:items,live:true,message:'현장체험 소감 라이브 연결 중: '+cfg.fieldTripSource.sheetName+'!'+cfg.fieldTripSource.range}; }
  catch(e){ return {items:normalizeFieldTripRows(fieldTripFallbackRows),live:false,message:'현장체험 소감 라이브 읽기 실패: '+e.message+' · fallback 표시'}; }
}
function cleanPersonName(name){ return String(name||'').replace(/[\s._·-]/g,'').replace(/[O○*]/g,''); }
function personKey(name){ var s=cleanPersonName(name); return s ? s.charAt(0)+s.charAt(s.length-1) : ''; }
function buildReflectionIndex(items){
  fieldTripByName={}; fieldTripByKey={};
  (items||[]).forEach(function(item){ var clean=cleanPersonName(item.name); var key=personKey(item.name); if(clean) fieldTripByName[clean]=item; if(key) fieldTripByKey[key]=item; });
}
function reflectionFor(s){
  var direct=fieldTripByName[cleanPersonName(s.name)];
  var keyed=fieldTripByKey[personKey(s.name)];
  return direct||keyed||{name:s.name,quote:'현장체험 소감 입력 예정',point:'인쇄 실무와 개인 성장 경험 연결',ksa:'K/S/A',metaphor:'실무 학습 포인트'};
}
function fieldTripTone(ft){ var k=String(ft.ksa||''); if(k.indexOf('기술')>=0) return 'teal'; if(k.indexOf('태도')>=0) return 'amber'; if(k.indexOf('지식')>=0) return 'blue'; return 'violet'; }
function fieldTripCard(ft){
  var t=fieldTripTone(ft);
  return '<div class="card field-trip-card" style="left:666px;top:594px;width:368px;height:254px;padding:24px 26px;--trip:'+colors[t]+';--trip-soft:'+colors[soft(t)]+'"><div class="field-trip-head"><div><h2 class="card-title">현장체험 학습포인트</h2><div class="field-trip-meta">'+esc(ft.point||'인쇄 실무 현장 이해')+'</div></div><div class="field-trip-icon" title="'+esc(ft.metaphor||'3D learning icon')+'"><span class="icon-shadow"></span><span class="icon-cube"></span><span class="icon-spark"></span></div></div><div class="field-trip-bubble">'+esc(ft.quote||'현장체험 소감 입력 예정')+'</div><div class="field-trip-foot">'+esc(ft.ksa||'K/S/A')+' · '+esc(ft.metaphor||'실무 학습 포인트')+'</div></div>';
}
function galleryItems(){
  var gallery=cfg.activityGallery||{};
  var items=(gallery.items&&gallery.items.length?gallery.items:[]).slice(0,12);
  while(items.length<12) items.push('활동사진_'+String(items.length+1).padStart(2,'0')+'.jpg');
  return items.map(function(item){ return typeof item==='string' ? {file:item,label:item} : {file:item.file||item.label||'',label:item.label||item.file||''}; });
}
function gallerySrc(file){
  var gallery=cfg.activityGallery||{};
  var base=gallery.basePath||'';
  if(/^https?:\/\//.test(file)||/^data:/.test(file)||/^file:/.test(file)) return file;
  return base+file;
}
function activityGalleryCard(){
  var gallery=cfg.activityGallery||{};
  var items=galleryItems();
  return '<div class="card activity-gallery-card" style="left:1050px;top:506px;width:498px;height:342px;padding:20px 24px"><div class="activity-gallery-head"><div><h2 class="card-title">'+esc(gallery.title||'학습 활동 사진 아카이브')+'</h2><div class="card-sub">'+esc(gallery.note||'사진 폴더 기반 썸네일')+'</div></div><span class="pill" style="background:'+colors.lavender+';color:'+colors.violet+'">3 x 4</span></div><div class="activity-gallery-grid">'+items.map(function(item){return '<figure class="activity-thumb"><div class="thumb-box"><img src="'+esc(gallerySrc(item.file))+'" alt="" title="'+esc(item.label)+'"></div><figcaption>'+esc(item.label)+'</figcaption></figure>';}).join('')+'</div></div>';
}

function scorePill(v){ var t=tone(v); return '<span class="score-pill" style="background:'+colors[soft(t)]+';color:'+colors[t]+'">'+esc(v)+'</span>'; }
function passFailPill(v){ var pass=n(v)>=60; return '<span class="pass-pill '+(pass?'pass':'fail')+'">'+(pass?'PASS':'FAIL')+'</span>'; }
function progress(label,value,t){ return '<div class="progress" style="--accent:'+colors[t]+';--value:'+Math.max(2,Math.min(100,n(value)))+'%"><div class="progress-head"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div><div class="progress-track"><div class="progress-fill"></div></div></div>'; }
function kpi(label,value,note,t){ return '<div class="card kpi" style="--accent:'+colors[t]+';--soft:'+colors[soft(t)]+'"><div class="label">'+esc(label)+'</div><div class="value">'+esc(value)+'</div><div class="note">'+esc(note)+'</div></div>'; }
function navHtml(activeKey){
  var students=navStudents||[];
  var detailMenu=students.map(function(s,i){return '<button type="button" data-go="'+(i+2)+'">'+esc(s.name)+'</button>';}).join('');
  return '<div class="nav">'
    +'<div class="nav-item"><button type="button" class="nav-btn '+(activeKey==='overview'?'active':'')+'" data-go="1">전체 요약</button></div>'
    +'<div class="nav-item has-menu"><button type="button" class="nav-btn '+(activeKey==='detail'?'active':'')+'" data-go="2">훈련생 상세</button><div class="nav-menu" role="menu">'+detailMenu+'</div></div>'
    +'<div class="nav-item"><button type="button" class="nav-btn '+(activeKey==='growth'?'active':'')+'" data-go="'+(students.length+2)+'">성장추이</button></div>'
    +'<div class="nav-item"><button type="button" class="nav-btn '+(activeKey==='data'?'active':'')+'" data-go="'+(students.length+3)+'">데이터 섹션</button></div>'
    +'</div>';
}
function navKey(title,sub){
  var text=(title||'')+' '+(sub||'');
  if(text.indexOf('전체 요약')>=0||text.indexOf('최신화')>=0) return 'overview';
  if(text.indexOf('훈련생 상세')>=0||text.indexOf('개별 훈련생')>=0) return 'detail';
  if(text.indexOf('성장추이')>=0||text.indexOf('성장 분석')>=0) return 'growth';
  if(text.indexOf('데이터 섹션')>=0||text.indexOf('산정기준')>=0) return 'data';
  return '';
}
function goToSlide(slide){
  var v=String(slide||'all');
  showSlide(v);
  var url=new URL(location.href);
  if(v==='all') url.searchParams.delete('slide'); else url.searchParams.set('slide',v);
  history.replaceState(null,'',url);
}

function shell(kind,title,sub,body,idx,status){ var nav=navHtml(navKey(title,sub)); return '<section class="slide '+kind+'" data-slide="'+idx+'" data-title="'+esc(title)+'"><div class="header"><div class="eyebrow">'+esc(cfg.meta.course)+'</div><div class="title">'+esc(title)+'</div><div class="subtitle">'+esc(sub)+'</div>'+nav+'</div>'+body+'<div class="footer">데이터 기준: '+esc(cfg.sheetName)+'!'+esc(cfg.range)+' · '+(status.live?'라이브 연결':'fallback 표시')+'</div><div class="page-num">'+idx+' / __TOTAL__</div>'+(status.live?'':'<div class="status-banner">'+esc(status.message)+'</div>')+'</section>'; }
function matrixRows(students){ return students.map(function(s){return '<tr><td><strong>'+esc(s.name)+'</strong></td><td>'+passFailPill(s.final)+'</td><td>'+scorePill(s.fit)+'</td><td>'+one(s.project)+' '+esc(s.grade)+'</td><td>'+s.attendance+'%</td><td>'+esc(s.group)+'</td></tr>';}).join(''); }
function riskList(students){ var lowAtt=students.filter(function(s){return s.attendance<90;}).map(function(s){return s.name+' '+s.attendance+'%';}).join(' / ')||'없음'; var lowFinal=students.filter(function(s){return s.final<80;}).map(function(s){return s.name+' '+one(s.final);}).join(' / ')||'없음'; var lowFit=students.filter(function(s){return s.fit<85;}).length+'명'; return [['출석',lowAtt,'coral'],['평가',lowFinal,'blue'],['적합도','85% 미만 '+lowFit,'teal']].map(function(r){return '<p><span class="pill" style="background:'+colors[soft(r[2])]+';color:'+colors[r[2]]+'">'+r[0]+'</span> <strong style="margin-left:14px">'+esc(r[1])+'</strong></p>';}).join(''); }
function instructorBanner(){ return '<div class="card instructor-banner" style="left:812px;top:590px;width:736px;height:146px;padding:0"><div class="instructor-visual instructor-print"><span></span></div><div class="instructor-visual instructor-video"><span></span></div><div class="instructor-banner-content"><span class="pill instructor-pill">강사진 전문성</span><div class="instructor-copy"><strong>3년 연속 훈련이수자 A</strong><span>출판 강사 황혜진</span></div><div class="instructor-copy"><strong>3회 이상 연속 만족도강사 A</strong><span>영상 강사 박서연</span></div></div></div>'; }
function summary(students){ return {count:students.length,finalAvg:avg(students.map(function(s){return s.final;})),projectAvg:avg(students.map(function(s){return s.project;})),fitAvg:avg(students.map(function(s){return s.fit;})),attendance:sum(students,'attendedDays')/Math.max(1,sum(students,'totalDays'))*100,attendanceText:sum(students,'attendedDays').toLocaleString()+' / '+sum(students,'totalDays').toLocaleString()+'일',coopA:students.filter(function(s){return s.grade==='A';}).length}; }
function overview(students,idx,status){ var st=summary(students); var body='<div class="kpi-row">'+kpi('대상 훈련생',st.count+'명','시트 행 기준','blue')+kpi('본(재)평가 평균',one(st.finalAvg)+'점','이수 KPI · 60점 PASS','teal')+kpi('통합 출석률',one(st.attendance)+'%',st.attendanceText,'coral')+kpi('평균 채용 적합도',one(st.fitAvg)+'%','종합 산식','violet')+kpi(''+officialProjectLabel()+' 평균',one(st.projectAvg)+'점','동료평가+교수자협업','amber')+'</div>';
body+='<div class="card" style="left:52px;top:282px;width:730px;height:566px;padding:38px 48px"><h2 class="card-title">훈련생별 성과 매트릭스 · '+st.count+'명</h2><div class="card-sub">채용 적합도 · '+officialProjectLabel()+' · 출석 기준</div><table class="matrix matrix-compact matrix-overview" style="margin-top:12px"><thead><tr><th>훈련생</th><th>이수</th><th>채용</th><th>'+shortProjectLabel()+'</th><th>출석</th><th>관리군</th></tr></thead><tbody>'+matrixRows(students)+'</tbody></table></div>';
body+='<div class="card" style="left:812px;top:282px;width:360px;height:274px;padding:34px"><h2 class="card-title">성과분석 요약</h2>'+progress('채용 적합도',one(st.fitAvg)+'%','blue')+progress(''+officialProjectLabel()+' 평균',one(st.projectAvg)+'점','teal')+progress('A 등급 협업',st.coopA+'명','amber')+'</div>';
body+='<div class="card" style="left:1192px;top:282px;width:356px;height:274px;padding:34px"><h2 class="card-title">운영 리스크</h2>'+riskList(students)+'</div>';
body+=instructorBanner();
return shell('', '훈련생 성장 대시보드 최신화', '기준일 2026-07-02 · 전체 요약', body, idx, status); }
function lineChart(vals,labels,t){ var w=520,h=190,min=60,max=100; var pts=vals.map(function(v,i){return [44+i*((w-88)/(vals.length-1)),24+(1-(n(v)-min)/(max-min))*112];}); var poly=pts.map(function(p){return p.join(',');}).join(' '); var s='<svg class="svg-chart" viewBox="0 0 '+w+' '+h+'" width="100%" height="100%">'; for(var i=0;i<4;i++) s+='<line x1="44" y1="'+(24+i*36)+'" x2="476" y2="'+(24+i*36)+'" stroke="#e8eef7"/>'; s+='<polyline fill="none" stroke="'+colors[t]+'" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" points="'+poly+'"/>'; pts.forEach(function(p,i){s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="8" fill="'+colors[t]+'" stroke="#fff" stroke-width="3"/><text x="'+p[0]+'" y="172" text-anchor="middle" font-size="12">'+esc(labels[i])+'</text>';}); return s+'</svg>'; }
function analysisRows(s){ return [['강점',s.notes.strengths[0],'teal'],['보완',s.notes.dev[0],'coral'],['다음',s.tag,'blue']].map(function(r,i){return '<div style="display:flex;gap:20px;align-items:flex-start;margin-top:'+(i?26:20)+'px"><span class="pill" style="background:'+colors[soft(r[2])]+';color:'+colors[r[2]]+'">'+esc(r[0])+'</span><strong style="font-size:17px;line-height:1.4">'+esc(r[1])+'</strong></div>';}).join(''); }
function teamStatsFor(s){
  var roster=rosterForStudent(s);
  var students=studentsForRoster(roster,s);
  var sorted=students.slice().sort(function(a,b){return b.fit-a.fit;});
  var myKey=personKey(s.name);
  var rankIndex=sorted.findIndex(function(x){return personKey(x.name)===myKey;});
  var rank=Math.max(1,rankIndex+1);
  var percentile=Math.round((1-(rank-1)/Math.max(1,students.length))*100);
  var groups=students.reduce(function(acc,x){acc[x.group]=(acc[x.group]||0)+1;return acc;},{});
  return {id:roster.id,roster:roster,count:students.length,rank:rank,percentile:percentile,fitAvg:avg(students.map(function(x){return x.fit;})),finalAvg:avg(students.map(function(x){return x.final;})),selfAvg:avg(students.map(function(x){return x.self;})),projectAvg:avg(students.map(function(x){return x.project;})),attendanceAvg:avg(students.map(function(x){return x.attendance;})),growthAvg:avg(students.map(function(x){return x.growth;})),groups:groups,top:sorted[0]||s};
}
function deltaLabel(value,team,suffix){ var d=n(value)-n(team); return (d>=0?'+':'')+one(d)+(suffix||''); }
function teamCompare(label,value,team,t,suffix){
  var pct=Math.max(2,Math.min(100,n(value)));
  return '<div class="team-compare" style="--accent:'+colors[t]+';--value:'+pct+'%"><div class="team-compare-head"><span>'+esc(label)+'</span><strong>'+esc(value)+(suffix||'')+'</strong></div><div class="team-compare-track"><div class="team-compare-fill"></div></div><div class="team-compare-foot">팀 평균 '+one(team)+(suffix||'')+' · '+deltaLabel(value,team,suffix)+'</div></div>';
}
function groupBadges(groups,count){
  return Object.keys(groups).sort(function(a,b){return groups[b]-groups[a];}).map(function(k,i){var toneName=['teal','blue','violet','amber','coral'][i%5]; return '<span class="team-badge" style="background:'+colors[soft(toneName)]+';color:'+colors[toneName]+'">'+esc(k)+' '+groups[k]+'명</span>';}).join('');
}
function maskDisplayName(name){
  var s=String(name||'').trim();
  if(!s) return '';
  if(/[O○*]/.test(s)) return s;
  return s.length<=2 ? s.charAt(0)+'O' : s.charAt(0)+'O'+s.charAt(s.length-1);
}
function safeExternalUrl(url){
  var u=String(url||'').trim();
  if(!u) return '';
  if(/^https?:\/\//i.test(u)) return u;
  if(/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(u)) return 'https://'+u;
  return '';
}
function portfolioUrlFor(s){
  var links=cfg.portfolioLinks||{};
  var raw=s.portfolioUrl||links[s.name]||links[maskDisplayName(s.name)]||links[personKey(s.name)]||'';
  return safeExternalUrl(raw);
}
function shortPortfolioUrl(url){ return String(url||'').replace(/^https?:\/\//i,'').replace(/\/$/,'').slice(0,30); }
function portfolioLinkBlock(s){
  var url=portfolioUrlFor(s);
  if(url){
    var qr='https://api.qrserver.com/v1/create-qr-code/?size=132x132&margin=8&data='+encodeURIComponent(url);
    return '<a class="qr-mini qr-live" href="'+esc(url)+'" target="_blank" rel="noopener"><img src="'+esc(qr)+'" alt="포트폴리오 QR"></a><b><a href="'+esc(url)+'" target="_blank" rel="noopener">포트폴리오<br>바로가기</a><small>'+esc(shortPortfolioUrl(url))+'</small></b>';
  }
  return '<div class="qr-mini qr-empty" title="포트폴리오 링크 준비중"></div><b>포트폴리오<br>링크 준비중<small>URL 입력 시 QR 자동 생성</small></b>';
}
function rosterForStudent(s){
  var rosters=cfg.teamRosters||[];
  var key=personKey(s.name);
  return rosters.find(function(r){return (r.members||[]).some(function(m){return personKey(m)===key;});})||{id:'팀',members:(navStudents||[]).map(function(x){return x.name;})};
}
function studentsForRoster(roster,fallback){
  var keys=(roster.members||[]).map(personKey);
  var matched=(navStudents||[]).filter(function(x){return keys.indexOf(personKey(x.name))>=0;});
  return matched.length ? matched : [fallback];
}
function teamRosterHtml(roster){
  return '<div class="team-roster"><strong>'+esc(roster.id)+'.</strong><span>'+esc((roster.members||[]).map(maskDisplayName).join(', '))+'</span></div>';
}
function studentSlide(s,idx,status){
  var team=teamStatsFor(s);
  var ft=reflectionFor(s);
  var body='<div class="split-label personal-label">개인 성장 분석</div><div class="split-label team-label">팀 비교</div>';
  body+='<div class="card student-hero" style="left:52px;top:126px;width:982px;height:174px;padding:30px 34px"><div class="student-head"><div class="pill student-avatar" style="background:'+colors.sky+';color:'+colors.blue+'">'+esc(s.initial)+'</div><div><h2 class="card-title">'+esc(s.name)+'</h2><div class="card-sub">기맞1 · 출판&광고 · 개인 성장 현황</div><div class="student-tags"><span class="pill" style="background:'+colors.mint+';color:'+colors.teal+'">'+esc(s.group)+' 관리군</span><span class="pill" style="background:'+colors.sky+';color:'+colors.blue+'">'+team.id+' '+team.rank+' / '+team.count+'위</span><span class="pill" style="background:'+colors.lemon+';color:'+colors.amber+'">상위 '+team.percentile+'%</span></div></div></div><div class="student-mini-grid"><div><span>채용</span><strong>'+s.fit+'%</strong></div><div><span>출석</span><strong>'+s.attendance+'%</strong></div><div><span>본(재)</span><strong>'+one(s.final)+'</strong></div><div><span>성장</span><strong>'+signed(s.growth)+'</strong></div></div></div>';
  body+='<div class="card" style="left:52px;top:324px;width:590px;height:246px;padding:28px 32px"><h2 class="card-title">개인 성장 추이</h2><div class="card-sub">'+esc(s.trend)+'</div><div style="height:154px;margin-top:14px">'+lineChart([s.pre,s.diagnostic,s.self,s.final,s.project,s.attendance],['사전','진단','SELF','본재',shortProjectLabel(),'출석'],'teal')+'</div></div>';
  body+='<div class="card" style="left:666px;top:324px;width:368px;height:246px;padding:28px"><h2 class="card-title">핵심 지표</h2>'+progress('채용 적합도',s.fit+'%','blue')+progress('SELF CHECK',one(s.self),'violet')+progress(shortProjectLabel(),one(s.project)+' '+s.grade,'amber')+'</div>';
  body+='<div class="card" style="left:52px;top:594px;width:590px;height:254px;padding:28px 30px"><h2 class="card-title">개인별 강점·보완 제안</h2><div class="two-col student-notes"><div><h3>강점</h3><p>'+s.notes.strengths.map(esc).join('<br>')+'</p></div><div><h3>보완</h3><p>'+s.notes.dev.map(esc).join('<br>')+'</p></div></div><div class="student-action"><strong>다음 액션</strong><span>'+esc(s.notes.dev[0])+'</span></div></div>';
  body+=fieldTripCard(ft);
  body+='<div class="card team-panel" style="left:1060px;top:126px;width:488px;height:232px;padding:30px"><h2 class="card-title">'+team.id+' 내 위치</h2><div class="team-rank"><strong>'+team.rank+'</strong><span>/ '+team.count+'위</span></div><div class="card-sub">채용 적합도 기준 · 상위 '+team.percentile+'%</div><div class="team-summary"><div><span>개인</span><strong>'+s.fit+'%</strong></div><div><span>팀 평균</span><strong>'+one(team.fitAvg)+'%</strong></div><div><span>최고</span><strong>'+team.top.fit+'%</strong></div></div></div>';
  body+='<div class="card team-panel" style="left:1060px;top:382px;width:488px;height:238px;padding:28px 30px"><h2 class="card-title">팀 평균 대비</h2>'+teamCompare('본(재)평가',one(s.final),team.finalAvg,'blue','점')+teamCompare(shortProjectLabel(),one(s.project),team.projectAvg,'teal','점')+teamCompare('출석률',s.attendance,team.attendanceAvg,'coral','%')+'</div>';
  body+='<div class="card team-panel" style="left:1060px;top:644px;width:488px;height:204px;padding:28px 30px"><h2 class="card-title">팀 구성원과 해석</h2>'+teamRosterHtml(team.roster)+'<p class="card-sub team-comment">'+esc(s.name)+'님은 '+esc(team.id)+' 기준 '+esc(s.group)+' 관리군이며, 팀 평균 대비 채용 적합도 '+deltaLabel(s.fit,team.fitAvg,'%')+'입니다. 개인 강점은 기업 제안 문구에 우선 반영합니다.</p></div>';
  return shell('', '개별 훈련생 성장 대시보드', s.name+' · 개인 2 : 팀 1 비교', body, idx, status);
}
function growth(students,idx,status){ var vals=[avg(students.map(function(s){return s.pre;})),avg(students.map(function(s){return s.diagnostic;})),avg(students.map(function(s){return s.self;})),avg(students.map(function(s){return s.final;})),avg(students.map(function(s){return s.project;})),avg(students.map(function(s){return s.attendance;}))]; var body='<div class="card" style="left:52px;top:132px;width:730px;height:354px;padding:38px"><h2 class="card-title">역량단위 평균 변화</h2><div style="height:218px;margin-top:24px">'+lineChart(vals,['사전','진단','SELF','본재',shortProjectLabel(),'출석'],'blue')+'</div></div>';
body+='<div class="card" style="left:818px;top:132px;width:730px;height:354px;padding:38px"><h2 class="card-title">역량 성장 포인트</h2><div style="display:flex;gap:34px;margin-top:36px;align-items:end;height:190px">'+vals.slice(1).map(function(v,i){return '<div style="flex:1;text-align:center"><strong style="font-size:26px">'+one(v)+'</strong><div style="height:'+(v*1.35)+'px;background:'+[colors.blue,colors.teal,colors.violet,colors.amber,colors.coral][i]+';border-radius:6px;margin:12px auto;width:72px"></div><span>'+['진단','SELF','본재',shortProjectLabel(),'출석'][i]+'</span></div>';}).join('')+'</div></div>';
body+='<div class="card" style="left:52px;top:526px;width:964px;height:322px;padding:24px 30px"><h2 class="card-title">개인별 대표 지표 히트맵 · '+students.length+'명</h2><table class="matrix matrix-compact matrix-heatmap" style="margin-top:8px"><thead><tr><th>훈련생</th><th>사전</th><th>진단</th><th>SELF</th><th>본재</th><th>'+shortProjectLabel()+'</th><th>적합도</th><th>출석</th><th>관리 포인트</th></tr></thead><tbody>'+students.map(function(s){return '<tr><td><strong>'+esc(s.name)+'</strong></td><td>'+s.pre+'</td><td>'+one(s.diagnostic)+'</td><td>'+one(s.self)+'</td><td>'+one(s.final)+'</td><td>'+one(s.project)+'</td><td>'+scorePill(s.fit)+'</td><td>'+s.attendance+'</td><td>'+esc(s.group)+'</td></tr>';}).join('')+'</tbody></table></div>';
body+=activityGalleryCard(); return shell('', '교수자 확인용 성장 분석', '성장추이', body, idx, status); }
function criteria(students,idx,status){ var cards=[['KPI','공식 이수 판정','본(재)평가 최종점수만 적용 · 60점 이상 PASS / 미만 FAIL','blue'],['성장','성장추이 해석','사전평가·사전진단은 본(재)평가와 비교해 성장 흐름 판단','teal'],['이론','SELF CHECK','기초 이론 점검 자료 · 공식 평가점수에는 미산입','violet'],['협업',''+officialProjectLabel()+' 협업 지표','동료평가:자기평가:교수자 평가의견서 협업 부문 = 3:2:5','amber']]; var body=cards.map(function(c,i){return '<div class="card" style="left:'+(52+(i%2)*760)+'px;top:'+(140+Math.floor(i/2)*278)+'px;width:706px;height:230px;padding:38px"><span class="pill" style="background:'+colors[soft(c[3])]+';color:'+colors[c[3]]+'">'+c[0]+'</span><h2 class="card-title" style="margin-top:20px">'+c[1]+'</h2><p class="card-sub" style="font-size:18px;color:var(--ink)">'+c[2]+'</p><p class="small-note">시트 기준: '+esc(cfg.sheetName)+'</p></div>';}).join(''); body+='<div class="card" style="left:132px;top:704px;width:1336px;height:100px;background:#1e2f4d;color:#fff;padding:22px 30px"><strong style="font-size:19px;line-height:1.5;display:block">채용 적합도(기업 제안용 내부 지표) = 본(재)평가 40% + SELF CHECK 20% + '+officialProjectLabel()+' 협업/수행 지표 25% + 출석률 15%</strong><span style="font-size:14px;opacity:.82">공식 이수 판정과 분리하며, 협업 정성 의견은 기업 전달 문구와 보완 제안에 참작</span></div>'; return shell('', '산정기준 및 원데이터 적용 원칙', '데이터 섹션', body, idx, status); }

function enterpriseMetric(label,value,note,t,icon){ return '<div class="enterprise-metric metric-'+t+'"><div class="metric-icon">'+esc(icon)+'</div><div><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><em>'+esc(note)+'</em></div></div>'; }
function enterpriseInfoRow(label,value){ return '<tr><th>'+esc(label)+'</th><td>'+esc(value)+'</td></tr>'; }
function enterpriseScoreRow(label,score,max){ var pct=Math.round(n(score)/Math.max(1,n(max))*100); return '<tr><td>'+esc(label)+'</td><td>'+esc(max)+'</td><td>'+esc(one(score))+'</td><td>'+pct+'%</td></tr>'; }
function enterpriseUnitRow(label,score,grade){ return '<tr><td>'+esc(label)+'</td><td>'+esc(one(score))+'</td><td>'+esc(grade)+'</td></tr>'; }
function enterpriseBars(s){
  var items=[['기초 이론',s.self,'violet'],['본(재)평가',s.final,'blue'],['협업 수행',s.project,'teal'],['출석 안정',s.attendance,'coral'],['채용 적합',s.fit,'amber']];
  return items.map(function(it){ return '<div class="enterprise-bar"><div class="bar-head"><span>'+esc(it[0])+'</span><strong>'+one(it[1])+'</strong></div><div class="bar-track"><div class="bar-fill" style="width:'+Math.max(4,Math.min(100,n(it[1])))+'%;background:'+colors[it[2]]+'"></div></div></div>'; }).join('');
}
function enterpriseRadar(s){
  var axes=[['본재',s.final],['SELF',s.self],['협업',s.project],['출석',s.attendance],['성장',Math.max(60,Math.min(100,75+s.growth))],['적합',s.fit]];
  var cx=118, cy=104, maxR=76;
  function point(i,val,scale){ var a=-Math.PI/2+i*Math.PI*2/axes.length; var r=maxR*scale*(Math.max(45,Math.min(100,n(val)))/100); return [cx+Math.cos(a)*r, cy+Math.sin(a)*r]; }
  function poly(scale){ return axes.map(function(x,i){ var p=point(i,100,scale); return p[0].toFixed(1)+','+p[1].toFixed(1); }).join(' '); }
  var data=axes.map(function(x,i){ var p=point(i,x[1],1); return p[0].toFixed(1)+','+p[1].toFixed(1); }).join(' ');
  var lines=axes.map(function(x,i){ var p=point(i,100,1); return '<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'"/>'; }).join('');
  var labels=axes.map(function(x,i){ var a=-Math.PI/2+i*Math.PI*2/axes.length; var lx=cx+Math.cos(a)*(maxR+22); var ly=cy+Math.sin(a)*(maxR+18); return '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle">'+esc(x[0])+'</text>'; }).join('');
  return '<svg class="enterprise-radar" viewBox="0 0 236 214"><g class="radar-grid"><polygon points="'+poly(.33)+'"/><polygon points="'+poly(.66)+'"/><polygon points="'+poly(1)+'"/>'+lines+'</g><polygon class="radar-shape" points="'+data+'"/><g class="radar-labels">'+labels+'</g></svg>';
}
function enterpriseGauge(s){ return '<div class="enterprise-fit-gauge" style="--fit:'+Math.max(0,Math.min(100,n(s.fit)))+'"><div><strong>'+s.fit+'%</strong><span>채용 적합도</span></div></div><div class="fit-mini-grid"><div><strong>'+s.attendance+'%</strong><span>출석</span></div><div><strong>'+one(s.project)+'</strong><span>'+shortProjectLabel()+'</span></div><div><strong>'+s.grade+'</strong><span>협업</span></div></div>'; }
function enterprise(s,idx,status){
  var period=cfg.meta.period.replace(' ~ ',' ~ ');
  var pass=n(s.final)>=60?'PASS':'FAIL';
  var body='<section class="slide enterprise-page enterprise-v2" data-slide="'+idx+'" data-title="기업 제공용 · '+esc(s.name)+'">';
  body+='<div class="rail enterprise-rail"><span class="rail-word">기업</span><span class="rail-word">제공용</span><span class="rail-word">성장</span><span class="rail-word">대시보드</span><span class="rail-gap"></span><span class="rail-small">'+esc(cfg.meta.period)+'</span></div>';
  body+='<div class="logo-chip enterprise-logo">GREEN COMPUTER ACADEMY<br><span>기업맞춤훈련 과정</span></div><div class="enterprise-title">훈련생 성장 대시보드 <span>(기업 제공용)</span></div><div class="meta-chip enterprise-meta">'+esc(cfg.meta.course)+'<br>기준일 2026.07.02 · 개인별</div>';
  body+='<div class="enterprise-kpis enterprise-v2-kpis">'+enterpriseMetric('출석률',s.attendance+'%','참여 안정성','blue','출')+enterpriseMetric('본(재)평가',one(s.final)+'점',pass+' · 60점 기준','teal','평')+enterpriseMetric('성장률',signed(s.growth)+'점','사전 대비','coral','성')+enterpriseMetric(shortProjectLabel(),one(s.project)+'점',s.grade+' 등급','amber','협')+enterpriseMetric('채용 적합도',s.fit+'%','기업 검토 참고','violet','적')+'</div>';
  body+='<div class="card enterprise-profile-card" style="left:154px;top:214px;width:294px;height:252px"><div class="enterprise-avatar">'+esc(s.initial)+'</div><div class="profile-copy"><strong>'+esc(s.name)+'</strong><span>'+esc(cfg.meta.course)+'</span><span>관리군 '+esc(s.group)+' · '+esc(s.tag)+'</span><span>이수 판정 '+pass+' · 개인정보 마스킹 적용</span></div>'+portfolioLinkBlock(s)+'</div>';
  body+='<div class="card enterprise-chart-card" style="left:470px;top:214px;width:404px;height:252px"><div class="enterprise-card-head"><h3>성장 추이</h3><span>'+signed(s.growth)+'점 변화</span></div><div class="enterprise-line-wrap">'+lineChart([s.pre,s.diagnostic,s.final],['사전','진단','본재'],'blue')+'</div></div>';
  body+='<div class="card enterprise-radar-card" style="left:896px;top:214px;width:300px;height:252px"><div class="enterprise-card-head"><h3>역량별 평가</h3><span>6대 지표</span></div>'+enterpriseRadar(s)+'</div>';
  body+='<div class="card enterprise-bars-card" style="left:154px;top:490px;width:320px;height:226px"><div class="enterprise-card-head"><h3>능력단위별 점수</h3><span>핵심 지표</span></div>'+enterpriseBars(s)+'</div>';
  body+='<div class="card enterprise-project-card" style="left:496px;top:490px;width:390px;height:226px"><div class="enterprise-card-head"><h3>프로젝트 수행 결과</h3><span>'+officialProjectLabel()+'</span></div><table class="enterprise-project-table"><tr><th>프로젝트</th><th>평가</th><th>등급</th></tr><tr><td>'+shortProjectLabel()+'</td><td>'+one(s.project)+'점</td><td>'+esc(s.grade)+'</td></tr><tr><td>PBL</td><td>'+one((s.self+s.project)/2)+'점</td><td>참여</td></tr><tr><td>기업 검토</td><td>'+s.fit+'%</td><td>'+esc(s.group)+'</td></tr></table></div>';
  body+='<div class="card enterprise-fit-card" style="left:908px;top:490px;width:288px;height:226px"><div class="enterprise-card-head"><h3>채용 적합도</h3><span>추천 참고</span></div>'+enterpriseGauge(s)+'</div>';
  body+='<div class="card enterprise-bottom-card" style="left:154px;top:738px;width:316px;height:112px"><h3>강점</h3><p>• '+esc(s.notes.strengths[0])+'<br>• '+esc(s.notes.strengths[1]||s.tag)+'</p></div>';
  body+='<div class="card enterprise-bottom-card" style="left:492px;top:738px;width:316px;height:112px"><h3>보완점</h3><p>• '+esc(s.notes.dev[0])+'<br>• 포트폴리오 근거 자료 정리</p></div>';
  body+='<div class="card enterprise-bottom-card enterprise-opinion" style="left:830px;top:738px;width:366px;height:112px"><h3>교수자 종합 의견</h3><p>'+esc(s.notes.enterprise)+'</p><em>지도교수 · 온다쌤</em></div>';
  body+='<aside class="enterprise-report-panel"><div class="report-head"><div class="report-doc-icon"></div><div><strong>훈련생 성적 결과서</strong><span>(기업 제출용)</span></div></div><h3>훈련생 정보</h3><table class="report-table">'+enterpriseInfoRow('훈련생명',s.name)+enterpriseInfoRow('과정명','AI활용 출판&광고콘텐츠')+enterpriseInfoRow('훈련기간',period)+enterpriseInfoRow('훈련기관','그린컴퓨터아카데미')+enterpriseInfoRow('소속기업','기업 매칭 검토')+'</table><h3>평가 결과 요약</h3><table class="report-score-table"><tr><th>평가항목</th><th>배점</th><th>취득</th><th>달성률</th></tr>'+enterpriseScoreRow('본(재)평가',s.final,100)+enterpriseScoreRow('SELF CHECK',s.self,100)+enterpriseScoreRow(shortProjectLabel(),s.project,100)+enterpriseScoreRow('출석',s.attendance,100)+'<tr class="total"><td>채용 적합도</td><td>100</td><td>'+s.fit+'</td><td>'+s.fit+'%</td></tr></table><h3>능력단위별 평가 결과</h3><table class="report-unit-table"><tr><th>능력단위</th><th>점수</th><th>등급</th></tr>'+enterpriseUnitRow('기초 이론',s.self, s.self>=90?'A':'B+')+enterpriseUnitRow('본(재)평가',s.final, pass)+enterpriseUnitRow('협업 수행',s.project, s.grade)+enterpriseUnitRow('출석 안정',s.attendance, s.attendance>=95?'우수':'관리')+'</table><h3>성장 이력</h3><div class="report-growth"><div><span>사전</span><strong>'+one(s.pre)+'점</strong></div><i></i><div><span>본재</span><strong>'+one(s.final)+'점</strong></div><i></i><div><span>성장</span><strong>'+signed(s.growth)+'</strong></div></div><div class="report-confirm"><span>확인자</span><strong>지도교수 온다쌤</strong><i>확인</i></div></aside>';
  body+='<div class="footer" style="left:166px">기업 제공 참고자료 · 개인정보는 마스킹 기준에 따라 처리</div><div class="page-num">'+idx+' / __TOTAL__</div>'+(status.live?'':'<div class="status-banner">'+esc(status.message)+'</div>')+'</section>';
  return body;
}
function feedback(s,idx,status){ var body='<section class="slide feedback-page" data-slide="'+idx+'" data-title="기업 피드백 · '+esc(s.name)+'"><div class="rail teal"><span class="rail-word">기업</span><span class="rail-word">피드백</span><span class="rail-word">작업용</span><span class="rail-gap"></span><span class="rail-word">훈련생</span><span class="rail-word">성장</span><span class="rail-word">대시보드</span><span class="rail-gap"></span><span class="rail-small">'+s.no+' / __COUNT__</span></div><div class="feedback-title">기업 피드백 작업용 · '+esc(s.name)+'</div><div class="feedback-meta">AI활용 출판&광고콘텐츠 · 기업 회신 요청</div><div class="feedback-grid">';
var cards=[['훈련생 요약','<strong>'+esc(s.name)+' · 관리군 '+esc(s.group)+'</strong><br>채용 적합도 '+s.fit+'% | 출석 '+s.attendance+'%<br>본(재) '+one(s.final)+' · '+shortProjectLabel()+' '+one(s.project)+'('+s.grade+')'],['현장 적합성 체크','□ 바로 투입 가능 &nbsp; □ 단기 보완 후 가능<br>□ 포트폴리오 추가 확인 &nbsp; □ 보류'],['채용 검토','□ 면접 제안 &nbsp; □ 과제 요청 &nbsp; □ 보류<br>희망 직무/파트: __________________'],['기업 의견 - 강점','<strong>'+esc(s.notes.strengths[0])+'</strong><br><br>추가 의견: ______________________________'],['기업 의견 - 보완/교육 요청','<strong>'+esc(s.notes.dev[0])+'</strong><br><br>요청사항: ______________________________'],['채용 적합도 기준','본(재) '+one(s.final)+' · SELF '+one(s.self)+'<br>'+shortProjectLabel()+' '+one(s.project)+' · 출석 '+s.attendance+'%'],['5점 척도 기록','직무이해 &nbsp; □5 □4 □3 □2 □1<br>툴 활용 &nbsp;&nbsp;&nbsp; □5 □4 □3 □2 □1<br>협업태도 &nbsp; □5 □4 □3 □2 □1'],['회신 정보','기업명: __________________ &nbsp;&nbsp; 담당자: ______________ &nbsp;&nbsp; 회신일: 2026.__.__<br>후속 액션: □면접 □자료요청 □보류']];
cards.forEach(function(c,i){ body+='<div class="feedback-card"'+(i===7?' style="grid-column:span 2"':'')+'><div><h3>'+c[0]+'</h3>'+c[1]+'</div></div>'; });
body+='</div><div class="footer" style="left:166px">회신 후 내부 채용 검토표와 매칭 · 개인정보 마스킹 기준 적용</div><div class="page-num">'+idx+' / __TOTAL__</div>'+(status.live?'':'<div class="status-banner">'+esc(status.message)+'</div>')+'</section>'; return body; }
function buildSlides(students,status){ navStudents=students; buildReflectionIndex(status&&status.fieldTrip?status.fieldTrip.items:[]); var idx=1, slides=[]; slides.push(overview(students,idx++,status)); students.forEach(function(s){slides.push(studentSlide(s,idx++,status));}); slides.push(growth(students,idx++,status)); slides.push(criteria(students,idx++,status)); students.forEach(function(s){slides.push(enterprise(s,idx++,status));}); students.forEach(function(s){slides.push(feedback(s,idx++,status));}); var total=slides.length; deck.innerHTML=slides.map(function(html){return '<div class="slide-shell">'+html+'</div>';}).join('').replaceAll('__TOTAL__',total).replaceAll('__COUNT__',students.length); populateSelect(); applyRoute(); }
function populateSelect(){ var slides=[].slice.call(document.querySelectorAll('.slide')); slideSelect.innerHTML='<option value="all">전체</option>'+slides.map(function(s){return '<option value="'+s.dataset.slide+'">'+s.dataset.slide+'. '+s.dataset.title+'</option>';}).join(''); }
function showSlide(v){ document.querySelectorAll('.slide').forEach(function(s){ var hide=v!=='all'&&s.dataset.slide!==String(v); s.classList.toggle('single-hidden',hide); var shell=s.closest?s.closest('.slide-shell'):null; if(shell) shell.classList.toggle('single-hidden',hide); }); document.body.classList.toggle('single-view',v!=='all'); if(slideSelect.value!==String(v)) slideSelect.value=v; updateViewportScale(); }
function applyRoute(){ var p=new URLSearchParams(location.search); var sl=p.get('slide')||'all'; document.body.classList.toggle('capture',p.get('clean')==='1'); showSlide(sl); updateViewportScale(); }
async function render(){ deck.innerHTML='<section class="slide"><div class="card center-box" style="left:440px;top:330px;width:720px;height:210px"><div><h1>Google Sheets 데이터를 읽는 중</h1><p class="card-sub">'+esc(cfg.sheetName)+'!'+esc(cfg.range)+' · 현장체험 소감</p></div></div></section>'; var status=await getStudents(); status.fieldTrip=await getFieldTripReflections(); lastRenderStatus=status; buildSlides(status.students,status); }
deck.addEventListener('click',function(e){ var target=e.target.closest('[data-go]'); if(!target) return; e.preventDefault(); goToSlide(target.getAttribute('data-go')); }); slideSelect.addEventListener('change',function(){goToSlide(slideSelect.value);}); if(themeSelect) themeSelect.addEventListener('change',function(){applyTheme(themeSelect.value,true); if(lastRenderStatus) buildSlides(lastRenderStatus.students,lastRenderStatus); else render();}); showAll.addEventListener('click',function(){goToSlide('all');}); cleanView.addEventListener('click',function(){document.body.classList.toggle('capture');}); reloadData.addEventListener('click',render); updateViewportScale(); render();
