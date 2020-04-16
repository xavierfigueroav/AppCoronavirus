import requests
import json

def verificar_codigo(codigo):

	parametros = {"tabla" : "integracion_pruebas",
	"operador": "and",
	"columnas" : ["muestra_id"]
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
	respuesta = json.loads(response.text)
	for registro in respuesta.get("data"):
		if registro.get("muestra_id") == codigo:
			return True
	return False

print(verificar_codigo("1223456"))