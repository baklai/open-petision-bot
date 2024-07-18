export const dateToStr = (value: Date) => {
  return value ? new Date(value).toLocaleDateString() : value;
};

export const dateTimeToStr = (value: Date) => {
  return value ? new Date(value).toLocaleString() : value;
};

export const dateToLocaleStr = (value: Date, locale: string) => {
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
