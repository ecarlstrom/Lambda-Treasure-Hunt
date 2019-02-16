import React, { Component } from 'react';
import axios from 'axios';

import MapVisual from './MapVisual';

require('dotenv').config();
const rootPath = 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init';
const movePath = 'https://lambda-treasure-hunt.herokuapp.com/api/adv/move/';
const treasure_token = process.env.REACT_APP_TREASURE_HUNT_TOKEN;
console.log(treasure_token);
console.log(process.env);
const headers = {
    // 'Content-Type': 'application/json',
    'Authorization': `Token ${treasure_token}`,
    'Access-Control-Allow-Origin': 'http://localhost:3000'
}

class GraphMap extends Component {
    // local storage here, will hold the travel path of the player
    // updating state for more accurate tracking
    state = {
        cooldown: 3,
        coords: { x: 50, y: 60 },
        error: '',
        exits: [],
        generating: false,
        graph: {},
        graphExists: false,
        loaded: false,
        message: '',
        opposites: { n: "s", e: "w", s: "n", w: "e" },
        path: [],
        progress: 0,
        room_id: 0,
        totalCoords: [],
        totalEdges: [],
        visited: new Set()
    };

    // adding componentDidMount to handle initialization, will find stored current location
    componentDidMount() {
        // if(localStorage.hasOwnProperty('graph')) {
        //     let value = JSON.parse(localStorage.getItem('graph'));
        //     console.log(value);
        //     this.setState({ graph: value, graphExists: true });
        // } 
        // else {
           
        // }
        console.log('Finding location');
        this.findLocation();
        // this.init();
    }

    componentDidUpdate(prevState) {
        if(!this.state.totalCoords.length && this.state.graph) {
            // this.mapEdges();
            // this.mapVertices(); 
            // setTimeout(() => this.setState({ loaded: true }), 3000);
            console.log('Updated.');
        }
    }

    // init() will handle everything that needs to come in componentDidMount() -- initialization and waiting
    // async init() {
        
    //     await this.addPromise(1000 * this.state.cooldown);
    //     // await this.playerStatus();
    // }

    // playerStatus will return information on a player's status, called in initialization
    
    // playerStatus = () => {
    //     // axios({
    //     //     method: 'post',
    //     //     url: (`${rootPath}/status`, {headers: headers})
    //     // })
    //     let requestOptions = { headers: headers };
    //     console.log(requestOptions);
    //     axios.get(rootPath, requestOptions)
    //         .then(res => {
    //             console.log(res.data);

    //             this.setState(prevState => ({
    //                 name: res.data.name,
    //                 cooldown: res.data.cooldown,
    //                 encumbrance: res.data.encumbrance,
    //                 strength: res.data.strength,
    //                 speed: res.data.speed,
    //                 gold: res.data.gold,
    //                 inventory: [...res.data.inventory],
    //                 status: [...res.data.status],
    //                 errors: [...res.data.errors]
    //             }));
    //         })
    //         .catch(err => {
    //             console.error('Sorry, an error was encountered.');
    //             console.log(err.response);
    //         });
    // }; // playerStatus()

    // findLocation locates a player's current room on the map
    findLocation = () => {
        // axios({
        //     method: 'get',
        //     url: (`${rootPath}/init`, {headers: headers})
        // })
        console.log('findLocation() test');
        console.log('graph empty');
        let requestOptions = { headers };
        const promise = axios.get(rootPath, requestOptions);
        promise
            .then(res => {
                console.log(res.data); // troubleshooting
                let newVar = this.formatCoordinates(res.data.coordinates);
                // let graph = this.graphRender(
                //     res.data.room_id,
                //     newVar,
                //     res.data.exits
                // );
                const graph = Object.assign({}, this.state.graph);
                console.log(graph);
                const exits = res.data.exits;
                console.log(exits);
                const room = res.data.room_id;
                if(!(room in graph)) {
                    const options = ['n', 's', 'e', 'w'];
                    const temp = {};

                    for(let i = 0; i < options.length; i++) {
                        console.log(options[i]);
                        if(exits.includes(options[i]) === true) {
                            temp[options[i]] = '?'
                        } else {
                            temp[options[i]] = null
                        }
                    }
                    graph[room] = temp;
                }
                this.setState({
                    room_id: room,
                    coords: newVar,
                    cooldown: res.status.cooldown,
                    exits: res.data.exits,
                    graph
                    // another placeholder for more attributes if necessary
                });
                console.log(graph);
                this.createVisitedPath();
            })
            .catch(err => {
                console.error('Sorry, an initialization error was encountered.');
                console.log(err.response);
            });
    }; // findLocation()

    // handleClick = () => {
    //     this.findLocation();
    // };

    ////////// MOVEMENT AND TRAVERSAL FUNCTIONS //////////

