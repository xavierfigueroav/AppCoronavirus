import { Injectable } from '@angular/core';

/*
  Generated class for the ValidationsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ValidationsProvider {

  constructor() {
    console.log('Hello ValidationsProvider Provider');
  }

  validateHomeRadius(radius:string){
    if(Number(radius)>=2 && Number(radius)<=30){
      return true;
    }
    return false;
  }

  validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  validateIdentificationCard(id:string) {
      var total = 0;
      var longitud = id.length;
      var longcheck = longitud - 1;

      if (id !== "" && longitud === 10){
          for(var i = 0; i < longcheck; i++){
              if (i%2 === 0) {
                  var aux = Number(id.charAt(i)) * 2;
                  if (aux > 9) aux -= 9;
                  total += aux;
              } else {
                  total += parseInt(id.charAt(i)); // parseInt will concatenate instead of sum
              }
          }

          total = total % 10 ? 10 - total % 10 : 0;

          if (Number(id.charAt(longitud-1)) == total) {
              return true;
          }
      }
      return false;
  }

}
