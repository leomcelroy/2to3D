import React from 'react';
var c = require('cassowary');

class AbstractLine {  //abstract super class for Lines and Beziers
  constructor(startingPoint, solver) {
    this.shape_ = 'line';
    this.p1_ = new c.Point(startingPoint.x, startingPoint.y);
    this.p2_ = new c.Point(startingPoint.x, startingPoint.y);
    this.pointSelectDistance_ = 5; //todo: setter / getter
    this.lineSelectDistance_ = .06; //0.04;
    this.selected = false;
    this.p1_selected = false;
    this.p2_selected = false;

    solver.addPointStays([this.p1_, this.p2_]);
  }

  drawToPoint(point, solver) { //called when we want to be drawing this line to a certain point
    solver
      .suggestValue(this.p2_.x, point.x)
      .suggestValue(this.p2_.y, point.y)
      .resolve();
  }

  addEditVars(solver) {  //adds the endpoints to the solver
    solver
      .addEditVar(this.p2_.x)
      .addEditVar(this.p2_.y)

      let constraint1 = new c.StayConstraint(this.p1_.x, c.Strength.medium);
      let constraint2 = new c.StayConstraint(this.p1_.y, c.Strength.medium);
      let constraint3 = new c.StayConstraint(this.p2_.x, c.Strength.medium);
      let constraint4 = new c.StayConstraint(this.p2_.y, c.Strength.medium);

      solver.addConstraint(constraint1).addConstraint(constraint2).addConstraint(constraint3).addConstraint(constraint4);
  }

  deselect() {
    this.selected = this.p1_selected = this.p2_selected = false;
  }

  pointsToCPoints(points, solver) { //takes list of points, converts them to cpoints and sets as endpoints
    this.p1_ = new c.Point(points[0].x, points[0].y);
    this.p2_ = new c.Point(points[1].x, points[1].y);

    solver.addPointStays([this.p1_, this.p2_]);
  }

  toLine() { return [cPointToPoint(this.p1_), cPointToPoint(this.p2_)] };

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

  select(booleanValue) {
    return this.selected = (booleanValue === undefined) ? !this.selected : booleanValue;
  }

  selectedAtAll(lengths, alwaysLengths) {
    return ((this.selected || this.p1_selected || this.p2_selected) && lengths || alwaysLengths);
  }

  svgRender(index, lengths = true, alwaysLengths = false) { //render function
      let points = this.points();
      let circleColors = this.getCircleColors();
      for (var i = 0; i < points.length; i++) {
        points[i].color = circleColors[i];
      }
      let lineColor = this.selected ? "blue" : "black";

      let style = {
        fill: "none",
        strokeWidth: "3px",
        stroke: lineColor,
        strokeLinejoin: "round",
        strokeLinecap: "round",
      }

      const pathData = this.getPathData();

      let selectedAtAll = this.selectedAtAll(lengths, alwaysLengths);

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
          {points.map(p => <circle cx={`${p['x']}`} cy={`${p['y']}`} r="5" fill={p.color}/>)}
        </g>
      )
  }


}


class Line extends AbstractLine {
  constructor(startingPoint, solver) {
    super(startingPoint, solver);

  }

  p1(p) { if (p){ this.p1_ = p; return this;} return this.p1_};

  p2(p) { if (p){ this.p2_ = p; return this;} return this.p2_};

  points() {
    return [this.p1_, this.p2_].map(cPoint => {
      return {x: cPoint.x.value, y: cPoint.y.value};
    });
  }

  getCircleColors() {
    return [this.p1_selected, this.p2_selected].map(selected => selected ? "blue" : "black");
  }

  toLines() { return [this.toLine()] };

  length() {
    let p1 = this.toLine()[0];
    let p2 = this.toLine()[1];

    let length = distanceSquared(p1, p2)**(1/2);

    return length;
  }

  selectedObjectAt(point) {  //this function is called when the user clicks at `point`
    //it will change whether an endpoint or the entire line is selected,
    //as well as return a callback that should be called on mouseup
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

  getPathData() {
    return "M " + this.toLine().map(p => `${p['x']} ${p['y']}`);
  }

  shapeContains(point) {
    return onLine(point, cPointToPoint(this.p1_), cPointToPoint(this.p2_), this.lineSelectDistance_);
  }

}

class Bezier extends AbstractLine {
  constructor(point, solver) {
    super(point, solver);
    this.shape_ = 'bezier';
    this.c1_ = new c.Point(point.x, point.y);
    this.c2_ = new c.Point(point.x, point.y);
    this.c1_selected = false;
    this.c2_selected = false;
    solver.addPointStays([this.c1_, this.c2_]);
  }

  points() {
    return [this.p1_, this.c1_, this.c2_, this.p2_].map(cPoint => {
      return {x: cPoint.x.value, y: cPoint.y.value};
    });
  }

  toLine() { return [cPointToPoint(this.p1_), cPointToPoint(this.p2_), cPointToPoint(this.c1_), cPointToPoint(this.c2_)] };

  toLineNoControlPoints() { return [cPointToPoint(this.p1_), cPointToPoint(this.p2_)] }; //for drawing selection line

  pointsToCPoints(points, solver) {
    this.p1_ = new c.Point(points[0].x, points[0].y);
    this.p2_ = new c.Point(points[1].x, points[1].y);
    this.c1_ = new c.Point(points[2].x, points[2].y);
    this.c2_ = new c.Point(points[3].x, points[3].y);

    solver.addPointStays([this.p1_, this.p2_, this.c1_, this.c2_]);
  }