    // mapTravel will allow the player to move across the map via a traversal algorithm
    mapTravel = () => {
        let count = 1;
        let move = null;
        let path = this.state.path.slice();
        if(path.length > 0) {
            console.log('Previous path set.');
            move = path.shift();
            this.setState({ path: path })
            this.roomTravel(move);
            return;
        }
        let unexplored = this.findUnexplored();
        console.log(`Unexplored rooms: ${unexplored}`);
        if(unexplored.length > 0) {
            console.log('Single direction');
            move = unexplored[0];
            this.roomTravel(move);
            return;
        } 
        console.log('Finding path.');
        path = this.bfsShortest();
        if(path.length === 0) {
            console.log('BFS issue encountered');
        } else {
            console.log('Taking path');
            move = path.shift();
            this.setState({ path: path });
            this.roomTravel(move);
            return;
        }
}; // mapTravel()

    roomTravel = async (move, next_room = null) => {
        // handles room to room movement
        console.log(move);
        if(!move) {
            console.log('Problem with move.');
            return;
        }
        let data;
        if(next_room !== null) {
            data = {
                direction: move,
                next_room: next_room.toString()
            };
        } else {
            data = {
                direction: move
            };
        }
        // try {
            // const res = await axios({
            //     method: 'post',
            //     url: (`${rootPath}/move`, {headers: headers}),
            //     data
            let requestOptions = { headers: headers };
            axios.post(movePath, requestOptions)
                .then(res => {
                    const graph = Object.assign({}, this.state.graph);
                    console.log(graph);
                    const exits = res.data.exits;
                    console.log(exits);
                    const room = res.data.room_id;
                    let opposite = this.state.opposites[move];
                    if(!(room in graph)) {
                        const options = ['n', 's', 'e', 'w'];
                        const temp = {};
    
                        for(let i = 0; i < options.length; i++) {
                            console.log(options[i]);
                            if(exits.includes(options[i]) === true) {
                                temp[options[i]] = '?'
                            } else {
                                temp[options[i]] = null
                            }
                        }
                        graph[room] = temp;
                    } 
                    // handles '?' rooms in both directions based on what is currently known
                    graph[room][opposite] = this.state.room_id;
                    graph[this.state.room_id][move] = room;
                    // let graph = this.graphRender(
                    //     res.data.room_id,
                    //     this.formatCoordinates(res.data.coordinates),
                    //     res.data.exits,
                    //     previous,
                    //     move
                    // );
                    this.setState({
                        room_id: res.data.room_id,
                        coords: this.formatCoordinates(res.data.coordinates),
                        exits: [...res.data.exits],
                        cooldown: res.data.cooldown,
                        graph
                        // other attributes as necessary
                    });
                    console.log(res.data);
                    if(Object.keys(graph).length < 500) {
                        setTimeout(this.mapTravel, this.state.cooldown * 1000);
                    }
                })
                .catch(error => {
                    console.error('Sorry, an error was encountered while traveling.')
                    console.log(error.response);
                    this.setState({ cooldown: error.response.data.cooldown });
                    if(Object.keys(this.state.graph).length < 500) {
                        setTimeout(this.mapTravel, this.state.cooldown * 1000);
                    }
        });
    }; // roomTravel()

    findUnexplored = () => {
        // will find unexplored ('?') rooms on the map and push to the 'unexplored' array
        let unexplored = [];
        let directions = this.state.graph[this.state.room_id];
        for(let direction in directions) {
            if(directions[direction] === '?') {
                unexplored.push(direction);
                break
            }
        }
        console.log(unexplored);
        return unexplored;
    } // findUnexplored()

    pathConversion = (path) => {
        let room = this.state.room_id;
        let directions = [];
        let count = 1;

        while(count < path.length) {
            for(let exit in this.state.graph[room]) {
                if(this.state.graph[room][exit] === path[count]) {
                    directions.push(exit);
                    break
                }
            }
            room = path[count];
            count++;
        }
        console.log(directions);
        return directions;
    } // pathConversion()


    bfsShortest = (start = this.state.room_id, target = '?') => {
        // bfs algorithm to find the path from one room to another
        let { graph } = this.state;
        let queue = [];
        let visited = [];
        
        queue.push([start]);
        
        while(queue.length > 0) {
            let dequeue = queue.shift();
            let previous = dequeue[dequeue.length - 1];
            if(visited.includes(previous) === false) {
                visited.push(previous);
                    for(let exit in graph[previous]) {
                        if(graph[previous][exit] === '?') {
                            // converts numbers to directions
                            return this.pathConversion(dequeue);
                            // standard dequeue functionality, pops entries that are unexplored
                            // dequeue.forEach(item => {
                            //     // for(let key in item) {
                            //     //     graph[item[key]][0].color = 'bd1f27'; // red
                            //     // }
                            // }); // colors items that have been dequeued
                        } else {
                            
                            let newPath = dequeue.slice();
                            newPath.push(graph[previous][exit]);
                            queue.push(newPath);
                        }
                    }
                }
            }
        console.log('Please provide a valid target room!'); // error handling for invalid targets
        return [];
        } // bfsShortest()

