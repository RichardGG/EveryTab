function getUpdate() {
    // request latest data
    chrome.runtime.sendMessage({type: "tabs"}, function(response) {
        console.log('response')
        console.log(response);
        redraw (response.state.windows, response.state.screenshots);
    });
}



function redraw(windows, screenshots) {
    // clear everything
    document.querySelector('#tabs').innerHTML = "";
    document.querySelector('#windows').innerHTML = "";

    // resize controls
    var sizes = ["16.65%", "20%", "25%", "33.33%", "50%", "100%"];
    var size = 3;
    document.querySelector('#tab-plus').addEventListener('click', function(e) {
        if (size + 1 < sizes.length) {
            size++;
            document.querySelector('#size-css').innerHTML = '.tab-panel{width:' + sizes[size] + ';}';
        }
    });
    document.querySelector('#tab-minus').addEventListener('click', function(e) {
        if (size - 1 > 0) {
            size--;
            document.querySelector('#size-css').innerHTML = '.tab-panel{width:' + sizes[size] + ';}';
        }
    });
    function onResize() {
        var ratio = window.innerHeight / window.innerWidth * 100;
        document.querySelector('#height-css').innerHTML = '.tab-screenshot{padding-bottom:' + ratio + '%;}';
    }
    window.addEventListener('resize', onResize);
    onResize();

    windows.forEach(window => {

        var windowPanel  = document.querySelector('#window-template .window-panel').cloneNode(true);
        var windowIcons  = windowPanel.querySelector('.window-icons');
        var windowCount  = windowPanel.querySelector('.window-count');
        var windowScreen = windowPanel.querySelector('.window-screenshot');
        var windowTitle  = windowPanel.querySelector('.window-title');

        // add content
        windowCount.textContent = window.tabs.length;
        // tabFavicon.innerHTML = '<img src="' + tab.favIconUrl + '">';
        // tabTitle.textContent = tab.title;
        // tabTitle.title = tab.title;
        // tabScreen.style.backgroundImage = "url(" + screenshots[tab.id] + ")";
        // tabLabelT.textContent = tab.title;
        // if (tab.title != tab.url) {
        //     tabLabelU.textContent = tab.url;
        // }

        // add to page
        document.querySelector('#windows').appendChild(windowPanel);


        window.tabs.forEach(tab => {
            // ideally this would be ignoring extension tabs
            if (tab.url != 'chrome-extension://' + chrome.runtime.id + '/tabview.html') {

                var tabPanel    = document.querySelector('#tab-template .tab-panel').cloneNode(true);
                var tabFavicon  = tabPanel.querySelector('.tab-favicon');
                var tabTitle    = tabPanel.querySelector('.tab-title');
                var tabClose    = tabPanel.querySelector('.tab-close');
                var tabScreen   = tabPanel.querySelector('.tab-screenshot');
                var tabLabel    = tabPanel.querySelector('.tab-label');
                var tabLabelT   = tabPanel.querySelector('.tab-label-title');
                var tabLabelU   = tabPanel.querySelector('.tab-label-url');

                // add content
                tabFavicon.innerHTML = '<img src="' + tab.favIconUrl + '">';
                tabTitle.textContent = tab.title;
                tabTitle.title = tab.title;
                tabScreen.style.backgroundImage = "url(" + screenshots[tab.id] + ")";
                tabLabelT.textContent = tab.title;
                if (tab.title != tab.url) {
                    tabLabelU.textContent = tab.url;
                }

                // add event listeners
                tabPanel.addEventListener('mouseup', function(e) {
                    console.log(e.which);
                    if (e.which == 2) {
                        e.preventDefault();
                        chrome.tabs.remove(tab.id);
                        getUpdate();
                    }
                });
                tabClose.addEventListener('click', function() {
                    chrome.tabs.remove(tab.id);
                    getUpdate();
                });
                tabScreen.addEventListener('click', function() {
                    chrome.tabs.highlight({windowId: window.id, tabs: tab.index});
                });    
    
                // add to page
                document.querySelector('#tabs').appendChild(tabPanel);

            }
        });
    });
}

getUpdate();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // redraw the new data
    if (request.type == "newData") {
        console.log(request.reason);
        console.log(request.state);
        redraw(request.state.windows, request.state.screenshots);
    }
});

// Tabs by window
// Cool animation
// Sortable js
// hide extension tabs (maybe just regex urls)