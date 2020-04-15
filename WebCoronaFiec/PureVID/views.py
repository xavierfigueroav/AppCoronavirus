from django.shortcuts import render, redirect
from .models import *
from .forms import *

# Create your views here.
import sys
from django.contrib.auth import authenticate, login, logout
from django.http import (
    HttpResponse,
    JsonResponse,
    HttpResponseRedirect,
    HttpResponseNotFound,
)
import json
import requests
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def login_laboratorista(request):
	datos = json.loads(str(request.body)[2:-1])
	print(datos)
	usuario = datos.get("username")
	password = datos.get("password")
	parametros = {"tabla" : "integracion_claves_labolatorista",
	"operador": "and",
	"columnas" : ["nombre"],
	"condiciones" : [
		{
			"columna" : "user",
			"comparador" : "==",
			"valor" : usuario
		},
		{
			"columna" : "pass",
			"comparador" : "==",
			"valor" : password
		}
		]
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
	respuesta = json.loads(response.text)
	if len(respuesta.get("data")) == 0:
		return HttpResponse(json.dumps({"mensaje": "usuario o contraeña Incorrectos", "respuesta":False}, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')		
	return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')


@csrf_exempt
def login_recolector(request):
	datos = json.loads(str(request.body)[2:-1])
	print(datos)
	usuario = datos.get("username")
	password = datos.get("password")
	parametros = {"tabla" : "integracion_claves_recolectores",
	"operador": "and",
	"columnas" : ["nombre"],
	"condiciones" : [
		{
			"columna" : "user",
			"comparador" : "==",
			"valor" : usuario
		},
		{
			"columna" : "pass",
			"comparador" : "==",
			"valor" : password
		}
		]
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
	respuesta = json.loads(response.text)
	if len(respuesta.get("data")) == 0:
		return HttpResponse(json.dumps({"mensaje": "usuario o contraeña Incorrectos", "respuesta":False}, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')		
	return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')


@csrf_exempt
def clave_app(request):
	datos = json.loads(str(request.body)[2:-1])
	print(datos)
	cedula = datos.get("cedula")
	parametros = {"tabla" : "integracion_usuario",
	"operador": "and",
	"columnas" : ["telefono_id"],
	"condiciones" : [
		{
			"columna" : "cedula",
			"comparador" : "==",
			"valor" : cedula
		}
		]
	}
	datos = json.dumps(parametros)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
	respuesta = json.loads(response.text)
	if len(respuesta.get("data")) == 0:
		parametros = {"tabla" : "integracion_claves_app",
		"operador": "and",
		"columnas" : ["app_id"],
		"condiciones" : [
			{
				"columna" : "en_uso",
				"comparador" : "==",
				"valor" : 0
			}
			]
		}
		datos = json.dumps(parametros)
		response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
		respuesta = json.loads(response.text)
		codigo = response.get("data")[0].get("app_id")
		parametros={"tabla": "integracion_usuario",
			"operador": "and",
			"valores": {
				"telefono_id":codigo
			},
			"condiciones": [
				{
					"columna": "cedula",
					"comparador": "==",
					"valor": cedula
				}
			]
		}
		datos = json.dumps(parametros)
		response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
		respuesta = json.loads(response.text)
		parametros={"tabla": "integracion_claves_app",
			"operador": "and",
			"valores": {
				"en_uso":1
			},
			"condiciones": [
				{
					"columna": "app_id",
					"comparador": "==",
					"valor": codigo
				}
			]
		}
		datos = json.dumps(parametros)
		response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
		respuesta = {"data": [
		        {
		            "telefono_id": codigo
		        }
		    ],
		    "mensaje": "",
		    "success": False
		}
		return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')

	return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')

@csrf_exempt
def registro_muestra(request):
	#datos = json.loads(str(request.body)[2:-1])
	
	#codigo_muestra = datos.get("codigo_muestra")
	#cedula = datos.get("cedula")
	#codigo_lab = datos.get("codigo_lab")
	
	datos = str(request.body).split("&")

	codigo_muestra = datos[3].split("=")[1]
	cedula = datos[1].split("=")[1]
	codigo_lab = datos[2].split("=")[1]

	parametros = {"tabla" : "integracion_pruebas",
	"operador": "and",
	"valores": {
		"muestra_id":codigo_muestra,
		"lab_id": codigo_lab
	},
	"condiciones" : [
		{
			"columna" : "cedula",
			"comparador" : "==",
			"valor" : cedula
		}
		]
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/update', data = datos)
	respuesta = json.loads(response.text)
	return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')


@csrf_exempt
def muestras_lab(request):
	datos = json.loads(str(request.body)[2:-1])
	codigo_lab = datos.get("codigo_lab")
	parametros = {"tabla" : "integracion_pruebas",
	"operador": "and",
	"columnas" : ["muestra_id"],
	"condiciones" : [
		{
			"columna" : "lab_id",
			"comparador" : "==",
			"valor" : codigo_lab
		}
		]
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
	respuesta = json.loads(response.text)
	return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')

@csrf_exempt
def estado_muestra(request):
	#datos = json.loads(str(request.body)[2:-1])
	codigo_muestra = str(request.body).split("&")[1].split("=")[1]
	#codigo_muestra = datos.get("codigo_muestra")
	parametros = {"tabla" : "integracion_pruebas",
	"operador": "and",
	"columnas" : ["estado"],
	"condiciones" : [
		{
			"columna" : "muestra_id",
			"comparador" : "==",
			"valor" : codigo_muestra
		}
		]
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
	respuesta = json.loads(response.text)
	return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')



@csrf_exempt
def muestras_lab(request):
	datos = json.loads(str(request.body)[2:-1])
	codigo_lab = datos.get("codigo_lab")
	parametros = {"tabla" : "integracion_pruebas",
	"operador": "and",
	"columnas" : ["muestra_id"],
	"condiciones" : [
		{
			"columna" : "lab_id",
			"comparador" : "==",
			"valor" : codigo_lab
		}
		]
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
	respuesta = json.loads(response.text)
	print("respuesta")
	print(response.text)
	return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')

@csrf_exempt
def actualizar_estado_muestra(request):
	datos = json.loads(str(request.body)[2:-1])
	codigo_muestra = datos.get("codigo_muestra")
	estado = datos.get("estado")
	parametros = {"tabla" : "integracion_pruebas",
	"operador": "and",
	"valores": {
		"estado":estado
	},
	"condiciones" : [
		{
			"columna" : "muestra_id",
			"comparador" : "==",
			"valor" : codigo_muestra
		}
		]
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/update', data = datos)
	respuesta = json.loads(response.text)
	return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
        , content_type='application/json')

def push_muestra(request):

	if request.method == "POST":
		form = MuestraForm(request.POST)
		print(request.body)
		registro_muestra(request)
	else:
		form = MuestraForm()
	return render(request, 'PureVID/muestra.html', {'form': form})

def get_muestra(request):

	if request.method == "POST":
		form = ConsultaMuestraForm(request.POST)
		print(request.body)
		estado_muestra(request)
	else:
		form = ConsultaMuestraForm()
	return render(request, 'PureVID/consultaMuestra.html', {'form': form})