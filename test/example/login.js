/**
 * @authors     : qieguo
 * @date        : 2017/5/3
 * @description :
 */

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
    expect(ret.result.value).to.be.equal("Baidu");
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
    await doffy.fill('.field .account', '123123@163.com');
    await doffy.fill('.field .password', '123123');
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

