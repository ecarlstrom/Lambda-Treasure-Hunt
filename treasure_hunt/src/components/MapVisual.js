import React, { Component } from 'react';
import { FlexibleXYPlot, LineSeries, MarkSeries } from 'react-vis';

class MapVisual extends Component {
    state = { value: null };

    render() {
        const { value } = this.state;
        const { coords, graph, edges, specificRoom } = this.props;
        return (
            <FlexibleXYPlot>
                {edges.map(edge => (
                    <LineSeries strokeWidth = '2'
                                color = '#161616' // dark grey
                                data = {edge}
                                key = {Math.random() * 100}
                    />
                ))}
                <MarkSeries className = 'mark-series-example'
                            strokeWidth = {1}
                            opacity = '1'
                            size = '3'
                            colorType = 'literal'
                            data = {coords}
                            style = {{ cursor: 'pointer' }}

                            onValueClick = {datapoint => {
                                for(let key in graph) {
                                    if (
                                        graph[key][0].x === datapoint.x && graph[key][0].y === datapoint.y
                                    ) {
                                       specificRoom(parseInt(key));
                                       this.setState({ value: key });
                                    }
                                  }
                                }}
                            onValueMouseOut = {() => {
                                this.setState({ value: null });
                            }}
                />
            </FlexibleXYPlot>
        );
    }
}

export default MapVisual;