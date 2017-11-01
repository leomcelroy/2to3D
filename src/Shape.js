//look at maker.js?

function Line(p1, p2) {
  if (!p2) {
    p2 = p1;
  }
  let line = {
    shape_ : 'line',
    p1_: p1,
    p2_: p2,
    pointSelectDistance_ : 15, //todo: setter / getter
    lineSelectDistance_ : 14,
    length_: 0
  };
  line.p1 = function(p) { if (p){ this.p1_ = p; this.updateLength(); return this;} return this.p1_};
  line.p2 = function(p) { if (p){ this.p2_ = p; this.updateLength(); return this;} return this.p2_};
  line.toLine = function() { return [this.p1_, this.p2_] };
  line.toLines = function() { return [[this.p1_, this.p2_]] };
  line.selectedObjectAt = function(point) {
    if (distanceSquared(point, this.p1_) < this.pointSelectDistance_**2) { return this.p1_; }
    if (distanceSquared(point, this.p2_) < this.pointSelectDistance_**2) { return this.p2_; }
    if (onLine(point, this.p1_, this.p2_, this.pointSelectDistance_)) { return this; }
  }
  line.updateLength = function() { this.length_ = Math.sqrt(distanceSquared(this.p1_, this.p2_)); }
  line.length = function(len) {
    //TODO: update length when given
    return this.length_;
  }
  line.angle = function(a) {
    if (a === undefined) {
      return Math.atan2(this.p2_.y - this.p1_.y, this.p2_.x - this.p1_.x);
    }
    this.p2_.y = this.p1_.y + Math.sin(a) * this.length();
    this.p2_.x = this.p1_.x + Math.cos(a) * this.length();
  }
  return line;
}

function Polygon(point) {
  let polygon = {
    shape_ : 'polygon',
    points_ : [],
    lockDistance_ : 10,
    pointSelectDistance_ : 15, //todo: setter / getter
    lineSelectDistance_ : 14,
  }

  if (point) {
    polygon.points_.push(point);
    polygon.points_.push(point);
  }

  polygon.lockDistance = function(d) { if(d){ this.lockDistance_ = d; return this} return this.lockDistance_};

  //polygon.addLine = function(line) {this.lines_.push(line); return this};
  polygon.addPoint = function(point) {this.points_.push(point); return this;}
  polygon.toLines = function() {
    let lines = []
    for (let i = 0; i < this.points_.length -1; i++) {
      lines.push([this.points_[i], this.points_[i+1]]);
    }
    return lines;
  };

  polygon.withinLock = function(p) { return distanceSquared(this.points_[0], p) < this.lockDistance_**2 };

  polygon.lastPoint = function(p) {  //if arg is specified, sets the last point of the polygon and returns this
    if (!p) {
      return this.points_[this.points_.length -1];
    }

    if (this.withinLock(p)) {
      p = {'x': this.points_[0].x, 'y': this.points_[0].y}; //create a new point so we don't get double referencing
    }
    this.points_[this.points_.length -1] = p;
    return this;
  }
  polygon.closed = function() {return pointEqual(this.points_[0], this.lastPoint()) };

  polygon.selectedObjectAt = function(point) {
    //try points
    for (var i=0; i < this.points_.length; i++) {
      let d1 = distanceSquared(point, this.points_[i]);
      if (d1 < this.pointSelectDistance_**2) { console.log('point!')
        return this.points_[i];
      }
    }
    //try lines
    for (var i=0; i < this.points_.length-1; i++) {
      let d1 = distanceSquared(point, this.points_[i]);
      let d2 = distanceSquared(point, this.points_[i+1]);
      if (onLine(point, this.points_[i], this.points_[i+1], this.lineSelectDistance_)) {
        return Line(this.points_[i], this.points_[i+1]);
      }
    }
  }

  return polygon;
} //end Polygon()

function onLine(point, p1, p2, buffer) {
  let d1 = distanceSquared(point, p1);
  let d2 = distanceSquared(point, p2);
  return Math.sqrt(d1) + Math.sqrt(d2) < Math.sqrt(distanceSquared(p1, p2)) + buffer
}

function ParallelLineConstraint(line1, line2) {
  let constraint = {
    line1,
    line2,
  }
  constraint.satisfy = function() {
    if (this.line1.angle() == this.line2.angle()) {
      return false;
    }
    this.line2.angle(this.line1.angle());
    return true;
  }

  return constraint
}

function LineAngleConstraint(line, angle) { //a quick example?

}

function distanceSquared(p1, p2) {
  return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
}

function pointEqual(p1, p2) {
  let foo = p1.x === p2.x && p1.y == p2.y;
  return foo;
}

// function makeShape(type) {
//
// }
//
// function Line(foo) {
//   let obj = {
//     p1: foo,
//     p2: foo,
//     pred: undefined,
//     succ: undefined,
//   }
//     obj.moveEnd = (newPoint) => {this.p2 = newPoint;};
//     //TODO: CACHE RESULT OF RENDER
//     obj.angle = () => {Math.atan2(this.p1.y - this.p2.y, this.p1.x - this.p2.x);}; //how to make these parametric?
//     obj.length = () => {Math.sqrt((this.p1.y - this.p2.y)**2 + (this.p1.x - this.p2.x)**2);}; //probably with different functions
//     obj.render = () => {console.log(this); [{'x': obj.p1.x, 'y': obj.p1.y}, {'x': obj.p2.x, 'y': obj.p2.y}]; };
//
//     return obj;
// }
//
// // function PolyLine() {
// //   return {
// //     lines: [],
// //     addLine: (line) => {
// //       try {
// //         lines[lines.length - 1].succ = line;
// //         line.pred = lines[lines.length - 1];
// //       }
// //       catch (e) {}
// //       lines.push(line);
// //     },
// //   }
// // }


export {Line, Polygon, ParallelLineConstraint};
