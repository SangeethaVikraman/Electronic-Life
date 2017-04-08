//  A world will be a two-dimensional grid where each entity
// takes up one full square of the grid. We can define a world
// with a plan, an array of strings that lays out the world’s
// grid using one character per square.The “#” characters in
// this plan represent walls and rocks, and the “o” characters
// represent critters. A plan array can be used to create a world
// object.

var plan = ["############################",
            "#      #    #      o      ##",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"];

// Squares are identified by their x- and y-coordinates.
// Vector is used to represent these coordinate pairs.
function Vector(x,y)
{
	this.x = x;
	this.y = y;
}

Vector.prototype.plus = function(other)
{
	return new Vector(this.x + other.x,this.y + other.y);
};

var grid = ["top left",    "top middle",    "top right",
            "bottom left", "bottom middle", "bottom right"];

// grid[1][2] -- grid[2+(1*3)];

function Grid(width, height) {
  this.space = new Array(width * height);
  this.width = width;
  this.height = height;
}
Grid.prototype.isInside = function(vector) {
  return vector.x >= 0 && vector.x < this.width &&
         vector.y >= 0 && vector.y < this.height;
};
Grid.prototype.get = function(vector) {
  return this.space[vector.x + this.width * vector.y];
};
Grid.prototype.set = function(vector, value) {
  this.space[vector.x + this.width * vector.y] = value;
};


/* Some trivial tests
var grid = new Grid(5, 5);
console.log(grid.get(new Vector(1, 1)));

grid.set(new Vector(1, 1), "X");
console.log(grid.get(new Vector(1, 1)));
*/


var directions = {
  "n":  new Vector( 0, -1),
  "ne": new Vector( 1, -1),
  "e":  new Vector( 1,  0),
  "se": new Vector( 1,  1),
  "s":  new Vector( 0,  1),
  "sw": new Vector(-1,  1),
  "w":  new Vector(-1,  0),
  "nw": new Vector(-1, -1)
};

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

var directionNames = "n ne e se s sw w nw".split(" ");

// Here is a simple, stupid critter that just follows its
// nose until it hits an obstacle and then bounces off in
// a random open direction.
function BouncingCritter() {
  this.direction = randomElement(directionNames);
};

BouncingCritter.prototype.act = function(view) {
  if (view.look(this.direction) != " ")
    this.direction = view.find(" ") || "s";
  return {type: "move", direction: this.direction};
};

function elementFromChar(legend, ch) {
  if (ch == " ")
    return null;
  var element = new legend[ch]();
  element.originChar = ch;
  return element;
}

// The constructor takes a plan (the array of strings
// representing the world’s grid, described earlier)
// and a legend as arguments. A legend is an object that
// tells us what each character in the map means. It
// contains a constructor for every character—except for
// the space character, which always refers to null, the
// value we’ll use to represent empty space.
function World(map, legend) {
  var grid = new Grid(map[0].length, map.length);
  this.grid = grid;
  this.legend = legend;

  map.forEach(function(line, y) {
    for (var x = 0; x < line.length; x++)
      grid.set(new Vector(x, y),
               elementFromChar(legend, line[x]));
  });
}

// This method builds up a maplike string from the world’s
// current state by performing a two-dimensional loop over
// the squares on the grid.
function charFromElement(element) {
  if (element == null)
    return " ";
  else
    return element.originChar;
}

World.prototype.toString = function() {
  var output = "";
  for (var y = 0; y < this.grid.height; y++) {
    for (var x = 0; x < this.grid.width; x++) {
      var element = this.grid.get(new Vector(x, y));
      output += charFromElement(element);
    }
    output += "\n";
  }
  return output;
};

// A wall is a simple object—it is used only for taking up
// space and has no act method.
function Wall() {}

var world = new World(plan, {"#": Wall,
                             "o": BouncingCritter});
//console.log(world.toString());

var test = {
  prop: 10,
  addPropTo: function(array) {
    return array.map(function(elt) {
      return this.prop + elt;
    }.bind(this));
  }
};
//console.log(test.addPropTo([5]));


Grid.prototype.forEach = function(f, context) {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var value = this.space[x + y * this.width];
      if (value != null)
        f.call(context, value, new Vector(x, y));
    }
  }
};

// Turn method for the world object that
// gives the critters a chance to act

World.prototype.turn = function() {
  var acted = [];
  this.grid.forEach(function(critter, vector) {
    if (critter.act && acted.indexOf(critter) == -1) {
      acted.push(critter);
      this.letAct(critter, vector);
    }
  }, this);
};

World.prototype.letAct = function(critter, vector) {
  var action = critter.act(new View(this, vector));
  if (action && action.type == "move") {
    var dest = this.checkDestination(action, vector);
    if (dest && this.grid.get(dest) == null) {
      this.grid.set(vector, null);
      this.grid.set(dest, critter);
    }
  }
};

World.prototype.checkDestination = function(action, vector) {
  if (directions.hasOwnProperty(action.direction)) {
    var dest = vector.plus(directions[action.direction]);
    if (this.grid.isInside(dest))
      return dest;
  }
};

function View(world, vector) {
  this.world = world;
  this.vector = vector;
}
View.prototype.look = function(dir) {
  var target = this.vector.plus(directions[dir]);
  if (this.world.grid.isInside(target))
    return charFromElement(this.world.grid.get(target));
  else
    return "#";
};
View.prototype.findAll = function(ch) {
  var found = [];
  for (var dir in directions)
    if (this.look(dir) == ch)
      found.push(dir);
  return found;
};
View.prototype.find = function(ch) {
  var found = this.findAll(ch);
  if (found.length == 0) return null;
  return randomElement(found);
};


