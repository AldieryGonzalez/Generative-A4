/* globals Vector2D, Particle, ParticleSystem, p */

/*
 * Wind-driven particles that respond to different kinds of wander forces
 * Which looks the most like "leaves"?
 */

class WindSystem extends ParticleSystem {
  static label = "🍂"; // Ignore the Glitch parse error
  
  constructor() {
    // Make wind particles
    super(WindParticle, 30);
    this.windScale = 0.001;
  }
  
  draw(p) {
    
    p.background(0, 0, 50)
    
    // The "super-class" draws the particles
    super.draw(p)
  }

  getWindAt(x, y) {
    let windTheta = 10 * p.noise(x * this.windScale, y * this.windScale);
    let windSpeed = 1;
    return Vector2D.polar(windSpeed, windTheta);
  }
}

//=========================================================================
//=========================================================================
//=========================================================================


class WindParticle extends Particle {
  constructor(ps, index) {
    super(ps, index);
    
    
    this.angle = Math.random()*200
    this.hue = Math.random()*60

    // Put these particles somewhere randomly on screen
    this.pos.setToRandom(0, p.width, 0, p.height); // Set to a random (x0,x1,y0,y1)
    this.v.setTo(0, 100);

    // Store a wind force so we can visualize it
    this.windForce = new Vector2D();
  }

  calculateForces(p, dt) {
    let t = p.millis() * 0.001;

    // Apply some "drag" by making the velocity smaller
    this.v.mult(0.99);

    this.f.add(0, 40);

    //     Different "wander forces"

    let windX = this.ps.windScale * this.pos[0];
    let windY = this.ps.windScale * this.pos[1];

    // Which way to go?
    // Set the wind from just the time (note how they synchronize)
    let windDir = 20 * p.noise(t * 0.1);

    // These use both their *idNumber* (each particle gets a unique number on "birth")
    // and the time.  Now they each have their own "journey"
    // windDir = 20 * p.noise(t * 0.1, this.idNumber);

    // Set the wind from their positions
    // But if they have the same position, eventually
    // they clump up
    // windDir = 20*p.noise(windX, windY)

    // If we do *both*, they clump less!
    windDir = 20*p.noise(windX, windY, t*.1)
    
    // Spin with the wind!
    this.angle += Math.sin(windDir)*.1

    this.windForce.setToPolar(100, windDir);
    this.f.add(this.windForce);
  }

  move(p, dt) {
    // Call the original move function
    super.move(p, dt);

    this.pos.wrapX(0, p.width);
    this.pos.wrapY(0, p.height);
    
  }

  draw(p, drawDebug = false) {
    let t = p.millis() * 0.001;
  
    // Basic drawing
    p.noStroke()
    p.fill(100);
    p.circle(...this.pos, 2);

    // FANCY DRAWING!
    // Move to where this particle is
    p.push();
    p.translate(...this.pos);
    
    // Align with the current
    p.rotate(this.v.angle + this.angle);
    p.fill(
      this.hue,
      50 + 50 * p.noise(this.idNumber + t + 50),
      30 + 30 * p.noise(this.idNumber + t + 100)
    );

    // Make a leaf shape
    // If we make the width thin and thick, 
    // the leaves look like they are spinning
    // Change the multiplier on t to see them twirl *faster*
    
    p.scale(1, .5 + .1*Math.sin(this.idNumber + t*5) + .1)
    p.circle(0, 0, 10)

    if (drawDebug) {
      this.pos.drawArrow(p, this.windForce, { m: 0.2 });
    }
  }
}
