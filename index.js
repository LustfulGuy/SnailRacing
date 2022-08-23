// import local modules
import Config from './config.js';
import * as Util from './util.js';
import Snail from './snail.js';

// import npm or built-in modules
import GIFEncoder from 'gifencoder';
import { createCanvas, loadImage } from 'canvas';
import fs from 'node:fs';
import cron from 'node-cron';

// import discord.js client
import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, ] });

// constants start
const BACKGROUND = await loadImage(`images/snail_background.png`);
const BACKGROUND_WIDTH = 600;
const BACKGROUND_HEIGHT = 200;

const SNAIL_0_IMG_0 = await loadImage(`images/r_0.png`);
const SNAIL_0_IMG_1 = await loadImage(`images/r_1.png`);
const SNAIL_0_IMG_2 = await loadImage(`images/r_2.png`);
const SNAIL_0_MIN_SPEED = 0;
const SNAIL_0_MAX_SPEED = 20;
const SNAIL_0_DEATH_RATE = 20; // 0.2%
const SNAIL_0_MARGIN_TOP = -10;

const SNAIL_1_IMG_0 = await loadImage(`images/b_0.png`);
const SNAIL_1_IMG_1 = await loadImage(`images/b_1.png`);
const SNAIL_1_IMG_2 = await loadImage(`images/b_2.png`);
const SNAIL_1_MIN_SPEED = 5;
const SNAIL_1_MAX_SPEED = 15;
const SNAIL_1_DEATH_RATE = 0;
const SNAIL_1_MARGIN_TOP = 60;

const SNAIL_2_IMG_0 = await loadImage(`images/g_0.png`);
const SNAIL_2_IMG_1 = await loadImage(`images/g_1.png`);
const SNAIL_2_IMG_2 = await loadImage(`images/g_2.png`);
const SNAIL_2_MIN_SPEED = 10;
const SNAIL_2_MAX_SPEED = 10;
const SNAIL_2_DEATH_RATE = 0;
const SNAIL_2_MARGIN_TOP = 130;

const SNAIL_GAME_FINISH_DISTANCE = 510;
const SNAIL_GAME_FRAME_INTERVAL = 100; // milliseconds
// constants end

// construct Snail objects
const snail_0 = new Snail(SNAIL_0_MIN_SPEED, SNAIL_0_MAX_SPEED, SNAIL_0_DEATH_RATE, SNAIL_0_MARGIN_TOP, SNAIL_0_IMG_0, SNAIL_0_IMG_1, SNAIL_0_IMG_2);
const snail_1 = new Snail(SNAIL_1_MIN_SPEED, SNAIL_1_MAX_SPEED, SNAIL_1_DEATH_RATE, SNAIL_1_MARGIN_TOP, SNAIL_1_IMG_0, SNAIL_1_IMG_1, SNAIL_1_IMG_2);
const snail_2 = new Snail(SNAIL_2_MIN_SPEED, SNAIL_2_MAX_SPEED, SNAIL_2_DEATH_RATE, SNAIL_2_MARGIN_TOP, SNAIL_2_IMG_0, SNAIL_2_IMG_1, SNAIL_2_IMG_2);

