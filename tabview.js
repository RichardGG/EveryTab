function getUpdate() {
    // request latest data
    chrome.runtime.sendMessage({type: "tabs"}, function(response) {
        console.log('response')
        console.log(response);
        if (response != undefined) {
            redraw (response.state);
        } else {
            console.log('received blank response');
        }
    });
}

function redraw(state) {
    
    // get current window (this gets called twice sometimes ???? don't add anything above)
    chrome.windows.getCurrent(function(currentWindow) {
        
        var windows = state.windows;
        var screenshots = state.screenshots;
    
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
    
       
        console.log('hmmm', currentWindow.id);
        
        windows.forEach(window => {


            if (window.tabs.length) {
    
                var windowPanel  = document.querySelector('#window-template .window-panel').cloneNode(true);
                var windowIcons  = windowPanel.querySelector('.window-icons');
                var windowCount  = windowPanel.querySelector('.window-count');
                var windowScreen = windowPanel.querySelector('.window-screenshot');
                var windowTitle  = windowPanel.querySelector('.window-title');


                var activeTab = state.lastActive[window.id];
        
                // add content
                if (activeTab != null) {
                    windowTitle.textContent = activeTab.title;
                    windowTitle.title = activeTab.title;
                    windowScreen.style.backgroundImage = "url(" + screenshots[activeTab.id] + ")";
                }

                windowPanel.id = 'window-panel-' + window.id;

                windowPanel.addEventListener('click', function() {
                    document.querySelectorAll('.window-panel').forEach(function(panel) {
                        panel.classList.remove('active');
                    });
                    document.querySelectorAll('.tab-set').forEach(function(panel) {
                        panel.classList.remove('active');
                    });
                    windowPanel.classList.add('active');
                    document.querySelector('#tab-set-' + window.id).classList.add('active');
                });    
        
                // create set of tabs for each window
                var tabSet = document.createElement('div');
                tabSet.classList.add('tab-set');
                tabSet.id = 'tab-set-' + window.id;
                console.log('window', window.id, currentWindow.id);
                document.querySelector('#tabs').appendChild(tabSet);

                if (window.id == currentWindow.id) {
                    windowPanel.classList.add('active');
                    tabSet.classList.add('active');
                }

                var tabCount = 0;
        
                window.tabs.forEach(tab => {
                    // ignoring extension tabs
                    if (tab.url != 'chrome-extension://' + chrome.runtime.id + '/tabview.html') {

                        tabCount++;
        
                        var tabPanel    = document.querySelector('#tab-template .tab-panel').cloneNode(true);
                        var tabFavicon  = tabPanel.querySelector('.tab-favicon');
                        var tabTitle    = tabPanel.querySelector('.tab-title');
                        var tabClose    = tabPanel.querySelector('.tab-close');
                        var tabScreen   = tabPanel.querySelector('.tab-screenshot');
                        var tabLabel    = tabPanel.querySelector('.tab-label');
                        var tabLabelT   = tabPanel.querySelector('.tab-label-title');
                        var tabLabelU   = tabPanel.querySelector('.tab-label-url');

                        // add icon to window panel
                        if (tab.favIconUrl.length) {
                            windowIcons.innerHTML += '<img src="' + tab.favIconUrl + '">';
                        }
        
                        // add content
                        if (tab.favIconUrl.length) {
                            tabFavicon.innerHTML = '<img src="' + tab.favIconUrl + '">';
                        }
                        tabTitle.textContent = tab.title;
                        tabTitle.title = tab.title;
                        if (screenshots[tab.id] != undefined) {
                            tabScreen.style.backgroundImage = "url(" + screenshots[tab.id] + ")";
                        }
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
                        tabSet.appendChild(tabPanel);
        
                    }
                });
                windowCount.textContent = tabCount;
                
                // add to page
                document.querySelector('#windows').appendChild(windowPanel);
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
        redraw(request.state);
    }
});

// Padding based on window height
// Cool animation
// Sortable js
// hide extension tabs (maybe just regex urls)