const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
// let addressAll = require('./addressApi.json');
let addressAll = require('./addressApi.json');
const axios = require('axios')

// const token = process.env.TOKEN;
const token = "6741769933:AAHei9C1ZZLGcqk_XERT0g4eHXxEw4xpQGg";

const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
  {
    command: '/start', description: 'Ishni boshlash'
  }
])

let currentAddress;
let qishloqlar;
let address;

let currentPage = 1;
let pageLimit = 12;
let addressLength;

// const api = process.env.ADDRESS_API;
const api = "https://649e7b4c245f077f3e9c6e50.mockapi.io/images";

async function page(arg = [], page, limit) {
  let arr2 = [...arg]
  let address = arr2.splice((page * limit),limit)

  let currentPost = address || []

  let link;

  if (page === 0) {
    link = [
      {
        text: '⏩',
        callback_data: 'right'
      }
    ]
  } else if (page === Math.ceil(addressLength / limit) - 1) {
    link = [
      {
        text: '⏪',
        callback_data: 'left'
      }
    ]
  } else {
    link = [
      {
        text: '⏪',
        callback_data: 'left'
      },
      {
        text: '⏩',
        callback_data: 'right'
      }
    ]
  }

  currentPost.push(link)

  return currentPost
}

async function getApi() {
  try {
    let res = await axios.get(api)
    
    addressAll = res?.data
    addressLength = addressAll.length
    return addressAll
  } catch (err) {
    // console.log(err);
  }
}
getApi()
.then(res => {
  currentAddress = page(res, currentPage - 1, pageLimit)
  currentAddress.then(res => {
    qishloqlar = dubbleArray(res);
    address = res
  })
})

let mainMsg = `O'z mahallangizni tanlang! 😊`;

// currentIndex / currentPage

function dubbleArray(arg = []) {
  return arg.map((item,i) => {
    if (arg.length - 1 > i) {
      return [
        item
      ]
    } else {
      return item
    }
  })
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (messageText === '/start') {
    currentPage = 1;
    const keyboard = {
      inline_keyboard: qishloqlar
    };

    const options = {
      reply_markup: JSON.stringify(keyboard)
    };

    bot.sendMessage(chatId, mainMsg, options);
  } else {
    // Handle other messages here.
  }
});

let prevPage = 1;
let prevData = 0;

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  let newKeyboard;

  // console.log("data: ", data);

  if (data === 'right' || data === 'left') {
    if (data === 'right') {
      let page = currentPage + 1
      // console.log("currentPage: ", currentPage);
      currentPage = page <= Math.ceil(addressLength / pageLimit) ? page : currentPage
      // console.log("currentPage: ", currentPage);
      // console.log("ceil: ", page <= Math.ceil(addressLength / pageLimit));
    } else {
      let page = currentPage - 1
      currentPage = page >= 1 ? page : 1
    }

    address = await page(addressAll, currentPage - 1, pageLimit)

    newKeyboard = {
      inline_keyboard: dubbleArray(address)
    };
  } else if (data === "back") {
    newKeyboard = {
      inline_keyboard: dubbleArray(address)
    };
  } else {

    newKeyboard = {
      inline_keyboard: [
        [
          {
            text: 'Orqaga', 
            callback_data: "back"
          }
        ]
      ]
    };
  }

  let options = {
    reply_markup: JSON.stringify(newKeyboard)
  };

  if (data === 'right' || data === 'left') {
    if (prevPage !== currentPage) {
      bot.editMessageText(mainMsg, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        reply_markup: options.reply_markup
      });
    }
  } else if (data === 'back') {
    if (prevData !== data) {
      bot.editMessageText(mainMsg, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        reply_markup: options.reply_markup
      });
    }
    prevData = data
  }
  else {
    if (data !== prevData) {

      let res = binarySearch(addressAll, +data)
      console.log("res: ", res);

      let msg = `${res?.text} mahallasining telegram kanali: \n\n Kanalga o'tish!\n(${res?.link})`
      // let msg = ""
      bot.editMessageText(msg, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        reply_markup: options.reply_markup
      });
    }
    prevData = data
  }

  prevPage = currentPage
});

function binarySearch(arg = [], num) {
  let start = 0,
  end = arg.length;

  let result = null;

  if (start < end) {
      function alg() {
          let half = Math.round((start + end)/2)
          
          let item = arg[half-1]

          if (item?.id != num) {
            if (num > item?.id) {
              start = half + 1
              
              alg()
            }else{
              end = half - 1

              alg()
            }
          }
          else{
              result = item
          }
      }
      alg()
  }else {
      result = "Number undifined"
  }
  return result
}