// Simple test to verify bot token works
const https = require('https');

const BOT_TOKEN = '8479342226:AAE9P5O36OFkpx4wBuM50pCDmtnEeIUx0TY';

// First, get bot info
const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${BOT_TOKEN}/getMe`,
  method: 'GET'
};

console.log('Testing bot token...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.ok) {
      console.log('✓ Bot token is valid!');
      console.log('Bot info:', JSON.stringify(result.result, null, 2));

      // Now try to get updates to see if anyone has messaged the bot
      const updatesOptions = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${BOT_TOKEN}/getUpdates`,
        method: 'GET'
      };

      console.log('\nChecking for messages...');

      const updatesReq = https.request(updatesOptions, (updatesRes) => {
        let updatesData = '';

        updatesRes.on('data', (chunk) => {
          updatesData += chunk;
        });

        updatesRes.on('end', () => {
          const updatesResult = JSON.parse(updatesData);
          if (updatesResult.ok) {
            console.log('Recent updates:', JSON.stringify(updatesResult.result, null, 2));

            // If there are updates, try to send a message to the first chat
            if (updatesResult.result.length > 0) {
              const chatId = updatesResult.result[0].message?.chat?.id ||
                            updatesResult.result[0].my_chat_member?.chat?.id;

              if (chatId) {
                console.log(`\nSending test message to chat ${chatId}...`);

                const sendOptions = {
                  hostname: 'api.telegram.org',
                  port: 443,
                  path: `/bot${BOT_TOKEN}/sendMessage`,
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                };

                const sendReq = https.request(sendOptions, (sendRes) => {
                  let sendData = '';

                  sendRes.on('data', (chunk) => {
                    sendData += chunk;
                  });

                  sendRes.on('end', () => {
                    const sendResult = JSON.parse(sendData);
                    if (sendResult.ok) {
                      console.log('✓ Message sent successfully!');
                    } else {
                      console.log('✗ Failed to send message:', sendResult);
                    }
                  });
                });

                sendReq.on('error', (e) => {
                  console.error('Error sending message:', e);
                });

                sendReq.write(JSON.stringify({
                  chat_id: chatId,
                  text: '🤖 Test message from MIT Bot! The bot is working! ✓'
                }));
                sendReq.end();
              } else {
                console.log('\nNo chat ID found. Please send /start to the bot first.');
              }
            } else {
              console.log('\nNo messages found. Please send /start to @the_mit_bot on Telegram first!');
            }
          } else {
            console.log('✗ Failed to get updates:', updatesResult);
          }
        });
      });

      updatesReq.on('error', (e) => {
        console.error('Error getting updates:', e);
      });

      updatesReq.end();

    } else {
      console.log('✗ Bot token is invalid!');
      console.log('Error:', result);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();
