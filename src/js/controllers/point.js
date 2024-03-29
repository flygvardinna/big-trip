import Event from '../components/event';
import EventEdit from '../components/event-edit';
import {Position, Mode, Key, render, unrender} from '../utils';
import flatpickr from 'flatpickr';

export default class PointController {
  constructor(container, data, destinations, offers, mode, onChangeView, onDataChange) {
    this._container = container;
    this._data = data;
    this._destinations = destinations;
    this._offers = offers;
    this._onChangeView = onChangeView;
    this._onDataChange = onDataChange;
    this._eventView = new Event(this._data);
    this._eventEdit = new EventEdit(mode, this._data, this._destinations, this._offers);
    this._onEscKeyDown = this._onEscKeyDown.bind(this);
    this._mode = mode;

    this._init(mode);
  }

  setDefaultView() {
    if (this._container.contains(this._eventEdit.getElement())) {
      this._container.replaceChild(this._eventView.getElement(), this._eventEdit.getElement());
    }
  }

  _init(mode) {
    let currentView = this._eventView;
    let renderPosition = Position.BEFOREEND;

    if (mode === Mode.ADDING) {
      currentView = this._eventEdit;
      if (document.querySelector(`.trip-events__trip-sort`)) {
        renderPosition = Position.AFTEREND;
      }
    }

    const minDateEnd = this._data.dateStart;
    flatpickr(this._eventEdit.getElement().querySelector(`#event-start-time-1`), {
      altInput: true,
      allowInput: true,
      altFormat: `d.m.Y H:i`,
      dateFormat: `Z`,
      defaultDate: this._data.dateStart,
      enableTime: true,
      [`time_24hr`]: true,
      onChange(selectedDates, dateStr) {
        if (dateStr > minDateEnd.toISOString()) {
          dateEndPicker.set(`minDate`, dateStr);
          dateEndPicker.setDate(dateStr);
        }
      }
    });

    const dateEndPicker = flatpickr(this._eventEdit.getElement().querySelector(`#event-end-time-1`), {
      altInput: true,
      allowInput: true,
      altFormat: `d.m.Y H:i`,
      dateFormat: `Z`,
      defaultDate: this._data.dateEnd,
      minDate: minDateEnd,
      enableTime: true,
      [`time_24hr`]: true
    });

    this._checkSelectedType(this._data.type);

    this._eventView.getElement()
      .querySelector(`.event__rollup-btn`)
      .addEventListener(`click`, () => {
        this._onChangeView();
        this._container.replaceChild(this._eventEdit.getElement(), this._eventView.getElement());
        document.addEventListener(`keydown`, this._onEscKeyDown);
      });

    if (mode === Mode.DEFAULT) {
      this._eventEdit.getElement()
        .querySelector(`.event__rollup-btn`)
        .addEventListener(`click`, () => {
          this._container.replaceChild(this._eventView.getElement(), this._eventEdit.getElement());
          document.removeEventListener(`keydown`, this._onEscKeyDown);
        });
    }

    this._eventEdit.getElement()
      .addEventListener(`submit`, this._onSubmitButtonClick.bind(this));

    const eventTypes = Array.from(this._eventEdit.getElement().querySelectorAll(`.event__type-input`));
    for (const type of eventTypes) {
      type.addEventListener(`click`, () => {
        if (this._data.type !== type.value) {
          this._data.type = type.value;
          type.closest(`.event__type-wrapper`).querySelector(`.event__type-toggle`).checked = false;
          this._eventEdit.onTypeChange(this._eventEdit.getElement(), type.value);
        }
      });
    }

    const eventDestinationInput = this._eventEdit.getElement().querySelector(`.event__input--destination`);

    eventDestinationInput.addEventListener(`click`, (evt) => {
      evt.target.value = ``;
    });

    eventDestinationInput.addEventListener(`change`, (evt) => {
      this._eventEdit.onDestinationChange(this._eventEdit.getElement(), evt.target);
    });

    this._eventEdit.getElement().querySelector(`.event__reset-btn`)
      .addEventListener(`click`, () => {
        if (mode === Mode.DEFAULT) {
          this._toggleFormBlock(this._eventEdit.getElement(), `delete`, true);
          this._onDataChange(`delete`, this._data, this._onError.bind(this, `delete`));
        } else {
          this._unrenderNewEventForm();
        }
      });

    render(this._container, currentView.getElement(), renderPosition);
  }

  _checkSelectedType(type) {
    const options = Array.from(this._eventEdit.getElement().querySelectorAll(`.event__type-input`));
    for (const option of options) {
      if (option.value === type) {
        option.setAttribute(`checked`, `checked`);
        return;
      }
    }
  }

