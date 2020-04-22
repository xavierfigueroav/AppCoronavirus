from . import views
from django.conf.urls import  url
from django.urls import path



urlpatterns = [
    url(r'^login_laboratoristas', views.login_laboratorista, name="login_laboratorista"),
    url(r'^loginLab', views.show_login,name="login"),
    url(r'^loginPicker', views.show_login_recolector,name="loginPicker"),
    url(r'^ajax/lookup_cedula/$', views.buscar_por_cedula, name='validate_username'),


    url(r'^addTest', views.login_recolector,name="login_recolector" ),
    url(r'^claves_app', views.clave_app),
    path('muestra', views.push_muestra, name='post_muestra'),
    path('consultaMuestra', views.get_muestra, name='get_muestra'),
    path('showResult', views.get_result, name='get_result'),
    url(r'^registro_muestra', views.registro_muestra),
    #url(r'^muestras_lab', views.muestras_lab),
    url(r'^estado_muestra', views.estado_muestra),
    url(r'^home', views.index, name="home"),
    url(r'^enviar_correo', views.enviar_correo),
    #url(r'^muestras_lab', views.muestras_lab),
    #url(r'^actualizar_estado_muestra', views.actualizar_estado_muestra),
    path('result_muestra', views.result_muestra, name='show_result'),

]
