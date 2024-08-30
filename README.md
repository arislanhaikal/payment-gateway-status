# Payment Gateway Status Checker

Payment Gateway Status Checker is a straightforward service designed to monitor the operational status of payment channels provided by the Xendit, Duitku, Midtrans gateway. Ideal for SaaS platforms utilizing Payment Gateway, this service ensures you can easily track and update users on the status of their available payment channels.

I don't know, is there have official API from payment gateway to check this. But I didn't find it. Correct me if I'm wrong.

## Features

- **Real-Time Monitoring:** Instantly check the status of all payment channels provided by Payment Gateway.
- **Targeted Queries:** Retrieve the status of specific payment channels by their ID.
- **Simple Status Codes:** Operational channels return a status code `200`; non-operational channels return `500`.

## Usage

### Check All Payment Channels

To check the status of all payment channels, simply access:

```
http://localhost:8787
```

### Check a Specific Payment Channel

To retrieve the status of a specific payment channel by ID:

```
http://localhost:8787/:id
```

Example `http://localhost:8787/core-api`

## Quick Start

### Installation

To install the necessary dependencies, run:

```bash
npm install
```

### Development

To start the development server on port 3000, use:

```bash
npm run dev
```

The service will run on port 8787 by default. Visit `http://localhost:8787` to view the service in action.

### Deployment

For deployment in a Cloudflare Worker:

```bash
npm run deploy
```

## Live Deployment

You can access our live deployment at [Payment Gateway Status Checker](https://pg.indeveloper.com) to monitor your payment channels in real-time.
