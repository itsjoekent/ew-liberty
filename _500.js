module.exports = `
<!DOCTYPE>
<html lang="en">
  <head>
    <title>On my way to fix the internet</title>

    <meta charset="UTF-8">
    <meta content="text/html; charset=UTF-8" name="Content-Type" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta name="title" content="On my way to fix the internet">
    <meta name="description" content="We're experiencing some errors and we'll be back shortly.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://cdn.elizabethwarren.com/_public/images/default-meta.png">

    <link rel="apple-touch-icon" sizes="180x180" href="https://cdn.elizabethwarren.com/_public/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://cdn.elizabethwarren.com/_public/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://cdn.elizabethwarren.com/_public/favicon-16x16.png">

    <style>
      /*
      Copyright (C) Hoefler & Co.
      This software is the property of Hoefler & Co. (H&Co).
      Your right to access and use this software is subject to the
      applicable License Agreement, or Terms of Service, that exists
      between you and H&Co. If no such agreement exists, you may not
      access or use this software for any purpose.
      This software may only be hosted at the locations specified in
      the applicable License Agreement or Terms of Service, and only
      for the purposes expressly set forth therein. You may not copy,
      modify, convert, create derivative works from or distribute this
      software in any way, or make it accessible to any third party,
      without first obtaining the written permission of H&Co.
      For more information, please visit us at http://typography.com.
      */

      @font-face {
        font-family: 'Ringside Regular A';
        src: url('https://cdn.elizabethwarren.com/_public/fonts/RingsideRegular-Book_Web.woff2') format('woff2'), url('https://cdn.elizabethwarren.com/_public/fonts/RingsideRegular-Book_Web.woff') format('woff');
        font-weight: 400;
        font-style: normal;
      }

      @font-face {
        font-family: 'Ringside Regular A';
        src: url('https://cdn.elizabethwarren.com/_public/fonts/RingsideRegular-Bold_Web.woff2') format('woff2'), url('https://cdn.elizabethwarren.com/_public/fonts/RingsideRegular-Bold_Web.woff') format('woff');
        font-weight: 700;
        font-style: normal;
      }

      @font-face {
        font-family: 'Ringside Compressed A';
        src: url('https://cdn.elizabethwarren.com/_public/fonts/RingsideCompressed-Bold_Web.woff2') format('woff2'), url('https://cdn.elizabethwarren.com/_public/fonts/RingsideCompressed-Bold_Web.woff') format('woff');
        font-weight: 700;
        font-style: normal;
      }

      :root {
        --navy: #232444;
        --white: #FFFFFF;
        --liberty: #B7E4CF;
      }

      /* CSS Reset */
      /* --------- */

      html {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      *, *::before, *::after {
        box-sizing: border-box;
      }

      body,
      h1,
      h2,
      a {
        margin: 0;
        padding: 0;
      }

      body {
        height: 100vh;
        scroll-behavior: smooth;
        text-rendering: optimizeSpeed;
        background-color: var(--navy);
      }

      .logo {
        display: block;
        font-size: 0px;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        height: 29px;
        width: 92px;
        background-image: url(https://cdn.elizabethwarren.com/_public/images/warren-logo--white.svg);
        margin-top: 24px;
        margin-bottom: 72px;
        margin-left: auto;
        margin-right: auto;
      }

      h1, h2 {
        color: var(--white);
        text-align: center;
      }

      h1 {
        font-family: "Ringside Compressed A", "Ringside Compressed B";
        font-style: normal;
        font-weight: 700;
        font-size: 42px;
        line-height: 1;
        text-transform: uppercase;
        margin-bottom: 12px;
      }

      h2 {
        font-family: "Ringside Regular A", "Ringside Regular B";
        font-style: normal;
        font-weight: 400;
        font-size: 18px;
        line-height: 1.3;
        margin-bottom: 24px;
      }

      .button {
        display: block;
        width: fit-content;
        color: var(--navy);
        background-color: var(--liberty);
        border: 4px solid var(--liberty);
        font-family: "Ringside Compressed A", "Ringside Compressed B";
        font-style: normal;
        font-weight: 700;
        font-size: 32px;
        line-height: 1.3;
        text-decoration: none;
        text-transform: uppercase;
        text-align: center;
        margin-left: auto;
        margin-right: auto;
        padding: 4px 14px 8px;
      }

      .button:hover {
        background-color: transparent;
        color: var(--white);
        border: 4px solid var(--white);
      }

      img {
        display: block;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 36px;
      }

      main {
        padding-left: 24px;
        padding-right: 24px;
      }

      @media screen and (min-width: 1024px) {
        h1 {
          font-size: 72px;
        }

        h2 {
          font-size: 26px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="logo"></div>
      <h1>On my way to fix the internet</h1>
      <h2>We're experiencing some errors and we'll be back shortly.</h2>
      <img src="https://cdn.elizabethwarren.com/_public/images/500_save_internet.gif" />
      <a class="button" href="http://secure.elizabethwarren.com/">Donate</a>
    </main>
  </body>
</html>
`;
