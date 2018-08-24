// Copyright 2013 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Use an EventBuilder to share event payloads. EventBuilders are both
// extensible AND immutable, so they're easy to tweak and safe to reuse.
// They can be especially useful in larger code bases where centralized
// control over events is desired.


var service, tracker;

//Sends APP Views and Timing information to GA
function startApp() {
  // Initialize the Analytics service object with the name of your app.
  service = analytics.getService('GA_Debugger');
  service.getConfig().addCallback(initAnalyticsConfig);

  // Get a Tracker using your Google Analytics app Tracking ID.
  tracker = service.getTracker('UA-599058-203');

  // Start timing...
  var timing = tracker.startTiming('Analytics Performance', 'Send Event');

  // Record an "appView" each time the user launches your app or goes to a new
  // screen within the app.
  tracker.sendAppView(document.title);

  // ...send elapsed time since we started timing.
  timing.send();

  setupAnalyticsListener();
}

// Checks to see if tracking consent has been provided
function initAnalyticsConfig(config) {
var settings = document.getElementById('settings-loading');

  if( settings !== null){
    document.getElementById('settings-loading').hidden = true;
    document.getElementById('settings-loaded').hidden = false;

    var checkbox = document.getElementById('tracking-permitted');
    checkbox.checked = config.isTrackingPermitted();
    checkbox.onchange = function() {
      config.setTrackingPermitted(checkbox.checked);
    };
  }
}

window.onload = startApp;
