/*global chrome*/
import React, { Component } from 'react';
import './App.css';
import vice_tech_logo from './images/vicetech-square.svg';
import google_analytics_icon from './images/google_analytics_icon.png';
import down_arrow from './images/down_arrow.png';
import right_arrow from './images/right_arrow.png';
import {getCurrentTab} from "./common/Utils";
import {getGAConfig} from "./common/Utils";
import {unregister} from './registerServiceWorker';
unregister();

class CustomDimensionContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          showMoreFlag: true
        };
    }
    showMoreToggle(){
      this.setState({
        showMoreFlag: (this.state.showMoreFlag)?false:true
      });
    }

    render() {
      if(this.props.id){
        const cdKey = this.props.id;
        const cdValue = this.props.cd || '';
        const valueLengthLimit = 50;
       // console.log(cdValue)
        //{(cdValue.length > 20)?"<span>Show</span>":cdValue}
          return (
              <div className='customDimensionsSection'>
              <div className='customDimensions'>
                <span className='cdLabel'>
                  {cdKey}
                </span> : <span className='cdValue'>
                  {(cdValue.length <= valueLengthLimit) && cdValue}
                </span>
                {(cdValue.length > valueLengthLimit && this.state.showMoreFlag) &&
                <span onClick={()=>this.showMoreToggle()} className='showMore'>Show More</span>
                }
                {(cdValue.length > valueLengthLimit && this.state.showMoreFlag === false ) &&
                <span>
                  <span onClick={()=>this.showMoreToggle()} className='showMore'>Hide</span>
                  <div className='customDimensionLongText'>  {cdValue} </div>
                </span>
                }
              </div>
              </div>
          );
      }
    }
}

class EventContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            class: 'customDimensionClose'
        };
    }
  // Handles The Show and Hide Status of the Custom Dimensions
    handleClick(){
      if(this.state.open) {
        this.setState({
          open: false,
          class: "customDimensionClose"
        });
      }else{
        this.setState({
          open: true,
          class: "customDimensionOpen"
        });
      }
    }
     static renderCustomDimension(gaEvent) {
        if (gaEvent) {
            return Object.keys(gaEvent).map((key) => {
               // const {url, requestDuration, status} = trackingIdLog[key];
              return (<CustomDimensionContainer cd={gaEvent[key]} id={key} key={key} />);
            });
        }
        return '';
    }

   static customDimensionLabels(gaEvent, gaConfig, networkLabel){

     var configMap = {"cg" : "contentGroups", "cm" : "customMetrics", "cd" : "customDimensions"};
     var friendlyNameMap = {"cg" : "Content Group", "cm" : "Custom Metric", "cd" : "Custom Dimension"};

     var mappedLabel = configMap[networkLabel];
     var output = {};
     // Content Groups
     var label;
     for(var i in gaEvent){
       if(i.indexOf(networkLabel) > -1){
         if(gaConfig[gaEvent.tid]){ // Handling undefined Edge Cases
           if(gaConfig[gaEvent.tid][mappedLabel]){ // Handling undefined Edge Cases
               if(gaConfig[gaEvent.tid][mappedLabel][i]){
                  label = gaConfig[gaEvent.tid][mappedLabel][i] + " ("+i+")";
               }else {
                  label = i.replace(networkLabel,friendlyNameMap[networkLabel]+' ');
               }
          }
         }else{
              label = i.replace(networkLabel,friendlyNameMap[networkLabel]+' ');
         }
         output[label] = gaEvent[i]
      }
     }
     return output;


   }
   static reorderCustomDimensions(gaEvent, gaConfig){
     if(gaEvent.tid){
       let output = {};
       // Standard Variables
        output = {
           'Tracking ID' : gaEvent.tid,
           'Client ID' : gaEvent.cid,
           'Title' : gaEvent.dt,
           'Location' : gaEvent.dl,
           'Page' : gaEvent.dp,
           'Hit Type' : gaEvent.t,
         };
        if (gaEvent.t === 'event'){
          output['Event Category'] = gaEvent.ec;
          output['Event Action'] = gaEvent.ea;
          output['Event Label'] = gaEvent.el;
       }
       Object.assign(output, EventContainer.customDimensionLabels(gaEvent, gaConfig, 'cg'));
       Object.assign(output, EventContainer.customDimensionLabels(gaEvent, gaConfig, 'cd'));
       Object.assign(output, EventContainer.customDimensionLabels(gaEvent, gaConfig, 'cm'));

       return output;
     } else{
       return '';
     }
   }

    render() {
      const gaEvent = EventContainer.reorderCustomDimensions(this.props.gaEvent.message.body, this.props.gaConfig)
      const gaEventWrapper = this.props.gaEvent.message.body;
      const eventLabelLimit = 50;

      // Handling Event Label Conditionals
      var gaEventLabel;
      if(gaEventWrapper.t ==='event'){
            gaEventLabel =(<span>
                            <span className= {`${ (typeof gaEventWrapper.ec === 'undefined')?'statusAmber':''} `}>: {`${gaEventWrapper.ec} `} </span>|
                            <span className= {`${ (typeof gaEventWrapper.ea === 'undefined')?'statusAmber':''} `}> {`${gaEventWrapper.ea} `} </span>|
                            <span className= {`${ (typeof gaEventWrapper.el === 'undefined')?'statusAmber':''} `}> {`${gaEventWrapper.el} `} </span>
                          </span>);
      } else {
            gaEventLabel = ' : '+ gaEventWrapper.dt;
      }

      //Handling Arrow Orientation
      var eventArrow;
      if(this.state.open){
        eventArrow = (<img className='EventArrow' src={down_arrow} alt='down_arrow'/>);
      } else{
        eventArrow = (<img className='EventArrow' src={right_arrow} alt='right_arrow'/>);
      }

      //Handing HitType label
      var hitTypeLabel = (gaEventWrapper.t ==='event')?'Event ':(gaEventWrapper.t ==='pageview')?'Page View ':gaEventWrapper.t;

        return (
            <div>
                <div className='EventTitle'
                  onClick={() => this.handleClick()}>
                  {eventArrow}{hitTypeLabel}
                  <span className={(this.props.gaEvent.status === 'complete')?'':'statusRed'}>
                     ({this.props.gaEvent.status})
                  </span>
                  {(gaEventLabel.length > eventLabelLimit)?gaEventLabel.substring(0,eventLabelLimit)+'...':gaEventLabel}
                </div>
            <div className={this.state.class}>{EventContainer.renderCustomDimension(gaEvent)}</div>
            </div>
        );
    }
}

