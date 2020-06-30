import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';
import { SecureStorage } from '@ionic-native/secure-storage';
import { DatePipe } from '@angular/common';
import { File } from '@ionic-native/file';
import { Geolocation } from '@ionic-native/geolocation';
import { HttpClientModule } from '@angular/common/http';
import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { MyApp } from './app.component';
import { FormPage } from '../pages/form/form';
import { AuthPage } from '../pages/auth/auth';
import { IntelSecurity } from '@ionic-native/intel-security';
import { DatePicker } from '@ionic-native/date-picker';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { UserPage } from '../pages/user/user';
import { NetworkPage } from '../pages/network/network';
import { InformationPage } from '../pages/information/information';
import { TabsPage } from '../pages/tabs/tabs';
import { ComponentsModule } from '../components/components.module';
import { ProfilePage } from '../pages/profile/profile';
import { Clipboard } from '@ionic-native/clipboard';
import { LocationProvider } from '../providers/location/location';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { SQLite } from '@ionic-native/sqlite'
import { MedicalPage } from '../pages/medical/medical';
import { TestResultsPage } from '../pages/test-results/test-results';
import { ScoreProvider } from '../providers/score/score';
import { APIProvider } from '../providers/api/api';
import { ValidationsProvider } from '../providers/validations/validations';
import { AlertProvider } from '../providers/alert/alert';
import { DatabaseProvider } from '../providers/database/database';
import { StorageProvider } from '../providers/storage/storage';
import { AboutPage } from '../pages/about/about';
import { NotificationsProvider } from '../providers/notifications/notifications';

@NgModule({
  declarations: [
    MyApp,
    FormPage,
    AuthPage,
    UserPage,
    NetworkPage,
    InformationPage,
    TabsPage,
    ProfilePage,
    MedicalPage,
    TestResultsPage,
    AboutPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    HttpClientModule,
    ComponentsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    FormPage,
    AuthPage,
    UserPage,
    NetworkPage,
    InformationPage,
    TabsPage,
    ProfilePage,
    MedicalPage,
    TestResultsPage,
    AboutPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    HTTP,
    Network,
    SecureStorage,
    LocationAccuracy,
    Diagnostic,
    LocalNotifications,
    File,
    DatePipe,
    Geolocation,
    IntelSecurity,
    DatePicker,
    Clipboard,
    LocationProvider,
    BackgroundGeolocation,
    SQLite,
    ScoreProvider,
    APIProvider,
    AlertProvider,
    DatabaseProvider,
    ValidationsProvider,
    StorageProvider,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    NotificationsProvider
  ]
})

export class AppModule {}
