$("#cargarDatos").click(function() {
  $.ajax({
    url: "../php/datos.php",  // tu archivo PHP
    method: "GET",
    dataType: "json",  // esperamos un JSON
    success: function(data) {
      let html = "<ul>";
      data.forEach(function(usuario) {
        html += `<li>${usuario.nombre} - ${usuario.email}</li>`;
      });
      html += "</ul>";
      $("#resultado").html(html);
    },
    error: function(err) {
      console.error("Error AJAX:", err);
    }
  });
});