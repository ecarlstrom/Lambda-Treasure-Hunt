import React, { Component } from 'react';
import axios from 'axios';

import MapVisual from './MapVisual';

require('dotenv').config();
const rootPath = 'https://lambda-treasure-hunt.herokuapp.com/api/adv';
const treasure_token = process.env.TREASURE_HUNT_TOKEN;
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${treasure_token}`
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
        path: [],
        progress: 0,
        room_id: 0,
        totalCoords: [],
        totalEdges: [],
        visited: new Set()
    };

    // adding componentDidMount to handle initialization, will find stored current location
    componentDidMount() {
        if(localStorage.hasOwnProperty('graph')) {
            let value = JSON.parse(localStorage.getItem('graph'));
            this.setState({ graph: value, graphExists: true });
        } 
        // else {
        //     localStorage.setItem('graph', JSON.stringify(data)); // map data goes here
        //     let value = JSON.parse(localStorage.getItem('graph'));
        //     this.setState({ graph: value, graphExists: true });
        // }
        this.init();
    }

    componentDidUpdate(prevState) {
        if(!this.state.totalCoords.length && this.state.graph) {
            this.mapEdges();
            this.mapVertices();
            
            setTimeout(() => this.setState({ loaded: true }), 3000);
        }
    }

    // init() will handle everything that needs to come in componentDidMount() -- initialization and waiting

    init = async () => {
        await this.findLocation();
        await this.playerStatus();
    }

    // playerStatus will return information on a player's status, called in initialization
    
    playerStatus = () => {
        axios({
            method: 'post',
            url: (`${rootPath}/status`, {headers: headers})
        })
            .then(res => {
                console.log(res.data);

                this.setState(prevState => ({
                    name: res.data.name,
                    cooldown: res.data.cooldown,
                    encumbrance: res.data.encumbrance,
                    strength: res.data.strength,
                    speed: res.data.speed,
                    gold: res.data.gold,
                    inventory: [...res.data.inventory],
                    status: [...res.data.status],
                    errors: [...res.data.errors]
                }));
            })
            .catch(err => {
                console.error('Sorry, an error was encountered.');
            });
    }; // playerStatus()

    // findLocation locates a player's current room on the map
    findLocation = () => {
        axios({
            method: 'get',
            url: ('`${rootPath}/init`', {headers: headers})
        })
            .then(res => {
                console.log(res.data); // troublshooting
                let graph = this.graphRender(
                    res.data.room_id,
                    this.formatCoordinates(res.data.coordinates),
                    res.data.exits
                );
                this.setState(prevState => ({
                    room_id: res.data.room_id,
                    coords: this.formatCoordinates(res.data.coordinates),
                    cooldown: res.status.cooldown,
                    exits: [...res.data.exits],
                    graph
                    // another placeholder for more attributes if necessary
                }));
                this.createVisitedPath();
            })
            .catch(err => {
                console.error('Sorry, an initialization error was encountered.');
            });
    }; // findLocation()

    handleClick = () => {
        this.findLocation();
    };

    ////////// MOVEMENT AND TRAVERSAL FUNCTIONS //////////

    // mapTravel will allow the player to move across the map via a traversal algorithm
    mapTravel = () => {
        let count = 1;
        let unexplored = this.findUnexplored();
        console.log(`Unexplored rooms: ${unexplored}`);

        if(unexplored.length) {
            let move = unexplored[0];
            this.roomTravel(move);
        } else {
            let path = this.bfsShortest();
            if(typeof path === 'string') {
                console.log(path);
            } else {
                for(let direction of path) {
                    console.log(direction);
                    for(let d in direction) {
                        setTimeout(() => {
                            this.roomTravel(d, direction[d]);
                        }, this.state.cooldown * 1000 * count);
                        count++;
                    }
                }
            }
        }
        if(this.state.visited.size < 499) {
            setTimeout(this.mapTravel, this.state.cooldown * 1000 * count + 1000);
            this.createVisitedPath();
            count = 1;
        } else {
            console.log('Player has successfully completed a full traversal!');
            this.setState({ generating: false });
        }
    }; // mapTravel()

    roomTravel = async (move, next_room = null) => {
        // handles room to room movement
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
        try {
            const res = await axios({
                method: 'post',
                url: (`${rootPath}/move`, {headers: headers}),
                data
            });
            let previous = this.state.room_id;
            let graph = this.graphRender(
                res.data.room_id,
                this.formatCoordinates(res.data.coordinates),
                res.data.exits,
                previous,
                move
            );
            this.setState({
                room_id: res.data.room_id,
                coords: this.formatCoordinates(res.data.coordinates),
                exits: [...res.data.exits],
                cooldown: res.data.cooldown,
                graph
                // other attributes as necessary
            });
            console.log(res.data);
        } catch(error) {
            console.error('Sorry, an error was encountered while traveling.')
        }
    }; // roomTravel()

    findUnexplored = () => {
        // will find unexplored ('?') rooms on the map and push to the 'unexplored' array
        let unexplored = [];
        let directions = this.state.graph[this.state.room_id][1];
        for(let direction in directions) {
            if(directions[direction] === '?') {
                unexplored.push(direction);
            }
        }
        return unexplored;
    } // findUnexplored()

    bfsShortest = (start = this.state.room_id, target = '?') => {
        // bfs algorithm to find the path from one room to another
        let { graph } = this.state;
        let queue = [];
        let visited = new Set();
        
        for(let room in graph[start][1]) {
            queue = [...queue, [{ [room]: graph[start][1][room] }]];
        } // initialize the queue based on the starting room

        while(queue.length) {
            let dequeue = queue.shift();
            let previous = dequeue[dequeue.length - 1];

            for(let exit in previous) {
                if(previous[exit] === target) {
                    if(target === '?') {
                        dequeue.pop();
                    } // standard dequeue functionality, pops entries that are unexplored
                    dequeue.forEach(item => {
                        for(let key in item) {
                            graph[item[key]][0].color = 'bd1f27'; // red
                        }
                    }); // colors items that have been dequeued
                    return dequeue;
                } else {
                    visited.add(previous[exit]);

                    for(let path in graph[previous[exit]][1]) {
                        if(visited.has(graph[previous[exit]][1][path]) === false) {
                            // creates a copy of the path from the dequeue array
                            // pushes path with dequeued items to this new array
                            let newPath = Array.from(dequeue);
                            newPath.push({ [path]: graph[previous[exit]][1][path] });
                            queue.push(newPath);
                        }
                    }
                }
            }
        }
        return('Please proivde a valid target room!'); // error handling for invalid targets
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
                if(blank.length) {
                    visited.add(key);
                }
            }
        }
        let visitedPath = Math.round((visited.size / 500) * 100);
        this.setState({ visited: visitedPath });
    } // createVisitedPath()

    specificRoom = async room => {
        // allows the user to click on a particular room to travel to that location
        const path = this.bfsShortest(this.state.room_id, room);
        console.log(path);
        console.log(room);

        if(typeof path === 'string') {
            console.log(path);
        } else {
            for(let direction of path) {
                for(let dir in direction) {
                    await(1000 * this.state.cooldown);
                    // might need another function here
                }
            }
        }
    }; // specificRoom()

    ////////// MAP RENDERING FUNCTIONS //////////

    mapVertices = () => {
        const { graph, room_id } = this.state
        const setCoords = [];
        for(let room in graph) {
            let data = graph[room][0];
            if(room !== room_id) {
                data.color = '#778181'; // grey
            }
            setCoords.push(data);
        }
        this.setState({ totalCoords: setCoords });
    }; //mapVertices()

    mapEdges = () => {
        const { graph } = this.state;
        const setEdges = [];
        for(let room in graph) {
            for(let roomWithLink in graph[room][1]) {
                setEdges.push([graph[room][0], graph[graph[room][1][roomWithLink]][0]]);
            }
        }
        this.setState({ totalEdges: setEdges });
    }; // mapEdges()

    formatCoordinates = coords => {
        const rawCoords = {};
        const formatted = coords.replace(/[{()}]/g, '').split(',');

        formatted.forEach(coord => {
            formatted['x'] = parseInt(formatted[0]);
            formatted['y'] = parseInt(formatted[1]);
        });
        return formatted;
    }; // formatCoordinates()

    graphRender = (id, coords, exits, previous = null, move = null) => {
        // this function handles all new graph rendering during exploration
        // will also handle colors for updating and explored (non-red) rooms
        const { reversed } = this.state;
        let graph = Object.assign({}, this.state.graph);
        
        //rendering exits for currently unexplored ('?') rooms
        if(!this.state.graph[id]) {
            let payload = [];
            payload.push(coords);
            const traveled = {};
            exits.forEach(exit => {
                traveled[exit] = '?';
            });
            payload.push(traveled);
            graph = { ...graph, [id]: payload };
        }

        // checks if the user has moved from an unexplored room while making a valid move
        // previous value is stored and can also be used for backtracking if necessary
        if(previous !== null && move && previous !== id && graph[previous][1][move] === '?') {
            graph[previous][1][move] = id;
            graph[id][1][reversed[move]] = previous;
        }

        // assigns colors based on room status
        if(previous !== null) {
            graph[previous][0].color = '#778181'; // grey
            graph[id][0].color = '#4694b7'; // blue
        } else {
            graph[0][0].color = '#778181';
            graph[id][0].color = '#4694b7';
        }
        
        localStorage.setItem('graph', JSON.stringify(graph));
        return graph;
    }; // graphRender()

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
            <MapVisual coords = {this.state.totalCoords} 
                 graph = {graph}
                 edges = {this.state.totalEdges}
                 specificRoom = {this.specificRoom}
            /> // may add a progress bar as well to track map generation
        );
    }
}; // GraphMap

export default GraphMap;