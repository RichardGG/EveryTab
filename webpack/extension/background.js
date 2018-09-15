chrome.browserAction.onClicked.addListener(function (tab) {
    // if on extension, open last active
    if (tab.url == 'chrome-extension://' + chrome.runtime.id + '/tabtray.html') {
        // var lastActive = state.lastActive[tab.windowId];
        // if (lastActive) {
        //     chrome.tabs.get(lastActive.id, function(tab) {
        //         chrome.tabs.highlight({windowId: tab.windowId, tabs: tab.index});
        //     });
        // }
    } else {

        // // save screenshot, current tab id, open tabtray
        // chrome.tabs.captureVisibleTab(null, {format: 'jpeg'}, function(dataUrl) {
        //     state.screenshots[tab.id] = dataUrl;
        //     state.lastActive[tab.windowId] = tab;
    
            // check for extension tab
            chrome.tabs.query(
                {
                    windowId: chrome.windows.WINDOW_ID_CURRENT, 
                    url: 'chrome-extension://' + chrome.runtime.id + '/tabtray.html'
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
                        chrome.tabs.create({url: 'tabtray.html', pinned: true},
                            function (tab) {
                                state.extension = tab.id
                            }
                        );
                    }
                }
            );
            
        // });
    }
})