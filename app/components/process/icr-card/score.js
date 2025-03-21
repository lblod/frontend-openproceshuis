import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ProcessIcrCardScoreComponent extends Component {
  allowedScores = [1, 2, 3, 4, 5];

  @tracked selectedScore = this.allowedScores.includes(this.args.selectedScore)
    ? this.args.selectedScore
    : undefined;
  @tracked hoveredScore = null;

  getSvgPath = (score) => {
    if (score === this.selectedScore) {
      return `/assets/images/icr/fill-${score}.svg`;
    } else if (score === this.hoveredScore) {
      return `/assets/images/icr/outline-${score}.svg`;
    } else {
      return `/assets/images/icr/neutral-${score}.svg`;
    }
  };

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
    if (this.selectedScore === score) score = undefined;

    this.selectedScore = score;
    if (this.args.onScoreChange) {
      this.args.onScoreChange(score);
    }
  }
}
