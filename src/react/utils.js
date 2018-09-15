import { cloneDeep } from 'lodash'


export const tabFocus = (tabName, state) => {
    let window = findTabWindow(state.windows, tabName);

    console.log(window)
    console.log(state)

    
    // hightlight tab
    chrome.tabs.highlight({
            windowId: window.id,
            tabs: window.order.indexOf(tabName)
        }
    )

    // focus on window
    chrome.windows.update(window.id, {focused: true});
}

// fake window generator
export const generateWindows = () => {
    let state = {
        windows: {},
        tabs: {},
        order: [],
        selected: [],
        dragging: null
    }
    for (var i = 0; i < 3; i++) {
        let windowName = 'win-' + i
        let order = []
        for (var j = 0; j < 6; j++) {
            let tabName = 'tab-' + i + '-' + j
            order = [...order, tabName]
            state.tabs[tabName] = {
                name: tabName
            }
        }
        state.order = [...state.order, windowName]
        state.windows[windowName] = {
            name: windowName,
            order: order,
            lastSelected: null
        }
    }
    return state
}

export const setRealState = (stateCallback) => {
    
    console.log('set real state')

    chrome.windows.getAll({populate: true}, function(windows) {

        console.log('get all windows')
        
        let state = {
            windows: {},
            tabs: {},
            order: [],
            selected: [],
            dragging: null
        }

        console.log(windows)

        let i = 0
        for (let windowIndex in windows) {
            let window = windows[windowIndex]
            console.log(window)
            let order = []
            let windowName = 'win-' + i
            for (let tabIndex in window.tabs) {
                let tab = window.tabs[tabIndex]
                console.log(tab)
                order = [...order, tab.id]
                state.tabs[tab.id] = {
                    name: tab.title,
                    icon: tab.favIconUrl
                }
            }
            state.order = [...state.order, window.id]
            state.windows[window.id] = {
                id: window.id,
                name: windowName,
                order: order,
                lastSelected: null
            }
            i++
        }

        console.log(state)

        stateCallback(state);
    })


}

// returns the list reordered
export const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)


    chrome.tabs.move(
        removed, 
        {
            index: endIndex
        },
        function (tabs) {
            setRealState(this.stateCallback);
        }
    )

    return result
}

// returns the updated windows
export const moveSelection = (state, destination, destinationIndex, source, sourceIndex) => {
    // ensure selected is ordered correctly
    let selected = naturalOrder(state, state.selected)

    // new list of windows with tabs removed
    let windows = cloneDeep(state.windows)
    removeTabsFromWindows(windows, selected)

    console.log('moveSelection()')
    console.log('dest index', destinationIndex)
    console.log('selected', state.selected)
    console.log('order', state.windows[destination].order)
    let newIndex = 0
    // should probably clean up this line, it's so long and not very easy to follow. We have to check one more position if we're dragging down in the same list
    for (let i = 0; i < destinationIndex + ((source == destination && sourceIndex < destinationIndex) ? 1 : 0) && i < state.windows[destination].order.length; i++) {
        console.log('check', i, state.windows[destination].order[i])
        if (!state.selected.includes(state.windows[destination].order[i])) {
            console.log('not selected')
            newIndex++
        } else {
            console.log('selected')
        }
    }
    console.log(sourceIndex)
    console.log('new index', newIndex)

    // append selected to destination
    windows[destination].order.splice(newIndex, 0, ...selected);
    
    // 
    resetLastSelected(windows)

    chrome.tabs.move(
        state.selected, 
        {
            windowId: destination, 
            index: newIndex
        },
        function (tabs) {
            setRealState(this.stateCallback);
        }
    )

    return windows
}

// removes tabs from windows
const removeTabsFromWindows = (windows, tabNames) => {
    // find each tab
    for (let tabIndex in tabNames) {
        let tabName = tabNames[tabIndex]
        // in each window
        for (let windowIndex in windows) {
            let window = windows[windowIndex]
            let index = window.order.indexOf(tabName)
            if (index > -1) {
                // found tab, remove it
                window.order.splice(index, 1)
            }
        }
    }
    return windows
}