    createVisitedPath = () => {
        // creates a path of visited rooms by checking for visited status and pushing to new array
        let visited = new Set(this.state.set);
        for(let key in this.state.graph) {
            if(!visited.has(key)) {
                let blank = [];
                for(let direction in key) {
                    if(key[direction] === '?') {
                        blank.push(direction);
                    }
                }
                if(!blank.length) {
                    visited.add(key);
                }
            }
        }
        let visitedPath = Math.round((visited.size / 500) * 100);
        this.setState({ visited, visitedPath });
    } // createVisitedPath()

    // specificRoom = async room => {
    //     // allows the user to click on a particular room to travel to that location
    //     const path = this.bfsShortest(this.state.room_id, room);
    //     console.log(path);
    //     console.log(room);

    //     if(typeof path === 'string') {
    //         console.log(path);
    //     } else {
    //         for(let direction of path) {
    //             for(let dir in direction) {
    //                 await this.addPromise(1000 * this.state.cooldown);
    //                 // might need another function here
    //             }
    //         }
    //     }
    // }; // specificRoom()

    addPromise = ms => {
        // this should turn setTimeout into an async function and hopefully resolve promise errors
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    } // addPromise()

    ////////// MAP RENDERING FUNCTIONS //////////

    // mapVertices = () => {
    //     const { graph, room_id } = this.state
    //     const setCoords = [];
    //     for(let room in graph) {
    //         let data = graph[room][0];
    //         if(room !== room_id) {
    //             data.color = '#778181'; // grey
    //         }
    //         setCoords.push(data);
    //     }
    //     this.setState({ totalCoords: setCoords });
    // }; //mapVertices()

    // mapEdges = () => {
    //     const { graph } = this.state;
    //     const setEdges = [];
    //     if(Object.keys(graph).length > 0) {
    //     for(let room in graph) {
    //         for(let roomWithLink in graph[room][1]) {
    //             setEdges.push([graph[room][0], graph[graph[room][1][roomWithLink]][0]]);
    //         }
    //     }
    //     this.setState({ totalEdges: setEdges });
    //     }
        
    // }; // mapEdges()

    formatCoordinates = coords => {
        console.log('first coordinates test');
        console.log(coords);
        const rawCoords = {};
        const first = Number(coords.slice(1, 3));
        const second = Number(coords.slice(4, 6));
        console.log('second coordinates test');
        
        rawCoords['x'] = first;
        rawCoords['y'] = second;

        this.setState({ coords: rawCoords })
        console.log('coordinates test');
    }; // formatCoordinates()

    // graphRender = (id, coords, exits, previous = null, move = null) => {
    //     // this function handles all new graph rendering during exploration
    //     // will also handle colors for updating and explored (non-red) rooms
    //     const { reversed } = this.state;
    //     let graph = Object.assign({}, this.state.graph);
        
    //     //rendering exits for currently unexplored ('?') rooms
    //     if(!this.state.graph[id]) {
    //         let payload = [];
    //         payload.push(coords);
    //         const traveled = {};
    //         exits.forEach(exit => {
    //             traveled[exit] = '?';
    //         });
    //         payload.push(traveled);
    //         graph = { ...graph, [id]: payload };
    //     }

    //     // checks if the user has moved from an unexplored room while making a valid move
    //     // previous value is stored and can also be used for backtracking if necessary
    //     if(previous !== null && move && previous !== id && graph[previous][1][move] === '?') {
    //         graph[previous][1][move] = id;
    //         graph[id][1][reversed[move]] = previous;
    //     }

    //     // assigns colors based on room status
    //     if(previous !== null) {
    //         graph[previous][0].color = '#778181'; // grey
    //         graph[id][0].color = '#4694b7'; // blue
    //     } else {
    //         graph[0][0].color = '#778181';
    //         graph[id][0].color = '#4694b7';
    //     }
        
    //     localStorage.setItem('graph', JSON.stringify(graph));
    //     return graph;
    // }; // graphRender()

    render() {
        const { 
            coords,
            graph,
            loaded,
            message,
            progress,
            room_id
        } = this.state;
        return (
            // <MapVisual coords = {this.state.totalCoords} 
            //      graph = {graph}
            //      edges = {this.state.totalEdges}
            //      specificRoom = {this.specificRoom}
            // /> // may add a progress bar as well to track map generation
            <div className = 'test'>
                <button onClick = {this.mapTravel}>Create Map</button>
            </div>
        );
    }
}; // GraphMap

export default GraphMap;