import { Injectable } from '@angular/core';
import { StorageProvider } from '../../providers/storage/storage';
import { WifiScore } from '../../utils_score/wifi_score';
import { DistanceScore } from '../../utils_score/distance_score';
import { APIProvider } from '../api/api';
import {
    BackgroundGeolocation,
    BackgroundGeolocationResponse,
    BackgroundGeolocationEvents,
    BackgroundGeolocationConfig
} from '@ionic-native/background-geolocation';
import { Events, LoadingController } from 'ionic-angular';
import { Encoding, LatLng, ILatLng } from "@ionic-native/google-maps";
import { DatabaseProvider } from '../database/database';

declare var WifiWizard2: any;

/*
  Generated class for the ScoreProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ScoreProvider {

    backgroundGeolocationConfig: BackgroundGeolocationConfig;
    runningScoresCalculation: boolean;

    constructor(
        private storage: StorageProvider,
        private loadingController: LoadingController,
        public backgroundGeolocation: BackgroundGeolocation,
        private database: DatabaseProvider,
        private api: APIProvider,
        private events: Events
    ) {
        console.log('Hello ScoreProvider Provider');
        this.runningScoresCalculation = false;
        this.backgroundGeolocationConfig = {
            stationaryRadius: 1,
            distanceFilter: 1,
            desiredAccuracy: 10,
            stopOnTerminate: false,
            startOnBoot : true,
            saveBatteryOnBackground: true,
            startForeground: true,
            notificationTitle: 'Lava tus manos regularmente',
            notificationText: 'Cuida de ti y de los que te rodean',
            interval: 300000, // 5 minutes
        };
    }

    async startOrReconfigureTracking() {
        await this.configureTracking();
        const backgroundGeolocationStatus = await this.backgroundGeolocation.checkStatus();
        if(!backgroundGeolocationStatus.isRunning){
            this.registerTrackingListeners();
            this.backgroundGeolocation.start();
        }
    }

    async configureTracking() {
        const homeArea = await this.storage.get('homeArea');
        const homeRadius = Math.sqrt(homeArea) / 2;
        this.backgroundGeolocationConfig.distanceFilter = homeRadius;
        this.backgroundGeolocationConfig.stationaryRadius = homeRadius;
        this.backgroundGeolocation.configure(this.backgroundGeolocationConfig)
        .then(() => console.log('Tracking configured'));
    }

    registerTrackingListeners() {
        console.log('Registering tracking listeners...');
        this.backgroundGeolocation.on(BackgroundGeolocationEvents.location)
        .subscribe(location => this.locationHandler(location));

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.stop)
        .subscribe(() => console.log('TRACKING STOPPED!'));

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.error)
        .subscribe(() => console.log('[ERROR] Tracking'));
    }

    async locationHandler(location: BackgroundGeolocationResponse){
        // This prevents race conditions between pending locations and new locations
        if(this.runningScoresCalculation){
            console.log('score calculation PREVENTED');
            return;
        }
        this.runningScoresCalculation = true;

        console.log('MOVEMENT DETECTED!');
        try {
            await this.backgroundGeolocation.deleteLocation(location.id);
        } catch(error) {
            console.log('[EXPECTED ERROR]', error);
        } finally {
            const partialScores = await this.getPartialScores(location);
            await this.database.addLocation(partialScores.latitude, partialScores.longitude,
                                            partialScores.date, partialScores.distance_score,
                                            partialScores.distance_home, partialScores.time_away,
                                            partialScores.time_score, partialScores.wifi_score, 
                                            partialScores.population_score);
            await this.checkForPendingScores(location.time);
            await this.calculateCurrentScore();
            this.runningScoresCalculation = false;
            this.api.sendPendingScoresToServer();
        }
    }

    async getPartialScores(location: BackgroundGeolocationResponse){
        const distanceScore = await this.calculateDistanceScore(location);
        console.log("distanceScore",distanceScore);
        const wifiScore = await this.calculateWifiScore();
        console.log("wifiScore",wifiScore);
        const timeScore = this.calculateTimeScore();
        console.log("timeScore",timeScore);
        const populationDensityScore = await this.calculatePopulationDensityScore();
        console.log("populationDensityScore",populationDensityScore);
        return {"latitude":location.latitude,"longitude":location.longitude,"date":new Date(location.time),
                "distance_score":distanceScore.score, "distance_home":distanceScore.distance,
                "time_away":timeScore.time, "time_score":timeScore.score, "wifi_score":wifiScore,
                "population_score":populationDensityScore}
    }

    async restartTrackingIfStopped() {
        console.log('RESTARTING IF STOPPED...');
        const homeArea = await this.storage.get('homeArea');
        if(homeArea != null) {
            await this.configureTracking();
            this.backgroundGeolocation.start();
        }
    }

    async restartTrackingIfKilled() {
        console.log('RESTARTING IF KILLED...');
        const homeArea = await this.storage.get('homeArea');
        if(homeArea != null) {
            let loader: any;
            try {
                loader = this.loadingController.create({
                    content: 'Calculando niveles de exposición durante tu ausencia...',
                });
                loader.present();
                await this.checkForPendingLocations(); // IT MUST BE CALLED FIRST. DO NOT MOVE THIS LINE
            } finally {
                loader.dismiss();
            }
            this.backgroundGeolocation.stop();
            this.registerTrackingListeners();
            await this.configureTracking();
            this.backgroundGeolocation.start();
        }
    }

    async checkForPendingLocations() {
        console.log('Checking for pending locations...');
        const locations = await this.backgroundGeolocation.getLocations();
        // FIXME: these scores might be calcultated upon
        // inconsistent parameters: location and num of wifi networks
        for(const location of locations) {
            await this.locationHandler(location);
        }
    }

    async updateScores() {
        const currentLocation = await this.backgroundGeolocation.getCurrentLocation();
        await this.locationHandler(currentLocation);
    }

    async calculateCurrentScore() {
        const date = new Date();
        const currentHour = date.getHours();
        const score = await this.calculateCompleteScore(currentHour, date, false);
        await this.storage.setCurrentScore(score.completeScore);
        this.events.publish('scoreChanges', score.completeScore);
    }

    // Calculate and save the scores only for complete hours
    async checkForPendingScores(locationTime: number) {
        console.log('checkForPendingScores...');
        const locationDate = new Date(locationTime);
        const locationHour = locationDate.getHours();
        const lastScore = await this.database.getLastScore();
        const lastScoreDate = lastScore ? new Date(lastScore.date) : locationDate;
        let lastScoreHour = lastScore ? lastScore.hour : -1;

        if(lastScoreDate.toLocaleDateString() < locationDate.toLocaleDateString()) { // on different days
            for(let date = lastScoreDate; date <= locationDate; date.setDate(date.getDate() + 1)) {
                const scoreDate = new Date(date);
                const maxHour = date.toLocaleDateString() === locationDate.toLocaleDateString() ? locationHour : 24;

                for(let hour = lastScoreHour + 1; hour < maxHour; hour++) {
                    await this.calculatePendingScore(hour, scoreDate);
                }
                lastScoreHour = -1;
            }
        } else {
            if (lastScoreHour + 1 < locationHour) {
                for (let hour = lastScoreHour + 1; hour < locationHour; hour++) {
                    await this.calculatePendingScore(hour, locationDate);
                }
            }
        }
    }

    validateZeroHour(hour:number,scoreDate:Date): [number, Date]{
        let newHour = hour;
        let newDate = new Date(scoreDate);
        if(hour == 0){
            newHour = 23;
            newDate = new Date(scoreDate.getDate() - 1)
        }else{
            --newHour;
        }
        return [newHour,newDate];
    }

    async calculatePendingScore(hour: number, scoreDate: Date) {
        const score = await this.calculateCompleteScore(hour, scoreDate);
        await this.database.saveScore(
            score.completeScore,
            scoreDate,
            hour,
            score.maxDistanceToHome,
            score.maxTimeAway,
            score.encodedRoute
        );

        [hour,scoreDate] = this.validateZeroHour(hour, scoreDate);
        await this.database.deleteLocationsByHourAndDate(hour, scoreDate);
    }

    async getParameters() : Promise<{}>{
        const homeLocation = await this.storage.get('homeLocation');
        const homeLatitude = homeLocation.latitude;
        const homeLongitude = homeLocation.longitude;

        const al = 0;
        const bl = 0;
        const cl = 100;
        const am = 50;
        const bm = 250;
        const cm = 500;
        const ah = 300;
        const bh = 1000;
        const ch = 2000;

        return {
            'homeLatitude': homeLatitude,
            'homeLongitude': homeLongitude,
            'al': al, 'bl': bl, 'cl': cl,
            'am': am, 'bm': bm, 'cm': cm,
            'ah': ah, 'bh': bh, 'ch': ch
        };
    }

    async calculateCompleteScore(hour: number, scoreDate: Date, full = true): Promise< {completeScore: number, maxDistanceToHome: number, maxTimeAway: number, encodedRoute: string}>{
        let locationsByHour = await this.database.getLocationsByHourAndDate(hour, scoreDate);
        const lastElement = locationsByHour[locationsByHour.length - 1];
        if(full && locationsByHour.length == 0){
            let lastHour;
            let lastScoreDate;
            [lastHour,lastScoreDate] = this.validateZeroHour(hour,scoreDate);
            
            let locationsByLastHour = await this.database.getLocationsByHourAndDate(lastHour, lastScoreDate);
            locationsByHour = [locationsByLastHour[locationsByLastHour.length - 1]];
            await this.database.addLocation(locationsByHour[-1].latitude, locationsByHour[-1].longitude,
                                            scoreDate, locationsByHour[-1].distance_score,
                                            locationsByHour[-1].distance_home, locationsByHour[-1].time_away,
                                            locationsByHour[-1].time_score, locationsByHour[-1].wifi_score, 
                                            locationsByHour[-1].population_score);
        }else{
            locationsByHour = full ? locationsByHour : lastElement ? [lastElement] : [];
        }
        const completeScore = await this.calculateCompleteExposition(locationsByHour);
        const encodedRoute = this.getEncodedRoute(locationsByHour);
        return {completeScore: completeScore.score, maxDistanceToHome: completeScore.maxDistanceToHome, 
                maxTimeAway: completeScore.maxTimeAway, encodedRoute: encodedRoute};
    }
 
    async calculateWifiScore(): Promise<number>{
        const numNetworks = await this.startScan();
        const wifiScore: WifiScore = new WifiScore();
        const homeWifiNetworks = await this.storage.get('homeWifiNetworks');
        const score = wifiScore.get_wifi_score_networks_available(numNetworks, 1.5, homeWifiNetworks);
        return score;
    }

    async calculateDistanceScore(location): Promise<{score: number, distance: number}>{
        const parameters = await this.getParameters();

        const distanceScoreCalculator = new DistanceScore(
            parameters['al'],parameters['bl'],parameters['cl'],
            parameters['am'],parameters['bm'],parameters['cm'],
            parameters['ah'],parameters['bh'],parameters['ch'],
            parameters['homeLatitude'], parameters['homeLongitude']
        );

        const score = distanceScoreCalculator.calculateScore(location);
        return score;
    }

    calculateTimeScore():{score: number, time: number }{
        //TODO implement
        return {score: 1, time:0};
    }

    async calculateCompleteExposition(locations: any[]): Promise<{score: number, maxDistanceToHome: number, maxTimeAway: number}> {
        var scores: number[] = [];
        var maxDistanceToHome = 0;
        var maxTimeAway = 0;
        var completeScore = 1;

        if(locations !== undefined && locations.length > 0){
            locations.forEach((location) =>{
                scores.push(this.calculateExpositionScore(location.distance_score, location.wifi_score, location.populations_density, location.time_score));
                maxDistanceToHome += location.distance_home;
                maxTimeAway += location.time_away;
            });
            completeScore = Math.max(...scores);
            }
        return {score: completeScore, maxDistanceToHome: maxDistanceToHome, maxTimeAway: maxTimeAway};
    }

    calculateExpositionScore(
        distance_score: number,
        wifi_score=1,
        density_score=1,
        time_score=1,
        alpha=0.33,
        beta=0.33,
        theta=0.33): number{ //time given in minutes
        const score = distance_score * ((alpha*wifi_score) + (beta*density_score) + (theta*time_score));
        return Number(score.toFixed(2));
    }

    calculateMaxDistanceToHome(scores: Map<any,any>): number{
        const distances = Array.from(scores.values()).map(value => value.distance_home);
        return Math.max(...distances);
    }

    getEncodedRoute(locations : any[]){
        if(locations.length > 0){
            const latLngs: ILatLng[] = locations.map((location) => { return new LatLng(location.latitude, location.longitude); });
            const encodedRoute = Encoding.encodePath(latLngs);
            return encodedRoute;
        }
        return '';
    }

    async calculatePopulationDensityScore(){
        //TODO implement
        return 1;
    }

    async startScan(): Promise<number> {
        let num_networks: number;
        if (typeof WifiWizard2 !== 'undefined') {
            console.log("WifiWizard2 loaded: ");
            console.log(WifiWizard2);
        } else {
            console.warn('WifiWizard2 not loaded.');
        }
        await WifiWizard2.scan().then((wifiNetworks: any[]) => {
            console.log("Inside Scan function");
            for (let wifiNetwork of wifiNetworks) {
                const level = wifiNetwork['level'];
                const ssid = wifiNetwork['SSID'];
                const timestamp = wifiNetwork['timestamp'];
                console.log(`Level: ${level} SSID: ${ssid} Timestamp: ${timestamp}`);
            }
            num_networks = wifiNetworks.length;
        }).catch((error: any) => {
            console.log('ERROR SCAN', JSON.stringify(error));
            num_networks = 0;
        });

        return num_networks;
    }

    async checkforInestimableScores(){
        const scores = await this.database.getScores();
        if(scores.length === 0){
            const date = new Date();
            const currentHour = date.getHours();
            for (let hour = 0; hour < currentHour; hour++) {
                this.database.saveScore(-1, date, hour, 0, 0, '');
            }
        }
    }
}