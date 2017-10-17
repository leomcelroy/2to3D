//adopted some from https://pspdfkit.com/blog/2017/how-to-build-free-hand-drawing-using-react/

import React, { Component } from 'react';
// import makerjs from 'makerjs';

// let line = {
//   type: 'line',
//   origin: [10, 10],
//   end: [50, 50]
// };
//
// let svg = makerjs.exporter.toSVG(line);

// let canvasStyle = {
//   border: "1px solid red"
// }

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
      tool: undefined,
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
console.log(this.state.tool);
    const point = this.relativeCoordinatesForEvent(mouseEvent);

    switch (this.state.tool) {
      case "FREEHAND":
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
        break;
      case "LINE":  //fallthrough
      case "POLYGON":
        if (this.state.isDrawing && this.state.tool == "LINE") {
          this.setState({
            isDrawing: false
          });
        } else {
          let oldLines = this.state.lines;
          oldLines.push([point, point]);
          let newLines = oldLines.slice(0, oldLines.length);
          console.log(oldLines);
          console.log(newLines);
          this.setState({
            lines: oldLines,
            isDrawing: true,
          });
        }
        break;
      default:
        return;
    }


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
    let oldState = this.state.lines;
    switch (this.state.tool) {
      case "LINE": //fallthrough
      case "POLYGON":
        var lastLine = oldState.pop();
        lastLine[1] = point;

        var temp = oldState.slice(0,oldState.length)
        temp.push(lastLine);

        var newState = temp;

        this.setState({
            lines: newState,
        });
        break;
      case "FREEHAND":
        // console.log("old: ", oldState);
        var lastLine = oldState[oldState.length - 1];  //this can't be a 'let' declaration because it's defined above
                                                      //I thought it wouldn't matter because JavaScript does everything at runtime
                                                      //but React seems to have a compile-like phase
        lastLine.push(point);

        var temp = oldState.slice(0,oldState.length - 1)
        temp.push(lastLine);

        var newState = temp;

        // console.log("new: ", newState)

        this.setState({
            lines: newState,
        });
        break;
      default:
        return;
    }


  }

  onClickFreeHand() {
    this.setState({
        tool: "FREEHAND",
    });
  }

  onClickLine() {
    this.setState({
      tool: "LINE",
    });
  }

  onClickPolygon() {
    this.setState({
        tool: "POLYGON",
    });
  }

  onClickNoTool() {
    this.setState({
        tool: undefined,
    });
  }

  componentDidMount() {
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  handleMouseUp() {
    switch (this.state.tool) {
      case "FREEHAND":
        this.setState({ isDrawing: false });
        break;
      case "LINE" || "POLYGON":
        //do nothing
        break;
      default:
        return;
    }

  }

  render() {
    // console.log("drawing: ", this.state.isDrawing);
    // console.log("state: ",this.state.lines);
    let drawAreaStyle = {
      width: "400px",
      height: "400px",
      border: "1px solid black",
      float: "left",
      cursor: "crosshair",
    }

    let activeButtonStyle = {
      backgroundColor: "Yellow"
    }

    let inactiveButtonStyle = {
    }

    return (
      <div>
      <button style={this.state.tool === "FREEHAND" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickFreeHand(e)}>Free Hand</button>
      <button style={this.state.tool === "LINE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickLine(e)}>Line</button>
      <button style={this.state.tool === "POLYGON" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickPolygon(e)}>Polygon</button>
      <button style={this.state.tool === undefined ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickNoTool(e)}>No Tool</button>
        <div
          style={drawAreaStyle}
          ref="drawArea"
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
        >
          <Drawing lines={this.state.lines} />
        </div>
      </div>
    );
  }
}

class App extends Component {
  render() {
    // <canvas style={canvasStyle} width="490" height="220">
    //   {document.write(svg)}
    // </canvas>

    return (
      <div>
        <DrawArea/>
      </div>
    );
  }
}

export default App;
