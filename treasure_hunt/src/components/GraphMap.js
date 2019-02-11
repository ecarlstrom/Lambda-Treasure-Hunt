import React, { Component } from 'react';
import axios from 'axios';

require('dotenv').config();
const treasure_token = process.env.TREASURE_HUNT_TOKEN;

class GraphMap extends Component {
    // local storage here, will hold the travel path of the player
    state = { travel: 0 };

    findLocation = async() => {
        try {
            const res = await axios({
                method: 'get',
                url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init',
                headers: {
                    Authorization: // link token here when .env setup is done
                }
            });
            console.log(res.data);
        } catch(err) {
            console.error('An error was encountered. Please try again.');
        }
    }

    handleClick = () => {
        this.findLocation();
    };

    render() {
        const { travel } = this.state;
        return (
            <div className = 'placeholder-div'>
                <p>Progress bar (or whatever) placeholder</p>
            </div>
        );
    }
};

export default GraphMap;