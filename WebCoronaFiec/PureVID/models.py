from django.db import models
from django.utils import timezone


class Muestra(models.Model):
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    cedula = models.CharField(max_length=10,default="9999999999")
    codigo_lab = models.CharField(max_length=3,default="000")
    codigo_muestra = models.CharField(max_length=10,default="000000000")

    created_date = models.DateTimeField(
            default=timezone.now)
    published_date = models.DateTimeField(
            blank=True, null=True)

    def publish(self):
        self.published_date = timezone.now()
        self.save()

    def __str__(self):
        return self.title