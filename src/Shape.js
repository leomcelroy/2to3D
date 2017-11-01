//look at maker.js?

function Line(p1, p2) {
  let line = {
    p1_: p1,
    p2_: p2,
  };
  line.p1 = (p) => { if (p){ line.p1_ = p;} return line};
  line.p2 = (p) => { if (p){ line.p2_ = p;} return line};
  line.toSVG = () => { return [line.p1_, line.p2_]; };
  //TODO: ADD OTHER METHODS
  return line;
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


export {Line};
