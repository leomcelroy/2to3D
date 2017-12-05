import {CoincidentConstraint, ParallelLineConstraint, PerpendicularLineConstraint, VerticalLineConstraint, HorizontalLineConstraint, angle} from './GeometricConstraintSolver.js';
import React from 'react';
var c = require('cassowary');
//look at maker.js?



class Line {
  constructor(startingPoint, solver) {

    this.shape_ = 'line';
    this.p1_ = new c.Point(startingPoint.x, startingPoint.y);
    this.p2_ = new c.Point(startingPoint.x, startingPoint.y);
    this.pointSelectDistance_ = 3; //todo: setter / getter
    this.lineSelectDistance_ = 0.04;
    this.selected = false;
    this.p1_selected = false;
    this.p2_selected = false;

    solver.addPointStays([this.p1_, this.p2_]);
  }

  p1(p) { if (p){ this.p1_ = p; return this;} return this.p1_};

  p2(p) { if (p){ this.p2_ = p; return this;} return this.p2_};

  toLine() { return [cPointToPoint(this.p1_), cPointToPoint(this.p2_)] };

  pointsToCPoints(points, solver) {
    this.p1_ = new c.Point(points[0].x, points[0].y);
    this.p2_ = new c.Point(points[1].x, points[1].y);

    solver.addPointStays([this.p1_, this.p2_]);
  }

  toLines() { return [this.toLine()] };

  length() {
    let p1 = this.toLine()[0];
    let p2 = this.toLine()[1];

    let length = distanceSquared(p1, p2)**(1/2);

    return length;
  }

  selectedObjectAt(point) {
    console.log("pointSelectDistance_",this.pointSelectDistance_**2);
    if (distanceSquared(point, cPointToPoint(this.p1_)) < this.pointSelectDistance_**2) {
      if (this.p1_selected) {
        //return a callbcak to be called on mouseup (if mouse was not dragged)
        return () => {this.p1_selected = false};
      } else {
        this.p1_selected = true;
        return () => {/*do nothing*/};
      }
    } else if (distanceSquared(point, cPointToPoint(this.p2_)) < this.pointSelectDistance_**2) {
      if (this.p2_selected) {
        return () => {this.p2_selected = false};
      } else {
        this.p2_selected = true;
        return () => {/*do nothing*/};
      }
    } else if (onLine(point, cPointToPoint(this.p1_), cPointToPoint(this.p2_), this.lineSelectDistance_)) {
      if (this.selected) {
        return () => {this.selected = this.p1_selected = this.p2_selected = false};
      } else {
        this.selected = this.p1_selected = this.p2_selected = true;
        return () => {/*do nothing*/};
      }
    }
    return undefined;
  }

  selectedPoints() {
    if (this.p1_selected && this.p2_selected) {
      return [this.p1_, this.p2_];
    } else if (this.p1_selected) {
      return [this.p1_];
    } else if  (this.p2_selected) {
      return [this.p2_];
    } else {
      return [];
    }
  }

  deselect() {
    this.selected = this.p1_selected = this.p2_selected = false;
  }

  select(booleanValue) {
    return this.selected = (booleanValue === undefined) ? !this.selected : booleanValue;
  }

  shapeContains(point) {
    return onLine(point, cPointToPoint(this.p1_), cPointToPoint(this.p2_), this.lineSelectDistance_);
  }

  svgRender(index, lengths = true, alwaysLengths = false) {
    let circle1Color = this.p1_selected ? "blue" : "black";
    let circle2Color = this.p2_selected ? "blue" : "black";
    let lineColor = this.selected ? "blue" : "black";

    let style = {
      fill: "none",
      strokeWidth: "3px",
      stroke: lineColor,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }

    const pathData = "M " + this.toLine().map(p => `${p['x']} ${p['y']}`);

    let selectedAtAll = (this.selected || this.p1_selected || this.p2_selected) && lengths || alwaysLengths;

    let textStyle = {
      WebkitTouchCallout: "none", /* iOS Safari */
        WebkitUserSelect: "none", /* Safari */
         khtmlUserSelect: "none", /* Konqueror HTML */
           MozUserSelect: "none", /* Firefox */
            msUserSelect: "none", /* Internet Explorer/Edge */
              userSelect: "none", /* Non-prefixed version, currently
                                      supported by Chrome and Opera */
    }
    return (
      <g>
        <path d={pathData} style={style} id={`${index}`}/>
        {(selectedAtAll) ? <text dy={"-8"}><textPath href={`#${index}`} startOffset={"43%"} style={textStyle}>{Math.round(this.length()*1000)/1000}</textPath></text> : null}
        <circle cx={`${this.p1_.x.value}`} cy={`${this.p1_.y.value}`} r="3" fill={circle1Color}/>
        <circle cx={`${this.p2_.x.value}`} cy={`${this.p2_.y.value}`} r="3" fill={circle2Color}/>
      </g>
    )
  }
}

