var state = {
    screenshots: {},
    windows: []
};

chrome.browserAction.onClicked.addListener(function (tab) {
    // open tabview
    chrome.tabs.create({url: 'tabview.html', pinned: true});
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    // save screenshot, close tabview
    chrome.tabs.query({url: 'chrome-extension://*/tabview.html'}, function(tabs) {
        tabs.forEach(function(tab) {
            if (activeInfo.tabId != tab.id) {
                //chrome.tabs.remove(tab.id);
            }
        })
    });

    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
        state.screenshots[activeInfo.tabId] = dataUrl;
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // save data, respond with data
    if (request.type == "tabs") {
        updateTabData();
        sendResponse({screenshots: state.screenshots, windows: state.windows});
    }
});


function updateTabData() {
    chrome.windows.getAll({populate: true}, function(windows) {
        state.windows = windows;
    });
}
