import { Component, ViewChild, ElementRef, Input, OnInit, OnChanges, AfterViewInit } from '@angular/core';

import { Chart } from 'chart.js';

/**
 * Generated class for the TimeSeriesPlotComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'time-series-plot',
  templateUrl: 'time-series-plot.html'
})
export class TimeSeriesPlotComponent implements OnInit, OnChanges, AfterViewInit {

    @ViewChild('canvas') canvas: ElementRef;
    @Input() data: any[];
    @Input() parameter: string;
    @Input() area: string;
    chart: Chart;

    constructor() {
        console.log('const-ts');
    }

    ngOnInit() {
        console.log('init-ts');
    }

    ngAfterViewInit() {
        console.log('content-init-ts');
        this.generateGraph();
    }

    ngOnChanges() {
        console.log('change-ts');
        if (this.canvas !== undefined) {
            console.log('hay canvas');
            this.generateGraph();
        }
    }

    transform(data: any[], parameter: string, area: string) {

        const transformed = [];

        data.forEach(measure => {
            if (measure['CANTON'] === area || measure['PROVINCIA'] === area) {
                transformed.push({x: measure['FECHA']* 1000, y: measure[parameter]});
            }

        });
        return transformed;
    }

    generateGraph() {
        console.log('ts');
        const chartData = this.transform(this.data, this.parameter, this.area);

        this.chart = new Chart(this.canvas.nativeElement, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: this.parameter,
                        data: chartData,
                        fill: false,
                        borderColor: 'RGBA(15, 157, 88, 1)',
                        backgroundColor: 'RGBA(15, 157, 88, 1)'
                    }
                ]
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: { unit: 'day' }
                    }]
                }
            }
        });
    }

}
