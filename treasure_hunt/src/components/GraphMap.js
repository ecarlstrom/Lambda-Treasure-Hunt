import React, { Component } from 'react';
import axios from 'axios';

require('dotenv').config();
const treasure_token = process.env.TREASURE_HUNT_TOKEN;

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
        message: '',
        path: [],
        progress: 0,
        room_id: 0
    };

    // adding componentDidMount to handle initialization, will find stored current location
    componentDidMount() {
        this.findLocation();
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
            url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/status',
            headers: {
                Authorization: `Token ${treasure_token}`
            }
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
    findLocation = async() => {
        try {
            const res = await axios({
                method: 'get',
                url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init',
                headers: {
                    Authorization: `Token ${treasure_token}` // link token here when .env setup is done
                }
            });
            console.log(res.data);
        } catch(err) {
            console.error('An error was encountered. Please try again.');
        }
    } // findLocation()

    handleClick = () => {
        this.findLocation();
    };

    // mapTravel will allow the player to move across the map via a traversal algorithm
    mapTravel = () => {
        let { coords, exits, graph, path, room_id } = this.state;
        const inverseDirections = { n: 's', s: 'n', w: 'e', e: 'w' }; // reversing direction for backtracking
        this.setState({ generating: true }); // path is being generated, so generated is true

        const traversal = {};
        const traversalPath = [];

        // initialiazing the first room, if there is no current room_id it is set when initialized
        if (!graph[room_id]) {
            traversal[room_id] = [];
            traversal[room_id].push(coords);
            
            const travel = {};
            exits.forEach(exit => {
                travel[exit] = '?'; // represents unexplored exits
            });
            traversal[room_id].push(travel);
        }

        // main loop logic, goes through the list of room IDs to push them to the proper place
        const interval = setInterval(() => {
            const unexplored = []; // array of unexplored rooms
            const directions = traversal[room_id][1];
            for (let direction in directions) {
                if (directions[direction] === '?') {
                    unexplored.push(direction);
                }
            }
            if (unexplored) {
                const travel = unexplored[0];
                traversalPath.push(travel);
                let previous_room = room_id;

                // need to make a room-to-room movement function here
            }
        })
    }

    roomTravel = async move => {
        try {
            const res = await axios({
                method: 'post',
                url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/move',
                headers: {
                    Authorization: `Token ${treasure_token}`
                },
                data: {
                    direction: move
                }
            });
            this.setState({
                room_id: res.data.room_id,
                // add method to parse coordinates here to normalize input
                // parsing coming shortly
                exits: [...res.data.exits]
            });
            console.log(res.data);
        } catch(error) {
            console.error('Sorry, an error was encountered.')
        }
    };


    render() {
        const { travel } = this.state;
        return (
            <div className = 'placeholder-div'>
                <button className = 'button' onClick = {this.handleClick}>
                Create Map
                </button>
            </div> // may add a progress bar as well to track map generation
        );
    }
};

export default GraphMap;