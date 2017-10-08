//adopted some from https://pspdfkit.com/blog/2017/how-to-build-free-hand-drawing-using-react/

import React, { Component } from 'react';
import makerjs from 'makerjs';

let line = {
  type: 'line',
  origin: [10, 10],
  end: [50, 50]
};

let svg = makerjs.exporter.toSVG(line);

let canvasStyle = {
  border: "1px solid red"
}

class DrawingLine extends React.Component {

  render() {
    let style = {
      fill: "none",
      strokeWidth: "1px",
      stroke: "black",
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }
    //console.log(this.props.line);
    const pathData = "M " + this.props.line.map(p => `${p['x']} ${p['y']}`);
    //console.log(pathData);
    return <path d={pathData} style={style}/>;
  }
}


class Drawing extends React.Component {

  render() {
    let lineArray = this.props.lines;
    //console.log("lineArray:", lineArray);

    let style = {
      width: "100%",
      height: "100%",
    }

    return (
      <svg style={style}>
        {lineArray.map((line, index) => (
          <DrawingLine key={index} line={line} />
        ))}
      </svg>
    )
  }
}


class DrawArea extends React.Component {
  constructor() {
    super();
    this.state = {
      isDrawing: false,
      lines: [], //will be a list of lists
    };
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  handleMouseDown(mouseEvent) {
    // console.log("mouse down!");
    if (mouseEvent.button !== 0) {
      return;
    }

    const point = this.relativeCoordinatesForEvent(mouseEvent);
    // console.log("down: ", point);

    let oldState = this.state.lines;

    // console.log("old: ", oldState);
    oldState.push([point]);
    //console.log(oldState);

    let newState = oldState;

    // console.log("new: ", newState)

    this.setState({
        lines: newState,
        isDrawing: true,
    });
  }

  relativeCoordinatesForEvent(mouseEvent) {
    const boundingRect = this.refs.drawArea.getBoundingClientRect();
    return {
      x: mouseEvent.clientX - boundingRect.left,
      y: mouseEvent.clientY - boundingRect.top,
    };
  }

  handleMouseMove(mouseEvent) {
    if (!this.state.isDrawing) {
      return;
    }

    const point = this.relativeCoordinatesForEvent(mouseEvent);
    // console.log("move: ",point);

    let oldState = this.state.lines;

    // console.log("old: ", oldState);
    let lastLine = oldState[oldState.length - 1];

    lastLine.push(point);

    let temp = oldState.slice(0,oldState.length - 1)
    temp.push(lastLine);

    let newState = temp;

    // console.log("new: ", newState)

    this.setState({
        lines: newState,
    });
  }

  componentDidMount() {
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  handleMouseUp() {
    this.setState({ isDrawing: false });
  }

  render() {
    // console.log("drawing: ", this.state.isDrawing);
    // console.log("state: ",this.state.lines);
    let style = {
      width: "400px",
      height: "400px",
      border: "1px solid black",
      float: "left",
      cursor: "crosshair",
    }
    return (
      <div
        style={style}
        ref="drawArea"
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
      >
        <Drawing lines={this.state.lines} />
      </div>
    );
  }
}

class App extends Component {
  render() {

    return (
      <div>
        <canvas style={canvasStyle} width="490" height="220">
          {document.write(svg)}
        </canvas>
        <DrawArea/>
      </div>
    );
  }
}

export default App;
