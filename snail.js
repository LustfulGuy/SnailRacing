import { random } from './util.js';

export default class Snail {
  constructor(min_speed, max_speed, death_rate, margin_top, img_0, img_1, img_2) {
    this.current = 0;
    this.isDead = false;
    this.isWinner = false;
    this.width = 56;
    this.height = 56;
    this.min_speed = min_speed;
    this.max_speed = max_speed;
    this.death_rate = death_rate;
    this.margin_top = margin_top;
    this.img_0 = img_0;
    this.img_1 = img_1;
    this.img_2 = img_2;
  }

  get isDeadNow() {
    return random(0, 10000) < this.death_rate;
  }
}