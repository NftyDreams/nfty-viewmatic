const express = require('express');
const app = express();
const { resolve } = require('path');
require('dotenv').config({ path: './.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27'
});
const sgMail = require('@sendgrid/mail');

app.use(express.static(process.env.STATIC_DIR));
app.use(express.urlencoded());
app.use(express.json())
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.get('/', (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});

app.post('/create-checkout-session', async (req, res) => {
  const domainURL = process.env.DOMAIN;
  const project = req.query.id.split('/')[0];
  const itemId = req.query.id.split('/')[1];
  let order = {
    project,
    itemId,
    product: 'This is the product',
    description: 'This is the description',
    imageUrl: 'https://files.stripe.com/files/MDB8YWNjdF8xRUozTWdIRWJwcEk2MHVJfGZfbGl2ZV95MzYzWW1qMUo1NmZiRlZxOXlONUFBZ3k00d463ThBo',
    price: 8000,
    quantity: 1
  }

  /*
  
        if (id) {
         
          const project = id.split('/')[0];
          const account = id.split('/')[1];
  
          fetch(`./${project}/${project}-exhibits.json`)
            .then((response) => response.json())
            .then((exhibits) => {
  
                  const exhibit = exhibits.find(e => e.account === account);
                  if (exhibit) {
                      location.replace('go.html', 'artwork.html');
                  }
            });
          }
  */


  // Create new Checkout Session for the order
  // Other optional params include:
  // For full details see https://stripe.com/docs/api/checkout/sessions/create
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: `${order.itemId}`,
    line_items: [{

      price_data: {
        currency: 'AED',
        product_data: {
          name: `${order.product}`,
          description: `${order.description}`,
          images: [`${order.imageUrl}`],
          metadata: {
            project: `${order.project}`
          }
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
    invoice_creation: {
      enabled: false,
      invoice_data: {
        description: `${order.description}`
      }
    },
    shipping_address_collection: {
      allowed_countries: [
        'AE', 'AT', 'AU', 'BE', 'BR', 'CA', 'CH', 'CL', 'CN', 'CZ', 'DE', 'DK', 'ES', 'FR', 'GB', 'IE', 'IN', 'IT', 'JP', 'KR', 'MX', 'NL', 'NO', 'NZ', 'PT', 'RU', 'SE', 'SG', 'TR', 'US'
      ]
    },
    success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domainURL}/canceled.html`
  });

  return res.redirect(303, session.url);
});



// Fetch the Checkout Session to display the JSON result on the success page
app.get('/checkout-session', async (req, res) => {
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
 
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {

    "from": {
      "email": "noreply@nftydreams.com",
      "name": "NftyDreams DAO"
    },
   "personalizations":[
      {
         "to":[
            {
               "email":session.customer_details.email
            }
         ],
         "dynamic_template_data":{
            "claim_link": "https://www.microsoft.com"
          }
      }
   ],
   "template_id": "d-49f987625a564f68a69442e57c0c68b2"
    
  }

  try {
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

/*
// Webhook handler for asynchronous events.
app.post('/webhook', async (req, res) => {
  let event;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let signature = req.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `.env`,
    // retrieve the event data directly from the request body.
    event = req.body;
  }

  if (event.type === 'checkout.session.completed') {
    console.log(`🔔  Payment received!`);

    // Note: If you need access to the line items, for instance to
    // automate fullfillment based on the the ID of the Price, you'll
    // need to refetch the Checkout Session here, and expand the line items:
    //
    // const session = await stripe.checkout.sessions.retrieve(
    //   'cs_test_KdjLtDPfAjT1gq374DMZ3rHmZ9OoSlGRhyz8yTypH76KpN4JXkQpD2G0',
    //   {
    //     expand: ['line_items'],
    //   }
    // );
    //
    // const lineItems = session.line_items;
  }

  res.sendStatus(200);
});
*/
app.listen(process.env.PORT, () => console.log(`Node server listening on port ${process.env.PORT}!`));

