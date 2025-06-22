<?php
header('Content-Type: application/json');
$cn = new mysqli("localhost","root","","uvita");
if ($cn->connect_error) {
  http_response_code(500); exit(json_encode(["ok"=>false,"msg"=>"DB"]));
}

$id_luz = intval($_POST['id_luz'] ?? 0);
$accion = ($_POST['accion'] ?? '') === 'ON' ? 'ON' : 'OFF';
$prog   = intval($_POST['programada'] ?? 0);

$stmt = $cn->prepare(
  "INSERT INTO accion_luz (id_luz,accion,programada) VALUES (?,?,?)");
$stmt->bind_param("isi", $id_luz, $accion, $prog);

echo json_encode(["ok"=>$stmt->execute()]);
