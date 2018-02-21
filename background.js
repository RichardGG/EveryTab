var state = {
    screenshots: {},
    windows: []
};

// on Quick Tabs button click
chrome.browserAction.onClicked.addListener(function (tab) {
    // open tabview
    chrome.tabs.create({url: 'tabview.html', pinned: true});
});

// on tab switch
chrome.tabs.onActivated.addListener(function (activeInfo) {
    // close tabview
    chrome.tabs.query({url: 'chrome-extension://*/tabview.html'}, function(tabs) {
        tabs.forEach(function(tab) {
            if (activeInfo.tabId != tab.id) {
                //chrome.tabs.remove(tab.id);
            }
        })
    });

    // save screenshot / update tabview
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
        state.screenshots[activeInfo.tabId] = dataUrl;
        chrome.runtime.sendMessage({
            type: 'newData', 
            screenshots: state.screenshots, 
            windows: state.windows,
            reason: 'Tab Switch'
        });
    });
});

// on receive message
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // save data, respond with data
    if (request.type == 'tabs') {
        updateTabData(function() {
            sendResponse({screenshots: state.screenshots, windows: state.windows});
        });
    }
});

// on tab created
chrome.tabs.onCreated.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            screenshots: state.screenshots, 
            windows: state.windows,
            reason: 'New Tab'
        });
    });
});
// on tab updated
chrome.tabs.onUpdated.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            screenshots: state.screenshots, 
            windows: state.windows,
            reason: 'Tab Updated'
        });
    });
});
// on tab closed
chrome.tabs.onRemoved.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            screenshots: state.screenshots, 
            windows: state.windows,
            reason: 'Tab Closed'
        });
    });
});
// on tab moved
chrome.tabs.onMoved.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            screenshots: state.screenshots, 
            windows: state.windows,
            reason: 'Moved within window'
        });
    });
});
// on tab detached
chrome.tabs.onDetached.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            screenshots: state.screenshots, 
            windows: state.windows,
            reason: 'Detached from window'
        });
    });
});
// on tab attached
chrome.tabs.onAttached.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            screenshots: state.screenshots, 
            windows: state.windows,
            reason: 'Attached to window'
        });
    });
});

function updateTabData(callback) {
    chrome.windows.getAll({populate: true}, function(windows) {
        state.windows = windows;
        callback();
    });
}



// Delete screenshots on tab close
// Save top of page screenshot
// Button to switch to tabview (instead of reopen)