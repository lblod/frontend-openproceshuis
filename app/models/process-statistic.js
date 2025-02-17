import Model, { attr, belongsTo } from '@ember-data/model';

export default class ProcessStatisticModel extends Model {
  @attr('number', { defaultValue: 0 }) pdfDownloads;
  @attr('number', { defaultValue: 0 }) pngDownloads;
  @attr('number', { defaultValue: 0 }) svgDownloads;
  @attr('number', { defaultValue: 0 }) bpmnDownloads;
  @attr('number', { defaultValue: 0 }) processViews;

  @belongsTo('process', { inverse: 'processStatistics', async: false }) process;
}
