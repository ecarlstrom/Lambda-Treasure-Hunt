import React, { Component } from 'react';
import axios from 'axios';

require('dotenv').config();
const treasure_token = process.env.TREASURE_HUNT_TOKEN;

class GraphMap extends Component {
    // local storage here, will hold the travel path of the player
    // updating state for more accurate tracking
    state = {
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
        const path = [];

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
    }


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