  _toggleFormBlock(form, button, value) {
    const style = this._eventEdit.getElement().getAttribute(`style`);
    if (style) {
      this._eventEdit.getElement().style = `border: none`;
    }
    if (button === `save`) {
      form.querySelector(`.event__save-btn`).textContent = value ? `Saving...` : `Save`;
    } else {
      form.querySelector(`.event__reset-btn`).textContent = value ? `Deleting...` : `Delete`;
    }
    form.querySelector(`.event__type-toggle`).disabled = value;
    form.querySelector(`.event__save-btn`).disabled = value;
    form.querySelector(`.event__reset-btn`).disabled = value;
    const inputs = Array.from(form.querySelectorAll(`.event__input`));
    const offers = Array.from(form.querySelectorAll(`.event__offer-checkbox`));
    for (const input of inputs) {
      input.disabled = value;
    }
    for (const offer of offers) {
      offer.disabled = value;
    }
    if (this._mode === Mode.DEFAULT) {
      form.querySelector(`.event__favorite-checkbox`).disabled = value;
      form.querySelector(`.event__rollup-btn`).disabled = value;
    }
  }

  _shake() {
    const ANIMATION_TIMEOUT = 600;
    this._eventEdit.getElement().style.animation = `shake ${ANIMATION_TIMEOUT / 1000}s`;

    setTimeout(() => {
      this._eventEdit.getElement().style.animation = ``;
    }, ANIMATION_TIMEOUT);
  }

  _unrenderNewEventForm() {
    unrender(this._eventEdit.getElement());
    document.querySelector(`.trip-main__event-add-btn`).removeAttribute(`disabled`);
  }

  _onEscKeyDown(evt) {
    if (evt.key === Key.ESCAPE || evt.key === Key.ESCAPE_IE) {
      if (this._container.contains(this._eventEdit.getElement())) {
        this._container.replaceChild(this._eventView.getElement(), this._eventEdit.getElement());
      }
      document.removeEventListener(`keydown`, this._onEscKeyDown);
    }
  }

  _onSubmitButtonClick(evt) {
    evt.preventDefault();

    const form = evt.target;
    const formData = new FormData(form);

    const photos = Array.from(form.querySelectorAll(`.event__photo`)).map((photo) => ({
      src: photo.getAttribute(`src`),
      description: photo.getAttribute(`alt`)
    }));

    const eventOffers = Array.from(form.querySelectorAll(`.event__offer-checkbox:checked`)).map((offer) => {
      const offerSelector = offer.closest(`.event__offer-selector`);
      return {
        id: Number(offer.getAttribute(`data-offer-id`)),
        title: offerSelector.querySelector(`.event__offer-title`).textContent,
        price: Number(offerSelector.querySelector(`.event__offer-price`).textContent)
      };
    });

    let destinationDescription = ``;
    if (form.querySelector(`.event__destination-description`)) {
      destinationDescription = form.querySelector(`.event__destination-description`).textContent;
    }

    this._data.type = formData.get(`event-type`);
    this._data.destination = {
      name: formData.get(`event-destination`),
      description: destinationDescription,
      pictures: photos
    };
    this._data.dateStart = new Date(formData.get(`event-start-time`));
    this._data.dateEnd = new Date(formData.get(`event-end-time`));
    this._data.price = Number(formData.get(`event-price`));
    this._data.offers = eventOffers;
    if (this._mode === Mode.DEFAULT) {
      this._data.isFavorite = form.querySelector(`.event__favorite-checkbox`).checked;
    }
    this._data.toRAW = () => {
      return {
        id: this._data.id,
        type: this._data.type,
        destination: this._data.destination,
        [`date_from`]: this._data.dateStart,
        [`date_to`]: this._data.dateEnd,
        [`base_price`]: this._data.price,
        offers: this._data.offers,
        [`is_favorite`]: this._data.isFavorite,
      };
    };

    this._toggleFormBlock(form, `save`, true);

    if (this._mode === Mode.DEFAULT) {
      this._onDataChange(`update`, this._data, this._onError.bind(this, `save`));
    } else {
      this._onDataChange(`create`, this._data, this._onError.bind(this, `save`), this._unrenderNewEventForm.bind(this));
    }
  }

  _onError(string) {
    this._toggleFormBlock(this._eventEdit.getElement(), string, false);
    this._eventEdit.getElement().style = `border: 3px red solid`;
    this._shake();
  }
}
