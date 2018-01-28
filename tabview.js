chrome.runtime.sendMessage({type: "tabs"}, function(response) {

    console.log(response);

    response.windows.forEach(window => {
        window.tabs.forEach(tab => {
            
            // create div with background image
            var tabDiv = document.createElement('div');
            tabDiv.className = "tab";
            tabDiv.style.backgroundImage = "url(" + response.screenshots[tab.id] + ")";

            // create close button
            var closeButton = document.createElement('button');
            closeButton.innerText = "X";
            closeButton.addEventListener('click', function(){
                chrome.tabs.remove(tab.id);
            });
            tabDiv.appendChild(closeButton);

            // create open button
            var tabButton = document.createElement('button');
            tabButton.innerText = tab.title;
            tabButton.addEventListener('click', function() {
                chrome.tabs.highlight({windowId: window.id, tabs: tab});
            });
            tabDiv.appendChild(tabButton);


            document.getElementById('app').appendChild(tabDiv);

        });
    });

});


// Need to refresh when window closed? Other events to refresh