class Freehand {
  constructor(point) {
    this.shape_ = 'freehand';
    this.points_ = [];
    this.lineSelectDistance_ = 2;
    this.selected = false;

    if (point) {
      this.points_.push(point);
      this.points_.push(point);
    }
  }

  lastPoint(p) {  //if arg is specified, sets the last point of the rectangle and returns this

    this.points_.push(p);

    return this;
  }

  points(points) {
    if (points === undefined) {
      return this.points_;
    }
    this.points_ = points;
  }

  //lockDistance(d) { if(d){ this.lockDistance_ = d; return this} return this.lockDistance_};

  toLine() {
    return this.points_;
  };

  toLines() {
    let lines = []
    for (let i = 0; i < this.points_.length -1; i++) {
      lines.push([this.points_[i], this.points_[i+1]]);
    }
    return lines;
  };

  select(booleanValue) {
    return this.selected = (booleanValue === undefined) ? !this.selected : booleanValue;
  }

  selectedObjectAt(point) {
    let contains = this.toLines()
                        .map(line => onLine(point,line[0],line[1],this.lineSelectDistance_))
                        .some(entry => entry===true);

    return contains;
  }

  svgRender() {
    let lineColor = this.selected ? "blue" : "black";


    let style = {
      fill: "none",
      strokeWidth: "3px",
      stroke: lineColor,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }

    const pathData = "M " + this.points().map(p => `${p['x']} ${p['y']}`);

    return <g>
      <path d={pathData} style={style}/>
      {/*this.points().map(p => <circle cx={`${p['x']}`} cy={`${p['y']}`} r="5" fill={'black'}/>)*/}
    </g>
  }
} //end Freehand()

class Bezier {
  constructor(start, c1, c2, end) {
    this.start_ = start;
    this.c1_ = c1;
    this.c2_ = c2;
    this.end_ = end;
    this.selected = false;
    this.pointSelectDistance_ = 15; //todo: setter / getter
    this.lineSelectDistance_ = 15;
  }

  points(points) {
    if (points === undefined) {
      return [this.start_, this.c1_, this.c2_, this.end_];
    }
    this.start_ = points[0];
    this.c1_ = points[1];
    this.c2_ = points[2];
    this.end_ = points[3];
  }

  lastPoint(point) {
    this.end_ = point;
    let diff = {'x': this.end_.x - this.start_.x, 'y': this.end_.y - this.start_.y};
    this.c1_ = {'x': this.start_.x + (1.0/3) * diff.x,  'y': this.start_.y + (1.0/3) * diff.y};
    this.c2_ = {'x': this.start_.x + (2.0/3) * diff.x,  'y': this.start_.y + (2.0/3) * diff.y};
  }

  shapeContains(point) {
    return onLine(point, this.start_, this.end_, this.lineSelectDistance_);
  }

  selectedObjectAt(point) {
    var obj = undefined;
    this.points().forEach(p =>{
      if (distanceSquared(point, p) < this.pointSelectDistance_**2) {
        obj = p;
      }
    });
    return obj;
  }

  select() {
    return this.selected = !this.selected;
  }

  svgRender() {
    let lineColor = this.selected ? "blue" : "black";


    let style = {
      fill: "none",
      strokeWidth: "2px",
      stroke: lineColor,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }

    const pathData = "M " + this.points()[0]['x'] + " " + this.points()[0]['y'] +
                     " C " + this.points().slice(1).map(p => `${p['x']} ${p['y']}`);

    return <g>
      <path d={pathData} style={style}/>
      {this.points().map(p => <circle cx={`${p['x']}`} cy={`${p['y']}`} r="5" fill={'black'}/>)}
    </g>
  }
}

//-------------------------------helper functions-------------------------------

function onLine(point, p1, p2, buffer) {
  let d1 = Math.sqrt(distanceSquared(point, p1));
  let d2 = Math.sqrt(distanceSquared(point, p2));

  return d1 + d2 < Math.sqrt(distanceSquared(p1, p2)) + buffer
}

function distanceSquared(p1, p2) {
  return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
}

function pointEqual(p1, p2) {
  let foo = p1.x === p2.x && p1.y == p2.y;
  return foo;
}

