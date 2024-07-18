import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';

import { Petition } from 'src/schemas/petition.schema';

@Injectable()
export class ScrapersService {
  constructor(@InjectModel(Petition.name) private readonly petitionModel: Model<Petition>) {}

  @Cron('0 0 * * *', { name: 'scrape-petitions', timeZone: 'UTC' })
  async handleTaskScrape() {}

  async handlePetitionScrape({ status = 'active', sort = 'date', order = 'desc' }) {
    const petitions = await this.petitionsScraper({ status, sort, order });

    await this.petitionModel.insertMany([...petitions]);
  }

  private sleep(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private async petitionsScraper({ status = 'active', sort = 'date', order = 'desc' }) {
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
            const relativeLink = $(element).find('a.pet_link').attr('href');
            const fullLink = new URL(relativeLink, baseUrl).href;

            const tag = $(element).find('span.pet_tag').text()?.replaceAll('#', '');
            const number = $(element).find('span.pet_number').text();
            const title = $(element)
              .find('a.pet_link')
              .text()
              .replaceAll('\n', '')
              ?.replaceAll('  ', ' ')
              ?.trim();

            const counts = $(element)
              .find('div.pet_counts')
              .text()
              ?.replaceAll('\n', '')
              ?.replaceAll('  ', ' ')
              ?.trim();

            const status = $(element)
              .find('div.pet_status')
              .text()
              ?.replaceAll('\n', '')
              ?.replaceAll('  ', ' ')
              ?.trim();

            const dateOfP = $(element)
              .find('div.pet_date')
              .text()
              ?.replaceAll('\n', '')
              ?.replaceAll('  ', ' ')
              ?.trim()
              ?.split(':')[1]
              ?.trim();

            const dateOfA = $(element)
              .find('div.pet_date.ans')
              .text()
              ?.replaceAll('\n', '')
              ?.replaceAll('  ', ' ')
              ?.trim()
              ?.split(':')[1]
              ?.trim();

            const timer = $(element).find('div.pet_timer').text();

            return {
              tag: tag,
              title: title,
              status: status,
              counts: counts,
              number: number,
              timer: timer,
              dateOfP: dateOfP,
              dateOfA: dateOfA,
              link: fullLink
            };
          })
          .get();

        isRunning = items && items.length > 0;

        petitions.push(...items);

        console.info(
          `LOG [SCRAPER] STATUS [${status}] SORT [${sort}] ORDER [${order}] PAGE [${currentPage}] TOTAL [${items.length}]`
        );

        await this.sleep(5000);

        currentPage++;
      } while (isRunning);
    } catch (err) {
      console.error('Error fetching the page:', err);
    } finally {
      return petitions;
    }
  }
}
