require('dotenv/config')

const { Telegraf, Markup } = require('telegraf')
const { GoogleSpreadsheet } = require('google-spreadsheet')

const creds = require('./creds.json')

const doc = new GoogleSpreadsheet(process.env.GOOGLE_KEY);
const bot = new Telegraf(process.env.TELEGRAM_API_KEY)

// bot.use(Telegraf.log())

;(async function() {
  await doc.useServiceAccountAuth(creds);
})();

bot.command('operation',  async (ctx) => {
  return await ctx.reply('Select operation', Markup
    .keyboard([
      ['/load', '/amount'],
    ])
    .oneTime()
    .resize()
  )
})

bot.command('load', async (ctx) => {
  // TODO: Do some stuff with load
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]
    const rows = await sheet.getRows();

    ctx.reply(`Last transaction was ${rows[rows.length -1]['Salary per 2 weeks']}`)

  } catch (e) {
    console.log(e.message)
  }
})

bot.command('amount', async (ctx) => {
  try { await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]
    await sheet.loadCells('A1:I100');

    const amountValue = sheet.getCellByA1('G2').value
    ctx.reply(`${amountValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} грн`)
  } catch(e) {
    console.log(e.message)
  }
})

bot.on('text', async (ctx) => {
  try {
    const number = Number(ctx.message.text)
    if (!isNaN(number)) {
      const date = new Date()
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0]

      await sheet.addRow({'Date': date.toLocaleDateString(), 'Salary per 2 weeks': ctx.message.text})

      ctx.reply('Salary saved')
    } else {
      ctx.reply('Put correct number')
    }
  } catch (e) {
    console.log(e.message)
  }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
