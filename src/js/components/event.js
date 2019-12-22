import AbstractComponent from './abstract-component';
import {getPlaceholder, capitalize, countEventDuration, renderEventDuration} from '../utils';
import moment from '../../../node_modules/moment/src/moment';

const OFFER_COUNT = 3;

const createOffersList = (offers) => {
  const selectedOffers = [];
  for (const offer of offers) {
    if (selectedOffers.length === OFFER_COUNT) {
      break;
    }
    if (offer.accepted) {
      selectedOffers.push(getOfferTemplate(offer));
    }
  }
  return selectedOffers.join(``);
};

const getOfferTemplate = (offer) => {
  return `<li class="event__offer">
    <span class="event__offer-title">${offer.title}</span>
    &plus;
    &euro;&nbsp;<span class="event__offer-price">${offer.price}</span>
   </li>`;
};

const getOffersTemplate = (offersToRender) => {
  if (offersToRender.length > 0) {
    return `<h4 class="visually-hidden">Offers:</h4>
    <ul class="event__selected-offers">
      ${createOffersList(offersToRender)}
    </ul>`;
  }
  return ``;
};

export default class Event extends AbstractComponent {
  constructor(data) {
    super();
    this._id = data.id;
    this._type = data.type;
    this._placeholder = getPlaceholder(data.type);
    this._destination = data.destination.name;
    this._dateStart = data.dateStart;
    this._dateEnd = data.dateEnd;
    this._duration = renderEventDuration(countEventDuration(this._dateStart, this._dateEnd));
    this._price = data.price;
    this._offers = data.offers;
  }

  getTemplate() {
    return `<li class="trip-events__item">
    <div class="event">
      <div class="event__type">
        <img class="event__type-icon" width="42" height="42" src="public/img/icons/${this._type}.png" alt="Event type icon">
      </div>
      <h3 class="event__title">${capitalize(this._type)} ${this._placeholder} ${this._destination}</h3>

      <div class="event__schedule">
        <p class="event__time">
          <time class="event__start-time" datetime="${this._dateStart}">${moment(this._dateStart).format(`HH:mm`)}</time>
          &mdash;
          <time class="event__end-time" datetime="${this._dateEnd}">${moment(this._dateEnd).format(`HH:mm`)}</time>
        </p>
        <p class="event__duration">${this._duration}</p>
      </div>

      <p class="event__price">
        &euro;&nbsp;<span class="event__price-value">${this._price}</span>
      </p>

      ${getOffersTemplate(this._offers)}

      <button class="event__rollup-btn" type="button">
        <span class="visually-hidden">Open event</span>
      </button>
    </div>
    </li>`.trim();
  }
}
