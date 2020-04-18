from . import views
from django.conf.urls import  url
from django.urls import path



urlpatterns = [
    url(r'^login_laboratoristas', views.login_laboratorista),
    url(r'^login_recolectores', views.login_recolector),
    url(r'^claves_app', views.clave_app),
    path('muestra', views.push_muestra, name='post_muestra'),
    path('consultaMuestra', views.get_muestra, name='get_muestra'),
    
    url(r'^registro_muestra', views.registro_muestra),
    #url(r'^muestras_lab', views.muestras_lab),
    url(r'^estado_muestra', views.estado_muestra),
    url(r'^enviar_correo', views.enviar_correo),
    #url(r'^muestras_lab', views.muestras_lab),
    #url(r'^actualizar_estado_muestra', views.actualizar_estado_muestra),
]
