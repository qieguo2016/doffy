# doffy

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
const domain = 'https://www.baidu.com';

(async() => {
  await doffy.init();
  await doffy.goto(domain);
  await doffy.click('.signin-show');
  await doffy.click('.btn-email');
  await doffy.fill('.field .account', '@.com');
  await doffy.fill('.field .password', '123123');
  await doffy.click('div.sign-in-container > div.btn');
  await doffy.wait('.user-action img');
  await doffy.wait(1000);
  let isLogin = await doffy.visible('.user-action img')
  isLogin && console.log('======== login success ========');
  await doffy.screenshot('screenshot/auto.jpeg');
  await doffy.end(true);
})();
```

### run mocha test

```js
import Doffy from '../../src/doffy';

const expect = require('chai').expect;
const doffy = new Doffy();
const domain = 'https://www.baidu.com';

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
    await doffy.goto(domain);
    let ret = await doffy.title();
    expect(ret.result.value).to.be.equal(" - Top Video, GIFs, TV, News");
    await doffy.screenshot('screenshot/01.jpeg');
  });

  it('open signin dialog', async function() {
    await doffy.click('.signin-show');
    let ret = await doffy.exist('.modal-show .sign-in-container');
    expect(ret.result.value).to.be.equal(true);
    await doffy.screenshot('screenshot/02.jpeg');
  });

  it('fill account and password', async function() {
    await doffy.click('.btn-email');
    await doffy.fill('.field .account', '@.com');
    await doffy.fill('.field .password', '');
    await doffy.screenshot('screenshot/03.jpeg');
    let ret = await doffy.exist('.field .popover.right-tip-popover');
    expect(ret.result.value).to.be.equal(false);
  });

  it('signin', async function() {
    await doffy.click('div.sign-in-container > div.btn');
    await doffy.wait('.user-action img');
    await doffy.wait(1000);
    await doffy.screenshot('screenshot/04.jpeg');
    let ret = await doffy.visible('.user-action img')
    expect(ret.result.value).to.be.equal(true);
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

