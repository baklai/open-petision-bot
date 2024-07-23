import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';

import { User } from 'src/schemas/user.schema';
import { Petition } from 'src/schemas/petition.schema';
import { TelegramService } from 'src/telegram/telegram.service';
import { dateTimeToStr, petitionMessage, randomInt, sleep } from 'src/common/utils/lib.utils';

@Injectable()
export class ScrapersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Petition.name) private readonly petitionModel: Model<Petition>,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService
  ) {}

  // Запуск кожної години з 6 ранку до 6 вечора:
  @Cron('0 6-18 * * *', { name: 'scrape-petitions-active', timeZone: 'UTC+2' })
  async handleTaskScrapePetitionActive() {
    const mode = this.configService.get<string>('NODE_ENV');

    if (mode === 'development') return;

    console.info(
      `LOG [CRON] NAME [scrape-petitions-active] STATUS [Running] DATE [${dateTimeToStr(new Date())}]`
    );

    // Рандомна хвилина запуску з 0 до 15 хвилини
    const delay = Math.floor(Math.random() * 16) * 60 * 1000;

    setTimeout(async () => {
      await this.handlePetitionScrape({ status: 'active', sort: 'date', order: 'desc' });
    }, delay);
  }

  // Раз на добу о 12 годині дня 30 хвилин:
  @Cron('30 12 * * *', { name: 'scrape-petitions-in-process', timeZone: 'UTC+2' })
  async handleTaskScrapePetitionInProcess() {
    const mode = this.configService.get<string>('NODE_ENV');
    if (mode === 'development') return;

    console.info(
      `LOG [CRON] NAME [scrape-petitions-in-process] STATUS [Running] DATE [${dateTimeToStr(new Date())}]`
    );

    // Рандомна хвилина запуску з 0 до 15 хвилини
    const delay = Math.floor(Math.random() * 16) * 60 * 1000;

    setTimeout(async () => {
      await this.handlePetitionScrape({ status: 'in_process', sort: 'date', order: 'desc' });
    }, delay);
  }

  // Раз на три дні о 6 годині ранку:
  @Cron('0 8 */3 * *', { name: 'scrape-petitions-processed', timeZone: 'UTC+2' })
  async handleTaskScrapePetitionProcessed() {
    const mode = this.configService.get<string>('NODE_ENV');
    if (mode === 'development') return;

    console.info(
      `LOG [CRON] NAME [scrape-petitions-processed] STATUS [Running] DATE [${dateTimeToStr(new Date())}]`
    );

    // Рандомна хвилина запуску з 0 до 15 хвилини
    const delay = Math.floor(Math.random() * 16) * 60 * 1000;

    setTimeout(async () => {
      await this.handlePetitionScrape({ status: 'processed', sort: 'date', order: 'desc' });
    }, delay);
  }

  async handlePetitionScrape({ status = 'active', sort = 'date', order = 'desc' }) {
    const petitions = await this.scraper({ status, sort, order });

    const bulkOps = petitions.map((doc: any) => ({
      updateOne: {
        filter: { number: doc.number },
        update: { $set: doc },
        upsert: true
      }
    }));

    const bulkWriteResult = await this.petitionModel.bulkWrite(bulkOps);

    const newPetitions = await this.petitionModel.find({
      _id: { $in: Object.values(bulkWriteResult.upsertedIds).map(id => id._id) }
    });

    if (status === 'active') {
      for (const petition of newPetitions) {
        const users = await this.userModel.find({}).select({ userID: 1 });

        const petitionDetails = await this.scraperDetails(petition.link, petition.number);

        const updatePetition = await this.petitionModel.findOneAndUpdate(
          { number: petitionDetails.number },
          { $set: { text: petitionDetails.text, creator: petitionDetails.creator } },
          { new: true }
        );

        for (const { userID } of users) {
          await this.sendPetition(userID, updatePetition);
        }

        await sleep(randomInt(5000, 10000));
      }
    }
  }

  async handlePetitionDetailsScrape() {
    const petitions = await this.petitionModel.find({
      $and: [
        { status: 'Триває збір підписів' },
        { $or: [{ text: { $exists: false } }, { creator: { $exists: false } }] }
      ]
    });

    for (const petition of petitions) {
      const petitionDetails = await this.scraperDetails(petition.link, petition.number);

      await this.petitionModel.findOneAndUpdate(
        { number: petitionDetails.number },
        { $set: { text: petitionDetails.text, creator: petitionDetails.creator } },
        { new: true }
      );

      await sleep(randomInt(30000, 60000));
    }
  }

  private async sendPetition(userID: number, petition: Record<string, any>) {
    const message = [];

    try {
      message.push(...petitionMessage(petition));

      const inlineKeyboard = [
        [{ text: '📄 Переглянути петицію', url: petition.link }],
        [
          {
            text: '⭐️ Додати до обраного',
            callback_data: JSON.stringify({ key: 'petition:selected', query: petition.number })
          }
        ]
      ];

      try {
        await this.telegramService.sendMessage(userID, message.join(''), {
          link_preview_options: { is_disabled: true },
          reply_markup: { inline_keyboard: inlineKeyboard },
          parse_mode: 'HTML'
        });
      } catch (err) {
        if (err?.response?.error_code === 403) {
          console.error(err?.response?.description);
          await this.userModel.findOneAndDelete({ userID: userID });
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  private async scraper({ status = 'active', sort = 'date', order = 'desc' }) {
    const petitions = [];
    try {
      const baseUrl = 'https://petition.president.gov.ua';

      let isRunning = true;
      let currentPage = 1;

      do {
        const { data } = await axios.get(
          `${baseUrl}/?status=${status}&sort=${sort}&order=${order}&page=${currentPage}`
        );

        const $ = cheerio.load(data);

        const items = $('div.pet_item')
          .map((index, element) => {
            const href = $(element).find('a.pet_link').attr('href');

            const link = new URL(href, baseUrl).href;

            const number = $(element).find('span.pet_number').text()?.trim();

            const tag = $(element).find('span.pet_tag').text()?.replaceAll('#', '')?.trim();

            const title = $(element)
              .find('a.pet_link')
              .text()
              .replaceAll('\n', '')
              ?.replace(/\s+/g, ' ')
              ?.trim();

            const counts = $(element)
              .find('div.pet_counts')
              .text()
              ?.replaceAll('\n', '')
              ?.replace(/\s+/g, ' ')
              ?.trim();

            const status = $(element)
              .find('div.pet_status')
              .text()
              ?.replaceAll('\n', '')
              ?.replace(/\s+/g, ' ')
              ?.trim();

            const publishedAt = $(element)
              .find('div.pet_date')
              .text()
              ?.replaceAll('\n', '')
              ?.replace(/\s+/g, ' ')
              ?.trim()
              ?.split(':')[1]
              ?.trim();

            const answeredAt = $(element)
              .find('div.pet_date.ans')
              .text()
              ?.replaceAll('\n', '')
              ?.replace(/\s+/g, ' ')
              ?.trim()
              ?.split(':')[1]
              ?.trim();

            const timer = $(element).find('div.pet_timer').text()?.trim();

            return { tag, title, status, counts, number, timer, publishedAt, answeredAt, link };
          })
          .get();

        isRunning = items && items.length > 0;

        petitions.push(...items);

        console.info(
          `LOG [SCRAPER] DATE [${dateTimeToStr(new Date())}] STATUS [${status}] SORT [${sort}] ORDER [${order}] PAGE [${currentPage}] TOTAL [${items.length}]`
        );

        await sleep(randomInt(3000, 10000));

        currentPage++;
      } while (isRunning);
    } catch (err) {
      console.error('Error fetching the page:', err);
    } finally {
      return petitions;
    }
  }

  private async scraperDetails(url: string, number: string) {
    try {
      const { data } = await axios.get(url);

      const $ = cheerio.load(data);

      const [petDateCreator] = $('div.pet_date');

      const creator = $(petDateCreator).text()?.trim()?.split(':')[1];

      const text = $('div.article').text()?.replace(/\s+/g, ' ')?.trim();

      console.info(
        `LOG [SCRAPER DETAILS] DATE [${dateTimeToStr(new Date())}] NUMBER [${number}] URL [${url}]`
      );

      return { number, creator, text };
    } catch (err) {
      console.error('Error fetching the page:', err);
      return { number: '', creator: '', text: '' };
    }
  }
}
