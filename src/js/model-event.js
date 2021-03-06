export default class ModelEvent {
  constructor(data) {
    this.id = data[`id`];
    this.type = data[`type`];
    this.destination = data[`destination`];
    this.dateStart = new Date(data[`date_from`]);
    this.dateEnd = new Date(data[`date_to`]);
    this.price = data[`base_price`];
    this.offers = data[`offers`] || [];
    this.isFavorite = Boolean(data[`is_favorite`]);
  }

  static parseEvent(eventData) {
    return new ModelEvent(eventData);
  }

  static parseEvents(eventsData) {
    return eventsData.map(ModelEvent.parseEvent);
  }
}
