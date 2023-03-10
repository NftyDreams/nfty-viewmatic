const express = require('express');
const axios = require('axios');
const app = express();
const { resolve } = require('path');
const globals = require('./public/assets/js/globals.json');

require('dotenv').config({ path: './.env' });

const sgMail = require('@sendgrid/mail');

const reqHandler = async (req) => {
  const project = req.query.id.split('_')[0];
  const itemId = req.query.id.split('_')[1];
  const sku = req.query.id.split('_')[2];

  let product = globals.PRICE_DATA.find(f => f.sku === sku);

  const resp1 = await fetch(`${globals.AWS_BUCKET_URL}/${project}/${project}-exhibits.json`);
  const exhibits = await resp1.json();
  const exhibit = exhibits.find(e => e.account === itemId);

  return {
    project,
    itemId,
    sku,
    product: exhibit.title,
    description: product.title,
    imageUrl: `${globals.AWS_BUCKET_URL}${exhibit.originalUrl.replace('original', 'original/thumb').replace('.png', '.jpg')}`,
    price: product.usd_price[exhibit.level] * 100,
    quantity: 1
  }
}

app.use(express.static(process.env.STATIC_DIR));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

// app.get('/', (req, res) => {
//   const path = resolve(process.env.STATIC_DIR + '/index.html');
//   res.sendFile(path);
// });

app.get('/api/launch-wallet', async (req, res) => {
  try {
    const email = req.query.e;
    const testMode = req.query.mode === 'test' ? true : false;

    if (email) {
      const resp = await axios.post(
        `https://${testMode === true ? 'dev-' : ''}api.nftydreams.com/v1/public/user/request-otp`,
        {
          'email': email
        },
        {
          'headers': {
            'Content-Type': 'application/json',
            'api-key': 'GaqsJYxZjDVNMP9iPx83fRG2Tyzvzo@Hs8aR.PsB'
          }
        }
      );
      if (resp.data.success === true) {
        res.redirect(`https://wallet.nftydreams.com/verify?email=${email}`);
      }
    }
  } catch (error) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body)
    }
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const stripe = require('stripe')(
      req.query.mode === 'test' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_LIVE_KEY,
      {
        apiVersion: '2020-08-27'
      });

    const domainURL = `${req.protocol}://${req.headers.host}`;
    const order = await reqHandler(req);

    // Create new Checkout Session for the order
    // Other optional params include:
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: order.itemId,
      line_items: [{

        price_data: {
          currency: 'USD',
          product_data: {
            name: `${order.product}`,
            description: `${order.description}`,
            images: [`${order.imageUrl}`]
          },
          unit_amount: order.price
        },
        quantity: order.quantity,
      }],
      custom_text: {
        shipping_address: {
          message: 'Print fulfillment by Gelato.com'
        }
      },
      metadata: {
        sku: order.sku,
        project: order.project,
        itemId: order.itemId
      },
      invoice_creation: {
        enabled: false,
        invoice_data: {
          description: order.description
        }
      },
      shipping_address_collection: {
        allowed_countries: [
          'AE', 'AT', 'AU', 'BE', 'BR', 'CA', 'CH', 'CL', 'CN', 'CZ', 'DE', 'DK', 'ES', 'FR', 'GB', 'IE', 'IN', 'IT', 'JP', 'KR', 'MX', 'NL', 'NO', 'NZ', 'PT', 'RU', 'SE', 'SG', 'TR', 'US'
        ]
      },
      success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}&id=${req.query.id}${req.query.mode === 'test' ? '&mode=test' : ''}`,
      cancel_url: `${domainURL}/art.html?id=${order.project}/${order.itemId}${req.query.mode === 'test' ? '&mode=test' : ''}`
    });

    return res.redirect(303, session.url);
  } catch (error) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body)
    }
  }
});



app.get('/api/checkout-session', async (req, res) => {
  try {

    const stripe = require('stripe')(
      req.query.mode === 'test' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_LIVE_KEY,
      {
        apiVersion: '2020-08-27'
      });
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {

      "from": {
        "email": "noreply@nftydreams.com",
        "name": "NftyDreams DAO"
      },
      "personalizations": [
        {
          "to": [
            {
              "email": session.customer_details.email
            }
          ],
          "dynamic_template_data": {
            "image_url": `${globals.AWS_BUCKET_URL}/${session.metadata.project}/original/thumb/${session.metadata.itemId}.jpg`,
            "claim_link": `https://gallery.nftydreams.com/api/launch-wallet?e=${session.customer_details.email}${req.query.mode === 'test' ? '&mode=test' : ''}`
          }
        }
      ],
      "template_id": "d-49f987625a564f68a69442e57c0c68b2"

    }

    await sgMail.send(msg);

    console.log(JSON.stringify(session, null, 2))
    res.send(session);

  } catch (error) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body)
    }
  }
});


app.post('/stripe-webhook', async (req, res) => {

  const event = req.body;

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {

        "from": {
          "email": "noreply@nftydreams.com",
          "name": "NftyDreams DAO"
        },
        "personalizations": [
          {
            "to": [
              {
                "email": "support@nftydreams.com"
              }
            ]
          }
        ],
        "subject": "New Order " + event.data.object.id,
        content: [
          {
            type: 'text/plain',
            value: JSON.stringify(event.data, null, 2)
          }
        ]

      }

      await sgMail.send(msg);

      break;
    case 'payment_method.attached':
      // const paymentMethod = event.data.object;
      // console.log('PaymentMethod was attached to a Customer!');
      break;
    // ... handle other event types
    default:
    // console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });

});

app.listen(process.env.PORT, () => console.log(`Node server listening on port ${process.env.PORT}!`));

module.exports = app