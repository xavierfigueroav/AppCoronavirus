import { Component } from '@angular/core';
import { Platform, Events, MenuController, NavController, App, LoadingController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../pages/auth/auth';
//import { AuthCVRPage } from '../pages/authCVR/authCVR';
import { HomePage } from '../pages/home/home';
//import {HomePage2} from '../pages/home2/home2';
import { PerfilPage } from '../pages/perfil/perfil';
import { SentFormsPage } from '../pages/sentForms/sentForms';
import { FormulariosPage } from '../pages/formularios/formularios';
import { HTTP } from '@ionic-native/http';
import { HttpClient } from '@angular/common/http';
import { Coordinates, Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { FormPage } from '../pages/form/form';
import { FollowUpPage } from '../pages/followUp/followUp';
import { TabsPage } from '../pages/tabs/tabs';
import { DiagnosticPage } from '../pages/diagnostic/diagnostic';
// import {WifiScore} from '../pages/utils_score/wifiScore';

import {
    BackgroundGeolocation,
    BackgroundGeolocationConfig,
    BackgroundGeolocationResponse,
    BackgroundGeolocationEvents
} from "@ionic-native/background-geolocation";

declare var WifiWizard2: any;

@Component({
    templateUrl: 'app.html'
})

export class MyApp {
    rootPage:any;
    flagMenu: boolean = false;
    params: any = { usuarioViculado: null };
    fechaIncioApp = new Date();
    listaGeneral = [{ page: HomePage, icon: "ios-home-outline", label: "Principal" }, { page: PerfilPage, icon: "ios-person-outline", label: "Perfil" }, { page: FormulariosPage, icon: "ios-paper-outline", label: "Formularios" }];
    indexSelectedFormulario = null;
    plantillaApp;
    formularioTemporal;
    rootParams;
    observacionPage;
    fenomenosPage;
    sendingForms = false;
    // urlServerEnvioFormulario = "https://insavit.espol.edu.ec/api/send_form/";
    // urlServerPlantilla = "https://insavit.espol.edu.ec/api/templates/";
    // urlServerCalculos = "https://insavit.espol.edu.ec/api/validations/";

    constructor(private diagnostic: Diagnostic,
        private locationAccuracy: LocationAccuracy,
        public http: HTTP,
        public alertCtrl: AlertController,
        private geolocation: Geolocation,
        public loadingCtrl: LoadingController,
        public appCtrl: App,
        public httpClient: HttpClient,
        private storage: Storage,
        public menuCtrl: MenuController,
        private events: Events,
        platform: Platform,
        statusBar: StatusBar,
        splashScreen: SplashScreen,
        private backgroundGeolocation: BackgroundGeolocation) {
            platform.ready().then(() => {

                this.events.subscribe('pendingForms:editarFormulario', (fechaFormulario) => {
                    this.selectItemMenuGeneral(this.listaGeneral[0], 0, null);
                    this.appCtrl.getRootNav().setRoot(HomePage, { fechaFormulario: fechaFormulario });
                });

                statusBar.styleDefault();
                splashScreen.hide();
                this.listenToLoginEvents();

                this.storage.get('fechaInstalacion').then(data => {
                    if (data == null) {
                        this.storage.set('fechaInstalacion', this.fechaIncioApp);
                    }
                });

                this.storage.get('linkedUser').then((val) => {
                    this.params.linkedUser = val;
                    if (val != null && val.sesion) {
                        //this.selectItemMenuGeneral(this.listaGeneral[0], 0, null);
                        this.appCtrl.getRootNav().setRoot(TabsPage);
                    } else {
                        this.appCtrl.getRootNav().setRoot(TabsPage);  //CAMBIAR A AuthPage
                    }
                });

            });

            this.startBackgroundGeolocation();
    }

    promesaEnvioFormulario(linkedUser, formulario, templateUuid, setId) {
        /*return new Promise((resolve, reject) => {
            var data = {
                "template": {"uuid": templateUuid, "setId": setId},
                "formData": formulario,
                "user": linkedUser
            }
            this.httpClient.post(this.urlServerEnvioFormulario,
                data).subscribe(res => {
                    let responseJson = {
                        responseData: res["data"],
                        fechaEnvio: new Date(),
                        error: false
                    };
                    resolve(responseJson);
                }, err => {
                    console.log(err);
                    let responseJson = {
                        responseData: err,
                        fechaEnvio: null,
                        error: true
                    };
                    resolve(responseJson);
                });
        });*/
    }

    async enviarFormulariosEvent(pendingForms) {
        this.events.publish('app:envioFormularios', true);
        let formularios = [];
        let alert;
        let loading;
        if (this.sendingForms == false) {
            loading = this.loadingCtrl.create({
                content: 'Enviando formularios ...',
            });
            loading.present();
            this.sendingForms = true;
            let linkedUser = await this.storage.get("linkedUser");
            let newPendingForms = pendingForms.slice();
            for (let pendingForm of newPendingForms) {
                let templateUuid = pendingForm.template;
                let setId = pendingForm.setId;
                let index = pendingForm.index;
                let formData = pendingForm.formData;
                let result = await this.promesaEnvioFormulario(linkedUser, formData, templateUuid, setId);
                if (result['error']) {
                    this.sendingForms = false;
                    if (loading) {
                        loading.dismiss();
                    }
                    alert = this.alertCtrl.create({
                        title: "No se pudo enviar los formularios. Hubo problemas de conexión con el servidor. Por favor intente más tarde.",
                        buttons: ["ok"]
                    });
                    alert.present();
                    break;
                }
                else {
                    var formularioEnviado = {
                        sendDate: result["fechaEnvio"],
                        createdDate: result["responseData"]["createdDate"],
                        name: result["responseData"]["name"],
                        code: result["responseData"]["code"],
                        type: result["responseData"]["type"],
                    }
                    let sentForms = await this.storage.get("sentForms");
                    // Add sentForm
                    if (sentForms != null && sentForms.length > 0) {
                        sentForms.push(formularioEnviado);
                    }
                    else {
                        sentForms = [formularioEnviado];
                    }
                    await this.storage.set("sentForms", sentForms);
                    //Delete pendingForm
                    pendingForms.shift();
                    await this.storage.set("pendingForms", pendingForms);
                }
            }

            if (pendingForms.length == 0) {
                loading.dismiss();
                this.sendingForms = false;
                alert = this.alertCtrl.create({
                    message: "Todas las formularios han sido correctamente enviadas",
                    buttons: ["ok"]
                });
                alert.present();
            }

            this.events.publish('app:envioFormularios', false);
        }
        else {
            if (loading) {
                loading.dismiss();
            }
            loading = this.loadingCtrl.create({
                content: 'Enviando formularios ...',
            });
            loading.present();
        }
    }

    selectItemMenuGeneral(item, index, $event) {
        this.indexSelectedFormulario = null;
        this.menuCtrl.close();
        this.appCtrl.getRootNav().setRoot(item.page);
    }

    selectItemMenuFormulario(index, page) {
        this.indexSelectedFormulario = index;
        this.menuCtrl.close();

        this.rootParams = {
            indexHorario: index,
            formularioTemporal: this.formularioTemporal,
        }

        this.appCtrl.getRootNav().setRoot(page, this.rootParams);
    }

    listenToLoginEvents() {
        this.events.subscribe('home:crearFormulario', (formularioTemporal) => {
            if (this.sendingForms) {
                let alert = this.alertCtrl.create({
                    title: "Eror",
                    subTitle: "No puedes crear una formulario mientras se estan enviando las formularios locales",
                    buttons: ["ok"]
                });;
                alert.present();
            }
            else {
                this.formularioTemporal = formularioTemporal;
            }

        });
        this.events.subscribe('home:editarFormulario', (formularioTemporal) => {
            if (this.sendingForms) {
                let alert = this.alertCtrl.create({
                    title: "Enviando",
                    subTitle: "No puedes editar una formulario mientras se estan enviando las formularios locales",
                    buttons: ["ok"]
                });;
                alert.present();
            }
            else {
                this.formularioTemporal = formularioTemporal;
            }
        });

        this.events.subscribe('pendingForms:enviarFormularios', (pendingForms) => {
            this.enviarFormulariosEvent(pendingForms);
        });
    }

    cerrarSesion() {
        this.storage.get('linkedUser').then((val) => {
            this.storage.set('linkedUser', null).then(data => {
                this.appCtrl.getRootNav().setRoot(AuthPage);
            });
        });
    }

    startScan() {
        if (typeof WifiWizard2 !== 'undefined') {
                console.log("WifiWizard2 loaded: ");
                console.log(WifiWizard2);
        } else {
            console.warn('WifiWizard2 not loaded.');
        }  
        WifiWizard2.scan().then(function(results){
            console.log("Inside Scan function");
            console.log(results);
            //this.network.push(results);
            for (let x of results) {   
                var level = x["level"];
                var ssid = x["SSID"];      
                var bssid = x["BSSID"];
                var frequency = x["frequency"];
                var capabilities = x["capabilities"];
                var timestamp = x["timestamp"];
                console.log("Level: "+level+", SSID: "+ssid+", BSSID: "+bssid+"\n"
                            +"Frequency: "+frequency+", Capabilities: "+capabilities+"\n"
                            +"Timestamp: "+timestamp);  
                // this.networks.push({
                //     "SSID": ssid,
                //     "BSSID": bssid,
                //     "level": level,
                //     "frequency": frequency,
                //     "capabilities":capabilities,
                //     "timestamp":timestamp});
            }
            return results;  
        }).catch();
    }


    calculate_exposition_score(distance_score, wifi_score=1, density_score=1, time_score=1,
                                alpha=0.33, beta=0.33, theta=0.33): number{ //time given in minutes
        var score = distance_score * ((alpha*wifi_score) + (beta*density_score) + (theta*time_score));
        return Number(score.toFixed(2));
    }

    startBackgroundGeolocation() {
        console.log('startB');
        const config: BackgroundGeolocationConfig = {
          desiredAccuracy: 10,
          stationaryRadius: 20,
          distanceFilter: 1,
          debug: true, //  enable this hear sounds for background-geolocation life-cycle.
          stopOnTerminate: false // enable this to clear background location settings when the app terminates
        };

        this.backgroundGeolocation.configure(config).then(() => {
            console.log('startX');
          this.backgroundGeolocation
            .on(BackgroundGeolocationEvents.location)
            .subscribe((location: BackgroundGeolocationResponse) => {
              console.log(location);
              this.backgroundGeolocation.getLocations().then((locations) => {
                console.log('locations', locations);
                var networks = this.startScan();

              })
            });
        });
        // start recording location
        this.backgroundGeolocation.start();
        console.log('startE');
      }
}
