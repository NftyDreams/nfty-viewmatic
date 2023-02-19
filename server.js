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
    price: product.aed_price[exhibit.level] * 100,
    quantity: 1
  }
}

app.use(express.static(process.env.STATIC_DIR));
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

app.get('/', (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});

app.get('/api/launch-wallet', async (req, res) => {
  try {
    const email = req.query.e;
    if (email) {
      const res = await axios.post(
        'https://api.nftydreams.com/v1/public/user/request-otp',
        {
          'email': email
        },
        {
          'Content-Type': 'application/json',
          'api-key': 'GaqsJYxZjDVNMP9iPx83fRG2Tyzvzo@Hs8aR.PsB'
        }
      );
      console.log(res.data.json);
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
          currency: 'AED',
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
            "claim_link": "https://www.microsoft.com"
          }
        }
      ],
      "template_id": "d-49f987625a564f68a69442e57c0c68b2"

    }

    await sgMail.send(msg);
  } catch (error) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body)
    }
  }

  console.log(JSON.stringify(session, null, 2))
  res.send(session);
});

app.listen(process.env.PORT, () => console.log(`Node server listening on port ${process.env.PORT}!`));

module.exports = app