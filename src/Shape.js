//look at maker.js?

class Line {
  constructor(p1, p2) {
    if (!p2) {
      p2 = p1;
    }

    this.shape_ = 'line';
    this.p1_ = p1; //lets make this into list of points to have same form as polygon
    this.p2_ = p2;
    this.pointSelectDistance_ = 15; //todo: setter / getter
    this.lineSelectDistance_ = 14;
    this.objectSelectDistance_ = 5;
    this.length_ = Math.sqrt(distanceSquared(this.p1_, this.p2_));
    this.selected = false;
    //this.points_ = [p1, p2];
  }

  points(points) {
    if (points === undefined) {
      return [this.p1_, this.p2_];
    }
    this.p1_ = points[0];
    this.p2_ = points[1];
  }

  p1(p) { if (p){ this.p1_ = p; this.updateLength(); return this;} return this.p1_};

  p2(p) { if (p){ this.p2_ = p; this.updateLength(); return this;} return this.p2_};

  toLine() { return [this.p1_, this.p2_] };

  toLines() { return [[this.p1_, this.p2_]] };

  selectedObjectAt(point) {
    if (distanceSquared(point, this.p1_) < this.pointSelectDistance_**2) { return this.p1_; }
    if (distanceSquared(point, this.p2_) < this.pointSelectDistance_**2) { return this.p2_; }
    if (onLine(point, this.p1_, this.p2_, this.pointSelectDistance_)) { return this; }
  }

  updateLength() { this.length_ = Math.sqrt(distanceSquared(this.p1_, this.p2_)); }

  length(len) {
    //TODO: update length when given
    return this.length_;
  }

  select(booleanValue) {
    return this.selected = (!booleanValue) ? !this.selected : booleanValue;
  }

  angle(a) {
    //console.log(this.length);
    if (a === undefined) {
      return Math.atan2(this.p2_.y - this.p1_.y, this.p2_.x - this.p1_.x);
    }
    this.p2_.y = this.p1_.y + Math.sin(a) * this.length();
    this.p2_.x = this.p1_.x + Math.cos(a) * this.length();
  }

  shapeContains(point) {
    return onLine(point, this.p1_, this.p2_, this.objectSelectDistance_);
  }

  rendersPath() {
    return false;
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
      if (d1 < this.pointSelectDistance_**2) {
        // console.log('point!');
        // console.log(i);
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

class Rectangle {
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
        // console.log('point!');
        // console.log(i);
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
      this.points_.push(p);
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
        // console.log('point!');
        // console.log(i);
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
}

class Point {
  constructor(point) {
    this.shape_ = 'point';
    this.points_ = [];
    this.x = point ? point.x : undefined;
    this.y = point ? point.y : undefined;
    this.pointSelectDistance_ = 5; //todo: setter / getter
    this.selected = false;

    if (point) {
      this.points_.push(point);
    }

  }

  closed() {return true};

  select() {
    return this.selected = !this.selected;
  }

  rendersPath() {
    return false;
  }
}

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
}

function onLine(point, p1, p2, buffer) {
  let d1 = distanceSquared(point, p1);
  let d2 = distanceSquared(point, p2);
  return Math.sqrt(d1) + Math.sqrt(d2) < Math.sqrt(distanceSquared(p1, p2)) + buffer
}

//-------------------------------constraints-------------------------------

// function ParallelLineConstraint(line1, line2) {
//   let constraint = {
//     line1,
//     line2,
//   }
//   constraint.satisfy = function() {
//     if (this.line1.angle() === this.line2.angle()) {
//       return false;
//     }
//     this.line2.angle(this.line1.angle());
//     return true;
//   }
//
//   return constraint
// }
//
// function HorizontalLineConstraint(line1) {
//   let constraint = {
//     line1,
//   }
//   constraint.satisfy = function() {
//     if (this.line1.angle() === 0) {
//       return false;
//     }
//     this.line1.angle(0);
//     return true;
//   }
//
//   return constraint
// }
//
// function LineAngleConstraint(line, angle) { //a quick example?
//
// }

//-------------------------------helper functions-------------------------------

function distanceSquared(p1, p2) {
  return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
}

function pointEqual(p1, p2) {
  let foo = p1.x === p2.x && p1.y == p2.y;
  return foo;
}



export {Line, Polygon, Bezier, Rectangle, Freehand, Point};