function cPointToPoint(cpoint) {
  // if (cpoint.x === undefined || cpoint.y === undefined) {
  //   return {'x': cpoint._x.value, 'y': cpoint._y.value}; //this is for upload for some reason
  // }
  return {'x': cpoint.x.value, 'y': cpoint.y.value};
}
let boxStyle = {stroke:"#000000", fill:"none", strokeWidth:0.9};

let box = <g>
            <g transform={"translate(90, 90) "} >
            <polygon style={boxStyle} points={"0, 0 76.24799999999999, 0 76.24799999999999, 10.62 152.49599999999998, 10.62 152.49599999999998, 0 228.74399999999997, 0 228.74399999999997, 10.62 304.99199999999996, 10.62 304.99199999999996, 0 381.23999999999995, 0 381.23999999999995, 76.24799999999999 370.61999999999995, 76.24799999999999 370.61999999999995, 152.49599999999998 381.23999999999995, 152.49599999999998 381.23999999999995, 228.74399999999997 370.61999999999995, 228.74399999999997 370.61999999999995, 304.99199999999996 381.23999999999995, 304.99199999999996 381.23999999999995, 381.23999999999995 304.99199999999996, 381.23999999999995 304.99199999999996, 370.61999999999995 228.74399999999997, 370.61999999999995 228.74399999999997, 381.23999999999995 152.49599999999998, 381.23999999999995 152.49599999999998, 370.61999999999995 76.24799999999999, 370.61999999999995 76.24799999999999, 381.23999999999995 0, 381.23999999999995 0, 304.99199999999996 10.62, 304.99199999999996 10.62, 228.74399999999997 0, 228.74399999999997 0, 152.49599999999998 10.62, 152.49599999999998 10.62, 76.24799999999999 0, 76.24799999999999 "}/>
            </g>

            <g transform={"translate(471.23999999999995, 90) "} >
            <polygon style={boxStyle} points={"0, 0 76.24799999999999, 0 76.24799999999999, 10.62 152.49599999999998, 10.62 152.49599999999998, 0 228.74399999999997, 0 228.74399999999997, 10.62 304.99199999999996, 10.62 304.99199999999996, 0 381.23999999999995, 0 381.23999999999995, 76.24799999999999 370.61999999999995, 76.24799999999999 370.61999999999995, 152.49599999999998 381.23999999999995, 152.49599999999998 381.23999999999995, 228.74399999999997 370.61999999999995, 228.74399999999997 370.61999999999995, 304.99199999999996 381.23999999999995, 304.99199999999996 381.23999999999995, 381.23999999999995 304.99199999999996, 381.23999999999995 304.99199999999996, 370.61999999999995 228.74399999999997, 370.61999999999995 228.74399999999997, 381.23999999999995 152.49599999999998, 381.23999999999995 152.49599999999998, 370.61999999999995 76.24799999999999, 370.61999999999995 76.24799999999999, 381.23999999999995 0, 381.23999999999995 0, 304.99199999999996 10.62, 304.99199999999996 10.62, 228.74399999999997 0, 228.74399999999997 0, 152.49599999999998 10.62, 152.49599999999998 10.62, 76.24799999999999 0, 76.24799999999999 "}/>
            </g>

            <g transform={"translate(852.4799999999999, 90) "} >
            <polygon style={boxStyle} points={"10.62, 0 76.24799999999999, 0 76.24799999999999, 10.62 152.49599999999998, 10.62 152.49599999999998, 0 228.74399999999997, 0 228.74399999999997, 10.62 304.99199999999996, 10.62 304.99199999999996, 0 370.61999999999995, 0 370.61999999999995, 76.24799999999999 381.23999999999995, 76.24799999999999 381.23999999999995, 152.49599999999998 370.61999999999995, 152.49599999999998 370.61999999999995, 228.74399999999997 381.23999999999995, 228.74399999999997 381.23999999999995, 304.99199999999996 370.61999999999995, 304.99199999999996 370.61999999999995, 381.23999999999995 304.99199999999996, 381.23999999999995 304.99199999999996, 370.61999999999995 228.74399999999997, 370.61999999999995 228.74399999999997, 381.23999999999995 152.49599999999998, 381.23999999999995 152.49599999999998, 370.61999999999995 76.24799999999999, 370.61999999999995 76.24799999999999, 381.23999999999995 10.62, 381.23999999999995 10.62, 304.99199999999996 0, 304.99199999999996 0, 228.74399999999997 10.62, 228.74399999999997 10.62, 152.49599999999998 0, 152.49599999999998 0, 76.24799999999999 10.62, 76.24799999999999 "}/>
            </g>

            <g transform={"translate(852.4799999999999, 471.23999999999995) "} >
            <polygon style={boxStyle} points={"10.62, 0 76.24799999999999, 0 76.24799999999999, 10.62 152.49599999999998, 10.62 152.49599999999998, 0 228.74399999999997, 0 228.74399999999997, 10.62 304.99199999999996, 10.62 304.99199999999996, 0 370.61999999999995, 0 370.61999999999995, 76.24799999999999 381.23999999999995, 76.24799999999999 381.23999999999995, 152.49599999999998 370.61999999999995, 152.49599999999998 370.61999999999995, 228.74399999999997 381.23999999999995, 228.74399999999997 381.23999999999995, 304.99199999999996 370.61999999999995, 304.99199999999996 370.61999999999995, 381.23999999999995 304.99199999999996, 381.23999999999995 304.99199999999996, 370.61999999999995 228.74399999999997, 370.61999999999995 228.74399999999997, 381.23999999999995 152.49599999999998, 381.23999999999995 152.49599999999998, 370.61999999999995 76.24799999999999, 370.61999999999995 76.24799999999999, 381.23999999999995 10.62, 381.23999999999995 10.62, 304.99199999999996 0, 304.99199999999996 0, 228.74399999999997 10.62, 228.74399999999997 10.62, 152.49599999999998 0, 152.49599999999998 0, 76.24799999999999 10.62, 76.24799999999999 "}/>
            </g>

            <g transform={"translate(90, 471.23999999999995) "} >
            <polygon style={boxStyle} points={"10.62, 10.62 76.24799999999999, 10.62 76.24799999999999, 0 152.49599999999998, 0 152.49599999999998, 10.62 228.74399999999997, 10.62 228.74399999999997, 0 304.99199999999996, 0 304.99199999999996, 10.62 370.61999999999995, 10.62 370.61999999999995, 76.24799999999999 381.23999999999995, 76.24799999999999 381.23999999999995, 152.49599999999998 370.61999999999995, 152.49599999999998 370.61999999999995, 228.74399999999997 381.23999999999995, 228.74399999999997 381.23999999999995, 304.99199999999996 370.61999999999995, 304.99199999999996 370.61999999999995, 370.61999999999995 304.99199999999996, 370.61999999999995 304.99199999999996, 381.23999999999995 228.74399999999997, 381.23999999999995 228.74399999999997, 370.61999999999995 152.49599999999998, 370.61999999999995 152.49599999999998, 381.23999999999995 76.24799999999999, 381.23999999999995 76.24799999999999, 370.61999999999995 10.62, 370.61999999999995 10.62, 304.99199999999996 0, 304.99199999999996 0, 228.74399999999997 10.62, 228.74399999999997 10.62, 152.49599999999998 0, 152.49599999999998 0, 76.24799999999999 10.62, 76.24799999999999 "}/>
            </g>

            <g transform={"translate(471.23999999999995, 471.23999999999995) "} >
            <polygon style={boxStyle} points={"10.62, 10.62 76.24799999999999, 10.62 76.24799999999999, 0 152.49599999999998, 0 152.49599999999998, 10.62 228.74399999999997, 10.62 228.74399999999997, 0 304.99199999999996, 0 304.99199999999996, 10.62 370.61999999999995, 10.62 370.61999999999995, 76.24799999999999 381.23999999999995, 76.24799999999999 381.23999999999995, 152.49599999999998 370.61999999999995, 152.49599999999998 370.61999999999995, 228.74399999999997 381.23999999999995, 228.74399999999997 381.23999999999995, 304.99199999999996 370.61999999999995, 304.99199999999996 370.61999999999995, 370.61999999999995 304.99199999999996, 370.61999999999995 304.99199999999996, 381.23999999999995 228.74399999999997, 381.23999999999995 228.74399999999997, 370.61999999999995 152.49599999999998, 370.61999999999995 152.49599999999998, 381.23999999999995 76.24799999999999, 381.23999999999995 76.24799999999999, 370.61999999999995 10.62, 370.61999999999995 10.62, 304.99199999999996 0, 304.99199999999996 0, 228.74399999999997 10.62, 228.74399999999997 10.62, 152.49599999999998 0, 152.49599999999998 0, 76.24799999999999 10.62, 76.24799999999999 "}/>
            </g>
          </g>



export {Line, Bezier, Freehand, box};
