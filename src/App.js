//adopted some from https://pspdfkit.com/blog/2017/how-to-build-free-hand-drawing-using-react/

import React, { Component } from 'react';
import {Line, Polygon} from './Shape.js';
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

const LOCK_DISTANCE = 7;

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
    let shapeArray = this.props.shapes;
    let lineArray = [];
    shapeArray.forEach((shape) => {
      lineArray = lineArray.concat(shape.toLines());
    });

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
      start: undefined,
      shapes: [], //will be a list of shapes
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
    var point = this.relativeCoordinatesForEvent(mouseEvent);
    // if (this.state.tool === "POLYGON"
    //     && this.state.start
    //     && this.distanceSquared(point, this.state.start) < LOCK_DISTANCE**2 ) {
    //   point = this.state.start;
    // }
    // console.log(this.state.isDrawing);
    // if (!this.state.isDrawing) {
    //   this.setState({
    //     start: point
    //   });
    // }

    let oldShapes = this.state.shapes;

    switch (this.state.tool) {
      case "FREEHAND":
        // let oldState = this.state.lines;
        //
        // // console.log("old: ", oldState);
        // oldState.push([point]);
        // //console.log(oldState);
        //
        // let newState = oldState;
        //
        // // console.log("new: ", newState)
        //
        // this.setState({
        //     lines: newState,
        //     isDrawing: true,
        // });
        // break;
      case "LINE":
        if (this.state.isDrawing) {
          this.setState({
            isDrawing: false
          })
        } else {
          let line = Line(point);
          oldShapes.push(line);
          this.setState({
            shapes: oldShapes,
            isDrawing: true,
          });
          console.log("shapes", this.state.shapes);
        }
        break;
      case "POLYGON":
          if (this.state.isDrawing) {
            if (oldShapes[oldShapes.length -1].closed()) {
              console.log('closed');
              this.setState({
                isDrawing: false,
              });
            } else {
              console.log('not closed');
              console.log(oldShapes[oldShapes.length-1].lines_.length);
              oldShapes[oldShapes.length-1].addLine(Line(point));
              console.log(oldShapes[oldShapes.length-1]);
              this.setState({
                shapes: oldShapes,
                //isDrawing: true, //this is redundant, but i may refactor later
              })
            }
          } else {
            let polygon = Polygon(point);

            oldShapes.push(polygon);
            this.setState({
              shapes: oldShapes,
              isDrawing: true,
            });
          }


          // let oldLines = this.state.lines;
          // oldLines.push([point, point]);
          // let newLines = oldLines.slice(0, oldLines.length);
          // this.setState({
          //   lines: oldLines,
          //   isDrawing: point !== this.state.start,  //stop drawing if polygon is complete
          // });
        break;
      default:
        return;
    }


  }

  distanceSquared(p1, p2) {
    return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
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

    var point = this.relativeCoordinatesForEvent(mouseEvent);
    let oldShapes = this.state.shapes;

    switch (this.state.tool) {
      case "LINE":

        oldShapes[oldShapes.length - 1].p2(point); //update second point of line
        this.setState({  //TODO: FACTOR THIS OUT OF ALL CASES?
          shapes: oldShapes,
        });
      break;

      case "POLYGON":
        oldShapes[oldShapes.length -1].lastPoint(point); //update the last point of the polygon
        this.setState({
          shapes: oldShapes,
        });
        break;
      case "FREEHAND":
        // // console.log("old: ", oldState);
        // var lastLine = oldState[oldState.length - 1];  //this can't be a 'let' declaration because it's defined above
        //                                               //I thought it wouldn't matter because JavaScript does everything at runtime
        //                                               //but React seems to have a compile-like phase
        // lastLine.push(point);
        //
        // var temp = oldState.slice(0,oldState.length - 1)
        // temp.push(lastLine);
        //
        // var newState = temp;
        //
        // // console.log("new: ", newState)
        //
        // this.setState({
        //     lines: newState,
        // });
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
          <Drawing lines={this.state.lines}
                    shapes={this.state.shapes}/>
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
