from . import views
from django.conf.urls import  url
from django.urls import path



urlpatterns = [
    url(r'^login_laboratoristas', views.login_laboratorista),
    url(r'^login_recolectores', views.login_recolector),
    url(r'^claves_app', views.clave_app),
    path('muestra', views.push_muestra, name='post_muestra')
]
