export const dateToStr = (value: Date, locale = 'uk-UA') => {
  return value ? new Date(value).toLocaleDateString(locale) : value;
};

export const dateTimeToStr = (value: Date, locale = 'uk-UA') => {
  return value ? new Date(value).toLocaleString(locale) : value;
};

export const dateToLocaleStr = (value: Date, locale: 'uk-UA') => {
  return value
    ? new Date(value).toLocaleDateString(locale, {
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : value;
};

export const capitalizeFirstLetter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const sleep = (duration: number) => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

export const randomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
