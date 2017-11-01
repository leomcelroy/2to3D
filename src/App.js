//adopted some from https://pspdfkit.com/blog/2017/how-to-build-free-hand-drawing-using-react/

import React, { Component } from 'react';
import {Line, Polygon} from './Shape.js';
//import ReactDOM from 'react-dom';
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

const SELECT_DISTANCE = 7;

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

    lineArray = lineArray.concat(this.props.lines);

    let style = {
      width: "100%",
      height: "100%",
    }
    let drawing = <svg style={style}>
        {lineArray.map((line, index) => (
          <DrawingLine key={index} line={line} />
        ))}
      </svg>

    return (
      drawing
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
      selected: undefined, //will be whatever object is 'selected'
    };
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  handleMouseDown(mouseEvent) {
    this.setState({
      mousedown: true,
    });
    if (mouseEvent.button !== 0) {
      return;
    }
    var point = this.relativeCoordinatesForEvent(mouseEvent);
    let oldShapes = this.state.shapes;

    switch (this.state.tool) {
      case "FREEHAND":
        let oldState = this.state.lines;

        // console.log("old: ", oldState);
        oldState.push([point]);
        //console.log(oldState);

        let newState = oldState;

        console.log("new: ", newState)

        this.setState({
            lines: newState,
            isDrawing: true,
        });
        break;
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
              oldShapes[oldShapes.length-1].addPoint(point);
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
        break;
      case "SELECT":
        let selected = undefined;
        this.state.shapes.forEach((shape) => {  //todo: refactor forEach to some?
          let obj = shape.selectedObjectAt(point);
          if (obj) {
            selected = obj;
            //break
          }
        });
        this.setState({
          selected: selected,
        });
        console.log('selected', selected);
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

  isPoint(shape) {
    return shape.x !== undefined && shape.y !== undefined;
  }

  handleMouseMove(mouseEvent) {
    var point = this.relativeCoordinatesForEvent(mouseEvent);
    if (!this.state.isDrawing) {
      switch (this.state.tool) {
        case "SELECT":
          if (this.state.mousedown && this.state.selected && this.isPoint(this.state.selected)) {
            this.state.selected.x = point.x;
            this.state.selected.y = point.y;
            this.setState({}); //re-render
          }


          this.state.lines.map((line, index) => {
            var point = this.relativeCoordinatesForEvent(mouseEvent);
            let d1 = this.distanceSquared(line[0], point)**(1/2);
            let d2 = this.distanceSquared(line[1], point)**(1/2);
            let total = this.distanceSquared(line[0], line[1])**(1/2);
            // console.log(d1+d2);
            // console.log("total", total)

            //doesnt work for freehand lines
            if ((d1 + d2) < (total+1) || (d1 + d2) < (total-1)) {
              console.log(index);
            }

          })
          break;
        default:
          return;
      }
    }

    var point = this.relativeCoordinatesForEvent(mouseEvent);
    let oldShapes = this.state.shapes;
    let oldState = this.state.lines;

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

  //TODO: REFACTOR ALL OF THESE INTO ONE

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

  onClickSelect() {
    this.setState({
      tool: "SELECT",
    });
  }

  onClickNoTool() {
    this.setState({
        tool: undefined,
    });
  }

  toZero() { //assumes selected is a point
    this.state.selected.y = this.state.selected.x = 0;
    this.setState({}); //call render
  }

  horizontal() { //assumes selected is a line
    this.state.selected.p2_.y = this.state.selected.p1_.y;
    this.setState({}); //call render
  }

  componentDidMount() {
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  handleMouseUp() {
    this.setState({
      mousedown: false,
    })
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

  // handleDownload() {
  //   let svgString = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"> <line id="svg_1" y2="221" x2="246" y1="245" x1="107" stroke-width="5" stroke="#000000" fill="none"/>
  //   </svg>`
  //
  //   let uriContent = "data:application/octet-stream," + encodeURIComponent(svgString);
  //   let newWindow = window.open(uriContent, 'test');
  // }

  handleDownload() {
    let filename = "test.svg";
    let shapeArray = this.state.shapes;
    let lineArray = [];
    shapeArray.forEach((shape) => {
      lineArray = lineArray.concat(shape.toLines());
    });

    lineArray = lineArray.concat(this.state.lines);

    let svgString = lineArray.map(line => `<path d="M ${line.map(p => `${p['x']} ${p['y']}`)}" stroke-linejoin="round" stroke-linecap="round" stroke-width="1px" stroke="black" fill="none"/>`);

    let text = `<svg
      width="640"
      height="480"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:svg="http://www.w3.org/2000/svg">
      ${svgString.join("")}
    </svg>`
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
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
      float: "left"
    }

    let activeButtonStyle = {
      backgroundColor: "Yellow"
    }

    let inactiveButtonStyle = {
    }

    return (
      <div>
        <div
          style={drawAreaStyle}
          ref="drawArea"
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
        >
          <Drawing lines={this.state.lines}
                    shapes={this.state.shapes}/>
        </div>

        <table style={{float:"left"}}>
          <tbody>
            <tr><td><button style={this.state.tool === "FREEHAND" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickFreeHand(e)}>Free Hand</button></td></tr>
            <tr><td><button style={this.state.tool === "LINE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickLine(e)}>Line</button></td></tr>
            <tr><td><button style={this.state.tool === "POLYGON" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickPolygon(e)}>Polygon</button></td></tr>
            <tr><td><button style={this.state.tool === "SELECT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickSelect(e)}>Select</button></td></tr>
            <tr><td><button style={this.state.tool === undefined ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickNoTool(e)}>No Tool</button></td></tr>

            <tr><td><button onClick={(e) => this.toZero(e)}>To Zero</button></td></tr>
            <tr><td><button onClick={(e) => this.horizontal(e)}>Horizontal</button></td></tr>
            <tr><td><button onClick={(e) => this.handleDownload(e)}>Download SVG</button></td></tr>
          </tbody>
        </table>
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
