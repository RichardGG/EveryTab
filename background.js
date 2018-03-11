var state = {
    screenshots: {},
    windows: [],
};


// on Quick Tabs button click
chrome.browserAction.onClicked.addListener(function (tab) {
    // save screenshot, current tab id, open tabview
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
        state.screenshots[tab.tabId] = dataUrl;
        state.current = tab.tabId;

        // check for extension tab
        chrome.tabs.query(
            {
                windowId: chrome.windows.WINDOW_ID_CURRENT, 
                url: 'chrome-extension://' + chrome.runtime.id + '/tabview.html'
            }, 
            function(tabs) {
                // if tab exists, switch to it
                if (tabs.length) {
                    var tab = tabs[0];
                    chrome.tabs.highlight({windowId: tab.windowId, tabs: tab.index});
                } else {
                    // otherwise, create it
                    chrome.tabs.create({url: 'tabview.html', pinned: true},
                        function (tab) {
                            state.extension = tab.id
                            console.log(tab);
                        }
                    );
                }
            }
        );
        
    });
});

// on tab switch
chrome.tabs.onActivated.addListener(function (activeInfo) {
    // save screenshot / update tabview
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
        state.screenshots[activeInfo.tabId] = dataUrl;
        chrome.runtime.sendMessage({
            type: 'newData', 
            state: state,
            reason: 'Tab Switch'
        });
    });
});

// on receive message
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // save data, respond with data
    if (request.type == 'tabs') {
        updateTabData(function() {
            console.log('done');
            sendResponse({state: state});
        });
    }
});

// on tab created
chrome.tabs.onCreated.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            state: state,
            reason: 'New Tab'
        });
    });
});
// on tab updated
chrome.tabs.onUpdated.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            state: state,
            reason: 'Tab Updated'
        });
    });
});
// on tab closed
chrome.tabs.onRemoved.addListener(function (tabId) {
    delete state.screenshots[tabId];
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            state: state,
            reason: 'Tab Closed'
        });
    });
});
// on tab moved
chrome.tabs.onMoved.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            state: state,
            reason: 'Moved within window'
        });
    });
});
// on tab detached
chrome.tabs.onDetached.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            state: state,
            reason: 'Detached from window'
        });
    });
});
// on tab attached
chrome.tabs.onAttached.addListener(function (tab) {
    updateTabData(function() {
        chrome.runtime.sendMessage({
            type: 'newData', 
            state: state,
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

setInterval(function(){
    chrome.tabs.query({
        windowId: chrome.windows.WINDOW_ID_CURRENT, 
        active: true
    },function(tabs) {
        if (tabs.length) {
            var tab = tabs[0];
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
                state.screenshots[tab.id] = dataUrl;
                chrome.runtime.sendMessage({
                    type: 'newData', 
                    state: state,
                    reason: 'Screenshot'
                });
            });
        }
    });
}, 15000);

// reopen tab on activation
// Random cleanup of screenshots? check if tab still exists
// Save top of page screenshot