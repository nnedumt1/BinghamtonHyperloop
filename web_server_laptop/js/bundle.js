(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
    Abstract class for the many types of telemetry data enclosing similar functionality
    through their own implementations
*/


class TelemetryData {
    
    constructor () {
        if (this.constructor == TelemetryData) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    init (context, numSensors, numPreviousTimes) {
        this.chart = new Chart(context, initChart);
        
        this.setChartDataArray(numPreviousTimes);
        for (let i = 0; i < numSensors; i++) this.addNewSensorToArray();
    }

    setChartDataArray (numPreviousTimes) {
        this.lenOfEachArray = numPreviousTimes;
        this.sensorArrays = new Array();

        this.chart.data.datasets.forEach((data, index) => {
            data = this.sensorArrays[index];
        });

        let timeArray = new Array(this.lenOfEachArray).map((element, index) => {element = index * this });
    }
    
    addNewSensorToArray () {
        let sensorArray = new Array(this.lenOfEachArray).fill(0);
        this.sensorArrays.push(sensorArray);
    }

    setXMLOnLoad (request) {
        
        const wrapSensorArray = (index) => {return this.getSensorArray(index)};
        const wrapSetSensorArray = (index, data) => {this.setSensorArray(index, data);};

        request.onload = () => {
            let sensorIndex = request.index;
            
            let sensorArray = wrapSensorArray(sensorIndex);
            
            let value;
            if ((value = getNumber(request.responseText)) != null) {
                this.chart.data.datasets[sensorIndex].data = updateDataArray(sensorArray, value, this.lenOfEachArray);
            } else {
                this.chart.data.datasets[sensorIndex].data = updateDataArray(sensorArray, -1, this.lenOfEachArray);
            }

            wrapSetSensorArray(sensorIndex, this.chart.data.datasets[sensorIndex].data);
            
            this.chart.update();
        }
    }

    sendXMLRequests (link) {
       for (let i = 0; i < this.getNumOfSensors(); i++) {
            let sensorId = i + 1;
            let finalLink = link.concat(`${sensorId}`);

            let request = new XMLHttpRequest();

            request.open("GET", finalLink);
            request.index = i;
            this.setXMLOnLoad(request);
            request.send();            
        }
    }

    getSensorArray (index) {
        return this.sensorArrays[index];
    }
    
    setSensorArray (index, sensorArray) {
        this.sensorArrays[index] = sensorArray;
    }
    
    getNumOfSensors () {
        return this.sensorArrays.length;
    }

    setChartAxis (refreshTime) {
        resetChartXAxis (refreshTime, this.lenOfEachArray, this.chart);
    }

    resetChartLabel (xAxisName, yAxisName) {
        this.chart.options.scales.xAxes[0].scaleLabel.labelString = xAxisName;
        this.chart.options.scales.yAxes[0].scaleLabel.labelString = yAxisName;
        this.chart.update();
    }

    destroyChart () {
        this.chart.destroy();
    }

    // ---------------------------- abstract methods --------------------------
    sendRequests (path) {
        throw new Error("Method 'sendRequests(path)' must be implemented.");
    }
}

module.exports = TelemetryData;

let xAxisLabel;
let refreshTime;
let lenOfEachArray;
let XMLRequestsArray;
let sensorArrays;
let chart;

Chart.defaults.global.defaultFontColor = 'white';
Chart.defaults.global.defaultFontSize = 16;

const initChart = {
    type: 'line',

    data: {
        labels: xAxisLabel,
        datasets: [
            {
                label: 'Sensor 1',
                
                borderColor: 'rgb(50, 99, 132)',
                data: []
            }, {
                label: 'Sensor 2',
                
                borderColor: 'rgb(150, 169, 132)',
                data: []
            }, {
                label: 'Sensor 3',
                
                borderColor: 'rgb(70, 170, 132)',
                data: []
            }, {
                label: 'Sensor 4',
                
                borderColor: 'rgb(250, 99, 132)',
                data: []
            }
        ]
    },

    options: {
        responsive: false,
        scales: {
            yAxes: [{
                ticks: {
                    callback: function(value, index, values) {
                        return value + ' °f';
                    },
                    suggestedMax: 150
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Temperature',
                    fontColor: 'white'
                }
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Time',
                    fontColor: 'white'
                }
            }]
        }
    }
}

const getNumber = (data) => {
    const regex = /(-*\d+\.?\d*)/;
    let value = regex.exec(data);

    if (value === null) return null;
    
    value = value[1];
    if (value.slice(-1) === '.') value + '0';
    return value;
}

const updateDataArray = (array, newValue, lenOfEachArray) => {
    
    let temp = array.slice(0, lenOfEachArray - 1);
    return [newValue].concat(temp);
}

const resetChartXAxis = (refreshTime, lenOfEachArray, chart) => {
    let xAxisLabel = new Array(lenOfEachArray).fill(0);
    xAxisLabel = xAxisLabel.map((element, index) => {
        return `${(index * refreshTime)/(1000)} s`;
    });

    chart.data.labels = xAxisLabel;
    chart.update();
}




},{}],2:[function(require,module,exports){
const TelemetryData = require('./TelemetryData');

class Temperature extends TelemetryData {
    
    constructor(context, numSensors, numPreviousTimes) {
        super();
        this.init(context,numSensors, numPreviousTimes);
    }

    sendRequests (path) {
        this.sendXMLRequests(`http://${path}:3002/temp/`);
    }

    changeAxisLabels () {
        this.resetChartLabel('Time', 'Temperature');
    }

}

module.exports = Temperature;



},{"./TelemetryData":1}],3:[function(require,module,exports){
const Temperature = require('./Temperature');

var ctx = document.getElementById('myChart').getContext('2d');

var startButton = document.getElementById("startButton");
var stopButton = document.getElementById("stopButton");
var timeInput = document.getElementById("timeInput");

var tempButton = document.getElementById("temp");
var distButton = document.getElementById("dist");
var speedButton = document.getElementById("speed");

const PATH = "localhost";


var requestState = "STOP";
var myInterval;
var connectionGood = true;

var sensorState = "Temperature";
var sensorClass = null;

function init () {
    
    startButton.addEventListener("mouseup", () => {startAction(sensorClass, startButton);} );
    stopButton.addEventListener("mouseup", () => {stopAction(stopButton);} );

    tempButton.addEventListener("click", () => {
        sensorState = "Temperature";
        createClass();
    } );

    distButton.addEventListener("click", () => {
        sensorState = "Distance";
        createClass();
    } );

    speedButton.addEventListener("click", () => {
        sensorState = "Speed";
        createClass();
    } );

    tempButton.click();
}

const startAction = (currentClass, context) => {

    if (requestState == "STOP") {

        if (!connectionGood) {
            alert("Requests could not be sent, other server offline. Restart server!");
            return;
        }
        
        let valueRefresh = timeInput.value;

        currentClass.setChartAxis(valueRefresh);
       
        if (valueRefresh === "" || valueRefresh  < 10) {
            alert("Invalid refresh time. Cannot start!");
            return;
        }

        stopButton.style.border = null;
        timeInput.style.background = "#808080";
        timeInput.disabled = true;
        
        context.classList.remove('mouse-down');
        context.style.borderColor = "#ffffff";

        currentClass.sendRequests(PATH);
        if (connectionGood) myInterval = setInterval(() => (currentClass.sendRequests(PATH)), valueRefresh);
        requestState = "START"
    } else {
        // report error
    }
}

const stopAction = (context) => {
    if (requestState == "START" ) {
        startButton.style.border = null;
        timeInput.style.background = "#ffffff";
        timeInput.disabled = false;

        context.classList.remove('mouse-down');
        context.style.borderColor = "#ffffff";

        clearInterval(myInterval);
        requestState = "STOP";
    } else {
        // report error
    }
}

const createClass = () => {
    let [numSensors, numPreviousTimes] = [2, 10];

    if (sensorClass) sensorClass.destroyChart();

    switch (sensorState) {
        case "Temperature":
            
            sensorClass = new Temperature(ctx, numSensors, numPreviousTimes);
            tempButton.style.borderColor = "#ffffff";
            distButton.style.border = null;
            speedButton.style.border = null;

            tempButton.disabled = true;
            distButton.disabled = false;
            speedButton.disabled = false;
            break;
        case "Distance":
            sensorClass = new Temperature(ctx, 2, 10);
            tempButton.style.border = null;
            distButton.style.borderColor = "#ffffff";
            speedButton.style.border = null;

            tempButton.disabled = false;
            distButton.disabled = true;
            speedButton.disabled = false;
            break;
        case "Speed":
            sensorClass = null;
            tempButton.style.border = null;
            distButton.style.border = null;
            speedButton.style.borderColor = "#ffffff";

            tempButton.disabled = false;
            distButton.disabled = false;
            speedButton.disabled = true;
            break;
    }

    sensorClass.changeAxisLabels();
    sensorClass.setChartAxis(timeInput.value);
}


stopButton.style.borderColor = "#ffffff";
tempButton.style.borderColor = "#ffffff";

init();
},{"./Temperature":2}]},{},[3]);