for (var i = 0; i < 5; i++) {
  world.turn();
  console.log(world.toString());
}

// WallFollower is a critter that moves along walls. Conceptually,
// the critter keeps its left hand (paw, tentacle, whatever) to the
// wall and follows along. This turns out to be not entirely trivial
// to implement.
//
// We need to be able to “compute” with compass directions. Since
// directions are modeled by a set of strings, we need to define our
// own operation (dirPlus) to calculate relative directions. So
// dirPlus("n", 1) means one 45-degree turn clockwise from north,
// giving "ne". Similarly, dirPlus("s", -2) means 90 degrees
// counterclockwise from south, which is east.
function dirPlus(dir, n) {
  var index = directionNames.indexOf(dir);
  return directionNames[(index + n + 8) % 8];
}

function WallFollower() {
  this.dir = "s";
}

WallFollower.prototype.act = function(view) {
  var start = this.dir;
  if (view.look(dirPlus(this.dir, -3)) != " ")
    start = this.dir = dirPlus(this.dir, -2);
  while (view.look(this.dir) != " ") {
    this.dir = dirPlus(this.dir, 1);
    if (this.dir == start) break;
  }
  return {type: "move", direction: this.dir};
};

// To make life in our world more interesting, we will add
// the concepts of food and reproduction. Each living thing
// in the world gets a new property, energy, which is reduced
// by performing actions and increased by eating things. When
// the critter has enough energy, it can reproduce, generating
// a new critter of the same kind. To keep things simple, the
// critters in our world reproduce asexually, all by themselves.
//
// If critters only move around and eat one another, the world
// will soon succumb to the law of increasing entropy, run out
// of energy, and become a lifeless wasteland. To prevent this
// from happening (too quickly, at least), we add plants to the
// world. Plants do not move. They just use photosynthesis to
// grow (that is, increase their energy) and reproduce.
//
// To make this work, we’ll need a world with a different letAct
// method. We could just replace the method of the World prototype,
// but I’ve become very attached to our simulation with the
// wall-following critters and would hate to break that old world.
//
// One solution is to use inheritance. We create a new constructor,
// LifelikeWorld, whose prototype is based on the World prototype
// but which overrides the letAct method. The new letAct method
// delegates the work of actually performing an action to various
// functions stored in the actionTypes object.
function LifelikeWorld(map, legend) {
  World.call(this, map, legend);
}
LifelikeWorld.prototype = Object.create(World.prototype);

var actionTypes = Object.create(null);

LifelikeWorld.prototype.letAct = function(critter, vector) {
  var action = critter.act(new View(this, vector));
  var handled = action &&
    action.type in actionTypes &&
    actionTypes[action.type].call(this, critter,
                                  vector, action);
  if (!handled) {
    critter.energy -= 0.2;
    if (critter.energy <= 0)
      this.grid.set(vector, null);
  }
};

// The simplest action a creature can perform is "grow", used by
// plants. When an action object like {type: "grow"} is returned,
// the following handler method will be called.
actionTypes.grow = function(critter) {
  critter.energy += 0.5;
  return true;
};

actionTypes.move = function(critter, vector, action) {
  var dest = this.checkDestination(action, vector);
  if (dest == null ||
      critter.energy <= 1 ||
      this.grid.get(dest) != null)
    return false;
  critter.energy -= 1;
  this.grid.set(vector, null);
  this.grid.set(dest, critter);
  return true;
};


actionTypes.eat = function(critter, vector, action) {
  var dest = this.checkDestination(action, vector);
  var atDest = dest != null && this.grid.get(dest);
  if (!atDest || atDest.energy == null)
    return false;
  critter.energy += atDest.energy;
  this.grid.set(dest, null);
  return true;
};


actionTypes.reproduce = function(critter, vector, action) {
  var baby = elementFromChar(this.legend,
                             critter.originChar);
  var dest = this.checkDestination(action, vector);
  if (dest == null ||
      critter.energy <= 2 * baby.energy ||
      this.grid.get(dest) != null)
    return false;
  critter.energy -= 2 * baby.energy;
  this.grid.set(dest, baby);
  return true;
};

function Plant() {
  this.energy = 3 + Math.random() * 4;
}
Plant.prototype.act = function(view) {
  if (this.energy > 15) {
    var space = view.find(" ");
    if (space)
      return {type: "reproduce", direction: space};
  }
  if (this.energy < 20)
    return {type: "grow"};
};

function PlantEater() {
  this.energy = 20;
}
PlantEater.prototype.act = function(view) {
  var space = view.find(" ");
  if (this.energy > 60 && space)
    return {type: "reproduce", direction: space};
  var plant = view.find("*");
  if (plant)
    return {type: "eat", direction: plant};
  if (space)
    return {type: "move", direction: space};
};

var valley = new LifelikeWorld(
  ["############################",
   "#####                 ######",
   "##   ***                **##",
   "#   *##**         **  O  *##",
   "#    ***     O    ##**    *#",
   "#       O         ##***    #",
   "#                 ##**     #",
   "#   O       #*             #",
   "#*          #**       O    #",
   "#***        ##**    O    **#",
   "##****     ###***       *###",
   "############################"],
  {"#": Wall,
   "O": PlantEater,
   "*": Plant}
);

// Most of the time, the plants multiply and expand quite
// quickly, but then the abundance of food causes a population
// explosion of the herbivores, who proceed to wipe out all or
// nearly all of the plants, resulting in a mass starvation of
// the critters. Sometimes, the ecosystem recovers and another
// cycle starts. At other times, one of the species dies out
// completely. If it’s the herbivores, the whole space will fill
// with plants. If it’s the plants, the remaining critters starve,
// and the valley becomes a desolate wasteland. Ah, the cruelty
// of nature.
