import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { generateWindows, reorder, move, select, moveSelection, resetLastSelected, setRealState, tabFocus } from './utils'
import { cloneDeep } from 'lodash'

export default class App extends Component {

    // generate fake initial state
    state = generateWindows()


    stateCallback = (state) => {
        this.setState(state)
    }

    // get real state
    test = setRealState(this.stateCallback)

    // handle on drag start
    // onDragStart = start => {
    //     const id = start.draggableId
    // }

    onDragStart = start => {
        this.setState({dragging: start.draggableId})
    }

    // TODO MAJOR ISSUE multidragging down two (even in same selection) will move the index of all items down two

    // handle on drag end, has access to state, handles different lists
    onDragEnd = result => {

        this.setState({dragging: null})

        if (result.type == "WINDOW") {
            const { source, destination } = result

            // dropped outside the list
            if (!destination) {
                return
            }
            
            if (source.droppableId === destination.droppableId) {
                // dropped in same list (only one list for windows)

                // new windows list
                const order = reorder(
                    this.state.order,
                    source.index,
                    destination.index
                );

                // setState does a shallow merge (will replace order)
                let state = {order}
                this.setState(state)

            } else {
            }
        }
        if (result.type == "TAB") {
            const { source, destination } = result

            // dropped outside the list
            if (!destination) {
                return
            }

            let sourceWindow = this.state.windows[source.droppableId];

            if (this.state.selected.length && this.state.selected.includes(sourceWindow.order[source.index])) {
                // moving selection
                const windows = moveSelection(
                    this.state,
                    destination.droppableId,
                    destination.index,
                    source.droppableId,
                    source.index
                );

                let state = {windows}
                this.setState(state)

            } else {
                // moving single item

                if (source.droppableId === destination.droppableId) {
                    // dropped in same list

                    // new tabs list
                    const order = reorder(
                        this.state.windows[destination.droppableId].order,
                        source.index,
                        destination.index
                    );

                    let windows = this.state.windows
                    windows[destination.droppableId].order = order

                    let state = {windows}
                    this.setState(state)

                } else {
                    const result = move(
                        this.state.windows[source.droppableId].order,
                        this.state.windows[destination.droppableId].order,
                        source,
                        destination
                    );

                    let windows = this.state.windows
                    windows[source.droppableId].order = result[source.droppableId]
                    windows[destination.droppableId].order = result[destination.droppableId]

                    let state = {windows}
                    this.setState(state)
                }
            }
        }
    }

    onTabClick = (tabName, event) => {
        tabFocus(tabName, this.state);
    }

    onTabClose = (tabName, event) => {
        chrome.tabs.remove(tabName,
            function (tabs) {
                setRealState(this.stateCallback);
            });
    }

    onSelect = (tabName, event) => {

        event.preventDefault();

        // new selected
        const state = select(
            this.state,
            tabName,
            event.shiftKey,
            event.metaKey
        );

        console.log('selected', state.selected)

        this.setState(state)
    }

    onKeyDown = (event) => {
        event.preventDefault()
    }

    onWindowKeyDown = (event) => {
        console.log('window keydown')
        
        if (event.key === 'Escape') {
            event.preventDefault()
            this.deselectAll()
        }
    }

    onWindowClick = (event) => {
        event.preventDefault()
        console.log('window click')
    }

    deselectAll() {
        console.log('deslectred')
        let windows = cloneDeep(this.state.windows)
        resetLastSelected(windows)
        this.setState({selected: [], windows})
    }

    componentDidMount() {
        window.addEventListener('click', this.onWindowClick);
        window.addEventListener('keydown', this.onWindowKeyDown);
        window.addEventListener('touchend', this.onWindowTouchEnd);
    }

    render () {
        let window = null;
        return (
            <DragDropContext onDragEnd={this.onDragEnd} onDragStart={this.onDragStart}>
                <div className={"window-container " 
                    + (this.state.dragging != null ? "dragging " : "")
                    + (this.state.selected.indexOf(this.state.dragging) >= 0 ? "dragging-selected " : "")
                    }>
                    <div className="control-bar">
                        <input className="search-bar" placeholder="Search Tabs">

                        </input>
                    </div>
                    <div className="deselect-area" onClick={(e) => this.deselectAll()}></div>
                    <div className={"windows-wrapper" + (this.state.selected.length ? " select-mode" : "")}>
                        <Droppable droppableId="windows" type="WINDOW" direction="horizontal">
                            {(provided, snapshot) => (
                                <div className="window-list" ref={provided.innerRef}>
                                    <div className="deselect-area" onClick={(e) => this.deselectAll()}></div>
                                    {this.state.order.map((windowName, windowIndex) => (
                                        <Draggable key={windowName} draggableId={windowName} type="WINDOW" index={windowIndex}>
                                            {(provided, snapshot) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                    onKeyDown={(event) => {this.onKeyDown(event)}} tabIndex = {0} className = "addrel window"
                                                >
                                                    <div class="window-title">
                                                        <span class="title-text">
                                                            {this.state.windows[windowName].order.length ? this.state.tabs[this.state.windows[windowName].order[0]].name : ''}
                                                        </span>
                                                    </div>
                                                    <div className="deselect-area" onClick={(e) => this.deselectAll()} ></div>
                                                    <Droppable droppableId={windowName} type="TAB" direction="vertical">
                                                        {(provided, snapshot) => (
                                                            <div className="tab-list" ref={provided.innerRef}>
                                                                {/* <div className="deselect-area" onClick={(e) => this.deselectAll()}></div> */}
                                                                {this.state.windows[windowName].order.map((tabName, tabIndex) => (
                                                                    <Draggable key={tabName} draggableId={tabName} type="TAB" index={tabIndex}>
                                                                        {(provided, snapshot) => (
                                                                            <div className={"addrel tab " 
                                                                                    + (this.state.selected.includes(tabName) ? "selected " : "") 
                                                                                    + (tabName == this.state.dragging ? "dragging " : "")
                                                                                } ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                                <div className={"tab-select "} onClick={(e) => this.onSelect(tabName, e)}></div>
                                                                                <div className="tab-icon">
                                                                                    <img src={this.state.tabs[tabName].icon}></img>
                                                                                </div>
                                                                                <div onClick={(e) => this.onTabClick(tabName, e)}  className="tab-title">
                                                                                    <div class="tab-title-text">
                                                                                        {(
                                                                                            tabName == this.state.dragging && this.state.selected.length && this.state.selected.indexOf(tabName) >= 0
                                                                                            ? this.state.selected.length + " Tabs" 
                                                                                            : (this.state.tabs[tabName].name)
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div onClick={(e) => this.onTabClose(tabName, e)} class="tab-close">
                                                                                    <i class="material-icons">close</i>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                </div>
                            )}
                        </Droppable>
                    </div>
                </div>
            </DragDropContext>
        );
    }
}