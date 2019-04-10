(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const TelemetryData = require('./TelemetryData');

class Distance extends TelemetryData {
    
    constructor(document, prefix, numSensors) {
        super();
        this.init(document, numSensors);
        this.buildSensorElements(prefix);
    }

    apply (path) {
        this.sendXMLRequests(`http://${path}:3002/dist/`);
    }
}

module.exports = Distance;


},{"./TelemetryData":3}],2:[function(require,module,exports){
const TelemetryData = require('./TelemetryData');

class Speed extends TelemetryData {
    
    constructor(document, prefix, numSensors) {
        super();
        this.init(document, numSensors);
        this.buildSensorElements(prefix);
    }

    apply (path) {
        this.sendXMLRequests(`http://${path}:3002/speed/`);
    }
}

module.exports = Speed;
},{"./TelemetryData":3}],3:[function(require,module,exports){
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

    init (document, numSensors) {
        this.document = document;
        this.numSensors = numSensors;
    }

    setXMLOnLoad (request) {
        request.onload = () => {
            let sensorIndex = request.index;
            let sensorElement = this.getSensorElement(sensorIndex);
            sensorElement.style.color = "#ff0026"
            
            let value;
            if ((value = getNumber(request.responseText)) != null) {
                let sensorElement = this.getSensorElement(sensorIndex);
                sensorElement.innerHTML = value;
            } else {
                sensorElement.innerHTML = "Error";
            }
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

    buildSensorElements (prefix) {
        this.sensorElements = [];

        for (let i = 0; i < this.getNumOfSensors(); i++) {
            let sensorElementName = `${prefix}${i+1}`
            this.sensorElements.push(this.document.getElementById(sensorElementName));
        }
    }

    getNumOfSensors () {
        return this.numSensors;
    }

    getSensorElement (index)  {
        return this.sensorElements[index];
    }
    
    setSensorArray (index, sensorElement) {
        this.sensorArrays[index] = sensorElement;
    }
    
    // ---------------------------- abstract methods --------------------------
    apply (path) {
        throw new Error("Method 'apply(path)' must be implemented.");
    }
}

module.exports = TelemetryData;

let document;
let numSensors;
let refreshTime;
let sensorElements;
let sensorElementPrefix;

const getNumber = (data) => {
    const regex = /(-*\d+\.?\d*)/;
    let value = regex.exec(data);

    if (value === null) return null;
    
    value = value[1];
    if (value.slice(-1) === '.') value + '0';
    return value;
}

},{}],4:[function(require,module,exports){
const TelemetryData = require('./TelemetryData');

class Temperature extends TelemetryData {
    
    constructor(document, prefix, numSensors) {
        super();
        this.init(document, numSensors);
        this.buildSensorElements(prefix);
    }

    apply (path) {
        this.sendXMLRequests(`http://${path}:3002/temp/`);
    }
}

module.exports = Temperature;
},{"./TelemetryData":3}],5:[function(require,module,exports){
const Temperature = require('./Temperature');
const Distance = require('./Distance');
const Speed = require('./Speed');

var startButton = document.getElementById("startButton");
var stopButton = document.getElementById("stopButton");
var timeInput = document.getElementById("timeInput");


var state = "STOP";
var myInterval;
var connectionGood = true;

const PATH = "localhost";

let classes;

function init () {
    classes = [new Temperature(document, 'tempSensor', 2)];

    // new Distance(document, 'distSensor', 4), 
    // new Speed(document, 'speedSensor', 4)
    
    startButton.addEventListener("mouseup", () => {startAction(startButton);});
    stopButton.addEventListener("mouseup", () => {stopAction(stopButton);});
}

const startAction = (context) => {
    if (state !== "START") {
        if (!connectionGood) {
            alert("Requests could not be sent, other server offline. Restart server!");
            return;
        }
        
        let valueRefresh = timeInput.value;
       
        if (valueRefresh === "" || valueRefresh  < 10) {
            alert("Invalid refresh time. Cannot start!");
            return;
        }

        stopButton.style.border = null;
        timeInput.style.background = "#808080";
        timeInput.disabled = true;
        
        state = "START"
        context.classList.remove('mouse-down');
        context.style.borderColor = "#ffffff";

        sendRequests();
        if (connectionGood) myInterval = setInterval(sendRequests, valueRefresh);

    } else {
        // report error
    }
}

const stopAction = (context) => {
    if (state !== "STOP" ) {
        startButton.style.border = null;
        timeInput.style.background = "#ffffff";
        timeInput.disabled = false;

        state = "STOP"
        context.classList.remove('mouse-down');
        context.style.borderColor = "#ffffff";

        clearInterval(myInterval);
    } else {
        // report error
    }
}

function sendRequests () {
    classes.forEach(element => {
            element.apply(PATH);
    });
}

init();

stopButton.style.borderColor = "#ffffff";

},{"./Distance":1,"./Speed":2,"./Temperature":4}]},{},[5]);
