/**
 * @authors     : qieguo
 * @date        : 2017/5/3
 * @description :
 */

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

