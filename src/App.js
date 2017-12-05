import React, { Component } from 'react';
import {Line, Bezier, Freehand} from './Shape.js';
import {ReactSVGPanZoom} from 'react-svg-pan-zoom';

var c = require('cassowary');
const EPS = 0.1;

//----------helper functions----------
const functionAverageX = (total, amount, index, array) => {
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

const functionAverageY = (total, amount, index, array) => {
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

const distanceSquared = (p1, p2) => {
  return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
}

const functionGetAngle = (p1, p2) => {return Math.atan2(p2.y - p1.y, p2.x - p1.x);}

//----------end of helper functions----------

class DrawArea extends React.Component {
  constructor() {
    super();
    this.state = {
      isDrawing: false,
      tool: undefined,
      //lines: [], //will be a list of lists
      start: undefined,
      shapes: [], //will be a list of shapes
      selected: undefined, //will be whatever object is 'selected'
      constraints: [], //list of constraint objects
      pivotPoint: undefined,
      originalShapes: undefined,
      newShapes: [],
      //selectedLines: [], //i think we don't need this
      selectedPoints: [],
      originalPoint: undefined,
      dragStart: undefined,
      onDragEndCallbacks: [],
      mouseDragged: false,
      interLineConstraints: [],
      svgMouse: undefined,
      workpieceSize: {x:500, y:500},
      clipboard: [],
      firstPolyline: undefined,
      rotation: undefined,
      translation: undefined,
      scaleFactor: undefined,
      displayTransformations: true,
      displayLengths: "selected",

      solverPoints: [], //holds array of c.Point objects
      //file: undefined,
    };
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.solver = new c.SimplexSolver();
    //this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  handleMouseDown(mouseEvent) {
    //console.log("mouse down");

    this.setState({
      mousedown: true,
    });
    if (mouseEvent.button !== 0) {
      return;
    }
    var point = this.relativeCoordinatesForEvent(mouseEvent);
    let oldShapes = this.state.shapes;
    var Shape = Line; //used to switch between polyline and bezier;


    switch (this.state.tool) {
      case "FREEHAND":

        let freehandCurve = new Freehand(point);


        oldShapes.push(freehandCurve);

        this.setState({
            shapes: oldShapes,
            isDrawing: true,
        });
        break;
      case "BEZIER":
        Shape = Bezier; //turn on bezier drawing
      case "POLYLINE":
        if (this.state.isDrawing) {
          let firstLine = this.state.firstPolyline;
          let lastLine = oldShapes[oldShapes.length - 1];

          (lastLine) ? lastLine.deselect() : null;

          let closed = firstLine ? Math.abs(firstLine.toLine()[0].x - lastLine.toLine()[1].x) < 10 && Math.abs(firstLine.toLine()[0].y - lastLine.toLine()[1].y) < 10 : false;
          if (closed) {
            console.log('closed');
            //lastLine.deselect();
            this.solver.endEdit();

            let eq = new c.Equation(lastLine.p2_.x, new c.Expression(firstLine.p1_.x));
            let eq2 = new c.Equation(lastLine.p2_.y, new c.Expression(firstLine.p1_.y));

            this.solver.addConstraint(eq)
                       .addConstraint(eq2);

            if (this.state.tool === 'BEZIER') {
              let eqn = new c.Equation(firstLine.p1_.x, new c.Expression(firstLine.c1_.x).plus(lastLine.c2_.x).divide(2));
              let eqn2 = new c.Equation(firstLine.p1_.y, new c.Expression(firstLine.c1_.y).plus(lastLine.c2_.y).divide(2));
              this.solver.addConstraint(eqn).addConstraint(eqn2);
            }

            this.solver.solve();

            this.setState({
              isDrawing: false,
            });
          } else {
            //lastLine.deselect();
            this.solver.endEdit();

            let line = new Shape(point, this.solver);
            let oldLine = oldShapes[oldShapes.length - 1];

            //add coincident constraint
            // console.log("old x:", oldLine.p2_.x.value , "new x:",line.p1_.x.value);
            // console.log("old y:", oldLine.p2_.y.value , "new y:",line.p1_.y.value);


            line.addEditVars(this.solver);
            this.solver.beginEdit();

            line.p2_selected = true;

            oldShapes.push(line);

            let eq = new c.Equation(oldLine.p2_.x, new c.Expression(line.p1_.x));
            let eq2 = new c.Equation(oldLine.p2_.y, new c.Expression(line.p1_.y));

            this.solver.addConstraint(eq)
                       .addConstraint(eq2);

            if (this.state.tool === 'BEZIER') {
               let eqn = new c.Equation(line.p1_.x, new c.Expression(line.c1_.x).plus(oldLine.c2_.x).divide(2));
               let eqn2 = new c.Equation(line.p1_.y, new c.Expression(line.c1_.y).plus(oldLine.c2_.y).divide(2));
                this.solver.addConstraint(eqn).addConstraint(eqn2);
            }

            this.solver.solve();

            this.setState({
              shapes: oldShapes,
            });
          }
        } else {
          let line = new Shape(point, this.solver);
          console.log(line);

            line.addEditVars(this.solver);
            this.solver.beginEdit();

            line.p2_selected = true;

            oldShapes.push(line);

            this.setState({
              shapes: oldShapes,
              isDrawing: true,
              firstPolyline: line,
            });
        }
        break;
      case "RECTANGLE": //TODO: update to lines
        let line1 = new Line(point, this.solver);
        let line2 = new Line(point, this.solver);
        let line3 = new Line(point, this.solver);
        let line4 = new Line(point, this.solver);

        let eq = new c.Equation(line1.p1_.x, new c.Expression(line2.p1_.x));
        let eq2 = new c.Equation(line1.p1_.y, new c.Expression(line2.p1_.y));
        let eq3 = new c.Equation(line1.p2_.x, new c.Expression(line3.p1_.x));
        let eq4 = new c.Equation(line1.p2_.y, new c.Expression(line3.p1_.y));
        let eq5 = new c.Equation(line2.p2_.x, new c.Expression(line4.p1_.x));
        let eq6 = new c.Equation(line2.p2_.y, new c.Expression(line4.p1_.y));
        let eq7 = new c.Equation(line3.p2_.x, new c.Expression(line4.p2_.x));
        let eq8 = new c.Equation(line3.p2_.y, new c.Expression(line4.p2_.y));

        let eq9 = new c.Equation(line1.p1_.y, new c.Expression(line1.p2_.y));
        let eq10 = new c.Equation(line4.p1_.y, new c.Expression(line4.p2_.y));
        let eq11 = new c.Equation(line2.p1_.x, new c.Expression(line2.p2_.x));
        let eq12 = new c.Equation(line3.p1_.x, new c.Expression(line3.p2_.x));

        this.solver.addConstraint(eq)
                   .addConstraint(eq2)
                   .addConstraint(eq3)
                   .addConstraint(eq4)
                   .addConstraint(eq5)
                   .addConstraint(eq6)
                   .addConstraint(eq7)
                   .addConstraint(eq8)
                   .addConstraint(eq9)
                   .addConstraint(eq10)
                   .addConstraint(eq11)
                   .addConstraint(eq12)
                   .solve();

        oldShapes.push(line1);
        oldShapes.push(line2);
        oldShapes.push(line3);
        oldShapes.push(line4);

        this.solver
          .addEditVar(line4.p2_.x)
          .addEditVar(line4.p2_.y)
          .beginEdit();

        this.setState({
          shapes: oldShapes,
          isDrawing: true,
        });

        break;
      case "SELECT":
        //click and drag
        let anySelected = false;
        this.state.shapes.forEach((shape) => {
          let callback = shape.selectedObjectAt(point);
          console.log(callback);
          if (callback) {
            let oldCallbacks = this.state.onDragEndCallbacks;
            if (shape.shape_ !== "freehand") { //freehands shouldn't be dragged
              oldCallbacks.push(callback);
            }
            this.setState({onDragEndCallbacks: oldCallbacks});
            anySelected = true;
          }
        })
        //console.log(anySelected);
        let selectedPoints = [];

        if (anySelected) {
          this.state.shapes.forEach(shape => {
            if (shape.shape_ === 'line' || shape.shape_ === 'bezier') {
              selectedPoints = selectedPoints.concat(shape.selectedPoints());
            } else {
              if (shape.selectedObjectAt(point)) {
                shape.select();
              }
            }
          });
        } else { //TODO: if dragged should create select box
          this.state.shapes.forEach(shape => {
            if (shape.shape_ === 'line' || shape.shape_ === 'bezier') {
              shape.deselect();
            } else {
              shape.select(false);
            }
          })
        }
        //console.log(selectedPoints);
        if (selectedPoints.length > 0) {
          selectedPoints.forEach(point => {
            this.solver.addEditVar(point.x)
                       .addEditVar(point.y);
          });
          this.solver.beginEdit();
        }

        this.setState({
          selectedPoints: selectedPoints,
          dragStart: point,
        });

        // let selectedPoints = this.state.
        break;
      case "MOVE":
        var point = this.relativeCoordinatesForEvent(mouseEvent);
        let originalShapes = [];
        this.state.shapes.forEach(shape => {
          let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
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
          let newShape = newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

          originalShapes.push(newShape);

          if (shape.selected) {
            //points = (shape.shape_ === "line") ? points.concat(shape.points()) : points.concat(shape.points());
            points = points.concat(shape.toLine());
          }
        })

        let averageX = points.length > 1 ? points.reduce(functionAverageX) : undefined;
        let averageY = points.length > 1 ? points.reduce(functionAverageY) : undefined;

        let pivotPoint = {x:averageX, y:averageY}
        //console.log(pivotPoint);

        this.setState({pivotPoint:pivotPoint, originalShapes:originalShapes, originalPoint:originalPoint});
        break;
      default:
        return;
    }

  }

  relativeCoordinatesForEvent(mouseEvent) {
    //const boundingRect = this.refs.drawArea.getBoundingClientRect();
    //console.log(mouseEvent.point);
    // return {
    //   x: mouseEvent.clientX - boundingRect.left,
    //   y: mouseEvent.clientY - boundingRect.top,
    // };

    return (this.state.svgMouse);
  }

  handleMouseMove(mouseEvent) {
    //console.log("mouse move");

    //console.log(this.state.svgMouse)

    var point = this.relativeCoordinatesForEvent(mouseEvent);
    if (!this.state.isDrawing) {
      switch (this.state.tool) {
        case "SELECT":
          //console.log('selected Points 2:', this.state.selectedPoints);
          if (this.state.mousedown === true) {
            var point = this.relativeCoordinatesForEvent(mouseEvent);
            this.mouseDraggedToPoint(point);
          }

        break;
        case "MOVE":
          if (this.state.mousedown === true) {
            var point = this.relativeCoordinatesForEvent(mouseEvent);
            let newShapes = [];

            let xTranslation = Math.round((point.x-this.state.pivotPoint.x)*100)/100;
            let yTranslation = -Math.round((point.y-this.state.pivotPoint.y)*100)/100;

            if (this.state.displayTransformations) {this.setState({translation:{x:xTranslation, y:yTranslation}});}

            this.state.originalShapes.forEach((shape) => {
              if (shape.selected) {
                let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

                let newPoints = newShape.toLine().map(shapePoint => {
                    return ({x:shapePoint.x+(point.x-this.state.pivotPoint.x), y:shapePoint.y+(point.y-this.state.pivotPoint.y)}) //denomiator sets speed of movement
                  });

                if (shape.shape_ === "freehand") {
                  newShape.points(newPoints);
                  //console.log(newShape);
                } else {
                  newShape.pointsToCPoints(newPoints, this.solver);
                }

                newShapes.push(newShape);

              }
            });

            this.setState({newShapes: newShapes});
          }
          break;
        case "ROTATE":
          const functionRotate = (angle, pivot, shape) => {
            let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

            let newPoints = newShape.toLine().map(shapePoint => { //TODO: fix for lines to points()

              let distanceToPivot = distance(shapePoint, pivot);
              let angleWithPivot = functionGetAngle(shapePoint, pivot);
              let delta = angleWithPivot + angle + Math.PI;

              let newPoint = {x:pivot.x+Math.cos(delta)*distanceToPivot, y:pivot.y+Math.sin(delta)*distanceToPivot};
              //console.log(angleWithPivot);

              //let newPoint = {x:100, y:100};
              return newPoint;
            })

            if (shape.shape_ === "freehand") {
              newShape.points(newPoints);
            } else {
              newShape.pointsToCPoints(newPoints, this.solver);
            }

              return newShape;
            }

          if (this.state.mousedown === true) {
            let newShapes = [];

            var point = this.relativeCoordinatesForEvent(mouseEvent);
            let ogPoint = this.state.originalPoint;
            let pivot = this.state.pivotPoint;
            let ogAngle = functionGetAngle(ogPoint, pivot);
            let newAngle = functionGetAngle(point, pivot);

            //console.log("angle", (newAngle - ogAngle)/(Math.PI * 2) * 360);
            let degrees = Math.round((newAngle - ogAngle)/(Math.PI * 2) * 360 * 100) / 100;
            if (this.state.displayTransformations) {this.setState({rotation:degrees})};
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

            let factor = distance(point, pivot)/distance(ogPoint, pivot); // if point is inside shape factor should be less than 1

            let scaleFactor = Math.round(factor*100)/100;

            if (this.state.displayTransformations) {this.setState({scaleFactor:scaleFactor});};

            //console.log("scale factor",factor);

            this.state.originalShapes.forEach((shape) => {
              if (shape.selected) {

                const functionScale = (factor, shape) => {
                  let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

                  let newPoints = newShape.toLine().map(shapePoint => {
                    let angle = functionGetAngle(shapePoint, pivot) + Math.PI;
                    let dist = distance(shapePoint, pivot);
                    let newPoint = {x:pivot.x+Math.cos(angle)*factor*dist, y:pivot.y+Math.sin(angle)*factor*dist};
                    return newPoint;
                  })

                  if (shape.shape_ === "freehand") {
                    newShape.points(newPoints);
                  } else {
                    newShape.pointsToCPoints(newPoints, this.solver);
                  }

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
    //let oldState = this.state.lines;

    switch (this.state.tool) {
      case "RECTANGLE":
        var lastLine = oldShapes[oldShapes.length - 1];
        this.solver
          .suggestValue(lastLine.p2_.x, point.x)
          .suggestValue(lastLine.p2_.y, point.y)
          .resolve();
        this.setState({});
        if (!this.state.isDrawing) {break;};
      case "BEZIER":
      case "POLYLINE":
        var lastLine = oldShapes[oldShapes.length - 1];
        lastLine.drawToPoint(point, this.solver);
        this.setState({});
        break;
      case "FREEHAND":
        oldShapes[oldShapes.length - 1].lastPoint(point);
        this.setState({
          shapes: oldShapes,
        });
        break;
      default:
        return;
    }
  }

  handleMouseUp(mouseEvent) {
    let oldShapes = this.state.shapes;

    this.setState({
      mousedown: false,
    })

    switch (this.state.tool) {
      case "FREEHAND":
        this.setState({ isDrawing: false });
        break;
      case "SELECT":
        //console.log("ender");
        if(this.solver._editVarMap.size > 0) {
          this.solver.endEdit();
        }
        //console.log("dragged", this.state.mouseDragged);
        if (!this.state.mouseDragged) {
            this.state.onDragEndCallbacks.forEach(callback => callback());
        }
        this.setState({
          mouseDragged: false,
          onDragEndCallbacks: [],
        });
        break;
      case "POLYLINE": //close POLYLINE using constraints
        break;
      case "RECTANGLE":
        //console.log("mouse going up");
        this.solver.endEdit();
        this.setState({ isDrawing: false });
        break;
      case "ROTATE": // fall-through, or statement doesn't work
      case "SCALE":
      case "MOVE":
        this.setState({
          translation:undefined,
          rotation:undefined,
          scaleFactor:undefined,
        });

        let unselectedShapes = [];
        this.state.shapes.forEach(shape => {
          if (shape.selected === false) {
            unselectedShapes.push(shape);
          }
        })
        let allShapes = this.state.newShapes.concat(unselectedShapes);

        this.setState( {
          shapes: allShapes
        });
        break;
      default:
        return;
    }
  }

  mouseDraggedToPoint(point) {
    //turn off all parallel and perpindicular constraints
    // console.log(this.state.interLineConstraints);
    this.state.interLineConstraints.forEach(constraint => {
      try {
        this.solver.removeConstraint(constraint.constr1);
        this.solver.removeConstraint(constraint.constr2);
      } catch (e) {/*do nothing */}
    });

    let dx = point.x - this.state.dragStart.x;
    let dy = point.y - this.state.dragStart.y;

    //console.log('selectedPoints: ', this.state.selectedPoints);
    this.state.selectedPoints.forEach(sPoint => {
      // console.log(sPoint);
      // console.log(this.solver._editVarList);

      try {
        this.solver.suggestValue(sPoint.x, sPoint.x.value + dx)
                   .suggestValue(sPoint.y, sPoint.y.value + dy)
                   .resolve();
      } catch(e) {
        /*do nothing*/
      }
    });

    this.setState({
      dragStart: point,
      mouseDragged: true,
    });

    //update parallel and perpindicular constraints
    let updateTheseConstraints = [];
    this.state.selectedPoints.forEach(sPoint => {
      let containingInterLineConstraints = this.findContainingInterLineConstraints(sPoint);

      containingInterLineConstraints.forEach(constraint => {
        this.updateConstraint(constraint, sPoint);
      });

      updateTheseConstraints = updateTheseConstraints.concat(containingInterLineConstraints);

    });


    //re-add constraints
    this.state.interLineConstraints.forEach(constraint => {
      this.solver.addConstraint(constraint.constr1);
      this.solver.addConstraint(constraint.constr2);
    });


    //resolve and re-render
    this.solver.resolve();
    this.setState({});
  }

  findContainingInterLineConstraints(point) {
    let constraints = [];
    this.state.interLineConstraints.forEach(constraint => {
      if (constraint.line1.p1_ === point ||
          constraint.line1.p2_ === point ||
          constraint.line2.p1_ === point ||
          constraint.line2.p2_ === point) {
            constraints.push(constraint);
        }
    });
    return constraints;
  }

  findContainingPerpendicularConstraints(point) {
    let constraints = [];
    this.state.perpendicularConstraints.forEach(constraint => {
      if (constraint.line1.p1_ === point ||
          constraint.line1.p2_ === point ||
          constraint.line2.p1_ === point ||
          constraint.line2.p2_ === point) {
            constraints.push(constraint);
        }
    });
    return constraints;
  }

  updateConstraint(constraint, point) {
    //note: for perpindicular constraints, we must make sure the edited line becomes constraint.line1
    var line, isInverse, constr1, constr2;
    if (constraint.line1.p1_ === point || constraint.line1.p2_ === point) {
      line = constraint.line1;
    } else {
      line = constraint.line2;
      constraint.line2 = constraint.line1;
      constraint.line1 = line;
    }
    let ratio = (line.p2_.y.value - line.p1_.y.value) / (line.p2_.x.value - line.p1_.x.value);
    let invratio = (line.p2_.x.value - line.p1_.x.value) / (line.p2_.y.value - line.p1_.y.value);
    if (Math.abs(ratio) < Math.abs(invratio)) {
      isInverse = false;
      constr1 = this.makeAngleConstraint(constraint.line1, ratio, false);
      if (constraint.type === 'par') {
        constr2 = this.makeAngleConstraint(constraint.line2, ratio, false);
      } else {
        constr2 = this.makeAngleConstraint(constraint.line2, -ratio, true);
      }
    } else {
      isInverse = true;
      constr1 = this.makeAngleConstraint(constraint.line1, invratio, true);
      if (constraint.type === 'par') {
        constr2 = this.makeAngleConstraint(constraint.line2, invratio, true);
      } else {
        constr2 = this.makeAngleConstraint(constraint.line2, -invratio, false);
      }
    }
    constraint.constr1 = constr1;
    constraint.constr2 = constr2;
    constraint.isInverse = isInverse;
  }

  onClickTool(toolName) {
    this.setState({
      tool: toolName
    });
  }

  onClickNoTool() {
    this.setState({
        tool: undefined,
    });
  }


//------------------------constraints------------------------


  test() {
  }

  makeCoincident() { //assumes selected is a point
    let points = this.state.selectedPoints;
    let pl = points.length;
    let lastPoint = points[pl-1];

    points.slice(0, pl-1).forEach(point => {
      var eq = new c.Equation(lastPoint.x, new c.Expression(point.x));
      var eq2 = new c.Equation(lastPoint.y, new c.Expression(point.y));

      this.solver.addConstraint(eq)
                 .addConstraint(eq2)
    })

    this.setState({});
  }

  makeFixed() { //assumes selected is a point
    let points = this.state.selectedPoints;
    let pl = points.length;


    points.forEach(point => {
      this.solver.addConstraint(new c.Equation(point.x.value, new c.Expression(point.x)))
                 .addConstraint(new c.Equation(point.y.value, new c.Expression(point.y)));
    })
    //re-render
    this.setState({});
  }

  makeHorizontal() { //sets all selected lines to be horizontal
    this.state.shapes.forEach(shape => {
      if (shape.shape_ === 'line' && shape.selected) {
        var eq = new c.Equation(shape.p1_.y, shape.p2_.y);
        this.solver.addConstraint(eq);
      }
    });
    //re-render
    this.setState({});
  }

  setDistance() {
    let dist = 50; //TODO: ACTUALLY GET distance from textbox
    this.state.shapes.forEach(shape => {
      if (shape.shape_ === 'line' && shape.selected) {
        this.setDistanceConstraint(dist, shape);
      }
    });
  }

  setDistanceConstraint(distance, line) {
    let numsteps = 4;
    for (var angle = 0; angle <= 0.785398 /*45 deg*/; angle += (0.785398 / numsteps)) {
      this.setManhattanDistanceConstraint(distance, angle, line);
    }
  }

  setManhattanDistanceConstraint(distance, angle, line) {
    let p1prime = this.getRotatedPoint(line.p1_, angle);
    let p2prime = this.getRotatedPoint(line.p2_, angle);

    //four LEQ constraints from absolute value constraints
    let ineq1 = new c.Inequality(p1prime.x.minus(p2prime.x).plus(p1prime.y).minus(p2prime.y), c.LEQ, distance + EPS);
    let ineq2 = new c.Inequality(p2prime.x.minus(p1prime.x).plus(p1prime.y).minus(p2prime.y), c.LEQ, distance + EPS);
    let ineq3 = new c.Inequality(p1prime.x.minus(p2prime.x).plus(p2prime.y).minus(p1prime.y), c.LEQ, distance + EPS);
    let ineq4 = new c.Inequality(p2prime.x.minus(p1prime.x).plus(p2prime.y).minus(p1prime.y), c.LEQ, distance + EPS);
    this.solver.addConstraint(ineq1).addConstraint(ineq2).addConstraint(ineq3).addConstraint(ineq4);

    // //add LEQ constraint (this will ahve to be updated)
    // let ineq5 = new c.Inequality(p1prime.x.minus(p2prime.x).plus(p1prime.y).minus(p2prime.y), c.GEQ, distance - EPS, c.Strength.strong);
    // let ineq6 = new c.Inequality(p2prime.x.minus(p1prime.x).plus(p1prime.y).minus(p2prime.y), c.GEQ, distance - EPS, c.Strength.strong);
    // let ineq7 = new c.Inequality(p1prime.x.minus(p2prime.x).plus(p2prime.y).minus(p1prime.y), c.GEQ, distance - EPS, c.Strength.strong);
    // let ineq8 = new c.Inequality(p2prime.x.minus(p1prime.x).plus(p2prime.y).minus(p1prime.y), c.GEQ, distance - EPS, c.Strength.strong);
    // this.solver.addConstraint(ineq5).addConstraint(ineq6).addConstraint(ineq7).addConstraint(ineq8);

    var ineq;
    if (p1prime.x.value >= p2prime.x && p1prime.y >= p2prime.y) {
      ineq = new c.Inequality(p1prime.x.minus(p2prime.x).plus(p1prime.y).minus(p2prime.y), c.GEQ, distance - EPS, c.Strength.medium);
    } else if (p2prime.x.value >= p1prime.x && p1prime.y >= p2prime.y) {
      ineq = new c.Inequality(p2prime.x.minus(p1prime.x).plus(p1prime.y).minus(p2prime.y), c.GEQ, distance - EPS, c.Strength.medium);
    } else if (p1prime.x.value >= p2prime.x && p2prime.y >= p1prime.y) {
      ineq = new c.Inequality(p1prime.x.minus(p2prime.x).plus(p2prime.y).minus(p1prime.y), c.GEQ, distance - EPS, c.Strength.medium);
    } else {
      ineq = new c.Inequality(p2prime.x.minus(p1prime.x).plus(p2prime.y).minus(p1prime.y), c.GEQ, distance - EPS, c.Strength.medium);
    }
    this.solver.addConstraint(ineq);
  }

  getRotatedPoint(cPoint, angle) {
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);

    let xcos = new c.Expression(cPoint.x).times(cos);
    let ysin = new c.Expression(cPoint.y).times(sin);
    let xprime = xcos.minus(ysin);

    let xsin = new c.Expression(cPoint.x).times(sin);
    let ycos = new c.Expression(cPoint.y).times(cos);
    let yprime = xsin.plus(ycos);

    return {'x': xprime, 'y': yprime};

  }

  // setDistance(e, solver) {
  //   var expr = function(a, b) {
  //     return new c.Expression(a, b);
  //   }
  //
  //   c.Expression.prototype.multiply = function(x) {
  //     if (typeof x == 'number') {
  //       return (this.clone()).multiplyMe(x);
  //
  //     } else if (x instanceof c.Variable) {
  //       return this.clone().addVariable(x, 1);
  //     } else if (x instanceof c.Expression) {
  //       return this.clone().addExpression(x, 1);
  //     } else {
  //       if (this.isConstant) {
  //         return x.times(this.constant);
  //       } else if (x.isConstant) {
  //         return this.times(x.constant);
  //       } else {
  //         throw new c.NonExpression();
  //       }
  //     }
  //   };
  //
  //   var constant = function(val) {
  //     var v = new c.Variable({ value : val });
  //     v.isConstant = true;
  //     return v;
  //   }
  //
  //   // helper function for creating "point-point distance" constraints
  //   var distance = function(p1, p2) {
  //
  //     var x = p1.x.value - p2.x.value;
  //     var y = p1.y.value - p2.y.value;
  //     var distanceSquared = x**2 + y**2;
  //     console.log("distance", distanceSquared);
  //
  //     var dx = expr(p1.x).minus(p2.x);
  //     var dy = expr(p1.y).minus(p2.y);
  //
  //     var vardist = dx.multiply(dx).plus(dy.multiply(dy));
  //
  //     var eq = new c.Equation(vardist, -distanceSquared);
  //     solver.addConstraint(eq);
  //
  //     console.log(eq.toString())
  //   };
  //
  //   let points = this.state.selectedPoints;
  //   let pl = points.length;
  //
  //
  //   if (pl === 2) {
  //     //console.log("coincident!")
  //     distance(points[0], points[1])
  //   }
  //   //re-render
  //   this.setState({});
  // }

  makeVertical() { //sets all selected lines to be vertical
    this.state.shapes.forEach(shape => {
      if (shape.shape_ === 'line' && shape.selected) {
        var eq = new c.Equation(shape.p1_.x, shape.p2_.x);
        this.solver.addConstraint(eq);
      }
    });
    //re-render
    this.setState({});
  }

  makeParallel() {
    this.makeInterLineConstraint('par');
  }

  makePerpendicular() {
    this.makeInterLineConstraint('perp');
  }

  makeInterLineConstraint(type) {
    if (!(type === 'par' || type === 'perp')) {
      return;
    }
    let selectedLines = [];
    this.state.shapes.forEach(shape => {
      if ((shape.shape_ === 'line' || shape.shape_ === 'bezier') && shape.selected) {
        selectedLines.push(shape);
      }
    });
    if (selectedLines.length === 2) { //TODO: expand to more lines?
      let line1 = selectedLines[0];
      let line2 = selectedLines[1];
      let ratio = (line1.p2_.y.value - line1.p1_.y.value) / (line1.p2_.x.value - line1.p1_.x.value);
      let invratio = (line1.p2_.x.value - line1.p1_.x.value) / (line1.p2_.y.value - line1.p1_.y.value);
      var isInverse, constr1, constr2;
      console.log(ratio, invratio);
      if (Math.abs(ratio) < Math.abs(invratio)) {
        isInverse = false;
        constr1 = this.makeAngleConstraint(line1, ratio, false);
        if (type === 'par') {
          constr2 = this.makeAngleConstraint(line2, ratio, false);
        } else {
          constr2 = this.makeAngleConstraint(line2, -ratio, true);
        }
        this.solver.addConstraint(constr1);
        this.solver.addConstraint(constr2);
      } else {
        isInverse = true;
        constr1 = this.makeAngleConstraint(line1, invratio, true);
        if (type === 'par') {
          constr2 = this.makeAngleConstraint(line2, invratio, true);
        } else {
          constr2 = this.makeAngleConstraint(line2, -invratio, false);
        }
        this.solver.addConstraint(constr1);
        this.solver.addConstraint(constr2);
      }
      let parConstrObj = {line1, line2, constr1, constr2, isInverse, type};
      let oldConstraints = this.state.interLineConstraints;
      oldConstraints.push(parConstrObj);
      //re-render
      this.setState({interLineConstraints: oldConstraints});


    }

  }

  makeAngleConstraint(line, ratio, inverse) { //TODO: MAKE THIS WORK FOR VERTICAL LINES
    if (inverse) {
      var exp1 = new c.Expression(line.p1_.y).times(ratio);
      var exp2 = new c.Expression(line.p2_.y).times(ratio);
      var eq = new c.Equation(exp1.minus(exp2), new c.Expression(line.p1_.x).minus(line.p2_.x));
    } else {
      var exp1 = new c.Expression(line.p1_.x).times(ratio);
      var exp2 = new c.Expression(line.p2_.x).times(ratio);
      var eq = new c.Equation(exp1.minus(exp2), new c.Expression(line.p1_.y).minus(line.p2_.y));
    }
    return eq;
  }


//------------------------component mount functions------------------------
  componentDidMount() {
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

//------------------------------------------------

  copy(e) { //TODO: doesnt work with cPoints
    let newClipboard = [];
    this.state.shapes.forEach(shape => {
      if (shape.selected) {
        let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
        newClipboard.push(newShape);
      }
    })

    this.setState({clipboard:newClipboard});

    // console.log("clipboard",this.state.clipboard);
  }

  paste(e) {
    let oldShapes = this.state.shapes;
    let copied = this.state.clipboard;
    let newShapes = [];

    oldShapes.forEach(shape => {
      if (shape.shape_ === "line") {
        shape.deselect();
      } else {
        shape.select(false);
      }
    })

    copied.forEach((shape) => {

      let newPoints = shape.toLine().map(shapePoint => {
          return ({x:shapePoint.x+(30), y:shapePoint.y+(30)})
        });

      let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

      if (shape.shape_ === "freehand") {
        newShape.points(newPoints);
        //console.log(newShape);
      } else {
        newShape.pointsToCPoints(newPoints, this.solver);
      }

      newShapes.push(newShape);
    });

    newShapes = oldShapes.concat(newShapes);


    this.setState({shapes:newShapes});
    console.log(this.state.shapes);
  }

  handleDownload(e) {
    e.preventDefault();
    let filename = document.getElementById('downloadName').value;
    if (filename === "") { filename = "noName"};
    filename = `${filename}.svg`;

    let shapeArray = this.state.shapes;


    //lineArray = lineArray.concat(this.state.lines);


    let svgString = this.state.shapes.map(shape => `<path d="${shape.getPathData()}" stroke-linejoin="round" stroke-linecap="round" stroke-width="1px" stroke="black" fill="none"/>`);


    let text = `<svg
      width="${this.state.workpieceSize.x}"
      height="${this.state.workpieceSize.y}"
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

  handleSave(e) {
    e.preventDefault();
    let filename = document.getElementById('saveName').value;
    if (filename === "") { filename = "noName"};
    filename = `${filename}.txt`;

    let state = this.state;
    let text = JSON.stringify(state);

    // console.log(state);
    // console.log(text);
    // console.log(Object.getOwnPropertyNames(state.shapes[0]))

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

  handleUpload(e) { //only works for POLYLINEs -shapes- now, needs to maintain constraints as well
    e.preventDefault();
    let files = e.target.files;
    let file = files[0];
    let loadedFileIntoState = [];

    var self = this;
    //console.log(this.state)
    const stateLoaded = (stateOfInterest) => {
      if (stateOfInterest.length === 1) {
        let oldState = JSON.parse(stateOfInterest[0]);
        let state = this.state;
        let oldShapes = oldState.shapes;
        console.log("oldShapes",oldShapes);

        let newShapes = oldShapes.map(oldShape => {
          let newShape = undefined;

          switch (oldShape.shape_) {   //different shapes can be added here
            case "freehand":
              newShape = new Freehand;
              break;
            case "line":
              newShape = new Line({x:0,y:0}, this.solver);
              break;
            case "bezier":
              newShape = new Bezier({x:0,y:0}, this.solver);
              break;
          }


          newShape = Object.assign( Object.create( Object.getPrototypeOf(newShape)), oldShape); //this is so we maintain class methods

          // console.log("points", newShape.p1_._x, newShape.p2_._x)
          if (newShape.shape_ === "line" || newShape.shape === "bezier") {
            newShape.p1_ = new c.Point(newShape.p1_._x.value, newShape.p1_._y.value);
            newShape.p2_ = new c.Point(newShape.p2_._x.value, newShape.p2_._y.value);

            newShape.pointSelectDistance_ = 5;
            newShape.lineSelectDistance_ = .04;

            this.solver.addPointStays([newShape.p1_, newShape.p2_]);
          };

          return newShape
        })

        console.log("newShapes", newShapes);

        this.setState({
          isDrawing: false,
          tool: undefined,
          //lines: [], //will be a list of lists
          start: undefined,
          shapes: [], //will be a list of shapes
          selected: undefined, //will be whatever object is 'selected'
          constraints: [], //list of constraint objects
          pivotPoint: undefined,
          originalShapes: undefined,
          newShapes: [],
          //selectedLines: [], //i think we don't need this
          selectedPoints: [],
          originalPoint: undefined,
          dragStart: undefined,
          onDragEndCallbacks: [],
          mouseDragged: false,
          interLineConstraints: [],
          svgMouse: undefined,
          workpieceSize: oldState.workpieceSize,
          clipboard: [],
          firstPolyline: undefined,
          displayLengths: "selected",
          rotation: undefined,
          translation: undefined,
          scaleFactor: undefined,
          displayTransformations: true,

          solverPoints: [], //holds array of c.Point objects
          //file: undefined,
        });

        this.setState({shapes:newShapes});
      } else {
        //console.log("come again!");
        stateLoaded(stateOfInterest);
      }
    }

    var reader = new FileReader();
    reader.onload = (event) => {
        const file = event.target.result;
        const allLines = file.split(/\r\n|\n/);
        // Reading line by line
        allLines.map((line) => {
            //console.log(line);
            loadedFileIntoState.push(line);
            stateLoaded(loadedFileIntoState);
        });
    };

    reader.readAsText(files[0]);
    //console.log(loadedFileIntoState);
    //this.setState(loadedFileIntoState[0]);
  }

  updateSVGMouse(event) {
    this.setState({
      svgMouse : {x:event.x, y:event.y}
    })
    //console.log(this.state.svgMouse);
  }

  setWorkpieceSize(e) {
    e.preventDefault();
    let width = parseInt(document.getElementById('width').value);
    let height = parseInt(document.getElementById('height').value);

    if (width > 0 && height > 0) {
      this.setState({
        workpieceSize : {x:width, y:height}
      })
    }
  }

  handleTransformCheckbox(e) {
    let newState = !this.state.displayTransformations;

    this.setState({displayTransformations:newState})
  }

  handleDropdownDisplayMenu(e) {
    var e = document.getElementById("handleDropdownDisplayMenu");
    var value = e.options[e.selectedIndex].value;
    var text = e.options[e.selectedIndex].text;

    this.setState({displayLengths:value})
  }

// hotkeys
  handleKeyPress(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    console.log(code);
    console.log(e);

    let cmdDown = e.metaKey;

    let oldShapes = this.state.shapes;
    let lastShape = oldShapes[oldShapes.length -1];
    let newShapes = oldShapes.slice(0, oldShapes.length - 1);

    switch (code) {
      case 13: //enter
        switch (this.state.tool) {
          case "BEZIER":
          case "POLYLINE":
              this.solver.endEdit().resolve();
              lastShape.deselect();
              this.setState({isDrawing:false})
            break;
          default:
            return;
        }
        break;
      case 27: //esc
        switch (this.state.tool) {
          case "BEZIER":
          case "POLYLINE":
              this.solver.endEdit().resolve();

              lastShape.deselect();

              this.setState({
                shapes: newShapes,
                isDrawing:false,
              })
            break;
          default:
            return;
        }
        break;
      case 80: //p
        this.setState({tool:"POLYLINE"})
        break;
      case 70: //f
        this.setState({tool:"FREEHAND"})
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
      case 72: //h
        this.setState({tool:"PAN"})
        break;
      case 83: //s
        this.setState({tool:"SCALE"})
        break;
      case 78: //n
        this.setState({tool:undefined})
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
      case 187: //+
        this.setState({tool:"ZOOMIN"})
        break;
      case 189: //-
        this.setState({tool:"ZOOMOUT"})
        break;
      case 67: //c
        if (cmdDown === true) {
          this.copy();
        }
        break;
      case 86: //v
        if (cmdDown === true) {
          this.paste();
        }
        break;
      case 69: //e
        this.setState({tool:"RECTANGLE"})
        break;
      // case 84: //test
      //   console.log(this.state.file)
      //   break;
      default:
        return;
    }
  }

  render() {
    this.solver.resolve;
    let pointer;

    switch (this.state.tool) { //tooltips
      case "FREEHAND":
        pointer = "crosshair";
        break;
      case "POLYLINE":
        pointer = "crosshair";
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
      case undefined:
        pointer = "not-allowed";
        break;
      default:
        pointer = "default";
    }

    let width = 980;
    let height = 700;

    let drawAreaStyle = {
      width: width,
      height: height,
      border: "1px solid black",
      float: "left",
      cursor: pointer,
      outline: "none",
    }

    let activeButtonStyle = {
      outline: "none",
      boxSizing: "border-box",
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
      outline: "none",
      boxSizing: "border-box",
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
      outline: "none",
      boxSizing: "border-box",
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
      outline: "none",
      boxSizing: "border-box",
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

    let toolbarStyle = {
      // float:"left",
      listStyleType: "none",
      margin: "0px 0px",
      padding: 4,
      lineHeight: 1.5,
      position: "fixed",
      right: 0,
      overflow: "scroll",
      height:"95%",
      width:300,
      background:"white",
    }

    let tool;
    switch (this.state.tool) {
      case "PAN":
        tool = "pan";
        break;
      case "ZOOMOUT":
        tool = "zoom-out";
        break;
      case "ZOOMIN":
        tool = "zoom-in";
        break;
      default:
        tool = "none";
        break;
    }

    return (
      <div
        style={{
          outline: "none",
        }}
      >
        <div
          onKeyDown={(e) => this.handleKeyPress(e)}
          tabIndex="0"
          style={drawAreaStyle}
          ref="drawArea"
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
        >
          <ReactSVGPanZoom
            width={width} height={height}
            onMouseMove={event => this.updateSVGMouse(event)}
            toolbarPosition={"none"}
            tool={tool}
            miniaturePosition={"left"}>

            <svg width={this.state.workpieceSize.x} height={this.state.workpieceSize.y}>
              {this.state.shapes.map((shape,index) => shape.svgRender(`shapes:${index}`, this.state.displayLengths === "selected", this.state.displayLengths === "always"))};
              {this.state.newShapes.map((shape, index) => shape.svgRender(`newShapes:${index}`, this.state.displayLengths === "selected", this.state.displayLengths === "always"))}
              {/*box*/}
            </svg>

          </ReactSVGPanZoom>

        </div>

        <ul style={toolbarStyle}>
          <li><b>Tools</b></li>
          <li><button style={this.state.tool === "FREEHAND" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("FREEHAND")}>Freehand</button></li>
          <li><button style={this.state.tool === "RECTANGLE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("RECTANGLE")}>Rectangle</button></li>
          <li><button style={this.state.tool === "POLYLINE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("POLYLINE")}>Polyline</button></li>
          <li><button style={this.state.tool === "BEZIER" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("BEZIER")}>Bezier</button></li>
          <li><button style={this.state.tool === "SELECT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("SELECT")}>Select</button></li>
          <li><button style={this.state.tool === undefined ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickNoTool(e)}>No Tool</button></li>
          <li style={{fontSize:14}}>Direct Transform</li>
          <li style={{fontSize:14}}><button style={this.state.tool === "MOVE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("MOVE")}>Move</button>{this.state.translation ? `X: ${this.state.translation.x} Y: ${this.state.translation.y}` : null}</li>
          <li style={{fontSize:14}}><button style={this.state.tool === "ROTATE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("ROTATE")}>Rotate</button>{this.state.rotation ? `Angle: ${this.state.rotation}` : null} {this.state.rotation && <sup>o</sup>}</li>
          <li style={{fontSize:14}}><button style={this.state.tool === "SCALE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("SCALE")}>Scale</button>{this.state.scaleFactor ? `Factor: ${this.state.scaleFactor}` : null}</li>
          <li style={{fontSize:14}}>View Tools</li>
          <li><button style={this.state.tool === "PAN" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("PAN")}>Pan</button></li>
          <li>
            <button style={this.state.tool === "ZOOMIN" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("ZOOMIN")}>Zoom In</button>
            <button style={this.state.tool === "ZOOMOUT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("ZOOMOUT")}>Zoom Out</button>
          </li>
          <li style={{fontSize:14}}>
            Display Lengths:
            <select id="handleDropdownDisplayMenu" defaultValue={"selected"} onChange={(e) => this.handleDropdownDisplayMenu(e)}>
              <option value="none">None</option>
              <option value="selected">Selected</option>
              <option value="always">Always</option>
            </select>
          </li>
          <li style={{fontSize:14}}>Display Transformations: <input id="checkBox" type="checkbox" checked={this.state.displayTransformations} onChange={(e) => this.handleTransformCheckbox(e)}/></li>
          <li><b>Constraints</b></li>
          <li>
            <button style={defaultButtonStyle} onClick={(e) => this.makeHorizontal(e)}>Horizontal</button>
            <button style={defaultButtonStyle} onClick={(e) => this.makeVertical(e)}>Vertical</button>
          </li>
          <li>
            <button style={defaultButtonStyle} onClick={(e) => this.makeCoincident(e)}>Coincident</button>
            <button style={defaultButtonStyle} onClick={(e) => this.makeFixed(e)}>Fixed</button>
          </li>
          <li>
            <button style={defaultButtonStyle} onClick={(e) => this.makeParallel(e)}>Parallel</button>
            <button style={defaultButtonStyle} onClick={(e) => this.makePerpendicular(e)}>Perpendicular</button>
            <button style={defaultButtonStyle} onClick={(e) => this.setDistance(e, this.solver)}>Distance</button>
          </li>
          <li><b>File</b></li>
          <li>
            <form>
              <div>
                <button style={downloadButtonStyle} onClick={(e) => this.setWorkpieceSize(e)}>Set Workpiece Size</button>
                <label>width: </label>
                <input type="text" id="width" name="width" style={{fontSize:14, width: "30px"}}/>
                <label>height: </label>
                <input type="text" id="height" name="height" style={{fontSize:14, width: "30px"}}/>
              </div>
            </form>
          </li>
          <li>
            <form>
              <div>
                <button style={downloadButtonStyle} onClick={(e) => this.handleDownload(e)}>Download SVG</button>
                <label>name: </label>
                <input type="text" id="downloadName" name="downloadName" style={{fontSize:14, width: "70px"}}/>
              </div>
            </form>
          </li>
          <li>
            <form>
              <div>
                <button style={downloadButtonStyle} onClick={(e) => this.handleSave(e)}>Save</button>
                <label>name: </label>
                <input type="text" id="saveName" name="saveName" style={{fontSize:14, width: "70px"}}/>
              </div>
            </form>
          </li>
          <li><div style={downloadButtonStyle}>Upload: <input type="file" name="uploadedFile" onChange={(e) => this.handleUpload(e)}/> </div></li>
          <li><a href="http://fabmodules.org/" target="_blank" style={downloadButtonStyle}>fab modules</a></li>
        </ul>
      </div>
    );
  }
}

// <button style={defaultButtonStyle} onClick={(e) => {}}>TODO: Angle</button>
// <button style={defaultButtonStyle} onClick={(e) => this.test(e)}>TODO: Equal</button>

class App extends Component {
  render() {
    return (
      <div>
        <DrawArea/>
      </div>
    );
  }
}

export default App;
