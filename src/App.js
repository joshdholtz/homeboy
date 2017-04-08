import React, { Component } from 'react';
import { Form, FormGroup, Col, Button, ControlLabel, Image, FormControl } from 'react-bootstrap';

import 'whatwg-fetch';
import moment from 'moment';

import './App.css';

import doorOpen from './images/open-door.svg';
import doorClosed from './images/closed-door.svg';
import dry from './images/dry.svg';
import wet from './images/wet.svg';

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}

class App extends Component {
  
  constructor(props) {
    super();

/*    
{
   "ironProjectID":"your-project-id",
   "ironCache":"your-cache-name",
   "ironToken":"your-token",
   "refreshRateMS":10000,
   "sensors":[
      {
         "displayName":"Front Door",
         "type":"door",
         "keys":{
            "openState":"Front_Door@Home_open_state",
            "temp":"Front_Door@Home_temp",
            "humidity":"Front_Door@Home_humidity"
         }
      },
      {
         "displayName":"Crawlspace",
         "type":"water",
         "keys":{
            "waterState":"Crawlspace@Home_water_state",
            "temp":"Crawlspace@Home_temp",
            "humidity":"Crawlspace@Home_humidity"
         }
      }
   ]
}
*/
    
    let config = localStorage.getObject('config')

    this.state = {
      configInput: "",
      config: config,
      lastUpdated: "-",
      sensorState: {}
    };
  }
  
  componentDidMount() {
    if (this.state.config) {
      let refreshRateMS = this.state.config.refreshRateMS
      if (refreshRateMS) {
        setInterval(() => {
          this.refresh()
        }, refreshRateMS)
      }
      
      this.refresh()
    }
  }
  
  refresh() {
    // Get all keys
    let keys = this.state.config.sensors.map((sensor) => {
      let keys = []
      for (var key in sensor.keys) {
        var value = sensor.keys[key];
        keys.push(value)
      }
      return keys
    })
    keys = [].concat.apply([], keys)
    
    let promises = keys.map((key) => {
      return this.makeRequest(key)
    })
    
    Promise.all(promises).then((values) => {
      let state = {}
      for (var key in values) {
        let value = values[key]
        state[value.key] = value.value
      }
      
      this.setState({
        sensorState: state,
        lastUpdated: moment().format('MMMM Do, h:mm:ssa')
      })
    })
  }

  makeRequest(cacheKey, success, failure) {
    return new Promise((resolve, reject) => {
      let url = `https://cache-aws-us-east-1.iron.io/1/projects/${this.state.config.ironProjectID}/caches/${this.state.config.ironCache}/items/${cacheKey}?oauth=${this.state.config.ironToken}`
      
      // Create the XHR object.
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
       
      // missing content-type header will lead to a 406 response
      xhr.setRequestHeader("Content-Type", "application/json");
       
      // Parse the response in the format of a JSON string
      xhr.onload = function() {
        var text = xhr.responseText;
        var resp = JSON.parse(text)
        resolve(resp)
      };
       
      xhr.onerror = function() {
        reject()
      };
       
      xhr.send();
    })
  }
  
  round(number) {
    if (number) {
      return Math.max( Math.round(number * 10) / 10, 2.8 ).toFixed(0)
    }
    return "-"
  }
  
  renderSensor(sensor) {
    if (sensor.type === "door") {
      return this.renderDoorSensor(sensor)
    } else if (sensor.type === "water") {
      return this.renderWaterSensor(sensor);
    } else {
      return null
    }
  }
  
  renderDoorSensor(sensor) {
    let state = this.state.sensorState[sensor.keys.openState] || "closed"
    let isOpen = state === "open"
    let temp = this.state.sensorState[sensor.keys.temp]
    let humidity = this.state.sensorState[sensor.keys.humidity]
    
    return (
      <li key={sensor.displayName} className="sensor">
        <div className="sensor--name">{sensor.displayName}</div>
        <Image className="sensor--image" responsive src={isOpen ? doorOpen : doorClosed}></Image>
        <div className="sensor--image-info">{state}</div>
        <div className="sensor--infos">
          <div className="sensor--info">
            <div className="sensor--info-value degrees">
              {this.round(temp)}
            </div>
            <div className="sensor--info-label">Temperature</div>
          </div>
          <div className="sensor--info">
            <div className="sensor--info-value percent">
              {this.round(humidity)}
            </div>
            <div className="sensor--info-label">Humidity</div>
          </div>
        </div>
        <div className="sensor--updated">Last updated: 6s ago</div>
      </li>
    )
  }
  
  renderWaterSensor(sensor) {
    let state = this.state.sensorState[sensor.keys.waterState] || "dry"
    let isWet = state === "wet"
    let temp = this.state.sensorState[sensor.keys.temp]
    let humidity = this.state.sensorState[sensor.keys.humidity]
    
    return (
      <li key={sensor.displayName} className="sensor">
        <div className="sensor--name">{sensor.displayName}</div>
        <Image className="sensor--image" responsive src={isWet ? wet : dry}></Image>
        <div className="sensor--image-info">{state}</div>
        <div className="sensor--infos">
          <div className="sensor--info">
            <div className="sensor--info-value degrees">
              {this.round(temp)}
            </div>
            <div className="sensor--info-label">Temperature</div>
          </div>
          <div className="sensor--info">
            <div className="sensor--info-value percent">
              {this.round(humidity)}
            </div>
            <div className="sensor--info-label">Humidity</div>
          </div>
        </div>
        <div className="sensor--updated">Last updated: 6s ago</div>
      </li>
    )
  }
  
  handleConfigSave(e) {
    e.preventDefault()
    
    let configInput = this.state.configInput
    if (configInput) {
      let config = JSON.parse(configInput)
      if (config) {
        localStorage.setObject('config', config)
        this.setState({
          config: config
        }, () => {
          this.refresh()
        })
      }
    }
  }
  
  renderConfig() {
    return (
      <Form onSubmit={(e) => {this.handleConfigSave(e)}}>
        <FormGroup controlId="formControlsTextarea">
          <ControlLabel className="config-label">Drop your Homebody JSON config</ControlLabel>
          <FormControl className="config-textarea" rows={15} componentClass="textarea" placeholder="Your JSON goes here, yo" onChange={(e) => {this.setState( {configInput: e.target.value} )} } />
        </FormGroup>

        <FormGroup>
          <Button  className="config-button" type="submit">
            Sure, I'll Save This
          </Button>
        </FormGroup>
      </Form>
    )
  }
  
  renderSensors() {
    return (
      <div>
        <div className="last-updated">
          <span className="last-updated--label">Last Updated:</span>
          <span className="last-updated--value">{this.state.lastUpdated}</span>
        </div>
        <ul className="sensors">
          {
            this.state.config.sensors.map((sensor) => {
              return this.renderSensor(sensor)
            })
          }
        </ul>
        <div className="image-info">
          Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>
        </div>
      </div>
    )
  }
  
  render() {
    return (
      <div className="app">
        <div className="app-header">
          <h2>Homeboy</h2>
        </div>
        {this.state.config ? this.renderSensors() : this.renderConfig()}
      </div>
    );
  }
}

export default App;
