import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ProcessIcrCardScoreComponent extends Component {
  allowedScores = [1, 2, 3, 4, 5];

  @tracked hoveredScore = null;

  @action
  getSvgPath(score) {
    if (score === this.args.selectedScore) {
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
    let newScore = score === this.args.selectedScore ? undefined : score;

    if (this.args.onScoreChange) {
      this.args.onScoreChange(newScore);
    }
  }
}
