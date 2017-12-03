import {CoincidentConstraint, ParallelLineConstraint, PerpendicularLineConstraint, VerticalLineConstraint, HorizontalLineConstraint, angle} from './GeometricConstraintSolver.js';
import React from 'react';
var c = require('cassowary');
//look at maker.js?



class Line {
  constructor(startingPoint, solver) {

    this.shape_ = 'line';
    this.p1_ = new c.Point(startingPoint.x, startingPoint.y);
    this.p2_ = new c.Point(startingPoint.x, startingPoint.y);
    this.pointSelectDistance_ = 7; //todo: setter / getter
    this.lineSelectDistance_ = 1;
    this.objectSelectDistance_ = 1;
    //this.length_ = Math.sqrt(distanceSquared(this.p1_, this.p2_));
    this.selected = false;
    this.p1_selected = false;
    this.p2_selected = false;
    //this.points_ = [];

    solver.addPointStays([this.p1_, this.p2_]);
  }

  // points(points) {
  //   if (points === undefined) {
  //     return [this.p1_, this.p2_];
  //   }
  //   this.p1_ = points[0];
  //   this.p2_ = points[1];
  //
  //   //this.points_ = points;
  // }

  p1(p) { if (p){ this.p1_ = p; return this;} return this.p1_};

  p2(p) { if (p){ this.p2_ = p; return this;} return this.p2_};

  toLine() { return [cPointToPoint(this.p1_), cPointToPoint(this.p2_)] };

  pointsToCPoints(points, solver) {
    this.p1_ = new c.Point(points[0].x, points[0].y);
    this.p2_ = new c.Point(points[1].x, points[1].y);

    solver.addPointStays([this.p1_, this.p2_]);
  }

  toLines() { return [this.toLine()] };

  closed() {return false};

  // selectedObjectAt(point) {
  //   if (distanceSquared(point, cPointToPoint(this.p1_)) < this.pointSelectDistance_**2) { return this.p1_; }
  //   if (distanceSquared(point, cPointToPoint(this.p2_)) < this.pointSelectDistance_**2) { return this.p2_; }
  //   if (onLine(point, cPointToPoint(this.p1_), cPointToPoint(this.p2_), this.pointSelectDistance_)) { return this; }
  // }

  selectedObjectAt(point) {
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
    } else if (onLine(point, cPointToPoint(this.p1_), cPointToPoint(this.p2_), this.pointSelectDistance_)) {
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

  //updateLength() { this.length_ = Math.sqrt(distanceSquared(this.p1_, this.p2_)); }

  // length(len) {
  //   //TODO: update length when given
  //   return this.length_;
  // }

  select(booleanValue) {
    return this.selected = (booleanValue === undefined) ? !this.selected : booleanValue;
  }

  angle(a) {
    console.log("TODO: REMOVE");
    //console.log(this.length);
    if (a === undefined) {
      return Math.atan2(this.p2_.y - this.p1_.y, this.p2_.x - this.p1_.x);
    }
    // this.p2_.y = this.p1_.y + Math.sin(a) * this.length();
    // this.p2_.x = this.p1_.x + Math.cos(a) * this.length();
  }

  shapeContains(point) {
    return onLine(point, cPointToPoint(this.p1_), cPointToPoint(this.p2_), this.objectSelectDistance_);
  }

  rendersPath() {
    return false;
  }

  svgRender() {
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

      return (
        <g>
          <path d={pathData} style={style}/>
          <circle cx={`${this.p1_.x.value}`} cy={`${this.p1_.y.value}`} r="5" fill={circle1Color}/>
          <circle cx={`${this.p2_.x.value}`} cy={`${this.p2_.y.value}`} r="5" fill={circle2Color}/>
        </g>
      )
  }
}

class Freehand {
  constructor(point) {
    this.shape_ = 'freehand';
    this.points_ = [];
    this.pointSelectDistance_ = 5; //todo: setter / getter
    this.lineSelectDistance_ = 2;
    this.selected = false;

    if (point) {
      this.points_.push(point);
    }
  }

  closed() {return true};

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

  rendersPath() {
    return false;
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

  toPath() {
    return this.points();
  }

  closed() {
    return false;
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

  rendersPath() {
    return true;
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
  let d1 = distanceSquared(point, p1);
  let d2 = distanceSquared(point, p2);
  return Math.sqrt(d1) + Math.sqrt(d2) < Math.sqrt(distanceSquared(p1, p2)) + buffer
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



export {Line, Bezier, Freehand};
