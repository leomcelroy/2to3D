//look at maker.js?

function Line(p1, p2) {
  if (!p2) {
    p2 = p1;
  }
  let line = {
    p1_: p1,
    p2_: p2,
  };
  line.p1 = function(p) { if (p){ this.p1_ = p; return this;} return this.p1_};
  line.p2 = function(p) { if (p){ this.p2_ = p; return this;} return this.p2_};
  line.toLine = function() { return [this.p1_, this.p2_] };
  line.toLines = function() { return [[this.p1_, this.p2_]] };
  //TODO: ADD OTHER METHODS
  return line;
}

function Polygon(point) {
  let polygon = {
    lines_: [],
    lockDistance_ : 10,
  }

  if (point) {
    polygon.lines_.push(Line(point));
  }

  polygon.lockDistance = function(d) { if(d){ this.lockDistance_ = d; return this} return this.lockDistance_};
  polygon.addLine = function(line) {this.lines_.push(line); return this};
  polygon.toLines = function() {
    return this.lines_.map( (line) => {return line.toLine();} );
  };
  polygon.withinLock = function(p) { return distanceSquared(this.lines_[0].p1(), p) < this.lockDistance_**2 };
  polygon.lastPoint = function(p) {  //if arg is specified, sets the last point of the polygon and returns this
    if (!p) {
      return this.lines_[this.lines_.length -1].p2();
    }

    if (this.withinLock(p)) {
      p = {'x': this.lines_[0].p1().x, 'y': this.lines_[0].p1().y}; //create a new point so we don't get double referencing
    }
    this.lines_[this.lines_.length -1].p2(p);
    return this;
  }
  polygon.closed = function() {console.log(this.lines_); return pointEqual(this.lines_[0].p1(), this.lastPoint()) };
  return polygon;
}

function distanceSquared(p1, p2) {
  return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
}

function pointEqual(p1, p2) {
  let foo = p1.x === p2.x && p1.y == p2.y;
  console.log("point equal", foo);
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


export {Line, Polygon};
