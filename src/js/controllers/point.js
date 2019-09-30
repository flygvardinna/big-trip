import {Position, Mode, Key, render, unrender} from '../utils';
import {Event} from '../components/event';
import {EventEdit} from '../components/event-edit';
import flatpickr from 'flatpickr';

export class PointController {
  constructor(container, data, destinations, offers, mode, onChangeView, onDataChange) {
    this._container = container;
    this._data = data;
    this._destinations = destinations;
    this._offers = offers;
    this._onChangeView = onChangeView;
    this._onDataChange = onDataChange;
    this._eventView = new Event(this._data);
    this._eventEdit = new EventEdit(mode, this._data, this._destinations, this._offers);
    this._mode = mode; // ниже замени просто mode на this._mode если надо
    // возможно тут должны быть onEditButtonClick и onSubmitButtonClick
    // this._onSubmitButtonClick = this._onSubmitButtonClick.bind(this);

    this.init(mode);
  }

  init(mode) { // метод init слишком длинный, вынести все лишнее наружу? не получится, можно вынести в отдельные методы только
    let currentView = this._eventView;
    let renderPosition = Position.BEFOREEND;

    if (mode === Mode.ADDING) {
      // this._eventEdit = new EventAdd(this._data);
      currentView = this._eventEdit;
      renderPosition = Position.AFTEREND;
    }

    // нужно подключить флетпикер и для новой формы добавления
    let minDateEnd = this._data.dateStart;
    flatpickr(this._eventEdit.getElement().querySelector(`#event-start-time-1`), {
      altInput: true,
      allowInput: true,
      altFormat: `d/m/y H:i`,
      // dateFormat: `Y-m-d H:i`,
      // dateFormat: `U`, // выводились в value милисекунды
      dateFormat: `Z`,
      defaultDate: this._data.dateStart,
      // minDate: `today`,
      enableTime: true,
      // time_24hr: true,
      onChange(selectedDates, dateStr) {
        minDateEnd = dateStr; // как переопределить дату для второго пикера? пока не получилось
      }
      // в ТЗ указан другой формат, не как в макетах, такой "d.m.Y H:i"
      // Дата окончания не может быть меньше даты начала события. У меня пока при изменения даты начала это не работает
    });

    flatpickr(this._eventEdit.getElement().querySelector(`#event-end-time-1`), {
      altInput: true,
      allowInput: true,
      altFormat: `d/m/y H:i`,
      // dateFormat: `Y-m-d H:i`,
      dateFormat: `Z`,
      // dateFormat: `d/m/y H:i`,
      defaultDate: this._data.dateEnd,
      minDate: minDateEnd,
      enableTime: true,
      // time_24hr: true
    });

    const onSubmitButtonClick = (evt) => {
      evt.preventDefault();
      // нельзя пользоваться переменной event!!

      const form = this._eventEdit.getElement();
      const formData = new FormData(form);
      const picturesArray = Array.from(form.querySelectorAll(`.event__photo`)).map((picture) => ({
        src: picture.getAttribute(`src`),
        description: picture.getAttribute(`alt`)
      }));

      const offersArray = Array.from(form.querySelectorAll(`.event__offer-selector`)).map((offer) => ({
        title: offer.querySelector(`.event__offer-title`).innerHTML,
        price: parseInt(offer.querySelector(`.event__offer-price`).innerHTML, 10),
        accepted: offer.querySelector(`.event__offer-checkbox`).checked
      }));

      this._data.type = formData.get(`event-type`); // нужно ли передавать id?
      this._data.destination = {
        name: formData.get(`event-destination`),
        description: form.querySelector(`.event__destination-description`).innerHTML,
        // добавить таймаут чтобы успело подгрузиться описание
        pictures: picturesArray
      };
      this._data.dateStart = new Date(formData.get(`event-start-time`));
      this._data.dateEnd = new Date(formData.get(`event-end-time`));
      this._data.price = parseInt(formData.get(`event-price`), 10);
      this._data.offers = offersArray;
      if (mode === Mode.DEFAULT) {
        this._data.isFavorite = form.querySelector(`.event__favorite-checkbox`).checked;
      }
      this._data.toRAW = () => {
        return {
          id: this._data.id,
          type: this._data.type,
          destination: this._data.destination,
          date_from: this._data.dateStart,
          date_to: this._data.dateEnd,
          base_price: this._data.price,
          offers: this._data.offers,
          is_favorite: this._data.isFavorite,
        };
      }

      this.toggleFormBlock(form, `save`, true);

      // сейчас при изменении опции (выбранная) не отрисовывается в списке ивентов (не в форме)

      // может можно было не городить поиск лейбла с типом итд, а брать entry.type итд
      // TO DO После сохранения точка маршрута располагается в списке точек маршрута в порядке определенном
      // текущей сортировкой (по умолчанию, по длительности или по стоимости). НЕ РАБОТАЕТ СЕЙЧАС
      // сейчас проблема такая, что если выбрана сортировка не по дням, то после изменения снова рендерятся дни

      if (mode === Mode.DEFAULT) {
        this._onDataChange(`update`, this._data, this.onError.bind(this, `save`));
      } else {
        this._onDataChange(`create`, this._data, this.onError.bind(this, `save`));
        // ПРИ СОЗДАНИИ НЕ НРАВИТСЯ, ЧТО СНАЧАЛА ЗАКРЫВАЕТСЯ ФОРМА, БУДЕТО НИЧЕГО НЕ ПРОИЗОШЛО
        // ПОТОМ ДОБАВЛЯЕТСЯ НОВОЕ СОБЫТИЕ, МБ ДЕЛЭЙ?
      }

      document.removeEventListener(`keydown`, onEscKeyDown); // ТОЖЕ ДОЛЖНО УБИРАТЬСЯ ТОЛЬКО ПРИ УСПЕХЕ?

      if (mode === Mode.ADDING) { // ДОЛЖНО СРАБАТЫВАТЬ ТОЛЬКО ПРИ УСПЕХЕ!
        // куда убрать? вынеси в функцию и вызывай через tripController.renderEvents() ? ПОДУМАЙ
        unrender(this._eventEdit.getElement());
        document.querySelector(`.trip-main__event-add-btn`).removeAttribute(`disabled`);
        // ПРОБЛЕМА - ЕСЛИ ПРИ СОЗДАНИИ ИВЕНТА ОШИБКА, ТО ФОРМА ИСЧЕЗАЕТ И НЕ СРАБАТЫВАЕТ НОРМАЛЬНО ON ERROR
      }
    };

    const onEscKeyDown = (evt) => {
      if (evt.key === Key.ESCAPE || evt.key === Key.ESCAPE_IE) {
        if (mode === Mode.DEFAULT) {
          if (this._container.contains(this._eventEdit.getElement())) {
            this._container.replaceChild(this._eventView.getElement(), this._eventEdit.getElement());
          }
        } else if (mode === Mode.ADDING) {
          this._container.removeChild(currentView.getElement());
        }
        document.removeEventListener(`keydown`, onEscKeyDown);
      }
    };

    const checkSelectedType = (type) => {
      const options = Array.from(this._eventEdit.getElement().querySelectorAll(`.event__type-input`));
      options.forEach((option) => {
        if (option.getAttribute(`value`) === type) {
          option.setAttribute(`checked`, `checked`);
        }
      });
    };

    checkSelectedType(this._data.type);

    const updateIfOfferAccepted = () => {
      const offers = Array.from(this._eventEdit.getElement().querySelectorAll(`.event__offer-checkbox`));
      offers.forEach((offer) => {
        offer.addEventListener(`click`, () => {
          // нужно вызывать пересчитывание стоимости путешествия после сохранения данных? Или само посчитается?
          if (offer.checked === true) {
            offer.setAttribute(`checked`, `checked`);
          } else {
            offer.setAttribute(`checked`, false);
          }
        });
      });
    };

    updateIfOfferAccepted();

    this._eventEdit.getElement()
      .addEventListener(`submit`, onSubmitButtonClick);

    this._eventView.getElement()
      .querySelector(`.event__rollup-btn`)
      .addEventListener(`click`, () => {
        this._onChangeView();
        this._container.replaceChild(this._eventEdit.getElement(), this._eventView.getElement());
        document.addEventListener(`keydown`, onEscKeyDown);
      });

    if (mode === Mode.DEFAULT) { // зачем это условие? а что в не дефолтном режиме? не в дефолтном у формы нет галочки
      // нужно закрывать форму создания точки, если открываем форму другой точки
      // через onChangeView?
      this._eventEdit.getElement()
        .querySelector(`.event__rollup-btn`)
        .addEventListener(`click`, () => {
          this._container.replaceChild(this._eventView.getElement(), this._eventEdit.getElement());
          document.removeEventListener(`keydown`, onEscKeyDown);
        });
    }

    Array.from(this._eventEdit.getElement().querySelectorAll(`.event__type-input`)).forEach((option) => {
      option.addEventListener(`click`, () => {
        if (this._data.type !== option.value) {
          this._data.type = option.value;
          option.closest(`.event__type-wrapper`).querySelector(`.event__type-toggle`).checked = false;
          this._eventEdit._onEventTypeChange(this._eventEdit.getElement(), option.value);
        }
      });
    });

    this._eventEdit.getElement()
      .querySelector(`.event__input--destination`)
      .addEventListener(`change`, (evt) => {
        // let value = evt.target.value;
        this._eventEdit._onDestinationChange(this._eventEdit.getElement(), evt.target.value);
      });

    this._eventEdit.getElement().querySelector(`.event__reset-btn`)
      .addEventListener(`click`, () => {
        this.toggleFormBlock(this._eventEdit.getElement(), `delete`, true);
        this._onDataChange(`delete`, this._data, this.onError.bind(this, `delete`));
        // сейчас при удалении точки у нее сначала пропадают даты, потом удаляется
        // Так не должно наверное быть, поправь

        if (mode === Mode.ADDING) {
          unrender(this._eventEdit.getElement());
          document.querySelector(`.trip-main__event-add-btn`).removeAttribute(`disabled`);
          // этот код дублируется выше, можно вынести в отдельную функцию Закрыть форму редактирования
          // Сейчас Cancel на форме добавления приводит к тому, что отрисовываются еще 5 событий
        }
      });

    render(this._container, currentView.getElement(), renderPosition);
  }

