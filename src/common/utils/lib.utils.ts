export const dateToStr = (value: Date, locale = 'uk-UA', timeZone = 'Europe/Kyiv') => {
  return value ? new Date(value).toLocaleDateString(locale, { timeZone }) : value;
};

export const dateTimeToStr = (value: Date, locale = 'uk-UA', timeZone = 'Europe/Kyiv') => {
  return value ? new Date(value).toLocaleString(locale, { timeZone }) : value;
};

export const dateToLocaleStr = (value: Date, locale: 'uk-UA', timeZone = 'Europe/Kyiv') => {
  return value
    ? new Date(value).toLocaleDateString(locale, {
        timeZone,
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

export const limitText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 3) + '...';
  }
  return text;
};

export const petitionMessage = (petition: Record<string, any>) => {
  const message = [];

  message.push(`# ${petition?.tag}\n`);
  message.push(`<blockquote expandable>`);
  message.push(`<b><a href="${petition?.link}">${petition?.title}</a></b>\n`);
  message.push(petition?.text ? `${petition.text}"\n` : '\n');
  message.push(`</blockquote>\n`);
  message.push(`▫️ <b>Номер петиції</b>: ${petition?.number}\n`);
  message.push(`▫️ <b>Статус</b>: ${petition?.status}\n`);
  message.push(`▫️ <b>Кількість голосів</b>: ${petition?.counts}\n`);
  message.push(petition?.creator ? `▫️ <b>Автор (ініціатор)</b>: ${petition?.creator}\n` : '');
  message.push(`▫️ <b>Дата оприлюднення</b>: ${petition?.publishedAt}\n\n`);
  message.push(petition?.answeredAt ? `▫️ <b>Дата відповіді</b>: ${petition?.answeredAt}\n` : '');
  message.push(`<i>Дата оновлення: ${dateTimeToStr(petition?.updatedAt)}</i>\n\n`);

  return message;
};
