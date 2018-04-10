const timeend = new Date('2018/04/03 20:00:00.000');

// https://tp.hd.mi.com/hdget/cn?jsonpcallback=cn2181200001&source=bigtap&product=2181200001&addcart=1&m=1&fk=&tsort=&storage=12&cstr1=0&cstr2=0&r=&b=&salt=&ans=&_=1522742367466
// https://tp.hd.mi.com/hdget/cn?jsonpcallback=cn2181200001&source=bigtap&product=2181200001&addcart=1&m=1&fk=&tsort=&storage=12&cstr1=0&cstr2=0&r=&b=&salt=1ce6adc14a466b46&ans=&_=1522742367630

function buyMiniAI(salt) {
  const id = '2181200001';
  const jsonp = `cn${id}`;

  $.ajax({
    type: 'GET',
    url: '//tp.hd.mi.com/hdget/cn',
    dataType: 'jsonp',
    jsonp: 'jsonpcallback',
    jsonpCallback: jsonp,
    crossDomain: true,
    data: {
      source: 'bigtap',
      product: id,
      addcart: 1,
      m: 1,
      storage: 12,
      cstr1: 0,
      cstr2: 0,
      salt: salt || ''
    },
    timeout: 5000,
    success: data => {
      const status = data.status;
      const product = status[id];

      if (product.hdurl) {
        console.log('抢中啦！！！');
        console.log(`token: ${product.hdurl}`);
        window.open('http://cart.mi.com/cart/add/' + id + '?source=bigtap&token=' + product.hdurl);
      } else if (product.hdstart == true && product.hdstop == false) {
        buyMiniAI(product.salt || '');
        console.log('有货，继续！！！');
      } else {
        console.log('无货，结束！！！');
      }
    },
    error: () => {
      buyMiniAI(salt);
    }
  });
}

function step() {
  const now = new Date();

  if (now - timeend >= 0) {
    buyMiniAI();
  } else {
    setTimeout(step, 0);
  }
}

step();