  toggleFormBlock(form, button, value) {
    if (button === `save`) {
      form.querySelector(`.event__save-btn`).textContent = value ? `Saving...` : `Save`;
    } else {
      form.querySelector(`.event__reset-btn`).textContent = value ? `Deleting...` : `Delete`;
      //мб везде использовать textContent вместо innerHTML?
    }
    form.querySelector(`.event__type-toggle`).disabled = value;
    form.querySelector(`.event__save-btn`).disabled = value;
    form.querySelector(`.event__reset-btn`).disabled = value;
    Array.from(form.querySelectorAll(`.event__input`)).map((input) => input.disabled = value);
    // можно просто дизейблить все инпуты, но это наверное нарушает Д21 Изменения применяются точечно, неочевидно
    Array.from(form.querySelectorAll(`.event__offer-checkbox`)).map((offer) => offer.disabled = value);
    if (this._mode === Mode.DEFAULT) {
      form.querySelector(`.event__favorite-checkbox`).disabled = value;
      form.querySelector(`.event__rollup-btn`).disabled = value;
    }
  }

  shake() {
    const ANIMATION_TIMEOUT = 600;
    this._eventEdit.getElement().style.animation = `shake ${ANIMATION_TIMEOUT / 1000}s`;

    setTimeout(() => {
      this._eventEdit.getElement().style.animation = ``
    }, ANIMATION_TIMEOUT);
  }

  setDefaultView() {
    if (this._container.contains(this._eventEdit.getElement())) {
      this._container.replaceChild(this._eventView.getElement(), this._eventEdit.getElement());
    }
  }

  onError(string) {
    this.toggleFormBlock(this._eventEdit.getElement(), string, false);
    this._eventEdit.getElement().style = `border: 3px red solid`;
    this.shake();
  }
}
