/*global chrome*/
export function getCurrentTab(callback) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    },
    (tabs) => {
        callback(tabs[0]);
    });
}

export function getGAConfig(callback){
  chrome.storage.local.get(['gaConfig'], function(items) {
    callback(items.gaConfig);
  });
}
