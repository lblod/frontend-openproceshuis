import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ProcessIcrCardScoreComponent extends Component {
  allowedScores = [1, 2, 3, 4, 5];

  @tracked hoveredScore = null;

  get selectedScore() {
    if (
      this.args.selectedScore === null ||
      this.args.selectedScore === undefined
    ) {
      return null;
    }
    return Number(this.args.selectedScore);
  }

  @action
  getSvgPath(score) {
    if (score === this.selectedScore) {
      return `/assets/images/icr/fill-${score}.svg`;
    } else if (score === this.hoveredScore) {
      return `/assets/images/icr/outline-${score}.svg`;
    } else {
      return `/assets/images/icr/neutral-${score}.svg`;
    }
  }

  @action
  onMouseEnter(score) {
    this.hoveredScore = score;
  }

  @action
  onMouseLeave() {
    this.hoveredScore = null;
  }

  @action
  onMouseClick(score) {
    let newScore = score === this.selectedScore ? null : score;

    if (this.args.onScoreChange) {
      this.args.onScoreChange(newScore);
    }
  }
}
