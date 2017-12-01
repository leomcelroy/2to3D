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

  selectObjectAt(point) {
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
    return this.selected = (!booleanValue) ? !this.selected : booleanValue;
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
        <svg>
          <path d={pathData} style={style}/>
          <circle cx={`${this.p1_.x.value}`} cy={`${this.p1_.y.value}`} r="5" fill={circle1Color}/>
          <circle cx={`${this.p2_.x.value}`} cy={`${this.p2_.y.value}`} r="5" fill={circle2Color}/>
        </svg>
      )
  }
}

class Polygon { //add another end capability to make polylines, remove line tool from toolbar
  constructor(point) {
    this.shape_ = 'polygon';
    this.points_ = [];
    this.lockDistance_ = 10;
    this.pointSelectDistance_ = 15; //todo: setter / getter
    this.lineSelectDistance_ = 14;
    this.selected = false;

    if (point) {
      this.points_.push(point);
      this.points_.push(point);
    }
  }

  points(points) {
    if (points === undefined) {
      return this.points_;
    }
    this.points_ = points;
  }

  lockDistance(d) { if(d){ this.lockDistance_ = d; return this} return this.lockDistance_};

  //polygon.addLine = function(line) {this.lines_.push(line); return this};
  addPoint(point) {this.points_.push(point); return this;}

  toLines() {
    let lines = []
    for (let i = 0; i < this.points_.length -1; i++) {
      lines.push([this.points_[i], this.points_[i+1]]);
    }
    return lines;
  };

  select() {
    return this.selected = !this.selected;
  }

  withinLock(p) { return distanceSquared(this.points_[0], p) < this.lockDistance_**2 };

  lastPoint(p) {  //if arg is specified, sets the last point of the polygon and returns this
    if (!p) {
      return this.points_[this.points_.length -1];
    }

    if (this.withinLock(p)) {
      p = {'x': this.points_[0].x, 'y': this.points_[0].y}; //create a new point so we don't get double referencing
    }
    this.points_[this.points_.length -1] = p;

    return this;
  }

  closed() {return pointEqual(this.points_[0], this.lastPoint()) };

  selectedObjectAt(point) {
    //try points
    for (var i=0; i < this.points_.length; i++) {
      let d1 = distanceSquared(point, this.points_[i]);
      if (d1 < this.pointSelectDistance_**2) { //polygon is now closed using both this and constraints
        console.log('point!');
        console.log(i);
        if (this.closed(this)) {
          if (i === 0) { //this is a hack double select only works with end point for some reason
            i = this.points_.length - 1;
          }
          if (i === this.points_.length-1) {
            return [this.points_[i], this.points_[0]];
          } else {
            return this.points_[i];
          }
        } else {
          return this.points_[i];
        }
        //return this.points_[i]; //use this to just use constraints
      }
    }
    //try lines
    for (var i=0; i < this.points_.length-1; i++) {
      let d1 = distanceSquared(point, this.points_[i]);
      let d2 = distanceSquared(point, this.points_[i+1]);
      if (onLine(point, this.points_[i], this.points_[i+1], this.lineSelectDistance_)) {
        return new Line(this.points_[i], this.points_[i+1]);
      }
    }
  }

  shapeContains(point) {
    let polyRawLines = this.toLines();
    let polyLines = polyRawLines.map(line => new Line(line[0],line[1]))
    let contained = polyLines.map(line => line.shapeContains(point));

    return contained.some(entry => entry===true);
  }

  rendersPath() {
    return false;
  }
} //end Polygon()

class Rectangle { //TODO: This should use constraints to maintain form
  constructor(point) {
    this.shape_ = 'rectangle';
    this.points_ = [];
    this.pointSelectDistance_ = 15; //todo: setter / getter
    this.lineSelectDistance_ = 14;
    this.selected = false;

    if (point) {
      this.points_.push(point);
      this.points_.push(point);
      this.points_.push(point);
      this.points_.push(point);
    }
  }

  closed() {return true};

  lastPoint(p) {  //if arg is specified, sets the last point of the rectangle and returns this

    if (!p) {
      return this.points_[this.points_.length -1];
    } else {
      let firstpoint = this.points_[0]
      let lastpoint = {'x': p.x, 'y': p.y};

      let p2 = {'x': firstpoint.x, 'y': lastpoint.y};
      let p3 = {'x': lastpoint.x, 'y': firstpoint.y};

      this.points_[1] = p2;
      this.points_[2] = p3;

      this.points_[3] = lastpoint;
    }

    return this;
  }

