from django import forms

from .models import *

class MuestraForm(forms.ModelForm):

    class Meta:
        model = Muestra
        fields = ('cedula', 'email','codigo_lab','codigo_muestra',)

class ConsultaMuestraForm(forms.ModelForm):

    class Meta:
        model = ConsultaMuestra
        fields = ('codigo_muestra',)

class EnvioMuestraForm(forms.ModelForm):

    class Meta:
        model = EnvioMuestra
        fields = ('codigo_muestra','recomendacion')

class LoginForm(forms.ModelForm):
	class Meta:
		model = User
		fields = ('username','password',)

		widgets = {'password': forms.PasswordInput(),}
