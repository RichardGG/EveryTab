var state = {
    screenshots: {},
    windows: [],
    lastActive: {}
};


// on Quick Tabs button click
chrome.browserAction.onClicked.addListener(function (tab) {

    // if on extension, open last active
    if (tab.url == 'chrome-extension://' + chrome.runtime.id + '/tabview.html') {
        var lastActive = state.lastActive[tab.windowId];
        if (lastActive) {
            chrome.tabs.get(lastActive.id, function(tab) {
                chrome.tabs.highlight({windowId: tab.windowId, tabs: tab.index});
            });
        }
    } else {

        // save screenshot, current tab id, open tabview
        chrome.tabs.captureVisibleTab(null, {format: 'jpeg'}, function(dataUrl) {
            state.screenshots[tab.id] = dataUrl;
            state.lastActive[tab.windowId] = tab;
    
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
                        chrome.runtime.sendMessage({
                            type: 'newData', 
                            state: state,
                            reason: 'Activate Plugin'
                        });
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
    }

});

// on tab switch
chrome.tabs.onActivated.addListener(function (activeInfo) {
    // save screenshot / update tabview
    chrome.tabs.captureVisibleTab(null, {format: 'jpeg'}, function(dataUrl) {
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
    // respond with current data, get latest data
    if (request.type == 'tabs') {
        sendResponse({state: state});
        updateTabData('Data request');
    }
});

// on tab created
chrome.tabs.onCreated.addListener(function (tab) {
    updateTabData('New Tab');
});
// on tab updated
chrome.tabs.onUpdated.addListener(function (tab) {
    updateTabData('Tab Updated');
});
// on tab closed
chrome.tabs.onRemoved.addListener(function (tabId) {
    delete state.screenshots[tabId];
    updateTabData('Tab Closed');
});
// on tab moved
chrome.tabs.onMoved.addListener(function (tab) {
    updateTabData('Moved within window');
});
// on tab detached
chrome.tabs.onDetached.addListener(function (tab) {
    updateTabData('Detached from window');
});
// on tab attached
chrome.tabs.onAttached.addListener(function (tab) {
    updateTabData('Attached to window');
});

function updateTabData(reason) {
    chrome.windows.getAll({populate: true}, function(windows) {
        // get last active somehow?

        state.windows = windows;
        chrome.runtime.sendMessage({
            type: 'newData', 
            state: state,
            reason: reason
        });
    });
}

setInterval(function(){
    chrome.tabs.query({
        windowId: chrome.windows.WINDOW_ID_CURRENT, 
        active: true
    },function(tabs) {
        if (tabs.length) {
            var tab = tabs[0];
            // capture tab if not extension
            if (tab.url != 'chrome-extension://' + chrome.runtime.id + '/tabview.html') {
                chrome.tabs.captureVisibleTab(null, {format: 'jpeg'}, function(dataUrl) {
                    state.screenshots[tab.id] = dataUrl;
                    chrome.runtime.sendMessage({
                        type: 'newData', 
                        state: state,
                        reason: 'Screenshot'
                    });
                });
            }
        }
    });
}, 15000);

// Random cleanup of screenshots? check if tab still exists



// set last active more often
// update the tab data for active tab more often


// possible future features:
// Save top of page screenshot
// Recently closed
// Bookmark tabs?