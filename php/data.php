<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
// Estas cabeceras HTTP indican al navegador que no debe almacenar en caché la respuesta,
header('Content-Type: application/json');
//establece una cabecera HTTP que indica al cliente (por ejemplo, 
// un navegador web o una aplicación) que la respuesta que recibirá del servidor estará en formato JSON 
$conexion = new mysqli("localhost", "root", "", "uvita");
if ($conexion->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conexion->connect_error]));
}

// Consulta de las 10 últimas filas por tabla
function obtenerDatos($conexion, $tabla, $orderBy) {
    $sql = "SELECT * FROM $tabla ORDER BY $orderBy DESC LIMIT 10";
    $resultado = $conexion->query($sql);
    $datos = [];

    if ($resultado && $resultado->num_rows > 0) {
        while ($fila = $resultado->fetch_assoc()) {
            $datos[] = $fila;
        }
    }
    return $datos;
}

$respuesta = [
    "agenda" => obtenerDatos($conexion, "agenda", "fecha"),
    "control_general" => obtenerDatos($conexion, "control_general", "id_general"),
    "sensor_ambiente" => obtenerDatos($conexion, "sensor_ambiente", "id_sensor"),
    "sensor_bateria" => obtenerDatos($conexion, "sensor_bateria", "id_bateria"),
    "sensor_luz" => obtenerDatos($conexion, "sensor_luz", "id_luz")
];

// --- Datos para el gráfico de energía (últimos 10 %-batería con su fecha) ---
function obtenerEnergia($conexion) {
    $sql = "
        SELECT a.fecha, b.porcentaje
        FROM agenda      a
        JOIN control_general c ON c.id_agenda = a.id_agenda
        JOIN sensor_bateria  b ON b.id_general = c.id_general
        ORDER BY a.fecha DESC
        LIMIT 10
    ";
    $datos = [];
    if ($res = $conexion->query($sql)) {
        while ($f = $res->fetch_assoc()) $datos[] = $f;
    }
    return $datos;
}
$respuesta["energia"] = obtenerEnergia($conexion);
// ---- datos para el porcentaje de batería actual ----
// Esta función obtiene el último porcentaje de batería registrado en la base de datos
function obtenerUltimaBateria($conexion) {
    $sql = "SELECT porcentaje FROM sensor_bateria ORDER BY id_bateria DESC LIMIT 1";
    $res = $conexion->query($sql);
    if ($res && $fila = $res->fetch_assoc()) {
        return $fila["porcentaje"];
    }
    return null;
}

$respuesta["bateria_actual"] = obtenerUltimaBateria($conexion);

echo json_encode($respuesta, JSON_PRETTY_PRINT);
?>