class TrackingIdContainer extends React.Component {

    static renderGaEvent(gaEventLog, gaConfig) {
        if (gaEventLog) {
            return Object.keys(gaEventLog).map((key) => {
              return (<EventContainer gaEvent={gaEventLog[key]} id={key} key={key} gaConfig={gaConfig}/>);
            });
        }
        return '';
    }

    render() {
      const gaTrackingId = this.props.id;
      const gaEventLog = this.props.gaEventLog;

        return (
          <div>
            <div className='trackingHeader'>
              <div>
                <img className='trackingLogo' src={google_analytics_icon} alt='google_analytics_icon'/>
              </div>
              <div>
                <div className='trackingLabel'>Google Analytics Pixel</div>
                <div className='trackingId'>Tracking ID: {gaTrackingId}</div>
              </div>
          </div>
             {TrackingIdContainer.renderGaEvent(gaEventLog, this.props.gaConfig)}
          <br></br>
          </div>

        );
    }
}

class TrafficContainer extends React.Component {

 static gaEventsbyID(trafficLog) {
    if (trafficLog.gaTrackingIdIndex) {
      const eventsByIdOutput = {};

      trafficLog.gaTrackingIdIndex.forEach(function(trackingId){
        for(var j in trafficLog.requests){
            if(trafficLog.requests[j].gaTrackingId === trackingId){
              eventsByIdOutput[trackingId] = eventsByIdOutput[trackingId] || {};
              eventsByIdOutput[trackingId][j] = trafficLog.requests[j];
            }
        }
      })
     return eventsByIdOutput;

    }
  return '';
  }

    static renderTrackingIds(trackingIdLog, gaConfig) {
        if (trackingIdLog) {
            return Object.keys(trackingIdLog).map((key) => {
               // const {url, requestDuration, status} = trackingIdLog[key];
              return (<TrackingIdContainer gaEventLog={trackingIdLog[key]} id={key} key={key} gaConfig={gaConfig} />);
            });
        }
        return '';
    }

    render() {

      const trafficLog = this.props.traffic;
      const trackingIdLog = TrafficContainer.gaEventsbyID(trafficLog);
   //   console.log("in traffic Container");
   //   console.log(trafficLog);
   //   console.log(trackingIdLog);

      //console.log(JSON.stringify(this.props.traffic));
        return (
            <div className = 'trackingIdBuckets'>
                {TrafficContainer.renderTrackingIds(trackingIdLog, this.props.gaConfig)}
            </div>
        );
    }
}


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            traffic: {},
            gaConfig: {},
            parentHostname: ''
        };
    }
    static getHostname(href) {
        var l = document.createElement("a");
        l.href = href;
        return l.hostname;
    };

    timer() {
       // setState method is used to update the state
       //console.log('Polling Logic Firing' + Date.now())
       this.retrieveBackgroundMsg();
    }

    componentWillMount() {
      //retrieves Network Calls from Background JS
      this.retrieveBackgroundMsg();

      getGAConfig((config) => { // Gets GA Config JSON from Storage
        getCurrentTab((tab) => { // Gets Current TabID
          // For Polling Logic to make sure all new Network calls are captured
          var intervalId = setInterval(this.timer.bind(this), 1000);
          this.setState({
              intervalId: intervalId,
              parentHostname: App.getHostname(tab.url),
              gaConfig: JSON.parse(config)
          });
        });
      });
    }

    retrieveBackgroundMsg(){
      getCurrentTab((tab) => {
        //console.log("Tab ID is "+ tab.id);
          chrome.runtime.sendMessage({type: 'popupInit', tabId: tab.id}, (response) => {
          //  console.log(JSON.stringify(response));
              if (response) {

                this.setState({
                    loaded: true,
                    traffic: Object.assign(this.state.traffic, response)
                });
        //          console.log('from Background Message Response');
              //    console.log(this.state.traffic);
              }
          });
      });
    }

    componentWillUnmount(){
      clearInterval(this.state.intervalId);
    }

    render() {
      const gaIndex = this.state.traffic.gaTrackingIdIndex || '';
     // console.log('from background');
     // console.log(response);
     // console.log(this.state.traffic);

        return (
          <div className="App">
            <header className="App-header">
              <div>
                <img className='App-logo' src={vice_tech_logo} alt="vice_tech_logo" />
              </div>
              <div className='App-title'>
                <span className="App-Header">VICE Google Analytics Debugger</span><br></br>
                <a className='App-LearnMore' href="https://github.com/VICEMedia/vice-ga-chrome-extension">Learn More</a>
              </div>
            </header>
            <div className="App-summary">
              <span>{gaIndex.length} pixel{(gaIndex.length > 1) ? 's' :''} found on {this.state.parentHostname}
            </span>
            </div>
            <div className="App-body">
              <div className="linebreak"></div>
                <TrafficContainer traffic={this.state.traffic} gaConfig={this.state.gaConfig}/>
            </div>
          </div>
        );
    }
}

export default App;
