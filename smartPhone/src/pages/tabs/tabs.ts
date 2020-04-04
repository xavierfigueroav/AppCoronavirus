import { Component } from '@angular/core';
import { UserPage } from '../user/user';
import { InformationPage } from '../information/information';
import { NetworkPage } from '../network/network';
import { SurveyPage } from '../survey/survey';
import { DiagnosticPage } from '../diagnostic/diagnostic';

@Component({
	templateUrl: 'tabs.html'
})

export class TabsPage {
	user = UserPage;
	information = InformationPage;
	network = NetworkPage;
	survey = SurveyPage;
	//survey = HomePage;
	diagnostic = DiagnosticPage;
	constructor() {}
}