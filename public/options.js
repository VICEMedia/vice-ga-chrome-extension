// Saves options to chrome.storage
function save_options() {
  var configFile = document.getElementById('file_upload').value;
  var preserveLog = document.getElementById('preserve_log').checked;
  console.log(preserveLog);
  chrome.storage.local.set({
    gaConfig: configFile,
    preserveLogFlag: preserveLog
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get(['gaConfig'], function(items) {
    document.getElementById('file_upload').value = items.gaConfig;
  });
  chrome.storage.local.get(['preserveLogFlag'], function(items) {
    document.getElementById('preserve_log').checked = items.preserveLogFlag;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
