import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage';
import { DatePipe } from '@angular/common';
import { File } from '@ionic-native/file';
import { Geolocation } from '@ionic-native/geolocation';
import { HttpClientModule } from '@angular/common/http';
import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
//import { HomePage2 } from '../pages/home2/home2';
import { FormPage } from '../pages/form/form';
import { FollowUpPage } from '../pages/followUp/followUp';
import { AgregarFormularioPage } from '../pages/agregarFormulario/agregarFormulario';
import { modalEditarFormularioPage } from '../pages/modalEditarFormulario/modalEditarFormulario';
import { AuthPage } from '../pages/auth/auth';
import { PerfilPage } from '../pages/perfil/perfil';
import { SentFormsPage } from '../pages/sentForms/sentForms';
import { FormulariosPage } from '../pages/formularios/formularios';
import { PendingFormsPage } from '../pages/pendingForms/pendingForms';
import { IntelSecurity } from '@ionic-native/intel-security';
import { DatePicker } from '@ionic-native/date-picker';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { UserPage } from '../pages/user/user';
import { NetworkPage } from '../pages/network/network';
import { SurveyPage } from '../pages/survey/survey';
import { DiagnosticPage } from '../pages/diagnostic/diagnostic';
import { InformationPage } from '../pages/information/information';
import { TabsPage } from '../pages/tabs/tabs';
import { PopoverPage } from '../pages/form/popover';
import { PopoverPage2 } from '../pages/form/popover2';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { ComponentsModule } from '../components/components.module';
import { ProfilePage } from '../pages/profile/profile';
import { Clipboard } from '@ionic-native/clipboard';
import { LocationProvider } from '../providers/location/location';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    FormPage,
    FollowUpPage,
    AgregarFormularioPage,
    modalEditarFormularioPage,
    AuthPage,
    PerfilPage,
    SentFormsPage,
    FormulariosPage,
    PendingFormsPage,
    UserPage,
    NetworkPage,
    SurveyPage,
    InformationPage,
    TabsPage,
    DiagnosticPage,
    PopoverPage,
    PopoverPage2,
    ProfilePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    HttpClientModule,
    ComponentsModule

    //LongPressModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    FormPage,
    FollowUpPage,
    AgregarFormularioPage,
    modalEditarFormularioPage,
    AuthPage,
    PerfilPage,
    SentFormsPage,
    FormulariosPage,
    PendingFormsPage,
    UserPage,
    NetworkPage,
    SurveyPage,
    DiagnosticPage,
    InformationPage,
    TabsPage,
    PopoverPage,
    PopoverPage2,
    ProfilePage
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
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    LocationProvider
  ]
})

export class AppModule {}
