import Component from '@glimmer/component';

const ALLOWED_SCORES = [1, 2, 3, 4, 5];

export default class ProcessIcrScoreComponent extends Component {
  get score() {
    const score = Number(this.args.score);

    return ALLOWED_SCORES.includes(score) ? score : null;
  }

  get svgPath() {
    return `/assets/images/icr/fill-${this.score}.svg`;
  }
}
