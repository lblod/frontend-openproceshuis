import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class BpmnFilesController extends Controller {
  selectedFile = null;

  @action
  fileSelected(event) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  @action
  async submitFile(event) {
    event.preventDefault();
    if (this.selectedFile) {
      let formData = new FormData();
      formData.append('file', this.selectedFile);

      try {
        const response = await fetch('http://localhost/bpmn-files', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('File upload failed');
        }

        // Handle success
      } catch (error) {
        // Handle errors
      }
    }
  }
}
