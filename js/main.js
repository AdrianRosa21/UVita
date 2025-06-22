import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js/+esm';
Chart.register(...registerables);

const dias = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
let kwhSemana = [1.2,0.8,1.0,1.5,1.1,0.7,1.3];
let minutosSemana = [30,45,22,50,15,10,35];

let schedule = [];                   // {dia,hora,id_luz}
const logsBody = document.getElementById("tabla-logs");
const diaSelect = document.getElementById("dia-select");
const horaInput = document.getElementById("hora-input");
const luzSelect = document.getElementById("luz-select");

/* ---------------- Utils ---------------- */
function nombreLuzNum(num){ return `Luz ${num}`; }
function nombreLuzId(id){
  return id==="interruptor-hogar1" ? "Luz 1" :
         id==="interruptor-hogar2" ? "Luz 2" :
         "Luz 3";
}
function addLog(text="", contador=null, detalle=""){
  const det = contador!==null ? `${detalle} por ${contador} vez` : (detalle||"&nbsp;");
  const tr = document.createElement("tr");
  tr.innerHTML=`<td class="p-2">${dayjs().format("HH:mm")}</td>
                <td class="p-2">${text}</td>
                <td class="p-2">${det}</td>`;
  logsBody.prepend(tr);
}

/* ---------- batería ---------- */
function actualizarBateria(p){
  const barra=document.getElementById("bateria-barra"),
        txt  =document.getElementById("bateria-texto");
  barra.style.width=p+"%"; txt.textContent=p+"%";
  barra.className="h-full transition-all";
  barra.classList.add(p>=60?"bg-green-400":p>=30?"bg-yellow-400":"bg-red-500");
}

/* ---------- charts ---------- */
const ctxEner=document.getElementById("grafico-energia").getContext("2d");
const ctxMins=document.getElementById("grafico-minutos").getContext("2d");
const graficoEnergia=new Chart(ctxEner,{type:'bar',data:{labels:dias,datasets:[{data:kwhSemana,backgroundColor:'#facc15'}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
const graficoMinutos=new Chart(ctxMins,{type:'bar',data:{labels:dias,datasets:[{data:minutosSemana,backgroundColor:'#38bdf8'}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});

/* ---------- AJAX carga batería + energía ---------- */
function cargarDesdeBD(){
  $.getJSON("../UVita/php/data.php", res=>{
      const etiquetas=res.energia.map(e=>dayjs(e.fecha).format("HH:mm")).reverse();
      const datosKwh=res.energia.map(e=>+(e.porcentaje*1.5/100).toFixed(2)).reverse();
      graficoEnergia.data.labels=etiquetas;
      graficoEnergia.data.datasets[0].data=datosKwh;
      graficoEnergia.update();
      actualizarBateria(res.bateria_actual);
  });
}
cargarDesdeBD(); setInterval(cargarDesdeBD,15000);

/* ---------- contadores ---------- */
const cnt = {1:0,2:0,3:0, off1:0, off2:0, off3:0};
function actualizarContadores(id,on){
  const n = id==="interruptor-hogar1"?1:id==="interruptor-hogar2"?2:3;
  if(on){ cnt[n]++; return cnt[n]; }
  else { cnt["off"+n]++; return cnt["off"+n]; }
}

/* ---------- inserta en accion_luz ---------- */
function enviarAccion(id,on){
  const map={"interruptor-hogar1":1,"interruptor-hogar2":2,"interruptor-hogar3":3};
  $.post("../UVita/php/guardar_accion.php",
    {id_luz:map[id],accion:on?"ON":"OFF",programada:0});
}

/* ---------- listeners manuales ---------- */
["interruptor-hogar1","interruptor-hogar2","interruptor-hogar3"].forEach(id=>{
  document.getElementById(id).addEventListener("change",e=>{
    const on=e.target.checked;
    const texto=(on?"Encendido ":"Apagado ")+nombreLuzId(id);
    addLog(texto, actualizarContadores(id,on), texto);
    enviarAccion(id,on);
  });
});

/* ---------- guardar agenda en BD ---------- */
function guardarAgendaDB(dia,hora,id_luz,accion){
  const tgt=dayjs().day(dia).hour(hora.split(":")[0]).minute(hora.split(":")[1]);
  const fecha = tgt.isBefore(dayjs())?tgt.add(1,'week'):tgt;
  $.post("../UVita/php/guardar.php",
    {fecha:fecha.format("YYYY-MM-DD HH:mm:ss"), id_luz,accion});
}
/* ---------- Programar encendido ---------- */
document.getElementById("form-programar").addEventListener("submit", e=>{
  e.preventDefault();
  const dia  = +diaSelect.value;          // 0–6
  const hora = horaInput.value;           // "11:11"
  const luz  = +luzSelect.value;          // 1,2,3
  if (!hora){ alert("Elige hora"); return; }
  const accion = document.getElementById("accion-select").value;


  /* Guarda en BD */
  guardarAgendaDB(dia, hora, luz,accion);

  /* Guarda en memoria y UI */
  schedule.push({dia, hora, id_luz:luz});
  renderProximos();

  /* LOG ▶ evento + detalle */
  const nombreAccion = accion === "ON" ? "Se encenderá" : "Se apagará";
  const detalleLog = `${nombreAccion} la Luz LED ${luz} el ${dias[dia]} a las ${hora}`;
  addLog(`Programado Luz ${luz}`, null, detalleLog);

  e.target.reset();
});


/* ---------- Render próximos ---------- */
function renderProximos() {
  const ul = document.getElementById("lista-proximos");
  ul.innerHTML = "";
  schedule.forEach(s => {
    const nombreAccion = s.accion === "ON" ? "Se encenderá" : "Se apagará";
    const li = document.createElement("li");
    li.textContent = `${nombreAccion} la Luz LED ${s.id_luz} el ${dias[s.dia]} a las ${s.hora}`;
    li.className = "py-1 text-success";
    ul.appendChild(li);
  });
}

renderProximos();

/* ---------- Job cada 30 s ---------- */
setInterval(()=>{
 const now=dayjs();
 schedule=schedule.filter(s=>{
   const prog=dayjs().day(s.dia).hour(s.hora.split(':')[0]).minute(s.hora.split(':')[1]);
   if(prog.isBefore(now.add(1,'minute')) && prog.isAfter(now.subtract(1,'minute'))){
      addLog(`Auto ${nombreLuzNum(s.id_luz)} ejecutada`);
      $.post("../UVita/php/guardar_accion.php",{id_luz:s.id_luz,accion:"ON",programada:1});
      const d=now.day(); minutosSemana[d]+=5;
      graficoMinutos.data.datasets[0].data=minutosSemana; graficoMinutos.update();
      return false;
   }
   return true;
 });
 renderProximos();
},30000);
