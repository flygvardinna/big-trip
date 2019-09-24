import {Position, render} from './utils';
import {getEvent, menuTabs, filterOptions} from './data';
import {API} from './api';
import {Menu} from './components/menu';
import {Filter} from './components/filter';
import {Statistics} from './components/statistics';
import {TripController} from './controllers/trip';

// const EVENT_COUNT = 6;
const AUTHORIZATION = `Basic 484894743987438`;
const END_POINT = `https://htmlacademy-es-9.appspot.com/big-trip/`;

const api = new API({endPoint: END_POINT, authorization: AUTHORIZATION});

const tripControls = document.querySelector(`.trip-controls`);
const tripMenuTitle = tripControls.querySelector(`h2`);
const eventsContainer = document.querySelector(`.trip-events`);
const addNewEventButton = document.querySelector(`.trip-main__event-add-btn`);

const menu = new Menu(menuTabs);
render(tripMenuTitle, menu.getElement(), Position.AFTEREND);

const filter = new Filter(filterOptions);
render(tripControls, filter.getElement(), Position.BEFOREEND);

const statistics = new Statistics();

/* const eventMocks = new Array(EVENT_COUNT)
                .fill(``)
                .map(getEvent); */

// console.log(eventMocks);
// TODO: Put events sorting to controller also - ГОТОВО

/* const tripController = new TripController(tripEvents, eventMocks);
tripController.init(); */
// TODO: Make offers of event and eventForm be the same

// стоимость путешествия и инфо о путешествии должны переехать в trip controller тоже потому что они будут пересчитываться
// после изменения данных

let availableDestinations = [];
api.getDestinations().then((destinations) => {
  console.log(destinations);
  availableDestinations = destinations;
});

let availableOffers = [];
api.getOffers().then((offers) => {
  console.log(offers);
  availableOffers = offers;
});

const tripController = new TripController(eventsContainer, availableDestinations, availableOffers);

api.getEvents().then((events) => tripController.show(events));
// ТУТ НАДО ПЕРЕПИСАТЬ КОНТРОЛЛЕР ТАК, ЧТОБЫ ОН НЕ ПРИНИМАЛ EVENTS А ОНИ ПЕРЕДАВАЛИСЬ, КАК В ДЕМКЕ, ЧЕРЕЗ МЕТОД SHOW
// иногда с сервера приходят пустые destinations и offers тогда код не работает нормально
// надо проверять, и, если пустые, не давать вызвать контроллер

menu.getElement().addEventListener(`click`, (evt) => {
  evt.preventDefault();

  if (evt.target.tagName !== `A`) {
    return;
  }

  switch (evt.target.innerHTML) {
    case `Table`:
      statistics.getElement().classList.add(`visually-hidden`);
      tripController.show();
      // тут передавать задачи
      break;
    case `Stats`:
      tripController.hide();
      render(eventsContainer, statistics.getElement(), Position.AFTEREND);
      statistics.getElement().classList.remove(`visually-hidden`);
      statistics.renderCharts(tripController._events);
      break;
  }
  // здесь еще нужно переключать класс trip-tabs__btn--active
  // evt.target.classList.toggle(`trip-tabs__btn--active`);
});

addNewEventButton.addEventListener(`click`, () => {
  tripController.addEvent();
  addNewEventButton.setAttribute(`disabled`, `disabled`);
  // кажется, мне не нужен отдельный компонент event-add, должна быть все та же форма редактирования,
  // только без звездочки избранного и там кнопка Cancel вместо Delete
  // для нового ивента нужно будет реализовать загрузку списка опций после выбора дестинейшн.
  // Сейчас этого в разметке новой точки нет. И описание тоже должно подгружаться, наверное
});

export const onDataChange = (actionType, update) => {
  switch(actionType) {
    case `update`:
      api.updateEvent({
        id: update.id,
        data: update.toRAW()
      }).then((events) => tripController.show(events));
      break;
    case `delete`:
      api.deleteEvent({
        id: update.id
      })
        .then(() => api.getEvents())
        .then((events) => tripController.show(events));
        // нужно написать метод show у tripController и сделать так, чтобы именно он отрисовывал ивенты
      break;
  }
}
