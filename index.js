const config = require('./config')

const fs = require('node:fs')

const { Client, GatewayIntentBits, ActivityType } = require('discord.js')
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ]
})

client.on('ready', () => {
    console.log(`${client.user.username} Logged in!!`)
    client.user.setPresence({
        activities: [{ name: `${config.status}`, type: ActivityType.Listening }],
        status: 'idle',
    })
})

client.on('messageCreate', async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!config.owners.includes(message.author.id)) return;
    if (!message.content.startsWith(config.prefix)) return;
    let args = message.content.slice(config.prefix.length).split(/ +/g)
    cmd = args[0]
    if (!cmd) return;
    args = args.slice(1)

    if (['store'].includes(cmd.toLowerCase())) {
        let productName = args[0]
        if (!productName) return message.channel.send({
            embeds: [{
                description: `Usage: **${config.prefix}store <product_name> <product>(Add space is wanna store multiple)**`
            }]
        })

        const directory = fs.readdirSync('./stock')
        if (!directory.includes(`${productName.toLowerCase()}.json`)) {
            await fs.appendFile(`./stock/${productName.toLowerCase()}.json`, '[]', function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
        }

        let products = args
        if (!products[1]) return message.channel.send({
            embeds: [{
                description: `Nothing was provided to store.`
            }]
        })

        const file = fs.readFile(`./stock/${productName.toLowerCase()}.json`, function (err, data) {
            let alreadyData = JSON.parse(data)
            products = products.slice(1)
            const newData = []
            for (const pt of alreadyData) {
                newData.push(`${pt}`)
            }
            for (const pdt of products) {
                newData.push(`${pdt}`)
            }

            fs.writeFile(`./stock/${productName.toLowerCase()}.json`, JSON.stringify(newData), function (err) {
                if (err) throw err;
                console.log('Saved!');
                message.channel.send({
                    embeds: [{
                        description: `Your stock is now saved.`
                    }]
                })
            });
        });

    } else if (['stock'].includes(cmd.toLowerCase())) {
        const directory = fs.readdirSync('./stock')
        if (directory.length === 0) return message.channel.send({
            embeds: [{
                description: `You dont have any stock stored.`
            }]
        })

        const products = []
        for (const pdct of directory) {
            products.push(`${pdct.split(`.json`)[0].toUpperCase()}`)
        }

        message.channel.send({
            embeds: [{
                title: `Products stored`,
                description: `**${products.join(`\n`)}**`
            }]
        })

    } else if (['gen'].includes(cmd.toLowerCase())) {
        const product = args[0]
        if (!product) return message.channel.send({
            embeds: [{
                description: `Usage: ${config.prefix}gen <product> <amount> <member>`
            }]
        })

        const directory = fs.readdirSync('./stock')
        if (directory.length === 0) return message.channel.send({
            embeds: [{
                description: `You dont have any stock stored.`
            }]
        })

        if (!directory.includes(`${product.toLowerCase()}.json`)) return message.channel.send({
            embeds: [{
                description: `Specified product is not stored.`
            }]
        })

        const amount = args[1]
        if (!amount) return message.channel.send({
            embeds: [{
                description: `No amount of products was mentioned.`
            }]
        })

        if (isNaN(amount) === true) return message.channel.send({
            embeds: [{
                description: `Specified amount is not a number.`
            }]
        })

        fs.readFile(`./stock/${product.toLowerCase()}.json`, async function (err, data) {
            let stock = JSON.parse(data)
            if (stock.length < amount) return message.channel.send({
                embeds: [{
                    description: `Theres not enough stock in our database.`
                }]
            })

            const member = message.mentions.members.first()
            if (!member) return message.channel.send({
                embeds: [{
                    description: `Not a valid member was specified.`
                }]
            })

            const remove = stock.length - amount
            const dtt = stock.slice(remove)

            for (const valv of dtt) {
                const index = stock.indexOf(valv)
                stock.splice(index)
            }

            fs.writeFile(`./stock/${product.toLowerCase()}.json`, JSON.stringify(stock), async function (err) {
                if (err) throw err;
                console.log('Saved!');

                await member.send({ content: dtt.join('\n'), embeds: [{ description: `Please vouch us at our vouch server mentioning the product and price` }] })
                message.channel.send({
                    embeds: [{
                        description: `Code sent to user in his dms`
                    }]
                })
            });

        });



    } else return;

})

client.login(process.env['TOKEN'])