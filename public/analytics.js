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

/*
var appEvent = analytics.EventBuilder.builder().
    category('PopUp').
    action('App Open').
    dimension(1, document.getElementById('domain').innerHTML).
    dimension(2, document.getElementById('pixelCount').innerHTML);
*/
var service, tracker;

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

/*
  // Record user actions with "sendEvent". Excluding Options Page
  if( document.getElementById('domain') !== 'null'){
    tracker.send(appEvent);
  }
*/
  // ...send elapsed time since we started timing.
  timing.send();

  setupAnalyticsListener();
}

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


/**
 * Adds a filter that captures hits being sent to Google Analytics.
 * Filters are useful for keeping track of what's happening in your app...
 * you can show this info in a debug panel, or log them to the console.
 */
function setupAnalyticsListener() {
  // Listen for event hits of the 'Flavor' category, and record them.
  previous = [];
  tracker.addFilter(
      analytics.filters.FilterBuilder.builder().
          whenHitType(analytics.HitTypes.EVENT).
          whenValue(analytics.Parameters.EVENT_CATEGORY, 'Flavor').
          whenValue(analytics.Parameters.EVENT_ACTION, 'Choose').
          applyFilter(
              function(hit) {
                previous.push(
                    hit.getParameters().get(analytics.Parameters.EVENT_LABEL));
              }).
          build());
}
/*
function addButtonListener(button) {
  button.addEventListener('click', function() {
    // Another way of sending an Event (using the EventBuilder). This
    // method gives you more control over the contents of the hit.
    // E.g. you can add custom dimensions.
    tracker.send(
        FLAVOR_EVENT.label(button.id));
    currentChoice.textContent = button.textContent;
    previousChoice.textContent = previous.join(', ');
  });
}
*/
window.onload = startApp;