// draw a single frame and add the frame to .gif encoder
const drawFrame = async (frame_cnt, encoder, ...snails) => {
  const canvas = createCanvas(BACKGROUND_WIDTH, BACKGROUND_HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(BACKGROUND, 0, 0, BACKGROUND_WIDTH, BACKGROUND_HEIGHT);
  for (const snail of snails)
    ctx.drawImage((snail.isDead ? snail.img_2 : ((frame_cnt & 1) ? snail.img_1 : snail.img_0)), snail.current, snail.margin_top, snail.width, snail.height);
  encoder.addFrame(ctx);
}

// data : { games_cnt : int, account_map : Map, bank_balance : int, sanil_0_wins_cnt : int, sanil_1_wins_cnt : int, sanil_2_wins_cnt : int, }
const { data } = Util.data;

// get config data
const { token, bet_channel_id } = Config;

const runSnailGame = async () => {
  // set 300s timeout so that the result is sent at **:*0
  setTimeout(() => {
    // TODO: send bet result to channel
    bet_channel.send({ files: [{ attachment: `results/${data.games_cnt}.gif`, name: `${data.games_cnt}.gif`}] });
  }, 300_000);


  data.games_cnt += 1;
  await Util.write();

  // make bet buttons attatched to the message
  const row = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                .setCustomId(`snail_0`)
                .setEmoji(`1009715800023765033`)
                .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                .setCustomId(`snail_1`)
                .setEmoji(`1009715796919996487`)
                .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                .setCustomId(`snail_2`)
                .setEmoji(`1009715798442524722`)
                .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                .setCustomId(`snail_info`)
                .setLabel(`달팽이 정보`)
                .setStyle(ButtonStyle.Secondary),
              );
  
  // announce in advance
  let str = ``;
  str += `5분 후에 제 ${data.games_cnt} 회 달팽이게임이 시작돼요\n`;
  str += `달팽이를 눌러서 베팅해보세요`;
  bet_channel.send({ content: str, components: [row] });
  
  // construct new .gif encoder and set up
  const encoder = new GIFEncoder(BACKGROUND_WIDTH, BACKGROUND_HEIGHT);
  const stream = encoder.createReadStream().pipe(fs.createWriteStream(`results/${data.games_cnt}.gif`));
  encoder.start();
  encoder.setRepeat(-1);
  encoder.setDelay(SNAIL_GAME_FRAME_INTERVAL);
  
  // init
  const snails = [snail_0, snail_1, snail_2, ];
  let frame_cnt = 0;
  // draw first frame (snails at start line)
  await drawFrame(frame_cnt, encoder, ...snails);
  // check if the game has ended
  let isEnd = false;

  // simulate until the game ends
  while (true) {
    for (const snail of snails) {
      if (snail.current > SNAIL_GAME_FINISH_DISTANCE && !(frame_cnt & 1)) {
        isEnd = true;
        snail.isWinner = true;
      }
    }

    if (isEnd)
      break;

    frame_cnt += 1;

    if (frame_cnt & 1) {
      for (const snail of snails) {
        if (!snail.isDead) {
          if (snail.isDeadNow) {
            snail.isDead = true;
            break;
          }

          snail.current += Util.random(snail.min_speed, snail.max_speed);
        }
      }
    }

    await drawFrame(frame_cnt, encoder, ...snails);
  }

  encoder.finish();
  await new Promise(r => stream.on(`finish`, r));
  
  // reset the properties of snails because the game has ended
  for (const snail of snails) {
    snail.current = 0;
    snail.isDead = false;
    snail.isWinner = false;
  }
}

client.once(`ready`, () => {
  console.log(`Bot Ready!`);
});

client.on(`messageCreate`, async message => {
  // ignore messages bot sent
  if (message.author.id === client.user.id)
    return;

  const command = message.content;
  const channel = message.channel;

  if (channel.id === bet_channel_id) {
    // TODO: make ! commands
  }
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // TODO: make bet modal / validate bet
      if (customId === 'snail_0') {

      } else if (customId === 'snail_1') {

      } else if (customId === 'snail_2') {

      } else if (customId === 'snail_info') {
        let str = ``;
        str += `<TODO: emoji id> 매 턴 ${SNAIL_0_MIN_SPEED}에서 ${SNAIL_0_MAX_SPEED}만큼 이동해요. 움직일 때마다 ${SNAIL_0_DEATH_RATE/100}%로 **객사**해요.\n`;
        str += `<TODO: emoji id> 매 턴 ${SNAIL_1_MIN_SPEED}에서 ${SNAIL_1_MAX_SPEED}만큼 이동해요.\n`;
        str += `<TODO: emoji id> 매 턴 ${SNAIL_2_MAX_SPEED}만큼 이동해요. 꾸준함의 대명사.`;
        interaction.reply({ content: str, });
      }
    }
  } catch (err) {
    console.error(err);
  }
});

// run the client
await client.login(token);
const bet_channel = await client.channels.fetch(bet_channel_id);

// run the game at **:*5
cron.schedule('5,15,25,35,45,55 * * * *', runSnailGame);