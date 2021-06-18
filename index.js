const Discord = require('discord.js');
const { prefix } = require('./config.json');
const fetch = require('node-fetch');
const  googleIt = require('google-it')
require("dotenv").config();


const languages = {'python': 'python','javascript':'javascript','json':'json','c++':'cpp','c':'c',
    'html':'html','css':'css','swift':'swift','swiftui':'swift','c#':'cs','sql':'sql','php':'php','bash':'bash','dart':'dart','xml':'xml','java':'java','kotlin':'kotlin',
    'objective-c':'objectivec','perl':'perl','powershell':'powershell','r':'r','ruby':'ruby','sas':'sas','scss':'scss','typescript':'typescript',
                   //Extra spaces for other languages someone can add.
                   '':'','':'','':'','':'','':'','':'','':'','':'','':'','':'','':'',}

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 's') {
        await googleIt({'query': `stackoverflow ${args.join(" ")}`, 'limit': 1, 'no-display': true}).then( async results => {
            var id = results[0].link.match(/questions\/\d+/);
            if(id != undefined) {
                let answer = new StackOverflowAnswer(parseInt(id[0].substring(10)))
                await answer.performRequest()
                message.channel.send(answer.getEmbedMessage());
            } else {
                message.channel.send("Unable to find any results! \nAre you specific enough? \nQuestion ID not found!")
            }


        }).catch(e => {
            message.channel.send(e)
        })

    } else if(command === "help") {
      message.channel.send({embed: {
              color: 3447003,
              title: "Help",
              description: `Search for an answer: \`${prefix}s <query>\`\nFor example: \`${prefix}s python string to int\``,

              timestamp: new Date(),
              footer: {
                  icon_url: client.user.avatarURL,
                  text: `© ${client.user.tag}`
              }
          }
       })
    }
});

function removeAllTags(str) {
    return str.replace(/<p>/g, "").replace(/<\/p>/g, "").replace(/&gt;/g, ">").replace(/<pre>/g, "").replace(/<\/pre>/g, "").replace(/<code>/g, "").replace(/<\/code>/g, "").replace(/&quot;/g, "").replace(/<em>/g, "").replace(/<\/em>/g, "").replace(/<strong>/g, "").replace(/<\/strong>/g, "").replace(/<ol>/g, "").replace(/<\/ol>/g, "").replace(/<li>/g, "").replace(/<\/li>/g, "").replace(/&lt;/g, "")
}

function reformatAllTags(str, code_lang) {
    return str.replace(/<p>/g, "").replace(/<\/p>/g, "\n").replace(/&gt;/g, ">").replace(/<pre>/g, "").replace(/<\/pre>/g, "").replace(/<code>/g, "```" + code_lang + "\n").replace(/<\/code>/g, "```\n").replace(/&quot;/g, "\"").replace(/<em>/g, "*").replace(/<\/em>/g, "*").replace(/<strong>/g, "**").replace(/<\/strong>/g, "**").replace(/<ol>/g, "").replace(/<\/ol>/g, "").replace(/<li>/g, "").replace(/<\/li>/g, "").replace(/&lt;/g, "<")
}

class StackOverflowAnswer {
    constructor(questionID, message) {
        this.questionID = questionID;
        this.title = "";
        this.body = "";
        this.link = "";
        this.authorName = "";
        this.authorAvatarUrl = "";
        this.score = 0;
        this.code_lang = "";
        this.tags = [];
    }



    async performRequest() {
        let data = await fetch(`https://api.stackexchange.com/2.2/questions/${this.questionID}/answers?
        pagesize=1&order=desc&sort=activity&site=stackoverflow&filter=!LJbtD(0JKowo8ynwOYVlv5`)
            .then(response => response.json())

        var body = data['items'][0]['body']
        var atags = body.matchAll(/<a.+?((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?).+?>(.+?)<\/a>/g)
        atags = Array.from(atags);
        atags.forEach(atag => {
            body = body.replace(atag[0], `[${removeAllTags(atag[5])}](${atag[1]})`)
        })
      
      this.tags = data['items'][0]['tags']
      for(let tag of this.tags) {
        if(tag in languages) {
          this.code_lang = languages[tag];
          console.log(this.code_lang);
        }
      }

        body = reformatAllTags(body, this.code_lang)
        this.body = body
        this.title = data['items'][0]['title']
        this.link = data['items'][0]['link']
        
      
        this.authorName = data['items'][0]['owner']['display_name']
        this.authorAvatarUrl = data['items'][0]['owner']['profile_image']
        this.score = data['items'][0]['score']
    }

    getEmbedMessage() {
        return {embed: {
                color: 3447003,
                author: {
                    name: this.authorName,
                    icon_url: this.authorAvatarUrl
                },
                title: this.title,
                url: this.link,
                description: this.body.substring(0, 2040),
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: `© ${client.user.tag}`
                }
            }
        }
    }

}

async function searchStackOverflow(questionID) {
    let data = await fetch(`https://api.stackexchange.com/2.2/questions/${questionID}/answers?pagesize=1&order=desc&sort=activity&site=stackoverflow&filter=!LJbtD(0JKowo8ynwOYVlv5`).then(response => response.json())
    let body = data['items'][0]['body']
    let title = data['items'][0]['title']
    return data
}

client.login(process.env.token);
