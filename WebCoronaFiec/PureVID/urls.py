from . import views
from django.conf.urls import  url


urlpatterns = [
    url(r'^login_laboratoristas', views.login_laboratorista),
    url(r'^login_recolectores', views.login_recolector),
    url(r'^claves_app', views.clave_app),
]