  getCircleColors() {
    return [this.p1_selected, this.c1_selected, this.c2_selected, this.p2_selected]
      .map(selected => selected ? "blue" : "black");
  }

  getPathData() {
    return "M " + this.points()[0]['x'] + " " + this.points()[0]['y'] +
                     " C " + this.points().slice(1).map(p => `${p['x']} ${p['y']}`) //+ " S 300 300 400 400 100 400 100 300";
  }

  drawToPoint(point, solver) {
    let diff = {'x': point.x - this.p1_.x.value, 'y': point.y - this.p1_.y.value};
    let c1 = {'x': this.p1_.x.value + (1.0/3) * diff.x,  'y': this.p1_.y + (1.0/3) * diff.y};
    let c2 = {'x': this.p1_.x.value + (2.0/3) * diff.x,  'y': this.p1_.y + (2.0/3) * diff.y};

    solver
      .suggestValue(this.p2_.x, point.x)
      .suggestValue(this.p2_.y, point.y)
      .suggestValue(this.c1_.x, this.p1_.x.value + (1.0/3) * diff.x)
      .suggestValue(this.c1_.y, this.p1_.y.value + (1.0/3) * diff.y)
      .suggestValue(this.c2_.x, this.p1_.x.value + (2.0/3) * diff.x)
      .suggestValue(this.c2_.y, this.p1_.y.value + (2.0/3) * diff.y)
      .resolve();
  }

  addEditVars(solver) {
    super.addEditVars(solver);
    solver
      .addEditVar(this.c1_.x)
      .addEditVar(this.c1_.y)
      .addEditVar(this.c2_.x)
      .addEditVar(this.c2_.y);
  }

  deselect() {
    super.deselect();
    this.c1_selected = this.c2_selected = false;
  }

  selectedPoints() {
    let points = super.selectedPoints();
    if (this.c1_selected) {
      points.push(this.c1_);
    }
    if (this.c2_selected) {
      points.push(this.c2_);
    }
    return points;
  }

  selectedAtAll() {
    return false;
  }

  selectedObjectAt(point) {//this function is called when the user clicks at `point`
    //it will change whether an endpoint or the entire line is selected,
    //as well as return a callback that should be called on mouseup
    if (distanceSquared(point, cPointToPoint(this.p1_)) < this.pointSelectDistance_**2) {
      if (this.p1_selected) {
        //return a callbcak to be called on mouseup (if mouse was not dragged)
        return () => {this.p1_selected = false};
      } else {
        this.p1_selected = true;
        return () => {/*do nothing*/};
      }
    } else if (distanceSquared(point, cPointToPoint(this.c1_)) < this.pointSelectDistance_**2) {
      if (this.c1_selected) {
        return () => {this.c1_selected = false};
      } else {
        this.c1_selected = true;
        return () => {/*do nothing*/};
      }
    } else if (distanceSquared(point, cPointToPoint(this.c2_)) < this.pointSelectDistance_**2) {
      if (this.c2_selected) {
        return () => {this.c2_selected = false};
      } else {
        this.c2_selected = true;
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

  shapeContains(point) {
    return onLine(point, this.start_, this.end_, this.lineSelectDistance_);
  }

  getLinePathData() {
    return "M " + this.toLineNoControlPoints().map(p => `${p['x']} ${p['y']}`);
  }

  svgRender(index, lengths = true, alwaysLengths = false) { //render function
      let points = this.points();
      let circleColors = this.getCircleColors();
      for (var i = 0; i < points.length; i++) {
        points[i].color = circleColors[i];
      }
      let lineColor = this.selected ? "blue" : "black";

      let style = {
        fill: "none",
        strokeWidth: "3px",
        stroke: lineColor,
        strokeLinejoin: "round",
        strokeLinecap: "round",
      }

      let selectLineStyle = {
        fill: "none",
        strokeWidth: "3px",
        stroke: "grey",
        strokeLinejoin: "round",
        strokeLinecap: "round",
        strokeDasharray:"5, 5"
      }

      const pathData = this.getPathData();

      const selectLineData = this.getLinePathData();

      let selectedAtAll = this.selectedAtAll(lengths, alwaysLengths);

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
          <path d={selectLineData} style={selectLineStyle} id={`selectLine${index}`}/>
          <path d={pathData} style={style} id={`${index}`}/>
          {(selectedAtAll) ? <text dy={"-8"}><textPath href={`#${index}`} startOffset={"43%"} style={textStyle}>{Math.round(this.length()*1000)/1000}</textPath></text> : null}
          {points.map(p => <circle cx={`${p['x']}`} cy={`${p['y']}`} r="5" fill={p.color}/>)}
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

  getPathData() {
    return "M " + this.points().map(p => `${p['x']} ${p['y']}`);
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

    let pathData = this.getPathData();

    return <g>
      <path d={pathData} style={style}/>
      {/*this.points().map(p => <circle cx={`${p['x']}`} cy={`${p['y']}`} r="5" fill={'black'}/>)*/}
    </g>
  }
} //end Freehand()

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
  return {'x': cpoint.x.value, 'y': cpoint.y.value};
}

export {Line, Bezier, Freehand};
