import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class IcrScoreComponent extends Component {
  allowedScores = [1, 2, 3, 4, 5];

  @tracked hoveredShape = null;
  @tracked selectedShape = null;

  getSvgPath = (shapeNumber) => {
    if (shapeNumber === this.selectedShape) {
      return `/assets/images/icr/fill-${shapeNumber}.svg`;
    } else if (shapeNumber === this.hoveredShape) {
      return `/assets/images/icr/outline-${shapeNumber}.svg`;
    } else {
      return `/assets/images/icr/neutral-${shapeNumber}.svg`;
    }
  };

  @action
  onMouseEnter(shapeNumber) {
    this.hoveredShape = shapeNumber;
  }

  @action
  onMouseLeave() {
    this.hoveredShape = null;
  }

  @action
  onClickShape(shapeNumber) {
    this.selectedShape = shapeNumber;
  }
}
