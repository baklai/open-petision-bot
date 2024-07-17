import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Scenes } from 'telegraf';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema';
import { Petition } from './schemas/petition.schema';

import { TelegramService } from './telegram/telegram.service';
import { ScrapersService } from './scrapers/scrapers.service';
import { TContext } from './telegram/telegram.module';

import {
  MAIN_COMMANDS,
  OPERATION_COMMANDS,
  SYSTEM_COMMANDS
} from './common/constants/commands.constant';
import { dateTimeToStr } from './common/utils/lib.utils';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Petition.name) private readonly petitionModel: Model<Petition>,
    private readonly scrapersService: ScrapersService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService
  ) {
    this.telegramService.setBotMyCommands([
      ...MAIN_COMMANDS.commands,
      ...OPERATION_COMMANDS.commands
    ]);

    this.telegramService.setBotCommand('start', (ctx: TContext) => this.handlerCommandStart(ctx));
    this.telegramService.setBotCommand('help', (ctx: TContext) => this.handlerCommandHelp(ctx));
    this.telegramService.setBotCommand('about', (ctx: TContext) => this.handlerCommandAbout(ctx));
    this.telegramService.setBotCommand('quit', (ctx: TContext) => this.handlerCommandQuit(ctx));
    this.telegramService.setBotCommand('notice', (ctx: any) => this.handlerCommandNotice(ctx));
    this.telegramService.setBotCommand('admin', (ctx: any) => this.handlerCommandAdmin(ctx));
    this.telegramService.setBotCommand('update', (ctx: any) => this.handlerCommandUpdate(ctx));
    this.telegramService.setBotCommand('donate', (ctx: TContext) => this.handlerCommandDonate(ctx));
    this.telegramService.setBotCommand('petition', (ctx: TContext) =>
      this.handlerCommandPetition(ctx)
    );
    this.telegramService.setBotCommand('statistic', (ctx: TContext) =>
      this.handlerCommandStatistic(ctx)
    );

    this.initSceneAdmin('admin');
    this.initSceneNotice('notice');
    this.initSceneUpdate('update');
    this.initScenePetition('petition');

    this.telegramService.setOnMessage((ctx: any) => this.onMessage(ctx));

    this.telegramService.setOnСallbackQuery((ctx: any) => this.onСallbackQuery(ctx));
  }

  createWebhookTelegramBot() {
    return this.telegramService.botLaunch();
  }

  statusTelegramBot(processUpdate: Record<string, any>): Record<string, any> {
    return processUpdate;
  }

  private async onMessage(ctx: any) {
    if (ctx?.update?.message?.text === '❓ Довідка') {
      return await this.handlerCommandHelp(ctx);
    } else if (ctx?.update?.message?.text === '💸 Донат') {
      return await this.handlerCommandDonate(ctx);
    } else if (ctx?.update?.message?.text === '⭐️ Обрані петиції') {
      return await this.handlerSelectedPetition(ctx);
    } else {
      return await ctx.replyWithHTML('✌️ Дуже цікаво, але я поки що не вмію вести розмову!', {});
    }
  }

  private async onСallbackQuery(ctx: any) {
    const callbackData = ctx.callbackQuery.data;

    switch (callbackData) {
      case 'quit:confirm:yes':
      case 'quit:confirm:cancel':
        return await this.handlerQuitConfirm(ctx);
      default:
        return await ctx.replyWithHTML('💢 <b>Упс!</b> Щось пішло не так!', {});
    }
  }

  private async initSceneAdmin(name: string) {
    const scene = new Scenes.BaseScene<any>(name);
    scene.enter(async ctx => {
      const message = [
        '👌 Добре, давайте отримаємо права адміністратора!\n\n',
        '👉 Будь ласка, введіть секретний ключ'
      ];

      ctx.replyWithHTML(message.join(''));
    });

    scene.on<any>('text', async (ctx: any) => {
      const secret = this.configService.get<string>('SECRET');
      ctx.session.secret = ctx.message.text;

      if (ctx.session.secret === secret) {
        const user = await this.userModel.findOneAndUpdate(
          { userID: ctx.userInfo.userID },
          { $set: { isAdmin: true } }
        );
        if (user && user?.isAdmin) {
          ctx.replyWithHTML('👌 Добре, права адміністратора успішно надано!');
        } else {
          ctx.replyWithHTML('💢 <b>Упс</b>, у правах адміністратора відмовлено!');
        }
      } else {
        ctx.replyWithHTML('💢 <b>Упс</b>, у правах адміністратора відмовлено!');
      }

      ctx.scene.leave();
    });

    this.telegramService.registerBotScene(scene);
  }

  private async initSceneNotice(name: string) {
    const scene = new Scenes.BaseScene<any>(name);
    scene.enter(async ctx => {
      const user = await this.userModel.findOne({ userID: ctx.userInfo.userID });

      if (!user || !user?.isAdmin) {
        ctx.replyWithHTML('💢 <b>Упс!</b> У вас недостатньо повноважень!');
        return ctx.scene.leave();
      }

      const message = [
        '👌 Добре, давайте створемо нове повідомлення!\n\n',
        '👉 Будь ласка, введіть текст повідомлення'
      ];

      ctx.replyWithHTML(message.join(''));
    });

    scene.on<any>('text', async (ctx: any) => {
      ctx.session.message = ctx.message.text;

      try {
        const users = await this.userModel.find({}).select({ userID: 1 });
        users.forEach(async ({ userID }) => {
          try {
            await this.telegramService.sendMessage(userID, ctx.session.message);
          } catch (err) {
            if (err?.response?.error_code === 403) {
              console.error(err?.response?.description);
              await this.userModel.findOneAndDelete({ userID: userID });
            }
          }
        });
        ctx.replyWithHTML('💪 Повідомлення відправлено усім користувачам.');
      } catch (err) {
        ctx.replyWithHTML(
          `💢 <b>Упс!</b> Щось пішло не так!. Виникла помилка: <i>${err.message}</i>`
        );
      } finally {
        ctx.scene.leave();
      }
    });

    this.telegramService.registerBotScene(scene);
  }

  private async initSceneUpdate(name: string) {
    const scene = new Scenes.BaseScene<any>(name);
    scene.enter(async ctx => {
      const user = await this.userModel.findOne({ userID: ctx.userInfo.userID });

      if (!user || !user?.isAdmin) {
        ctx.replyWithHTML('💢 <b>Упс!</b> У вас недостатньо повноважень!');
        return ctx.scene.leave();
      }

      const message = [
        `👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!`,
        '\n\n',
        '👌 Добре, давайте оновимо перелік петицій!\n\n',
        '👉 Будь ласка, оберіть статус петиції зі списку.'
      ];

      ctx.replyWithHTML(message.join(''), {
        link_preview_options: { is_disabled: true },
        reply_markup: {
          inline_keyboard: [
            [{ text: 'ТРИВАЄ ЗБІР ПІДПИСІВ', callback_data: 'update:petition:active' }],
            [{ text: 'НА РОЗГЛЯДІ', callback_data: 'update:petition:inprocess' }],
            [{ text: 'З ВІДПОВІДДЮ', callback_data: 'update:petition:processed' }]
          ]
        }
      });
    });

    scene.on<any>('callback_query', async (ctx: any) => {
      ctx.session.callbackdata = ctx.callbackQuery.data;

      const user = await this.userModel.findOne({ userID: ctx.userInfo.userID });

      if (!user || !user?.isAdmin) {
        ctx.replyWithHTML('💢 <b>Упс!</b> У вас недостатньо повноважень!');
        return ctx.scene.leave();
      }

      switch (ctx.session.callbackdata) {
        case 'update:petition:active':
          this.scrapersService.handlePetitionScrape({ status: 'active' });
          await ctx.replyWithHTML(
            `👌 Добре, запущено оновлення переліку петицій! Це може зайняти деякий час!`
          );
          break;
        case 'update:petition:inprocess':
          this.scrapersService.handlePetitionScrape({ status: 'in_process' });
          await ctx.replyWithHTML(
            `👌 Добре, запущено оновлення переліку петицій! Це може зайняти деякий час!`
          );
          break;
        case 'update:petition:processed':
          this.scrapersService.handlePetitionScrape({ status: 'processed' });
          await ctx.replyWithHTML(
            `👌 Добре, запущено оновлення переліку петицій! Це може зайняти деякий час!`
          );
          break;
        default:
          await ctx.replyWithHTML('💢 <b>Упс!</b> Щось пішло не так!', {});
      }

      ctx.scene.leave();
    });

    this.telegramService.registerBotScene(scene);
  }

  private async initScenePetition(name: string) {
    const scene = new Scenes.BaseScene<any>(name);
    scene.enter(async ctx => {
      const user = await this.userModel.findOne({ userID: ctx.userInfo.userID });

      if (!user || !user?.isAdmin) {
        ctx.replyWithHTML('💢 <b>Упс!</b> У вас недостатньо повноважень!');
        return ctx.scene.leave();
      }

      const message = [
        `👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!`,
        '\n\n',
        '👌 Добре, давайте оновимо перелік петицій!\n\n',
        '👉 Будь ласка, оберіть статус петиції зі списку.'
      ];

      ctx.replyWithHTML(message.join(''), {
        link_preview_options: { is_disabled: true },
        reply_markup: {
          inline_keyboard: [
            [{ text: 'ТРИВАЄ ЗБІР ПІДПИСІВ', callback_data: 'update:petition:active' }],
            [{ text: 'НА РОЗГЛЯДІ', callback_data: 'update:petition:inprocess' }],
            [{ text: 'З ВІДПОВІДДЮ', callback_data: 'update:petition:processed' }]
          ]
        }
      });
    });

    scene.on<any>('callback_query', async (ctx: any) => {
      ctx.session.callbackdata = ctx.callbackQuery.data;

      const user = await this.userModel.findOne({ userID: ctx.userInfo.userID });

      if (!user || !user?.isAdmin) {
        ctx.replyWithHTML('💢 <b>Упс!</b> У вас недостатньо повноважень!');
        return ctx.scene.leave();
      }

      switch (ctx.session.callbackdata) {
        case 'update:petition:active':
          this.scrapersService.handlePetitionScrape({ status: 'active' });
          await ctx.replyWithHTML(
            `👌 Добре, запущено оновлення переліку петицій! Це може зайняти деякий час!`
          );
          break;
        case 'update:petition:inprocess':
          this.scrapersService.handlePetitionScrape({ status: 'in_process' });
          await ctx.replyWithHTML(
            `👌 Добре, запущено оновлення переліку петицій! Це може зайняти деякий час!`
          );
          break;
        case 'update:petition:processed':
          this.scrapersService.handlePetitionScrape({ status: 'processed' });
          await ctx.replyWithHTML(
            `👌 Добре, запущено оновлення переліку петицій! Це може зайняти деякий час!`
          );
          break;
        default:
          await ctx.replyWithHTML('💢 <b>Упс!</b> Щось пішло не так!', {});
      }

      ctx.scene.leave();
    });

    this.telegramService.registerBotScene(scene);
  }

  private async handlerCommandStart(ctx: TContext) {
    const message = [
      `👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!`,
      '\n\n',
      '☝️ Громадяни можуть звернутися до Президента України з електронними петиціями через спеціальний розділ веб-сайту Офіційного інтернет-представництва Президента України.',
      '\n\n',
      '<i>💪 Я допоможу бути в курсі найважливіших громадських ініціатив та легко знаходити петиції, які відповідають Вашим інтересам та поглядам.</i>',
      '\n\n',
      '👉 Надішліть <b>/help</b> для перегляду списку команд'
    ];

    await ctx.replyWithHTML(message.join(''), {
      link_preview_options: { is_disabled: true },
      reply_markup: {
        resize_keyboard: true,
        keyboard: [[{ text: '⭐️ Обрані петиції' }], [{ text: '❓ Довідка' }, { text: '💸 Донат' }]]
      }
    });

    const { userID } = ctx.userInfo;

    const user = await this.userModel.findOne({ userID });

    if (user) {
      return await this.userModel.findByIdAndUpdate(user.id, { ...ctx.userInfo });
    } else {
      return await this.userModel.create({ ...ctx.userInfo });
    }
  }

  private async handlerCommandHelp(ctx: TContext) {
    const user = await this.userModel.findOne({ userID: ctx.userInfo.userID });

    const message = [
      `👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!`,
      '\n\n',
      '☝️ Я допоможу Вам бути в курсі найважливіших громадських ініціатив та легко знаходити петиції, які відповідають Вашим інтересам та поглядам. Ви можете керувати мною, надіславши наступні команди:',
      '\n\n',
      `${MAIN_COMMANDS.commands.map(item => `/${item.command} - ${item.description}`).join('\n')}\n\n`,
      `<b><i>${OPERATION_COMMANDS.description}</i></b>\n`,
      `${OPERATION_COMMANDS.commands.map(item => `/${item.command} - ${item.description}`).join('\n')}\n\n`
    ];

    if (user?.isAdmin) {
      message.push(`<b><i>${SYSTEM_COMMANDS.description}</i></b>\n`);
      message.push(
        `${SYSTEM_COMMANDS.commands.map(item => `/${item.command} - ${item.description}`).join('\n')}`
      );
    }

    await ctx.replyWithHTML(message.join(''), {
      link_preview_options: { is_disabled: true },
      reply_markup: {
        resize_keyboard: true,
        keyboard: [[{ text: '⭐️ Обрані петиції' }], [{ text: '❓ Довідка' }, { text: '💸 Донат' }]]
      }
    });
  }

  private async handlerCommandAbout(ctx: TContext) {
    const message = [
      '☝️ <b><i>єПетиція</i></b> - Цей бот призначений для автоматичного збирання та оновлення інформації про найактуальніші петиції, що подані на розгляд президенту. Він допомагає користувачам бути в курсі найважливіших громадських ініціатив та легко знаходити петиції, які відповідають їхнім інтересам та поглядам.',
      '\n\n',
      '👉 Надішліть <b>/help</b> для перегляду списку команд',
      '\n\n',
      `✌️ Created by <a href=\"${'https://t.me/baklai'}\">Dmitrii Baklai</a> © ${new Date().getFullYear()}.`
    ];

    await ctx.replyWithHTML(message.join(''), {
      link_preview_options: { is_disabled: true },
      reply_markup: {
        resize_keyboard: true,
        keyboard: [[{ text: '⭐️ Обрані петиції' }], [{ text: '❓ Довідка' }, { text: '💸 Донат' }]]
      }
    });
  }

  private async handlerCommandNotice(ctx: any) {
    return ctx.scene.enter('notice');
  }

  private async handlerCommandAdmin(ctx: any) {
    return ctx.scene.enter('admin');
  }

  private async handlerCommandUpdate(ctx: any) {
    return ctx.scene.enter('update');
  }

  private async handlerCommandQuit(ctx: TContext) {
    const message = [`👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!\n\n`];

    const user = await this.userModel.findOne({
      userID: ctx.userInfo.userID
    });

    if (!user) {
      message.push('‼️ Ви не підписані на мене!\n\n');
      message.push('⁉️ Якщо хочете підписатися відправте /start!\n');
      return await ctx.replyWithHTML(message.join(''), {});
    }

    message.push('👌🫣 Добре, давайте відпишу Вас.\n\n');
    message.push('<i>⁉️ Ви впевнені що хочете відписатися від мене?</i>\n\n');
    message.push('👇 Будь ласка, підтвердіть своє наміряння');

    await ctx.replyWithHTML(message.join(''), {
      link_preview_options: {
        is_disabled: true
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Так 💯 відписатися!',
              callback_data: 'quit:confirm:yes'
            },
            {
              text: 'Ні, не відписуватися!',
              callback_data: 'quit:confirm:cancel'
            }
          ]
        ]
      }
    });
  }

  private async handlerQuitConfirm(ctx: any) {
    const callbackData = ctx.callbackQuery.data;

    const message = [`👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!\n\n`];

    if (callbackData === 'quit:confirm:yes') {
      const user = await this.userModel.deleteOne({
        userID: ctx.userInfo.userID
      });

      if (!user) {
        message.push('‼️ Ви не підписані на мене!\n\n');
        message.push('⁉️ Відправте команду /start щоб підписатися!\n');
        return await ctx.replyWithHTML(message.join(''), {});
      }

      message.push('👌 Добре, ви відписані від боту!');

      return await ctx.replyWithHTML(message.join(''), {});
    } else {
      message.push(
        '👌 Добре, команда була скасована.\n\n',
        '<i>⁉️ Що я ще можу зробити для вас?</i>'
      );
      return await ctx.replyWithHTML(message.join(''), {});
    }
  }

  private async handlerCommandDonate(ctx: TContext) {
    const message = [
      `👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!`,
      '\n\n',
      '👌 Добре, якщо ви вирішили підтримати розвиток боту то не зупиняйтесь!',
      '\n\n',
      '<i>👉 Будь ласка, натисніть кнопку у повідомлені 👇</i>',
      '\n\n',
      '👉 Надішліть <b>/help</b> для перегляду списку команд',
      '\n\n',
      `✌️ Created by <a href=\"${'https://t.me/baklai'}\">Dmitrii Baklai</a> © ${new Date().getFullYear()}.`
    ];

    await ctx.replyWithHTML(message.join(''), {
      link_preview_options: { is_disabled: true },
      reply_markup: {
        inline_keyboard: [
          [{ text: '💸 ДОНАТ НА РОЗВИТОК', url: this.configService.get<string>('DONATE') }]
        ]
      }
    });
  }

  private async handlerCommandStatistic(ctx: TContext) {
    const usersCount = await this.userModel.countDocuments();

    const user = await this.userModel.findOne({ userID: ctx.userInfo.userID });

    const petitionsCount = await this.petitionModel.aggregate([
      {
        $group: {
          _id: '$tag',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1
        }
      }
    ]);

    const message = [
      `👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!`,
      '\n\n',
      '📊 <b>Статистика додатку:</b>\n\n',
      user?.isAdmin ? `ℹ️ <b>Кількість користувачів: ${usersCount}</b>\n\n` : '',
      `⭐️ <b>Обрані Петиції:</b> ${user?.petitions?.length || 0}`,
      '\n\n',
      `🔖 <b>Петиції за темами:</b>\n`,
      '\n',
      ...petitionsCount.map(
        (item: any) => `<i> 🔸 ${item.tag?.replaceAll('#', '')}: ${item.count}</i>\n`
      ),
      '\n\n',
      '👉 Надішліть <b>/help</b> для перегляду списку команд'
    ];

    await ctx.replyWithHTML(message.join(''), {
      link_preview_options: { is_disabled: true },
      reply_markup: {
        resize_keyboard: true,
        keyboard: [[{ text: '⭐️ Обрані петиції' }], [{ text: '❓ Довідка' }, { text: '💸 Донат' }]]
      }
    });
  }

  private async handlerCommandPetition(ctx: TContext) {
    const [petition] = await this.petitionModel.find({}).limit(1);

    const message = [];

    if (!petition) {
      message.push(`👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!\n\n`);
      message.push(
        '🗣 <b>Перелік петицій порожній!</b> Ми працюємо над тим щоб петиції стали доступними в найближчий час!\n\n'
      );
      message.push('👉 Надішліть <b>/help</b> для перегляду списку команд');

      return await ctx.replyWithHTML(message.join(''), {
        link_preview_options: { is_disabled: true },
        reply_markup: {
          resize_keyboard: true,
          keyboard: [
            [{ text: '⭐️ Обрані петиції' }],
            [{ text: '❓ Довідка' }, { text: '💸 Донат' }]
          ]
        }
      });
    }

    message.push(`📄 ${petition?.tag}\n\n`);
    message.push(`<b>${petition?.title}</b>\n\n`);
    message.push(`Номер петиції: <b>${petition?.number}</b>\n`);
    message.push(`Статус: <b>${petition?.status}</b>\n`);
    message.push(`Кількість голосів: <b>${petition?.counts}</b>\n`);
    message.push(`${petition?.date}\n\n`);

    message.push(`<i>Дата оновлення: ${dateTimeToStr(petition?.updatedAt)}</i>\n\n`);

    await ctx.replyWithHTML(message.join(''), {
      link_preview_options: { is_disabled: true },
      reply_markup: {
        inline_keyboard: [
          [{ text: '📜 Переглянути петицію', url: petition.link }],
          [{ text: '⭐️ Додати до обраного', callback_data: 'petition:set:selected' }],
          [
            { text: '<<', callback_data: 'petition:get:first' },
            { text: '<', callback_data: 'petition:get:prev' },
            { text: '1', callback_data: 'petition:get:current' },
            { text: '>', callback_data: 'petition:get:next' },
            { text: '>>', callback_data: 'petition:get:last' }
          ]
        ]
      }
    });
  }

  private async handlerSelectedPetition(ctx: any) {
    const user = await this.userModel.findOne({ userID: ctx.userInfo.userID });

    const message = [];

    if (!user) {
      message.push(`👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!\n\n`);
      message.push('🗣 <b>Ваш обліковий запис не знайдено!</b>\n\n');
      message.push('👉 Надішліть <b>/start</b> для продовження роботи з ботом!');

      return await ctx.replyWithHTML(message.join(''), {
        link_preview_options: { is_disabled: true },
        reply_markup: {
          resize_keyboard: true,
          keyboard: [
            [{ text: '⭐️ Обрані петиції' }],
            [{ text: '❓ Довідка' }, { text: '💸 Донат' }]
          ]
        }
      });
    }

    const petitions = await this.petitionModel.find({ number: { $in: user.petitions } });

    if (!petitions.length) {
      message.push(`👋👋👋 <b><i>${ctx.userInfo.firstName}</i>, мої вітання</b>!\n\n`);
      message.push('🗣 <b>Ваш перелік обраних петицій порожній!</b>\n\n');
      message.push('👉 Надішліть <b>/help</b> для перегляду списку команд');

      return await ctx.replyWithHTML(message.join(''), {
        link_preview_options: { is_disabled: true },
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Переглянути всі петиції', callback_data: 'get:petition:all' }]
          ]
        }
      });
    }

    message.push('🔖 <b>Ваш перелік петицій:</b>\n');

    petitions.forEach((petition: Record<string, any>) => {
      message.push(`\n🏷 <b>ПЕТИЦІЯ: ${petition.title.toUpperCase()}</b>\n`);
    });

    await ctx.replyWithHTML(message.join(''), {
      link_preview_options: { is_disabled: true },
      reply_markup: {
        resize_keyboard: true,
        keyboard: [[{ text: '⭐️ Обрані петиції' }], [{ text: '❓ Довідка' }, { text: '💸 Донат' }]]
      }
    });
  }
}
