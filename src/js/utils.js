import moment from '../../node_modules/moment/src/moment';

const typesOfPlace = new Set([`check-in`, `sightseeing`, `restaurant`]);

export const typesOfTransport = new Set([`taxi`, `bus`, `train`, `ship`, `transport`, `drive`, `flight`]);

export const getPlaceholder = (type) => {
  return typesOfPlace.has(type) ? `in` : `to`;
};

export const Position = {
  AFTERBEGIN: `afterbegin`,
  AFTEREND: `afterend`,
  BEFOREEND: `beforeend`
};

export const Mode = {
  ADDING: `adding`,
  DEFAULT: `default`,
};

export const Key = {
  ESCAPE_IE: `Escape`,
  ESCAPE: `Esc`,
};

export const createElement = (template) => {
  const newElement = document.createElement(`div`);
  newElement.innerHTML = template;
  return newElement.firstChild;
};

export const render = (container, element, place) => { // перенести в AbstractComponent?
  switch (place) {
    case Position.AFTERBEGIN:
      container.prepend(element);
      break;
    case Position.AFTEREND:
      container.after(element);
      break;
    case Position.BEFOREEND:
      container.append(element);
      break;
  }
};

export const unrender = (element) => { // удалить или перенести в AbstractComponent? метод используется и не только у компонентов
  if (element) {
    element.remove();
    // element.removeElement();
    // задание 4.1 Не забудьте после удаления элемента из DOM удалить ссылку на него
    // с помощью метода класса removeElement, который мы описали в пятом пункте.
  }
};

export const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const countEventDuration = (dateStart, dateEnd) => {
  return moment.duration(moment(dateEnd).diff(moment(dateStart)));
};

export const renderEventDuration = (duration) => {
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  let durationToRender = ``;
  if (days) {
    durationToRender = `${days}D`;
  }
  if (hours) {
    durationToRender = durationToRender + ` ${hours}H`;
  }
  durationToRender = durationToRender + ` ${minutes}M`;
  return durationToRender;
};
