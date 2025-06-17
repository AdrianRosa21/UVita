

// Por ahora no es necesario nada aquí, pero si querés generar logs desde JS,
// este archivo te puede ayudar a agregar filas dinámicamente a la tabla con:
function agregarEvento(hora, evento, detalle) {
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td class="p-2">${hora}</td>
    <td class="p-2">${evento}</td>
    <td class="p-2">${detalle}</td>
  `;
  document.getElementById("tabla-logs").prepend(fila);
}
