import React, { Component } from 'react';
import {Line, Polygon, ParallelLineConstraint, Bezier} from './Shape.js';
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
      stroke: this.props.color,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }
    //console.log(this.props.line);
    const pathData = "M " + this.props.line.map(p => `${p['x']} ${p['y']}`);
    // console.log(pathData);
    // console.log(<path d={pathData} style={style}/>);
    return <path d={pathData} style={style}/>;
  }
}

class DrawingPath extends React.Component {
  render() {
    let style = {
      fill: "none",
      strokeWidth: "1px",
      stroke: this.props.color,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }
    // console.log(this.props.points);
    const pathData = "M " + this.props.points[0]['x'] + " " + this.props.points[0]['y'] +
                     " C " + this.props.points.slice(1).map(p => `${p['x']} ${p['y']}`);
    // console.log(pathData);
    // console.log(<path d={pathData} style={style}/>);
    return <path d={pathData} style={style}/>
  }
}


class Drawing extends React.Component {
  //TODO: MAYBE REFACTOR SO THAT BEZIERS AND OTHERS ARE DRAWN WITH THE SAME PROCESS
  render() {
    let shapeArray = this.props.shapes;
    let newShapeArray = this.props.newShapes;
    let lineArray = [];
    let lineArrayAndColor = [];
    let color = "black";
    shapeArray.forEach((shape) => {
      if (!shape.rendersPath()) {
        if (shape.selected === true) {
          color = "blue";
        } else {
          color = "black";
        }
        lineArray = lineArray.concat(shape.toLines());
        lineArrayAndColor = lineArrayAndColor.concat(shape.toLines().map(entry => color));
      }
    });

    newShapeArray.forEach((shape) => {
      if (!shape.rendersPath()) {
        if (shape.selected === true) {
          color = "blue";
        } else {
          color = "black";
        }
        lineArray = lineArray.concat(shape.toLines());
        lineArrayAndColor = lineArrayAndColor.concat(shape.toLines().map(entry => color));
      }
    });

    let pathShapes = shapeArray.filter(shape => shape.rendersPath());
    // console.log(pathShapes);
    let pathsDrawing = pathShapes.map((shape, index) => (
      <DrawingPath key={index} points={shape.toPath()} color={shape.selected ? "blue" : "black"} selected={shape.selected}/>
    ));

    // lineArray = lineArray.concat(this.props.lines);

    let freehandColors = this.props.lines.map(line => "black");

    // lineArrayAndColor = lineArrayAndColor.concat(freehandColors);

    // console.log(lineArray);
    // console.log(lineArrayAndColor);

    let style = {
      width: "100%",
      height: "100%",
    }

    let freehandDrawing = this.props.lines.map((line, index) => (
          <DrawingLine key={index} line={line} color={freehandColors[index]}/>
        ))

    let drawing = <svg style={style}>
        {lineArray.map((line, index) => (
          <DrawingLine key={index} line={line} color={lineArrayAndColor[index]}/>
        ))}
        {lineArray.map((line, index) => (
          <circle key={index} cx={`${line[0].x}`} cy={`${line[0].y}`} r="2" fill={lineArrayAndColor[index]}/>
        ))}
        {lineArray.map((line, index) => (
          <circle key={index} cx={`${line[1].x}`} cy={`${line[1].y}`} r="2" fill={lineArrayAndColor[index]}/>
        ))}
        {freehandDrawing}
        {pathsDrawing}
        {pathShapes.map(shape => shape.toPath().map(point => {
          if (shape.selected) {
            return <circle cx={`${point.x}`} cy={`${point.y}`} r="2" fill={"blue"}/>
          }
        }))}

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
      constraints: [], //list of constraint objects
      pivotPoint: undefined,
      originalShapes: undefined,
      newShapes: [],
      selectedLines: [],
      originalPoint: undefined,
    };
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    //this.handleKeyPress = this.handleKeyPress.bind(this);
  }



  handleMouseDown(mouseEvent) {
    //console.log("mouse down");

    //helper functions
    let functionAverageX = (total, amount, index, array) => {
      if (index === 1) {
        total = total.x;
      }
      total += amount.x;
      if( index === array.length-1 ) {
        return total/array.length;
      }else {
        return total;
      }
    };

    let functionAverageY = (total, amount, index, array) => {
      if (index === 1) {
        total = total.y;
      }
      total += amount.y;
      if( index === array.length-1 ) {
        return total/array.length;
      }else {
        return total;
      }
    };

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

        // console.log("new: ", newState)

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
          let line = new Line(point);
          oldShapes.push(line);
          this.setState({
            shapes: oldShapes,
            isDrawing: true,
          });
          // console.log("shapes", this.state.shapes);
        }
        break;
      case "POLYGON":
          if (this.state.isDrawing) {
            if (oldShapes[oldShapes.length -1].closed()) {
              // console.log('closed');
              this.setState({
                isDrawing: false,
              });
            } else {
              // console.log('not closed');
              oldShapes[oldShapes.length-1].addPoint(point);
              this.setState({
                shapes: oldShapes,
                //isDrawing: true, //this is redundant, but i may refactor later
              })
            }
          } else {
            let polygon = new Polygon(point);

            oldShapes.push(polygon);
            this.setState({
              shapes: oldShapes,
              isDrawing: true,
            });
          }
        break;
      case "BEZIER":
      console.log(this.state.isDrawing);
      console.log(this.state.shapes);
        if (this.state.isDrawing) {
          this.setState({
            isDrawing: false,
          });
        } else {
          let bezier = new Bezier(point, point, point, point);
          oldShapes.push(bezier);
          this.setState({
            shapes: oldShapes,
            isDrawing: true,
          });
        }
        break;
      case "EDIT":
        let selected = undefined;
        let lines = this.state.selectedLines;
        this.state.shapes.forEach((shape) => {  //todo: refactor forEach to some?
          let obj = shape.selectedObjectAt(point);
          if (obj) {
            selected = obj;

            if (selected.shape_ === "line") {
              lines.push(selected);
            }
            //break
          }
        });

        this.setState({
          selected: selected,
          selectedLines: lines,
        });
        console.log('selectedLines', this.state.selectedLines);
        break;
      case "SELECT":
        selected = undefined;
        this.state.shapes.forEach((shape) => {
          if (shape.shapeContains(point)) {
            shape.select();
            //console.log(shape);
          }
        })
        //console.log(this.state.shapes.every(shape => shape.shapeContains(point)===false));
        if (this.state.shapes.every(shape => shape.shapeContains(point)===false)) {
          this.state.shapes.forEach((shape) => {
              shape.selected = false;
          })
        }
        break;
      case "PAN":
      case "MOVE":
        var point = this.relativeCoordinatesForEvent(mouseEvent);
        let originalShapes = [];
        this.state.shapes.forEach(shape => {
          let newShape = new Polygon;
          newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
          originalShapes.push(newShape);
        })
        this.setState({pivotPoint:point, originalShapes:originalShapes});
        break;
      case "SCALE":
      case "ROTATE":
        originalShapes = [];
        let originalPoint = this.relativeCoordinatesForEvent(mouseEvent);
        let points = [];

        this.state.shapes.forEach(shape => {
          let newShape = new Polygon;

          if (shape.selected) {
            points = points.concat(shape.points_);
          }

          newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
          originalShapes.push(newShape);
        })

        let averageX = points.length > 1 ? points.reduce(functionAverageX) : undefined;
        let averageY = points.length > 1 ? points.reduce(functionAverageY) : undefined;

        let pivotPoint = {x:averageX, y:averageY}
        //console.log(pivotPoint);

        this.setState({pivotPoint:pivotPoint, originalShapes:originalShapes, originalPoint:originalPoint});
        break;
      case "ZOOMIN":
      case "ZOOMOUT":
        originalShapes = [];
        points = [];

        this.state.shapes.forEach(shape => {
          let newShape = new Polygon;

          points = points.concat(shape.points_);

          newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
          originalShapes.push(newShape);
        })

        averageX = points.length > 1 ? points.reduce(functionAverageX) : undefined;
        averageY = points.length > 1 ? points.reduce(functionAverageY) : undefined;

        pivotPoint = {x:320, y:240} //320 and 240 is center for now, could use object centers {x:averageX, y:averageY}
        console.log("pivot point",pivotPoint);

        let newShapes = [];
        var pivot = pivotPoint;

        let factor = undefined;

        if (this.state.tool === "ZOOMOUT") {
          factor = .9;
        } else if (this.state.tool === "ZOOMIN") {
          factor = 1.1;
        }

        // console.log("scale factor",factor);
        //
        // console.log(originalShapes);

        if (originalShapes.length > 0) {
          originalShapes.forEach((shape) => {

            const functionScale = (factor, shape) => {
              let newShape = new Polygon;
              newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

              let newPoints = newShape.points_.map(shapePoint => {
                //console.log(pivot);
                let angle = this.functionGetAngle(shapePoint, pivot) + Math.PI;
                let dist = this.distance(shapePoint, pivot);
                let newPoint = {x:pivot.x+Math.cos(angle)*factor*dist, y:pivot.y+Math.sin(angle)*factor*dist};
                return newPoint;
              })

                newShape.points_ = newPoints;

                return newShape;
              }

            let newShape = functionScale(factor, shape);

            newShapes.push(newShape);

          });
        };

        this.setState({newShapes: newShapes});

        break;
      default:
        return;
    }

  }

  distanceSquared(p1, p2) {
    return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
  }

  distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
  }

  relativeCoordinatesForEvent(mouseEvent) {
    const boundingRect = this.refs.drawArea.getBoundingClientRect();
    return {
      x: mouseEvent.clientX - boundingRect.left,
      y: mouseEvent.clientY - boundingRect.top,
    };
  }

  isPointOrArrayOfPoints(shape) {
    if (Array.isArray(shape)===true) {
      let result = shape.map(point => {return point.x !== undefined && point.y !== undefined;})
      return result.every(entry => entry===true)
    } else {
      return shape.x !== undefined && shape.y !== undefined;
    }
  }

  functionGetAngle(p1, p2) {return Math.atan2(p2.y - p1.y, p2.x - p1.x);}

  handleMouseMove(mouseEvent) {
    //console.log("mouse move");
    this.constraintUpdate(); //TODO: MOVE THIS?

    var point = this.relativeCoordinatesForEvent(mouseEvent);
    if (!this.state.isDrawing) {
      switch (this.state.tool) {
        case "EDIT":
          if (this.state.mousedown && this.state.selected && this.isPointOrArrayOfPoints(this.state.selected)) {
            // console.log("input", point)
            if (Array.isArray(this.state.selected) === false) {
              this.state.selected.x = point.x;
              this.state.selected.y = point.y;
              this.setState({});
            } else {
              for (var i=0; i < this.state.selected.length; i++) {
                this.state.selected[i].x = point.x;
                this.state.selected[i].y = point.y;
                this.setState({});
              }
            }
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
              // console.log(index);
            }

          })
          break;
        case "PAN":
        case "MOVE":
          if (this.state.mousedown === true) {
            var point = this.relativeCoordinatesForEvent(mouseEvent);
            let newShapes = [];

            this.state.originalShapes.forEach((shape) => {
              if (this.state.tool === "PAN" || shape.selected) {
                let newShape = new Polygon;
                newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
                let newPoints = newShape.points().map(shapePoint => {
                  //console.log(point.x-this.state.pivotPoint.x, point.y-this.state.pivotPoint.y)
                  return ({x:shapePoint.x+(point.x-this.state.pivotPoint.x), y:shapePoint.y+(point.y-this.state.pivotPoint.y)}) //denomiator sets speed of movement
                });
                //console.log(newPoints);
                newShape.points(newPoints);
                newShapes.push(newShape);
              }
            });

            if (this.state.tool === "PAN") {
              this.setState({shapes: newShapes, newShapes:[]});
              break;
            } else if (this.state.tool === "MOVE") {
              this.setState({newShapes: newShapes});
            }

            //console.log(newShapes)
          }
          break;
        case "ROTATE":
          const functionRotate = (angle, pivot, shape) => {
            let newShape = new Polygon;
            newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

            let newPoints = newShape.points_.map(shapePoint => {

              let distanceToPivot = this.distance(shapePoint, pivot);
              let angleWithPivot = this.functionGetAngle(shapePoint, pivot);
              let delta = angleWithPivot + angle + Math.PI;

              let newPoint = {x:pivot.x+Math.cos(delta)*distanceToPivot, y:pivot.y+Math.sin(delta)*distanceToPivot};
              //console.log(angleWithPivot);

              //let newPoint = {x:100, y:100};
              return newPoint;
            })

              newShape.points_ = newPoints;

              return newShape;
            }

          if (this.state.mousedown === true) {
            let newShapes = [];

            var point = this.relativeCoordinatesForEvent(mouseEvent);
            let ogPoint = this.state.originalPoint;
            let pivot = this.state.pivotPoint;
            let ogAngle = this.functionGetAngle(ogPoint, pivot);
            let newAngle = this.functionGetAngle(point, pivot);
            //console.log(newAngle - ogAngle);

            //functionRotate(newAngle - ogAngle, pivot, this.state.originalShapes[0]);

            this.state.originalShapes.forEach((shape) => {
              if (shape.selected) {
                let newShape = functionRotate(newAngle - ogAngle, pivot, shape);
                //console.log(newShape);
                newShapes.push(newShape);
              }
            });
            //console.log(newShapes, this.state.shapes);
            this.setState({newShapes: newShapes});

            }
          break;
        case "SCALE":
          if (this.state.mousedown === true) {
            let newShapes = [];

            let ogPoint = this.state.originalPoint;
            var pivot = this.state.pivotPoint;

            let factor = this.distance(point, pivot)/this.distance(ogPoint, pivot); // if point is inside shape factor should be less than 1

            //console.log("scale factor",factor);

            this.state.originalShapes.forEach((shape) => {
              if (shape.selected) {

                const functionScale = (factor, shape) => {
                  let newShape = new Polygon;
                  newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

                  let newPoints = newShape.points_.map(shapePoint => {
                    let angle = this.functionGetAngle(shapePoint, pivot) + Math.PI;
                    let dist = this.distance(shapePoint, pivot);
                    let newPoint = {x:pivot.x+Math.cos(angle)*factor*dist, y:pivot.y+Math.sin(angle)*factor*dist};
                    return newPoint;
                  })

                    newShape.points_ = newPoints;

                    return newShape;
                  }

                let newShape = functionScale(factor, shape);

                newShapes.push(newShape);
              }
            });

            this.setState({newShapes: newShapes});

            }
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

      case "BEZIER":
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

  handleMouseUp(mouseEvent) {
    let inCanvas = mouseEvent.srcElement ? mouseEvent.srcElement.localName : false;
    let inCanvasBoolean = inCanvas === "svg";
    //console.log("mouse up");

    this.setState({
      mousedown: false,
    })

    if (inCanvasBoolean) {
      //console.log(this.state.tool);
      switch (this.state.tool) {
        case "FREEHAND":
          this.setState({ isDrawing: false });
          break;
        case "EDIT":
          //console.log(this.state.selected);
          break;
        case "LINE" || "POLYGON":
          //do nothing
          break;
        case "ROTATE": // fall-through, or statement doesn't work
        case "SCALE":
        case "MOVE":
          let unselectedShapes = [];
          this.state.shapes.forEach(shape => {
            if (shape.selected === false) {
              unselectedShapes.push(shape);
            }
          })
          let allShapes = this.state.newShapes.concat(unselectedShapes);
          this.setState( {shapes: allShapes} );
          break;
        case "PAN":
          console.log(this.state.shapes);
          break;
        case "ZOOMOUT":
        case "ZOOMIN":
          this.setState( {shapes: this.state.newShapes} );
          break
        default:
          return;
      }
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

  onClickMove() {
    this.setState({
      tool: "MOVE",
    });
  }

  onClickPan() {
    this.setState({
      tool: "PAN",
    });
  }

  onClickScale() {
    this.setState({
      tool: "SCALE",
    });
  }

  onClickRotate() {
    this.setState({
      tool: "ROTATE",
    });
  }

  onClickEdit() {
    this.setState({
      tool: "EDIT",
    });
  }

  onClickBezier() {
    this.setState({
      tool: "BEZIER",
    });
  }

  onClickNoTool() {
    this.setState({
        tool: undefined,
    });
  }

  onClickZoomIn() {
    this.setState({
        tool: "ZOOMIN",
    });
  }

  onClickZoomOut() {
    this.setState({
        tool: "ZOOMOUT",
    });
  }

  toZero() { //assumes selected is a point
    this.state.selected.y = this.state.selected.x = 0;
    this.setState({}); //call render
  }

  horizontal() { //assumes selected is a line
    // this.state.selected.p2_.y = this.state.selected.p1_.y;
    this.state.selectedLines[this.state.selectedLines.length-1].angle(0);
    this.setState({}); //call render
  }

  makeParallel() {
    let oldConstraints = this.state.constraints;
    let c = ParallelLineConstraint(this.state.selectedLines[this.state.selectedLines.length-2], this.state.selectedLines[this.state.selectedLines.length-1]);
    oldConstraints.push(c);
    this.setState({
      constraints: oldConstraints,
    });
    this.constraintUpdate();
  }

  componentDidMount() {
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

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

  constraintUpdate() {
    let changed = false;
    this.state.constraints.forEach((constraint) => {
      changed = changed || constraint.satisfy();
    });

    if (changed) {

      this.setState({}); //re-render
    }
  }

// hotkeys
  handleKeyPress(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    console.log(code);
    switch (code) {
      case 13: //enter
        switch (this.state.tool) {
          case "POLYGON":
              this.setState({isDrawing:false})
            break;
          default:
            return;
        }
        break;
      case 80: //p
        this.setState({tool:"POLYGON"})
        break;
      case 70: //f
        this.setState({tool:"FREEHAND"})
        break;
      case 69: //e
        this.setState({tool:"EDIT"})
        break;
      case 65: //a
        this.setState({tool:"SELECT"})
        break;
      case 77: //m
        this.setState({tool:"MOVE"})
        break;
      case 82: //r
        this.setState({tool:"ROTATE"})
        break;
      case 83: //s
        this.setState({tool:"SCALE"})
        break;
      case 187: //+
        this.setState({tool:"ZOOMIN"})
        break;
      case 189: //-
        this.setState({tool:"ZOOMOUT"})
        break;
      case 72: //h
        this.setState({tool:"PAN"})
        break;
      case 8: //delete
        let unselectedShapes = [];
        this.state.shapes.forEach(shape => {
          if (shape.selected === false) {
            unselectedShapes.push(shape);
          }
        })
        this.setState( {shapes: unselectedShapes, newShapes:[]} );
        break;
      default:
        return;
    }
  }

  render() {
    let pointer = "";

    switch (this.state.tool) { //tooltips
      case "FREEHAND":
        pointer = "crosshair";
        break;
      case "POLYGON":
        pointer = "crosshair";
        break;
      case "EDIT":
        pointer = "default";
        break;
      case "MOVE":
        pointer = "move";
        break;
      case "ROTATE":
        pointer = "alias";
        break;
      case "SELECT":
        pointer = "default";
        break;
      case "ZOOMIN":
        pointer = "zoom-in";
        break;
      case "ZOOMOUT":
        pointer = "zoom-out";
        break;
      case "SCALE":
        pointer = "nwse-resize";
        break;
      case "PAN":
        pointer = "all-scroll";
        break;
      default:
        pointer = "crosshair";
    }

    // console.log("drawing: ", this.state.isDrawing);
    // console.log("state: ",this.state.lines);
    let drawAreaStyle = {
      width: "500px",
      height: "500px",
      border: "1px solid black",
      float: "left",
      cursor: pointer,
      float: "left",
    }

    let activeButtonStyle = {
      borderTop: "none",
      background: "#EBBC14",
      padding: "4px 8px",
      borderRadius: "8px",
      boxShadow: "none",
      textShadow: "none",
      color: "#000000",
      fontSize: "12px",
      fontFamily: "Helvetica",
      textDecoration: "none",
      verticalAlign: "middle",
    }

    let inactiveButtonStyle = {
      borderTop: "none",
      background: "#add8e6",
      padding: "4px 8px",
      borderRadius: "8px",
      boxShadow: "none",
      textShadow: "none",
      color: "#000000",
      fontSize: "12px",
      fontFamily: "Helvetica",
      textDecoration: "none",
      verticalAlign: "middle",
    }

    let defaultButtonStyle = {
      borderTop: "none",
      background: "#A38FDF",
      padding: "4px 8px",
      borderRadius: "8px",
      boxShadow: "none",
      textShadow: "none",
      color: "#000000",
      fontSize: "12px",
      fontFamily: "Helvetica",
      textDecoration: "none",
      verticalAlign: "middle",
    }

    let downloadButtonStyle = {
      borderTop: "none",
      background: "#E6926E",
      padding: "4px 8px",
      borderRadius: "8px",
      boxShadow: "none",
      textShadow: "none",
      color: "#000000",
      fontSize: "12px",
      fontFamily: "Helvetica",
      textDecoration: "none",
      verticalAlign: "middle",
    }


    //let's consolidate line and polygon tool to polyline
    //<tr><td><button style={this.state.tool === "LINE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickLine(e)}>Line</button></td></tr>

    return (
      <div>
        <div
          style={drawAreaStyle}
          ref="drawArea"
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
          onKeyDown={(e) => this.handleKeyPress(e)}
          tabIndex="0"
        >
          <Drawing lines={this.state.lines}
                   shapes={this.state.shapes}
                   newShapes={this.state.newShapes}/>
        </div>

        <table style={{float:"left"}}>
          <tbody>
            <tr><td><h5>Tools</h5></td></tr>
            <tr><td><button style={this.state.tool === "FREEHAND" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickFreeHand(e)}>Free Hand</button></td></tr>
            <tr><td><button style={this.state.tool === "POLYGON" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickPolygon(e)}>Polygon</button></td></tr>
            <tr><td><button style={this.state.tool === "BEZIER" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickBezier(e)}>Bezier</button></td></tr>
            <tr><td><button style={this.state.tool === "EDIT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickEdit(e)}>Edit</button></td></tr>
            <tr><td><button style={this.state.tool === "SELECT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickSelect(e)}>Select</button></td></tr>
            <tr><td><button style={this.state.tool === "MOVE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickMove(e)}>Move</button></td></tr>
            <tr><td><button style={this.state.tool === "ROTATE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickRotate(e)}>Rotate</button></td></tr>
            <tr><td><button style={this.state.tool === "SCALE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickScale(e)}>Scale</button></td></tr>
            <tr><td><button style={this.state.tool === "ZOOMIN" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickZoomIn(e)}>Zoom In</button></td></tr>
            <tr><td><button style={this.state.tool === "ZOOMOUT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickZoomOut(e)}>Zoom Out</button></td></tr>
            <tr><td><button style={this.state.tool === "PAN" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickPan(e)}>Pan</button></td></tr>
            <tr><td><button style={this.state.tool === undefined ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickNoTool(e)}>No Tool</button></td></tr>
            <tr><td><h5>Constraints</h5></td></tr>
            <tr><td><button style={defaultButtonStyle} onClick={(e) => this.toZero(e)}>To Zero</button></td></tr>
            <tr><td><button style={defaultButtonStyle} onClick={(e) => this.horizontal(e)}>Horizontal</button></td></tr>
            <tr><td><button style={defaultButtonStyle} onClick={(e) => this.makeParallel(e)}>Make Parallel</button></td></tr>
            <tr><td><h5>Export</h5></td></tr>
            <tr><td><button style={downloadButtonStyle} onClick={(e) => this.handleDownload(e)}>Download SVG</button></td></tr>
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
