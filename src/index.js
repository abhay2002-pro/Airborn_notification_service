const express = require("express");
const amqplib = require("amqplib");

const { ServerConfig } = require("./config");
const { EmailService } = require("./services")

async function connectQueue() {
  try {
    const connection = await amqplib.connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue("noti-queue");
    channel.consume("noti-queue", (data)=> {
      const object = JSON.parse(`${Buffer.from(data.content)}`);
      EmailService.sendEmail(ServerConfig.GMAIL_EMAIL, object.recepientEmail, object.subject, object.text)
      channel.ack(data);
    })
  } catch (error) {
    console.log(error);
  }
}

const apiRoutes = require("./routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);

app.listen(ServerConfig.PORT, async () => {
  console.log(`Sucessfully started the server on PORT : ${ServerConfig.PORT}`);
  await connectQueue();
});
