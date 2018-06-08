(function() {
const tabStorage = {};
const versionNumber = chrome.runtime.getManifest().version;
let currentTabId;
let currentTabUrl;

///////////////
// Window and Tab Management
///////////////////

//Checks for the active tab changes within a window
chrome.tabs.onActivated.addListener((tab) => {
		const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
		tabUpdate(tabId);
});

//Detects window changes
chrome.windows.onFocusChanged.addListener((windowId) => {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
		const tabId = tabs ? tabs[0].id : chrome.tabs.TAB_ID_NONE;
		tabUpdate(tabId);
	});
});

function tabUpdate(tabId){
	if (!tabStorage.hasOwnProperty(tabId)) {
			tabStorage[tabId] = {
					id: tabId,
					requests: {},
					registerTime: new Date().getTime()
			};
	}
	// Checks TAB URL and Filters out any Chrome Extension URLs
	chrome.tabs.get(tabId, function(tab){
				if(tab.url.indexOf('chrome-extension://') == -1){
					currentTabId = tab.id;
					currentTabUrl = tab.url;
				}
	});

	updateBadge(tabId);
}

chrome.tabs.onRemoved.addListener((tab) => {
		const tabId = tab.tabId;
		if (!tabStorage.hasOwnProperty(tabId)) {
				return;
		}
		tabStorage[tabId] = null;
});

/////////////////////////////
//  Tab Refresh Handler / Listener
////////////////////////////////
chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){
  if(changeInfo.status == 'loading'){
		console.log('THIS TAB GOT REFRESHED ' + tabId);
		tabStorage[tabId].requests = {};
		updateBadge(tabId);
  }
});
chrome.tabs.onRemoved.addListener(function(tabId,removeInfo){
	console.log('THIS TAB GOT DELETED ' + tabId);
	tabStorage[tabId].requests = {};
});

////////////////////////
// Updates the numbers under the VICE icon
///////////////////////////
function updateBadge(tabId){
	var badgeText = String(Object.keys(tabStorage[tabId].requests).length);
	if(badgeText == '0'){
		badgeText = '';
		chrome.browserAction.setIcon({'path':'images/grey_icon.png'});
	}else{
		chrome.browserAction.setIcon({'path':'images/black_icon.png'});
	}
	chrome.browserAction.setBadgeText({text:badgeText});
}


////////////////
// Network Listeners
///////////////////

chrome.webRequest.onBeforeRequest.addListener(function(details) {
	var message;

    if(details.url.indexOf('www.google-analytics.com') > -1 && details.url.indexOf('/collect') > -1 ){
			message = parseGAQueryString(getQueryString(details));
		}	else if(details.url.indexOf('segment.io') > -1 ){
			message = parseSegmentPayLoad(getQueryString(details));
		};


		if(message){
			const { tabId, requestId } = details;

      if (!tabStorage.hasOwnProperty(tabId)) {
          return;
      }

			//Creates Index of GA Tracking Ids;
			if(!tabStorage[tabId].hasOwnProperty('gaTrackingIdIndex')){
				if(message.gaTrackingId != null){
				  tabStorage[tabId]['gaTrackingIdIndex'] = [message.gaTrackingId];
				}
			} else{
				 if(tabStorage[tabId]['gaTrackingIdIndex'].indexOf(message.gaTrackingId) == -1 && message.gaTrackingId != null){
					 tabStorage[tabId]['gaTrackingIdIndex'].push(message.gaTrackingId);
				 }
			}

      tabStorage[tabId].requests[requestId] = {
          requestId: requestId,
				  gaTrackingId: message.gaTrackingId,
					pixelType: message.pixelType,
          url: details.url,
          startTime: details.timeStamp,
          status: 'pending',
					message: message
      }

			updateBadge(tabId);
		//	console.log(tabStorage[tabId].requests[requestId]);
		}

},{urls: ["<all_urls>"]},["requestBody"]);

function confirmMessage(details){
	var message = false;
	if(details.url.indexOf('www.google-analytics.com') > -1 && details.url.indexOf('/collect') > -1 ){
		message = true;
	}	else if(details.url.indexOf('segment.io') > -1 ){
		message = true;
	}
	return message;
}

chrome.webRequest.onCompleted.addListener((details) => {
		var message = confirmMessage(details);

	if(message){
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
	}
}, {urls: ["<all_urls>"]});

chrome.webRequest.onErrorOccurred.addListener((details)=> {
		var message = confirmMessage(details);

		if(message){
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
		var message = confirmMessage(details);

		if(message){
		const { tabId, requestId } = details;
    const request = tabStorage[tabId].requests[requestId];
    Object.assign(request, {
        endTime: details.timeStamp,
        status: 'onBeforeSendHeaders',
    });

  //  console.log(tabStorage[tabId].requests[requestId]);
  }
}, {urls: ["<all_urls>"]});

chrome.webRequest.onSendHeaders.addListener((details)=> {
		var message = confirmMessage(details);
		if(message){
		const { tabId, requestId } = details;
    const request = tabStorage[tabId].requests[requestId];
    Object.assign(request, {
        endTime: details.timeStamp,
        status: 'onSendHeaders',
    });

  //  console.log(tabStorage[tabId].requests[requestId]);
  }
}, {urls: ["<all_urls>"]});
chrome.webRequest.onHeadersReceived.addListener((details)=> {
		var message = confirmMessage(details);

		if(message){
		const { tabId, requestId } = details;
    const request = tabStorage[tabId].requests[requestId];
    Object.assign(request, {
        endTime: details.timeStamp,
        status: 'onHeadersReceived',
    });

  //  console.log(tabStorage[tabId].requests[requestId]);
  }
}, {urls: ["<all_urls>"]});
chrome.webRequest.onResponseStarted.addListener((details)=> {
	var message = confirmMessage(details);

		if(message){
		const { tabId, requestId } = details;
    const request = tabStorage[tabId].requests[requestId];
    Object.assign(request, {
        endTime: details.timeStamp,
        status: 'onResponseStarted',
    });

  //  console.log(tabStorage[tabId].requests[requestId]);
  }
}, {urls: ["<all_urls>"]});


/////////////////////
// Popup Message Listener / Handler
//////////////////////
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    switch (msg.type) {
        case 'popupInit':
            //response(tabStorage[msg.tabId]);
						response({'url':currentTabUrl ,'data':tabStorage[currentTabId], 'version':versionNumber});
					//	console.log('message tab ' + msg.tabId + ' current tab' + currentTabId)
            break;
        default:
            response('unknown request');
            break;
    }
});



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
				"pixelType": "Google Analytics",
				"gaTrackingId": output.tid,
        "body": output
    };
}

function parseSegmentPayLoad(queryString) {
		var requestType;
    var output = new Object();
    var JSONqueryString = JSON.parse(queryString);

		/////WORK ON BELOW

    // Identifying Request Type
    if (JSONqueryString.type == 'identify') {
	      requestType = 'Identify';
		}else if (JSONqueryString.type == 'track') {
		    requestType = 'Track';
		}else if (JSONqueryString.type == 'page') {
		    requestType = 'Page';
		}
    return {
        "name": requestType,
				"pixelType": "Segment",
				"gaTrackingId": JSONqueryString.writeKey,
        "body": JSONqueryString
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

}());
