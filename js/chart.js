// Cargar el gráfico al iniciar
const ctx = document.getElementById("grafico-energia").getContext("2d");

// Simula datos de consumo para 7 días
const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const consumo = [1.2, 0.8, 1.0, 1.5, 1.1, 0.7, 1.3];

new Chart(ctx, {
  type: 'bar',
  data: {
    labels: dias,
    datasets: [{
      label: 'kWh',
      data: consumo,
      backgroundColor: '#facc15' // amarillo solar
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#d1d5db' }
      },
      x: {
        ticks: { color: '#d1d5db' }
      }
    }
  }
});