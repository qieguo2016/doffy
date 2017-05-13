# doffy

[![CircleCI](https://img.shields.io/circleci/project/qieguo2016/doffy.svg)](https://github.com/qieguo2016/doffy) [![npm](https://img.shields.io/npm/dm/doffy.svg)](https://www.npmjs.com/package/doffy) [![GitHub stars](https://img.shields.io/github/stars/qieguo2016/doffy.svg)](https://github.com/qieguo2016/doffy/stargazers) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/qieguo2016/doffy/master/LICENSE)

> `Doffy` a headless browser automation library with easy-use API. 

Doffy provide a few simple methods to simulate user action like `goto` `click` `fill`, which are useful for `headless web testing` and `crawling`.

* [Feature](#feature)
* [QuickStart](#quickstart)
* [API](#api)
* [ChangeLog](#changelog)
* [Contribute](#contribute)


## Feature

- Base on chrome headless, use Chrome Devtools Protocol, while [Nightmare](https://github.com/segmentio/nightmare) base on [Electron](http://electron.atom.io/) and  [Casper](https://github.com/casperjs/casperjs) is base on [PhantomJS](https://github.com/ariya/phantomjs).
- All `Promise`, all API of Doffy return a `Promise`

## QuickStart

### install chrome headless

Mac: 
chrome headless is shipped on chrome-canary, install: [https://www.google.com/chrome/browser/canary.html](https://www.google.com/chrome/browser/canary.html)

Linux:
chrome headless is also shipped on chrome 59. so you can install chrome 59 to use headless mode.
```bash
# https://askubuntu.com/questions/79280/how-to-install-chrome-browser-properly-via-command-line
sudo apt-get install libxss1 libappindicator1 libindicator7
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome*.deb  # Might show "errors", fixed by next line
sudo apt-get install -f
```

### install doffy

```bash
# wait for npm publish
```

### page automation:

```js
import Doffy from '../src/doffy';
const doffy = new Doffy();

(async() => {
  await doffy.init();
  await doffy.goto('https://github.com/login');
  await doffy.screenshot('result/01-homepage.jpeg');
  await doffy.fill('#login_field', 'doffyjs');
  await doffy.fill('#password', 'doffy2017');
  await doffy.screenshot('result/02-fillaccount.jpeg');
  await doffy.click('[name="commit"]');
  await doffy.wait('.avatar');
  let isLogin = await doffy.visible('.avatar')
  isLogin && console.log('======== login success ========');
  await doffy.end(true);
})();
```

### run mocha test

```js
import Doffy from '../src/doffy';

const expect = require('chai').expect;
const doffy = new Doffy();

describe('test example', function() {

  before(async function() {
    try {
      await doffy.init();
      console.log('======== test begin ========');
    } catch(err) {
      console.error('error happen while init doffy', err);
    }
  });

  after(async function() {
    // runs after all tests in this block
    await doffy.end(true);
    console.log('====== test end ======');
  });

  it('open home page', async function() {
    await doffy.goto('https://www.baidu.com');
    let ret = await doffy.title();
    expect(ret.result.value).to.be.equal("百度一下，你就知道");
    await doffy.screenshot('temp/01.jpeg');
  });

  it('open signin dialog', async function() {
    await doffy.fill('#kw', 'github');
    await doffy.click('#su');
    let firstResult = await doffy.evaluate(() => {
      return document.querySelectorAll('.result h3')[0].innerText;
    });
    expect(firstResult).to.be.equal('GitHub · Build software better, together.官网');
    await doffy.screenshot('temp/02.jpeg');
  });

});
```

## API

see wiki page => [API doc]()

## ChangeLog

#### 2017.05.12
- New

## LICENSE

MIT

