(function() {
const tabStorage = {};
//var messageCount = 0;

//Confirmation the Extention has loaded
chrome.runtime.onInstalled.addListener(function() {
	console.log('backround script loaded');
});

//Checks for the active tab
chrome.tabs.onActivated.addListener((tab) => {
		const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
		if (!tabStorage.hasOwnProperty(tabId)) {
				tabStorage[tabId] = {
						id: tabId,
						requests: {},
						registerTime: new Date().getTime()
				};
		}
		updateBadage(tabId);
});
//
chrome.tabs.onRemoved.addListener((tab) => {
		const tabId = tab.tabId;
		if (!tabStorage.hasOwnProperty(tabId)) {
				return;
		}
		tabStorage[tabId] = null;
});

//Network Listener
chrome.webRequest.onBeforeRequest.addListener(function(details) {
    if(details.url.indexOf('/collect') > -1){
			var message = parseGAQueryString(getQueryString(details));
			const { tabId, requestId } = details;

      if (!tabStorage.hasOwnProperty(tabId)) {
          return;
      }

			//Creates Index of GA Tracking Ids;
			if(!tabStorage[tabId].hasOwnProperty('gaTrackingIdIndex')){
				  tabStorage[tabId]['gaTrackingIdIndex'] = [message.gaTrackingId];
			} else{
				 if(tabStorage[tabId]['gaTrackingIdIndex'].indexOf(message.gaTrackingId) == -1){
					 tabStorage[tabId]['gaTrackingIdIndex'].push(message.gaTrackingId);
				 }
			}


      tabStorage[tabId].requests[requestId] = {
          requestId: requestId,
				  gaTrackingId: message.gaTrackingId,
          url: details.url,
          startTime: details.timeStamp,
          status: 'pending',
					message: message
      };
			updateBadage(tabId);
			console.log(tabStorage[tabId].requests[requestId]);

	//
/*
			var messageKey = message.tabId+'-'+[messageCount];
			var storage = { [messageKey] : message};
  	//sending messages to storage
  	chrome.storage.sync.set(storage, function() {
      //  console.log('Value is set to ' + JSON.stringify(storage));
      });
      messageCount++;
*/
    }
},{urls: ["<all_urls>"]},["requestBody"]);

chrome.webRequest.onCompleted.addListener((details) => {
	if(details.url.indexOf('/collect') > -1){
		const { tabId, requestId } = details;
		if (!tabStorage.hasOwnProperty(tabId)) {
				return;
		}

		const request = tabStorage[tabId].requests[requestId];

		Object.assign(request, {
				endTime: details.timeStamp,
				requestDuration: details.timeStamp - request.startTime,
				status: 'complete'
		});

		//console.log(tabStorage[tabId].requests[requestId]);
		//console.log(tabStorage);

	}
}, {urls: ["<all_urls>"]});

chrome.webRequest.onErrorOccurred.addListener((details)=> {
	if(details.url.indexOf('/collect') > -1){
		const { tabId, requestId } = details;
		if (!tabStorage.hasOwnProperty(tabId)) {
				return;
		}

		const request = tabStorage[tabId].requests[requestId];
		Object.assign(request, {
				endTime: details.timeStamp,
				status: 'error',
		});

	//	console.log(tabStorage[tabId].requests[requestId]);
	}
}, {urls: ["<all_urls>"]});

chrome.webRequest.onBeforeSendHeaders.addListener((details)=> {
  if(details.url.indexOf('/collect') > -1){
    const { tabId, requestId } = details;
    if (!tabStorage.hasOwnProperty(tabId)) {
        return;
    }

    const request = tabStorage[tabId].requests[requestId];
    Object.assign(request, {
        endTime: details.timeStamp,
        status: 'onBeforeSendHeaders',
    });

  //  console.log(tabStorage[tabId].requests[requestId]);
  }
}, {urls: ["<all_urls>"]});

chrome.webRequest.onSendHeaders.addListener((details)=> {
  if(details.url.indexOf('/collect') > -1){
    const { tabId, requestId } = details;
    if (!tabStorage.hasOwnProperty(tabId)) {
        return;
    }

    const request = tabStorage[tabId].requests[requestId];
    Object.assign(request, {
        endTime: details.timeStamp,
        status: 'onSendHeaders',
    });

  //  console.log(tabStorage[tabId].requests[requestId]);
  }
}, {urls: ["<all_urls>"]});
chrome.webRequest.onHeadersReceived.addListener((details)=> {
  if(details.url.indexOf('/collect') > -1){
    const { tabId, requestId } = details;
    if (!tabStorage.hasOwnProperty(tabId)) {
        return;
    }

    const request = tabStorage[tabId].requests[requestId];
    Object.assign(request, {
        endTime: details.timeStamp,
        status: 'onHeadersReceived',
    });

  //  console.log(tabStorage[tabId].requests[requestId]);
  }
}, {urls: ["<all_urls>"]});
chrome.webRequest.onResponseStarted.addListener((details)=> {
  if(details.url.indexOf('/collect') > -1){
    const { tabId, requestId } = details;
    if (!tabStorage.hasOwnProperty(tabId)) {
        return;
    }

    const request = tabStorage[tabId].requests[requestId];
    Object.assign(request, {
        endTime: details.timeStamp,
        status: 'onResponseStarted',
    });

  //  console.log(tabStorage[tabId].requests[requestId]);
  }
}, {urls: ["<all_urls>"]});
/////////////////////
// Message Listener / Handler
//////////////////////
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    switch (msg.type) {
        case 'popupInit':
            response(tabStorage[msg.tabId]);
            break;
        default:
            response('unknown request');
            break;
    }
});

