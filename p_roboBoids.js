/* globals Vector2D, Particle, ParticleSystem, p */

/*
 * Basic particles with an attraction force
 */

class RoboSystem extends ParticleSystem {
	static label = "🤖"; // Ignore the Glitch parse error
	static desc = "Robos animation"; // Ignore the Glitch parse error

	constructor() {
		// Make what particle, and how many?
		// Try different numbers of particles
		super(RoboParticle, 60);

		this.flockCenter = new Vector2D();
		this.flockVelocity = new Vector2D();
	}

	beforeMove(p, dt) {
		// Calculate the flock's center and average direction
		// Reset both
		this.flockCenter.mult(0);
		this.flockVelocity.mult(0);

		// Add up the velocity and position
		this.particles.forEach((pt) => {
			this.flockCenter.add(pt.pos);
			this.flockVelocity.add(pt.v);
		});
		// Divide by the number of boids to get the
		// overall flock data
		this.flockVelocity.div(this.particles.length);
		this.flockCenter.div(this.particles.length);
	}

	draw(p) {
		p.background(0, 0, 0, 1);

		// The "super-class" draws the particles
		super.draw(p);
	}
}

//=========================================================================
//=========================================================================
//=========================================================================

class RoboParticle extends Particle {
	constructor(ps, index) {
		// ps: the particle system this particle belongs to
		// index: of all the particles in that system, this one's index
		super(ps, index);

		this.draggable = true;

		this.pos.setToRandom(0, p.width, 0, p.height);
		this.radius = 10;
		this.angle = Math.random() * 100;
		this.v.setToPolar(10, this.angle);

		this.cohesionForce = new Vector2D();
		this.alignmentForce = new Vector2D();
		this.separationForce = new Vector2D();

		// A few forces to keep the boid interesting
		this.propulsionForce = new Vector2D();
		this.attractionForce = new Vector2D();
	}

	calculateForces(p, dt) {
		let t = p.millis() * 0.001; // Get the time

		// My angle is whichever way I'm going
		this.angle = this.v.angle;

		// Add a border force
		let center = new Vector2D(p.width / 2, p.height / 2);
		this.f.add(
			this.pos.getForceTowardsPoint(center, 10, {
				startRadius: 140,
				falloff: 1.2,
			})
		);

		// Add boids force

		// Cohesion
		// Move toward center
		// this.cohesionForce = this.pos.getForceTowardsPoint(this.ps.flockCenter, 1, {falloff: 1.2})

		// Separation
		// Push away from all other boids
		this.separationForce.mult(1);
		this.ps.particles.forEach((pt) => {
			// Ignore any force on myself
			if (pt !== this) {
				// Get the current distance and (normalized)
				// offset vector to this particle
				let d = this.pos.getDistanceTo(pt.pos);
				let offset = Vector2D.sub(this.pos, pt.pos).div(d);
				let range = 100;
				if (d < range) {
					this.separationForce.addMultiple(offset, range - d);
				}
			}
		});
		let distToXWall = this.pos - p.width;
		if (distToXWall <= 20 || distToXWall >= p.width - 20) {
			let center = new Vector2D(p.height / 2, p.width / 2);
			this.attractionForce = this.pos.getForceTowardsPoint(center, 1, {
				falloff: 1.2,
			});
		}

		// Alignment
		this.alignmentForce = Vector2D.sub(this.ps.flockVelocity, this.v);

		// A force to keep everyone moving forward
		let flyingStrength = p.noise(this.idNumber);
		let turn = p.noise(this.idNumber, t) - 0.5;
		this.propulsionForce.setToPolar(
			100 + 120 * flyingStrength,
			this.angle * p.noise(1) + turn
		);

		// Chase the mouse?
		// let mouse = new Vector2D(p.mouseX, p.mouseY)
		// this.attractionForce = this.pos.getForceTowardsPoint(mouse, 1, {falloff: 1.2})

		// Apply "drag"
		this.v.mult(0.97);
		this.v.constrainMagnitude(10, 300);

		// Try different tunings
		this.separationForce.mult(0.8);
		this.cohesionForce.mult(0);
		this.alignmentForce.mult(0.6);

		this.f.add(this.separationForce);
		this.f.add(this.alignmentForce);
		this.f.add(this.cohesionForce);
		this.f.add(this.propulsionForce);
		this.f.add(this.attractionForce);

		// this.debugText = this.cohesionForce.toString()
	}

	// Wrap boids around the screen
	// Can affect flocking moves
	// move(p, dt) {
	//   super.move(p, dt)
	//    this.pos.wrapX(0, p.width);
	//   this.pos.wrapY(0, p.height);
	// }

	draw(p, drawDebug = false) {
		let t = p.millis() * 0.001;

		p.noStroke();
		p.fill(100);
		p.push();
		p.translate(...this.pos);
		p.rotate(this.angle);

		p.text("🤖", 0 + p.noise(1), 0 + p.random(2));

		//     p.beginShape();
		//     p.vertex(this.radius, 0);
		//     p.vertex(-this.radius, -this.radius);
		//     p.vertex(0, 0);
		//     p.vertex(-this.radius, this.radius);

		//     p.endShape();

		p.pop();

		if (drawDebug) {
			p.fill(0);
			p.text(this.debugText, ...this.pos);
			this.pos.drawArrow(p, this.separationForce, {
				m: 0.2,
				color: [30, 100, 50],
			});
			this.pos.drawArrow(p, this.cohesionForce, {
				m: 0.2,
				color: [60, 100, 50],
			});
			this.pos.drawArrow(p, this.alignmentForce, {
				m: 0.2,
				color: [160, 100, 50],
			});
			this.pos.drawArrow(p, this.attractionForce, {
				m: 0.2,
				color: [220, 100, 50],
			});
		}
	}
}
