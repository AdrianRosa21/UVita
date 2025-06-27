import time
import mysql.connector
import requests

# ----------- Configuración MySQL ----------
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'uvita'
}

# ----------- Configuración WiFi NodeMCU ----------
esp_ip = "http://192.1.2.123"  
# ----------- Última Acción Enviada -----------
last_sent = {1: None, 2: None, 3: None}

def get_last_actions():
    actions = {}
    try:
        cnx = mysql.connector.connect(**db_config)
        cursor = cnx.cursor(dictionary=True)

        query = """
        SELECT id_luz, accion
        FROM accion_luz
        WHERE programada = 0
        AND id_luz IN (1,2,3)
        AND ts = (
            SELECT MAX(ts) FROM accion_luz AS sub
            WHERE sub.id_luz = accion_luz.id_luz AND programada = 0
        )
        """
        cursor.execute(query)

        for row in cursor.fetchall():
            actions[row['id_luz']] = row['accion']

        cursor.close()
        cnx.close()
    except Exception as e:
        print(f"[ERROR] DB: {e}")
    return actions

def enviar_http(luz, accion):
    try:
        url = f"{esp_ip}/control?luz={luz}&accion={accion}"
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            print(f"[HTTP] OK enviado → {url}")
        else:
            print(f"[HTTP] Error: {response.status_code} → {url}")
    except Exception as e:
        print(f"[ERROR] HTTP a ESP8266: {e}")

# ----------- Bucle Principal ----------
print("[INFO] Iniciando envío de acciones vía WiFi...")
while True:
    acciones_actuales = get_last_actions()

    for luz in [1, 2, 3]:
        accion = acciones_actuales.get(luz)
        if accion and accion != last_sent[luz]:
            enviar_http(luz, accion)
            last_sent[luz] = accion

    time.sleep(10)  # Consulta cada 10 segundos