/////////////////////////////
//  Tab Refresh Handler / Listener
////////////////////////////////
chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){
  if(changeInfo.status == 'loading'){
		console.log('THIS TAB GOT REFRESHED ' + tabId);
		tabStorage[tabId].requests = {};
  }
});
chrome.tabs.onRemoved.addListener(function(tabId,removeInfo){
	console.log('THIS TAB GOT DELETED ' + tabId);
	tabStorage[tabId].requests = {};
});
////////////////////////
// Updates the numbers under the VICE icon
///////////////////////////
function updateBadage(tabId){
	chrome.browserAction.setBadgeText({text:String(Object.keys(tabStorage[tabId].requests).length)});
}


///////////////////////
//  GA Network Call Processing Logic
/////////////////////////
function getQueryString(details) {

	if(details.method == 'GET'){
		var postedString = details.url.substring( details.url.indexOf('?') + 1 );
	} else if (details.method == 'POST'){
		var postedString = decodeURIComponent(String.fromCharCode.apply(null,
	                          new Uint8Array(details.requestBody.raw[0].bytes)));
	}
	return postedString;
}

function parseGAQueryString(queryString) {
		var requestType;
    var output = new Object();
    var JSONqueryString = queryStringToJSON(queryString);
    var HARexcludeKeys;
    HARexcludeKeys = ['v', '_v', 'a', '_s', '_u', 'jid', 'gjid', '_gid', 'z']; //Removing unneeded Key Value Pairs from HAR

    // Building Output of only necessary key value pairs
    for (var i = 0; i < JSONqueryString.length; i++) {
        if (HARexcludeKeys.indexOf(JSONqueryString[i].name) == -1) {
            if (unescape(JSONqueryString[i].value) != 'undefined') {
                output[JSONqueryString[i].name] = unescape(JSONqueryString[i].value);
            }
        }
    }

    // Identifying Request Type
    if (JSON.stringify(queryString).indexOf("t=pageview") > -1) {
	    requestType = 'PageView';
	} else if (JSON.stringify(queryString).indexOf("t=event") > -1) {
	    requestType = 'Event';
	}
    //    debug('Output',JSON.stringify({[requestType] :output}));
    return {
        "name": requestType,
				"gaTrackingId": output.tid,
        "body": output
    };
}

function queryStringToJSON(queryString) {
    var HARpostData = queryString;

    var pairs = HARpostData.split('&');
    var result = new Array;

    var i = 0;
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[i] = new Object();
        result[i].name = pair[0];
        result[i].value = decodeURIComponent(pair[1] || '');
        i++;
    });
    //debug('JSONconversion', JSON.stringify(result));
    return JSON.parse(JSON.stringify(result));

}

/*
// Checks for Tab Reload, then deletes historical tab items
chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){
 // console.log("TabID" + tabId);
 // console.log("ChangeInfo" + JSON.stringify(changeInfo));
 // console.log("Tab" + JSON.stringify(tab));
 var keysToDelete = [];
  if(changeInfo.status == 'loading'){
  	chrome.storage.sync.get(null, function(storage) {
  		console.log(storage);
  		for (var k in storage){
  			if (k.indexOf(tabId) > -1){
  				keysToDelete.push(k);
  			}
  		}
  		//console.log(keysToDelete);
  		chrome.storage.sync.remove(keysToDelete, function(){
  		console.log('Storage Cleared')
  		});
  	});

  }
});
*/

// Message Connection with DevTools.js
/*
var connections = {};

chrome.runtime.onConnect.addListener(function (port) {

    var extensionListener = function (message, sender, sendResponse) {
    	console.log(message);
    	if(message.name != 'init'){
    		var messageKey = message.tabId+'-'+[messageCount];
    		var storage = { [messageKey] : message};
	    	//sending messages to storage
	    	chrome.storage.sync.set(storage, function() {
	        //  console.log('Value is set to ' + JSON.stringify(storage));
	        });
	        messageCount++;
    	}
        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if (message.name == "init") {
          connections[message.tabId] = port;
          //console.log(port);
          return;
        }
	// other message handling
    }

    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        port.onMessage.removeListener(extensionListener);

        var tabs = Object.keys(connections);
        for (var i=0, len=tabs.length; i < len; i++) {
          if (connections[tabs[i]] == port) {
            delete connections[tabs[i]]
            break;
          }
        }
    });
});
*/

/*

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Messages from content scripts should have sender.tab set
    if (sender.tab) {
      var tabId = sender.tab.id;
      if (tabId in connections) {
        connections[tabId].postMessage(request);
      } else {
        console.log("Tab not found in connection list.");
      }
    } else {
      console.log("sender.tab not defined.");
    }
    return true;
});

*/


//storage workflow
// Clearning Storage flow
// CSS Display of items
// Sorting of Video vs Uniform
//prefix tab id on network calls
}());
