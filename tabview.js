function getUpdate() {
    // request latest data
    chrome.runtime.sendMessage({type: "tabs"}, function(response) {
        redraw (response.windows, response.screenshots);
    });
}

function redraw(windows, screenshots) {
    document.getElementById('app').innerHTML = "";

    windows.forEach(window => {
        window.tabs.forEach(tab => {
            // ideally this would be checking for extension tabs, not just this one
            if (true) {
                // create div 
                var tabDiv = document.createElement('div');
                tabDiv.className = "tab";
    
                // create open button
                var tabButton = document.createElement('button');
                if (tab.favIconUrl) {
                    tabButton.innerHTML = '<img src="' + tab.favIconUrl + '">';
                }
                tabButton.innerHTML += tab.title;
                tabButton.addEventListener('click', function() {
                    chrome.tabs.highlight({windowId: window.id, tabs: tab.index});
                });
                tabDiv.appendChild(tabButton);
    
                // create close button
                var closeButton = document.createElement('button');
                closeButton.innerText = "X";
                closeButton.addEventListener('click', function(){
                    chrome.tabs.remove(tab.id);
                    getUpdate();
                });
                tabButton.appendChild(closeButton);
    
    
                // create tab screenshot
                var tabScreen = document.createElement('div');
                tabScreen.style.backgroundImage = "url(" + screenshots[tab.id] + ")";
                tabScreen.className = "tab-screen";
                tabDiv.appendChild(tabScreen);
    
    
                document.getElementById('app').appendChild(tabDiv);

            }
        });
    });
}

getUpdate();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // redraw the new data
    if (request.type == "newData") {
        console.log(request.reason);
        redraw(request.windows, request.screenshots);
    }
});

// Sortable js
// hide extension tabs (maybe just regex urls)