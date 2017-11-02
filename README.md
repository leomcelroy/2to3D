## 2to3D: a user friendly parametric CAD program for Laser Cutting
### Leo McElroy and Ben Brown
### CS701 Project Proposal

### Problem Statement

There is no CAD program conscious of laser cutting requirements. We will create a 2D parametric CAD program that streamlines the laser cutter workflow, and runs in the browser.

### Deliverables

Prototype: A browser compatible basic vector drawing program capable of outputting SVG files.

Final: A single-page web application for vector drawing with the parametric constraint capabilities of an ordinary 3D-CAD program (such as Onshape).

### Background
Our aim is to fill the void in computer aided design (CAD) \cite{paper} program tools by creating an easy to use, browser-based, and capable two-dimensional design program intended for use with laser cutters. Computer aided design is an essential component of digital fabrication workflows, and laser cutters are among the most prevalent digital fabrication tools. Considering this prevalence, it is surprising that a design program for intended use with laser cutters does not exist. Currently, a typical design process for producing laser cutter schematics involves transferring plans between two or three programs: one for proper mechanical measurements, one for exporting SVGs, and one for interfacing with the laser cutter itself. Most people use programs originally intended for creating visual designs, this introduces unnecessary features and cognitive load to the user. These programs do not differentiate between components intended for cutting and components intended for engraving. Additionally, they lack parametric capabilities which are useful for creating physical objects. Parametric means the ability to define dimensional constraints. Almost all parametric programs are three-dimensional CAD programs, which means they are designed to produce 3D meshes rather than 2D SVGs. This is the same issue of "wrong tool for the job" as described above for visual design programs. Our goal is to create a simple 2D-CAD program with basic vector drawing capabilities and the ability to define parametric constraints, essentially our take on a laser cutting program which strikes the balance between ease of use (through minimal features) and powerful capabilities (through constraint solvers).

### Precedents
+ Easel from Inventables: Easel is a web-based CAD program for CNC (computer numerical control) milling. It is non-parametric and integrated with CAM (computer aided manufacturing), this means it is capable of outputting G-Code.
+ Vectr: Vectr is a simple vector drawing program capable of running in the browser. The drawing features are very similar to what we plan to implement.
+ Onshape: Onshape is a commercial 3D parametric CAD program which is also web-based and integrated with CAM.

### Development Stages and Alternatives
+ A browser based basic vector graphics drawing program capable of outputting SVGs. The program would also be able to import or paste pictures for engraving. This would be a viable prototype.
+ Add constraints to drawing program. Geometric constraints include dimensions for angles and lengths, perpendicular, parallel, coincident, concentric, horizontal, vertical, equal, midpoint, and symmetric.
+ Add drivers for laser cutters.
+ Create cloud file storage system.

Once we achieve step one, the scale of the project can be calibrated by varying the number of geometric constraints in the parametric functionality or by approaching steps three and four.

### Proposed Methods
We will use the React JavaScript framework (which is technically a library) to manipulate a HTML Canvas element for vector drawing. React is ideal for this sort of responsive dynamic web-based program, because responsive dynamic programs is what React was designed to make. React is also what was used to create Easel. Styling and organization will be done with HTML/CSS in the React form of JSX. To do parametric drawing, we will use Paper.js to modify drawing objects and calculate constraints each time a frame is drawn. Paper.js is an open source vector graphics scripting framework that runs on top of HTML5 Canvas.
Further investigation is needed to connect the web application to laser cutter drivers and cloud file storage.

