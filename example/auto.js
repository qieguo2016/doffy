/**
 * @authors     : qieguo
 * @date        : 2017/5/12
 * @description :
 */

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

