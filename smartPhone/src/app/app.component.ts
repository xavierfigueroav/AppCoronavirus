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
import {WifiScore} from '../utils_score/wifi_score';
import { DatabaseService } from "../service/database-service";

import {
    BackgroundGeolocation,
    BackgroundGeolocationConfig,
    BackgroundGeolocationResponse,
    BackgroundGeolocationEvents
} from "@ionic-native/background-geolocation";
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { DistanceScore } from '../utils_score/distance_score';
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
                        this.appCtrl.getRootNav().setRoot(AuthPage);
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

    static async startScan(): Promise<number> {
        var num_networks;
        if (typeof WifiWizard2 !== 'undefined') {
                console.log("WifiWizard2 loaded: ");
                console.log(WifiWizard2);
        } else {
            console.warn('WifiWizard2 not loaded.');
        }
        await WifiWizard2.scan().then(function(results){
            console.log("Inside Scan function");
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
            }
            num_networks = results.length;
        }).catch();
        return num_networks;
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

    async locationHandler(location: BackgroundGeolocationResponse){
        console.log('Background geolocation => location received');

        var wifiScore = await this.calculateWifiScore();
        this.database.addLocation(location.latitude, location.longitude, location.time, wifiScore);

        var date = new Date();
        var currentHour = date.getHours();
        this.checkForPendingScores(Number(currentHour));

        this.calculatePartialActualScore(Number(currentHour)); //this value will be graficated in actual score

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
                for (let hour = lastScoreHour+1; hour <=currentHour; hour++) {
                    var score = await this.calcualteDistanceScore(hour);
                    this.database.addScore(score, hour, 0, 0, "");
                }
            }
          }else{   //there aren't scores yet, calculate all scores until the current hour
            for (let hour = 1; hour <=currentHour; hour++) {
                var score = await this.calcualteDistanceScore(hour);
                this.database.addScore(score, hour, 0, 0, "");
            }
          }
        })
    }

    async getParameters() : Promise<{}>{
        var parameters = {};
        //TODO UNCOMMENT THIS 3 LINES!!!!!!!!
        //var homeLocation = await this.storage.get("homeLocation");
        // var homeLatitude = homeLocation["latitude"];
        // var homeLongitude = homeLocation["longitude"];
        // var homeWifiNetworks = await this.storage.get("homeWifiNetworks");

        var homeLatitude = -10.9393413858164; //delete after uncomment homelocation
        var homeLongitude = -37.0627421097422; //delete after uncomment homelocation
        var homeWifiNetworks = 6; //delete after uncomment homeWifiNetworks

        var al = 0;
        var bl = 0;
        var cl = 100;
        var am = 50;
        var bm = 250;
        var cm = 500;
        var ah = 300;
        var bh = 1000;
        var ch = 2000;

        parameters = {"homeLatitude":homeLatitude,"homeLongitude":homeLongitude,
                      "homeWifiNetworks":homeWifiNetworks,
                      "al":al,"bl":bl,"cl":cl,
                      "am":am,"bm":bm,"cm":cm,
                      "ah":ah,"bh":bh,"ch":ch}
        return parameters;
    }

    async calcualteDistanceScore(hour: number): Promise<number>{
        var parameters = await this.getParameters();
        var distanceScoreCalculator = new DistanceScore(parameters["al"],parameters["bl"],parameters["cl"],
                                                        parameters["am"],parameters["bm"],parameters["cm"],
                                                        parameters["ah"],parameters["bh"],parameters["ch"],
                                                        parameters["homeLatitude"], parameters["homeLongitude"]);
        var locationsByHour = await this.database.getLocationByHour(hour);
        var score = distanceScoreCalculator.calculateScore(locationsByHour);
        var meanWifiScore = this.calculateMeanWifiScore(locationsByHour);
        return score.maxScore * meanWifiScore;
    }

    async calculatePartialActualScore(hour: number): Promise<number>{
        var parameters = await this.getParameters();
        var distanceScoreCalculator = new DistanceScore(parameters["al"],parameters["bl"],parameters["cl"],
                                                        parameters["am"],parameters["bm"],parameters["cm"],
                                                        parameters["ah"],parameters["bh"],parameters["ch"],
                                                        parameters["homeLatitude"], parameters["homeLongitude"]);
        var locationsByHour = await this.database.getLocationByHour(hour + 1); //Database return the previous hour score
        var score = distanceScoreCalculator.calculateScore(locationsByHour);
        this.storage.set("partialScore",score.maxScore);
        return score.maxScore;
    }

    async calculateWifiScore(): Promise<number>{
        var numNetworks = await MyApp.startScan();
        var wifiScore: WifiScore = new WifiScore();
        var parameters = await this.getParameters();
        var score = wifiScore.get_wifi_score_networks_available(numNetworks, 1.5, parameters["homeWifiNetworks"]);
        return score;
    }

    sendPendingScoresToServer(){
        // TODO sent scores to CKAN
    }

    calculateMeanWifiScore(locationsByHour: Array<any>): number{
        var wifiTotal = 0;
        if(locationsByHour.length !=0){
            for(let wifi_networks of locationsByHour){
                wifiTotal += Number(wifi_networks.wifi_score);
            }
            return wifiTotal/locationsByHour.length;
        }
        return 1;
    }
}
