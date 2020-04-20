from django.shortcuts import render, redirect
from django.core.mail import send_mail
from .models import *
from .forms import *
from datetime import datetime,date
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
from WebCoronaFiec.settings import EMAIL_HOST_USER

@csrf_exempt
def login_laboratorista(request):
	print(str(request.body))

	usuario = str(request.body).split("&")[1].split("=")[1]
	password = str(request.body).split("&")[2].split("=")[1][:-1]

	print(usuario)
	print(password)

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
		print("error")
		print(request.method)
		#return HttpResponse(json.dumps({"mensaje": "usuario o contraeña Incorrectos", "respuesta":False}, ensure_ascii=False).encode("utf-8")\ , content_type='application/json')		
		return render(request, 'PureVID/login.html',{'data':"usuario o contraseña Incorrectos"})
	return render(request,'PureVID/tests.html',{})


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
		response = requests.post('http://3.17.143.36:5000/api/integracion/table/update', data = datos)
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
		response = requests.post('http://3.17.143.36:5000/api/integracion/table/update', data = datos)
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
	#print(request.body)
	#datos = json.loads(str(request.body)[2:-1])
	
	#codigo_muestra = datos.get("codigo_muestra")
	#cedula = datos.get("cedula")
	#codigo_lab = datos.get("codigo_lab")
	#print(str(request.body))
	datos = str(request.body).split("&")

	codigo_muestra = datos[3].split("=")[1]
	correo = datos[4].split("=")[1][:-1]
	cedula = datos[1].split("=")[1]
	codigo_lab = datos[2].split("=")[1]
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
		codigo = respuesta.get("data")[0].get("app_id")
		parametros=	{"tabla" : "integracion_usuario",
			"datos":[ {
				"cedula":cedula,
				"telefono_id": codigo
			}],
			
		}
		datos = json.dumps(parametros)
		response = requests.post('http://3.17.143.36:5000/api/integracion/table/insert', data = datos)
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
		response = requests.post('http://3.17.143.36:5000/api/integracion/table/update', data = datos)
		respuesta = {"data": [
		        {
		            "telefono_id": codigo
		        }
		    ],
		    "mensaje": "",
		    "success": False
		}
	else:
		codigo = respuesta.get("data")[0].get("telefono_id")


	fecha_actual = date.today()
	fecha_actual_str = datetime.strftime(fecha_actual, '%Y%m%d')
	parametros = {"tabla" : "integracion_pruebas",
	"datos":[ {
		"muestra_id":codigo_muestra,
		"lab_id": codigo_lab,
		"cedula" : cedula,
		"user_lab": "USERLAB0001", #por ahora va quemado
		"recolector_id": "REC0001", #por ahora va quemado
		"app_id": codigo,
		"estado" : 0, #por ahora quemado
		"resultado": 0, #por ahora quemado
		"fecha_recoleccion": fecha_actual_str
	}],
	
	}
	datos = json.dumps(parametros)
	print(datos)
	response = requests.post('http://3.17.143.36:5000/api/integracion/table/insert', data = datos)
	print(response.text)
	respuesta = json.loads(response.text)

	#return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
    #    , content_type='application/json')
	codigo = respuesta.get("data")[0].get("telefono_id")
	text = " Te informamos que tu clave de app es: \n "
    
	text += codigo+ "\n" + "Gracias por usar la app!"
	send_mail("AppPrueba: AppKey", text, EMAIL_HOST_USER, [correo],fail_silently=False)
	
	return render(request, 'PureVID/resultadoMuestra.html',{'data':respuesta} )


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
	codigo_muestra = str(request.body).split("&")[1].split("=")[1][:-1]
	#codigo_muestra = datos.get("codigo_muestra")
	parametros = {"tabla" : "integracion_pruebas",
	"operador": "and",
	"columnas" : ["estado", "resultado"],
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
	print(respuesta)
	estado = "en proceso"
	resultado = "sin confirmar"
	if respuesta.get("data")[0].get("estado") == 1:
		estado = "procesada"
		if respuesta.get("data")[0].get("resultado") == 1:
			resultado = "positivo a COVID-19"
		elif respuesta.get("data")[0].get("resultado") == 0:
			resultado = "negativo a COVID-19"
	#return HttpResponse(json.dumps(respuesta, ensure_ascii=False).encode("utf-8")\
    #    , content_type='application/json')
	return render(request, 'PureVID/diagnostico.html',{"resultado":resultado, "estado":estado})



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
		#print(request.body)
		#registro_muestra(request)
	else:
		form = MuestraForm()
	return render(request, 'PureVID/muestra.html', {'form': form})

def get_muestra(request):

	if request.method == "POST":
		form = ConsultaMuestraForm(request.POST)
		print(request.body)
		a = estado_muestra(request)
	else:
		form = ConsultaMuestraForm()
	return render(request, 'PureVID/consultaMuestra.html', {'form': form})


def result_muestra(request):

	codigo_muestra = str(request.body).split("&")[1].split("=")[1]
	recomendacion = str(request.body).split("&")[2].split("=")[1].replace("+"," ")
	print(codigo_muestra)
	print(recomendacion)

	if 'positivo' in request.POST:
		# do subscribe
		estado = 1
		resultado = 1
		mensaje = "POSITIVO a COVID-19"
		print("positivo")

	elif 'negativo' in request.POST:
		estado = 1
		resultado = 0
		mensaje = "NEGATIVO a COVID-19"
		print("negativo")


	parametros = {"tabla" : "integracion_pruebas",
	"operador": "and",
	"valores": {
		"estado":estado,
		"resultado":resultado,
		"recomendacion":recomendacion
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
	print(respuesta)
	
	return render(request, 'PureVID/resultado.html', {'mensaje':mensaje})


@csrf_exempt
def enviar_correo(request):
	if request.method == "POST":
		datos = json.loads(request.body.decode('utf8'))
		cedula = datos.get("cedula")
		correo = datos.get("correo")
		parametros = {"tabla" : "integracion_usuario",
		"operador": "and",
		"columnas" : ["telefono_id"],
		"condiciones" : [
			{
				"columna" : "cedula",
				"comparador" : "==",
				"valor" : cedula
			},
			{
				"columna" : "correo",
				"comparador" : "==",
				"valor" : correo
			}
			]
		}
		datos = json.dumps(parametros)
		print(datos)
		response = requests.post('http://3.17.143.36:5000/api/integracion/table/read', data = datos)
		respuesta = json.loads(response.text)
		print("respuesta")
		print(response.text)
		if len(respuesta.get("data")) == 0:
			datos_retornar = {"mensaje": "Cedula o Correo no existen"}
			return HttpResponse(json.dumps(datos_retornar, ensure_ascii=False).encode("utf-8")\
	                , content_type='application/json',status = 404)
		else:
			codigo = respuesta.get("data")[0].get("telefono_id")
			text = " Te informamos que tu clave de app es: \n "
		    
			text += codigo+ "\n" + "Gracias por usar la app!"
			send_mail("AppPrueba: AppKey", text, EMAIL_HOST_USER, [correo],fail_silently=False)
			datos_retornar = {"mensaje": "Correo enviado"}
			return HttpResponse(json.dumps(datos_retornar, ensure_ascii=False).encode("utf-8")\
	                , content_type='application/json')



def get_result(request):

	if request.method == "POST":
		form = EnvioMuestraForm(request.POST)
		print(request.body)
	else:
		form = EnvioMuestraForm()
	return render(request, 'PureVID/ingresarResultado.html', {'form': form})


def index(request):
    return render(request,'PureVID/index.html')

def show_login(request):

	if request.method == "POST":
		form = LoginForm(request.POST)
	else:
		form = LoginForm()
	return render(request, 'PureVID/login.html', {'form': form})

