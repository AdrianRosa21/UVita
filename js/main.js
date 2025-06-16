// js/main.js  (versión 2)
import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js/+esm';
Chart.register(...registerables);

// ---------- datos simulados ----------
const dias = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
let kwhSemana = [1.2,0.8,1.0,1.5,1.1,0.7,1.3];
let minutosSemana = [30,45,22,50,15,10,35];

// ---------- estado en memoria ----------
let schedule = [];  // {dia:0-6, hora:"HH:mm", uv:boolean}
const logsBody = document.getElementById("tabla-logs");

// ---------- batería random ----------
const batt = Math.floor(Math.random()*61)+40;
document.getElementById("bateria-barra").style.width = batt+"%";
document.getElementById("bateria-texto").textContent = batt+"%";

// ---------- gráficos ----------
const ctxEner = document.getElementById("grafico-energia").getContext("2d");
const ctxMins = document.getElementById("grafico-minutos").getContext("2d");

const graficoEnergia = new Chart(ctxEner,{
  type:'bar',
  data:{labels:dias, datasets:[{data:kwhSemana, backgroundColor:'#facc15'}]},
  options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
});

const graficoMinutos = new Chart(ctxMins,{
  type:'bar',
  data:{labels:dias, datasets:[{data:minutosSemana, backgroundColor:'#38bdf8'}]},
  options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
});
//------------contador asignado de veces de encendido y apagado de luces---------------
let contadorHogar1 = 0;
let contadorHogar2 = 0;
let contadorUV = 0;
let contadorHogar1apagado = 0;
let contadorHogar2apagado = 0;
let contadorUVapagado = 0;
// ---------- contador de luces ----------
function actualizarContadores(id, accion) {
  if (accion === "encendido") {
    switch(id) {
      case "interruptor-hogar1":
        contadorHogar1++;
        return contadorHogar1;
        break;
      case "interruptor-hogar2":
       contadorHogar2++;
        return contadorHogar2;
        break;
      case "interruptor-uv":
        contadorUV++;
        return contadorUV;
        break;
    }
  } else if (accion === "apagado") {
    switch(id) {
      case "interruptor-hogar1":
        contadorHogar1apagado++;
        
        return contadorHogar1apagado;
        break;
      case "interruptor-hogar2":
        
        contadorHogar2apagado++;
        return contadorHogar2apagado;
        break;
      case "interruptor-uv":
        
        contadorUVapagado++;
        return contadorUVapagado;
        break;
    }
  }
  return 0; // si no es encendido ni apagado, retornar 0
  }

// ---------- helpers ----------
function addLog(text, contador, detalle) { 
  const tr=document.createElement('tr');
  tr.innerHTML=`<td class="p-2">${dayjs().format('HH:mm')}</td><td class="p-2">${text}</td><td class="p-2">${detalle} por ${contador} vez</td>`;
  logsBody.prepend(tr);
}

// ---------- interruptores manuales ----------
document.getElementById("interruptor-hogar1").addEventListener("change",e=>{
  addLog(e.target.checked?"Encendido Luz 1":"Apagado Luz 1", e.target.checked?actualizarContadores("interruptor-hogar1", "encendido"):actualizarContadores("interruptor-hogar1", "apagado"), e.target.checked?"Encendido Luz 1":"Apagado Luz 1");
});
document.getElementById("interruptor-hogar2").addEventListener("change",e=>{
  addLog(e.target.checked?"Encendido Luz 2":"Apagado Luz 2", e.target.checked?actualizarContadores("interruptor-hogar2", "encendido"):actualizarContadores("interruptor-hogar2", "apagado"), e.target.checked?"Encendido Luz 2":"Apagado Luz 2");
});
document.getElementById("interruptor-uv").addEventListener("change",e=>{
  addLog(e.target.checked?"Encendido UV":"Apagado UV", e.target.checked?actualizarContadores("interruptor-uv","encendido"):actualizarContadores("interruptor-uv","apagado"), e.target.checked?"Encendido UV":"Apagado UV");
});

// ---------- programación ----------
const formProg=document.getElementById("form-programar");
formProg.addEventListener("submit",e=>{
  e.preventDefault();
  const dia=parseInt(document.getElementById("dia-select").value);
  const hora=document.getElementById("hora-input").value;
  const uv=document.getElementById("uv-checkbox").checked;
  if(!hora){alert("Elige una hora");return;}
  schedule.push({dia,hora,uv});
  renderProximos();
  addLog(`Programado ${uv?"UV":"Hogar"} ${dias[dia]} ${hora}`);
  formProg.reset();
});

function renderProximos(){
  const ul=document.getElementById("lista-proximos");
  ul.innerHTML="";
  schedule.forEach((s,i)=>{
    const li=document.createElement("li");
    li.textContent=`${dias[s.dia]} ${s.hora} • ${s.uv?"UV":"Hogar"}`;
    li.className="py-1 text-success";
    ul.appendChild(li);
  });
}
renderProximos();

// ---------- chequeo cada 30 s ----------
setInterval(()=>{
  const now=dayjs();
  schedule=schedule.filter(s=>{
    const prog=dayjs().day(s.dia).hour(s.hora.split(":")[0]).minute(s.hora.split(":")[1]);
    // si es para hoy y hora ≤ ahora y aún no pasó más de 1 min -> ejecutar
    if(prog.isBefore(now.add(1,'minute'))&&prog.isAfter(now.subtract(1,'minute'))){
      addLog(`Auto ${s.uv?"UV":"Hogar"} ejecutado`);
      // sumar 5 min a minutos del día actual (simulación)
      const hoy=now.day();
      minutosSemana[hoy]+=5;
      graficoMinutos.data.datasets[0].data=minutosSemana;
      graficoMinutos.update();
      return false; // eliminar de la lista
    }
    return true;
  });
  renderProximos();
},30000);

// ---------- modal ----------
document.getElementById("boton-camara").onclick=()=>document.getElementById("modal-camara").classList.remove("hidden");
document.getElementById("cerrar-modal").onclick=()=>document.getElementById("modal-camara").classList.add("hidden");