// returns a list of tabNames sorted by natural order
const naturalOrder = (state, tabNames) => {
    // naturally order list of tabNames
    let windowOrder = state.order
    let windows = state.windows

    let sorted = []
    // loop through windowOrder
    for (let windowName of windowOrder) {
        let thisWindow = windows[windowName]
        // loop through tabOrder
        for (let tabName of thisWindow.order) {
            if (tabNames.includes(tabName)) {
                sorted = [...sorted, tabName]
            }
        }
    }

    return sorted
}

/**
 * Moves an item from one list to another list.
 */
export const move = (source, destination, droppableSource, droppableDestination) => {
    // clone source list
    const sourceClone = Array.from(source)
    // close destination list
    const destClone = Array.from(destination)

    // remove item from source
    const [removed] = sourceClone.splice(droppableSource.index, 1)

    // append it to destination
    destClone.splice(droppableDestination.index, 0, removed)

    const result = {}
    result[droppableSource.droppableId] = sourceClone
    result[droppableDestination.droppableId] = destClone

    chrome.tabs.move(
        removed, 
        {
            windowId: droppableDestination.droppableId, 
            index: droppableDestination.index
        },
        function (tabs) {
            setRealState(this.stateCallback);
        }
    )

    return result
}

// returns the window that contains tabName
export const findTabWindow = (windows, tabName) => {
    // find window of selected item
    let tabIndex = -1
    let thisWindow = null
    for (var windowName in windows) { // in will loop through indexes
        thisWindow = windows[windowName] // save new window
        tabIndex = thisWindow.order.indexOf(tabName)
        if (tabIndex > -1) {
            break
        }
        thisWindow = null
    }
    return thisWindow
}

// resets lastSelected in the windows supplied
export const resetLastSelected = (windows) => {
    for (let windowIndex in windows) {
        let thisWindow = windows[windowIndex]
        thisWindow.lastSelected = null
    }
}


/**
 * Selects an item
 */
export const select = (state, tabName, shift, meta) => {

    let selected = state.selected // this will be sorted and duplicates removed at the end    

    const index = selected.indexOf(tabName)


    let windows = cloneDeep(state.windows)

    // window of selected tab
    let thisWindow = findTabWindow(windows, tabName)

    let setSelected = true;


    // handle select differently depending on selection
    if (shift) {        

        if (thisWindow.lastSelected != null) {


            let tabIndex = thisWindow.order.indexOf(tabName)
            let lastIndex = thisWindow.order.indexOf(thisWindow.lastSelected)
            
            // find position in window
            if (tabIndex > -1 && lastIndex > -1) {

                // don't select last index (was either deselected or already selected)
                if (lastIndex > tabIndex) {
                    selected = [...selected, ...thisWindow.order.slice(tabIndex, lastIndex)]
                } else if (tabIndex > lastIndex) {
                    selected = [...selected, ...thisWindow.order.slice(lastIndex + 1, tabIndex + 1)]
                } else {
                    selected = [...selected, tabIndex]
                }
                
            } else {
                // tabIndex or lastIndex not in this window (something went wrong)
                selected = [...selected, tabName]
            }
        } else {
            if (index == -1) {
                selected = [...selected, tabName]
            }
        }
    } else if (meta || true) {
        // if already in list
        if (index > -1) {
            // remove it
            selected.splice(index, 1)
            resetLastSelected(windows)
            setSelected = false
        } else {
            // otherwise add it
            selected = [...selected, tabName]
        }
    } else {
        // if only selected item
        if (selected.length == 1 && selected.includes(tabName)) {
            // deselcted it
            selected.splice(index, 1)
            resetLastSelected(windows)
            setSelected = false
        } else {
            // otherwise make only selected
            selected = [tabName]
            resetLastSelected(windows)
        }
    }

    if (setSelected)
        thisWindow.lastSelected = tabName


    // naturally order selection
    let sorted = naturalOrder(state, selected)

    let newState = {
        selected: sorted,
        lastSelected: tabName,
        windows: windows
    }

    return newState
}