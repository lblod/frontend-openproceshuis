import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class IcrScoreComponent extends Component {
  allowedScores = [1, 2, 3, 4, 5];

  // Use the parent's initial selected score if provided; otherwise, default to null.
  @tracked selectedScore = this.args.selectedScore || null;
  @tracked hoveredShape = null;

  // Returns the appropriate image path based on state
  getSvgPath = (score) => {
    if (score === this.selectedScore) {
      return `/assets/images/icr/fill-${score}.svg`;
    } else if (score === this.hoveredShape) {
      return `/assets/images/icr/outline-${score}.svg`;
    } else {
      return `/assets/images/icr/neutral-${score}.svg`;
    }
  };

  @action
  onMouseEnter(score) {
    this.hoveredShape = score;
  }

  @action
  onMouseLeave() {
    this.hoveredShape = null;
  }

  @action
  onClickShape(score) {
    this.selectedScore = score;
    // Notify the parent component of the new score
    if (this.args.onScoreChange) {
      this.args.onScoreChange(score);
    }
  }
}
