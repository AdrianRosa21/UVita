<?php
$cn = new mysqli("localhost", "root", "", "uvita");
if ($cn->connect_error) {
  http_response_code(500);
  die("DB");
}

$fecha = $_POST["fecha"];
$id_luz = intval($_POST["id_luz"]);
$accion = $_POST["accion"] ?? "ON";

$stmt = $cn->prepare("INSERT INTO agenda (fecha, id_luz, accion) VALUES (?, ?, ?)");
$stmt->bind_param("sis", $fecha, $id_luz, $accion);
echo json_encode(["ok" => $stmt->execute()]);
