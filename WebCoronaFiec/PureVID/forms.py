from django import forms

from .models import *

class MuestraForm(forms.ModelForm):

    class Meta:
        model = Muestra
        fields = ('cedula', 'codigo_lab','codigo_muestra',)

class ConsultaMuestraForm(forms.ModelForm):

    class Meta:
        model = ConsultaMuestra
        fields = ('codigo_muestra',)
