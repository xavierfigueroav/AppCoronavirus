import { Injectable } from '@angular/core';
import { StorageProvider } from '../../providers/storage/storage';
import { WifiScore } from '../../utils_score/wifi_score';
import { DistanceScore } from '../../utils_score/distance_score';
import { APIProvider } from '../api/api';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { BackgroundGeolocationEvents } from '@ionic-native/background-geolocation';
import { Events } from 'ionic-angular';
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

    backgroundGeolocationConfig: any;
    runningScoresCalculation: boolean;

    constructor(
        private storage: StorageProvider,
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
        const homeWifiNetworks = await this.storage.get('homeWifiNetworks');
        const homeLocation = await this.storage.get('homeLocation');
        const censusArea = await this.storage.get('censusArea');
        const user = await this.storage.getUser();

        this.backgroundGeolocationConfig.user = user;
        this.backgroundGeolocationConfig.homeRadius = homeRadius;
        this.backgroundGeolocationConfig.homeNetworks = homeWifiNetworks;
        this.backgroundGeolocationConfig.homeLongitude = homeLocation.longitude;
        this.backgroundGeolocationConfig.homeLatitude = homeLocation.latitude;
        this.backgroundGeolocationConfig.censusArea = censusArea;
        this.backgroundGeolocationConfig.distanceFilter = homeRadius;
        this.backgroundGeolocationConfig.stationaryRadius = homeRadius;
        this.backgroundGeolocation.configure(this.backgroundGeolocationConfig)
        .then(() => console.log('Tracking configured'));
        this.registerTrackingListeners();
    }

    registerTrackingListeners() {
        this.backgroundGeolocation.on(BackgroundGeolocationEvents.location)
        .subscribe(location => this.events.publish('scoreChanges', ""));
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
            const distanceScore = await this.calculateDistanceScore(location);
            console.log("distanceScore",distanceScore);
            const wifiScore = await this.calculateWifiScore();
            console.log("wifiScore",wifiScore);
            const timeScore = this.calculateTimeScore();
            console.log("timeScore",timeScore);
            const populationDensityScore = await this.calculatePopulationDensityScore();
            console.log("populationDensityScore",populationDensityScore);
            await this.database.addLocation(location.latitude, location.longitude, new Date(location.time), distanceScore.score, distanceScore.distance, timeScore.time, timeScore.score, wifiScore, populationDensityScore);

            await this.checkForPendingScores(location.time);
            await this.calculateCurrentScore();
            this.runningScoresCalculation = false;
            this.api.sendPendingScoresToServer();
        }
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
        this.events.publish('scoreChanges', core.completeScore);
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
        locationsByHour = full ? locationsByHour : lastElement ? [lastElement] : [];
        const completeScore = await this.calculateCompleteExposition(locationsByHour);
        const encodedRoute = this.getEncodedRoute(locationsByHour);

        return {completeScore: completeScore.score, maxDistanceToHome: completeScore.maxDistanceToHome, maxTimeAway: completeScore.maxTimeAway, encodedRoute: encodedRoute}

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