  points(points) {
    if (points === undefined) {
      return this.points_;
    }
    this.points_ = points;
  }

  lockDistance(d) { if(d){ this.lockDistance_ = d; return this} return this.lockDistance_};

  toLines() {
    let lines = []
    lines.push([this.points_[0], this.points_[1]]);
    lines.push([this.points_[1], this.points_[3]]);
    lines.push([this.points_[2], this.points_[0]]);
    lines.push([this.points_[3], this.points_[2]]);

    return lines;
  };

  select() {
    return this.selected = !this.selected;
  }

  selectedObjectAt(point) {
    //try points
    for (var i=0; i < this.points_.length; i++) {
      let d1 = distanceSquared(point, this.points_[i]);
      if (d1 < this.pointSelectDistance_**2) {
        // // console.log('point!');
        // // console.log(i);
        // if (this.closed(this)) {
        //   if (i === 0) { //this is a hack double select only works with end point for some reason
        //     i = this.points_.length - 1;
        //   }
        //   if (i === this.points_.length-1) {
        //     return [this.points_[i], this.points_[0]];
        //   } else {
        //     return this.points_[i];
        //   }
        // } else {
        //   return this.points_[i];
        // }
        return this.points_[i];
      }
    }
    //try lines
    for (var i=0; i < this.points_.length-1; i++) {
      let d1 = distanceSquared(point, this.points_[i]);
      let d2 = distanceSquared(point, this.points_[i+1]);
      if (onLine(point, this.points_[i], this.points_[i+1], this.lineSelectDistance_)) {
        return new Line(this.points_[i], this.points_[i+1]);
      }
    }
  }

  shapeContains(point) {
    let polyRawLines = this.toLines();
    let polyLines = polyRawLines.map(line => new Line(line[0],line[1]))
    let contained = polyLines.map(line => line.shapeContains(point));

    return contained.some(entry => entry===true);
  }

  rendersPath() {
    return false;
  }
} //end Rectangle()

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

  toLines() {
    let lines = []
    for (let i = 0; i < this.points_.length -1; i++) {
      lines.push([this.points_[i], this.points_[i+1]]);
    }
    return lines;
  };

  select() {
    return this.selected = !this.selected;
  }

  selectedObjectAt(point) {
    //try points
    for (var i=0; i < this.points_.length; i++) {
      let d1 = distanceSquared(point, this.points_[i]);
      if (d1 < this.pointSelectDistance_**2) {
        return this.points_[i];
      }
    }
    //try lines
    for (var i=0; i < this.points_.length-1; i++) {
      let d1 = distanceSquared(point, this.points_[i]);
      let d2 = distanceSquared(point, this.points_[i+1]);
      if (onLine(point, this.points_[i], this.points_[i+1], this.lineSelectDistance_)) {
        return new Line(this.points_[i], this.points_[i+1]);
      }
    }
  }

  shapeContains(point) {
    let polyRawLines = this.toLines();
    let polyLines = polyRawLines.map(line => new Line(line[0],line[1]))
    let contained = polyLines.map(line => line.shapeContains(point));

    return contained.some(entry => entry===true);
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

    return <svg>
      <path d={pathData} style={style}/>
      {/*this.points().map(p => <circle cx={`${p['x']}`} cy={`${p['y']}`} r="5" fill={'black'}/>)*/}
    </svg>
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

    return <svg>
      <path d={pathData} style={style}/>
      {this.points().map(p => <circle cx={`${p['x']}`} cy={`${p['y']}`} r="5" fill={'black'}/>)}
    </svg>
  }
}

//-------------------------------helper-------------------------------

function onLine(point, p1, p2, buffer) {
  let d1 = distanceSquared(point, p1);
  let d2 = distanceSquared(point, p2);
  return Math.sqrt(d1) + Math.sqrt(d2) < Math.sqrt(distanceSquared(p1, p2)) + buffer
}


//-------------------------------helper functions-------------------------------

function distanceSquared(p1, p2) {
  return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
}

function pointEqual(p1, p2) {
  let foo = p1.x === p2.x && p1.y == p2.y;
  return foo;
}

function cPointToPoint(cpoint) {
  return {'x': cpoint.x.value, 'y': cpoint.y.value};
}



export {Line, Polygon, Bezier, Rectangle, Freehand};
