/*global chrome*/

export function getGAConfig(callback){
  chrome.storage.local.get(['gaConfig'], function(items) {
      callback(items.gaConfig);
  });

}
