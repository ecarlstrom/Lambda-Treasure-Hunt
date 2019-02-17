import React, { Component } from 'react';
import axios from 'axios';

// import MapVisual from './MapVisual';

require('dotenv').config();
const rootPath = 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init';
const movePath = "https://lambda-treasure-hunt.herokuapp.com/api/adv/move/";
const treasure_token = process.env.REACT_APP_TREASURE_HUNT_TOKEN;
console.log(treasure_token);
console.log(process.env);
// const headers = {
//     // 'Content-Type': 'application/json',
//     'Authorization': `Token ${treasure_token}`,
//     // 'Access-Control-Allow-Origin': 'http://localhost:3000'
// }
/*Not sure but maybe the comments in the object caused a problem */
const headers = {
  Authorization : `Token ${treasure_token}`
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
        console.log('Initializing');
        this.findLocation();
    }


    
    findLocation = () => {
        console.log('findLocation() test');
        console.log('graph empty');
        let requestOptions = { headers };
        const promise = axios.get(rootPath, requestOptions);
        promise
            .then(res => {
                console.log(res); // troubleshooting
                console.log(res.data)
                /*this line of code will take the string and make them individual numbers.  */
                // let newVar = this.formatCoordinates(res.data.coordinates); <<<< no longer returning anything handling setState from there. 
                this.formatCoordinates(res.data.coordinates, res.data.room_id)
                /*Make a copy of the graph on state */
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
                    cooldown: res.data.cooldown,
                    exits: res.data.exits,
                    graph
                    // another placeholder for more attributes if necessary
                });
                console.log(graph);
                /* What does this do?  */
                // this.createVisitedPath(); 
                
            })
            .catch(err => {
                console.log(err.response);
                console.log('Sorry, an initialization error was encountered.');
                
            });
    }; 
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

    // roomTravel = (move, next_room = null) => {
      roomTravel = (move) => {
        // handles room to room movement
        console.log(move);
        if(!move) {
            console.log('Problem with move.');
            return;
        }
        // let data;
        // if(next_room !== null) {
        //     data = {
        //         direction: move,
        //         next_room: next_room.toString()
        //     };
        // } else {
        //     data = {
        //         direction: move
        //     };
        // }    next_room will never be needed and never should be passed in.   

        const body = { direction : move}
            let requestOptions = { headers: headers };
            // axios.post(movePath, requestOptions)     We need to have the  direction passed in  
            const promise = axios.post(movePath, body, requestOptions);
            promise
                .then(res => {
                    const graph = Object.assign({}, this.state.graph);
                    console.log(graph);
                    const exits = res.data.exits;
                    console.log(exits);
                    const room = res.data.room_id;
                    let opposite = this.state.opposites[move];
                    /*best practice is not to call functions inside of your this.setState call.  */
                    // const coords =  this.formatCoordinates(res.data.coordinates);  <<<<< no longer returning anything handling the setState from there
                    this.formatCoordinates(res.data.coordinates, res.data.room_id)
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

                    /* Handle local storage */
                    localStorage.setItem('savedGraph', JSON.stringify(graph))
                    
                    /*Incase there is an issue we will have the rooms saved */
                    
                    this.setState({
                        room_id: res.data.room_id,
                        exits: res.data.exits,
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
                    console.log(error.response);
                    console.log('Sorry, an error was encountered while traveling.')
                    
                    // this.setState({ cooldown: error.response.data.cooldown });
                    if(Object.keys(this.state.graph).length < 500) {
                        setTimeout(this.mapTravel, this.state.cooldown * 1000);
                    }
        });
    }; // roomTravel()

    findUnexplored = () => {
        // will find unexplored ('?') rooms on the map and push to the 'unexplored' array
        let unexplored = [];
        console.log(this.state.graph)
        console.log(this.state.room_id)
        const graph = Object.assign({}, this.state.graph)
        const room = String(this.state.room_id)
        
        // let directions = graph[room]    weird error  Uncaught Type error : dirctions[Symbol.iterator] is not a function so work around 
        console.log(`Available directions for ${room} =`)
        console.log(graph[room])
        for(let direction in graph[room]){
          if(graph[room][direction] === '?') {
              unexplored.push(direction);
              break
          }
      }
        console.log(`The chosen path from findUnexplored = ${unexplored}`);
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


    bfsShortest = (start = this.state.room_id) => {
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
                            console.log(`converting the path in bfsShortest ${dequeue}`)
                            return this.pathConversion(dequeue);
                            
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
        // let visited = new Set(this.state.set);   there is no this.state.set  
        const visited = new Set(this.state.visited)  /*Fix but not sure why we are using a set*/
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

        /* What purpose does this serve?  */
        let visitedPath = Math.round((visited.size / 500) * 100);
        this.setState({ visited, visitedPath });
    } // createVisitedPath()




    formatCoordinates = (coor, room) => {
        console.log('first coordinates test');
        console.log(coor);
        const coords = Object.assign({}, this.state.coords);
        const rawCoords = {}
        const first = Number(coor.slice(1, 3));
        const second = Number(coor.slice(4, 6));
        console.log('second coordinates test');
        
        rawCoords['x'] = first;
        rawCoords['y'] = second;
        /*now coords will have each roomKey and  the associated x and y as an object */
        coords[room] = rawCoords; 
        console.log(`This is what coords look like ${coords[room]}`)
        this.setState({ coords: coords })
        localStorage.setItem('coords', JSON.stringify(coords))
    }; // formatCoordinates()

    

    render() {
      const graph = JSON.parse(localStorage.getItem('savedGraph'))
      // const coords = JSON.parse(localStorage.getItem('coords'))
      // console.log(graph) 
    //   const count = Object.keys(graph).length  
    //   console.log(`Total rooms found: ${count}`)
        return (
            <div className = 'test'>
                <button onClick = {this.mapTravel}>Create Map</button>
            </div>
        );
    }
}; // GraphMap

export default GraphMap;