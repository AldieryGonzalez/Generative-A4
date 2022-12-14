class GuppieSystem extends ParticleSystem {
	static label = "🐟"; // Ignore the Glitch parse error
	static desc = "Atom simulation w"; // Ignore the Glitch parse error
	constructor() {
		// Make what particle, and how many?
		// Try different numbers of particles
		super(GuppieParticle, 10);
	}

	draw(p) {
		// How many tiles and how big are they?
		let t = p.millis() * 0.001;
		let count = 90;
		let tileSize = p.width / count;
		let noiseScale = 0.01;

		for (let i = 0; i < count; i++) {
			for (let j = 0; j < count; j++) {
				let x = tileSize * i;
				let y = tileSize * j;

				let hue = 197;
				// let colorNoise = 20 * p.noise
				let noise = 500 * p.noise(x * noiseScale, y * noiseScale, t / 3);

				// Wrap the hue around 306 degrees, P5 can't handle >360 hues
				p.noStroke();
				p.fill(hue, 100, noise / 6 + 25, 1);

				p.rect(x, y, tileSize * 0.9);
			}
		}
		// The "super-class" draws the particles
		super.draw(p);
	}
}

//=========================================================================
//=========================================================================
//=========================================================================

class GuppieParticle extends Particle {
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
		this.trail = [];
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
		this.alignmentForce.mult(0);

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

		let tempT = Math.ceil(t);
		if (tempT % 5 == 0) {
			this.trail.push({ location: this.pos.clone(), birthTime: t });
			this.trail = this.trail.slice(-20);
		}

		let opacity = ((t % 5) * 20) / 100;
		opacity = Math.sin(opacity * Math.PI) * 2;

		p.strokeWeight(3);
		p.stroke(0, 0, 0, 0.1);
		p.fill(160, 75, 80, opacity);
		p.push();
		p.translate(...this.pos);
		p.rotate(-this.angle);

		p.beginShape();
		p.curveVertex(this.radius, 0);
		p.curveVertex(this.radius, 0);
		p.curveVertex(-this.radius, -this.radius);
		p.curveVertex(-this.radius * 2, 0);
		p.curveVertex(-this.radius, this.radius);
		p.curveVertex(-this.radius, this.radius);
		p.endShape(p.CLOSE);

		p.fill(0);
		p.circle(-this.radius, -this.radius, 2);
		p.circle(-this.radius, this.radius, 2);

		p.pop();

		p.noFill();
		p.strokeWeight(1);
		p.stroke(100, 100, 100, 0.25);
		for (const ripple of this.trail) {
			// console.log(3 - ripple.lifeSpanLeft);
			p.circle(
				ripple.location[0],
				ripple.location[1],
				(t - ripple.birthTime) * 25
			);
		}

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
