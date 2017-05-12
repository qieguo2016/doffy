/**
 * @authors     : qieguo
 * @date        : 2017/5/3
 * @description :
 */

import Doffy from '../src/doffy';

const expect = require('chai').expect;
const doffy = new Doffy();

describe('test doffy', function() {

  it('init', async function() {
    let ret = await doffy.init();
    expect(ret.client).to.be.a('object');
  });

});

