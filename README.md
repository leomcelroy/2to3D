## 2to3D: a user friendly parametric CAD program for Laser Cutting
### Leo McElroy and Ben Brown
### CS701 Project Proposal

### Abstract

We created a user-friendly computer-aided design (CAD) program for laser cutting which integrates the desired fea- tures of vector drawing software and 3D parametric CAD programs. We implemented basic drawing, editing, and transformation tools. The program is capable of outputting SVGs (the Scalable Vector Graphics image format). Ge- ometric constraints are solved using Cassowary.js - an im- plementation of the Simplex Algorithm. Linear constraints (coincidence, fixing of points, vertical, and horizontal) are efficient and robust. Nonlinear constraints (distance, line angles, parallel, and perpendicular) are not naturally ac- commodate by the Simplex Algorithm and required clever workarounds to function, consequently they are less robust. The program is accessible by virtue of being open-source and a web application which can run in any modern web-browser. We were successful in creating an accessible and functional parametric design program which simplifies the laser cutting workflow, however the project requires improvement before we foresee widespread adoption by laser cutting hobbyists. Future development of the project would include building out drawing features, adding circle and arc shape primitives, raster image import, utilizing a geometric constraint solver that accommodates nonlinear equations (such as gradient descent), and improving state handling of the program to support undo/redo tools.

### Full report

The full report can be found in this git repo: https://github.com/leomcelroy/2to3D/blob/master/report.pdf
