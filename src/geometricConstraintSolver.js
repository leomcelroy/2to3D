//helper functions
function distance(point1, point2) {
  let x = (point1.x-point2.x);
  let y = (point1.y-point2.y);

  return Math.sqrt(x**2 + y**2)
}

function angle(line1, line2) {
  let line1X1 = line1.p1_.x;
  let line1Y1 = line1.p1_.y;
  let line1X2 = line1.p2_.x;
  let line1Y2 = line1.p2_.y;
  let line2X1 = line2.p1_.x;
  let line2Y1 = line2.p1_.y;
  let line2X2 = line2.p2_.x;
  let line2Y2 = line2.p2_.y;

  console.log("line1X1", line1X1);

  let line1Slope = (line1Y2 - line1Y1) / (line1X2 - line1X1);
  let line2Slope = (line2Y2 - line2Y1) / (line2X2 - line2X1);

  console.log("line1Slope", line1Slope);
  console.log("line2Slope", line2Slope);

  let line1Inc = Math.atan(line1Slope);
  let line2Inc = Math.atan(line2Slope);

  console.log("line1Inc", line1Inc);
  console.log("line2Inc", line2Inc);

  let angle = Math.atan((line1Slope - line2Slope)/(1 + line1Slope*line2Slope));


  //return line1Inc - line2Inc;
  return angle;
}

function CoincidentConstraint(point1, point2) {
  return point1.x === point2.x && point1.y === point2.y
}

// class DistanceConstraint(point1, point2, distance) {
//
// }
//
// class ParallelConstraint(line1, line2) {
//
// }
//
// class VerticalConstraint(line) {
//
// }
//
// class HorizontalConstraint(line) {
//
// }
//
// class PerpendicularConstraint(line1, line2) {
//
// }
//
// class AngleConstraint(line1, line2) {
//
// }

export {CoincidentConstraint, angle};
