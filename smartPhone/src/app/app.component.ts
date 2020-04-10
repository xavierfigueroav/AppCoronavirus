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
import { DatabaseService } from "../service/database-service";

import {
    BackgroundGeolocation,
    BackgroundGeolocationConfig,
    BackgroundGeolocationResponse,
    BackgroundGeolocationEvents
  } from "@ionic-native/background-geolocation";
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { DistanceScore } from '../utils_score/distance_score';

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
    //urlServerEnvioFormulario = "https://insavit.espol.edu.ec/api/send_form/";
    //urlServerPlantilla = "https://insavit.espol.edu.ec/api/templates/";
    //urlServerCalculos = "https://insavit.espol.edu.ec/api/validations/";

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
        private backgroundGeolocation: BackgroundGeolocation,
        public database:DatabaseService) {
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

    get_wifi_score_signal_intensity(available_networks, max_signal_intensity=5): number{
        let number_networks_available = available_networks.length;

        if(number_networks_available>0){
            const maximum_signal_intensity = max_signal_intensity;
            let signal_intensity = 0;
            console.log("Number of networks available: "+number_networks_available)

            for(let network of available_networks){
                console.log("Network "+ network["BSSID"] +": "+network["level"]);
                signal_intensity += network["level"];
            }

            let signal_intensity_average = signal_intensity/number_networks_available
            let signal_intensity_score = (signal_intensity_average/maximum_signal_intensity).toFixed(2)
            console.log("Final(average) score: "+signal_intensity_score)
            return Number(signal_intensity_score);
        }
        else
            console.log("No WiFi networks detected at the moment.");
        return 1;
    }

    get_wifi_score_networks_available(available_networks, X=1.5, number_home_networks): number{
        let number_networks_available = available_networks.length;
        if(number_networks_available>0){
            console.log("Number of networks available: "+number_networks_available)
            var max_networks_allowed = number_home_networks*X;
            if(available_networks>=max_networks_allowed)
                return 1;
            else{
                let networks_available_score = (number_networks_available/max_networks_allowed).toFixed(2);
                return Number(networks_available_score);
            }
        }
        else
            console.log("No WiFi networks detected at the moment.");
        return 1;
    }

    calculate_exposition_score(distance_score, wifi_score=1, density_score=1, time_score=1,
                                alpha=0.33, beta=0.33, theta=0.33): number{ //time given in minutes
        var score = distance_score * ((alpha*wifi_score) + (beta*density_score) + (theta*time_score));
        return Number(score.toFixed(2));
    }

    startBackgroundGeolocation() {
        const config: BackgroundGeolocationConfig = {
          desiredAccuracy: 10,
          stationaryRadius: 20,
          distanceFilter: 1,
          debug: true, 
          stopOnTerminate: false 
        };

        this.backgroundGeolocation.configure(config).then(() => {
            console.log('Background geolocation => configured');
            this.backgroundGeolocation
                .on(BackgroundGeolocationEvents.location)
                .subscribe((location: BackgroundGeolocationResponse) => {
                    this.locationHandler(location);
                });
        });
        // start recording location
        this.backgroundGeolocation.start();
        console.log('Background geolocation => started');

    }

    locationHandler(location: BackgroundGeolocationResponse){
        console.log('Background geolocation => location received');
        console.log(location);

        var wifiScore = this.calculateWifiScore();
        this.database.addLocation(location.latitude, location.longitude, location.time, wifiScore);

        var date = new Date();
        var currentHour = date.getHours();
        this.checkForPendingScores(Number(currentHour));

        var partialActualScore = this.calculatePartialActualScore(Number(currentHour)); //this value will be graficated in actual score

        this.sendPendingScoresToServer();
        
    }

    // Calculate and save the scores only for complete hours
    checkForPendingScores(currentHour: number){
        if(currentHour == 0) currentHour = 24;
        this.database.getScores().then(async (data:any) =>{
          if(data){
            var lastScoreHour = data.length;
            if(lastScoreHour > currentHour){ //  if we are in different days, delete previous scores and check again
                this.database.deleteScores();
                this.checkForPendingScores(currentHour);
            }else{                          // if we are in the same day, only calculate the score from the last score hour to the current hour
                for (let hour = lastScoreHour+1; hour < currentHour; hour++) {   
                    var score = await this.calcualteDistanceScore(hour);
                    this.database.addScore(score, hour, 0, 0, "");
                }
            }
          }else{   //there aren't scores yet, calculate all scores until the current hour
            for (let hour = 1; hour < currentHour; hour++) {
                var score = await this.calcualteDistanceScore(hour);
                this.database.addScore(score, hour, 0, 0, "");
            }
          }
        })
    }

    async calcualteDistanceScore(hour: number): Promise<number>{
        var homeLatitude = await this.storage.get("homeLat")
        var homeLongitude = await this.storage.get("homeLng");
        // TODO  read all paramaters from the storage
        var distanceScoreCalculator = new DistanceScore(0,0,100,50,250,500,300,1000,2000,homeLatitude, homeLongitude);
        var locationsByHour = this.getLocationsByHour();
        var score = distanceScoreCalculator.calculateScore(locationsByHour);
        return score.maxScore;
    }

    getLocationsByHour():[]{//calculate wifi average as well
        return [];
    }

    calculatePartialActualScore(hour: number): number{
        return 1;
    }

    calculateWifiScore(): number{
        // TODO: -implement logic
        return 1;
    }

    sendPendingScoresToServer(){

    }
}
